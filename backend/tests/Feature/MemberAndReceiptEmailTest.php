<?php

namespace Tests\Feature;

use App\Mail\MemberCardMail;
use App\Mail\MembershipDocumentsMail;
use App\Mail\PaymentReceiptMail;
use App\Models\MembershipPlan;
use App\Models\MemberProfile;
use App\Models\Payment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MemberAndReceiptEmailTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        $this->adminUser = User::factory()->create([
            'status' => 'active',
        ]);
        $ownerRole = Role::firstOrCreate(['name' => 'owner']);
        $this->adminUser->roles()->attach($ownerRole->id);
    }

    public function test_member_registration_automatically_sends_card_email(): void
    {
        Mail::fake();

        $payload = [
            'name' => 'Abebe Bikila',
            'email' => 'abebe.bikila@example.com',
            'phone' => '+251911998877',
            'gender' => 'male',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/members', $payload);

        $response->assertStatus(201);

        Mail::assertSent(MemberCardMail::class, function (MemberCardMail $mail) {
            return $mail->hasTo('abebe.bikila@example.com')
                && $mail->user->name === 'Abebe Bikila'
                && ! empty($mail->qrCodeDataUri);
        });
    }

    public function test_payment_creation_automatically_sends_receipt_email(): void
    {
        Mail::fake();

        $member = User::factory()->create([
            'email' => 'member.test@example.com',
            'status' => 'active',
        ]);
        $memberRole = Role::firstOrCreate(['name' => 'member']);
        $member->roles()->attach($memberRole->id);

        MemberProfile::create([
            'user_id' => $member->id,
            'member_code' => 'TG-9999',
            'qr_code_token' => 'TIGAT-TESTTOKEN9999',
            'joined_at' => now(),
        ]);

        $plan = MembershipPlan::first() ?? MembershipPlan::create([
            'name' => 'Standard Monthly Plan',
            'duration_months' => 1,
            'price' => 1500,
            'is_active' => true,
        ]);

        $payload = [
            'user_id' => $member->id,
            'amount' => 1500,
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'membership_plan_id' => $plan->id,
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/payments', $payload);

        $response->assertStatus(201);

        Mail::assertSent(MembershipDocumentsMail::class, function (MembershipDocumentsMail $mail) {
            return $mail->hasTo('member.test@example.com')
                && (float) $mail->payment->amount == 1500;
        });
    }

    public function test_manual_resend_member_card_email_endpoint(): void
    {
        Mail::fake();

        $member = User::factory()->create([
            'email' => 'resend.member@example.com',
            'status' => 'active',
        ]);
        $memberRole = Role::firstOrCreate(['name' => 'member']);
        $member->roles()->attach($memberRole->id);

        $profile = MemberProfile::create([
            'user_id' => $member->id,
            'member_code' => 'TG-8888',
            'qr_code_token' => 'TIGAT-TESTTOKEN8888',
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/members/{$profile->id}/send-card-email");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        Mail::assertSent(MemberCardMail::class, function (MemberCardMail $mail) {
            return $mail->hasTo('resend.member@example.com');
        });
    }

    public function test_manual_resend_payment_receipt_email_endpoint(): void
    {
        Mail::fake();

        $member = User::factory()->create([
            'email' => 'receipt.resend@example.com',
            'status' => 'active',
        ]);
        $memberRole = Role::firstOrCreate(['name' => 'member']);
        $member->roles()->attach($memberRole->id);

        MemberProfile::create([
            'user_id' => $member->id,
            'member_code' => 'TG-7777',
            'qr_code_token' => 'TIGAT-TESTTOKEN7777',
            'joined_at' => now(),
        ]);

        $payment = Payment::create([
            'payment_number' => 'PAY-TEST-001',
            'receipt_number' => 'RCT-TEST-001',
            'user_id' => $member->id,
            'amount' => 2500,
            'currency' => 'ETB',
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'paid_at' => now(),
            'recorded_by' => $this->adminUser->id,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/payments/{$payment->id}/send-receipt-email");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        Mail::assertSent(PaymentReceiptMail::class, function (PaymentReceiptMail $mail) {
            return $mail->hasTo('receipt.resend@example.com')
                && $mail->payment->receipt_number === 'RCT-TEST-001';
        });
    }
}
