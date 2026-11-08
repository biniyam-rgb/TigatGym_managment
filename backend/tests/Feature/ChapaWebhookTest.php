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

class ChapaWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected string $webhookSecret = 'test-chapa-webhook-secret-999';

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

    protected function createMember(string $name = 'Abebe Bikila'): User
    {
        $user = User::create([
            'name' => $name,
            'email' => 'member_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'inactive', // Starts inactive; will become active on payment!
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', 'member')->firstOrFail();
        $user->roles()->attach($roleModel->id);

        MemberProfile::create([
            'user_id' => $user->id,
            'member_code' => 'TG-' . rand(1000, 9999),
            'qr_code_token' => '', // Will be generated upon activation
            'joined_at' => now(),
        ]);

        return $user;
    }

    protected function createPendingPaymentScenario(float $price = 1500.00): array
    {
        $member = $this->createMember('Marta Hailu');

        $plan = MembershipPlan::create([
            'name' => 'Monthly Standard',
            'slug' => 'monthly-standard-' . uniqid(),
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
            'end_date' => now()->addMonth()->subDay()->toDateString(),
            'status' => 'pending',
            'price' => $price,
            'discount' => 0.00,
            'total_amount' => $price,
            'currency' => 'ETB',
        ]);

        $merchantRef = 'TG-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -6));
        $chapaRef = 'CHAPA-WH-' . uniqid();

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

        return [$member, $plan, $subscription, $payment, $transaction, $merchantRef, $chapaRef];
    }

    protected function signPayload(string $rawBody): string
    {
        return hash_hmac('sha256', $rawBody, $this->webhookSecret);
    }

    public function test_webhook_rejects_missing_signature(): void
    {
        $payload = json_encode(['event' => 'charge.success', 'data' => ['merchant_reference' => 'TG-123']]);

        $response = $this->call('POST', '/api/payments/chapa/webhook', [], [], [], [], $payload);

        $response->assertStatus(401)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid or missing Chapa webhook signature.',
            ]);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $payload = json_encode(['event' => 'charge.success', 'data' => ['merchant_reference' => 'TG-123']]);

        $response = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => 'invalid-tampered-signature'],
            $payload
        );

        $response->assertStatus(401)
            ->assertJson([
                'status' => 'error',
                'message' => 'Invalid or missing Chapa webhook signature.',
            ]);
    }

    public function test_webhook_returns_404_for_unknown_reference(): void
    {
        $payload = json_encode([
            'event' => 'charge.success',
            'data' => [
                'merchant_reference' => 'TG-NONEXISTENT-REF',
            ],
        ]);

        $signature = $this->signPayload($payload);

        $response = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => $signature],
            $payload
        );

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Payment transaction not found for reference: TG-NONEXISTENT-REF',
            ]);
    }

    public function test_webhook_verifies_server_side_and_activates_membership(): void
    {
        [$member, $plan, $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Server-side verification mock (never trusting webhook payload alone)
        Http::fake([
            "https://api.chapa.global/v2/payments/{$chapaRef}/verify" => Http::response([
                'status' => 'success',
                'message' => 'Payment details retrieved successfully',
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

        $payload = json_encode([
            'event' => 'charge.success',
            'data' => [
                'merchant_reference' => $merchantRef,
                'chapa_reference' => $chapaRef,
                'status' => 'success',
            ],
        ]);
        $signature = $this->signPayload($payload);

        $response = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => $signature],
            $payload
        );

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Webhook verified successfully. Payment completed and subscription activated.',
            ]);

        // Payment marked completed
        $payment->refresh();
        $this->assertSame('completed', $payment->status);
        $this->assertNotNull($payment->paid_at);

        // PaymentTransaction marked successful
        $transaction->refresh();
        $this->assertSame('successful', $transaction->status);
        $this->assertNotNull($transaction->verified_at);

        // Phase 3: Subscription is ACTIVATED!
        $subscription->refresh();
        $this->assertSame('active', $subscription->status);

        // Member status updated to active and QR code generated
        $member->refresh();
        $this->assertSame('active', $member->status);
        $this->assertNotEmpty($member->memberProfile->qr_code_token);

        // Ensure server-side verify endpoint was invoked
        Http::assertSent(function ($request) use ($chapaRef) {
            return $request->url() === "https://api.chapa.global/v2/payments/{$chapaRef}/verify";
        });
    }

    public function test_webhook_duplicate_delivery_is_idempotent(): void
    {
        [, , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

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

        $payload = json_encode([
            'event' => 'charge.success',
            'data' => [
                'merchant_reference' => $merchantRef,
            ],
        ]);
        $signature = $this->signPayload($payload);

        // 1st Webhook delivery
        $res1 = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => $signature],
            $payload
        );
        $res1->assertStatus(200);

        $payment->refresh();
        $firstPaidAt = $payment->paid_at->toIso8601String();

        // 2nd Webhook delivery (duplicate event)
        $res2 = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => $signature],
            $payload
        );

        $res2->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'already_processed' => true,
                ],
            ]);

        $payment->refresh();
        $this->assertSame($firstPaidAt, $payment->paid_at->toIso8601String());

        // External verify called only once
        Http::assertSentCount(1);
    }

    public function test_webhook_does_not_activate_subscription_if_gateway_verification_fails(): void
    {
        [, , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

        // Server-side verification reveals gateway status is failed
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

        $payload = json_encode([
            'event' => 'charge.success', // Fake or spoofed event
            'data' => [
                'merchant_reference' => $merchantRef,
            ],
        ]);
        $signature = $this->signPayload($payload);

        $response = $this->call(
            'POST',
            '/api/payments/chapa/webhook',
            [],
            [],
            [],
            ['HTTP_Chapa-Signature' => $signature],
            $payload
        );

        // Subscription MUST remain pending!
        $subscription->refresh();
        $this->assertSame('pending', $subscription->status);

        $payment->refresh();
        $this->assertSame('failed', $payment->status);

        $transaction->refresh();
        $this->assertSame('failed', $transaction->status);
    }

    public function test_callback_via_get_does_not_require_signature_and_verifies_server_side(): void
    {
        [$member, $plan, $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

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

        // Browser GET callback: NO signature header sent
        $response = $this->getJson("/api/payments/chapa/callback?merchant_reference={$merchantRef}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'merchant_reference' => $merchantRef,
                    'status' => 'completed',
                    'is_paid' => true,
                ],
            ]);

        // Subscription is activated!
        $subscription->refresh();
        $this->assertSame('active', $subscription->status);

        $payment->refresh();
        $this->assertSame('completed', $payment->status);

        $transaction->refresh();
        $this->assertSame('successful', $transaction->status);
    }

    public function test_callback_via_post_verifies_server_side_and_activates_membership(): void
    {
        [, , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

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

        // Gateway POST callback without signature header
        $response = $this->postJson('/api/payments/chapa/callback', [
            'merchant_reference' => $merchantRef,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'merchant_reference' => $merchantRef,
                    'status' => 'completed',
                    'is_paid' => true,
                ],
            ]);

        $subscription->refresh();
        $this->assertSame('active', $subscription->status);
    }

    public function test_callback_repeated_call_is_idempotent(): void
    {
        [, , $subscription, $payment, $transaction, $merchantRef, $chapaRef] = $this->createPendingPaymentScenario(1500.00);

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

        // 1st callback
        $res1 = $this->getJson("/api/payments/chapa/callback?merchant_reference={$merchantRef}");
        $res1->assertStatus(200);

        // 2nd callback (repeated)
        $res2 = $this->getJson("/api/payments/chapa/callback?merchant_reference={$merchantRef}");
        $res2->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'already_completed' => true,
                ],
            ]);

        // Server-side verification only called once
        Http::assertSentCount(1);
    }
}
