<?php

namespace Tests\Feature;

use App\Models\MemberProfile;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChapaMembershipActivationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        config([
            'services.chapa.secret_key' => 'CHASECK_TEST-mock-secret-key-12345',
            'services.chapa.base_url' => 'https://api.chapa.global',
            'services.chapa.webhook_secret' => 'mock-webhook-secret',
        ]);
    }

    protected function createStaff(string $role = 'receptionist'): array
    {
        $user = User::create([
            'name' => 'Staff Member',
            'email' => 'staff_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', $role)->firstOrFail();
        $user->roles()->attach($roleModel->id);
        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    protected function createMember(string $name = 'Selamawit Kebede'): array
    {
        $user = User::create([
            'name' => $name,
            'email' => 'member_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'inactive',
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', 'member')->firstOrFail();
        $user->roles()->attach($roleModel->id);

        $profile = MemberProfile::create([
            'user_id' => $user->id,
            'member_code' => 'TG-' . rand(1000, 9999),
            'qr_code_token' => '',
            'joined_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token, $profile];
    }

    protected function createScenario(float $price, string $durationType = 'month', int $durationValue = 1): array
    {
        [$member, $memberToken, $profile] = $this->createMember();

        $plan = MembershipPlan::create([
            'name' => 'Plan ' . uniqid(),
            'slug' => 'plan-' . uniqid(),
            'price' => $price,
            'currency' => 'ETB',
            'duration_type' => $durationType,
            'duration_value' => $durationValue,
            'is_active' => true,
        ]);

        $subscription = Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-' . uniqid(),
            'start_date' => now()->toDateString(),
            'end_date' => $plan->calculateEndDate(now())->toDateString(),
            'status' => 'pending',
            'price' => $price,
            'discount' => 0.00,
            'total_amount' => $price,
            'currency' => 'ETB',
        ]);

        $merchantRef = 'TG-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -6));
        $chapaRef = 'CHAPA-' . uniqid();

        $payment = Payment::create([
            'payment_number' => 'PAY-' . uniqid(),
            'receipt_number' => 'RCT-' . uniqid(),
            'user_id' => $member->id,
            'payable_type' => Subscription::class,
            'payable_id' => $subscription->id,
            'amount' => $price,
            'currency' => 'ETB',
            'payment_method' => 'chapa',
            'payment_type' => 'subscription',
            'status' => 'pending',
        ]);

        $transaction = PaymentTransaction::create([
            'payment_id' => $payment->id,
            'transaction_reference' => $merchantRef,
            'gateway' => 'chapa',
            'gateway_reference' => $chapaRef,
            'amount' => $price,
            'currency' => 'ETB',
            'status' => 'pending',
            'idempotency_key' => 'IDEMP-' . uniqid(),
        ]);

        return [$member, $memberToken, $plan, $subscription, $payment, $transaction, $merchantRef, $chapaRef];
    }

    public function test_confirmed_payment_activates_pending_subscription_and_sets_correct_dates(): void
    {
        [, $staffToken] = $this->createStaff();
        [$member, , $plan, $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createScenario(1500.00, 'month', 1);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment verified successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'status' => 'SUCCESS',
                    'payment_method' => 'telebirr',
                ],
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'status' => 'completed',
                    'subscription_status' => 'active',
                    'is_paid' => true,
                ],
            ]);

        // Subscription is now active!
        $subscription->refresh();
        $this->assertSame('active', $subscription->status);
        $this->assertSame(now()->toDateString(), $subscription->start_date->toDateString());
        $this->assertSame($plan->calculateEndDate(now())->toDateString(), $subscription->end_date->toDateString());

        // Member is active and has QR code pass
        $member->refresh();
        $this->assertSame('active', $member->status);
        $this->assertNotEmpty($member->memberProfile->qr_code_token);
    }

    public function test_activation_sets_dates_according_to_plan_duration_logic(): void
    {
        [, $staffToken] = $this->createStaff();
        // 3 month quarterly plan
        [$member, , $plan, $subscription, , , $merchantRef, $chapaRef] = $this->createScenario(4500.00, 'month', 3);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => 450000,
                    'currency' => 'ETB',
                    'status' => 'SUCCESS',
                ],
            ], 200),
        ]);

        $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $subscription->refresh();
        $this->assertSame('active', $subscription->status);

        $expectedEnd = now()->copy()->addMonths(3)->subDay()->toDateString();
        $this->assertSame($expectedEnd, $subscription->end_date->toDateString());
    }

    public function test_activation_is_idempotent_and_does_not_mutate_active_subscription(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , $subscription, , , $merchantRef, $chapaRef] = $this->createScenario(1500.00, 'month', 1);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'status' => 'SUCCESS',
                ],
            ], 200),
        ]);

        // 1st verification activates subscription
        $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', ['merchant_reference' => $merchantRef]);

        $subscription->refresh();
        $firstStartDate = $subscription->start_date->toDateString();
        $firstEndDate = $subscription->end_date->toDateString();

        // 2nd verification (idempotent call)
        $res2 = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', ['merchant_reference' => $merchantRef]);

        $res2->assertStatus(200);

        $subscription->refresh();
        $this->assertSame('active', $subscription->status);
        $this->assertSame($firstStartDate, $subscription->start_date->toDateString());
        $this->assertSame($firstEndDate, $subscription->end_date->toDateString());
    }

    public function test_failed_or_pending_payments_never_activate_subscription(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , $subscription, , , $merchantRef, $chapaRef] = $this->createScenario(1500.00, 'month', 1);

        // Gateway returns failed
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'status' => 'FAILED',
                ],
            ], 200),
        ]);

        $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', ['merchant_reference' => $merchantRef]);

        // Subscription must NOT be activated!
        $subscription->refresh();
        $this->assertSame('pending', $subscription->status);
    }

    public function test_manual_cash_payment_still_activates_pending_subscription(): void
    {
        [, $staffToken] = $this->createStaff();
        [$member, , $plan, $subscription] = $this->createScenario(1500.00, 'month', 1);

        // Record manual cash payment
        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments', [
                'user_id' => $member->id,
                'subscription_id' => $subscription->id,
                'amount' => 1500.00,
                'payment_method' => 'cash',
                'payment_type' => 'subscription',
                'status' => 'completed',
            ]);

        $response->assertStatus(201);

        // Cash payment activates the linked pending subscription
        $subscription->refresh();
        $this->assertSame('active', $subscription->status);
    }
}
