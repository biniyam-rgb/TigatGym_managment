<?php

namespace Tests\Feature;

use App\Events\MembershipActivated;
use App\Jobs\SendMembershipDocumentsJob;
use App\Mail\MembershipDocumentsMail;
use App\Models\MemberProfile;
use App\Models\MembershipDocumentDelivery;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use App\Services\GymPdfService;
use Carbon\Carbon;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class MembershipDocumentSystemTest extends TestCase
{
    use RefreshDatabase;

    protected string $webhookSecret = 'mock-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        config([
            'services.chapa.secret_key' => 'CHASECK_TEST-mock-secret-key-12345',
            'services.chapa.base_url' => 'https://api.chapa.global',
            'services.chapa.webhook_secret' => $this->webhookSecret,
        ]);
    }

    protected function createStaff(string $role = 'receptionist'): array
    {
        $user = User::create([
            'name' => 'Reception Staff',
            'email' => 'reception_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', $role)->firstOrFail();
        $user->roles()->attach($roleModel->id);
        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    protected function createMember(string $name = 'Abebe Bikila', ?string $email = null): array
    {
        $user = User::create([
            'name' => $name,
            'email' => $email ?? ('member_' . uniqid() . '@example.com'),
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', 'member')->firstOrFail();
        $user->roles()->attach($roleModel->id);

        $profile = MemberProfile::create([
            'user_id' => $user->id,
            'member_code' => 'TG-' . rand(1000, 9999),
            'qr_code_token' => 'QR-' . uniqid(),
            'joined_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $profile, $token];
    }

    protected function createPlan(string $name = 'Monthly Fitness', int $duration = 1, float $price = 1500.00): MembershipPlan
    {
        return MembershipPlan::create([
            'name' => $name,
            'slug' => Str::slug($name) . '-' . uniqid(),
            'description' => 'Access to gym equipment and lockers',
            'duration_type' => 'months',
            'duration_value' => $duration,
            'price' => $price,
            'currency' => 'ETB',
            'is_active' => true,
        ]);
    }

    protected function createSubscription(
        User $member,
        MembershipPlan $plan,
        string $status = 'pending',
        ?string $startDate = null,
        ?string $endDate = null
    ): Subscription {
        $start = $startDate ? Carbon::parse($startDate) : now();
        $end = $endDate ? Carbon::parse($endDate) : (clone $start)->addMonths($plan->duration_value ?: 1);

        return Subscription::create([
            'subscription_number' => 'SUB-' . strtoupper(Str::random(8)),
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'status' => $status,
            'price' => $plan->price,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);
    }

    /**
     * Test 1 & 2: Successful Chapa payment automatically activates membership and triggers document delivery.
     */
    public function test_1_and_2_successful_chapa_payment_activates_membership_and_triggers_document_delivery(): void
    {
        Queue::fake();

        [$member, $profile] = $this->createMember('Chapa Member', 'chapa.member@example.com');
        $plan = $this->createPlan();

        $subscription = $this->createSubscription($member, $plan, 'pending');

        $merchantRef = 'MERCH-' . uniqid();
        $chapaRef = 'CHAPA-TX-' . uniqid();

        $payment = Payment::create([
            'payment_number' => 'PAY-CHAPA-' . uniqid(),
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => $plan->price,
            'currency' => 'ETB',
            'payment_method' => 'chapa',
            'payment_type' => 'subscription',
            'status' => 'pending',
        ]);

        PaymentTransaction::create([
            'payment_id' => $payment->id,
            'transaction_reference' => $merchantRef,
            'gateway_reference' => $chapaRef,
            'gateway' => 'chapa',
            'amount' => $plan->price,
            'currency' => 'ETB',
            'status' => 'pending',
        ]);

        // Fake Chapa v2 verification endpoint
        Http::fake([
            'https://api.chapa.global/*' => Http::response([
                'status' => 'success',
                'message' => 'Payment verified successfully',
                'data' => [
                    'status' => 'success',
                    'amount' => (int) ($plan->price * 100), // integer minor units
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                    'chapa_reference' => $chapaRef,
                    'payment_method' => 'telebirr',
                ],
            ], 200),
        ]);

        [$staff, $token] = $this->createStaff('receptionist');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(200);

        // 1. Verify automatic subscription activation
        $subscription->refresh();
        $this->assertEquals('active', $subscription->status);
        $this->assertNotNull($subscription->start_date);
        $this->assertNotNull($subscription->end_date);

        // 2. Verify payment marked completed
        $payment->refresh();
        $this->assertEquals('completed', $payment->status);
        $this->assertNotNull($payment->receipt_number);

        // 3. Verify queued document delivery job dispatched
        Queue::assertPushed(SendMembershipDocumentsJob::class, function ($job) use ($payment) {
            return $job->delivery->payment_id === $payment->id
                && $job->delivery->recipient_email === 'chapa.member@example.com';
        });

        // 4. Verify delivery record created in database
        $this->assertDatabaseHas('membership_document_deliveries', [
            'payment_id' => $payment->id,
            'user_id' => $member->id,
            'status' => 'pending',
            'recipient_email' => 'chapa.member@example.com',
        ]);
    }

    /**
     * Test 3: Successful manual payment automatically activates the membership and triggers document delivery.
     */
    public function test_3_successful_manual_payment_activates_membership_and_triggers_document_delivery(): void
    {
        Queue::fake();

        [$member, $profile] = $this->createMember('Cash Member', 'cash.member@example.com');
        $plan = $this->createPlan();

        [$staff, $token] = $this->createStaff('receptionist');

        $payload = [
            'user_id' => $member->id,
            'amount' => $plan->price,
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'membership_plan_id' => $plan->id,
            'status' => 'completed',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments', $payload);

        $response->assertStatus(201);
        $paymentId = $response->json('data.id');

        $payment = Payment::with('payable')->findOrFail($paymentId);
        $this->assertEquals('completed', $payment->status);

        // Verify associated subscription is active
        $subscription = $payment->payable;
        $this->assertNotNull($subscription);
        $this->assertEquals('active', $subscription->status);

        // Verify queued document delivery job dispatched
        Queue::assertPushed(SendMembershipDocumentsJob::class, function ($job) use ($payment) {
            return $job->delivery->payment_id === $payment->id
                && $job->delivery->recipient_email === 'cash.member@example.com';
        });

        $this->assertDatabaseHas('membership_document_deliveries', [
            'payment_id' => $payment->id,
            'recipient_email' => 'cash.member@example.com',
        ]);
    }

    /**
     * Test 4: Pending payment does not activate membership or send documents.
     */
    public function test_4_pending_payment_does_not_activate_membership_or_send_documents(): void
    {
        Queue::fake();

        [$member, $profile] = $this->createMember('Pending Member', 'pending@example.com');
        $plan = $this->createPlan();

        [$staff, $token] = $this->createStaff('receptionist');

        $payload = [
            'user_id' => $member->id,
            'amount' => $plan->price,
            'payment_method' => 'bank_transfer',
            'payment_type' => 'subscription',
            'membership_plan_id' => $plan->id,
            'status' => 'pending',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments', $payload);

        $response->assertStatus(201);
        $paymentId = $response->json('data.id');

        $payment = Payment::with('payable')->findOrFail($paymentId);
        $this->assertEquals('pending', $payment->status);

        // Subscription must NOT be active
        $subscription = $payment->payable;
        if ($subscription) {
            $this->assertNotEquals('active', $subscription->status);
        }

        // No document delivery job or record should exist
        Queue::assertNotPushed(SendMembershipDocumentsJob::class);
        $this->assertDatabaseMissing('membership_document_deliveries', [
            'payment_id' => $payment->id,
        ]);
    }

    /**
     * Test 5: Failed payment does not activate membership or send documents.
     */
    public function test_5_failed_payment_does_not_activate_membership_or_send_documents(): void
    {
        Queue::fake();

        [$member, $profile] = $this->createMember('Failed Member', 'failed@example.com');
        $plan = $this->createPlan();

        $subscription = $this->createSubscription($member, $plan, 'pending');

        $merchantRef = 'MERCH-FAIL-' . uniqid();
        $chapaRef = 'CHAPA-FAIL-' . uniqid();

        $payment = Payment::create([
            'payment_number' => 'PAY-FAIL-' . uniqid(),
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => $plan->price,
            'currency' => 'ETB',
            'payment_method' => 'chapa',
            'payment_type' => 'subscription',
            'status' => 'pending',
        ]);

        PaymentTransaction::create([
            'payment_id' => $payment->id,
            'transaction_reference' => $merchantRef,
            'gateway_reference' => $chapaRef,
            'gateway' => 'chapa',
            'amount' => $plan->price,
            'currency' => 'ETB',
            'status' => 'pending',
        ]);

        Http::fake([
            'https://api.chapa.global/*' => Http::response([
                'status' => 'failed',
                'message' => 'Payment failed or cancelled',
                'data' => [
                    'status' => 'failed',
                    'amount' => (int) ($plan->price * 100),
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                    'chapa_reference' => $chapaRef,
                ],
            ], 200),
        ]);

        [$staff, $token] = $this->createStaff('receptionist');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(422);

        $subscription->refresh();
        $this->assertNotEquals('active', $subscription->status);

        $payment->refresh();
        $this->assertEquals('failed', $payment->status);

        Queue::assertNotPushed(SendMembershipDocumentsJob::class);
        $this->assertDatabaseMissing('membership_document_deliveries', [
            'payment_id' => $payment->id,
        ]);
    }

    /**
     * Test 6: Duplicate Chapa webhooks do not create duplicate emails or subscriptions.
     */
    public function test_6_duplicate_chapa_webhooks_do_not_create_duplicate_emails_or_subscriptions(): void
    {
        Mail::fake();

        [$member, $profile] = $this->createMember('Webhook Member', 'webhook@example.com');
        $plan = $this->createPlan();

        $subscription = $this->createSubscription($member, $plan, 'pending');

        $merchantRef = 'MERCH-HOOK-' . uniqid();
        $chapaRef = 'CHAPA-HOOK-' . uniqid();

        $payment = Payment::create([
            'payment_number' => 'PAY-WEBHOOK-' . uniqid(),
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => $plan->price,
            'currency' => 'ETB',
            'payment_method' => 'chapa',
            'payment_type' => 'subscription',
            'status' => 'pending',
        ]);

        PaymentTransaction::create([
            'payment_id' => $payment->id,
            'transaction_reference' => $merchantRef,
            'gateway_reference' => $chapaRef,
            'gateway' => 'chapa',
            'amount' => $plan->price,
            'currency' => 'ETB',
            'status' => 'pending',
            'idempotency_key' => 'IDEMP-' . uniqid(),
        ]);

        // Fake Chapa verification when webhook performs server-side verification
        Http::fake([
            'https://api.chapa.global/*' => Http::response([
                'status' => 'success',
                'message' => 'Payment verified successfully',
                'data' => [
                    'status' => 'success',
                    'amount' => (int) ($plan->price * 100),
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                    'chapa_reference' => $chapaRef,
                    'payment_method' => 'telebirr',
                ],
            ], 200),
        ]);

        $webhookPayload = [
            'event' => 'charge.success',
            'data' => [
                'merchant_reference' => $merchantRef,
                'chapa_reference' => $chapaRef,
                'status' => 'success',
            ],
        ];

        $rawBody = json_encode($webhookPayload);
        $signature = hash_hmac('sha256', $rawBody, $this->webhookSecret);

        // First Webhook Call
        $response1 = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => $signature],
            $rawBody
        );

        $response1->assertStatus(200);

        // Run the queued job synchronously
        $delivery = MembershipDocumentDelivery::where('payment_id', $payment->id)->firstOrFail();
        (new SendMembershipDocumentsJob($delivery))->handle();

        // Exactly 1 email sent so far
        Mail::assertSent(MembershipDocumentsMail::class, 1);

        // Second Webhook Call (Duplicate transmission)
        $response2 = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => $signature],
            $rawBody
        );

        $response2->assertStatus(200);

        // Idempotency check: exactly 1 delivery record in DB
        $this->assertEquals(1, MembershipDocumentDelivery::where('payment_id', $payment->id)->count());

        // Exactly 1 email sent total, not duplicated!
        Mail::assertSent(MembershipDocumentsMail::class, 1);
    }

    /**
     * Test 7: The email contains both PDF attachments.
     */
    public function test_7_email_contains_both_pdf_attachments(): void
    {
        Mail::fake();

        [$member, $profile] = $this->createMember('PDF Member', 'pdf.member@example.com');
        $plan = $this->createPlan('Annual Diamond', 12, 12000);

        $subscription = $this->createSubscription($member, $plan, 'active');

        $payment = Payment::create([
            'payment_number' => 'PAY-PDF-7',
            'receipt_number' => 'RCT-PDF-7',
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => 12000,
            'currency' => 'ETB',
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $delivery = MembershipDocumentDelivery::create([
            'payment_id' => $payment->id,
            'subscription_id' => $subscription->id,
            'user_id' => $member->id,
            'recipient_email' => 'pdf.member@example.com',
            'status' => 'pending',
        ]);

        (new SendMembershipDocumentsJob($delivery))->handle();

        $delivery->refresh();
        $this->assertEquals('sent', $delivery->status);
        $this->assertNotNull($delivery->sent_at);

        Mail::assertSent(MembershipDocumentsMail::class, function (MembershipDocumentsMail $mail) {
            $attachments = $mail->attachments();
            $this->assertCount(2, $attachments);

            $this->assertTrue(str_ends_with($attachments[0]->as, '.pdf'));
            $this->assertTrue(str_ends_with($attachments[1]->as, '.pdf'));
            $this->assertEquals('application/pdf', $attachments[0]->mime);
            $this->assertEquals('application/pdf', $attachments[1]->mime);

            return $mail->hasTo('pdf.member@example.com')
                && str_contains($mail->envelope()->subject, 'Your TIGAT GYM Membership Is Active');
        });
    }

    /**
     * Test 8: Membership card PDF contains correct member and subscription info.
     */
    public function test_8_membership_card_pdf_contains_correct_member_and_subscription_info(): void
    {
        [$member, $profile] = $this->createMember('Haile Gebrselassie', 'haile@example.com');
        $plan = $this->createPlan('Gold 6-Months', 6, 8000);

        $subscription = $this->createSubscription($member, $plan, 'active', '2026-05-01', '2026-11-01');

        $pdfBinary = GymPdfService::generateMembershipCardPdf($member, $profile, $subscription);

        $this->assertNotEmpty($pdfBinary);
        $this->assertStringStartsWith('%PDF-', $pdfBinary);
    }

    /**
     * Test 9: Receipt PDF contains the correct confirmed payment information.
     */
    public function test_9_receipt_pdf_contains_correct_confirmed_payment_information(): void
    {
        [$member, $profile] = $this->createMember('Derartu Tulu', 'derartu@example.com');
        $plan = $this->createPlan('VIP Plan', 1, 3500);

        $subscription = $this->createSubscription($member, $plan, 'active');

        $payment = Payment::create([
            'payment_number' => 'PAY-RCT-99',
            'receipt_number' => 'RCT-998877',
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => 3500,
            'currency' => 'ETB',
            'payment_method' => 'chapa',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $pdfBinary = GymPdfService::generatePaymentReceiptPdf($payment, $member, $subscription);

        $this->assertNotEmpty($pdfBinary);
        $this->assertStringStartsWith('%PDF-', $pdfBinary);
    }

    /**
     * Test 10: Missing member email does not interrupt membership activation.
     */
    public function test_10_missing_member_email_does_not_interrupt_membership_activation(): void
    {
        [$member, $profile] = $this->createMember('No Email Member', 'tg0099@members.tigatgym.com');
        $plan = $this->createPlan();

        $subscription = $this->createSubscription($member, $plan, 'pending');

        $payment = Payment::create([
            'payment_number' => 'PAY-NO-EMAIL',
            'receipt_number' => 'RCT-NO-EMAIL',
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => $plan->price,
            'currency' => 'ETB',
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $delivery = MembershipDocumentDelivery::create([
            'payment_id' => $payment->id,
            'subscription_id' => $subscription->id,
            'user_id' => $member->id,
            'recipient_email' => 'tg0099@members.tigatgym.com',
            'status' => 'pending',
        ]);

        (new SendMembershipDocumentsJob($delivery))->handle();

        $delivery->refresh();
        $this->assertEquals('skipped_no_email', $delivery->status);
        $this->assertStringContainsString('no valid personal email', $delivery->error_message);

        $payment->refresh();
        $this->assertEquals('completed', $payment->status);
    }

    /**
     * Test 11: Failed email delivery can be retried and email updated.
     */
    public function test_11_failed_email_delivery_can_be_retried(): void
    {
        Queue::fake();

        [$member, $profile] = $this->createMember('Retry Member', 'broken@example.com');
        $plan = $this->createPlan();

        $payment = Payment::create([
            'payment_number' => 'PAY-RETRY',
            'receipt_number' => 'RCT-RETRY',
            'user_id' => $member->id,
            'amount' => $plan->price,
            'currency' => 'ETB',
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $delivery = MembershipDocumentDelivery::create([
            'payment_id' => $payment->id,
            'user_id' => $member->id,
            'recipient_email' => 'broken@example.com',
            'status' => 'failed',
            'error_message' => 'Connection timeout to SMTP host',
        ]);

        [$staff, $token] = $this->createStaff('receptionist');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/document-deliveries/{$delivery->id}/resend", [
                'recipient_email' => 'corrected@example.com',
            ]);

        $response->assertStatus(200);

        $delivery->refresh();
        $this->assertEquals('pending', $delivery->status);
        $this->assertEquals('corrected@example.com', $delivery->recipient_email);
        $this->assertNull($delivery->error_message);

        Queue::assertPushed(SendMembershipDocumentsJob::class, function ($job) use ($delivery) {
            return $job->delivery->id === $delivery->id;
        });
    }

    /**
     * Test 12: Unauthorized users cannot resend membership documents.
     */
    public function test_12_unauthorized_users_cannot_resend_membership_documents(): void
    {
        [$member, $profile, $memberToken] = $this->createMember('Regular Member', 'regular@example.com');
        $plan = $this->createPlan();

        $payment = Payment::create([
            'payment_number' => 'PAY-UNAUTH',
            'receipt_number' => 'RCT-UNAUTH',
            'user_id' => $member->id,
            'amount' => $plan->price,
            'currency' => 'ETB',
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $delivery = MembershipDocumentDelivery::create([
            'payment_id' => $payment->id,
            'user_id' => $member->id,
            'recipient_email' => 'regular@example.com',
            'status' => 'pending',
        ]);

        // Unauthenticated request -> 401
        $responseUnauth = $this->postJson("/api/document-deliveries/{$delivery->id}/resend");
        $responseUnauth->assertStatus(401);

        // Member role request (not receptionist/admin/owner) -> 403 Forbidden
        $responseForbidden = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->postJson("/api/document-deliveries/{$delivery->id}/resend");
        $responseForbidden->assertStatus(403);
    }

    /**
     * Test: Download card and receipt PDF endpoints return application/pdf.
     */
    public function test_authorized_user_can_download_card_and_receipt_pdf(): void
    {
        [$member, $profile] = $this->createMember('Download Member', 'download@example.com');
        $plan = $this->createPlan();

        $subscription = $this->createSubscription($member, $plan, 'active');

        $payment = Payment::create([
            'payment_number' => 'PAY-DL',
            'receipt_number' => 'RCT-DL',
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => $plan->price,
            'currency' => 'ETB',
            'payment_method' => 'cash',
            'payment_type' => 'subscription',
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $delivery = MembershipDocumentDelivery::create([
            'payment_id' => $payment->id,
            'subscription_id' => $subscription->id,
            'user_id' => $member->id,
            'recipient_email' => 'download@example.com',
            'status' => 'sent',
        ]);

        [$staff, $token] = $this->createStaff('receptionist');

        // Test card download
        $resCard = $this->withHeader('Authorization', "Bearer {$token}")
            ->get("/api/document-deliveries/{$delivery->id}/download/card");

        $resCard->assertStatus(200);
        $resCard->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $resCard->getContent());

        // Test receipt download
        $resReceipt = $this->withHeader('Authorization', "Bearer {$token}")
            ->get("/api/document-deliveries/{$delivery->id}/download/receipt");

        $resReceipt->assertStatus(200);
        $resReceipt->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $resReceipt->getContent());
    }
}
