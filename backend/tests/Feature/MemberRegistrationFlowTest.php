<?php

namespace Tests\Feature;

use App\Models\MemberProfile;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MemberRegistrationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
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

    public function test_registration_validation_fails_for_invalid_data(): void
    {
        [, $token] = $this->createStaff();

        // 1. Missing name and phone
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/members', [
                'name' => '',
                'phone' => '',
            ]);
        $res->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'phone']);

        // 2. Invalid blood type
        $res2 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/members', [
                'name' => 'Zelalem Tadesse',
                'phone' => '+251911223344',
                'blood_type' => 'XYZ',
            ]);
        $res2->assertStatus(422)
            ->assertJsonValidationErrors(['blood_type']);

        // 3. Invalid DOB (future date)
        $res3 = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/members', [
                'name' => 'Zelalem Tadesse',
                'phone' => '+251911223344',
                'date_of_birth' => now()->addDay()->toDateString(),
            ]);
        $res3->assertStatus(422)
            ->assertJsonValidationErrors(['date_of_birth']);
    }

    public function test_complete_registration_with_cash_payment_and_receipt_generation(): void
    {
        [$staff, $token] = $this->createStaff();

        // Admin/Owner pre-created membership plan
        $plan = MembershipPlan::create([
            'name' => 'Monthly Standard',
            'slug' => 'monthly-standard-' . uniqid(),
            'duration_value' => 1,
            'duration_type' => 'month',
            'price' => 1500.00,
            'currency' => 'ETB',
            'is_active' => true,
        ]);

        // Step 1: Register Member
        $regResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/members', [
                'name' => 'Abebe Bikila',
                'phone' => '+251911223344',
                'email' => 'abebe.bikila@tigatgym.com',
                'gender' => 'male',
                'blood_type' => 'O+',
                'date_of_birth' => '1998-05-12',
                'emergency_contact_name' => 'Almaz Bikila',
                'emergency_contact_phone' => '+251911889900',
            ]);

        $regResponse->assertStatus(201)
            ->assertJsonStructure([
                'member' => ['id', 'user_id', 'member_code', 'name', 'phone', 'qr_code_token'],
            ]);

        $memberData = $regResponse->json('member');
        $this->assertStringStartsWith('TG-', $memberData['member_code']);
        $this->assertNotEmpty($memberData['qr_code_token']);

        // Step 2: Assign Subscription using user_id
        $subResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/subscriptions', [
                'member_id' => $memberData['user_id'],
                'membership_plan_id' => $plan->id,
                'start_date' => now()->toDateString(),
            ]);

        $subResponse->assertStatus(201);
        $subData = $subResponse->json('data');
        $this->assertEquals($memberData['user_id'], $subData['member']['id']);

        // Step 3: Record Cash Payment
        $payResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments', [
                'user_id' => $memberData['user_id'],
                'subscription_id' => $subData['id'],
                'amount' => 1500.00,
                'payment_method' => 'cash',
                'payment_type' => 'subscription',
                'status' => 'completed',
            ]);

        $payResponse->assertStatus(201);
        $paymentData = $payResponse->json('data');
        $this->assertStringStartsWith('RCT-', $paymentData['receipt_number']);
        $this->assertStringStartsWith('PAY-', $paymentData['payment_number']);
        $this->assertEquals(1500, $paymentData['amount']);
        $this->assertEquals('cash', $paymentData['payment_method']);
    }

    public function test_complete_registration_with_chapa_payment_and_reference(): void
    {
        [$staff, $token] = $this->createStaff();

        $plan = MembershipPlan::create([
            'name' => 'Quarterly VIP',
            'slug' => 'quarterly-vip-' . uniqid(),
            'duration_value' => 3,
            'duration_type' => 'month',
            'price' => 4500.00,
            'currency' => 'ETB',
            'is_active' => true,
        ]);

        // Register Member
        $regResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/members', [
                'name' => 'Selamawit Tadesse',
                'phone' => '0922334455',
                'gender' => 'female',
                'blood_type' => 'A+',
                'date_of_birth' => '2000-01-15',
            ]);

        $regResponse->assertStatus(201);
        $memberData = $regResponse->json('member');

        // Assign Subscription
        $subResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/subscriptions', [
                'member_id' => $memberData['user_id'],
                'membership_plan_id' => $plan->id,
            ]);
        $subResponse->assertStatus(201);
        $subData = $subResponse->json('data');

        // Record Chapa Payment with Transaction Reference
        $payResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments', [
                'user_id' => $memberData['user_id'],
                'subscription_id' => $subData['id'],
                'amount' => 4500.00,
                'payment_method' => 'chapa',
                'gateway_reference' => 'CHP-9876543210',
                'status' => 'completed',
            ]);

        $payResponse->assertStatus(201);
        $paymentData = $payResponse->json('data');
        $this->assertStringStartsWith('RCT-', $paymentData['receipt_number']);
        $this->assertEquals('chapa', $paymentData['payment_method']);
        $this->assertEquals(4500, $paymentData['amount']);
    }

    public function test_chapa_mobile_push_initialize_and_pin_verify_endpoints(): void
    {
        [, $token] = $this->createStaff();

        $member = User::create([
            'name' => 'Abebe Bikila',
            'email' => 'abebe_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911223344',
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ]);
        $member->roles()->attach(Role::where('name', 'member')->firstOrFail()->id);
        MemberProfile::create([
            'user_id' => $member->id,
            'member_code' => 'TG-0999',
            'qr_code_token' => 'QR-0999',
            'joined_at' => now(),
        ]);

        $plan = MembershipPlan::create([
            'name' => 'Monthly Standard Plan',
            'slug' => 'monthly-standard-' . uniqid(),
            'price' => 1500.00,
            'currency' => 'ETB',
            'duration_type' => 'month',
            'duration_value' => 1,
            'is_active' => true,
        ]);

        Http::fake([
            'https://api.chapa.global/v2/payments/hosted' => Http::response([
                'status' => 'success',
                'message' => 'Hosted checkout created',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.global/checkout/payment/CHP-TG-MOCK999',
                ],
            ], 200),
        ]);

        // 1. Initialize Chapa Hosted Payment
        $initResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/initialize', [
                'member_id' => $member->id,
                'membership_plan_id' => $plan->id,
            ]);

        $initResponse->assertStatus(201)
            ->assertJson([
                'status' => 'success',
            ]);

        $txRef = $initResponse->json('data.merchant_reference');
        $this->assertNotEmpty($txRef);
        $this->assertLessThanOrEqual(20, strlen($txRef));

        // 2. Verify Member PIN Authorization (Approval)
        $verifyResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/verify', [
                'tx_ref' => $txRef,
                'pin' => '1234',
            ]);

        $verifyResponse->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'tx_ref' => $txRef,
                    'status' => 'completed',
                    'verified' => true,
                ],
            ]);

        // 3. Verify Member Cancels Payment on Phone
        $cancelResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/payments/chapa/verify', [
                'tx_ref' => $txRef,
                'simulate_status' => 'cancelled',
            ]);

        $cancelResponse->assertStatus(422)
            ->assertJson([
                'status' => 'cancelled',
                'data' => [
                    'status' => 'cancelled',
                    'verified' => false,
                ],
            ]);

        // 4. Verify public Chapa Webhook / Callback endpoint
        $webhookResponse = $this->postJson('/api/payments/chapa/callback', [
            'trx_ref' => $txRef,
            'status' => 'success',
        ]);
        $webhookResponse->assertStatus(200);
    }
}
