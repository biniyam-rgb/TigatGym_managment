<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
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

class AttendanceManagementTest extends TestCase
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
            'qr_code_token' => 'TIGAT-' . strtoupper(uniqid()),
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

    protected function createActiveSubscription(User $member, MembershipPlan $plan): Subscription
    {
        return Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => Subscription::generateNextSubscriptionNumber(),
            'start_date' => Carbon::today()->subDays(5)->toDateString(),
            'end_date' => Carbon::today()->addDays(25)->toDateString(),
            'status' => 'active',
            'price' => $plan->price,
            'discount' => 0.00,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);
    }

    public function test_receptionist_can_check_in_member_with_valid_qr_token(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Kenenisa Bekele');
        $plan = $this->createPlan();
        $this->createActiveSubscription($member, $plan);

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
                'method' => 'qr_code',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'member_id' => $member->id,
                    'status' => 'admitted',
                    'method' => 'qr_code',
                ],
            ]);

        $this->assertDatabaseHas('attendance_records', [
            'member_id' => $member->id,
            'status' => 'admitted',
            'verified_by' => $receptionist->id,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'attendance.check_in',
            'user_id' => $receptionist->id,
        ]);
    }

    public function test_receptionist_can_check_in_member_with_member_code(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Tirunesh Dibaba');
        $plan = $this->createPlan();
        $this->createActiveSubscription($member, $plan);

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'member_code' => $profile->member_code,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'member_id' => $member->id,
                    'status' => 'admitted',
                    'method' => 'member_code',
                ],
            ]);
    }

    public function test_check_in_denied_when_member_has_no_active_subscription(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('No Sub Member');

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'denied',
            ]);

        $this->assertDatabaseHas('attendance_records', [
            'member_id' => $member->id,
            'status' => 'denied',
        ]);
    }

    public function test_check_in_denied_when_subscription_is_expired(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Expired Pass Member');
        $plan = $this->createPlan();

        // Expired subscription
        Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => Subscription::generateNextSubscriptionNumber(),
            'start_date' => Carbon::today()->subDays(35)->toDateString(),
            'end_date' => Carbon::today()->subDays(5)->toDateString(),
            'status' => 'expired',
            'price' => $plan->price,
            'discount' => 0.00,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'denied',
            ]);

        $this->assertStringContainsString('expired', strtolower($response->json('message')));
    }

    public function test_check_in_denied_when_subscription_is_frozen(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Frozen Pass Member');
        $plan = $this->createPlan();

        // Frozen subscription
        Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => Subscription::generateNextSubscriptionNumber(),
            'start_date' => Carbon::today()->subDays(10)->toDateString(),
            'end_date' => Carbon::today()->addDays(20)->toDateString(),
            'frozen_until' => Carbon::today()->addDays(14)->toDateString(),
            'status' => 'frozen',
            'price' => $plan->price,
            'discount' => 0.00,
            'total_amount' => $plan->price,
            'currency' => 'ETB',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'denied',
            ]);

        $this->assertStringContainsString('frozen', strtolower($response->json('message')));
    }

    public function test_check_in_denied_when_member_account_is_suspended(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Suspended Member');
        $member->update(['status' => 'suspended']);
        $plan = $this->createPlan();
        $this->createActiveSubscription($member, $plan);

        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'denied',
            ]);

        $this->assertStringContainsString('suspended', strtolower($response->json('message')));
    }

    public function test_anti_passback_prevents_rapid_duplicate_check_in(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Rapid Scan Member');
        $plan = $this->createPlan();
        $this->createActiveSubscription($member, $plan);

        // 1. First scan -> Admitted
        $firstScan = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);
        $firstScan->assertStatus(201);

        // 2. Immediate second scan (1 second later) -> Anti-passback denied
        $secondScan = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);

        $secondScan->assertStatus(422)
            ->assertJson([
                'status' => 'denied',
            ]);

        $this->assertStringContainsString('Anti-passback alert', $secondScan->json('message'));
    }

    public function test_staff_can_check_out_admitted_member(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Workout Finisher');
        $plan = $this->createPlan();
        $this->createActiveSubscription($member, $plan);

        // Check in 45 minutes ago
        $record = AttendanceRecord::create([
            'member_id' => $member->id,
            'check_in_time' => Carbon::now()->subMinutes(45),
            'method' => 'qr_code',
            'status' => 'admitted',
            'verified_by' => $receptionist->id,
        ]);

        // Process check-out
        $response = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-out', [
                'member_id' => $member->id,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertNotNull($response->json('data.check_out_time'));
        $this->assertEquals(45, $response->json('data.duration_minutes'));
    }

    public function test_member_cannot_process_check_in(): void
    {
        [$member, $profile, $memberToken] = $this->createMemberWithProfile('Self Check In Attempt');

        $response = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);

        $response->assertStatus(403);
    }

    public function test_attendance_summary_reports_live_desk_counts(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member, $profile] = $this->createMemberWithProfile('Desk Stat Member');
        $plan = $this->createPlan();
        $this->createActiveSubscription($member, $plan);

        // Record 1 admitted check-in
        $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'qr_token' => $profile->qr_code_token,
            ]);

        $summaryRes = $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->getJson('/api/attendance/summary');

        $summaryRes->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'today_total' => 1,
                    'today_admitted' => 1,
                    'currently_inside' => 1,
                ],
            ]);
    }

    public function test_member_can_only_view_own_attendance_history(): void
    {
        [$receptionist, $receptionistToken] = $this->createUserWithRole('receptionist');
        [$member1, , $token1] = $this->createMemberWithProfile('Member Alpha');
        [$member2] = $this->createMemberWithProfile('Member Beta');
        $plan = $this->createPlan();

        $this->createActiveSubscription($member1, $plan);
        $this->createActiveSubscription($member2, $plan);

        // Check in Member 1
        $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'member_id' => $member1->id,
            ]);

        // Check in Member 2
        $this->withHeader('Authorization', "Bearer {$receptionistToken}")
            ->postJson('/api/attendance/check-in', [
                'member_id' => $member2->id,
            ]);

        // Switch user to Member 1
        $this->app['auth']->forgetGuards();

        $response = $this->withHeader('Authorization', "Bearer {$token1}")
            ->getJson('/api/attendance');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($member1->id, $response->json('data.0.member_id'));
    }
}
