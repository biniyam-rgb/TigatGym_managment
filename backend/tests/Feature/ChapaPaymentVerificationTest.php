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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChapaPaymentVerificationTest extends TestCase
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

    protected function createMember(string $name = 'Abebe Bikila'): array
    {
        $user = User::create([
            'name' => $name,
            'email' => 'member_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', 'member')->firstOrFail();
        $user->roles()->attach($roleModel->id);

        MemberProfile::create([
            'user_id' => $user->id,
            'member_code' => 'TG-' . rand(1000, 9999),
            'qr_code_token' => 'QR-' . uniqid(),
            'joined_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    protected function createPendingPaymentScenario(float $price = 1500.00): array
    {
        [$member, $memberToken] = $this->createMember('Selamawit Kebede');

        $plan = MembershipPlan::create([
            'name' => 'Standard Monthly',
            'slug' => 'standard-monthly-' . uniqid(),
            'price' => $price,
            'currency' => 'ETB',
            'duration_type' => 'month',
            'duration_value' => 1,
            'is_active' => true,
        ]);

        $subscription = Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-' . uniqid(),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'pending', // Strictly pending!
            'price' => $price,
            'discount' => 0.00,
            'total_amount' => $price,
            'currency' => 'ETB',
        ]);

        $merchantRef = 'TG-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -6));
        $chapaRef = 'CHAPA-TOKEN-' . uniqid();

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

    public function test_successful_verification_updates_payment_and_transaction_consistently(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment verified successfully',
                'data' => [
                    'status' => 'success',
                    'amount' => 150000, // 1500.00 ETB in minor units
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                    'payment_method' => 'telebirr',
                ],
            ], 200),
        ]);

        // Receptionist verifies using GymCore's merchant_reference
        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'merchant_reference' => $merchantRef,
                    'gateway_reference' => $chapaRef,
                    'status' => 'completed',
                    'is_paid' => true,
                    'amount' => 1500.00,
                    'currency' => 'ETB',
                ],
            ]);

        // Check Payment is marked completed with paid_at timestamp
        $payment->refresh();
        $this->assertSame('completed', $payment->status);
        $this->assertNotNull($payment->paid_at);

        // Check PaymentTransaction is marked successful with verified_at timestamp
        $transaction->refresh();
        $this->assertSame('successful', $transaction->status);
        $this->assertNotNull($transaction->verified_at);
        $this->assertNotNull($transaction->gateway_response);

        // Phase 3: Subscription is activated upon verified successful payment
        $subscription->refresh();
        $this->assertSame('active', $subscription->status);

        // Verify Chapa verify API was called with Chapa's gateway reference, not merchant reference
        Http::assertSent(function ($request) use ($chapaRef) {
            return $request->url() === "https://api.chapa.global/v2/payments/{$chapaRef}/verify";
        });
    }

    public function test_verification_rejects_amount_mismatch(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , , $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Gateway returns 1000 ETB (100000 minor units) instead of expected 1500 ETB
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'status' => 'success',
                    'amount' => 100000, // 1000.00 ETB
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                ],
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsString('amount mismatch', strtolower($response->json('message')));

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $transaction->refresh();
        $this->assertSame('failed', $transaction->status);
    }

    public function test_verification_rejects_currency_mismatch(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , , $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Gateway returns USD instead of ETB
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'status' => 'success',
                    'amount' => 150000,
                    'currency' => 'USD',
                    'merchant_reference' => $merchantRef,
                ],
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsString('currency mismatch', strtolower($response->json('message')));

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $transaction->refresh();
        $this->assertSame('failed', $transaction->status);
    }

    public function test_verification_returns_404_for_invalid_merchant_reference(): void
    {
        [, $staffToken] = $this->createStaff();

        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => 'TG-NONEXISTENT-REF',
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Payment transaction not found for merchant reference: TG-NONEXISTENT-REF',
            ]);
    }

    public function test_verification_handles_pending_gateway_status(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'status' => 'pending',
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                ],
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'pending',
                'data' => [
                    'is_paid' => false,
                    'status' => 'pending',
                ],
            ]);

        $payment->refresh();
        $this->assertSame('pending', $payment->status);

        $subscription->refresh();
        $this->assertSame('pending', $subscription->status);
    }

    public function test_verification_handles_failed_and_cancelled_gateway_status(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'status' => 'failed',
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                ],
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'failed',
                'data' => [
                    'is_paid' => false,
                    'status' => 'failed',
                ],
            ]);

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $subscription->refresh();
        $this->assertSame('pending', $subscription->status);
    }

    public function test_repeated_verification_is_idempotent_and_does_not_mutate_completed_payment(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , , $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'status' => 'success',
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                ],
            ], 200),
        ]);

        // 1st verification
        $res1 = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $res1->assertStatus(200);

        $payment->refresh();
        $firstPaidAt = $payment->paid_at->toIso8601String();

        $transaction->refresh();
        $firstVerifiedAt = $transaction->verified_at->toIso8601String();

        // 2nd verification: exact same merchant_reference
        $res2 = $this->withHeader('Authorization', "Bearer {$staffToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $res2->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'already_completed' => true,
                    'status' => 'completed',
                ],
            ]);

        $payment->refresh();
        $this->assertSame($firstPaidAt, $payment->paid_at->toIso8601String());

        $transaction->refresh();
        $this->assertSame($firstVerifiedAt, $transaction->verified_at->toIso8601String());

        // Only 1 external HTTP request made to Chapa
        Http::assertSentCount(1);
    }

    public function test_unauthorized_member_cannot_verify_another_members_payment(): void
    {
        [, $memberAToken, , , , , $merchantRef] = $this->createPendingPaymentScenario(1500.00);
        [, $memberBToken] = $this->createMember('Dawit Kebede');

        // Member B tries to verify Member A's payment
        $response = $this->withHeader('Authorization', "Bearer {$memberBToken}")
            ->postJson('/api/payments/chapa/verify', [
                'merchant_reference' => $merchantRef,
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'status' => 'error',
                'message' => 'You are not authorized to verify this payment transaction.',
            ]);
    }

    public function test_member_can_verify_their_own_payment_via_get_route(): void
    {
        [, $memberToken, , , , , $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'data' => [
                    'status' => 'success',
                    'amount' => 150000,
                    'currency' => 'ETB',
                    'merchant_reference' => $merchantRef,
                ],
            ], 200),
        ]);

        // Member verifies their own payment via GET /api/payments/chapa/verify/{reference}
        $response = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->getJson("/api/payments/chapa/verify/{$merchantRef}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'merchant_reference' => $merchantRef,
                    'is_paid' => true,
                    'status' => 'completed',
                ],
            ]);
    }

    /**
     * Requirement 5: Test using the exact documented Chapa v2 verification response structure.
     *
     * Validates:
     * 1. amount read from data.amount (integer cents)
     * 2. gateway reference read from data.chapa_reference
     * 3. merchant reference read from data.merchant_reference
     * 4. gateway status read from data.status (SUCCESS => completed)
     */
    public function test_verification_with_exact_documented_chapa_v2_response_structure(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Exact documented Chapa v2 Hosted Checkout verification payload
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => 150000, // 1500.00 ETB in integer cents
                    'currency' => 'ETB',
                    'status' => 'SUCCESS', // Uppercase SUCCESS as returned by Chapa v2
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
                'message' => 'Payment verified successfully.',
                'data' => [
                    'merchant_reference' => $merchantRef,
                    'gateway_reference' => $chapaRef,
                    'payment_id' => $payment->id,
                    'subscription_id' => $subscription->id,
                    'status' => 'completed',
                    'is_paid' => true,
                    'amount' => 1500.00,
                    'currency' => 'ETB',
                ],
            ]);

        // Payment marked completed
        $payment->refresh();
        $this->assertSame('completed', $payment->status);
        $this->assertNotNull($payment->paid_at);

        // PaymentTransaction marked successful
        $transaction->refresh();
        $this->assertSame('successful', $transaction->status);
        $this->assertSame($chapaRef, $transaction->gateway_reference);
        $this->assertNotNull($transaction->verified_at);
        $this->assertSame('SUCCESS', $transaction->gateway_response['data']['status']);

        // Phase 3: Subscription is activated upon verified successful payment
        $subscription->refresh();
        $this->assertSame('active', $subscription->status);
    }

    public function test_verification_rejects_merchant_reference_mismatch(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , , $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Chapa returns verification with an unexpected merchant reference
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => 'TG-DIFFERENT-REF-999',
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

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsString('merchant reference mismatch', strtolower($response->json('message')));

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $transaction->refresh();
        $this->assertSame('failed', $transaction->status);
    }

    public function test_verification_accepts_numeric_string_amount_without_multiplying(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Gateway returns amount as numeric string "150000" (minor units)
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => '150000', // string format
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
                    'merchant_reference' => $merchantRef,
                    'gateway_reference' => $chapaRef,
                    'status' => 'completed',
                    'is_paid' => true,
                    'amount' => 1500.00,
                    'currency' => 'ETB',
                ],
            ]);

        $payment->refresh();
        $this->assertSame('completed', $payment->status);
        $this->assertEquals(1500.00, (float) $payment->amount);

        $transaction->refresh();
        $this->assertSame('successful', $transaction->status);

        // Phase 3: Subscription is activated upon verified successful payment
        $subscription->refresh();
        $this->assertSame('active', $subscription->status);
    }

    public function test_verification_rejects_missing_merchant_reference(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , , $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Gateway returns response with NO merchant_reference
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    // 'merchant_reference' is missing!
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

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsString('missing merchant reference', strtolower($response->json('message')));

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $transaction->refresh();
        $this->assertSame('failed', $transaction->status);
    }

    public function test_verification_rejects_missing_amount(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , , $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Gateway returns response with missing amount
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    // 'amount' is missing!
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

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsString('amount', strtolower($response->json('message')));

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $transaction->refresh();
        $this->assertSame('failed', $transaction->status);
    }

    public function test_verification_rejects_decimal_or_negative_amount(): void
    {
        [, $staffToken] = $this->createStaff();
        [, , , , $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Gateway returns decimal amount "1500.50" instead of integer cents
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
                'data' => [
                    'chapa_reference' => $chapaRef,
                    'merchant_reference' => $merchantRef,
                    'amount' => '1500.50', // Invalid decimal format for minor units
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

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsString('amount', strtolower($response->json('message')));

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $transaction->refresh();
        $this->assertSame('failed', $transaction->status);
    }
}
