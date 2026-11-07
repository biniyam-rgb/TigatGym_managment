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

class ChapaPaymentInitializationTest extends TestCase
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

    protected function createMember(): User
    {
        $user = User::create([
            'name' => 'Abebe Bikila',
            'email' => 'abebe_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', 'member')->firstOrFail();
        $user->roles()->attach($roleModel->id);

        MemberProfile::create([
            'user_id' => $user->id,
            'member_code' => 'TG-0001',
            'qr_code_token' => 'QR-TOKEN-MOCK-1',
            'joined_at' => now(),
        ]);

        return $user;
    }

    protected function createPlan(float $price = 1500.00, bool $isActive = true): MembershipPlan
    {
        return MembershipPlan::create([
            'name' => 'Standard Monthly',
            'slug' => 'standard-monthly-' . uniqid(),
            'description' => 'Full access to gym equipment.',
            'price' => $price,
            'currency' => 'ETB',
            'duration_type' => 'month',
            'duration_value' => 1,
            'is_active' => $isActive,
        ]);
    }

    public function test_initializes_chapa_hosted_payment_successfully(): void
    {
        [, $token] = $this->createStaff();
        $member = $this->createMember();
        $plan = $this->createPlan(1500.00);

        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => Http::response([
                'status' => 'success',
                'message' => 'Hosted checkout session created',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.global/checkout/payment/CHAPA-TOKEN-XYZ',
                ],
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/initialize', [
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.global/checkout/payment/CHAPA-TOKEN-XYZ',
                    'gateway_reference' => 'CHAPA-TOKEN-XYZ',
                    'amount' => 1500.00,
                    'currency' => 'ETB',
                    'plan_name' => 'Standard Monthly',
                    'status' => 'pending',
                ],
            ]);

        $responseData = $response->json('data');
        $merchantRef = $responseData['merchant_reference'];

        // Merchant reference must be <= 20 chars
        $this->assertLessThanOrEqual(20, strlen($merchantRef));

        // Assert pending Subscription created in DB
        $this->assertDatabaseHas('subscriptions', [
            'id' => $responseData['subscription_id'],
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'status' => 'pending',
            'total_amount' => 1500.00,
        ]);

        // Assert pending Payment created in DB
        $this->assertDatabaseHas('payments', [
            'id' => $responseData['payment_id'],
            'user_id' => $member->id,
            'amount' => 1500.00,
            'currency' => 'ETB',
            'payment_method' => 'chapa',
            'status' => 'pending',
        ]);

        // Assert PaymentTransaction created in DB with separate merchant & gateway references
        $this->assertDatabaseHas('payment_transactions', [
            'payment_id' => $responseData['payment_id'],
            'transaction_reference' => $merchantRef,
            'gateway' => 'chapa',
            'gateway_reference' => 'CHAPA-TOKEN-XYZ',
            'status' => 'pending',
        ]);

        // Verify Chapa HTTP request was sent with minor units (150000)
        Http::assertSent(function ($request) use ($merchantRef) {
            return $request->url() === 'https://api.chapa.global/v2/payments/hosted'
                && $request['amount'] === 150000
                && $request['currency'] === 'ETB'
                && $request['merchant_reference'] === $merchantRef;
        });
    }

    public function test_server_side_membership_price_validation_ignores_tampered_amount(): void
    {
        [, $token] = $this->createStaff();
        $member = $this->createMember();
        $plan = $this->createPlan(2500.00); // Authoritative DB price

        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => Http::response([
                'status' => 'success',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.global/checkout/payment/CHAPA-SECURE-1',
                ],
            ], 200),
        ]);

        // Client attempts to send tampered amount 5.00 ETB
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/initialize', [
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
                'amount' => 5.00,
            ]);

        $response->assertStatus(201);

        // System must charge the database plan price of 2500.00 ETB (250000 minor units)
        $this->assertSame(2500.00, (float) $response->json('data.amount'));

        Http::assertSent(function ($request) {
            return $request['amount'] === 250000;
        });
    }

    public function test_idempotency_reutilization_returns_existing_checkout_session(): void
    {
        [, $token] = $this->createStaff();
        $member = $this->createMember();
        $plan = $this->createPlan(1500.00);

        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => Http::sequence()
                ->push([
                    'status' => 'success',
                    'data' => [
                        'checkout_url' => 'https://checkout.chapa.global/checkout/payment/CHAPA-IDEMP-SESSION',
                    ],
                ], 200),
        ]);

        $idempotencyKey = 'IDEMP-TEST-CLIENT-123456';

        // 1st request
        $res1 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('Idempotency-Key', $idempotencyKey)
            ->postJson('/api/payments/chapa/initialize', [
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
            ]);

        $res1->assertStatus(201);
        $this->assertSame('https://checkout.chapa.global/checkout/payment/CHAPA-IDEMP-SESSION', $res1->json('data.checkout_url'));

        // 2nd request with exact same idempotency key
        $res2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('Idempotency-Key', $idempotencyKey)
            ->postJson('/api/payments/chapa/initialize', [
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
            ]);

        $res2->assertStatus(200);
        $this->assertTrue($res2->json('data.is_retry'));
        $this->assertSame($res1->json('data.checkout_url'), $res2->json('data.checkout_url'));
        $this->assertSame($res1->json('data.merchant_reference'), $res2->json('data.merchant_reference'));

        // Only 1 HTTP call should have been made to Chapa
        Http::assertSentCount(1);

        // Only 1 payment record created in database
        $this->assertSame(1, Payment::count());
        $this->assertSame(1, PaymentTransaction::count());
    }

    public function test_cannot_initialize_payment_for_inactive_membership_plan(): void
    {
        [, $token] = $this->createStaff();
        $member = $this->createMember();
        $inactivePlan = $this->createPlan(1000.00, isActive: false);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/initialize', [
                'member_id' => $member->id,
                'membership_plan_id' => $inactivePlan->id,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'The selected membership plan is currently not active.',
            ]);
    }

    public function test_chapa_gateway_failure_marks_transaction_failed(): void
    {
        [, $token] = $this->createStaff();
        $member = $this->createMember();
        $plan = $this->createPlan(1500.00);

        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => Http::response([
                'status' => 'error',
                'message' => 'Service temporarily unavailable on gateway.',
            ], 503),
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/initialize', [
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
            ]);

        $response->assertStatus(503)
            ->assertJson([
                'status' => 'error',
            ]);

        // Assert transaction marked failed
        $this->assertDatabaseHas('payment_transactions', [
            'status' => 'failed',
            'gateway' => 'chapa',
        ]);
    }
}
