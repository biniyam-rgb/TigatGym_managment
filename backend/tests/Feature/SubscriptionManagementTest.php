<?php

namespace Tests\Feature;

use App\Models\MemberProfile;
use App\Models\MembershipPlan;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SubscriptionManagementTest extends TestCase
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
            'member_code' => MemberProfile::generateNextMemberCode(),
            'qr_code_token' => 'TIGAT-TEST-' . uniqid(),
            'joined_at' => now()->toDateString(),
        ]);

        return [$user, $profile, $token];
    }

    protected function createPlan(array $overrides = []): MembershipPlan
    {
        return MembershipPlan::create(array_merge([
            'name' => 'Monthly Standard',
            'slug' => 'monthly-standard-' . uniqid(),
            'description' => '1 month standard gym access',
            'price' => 2500.00,
            'currency' => 'ETB',
            'duration_type' => 'month',
            'duration_value' => 1,
            'access_hours_type' => 'all_day',
            'has_trainer_access' => false,
            'has_class_access' => false,
            'is_active' => true,
        ], $overrides));
    }

    public function test_owner_and_admin_can_create_membership_plan(): void
    {
        [$owner, $ownerToken] = $this->createUserWithRole('owner');

        $response = $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->postJson('/api/membership-plans', [
                'name' => 'Gold 3 Months',
                'description' => 'Access to gym and sauna',
                'price' => 6500.00,
                'duration_type' => 'month',
                'duration_value' => 3,
                'has_class_access' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Gold 3 Months')
            ->assertJsonPath('data.slug', 'gold-3-months')
            ->assertJsonPath('data.currency', 'ETB');

        $this->assertDatabaseHas('membership_plans', [
            'name' => 'Gold 3 Months',
            'slug' => 'gold-3-months',
            'price' => 6500.00,
        ]);
    }

    public function test_receptionist_and_member_cannot_create_membership_plan(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/membership-plans', [
                'name' => 'Unauthorized Plan',
                'price' => 1000,
                'duration_type' => 'month',
                'duration_value' => 1,
            ]);

        $response->assertStatus(403);

        $this->app['auth']->forgetGuards();

        [$member, $mToken] = $this->createUserWithRole('member');

        $memberResponse = $this->withHeader('Authorization', 'Bearer ' . $mToken)
            ->postJson('/api/membership-plans', [
                'name' => 'Unauthorized Plan 2',
                'price' => 1000,
                'duration_type' => 'month',
                'duration_value' => 1,
            ]);

        $memberResponse->assertStatus(403);
    }

    public function test_staff_can_assign_subscription_to_member_with_calculated_end_date(): void
    {
        [$receptionist, $rToken] = $this->createUserWithRole('receptionist');
        [$memberUser, $profile] = $this->createMemberWithProfile('Dawit Tsige');
        $plan = $this->createPlan(['price' => 3000.00, 'duration_type' => 'month', 'duration_value' => 1]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $rToken)
            ->postJson('/api/subscriptions', [
                'member_id' => $memberUser->id,
                'membership_plan_id' => $plan->id,
                'start_date' => '2026-11-01',
                'discount' => 200.00,
                'notes' => 'Seasonal promo discount applied',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.member_id', $memberUser->id)
            ->assertJsonPath('data.price', 3000)
            ->assertJsonPath('data.discount', 200)
            ->assertJsonPath('data.total_amount', 2800)
            ->assertJsonPath('data.start_date', '2026-11-01')
            ->assertJsonPath('data.end_date', '2026-11-30')
            ->assertJsonPath('data.status', 'active');

        $subNumber = $response->json('data.subscription_number');
        $this->assertMatchesRegularExpression('/^SUB-\d{4}$/', $subNumber);

        $this->assertDatabaseHas('subscriptions', [
            'subscription_number' => $subNumber,
            'member_id' => $memberUser->id,
            'total_amount' => 2800.00,
        ]);
    }

    public function test_subscription_cannot_be_assigned_to_non_member(): void
    {
        [$receptionist, $rToken] = $this->createUserWithRole('receptionist');
        [$trainerUser] = $this->createUserWithRole('trainer');
        $plan = $this->createPlan();

        $response = $this->withHeader('Authorization', 'Bearer ' . $rToken)
            ->postJson('/api/subscriptions', [
                'member_id' => $trainerUser->id,
                'membership_plan_id' => $plan->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_subscription_renewal_extends_end_date_when_active(): void
    {
        [$receptionist, $rToken] = $this->createUserWithRole('receptionist');
        [$memberUser] = $this->createMemberWithProfile();
        $plan = $this->createPlan(['duration_type' => 'month', 'duration_value' => 1]);

        $activeEnd = Carbon::today()->addDays(15);
        $subscription = Subscription::create([
            'member_id' => $memberUser->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-0001',
            'start_date' => Carbon::today()->subDays(15)->toDateString(),
            'end_date' => $activeEnd->toDateString(),
            'status' => 'active',
            'price' => $plan->price,
            'discount' => 0,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $rToken)
            ->postJson("/api/subscriptions/{$subscription->id}/renew", []);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $expectedStart = $activeEnd->copy()->addDay()->toDateString();
        $expectedEnd = $plan->calculateEndDate(Carbon::parse($expectedStart))->toDateString();

        $response->assertJsonPath('data.start_date', $expectedStart)
            ->assertJsonPath('data.end_date', $expectedEnd);
    }

    public function test_subscription_freeze_extends_end_date_and_sets_frozen_status(): void
    {
        [$receptionist, $rToken] = $this->createUserWithRole('receptionist');
        [$memberUser] = $this->createMemberWithProfile();
        $plan = $this->createPlan();

        $initialEnd = Carbon::today()->addDays(20);
        $subscription = Subscription::create([
            'member_id' => $memberUser->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-0010',
            'start_date' => Carbon::today()->subDays(10)->toDateString(),
            'end_date' => $initialEnd->toDateString(),
            'status' => 'active',
            'price' => $plan->price,
            'discount' => 0,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        $freezeUntil = Carbon::today()->addDays(7);

        $response = $this->withHeader('Authorization', 'Bearer ' . $rToken)
            ->postJson("/api/subscriptions/{$subscription->id}/freeze", [
                'frozen_until' => $freezeUntil->toDateString(),
                'reason' => 'Traveling abroad for work',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'frozen')
            ->assertJsonPath('data.frozen_until', $freezeUntil->toDateString());

        // End date should have been extended by the 7 freeze days
        $expectedNewEnd = $initialEnd->copy()->addDays(7)->toDateString();
        $response->assertJsonPath('data.end_date', $expectedNewEnd);
    }

    public function test_subscription_unfreeze_restores_active_status(): void
    {
        [$receptionist, $rToken] = $this->createUserWithRole('receptionist');
        [$memberUser] = $this->createMemberWithProfile();
        $plan = $this->createPlan();

        $subscription = Subscription::create([
            'member_id' => $memberUser->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-0011',
            'start_date' => Carbon::today()->subDays(5)->toDateString(),
            'end_date' => Carbon::today()->addDays(25)->toDateString(),
            'status' => 'frozen',
            'frozen_until' => Carbon::today()->addDays(5)->toDateString(),
            'price' => $plan->price,
            'discount' => 0,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $rToken)
            ->postJson("/api/subscriptions/{$subscription->id}/unfreeze", []);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.frozen_until', null);
    }

    public function test_subscription_cancel_requires_reason_and_sets_cancelled_status(): void
    {
        [$owner, $ownerToken] = $this->createUserWithRole('owner');
        [$memberUser] = $this->createMemberWithProfile();
        $plan = $this->createPlan();

        $subscription = Subscription::create([
            'member_id' => $memberUser->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-0012',
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(30)->toDateString(),
            'status' => 'active',
            'price' => $plan->price,
            'discount' => 0,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $ownerToken)
            ->postJson("/api/subscriptions/{$subscription->id}/cancel", [
                'cancellation_reason' => 'Relocated to another city permanently',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancellation_reason', 'Relocated to another city permanently');

        $this->assertDatabaseHas('subscriptions', [
            'id' => $subscription->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_member_can_only_view_own_subscriptions(): void
    {
        [$memberUser1, , $token1] = $this->createMemberWithProfile('Member 1');
        [$memberUser2] = $this->createMemberWithProfile('Member 2');
        $plan = $this->createPlan();

        Subscription::create([
            'member_id' => $memberUser1->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-0101',
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(30)->toDateString(),
            'status' => 'active',
            'price' => $plan->price,
            'discount' => 0,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        Subscription::create([
            'member_id' => $memberUser2->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-0102',
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(30)->toDateString(),
            'status' => 'active',
            'price' => $plan->price,
            'discount' => 0,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token1)
            ->getJson('/api/subscriptions');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.subscription_number', 'SUB-0101');
    }
}
