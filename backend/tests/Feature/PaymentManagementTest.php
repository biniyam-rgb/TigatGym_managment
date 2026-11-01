<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Expense;
use App\Models\MemberProfile;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PaymentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    protected function createUserWithRole(string $role): array
    {
        $user = User::create([
            'name' => ucfirst($role) . ' User',
            'email' => $role . '_' . uniqid() . '@tigatgym.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ]);

        $roleModel = Role::where('name', $role)->firstOrFail();
        $user->roles()->attach($roleModel->id);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    protected function createMemberWithProfile(string $name = 'Member Test'): array
    {
        [$user, $token] = $this->createUserWithRole('member');
        $user->update(['name' => $name]);

        $profile = MemberProfile::create([
            'user_id' => $user->id,
            'member_code' => 'TG-' . rand(1000, 9999),
            'gender' => 'male',
            'qr_code_token' => 'TIGAT-' . uniqid(),
            'fitness_goals' => 'Cardio and strength',
        ]);

        return [$user, $profile, $token];
    }

    protected function createPlan(string $name = 'Standard Monthly', float $price = 3000.00): MembershipPlan
    {
        return MembershipPlan::create([
            'name' => $name,
            'slug' => 'standard-monthly-' . uniqid(),
            'duration_value' => 1,
            'duration_type' => 'month',
            'price' => $price,
            'currency' => 'ETB',
            'is_active' => true,
        ]);
    }

    public function test_receptionist_can_record_cash_payment_for_member_subscription(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Abebe Bikila');
        $plan = $this->createPlan('Monthly Pass', 3000.00);

        $subscription = Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => Subscription::generateNextSubscriptionNumber(),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
            'status' => 'pending',
            'price' => 3000.00,
            'discount' => 0.00,
            'total_amount' => 3000.00,
            'currency' => 'ETB',
            'created_by' => $receptionist->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/payments', [
                'user_id' => $member->id,
                'amount' => 3000.00,
                'payment_method' => 'cash',
                'payment_type' => 'subscription',
                'subscription_id' => $subscription->id,
                'notes' => 'Full cash payment received at reception desk',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'amount' => 3000,
                    'currency' => 'ETB',
                    'payment_method' => 'cash',
                    'status' => 'completed',
                ],
            ]);

        $paymentData = $response->json('data');
        $this->assertStringStartsWith('PAY-', $paymentData['payment_number']);
        $this->assertStringStartsWith('RCT-', $paymentData['receipt_number']);

        // Check that subscription transitioned from pending to active
        $this->assertEquals('active', $subscription->fresh()->status);

        // Check audit log
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'payment.recorded',
            'auditable_id' => $paymentData['id'],
            'user_id' => $receptionist->id,
        ]);
    }

    public function test_receptionist_can_record_bank_slip_payment_with_gateway_reference(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member] = $this->createMemberWithProfile('Derartu Tulu');

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/payments', [
                'user_id' => $member->id,
                'amount' => 8500.00,
                'payment_method' => 'bank_slip',
                'payment_type' => 'subscription',
                'gateway_reference' => 'CBE-FT-889911',
                'bank_name' => 'Commercial Bank of Ethiopia (CBE)',
                'bank_account_number' => '1000123456789',
                'notes' => 'Verified CBE mobile banking transfer slip',
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertEquals(8500, $data['amount']);
        $this->assertEquals('bank_slip', $data['payment_method']);
        $this->assertCount(1, $data['transactions']);
        $this->assertEquals('CBE-FT-889911', $data['transactions'][0]['gateway_reference']);
        $this->assertEquals('Commercial Bank of Ethiopia (CBE)', $data['transactions'][0]['bank_name']);
        $this->assertEquals('successful', $data['transactions'][0]['status']);
    }

    public function test_member_cannot_record_payment(): void
    {
        [$member, $profile, $memberToken] = $this->createMemberWithProfile();

        $response = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->postJson('/api/payments', [
                'user_id' => $member->id,
                'amount' => 1500.00,
                'payment_method' => 'cash',
            ]);

        $response->assertStatus(403);
    }

    public function test_member_can_view_own_payments_but_not_others(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member1, $p1, $memberToken1] = $this->createMemberWithProfile('Member One');
        [$member2, $p2, $memberToken2] = $this->createMemberWithProfile('Member Two');

        // Create payment for Member 1
        $res1 = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/payments', [
                'user_id' => $member1->id,
                'amount' => 2000.00,
                'payment_method' => 'cash',
            ]);
        $payment1Id = $res1->json('data.id');

        // Create payment for Member 2
        $res2 = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/payments', [
                'user_id' => $member2->id,
                'amount' => 4000.00,
                'payment_method' => 'pos',
            ]);
        $payment2Id = $res2->json('data.id');

        $this->app['auth']->forgetGuards();

        // Member 1 calls index: should see only their own payment
        $response = $this->withHeader('Authorization', "Bearer {$memberToken1}")
            ->getJson('/api/payments');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($payment1Id, $response->json('data.0.id'));

        // Member 1 attempts to view Member 2's payment directly: 403 Forbidden
        $directResponse = $this->withHeader('Authorization', "Bearer {$memberToken1}")
            ->getJson("/api/payments/{$payment2Id}");

        $directResponse->assertStatus(403);
    }

    public function test_staff_can_view_all_payments_with_summary(): void
    {
        [$admin, $adminToken] = $this->createUserWithRole('admin');
        [$member1] = $this->createMemberWithProfile('Member Alpha');
        [$member2] = $this->createMemberWithProfile('Member Beta');

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/payments', [
                'user_id' => $member1->id,
                'amount' => 3000.00,
                'payment_method' => 'cash',
            ]);

        $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/payments', [
                'user_id' => $member2->id,
                'amount' => 5000.00,
                'payment_method' => 'pos',
            ]);

        // Check index
        $indexResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/payments');

        $indexResponse->assertStatus(200);
        $this->assertCount(2, $indexResponse->json('data'));

        // Check summary
        $summaryResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/payments/summary');

        $summaryResponse->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'currency' => 'ETB',
                    'total_revenue' => 8000,
                    'today_revenue' => 8000,
                    'completed_count' => 2,
                ],
            ]);
    }

    public function test_owner_and_admin_can_refund_payment_with_mandatory_reason(): void
    {
        [$admin, $adminToken] = $this->createUserWithRole('admin');
        [$member] = $this->createMemberWithProfile('Haile Gebrselassie');

        $paymentRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/payments', [
                'user_id' => $member->id,
                'amount' => 6000.00,
                'payment_method' => 'pos',
            ]);
        $paymentId = $paymentRes->json('data.id');

        // Admin refunds payment
        $refundResponse = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/payments/{$paymentId}/refund", [
                'reason' => 'Duplicate card charge on front desk POS machine',
            ]);

        $refundResponse->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $paymentId,
                    'status' => 'refunded',
                ],
            ]);

        // Audit log verified
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'payment.refunded',
            'auditable_id' => $paymentId,
            'user_id' => $admin->id,
        ]);
    }

    public function test_receptionist_cannot_refund_payment(): void
    {
        [$admin, $adminToken] = $this->createUserWithRole('admin');
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member] = $this->createMemberWithProfile();

        $paymentRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson('/api/payments', [
                'user_id' => $member->id,
                'amount' => 3000.00,
                'payment_method' => 'cash',
            ]);
        $paymentId = $paymentRes->json('data.id');

        $this->app['auth']->forgetGuards();

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson("/api/payments/{$paymentId}/refund", [
                'reason' => 'Receptionist trying to refund',
            ]);

        $response->assertStatus(403);
    }

    public function test_cannot_refund_an_already_refunded_payment(): void
    {
        [$owner, $ownerToken] = $this->createUserWithRole('owner');
        [$member] = $this->createMemberWithProfile();

        $paymentRes = $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->postJson('/api/payments', [
                'user_id' => $member->id,
                'amount' => 3000.00,
                'payment_method' => 'cash',
            ]);
        $paymentId = $paymentRes->json('data.id');

        // First refund succeeds
        $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->postJson("/api/payments/{$paymentId}/refund", [
                'reason' => 'Customer requested cancellation within grace period',
            ])->assertStatus(200);

        // Second refund fails
        $secondRefund = $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->postJson("/api/payments/{$paymentId}/refund", [
                'reason' => 'Attempting duplicate refund',
            ]);

        $secondRefund->assertStatus(422);
    }

    public function test_expense_lifecycle_recording_approval_and_deletion(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$admin, $adminToken] = $this->createUserWithRole('admin');
        [$owner, $ownerToken] = $this->createUserWithRole('owner');

        // 1. Receptionist records utility expense -> pending
        $recExpRes = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/expenses', [
                'title' => 'Gym Water Dispenser Refill',
                'category' => 'utilities',
                'amount' => 450.00,
                'payment_method' => 'cash',
                'expense_date' => now()->toDateString(),
                'recipient' => 'Addis Spring Water Co.',
                'description' => '3x 20L water carboys for cardio zone',
            ]);

        $recExpRes->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'category' => 'utilities',
                    'amount' => 450,
                    'status' => 'pending',
                ],
            ]);
        $expenseId = $recExpRes->json('data.id');

        $this->app['auth']->forgetGuards();

        // 2. Admin approves the expense -> paid
        $approveRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->postJson("/api/expenses/{$expenseId}/approve");

        $approveRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $expenseId,
                    'status' => 'paid',
                ],
            ]);

        // 3. Expense summary verified
        $summaryRes = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/expenses/summary');

        $summaryRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'total_expenses' => 450,
                ],
            ]);

        $this->app['auth']->forgetGuards();

        // 4. Owner soft deletes expense
        $deleteRes = $this->withHeader('Authorization', "Bearer {$ownerToken}")
            ->deleteJson("/api/expenses/{$expenseId}");

        $deleteRes->assertStatus(200);
        $this->assertSoftDeleted('expenses', ['id' => $expenseId]);
    }
}
