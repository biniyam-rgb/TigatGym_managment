<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\FitnessClass;
use App\Models\MemberProfile;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReceptionDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function createRole(string $name): Role
    {
        return Role::firstOrCreate(['name' => $name], ['display_name' => ucfirst($name), 'description' => ucfirst($name)]);
    }

    private function createUserWithRole(string $roleName): array
    {
        $role = $this->createRole($roleName);
        $user = User::factory()->create(['status' => 'active']);
        $user->roles()->attach($role->id);
        $token = $user->createToken('test-token')->plainTextToken;

        return [$user, $token];
    }

    public function test_receptionist_can_fetch_reception_dashboard(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');

        // Create some sample data
        [$member, ] = $this->createUserWithRole('member');
        MemberProfile::create([
            'user_id' => $member->id,
            'member_code' => 'TG-2001',
            'qr_code_token' => 'TIGAT-TEST-TOKEN',
        ]);

        $plan = MembershipPlan::create([
            'name' => 'Monthly Standard',
            'duration_type' => 'month',
            'duration_value' => 1,
            'price' => 1500,
            'currency' => 'ETB',
            'is_active' => true,
        ]);

        Subscription::create([
            'member_id' => $member->id,
            'membership_plan_id' => $plan->id,
            'subscription_number' => 'SUB-2001',
            'start_date' => Carbon::today()->subDays(10),
            'end_date' => Carbon::today()->addDays(3), // Expiring in 3 days
            'status' => 'active',
            'price' => 1500,
            'total_amount' => 1500,
            'currency' => 'ETB',
        ]);

        AttendanceRecord::create([
            'member_id' => $member->id,
            'check_in_time' => Carbon::now()->subMinutes(20),
            'method' => 'qr_code',
            'status' => 'admitted',
            'verified_by' => $receptionist->id,
        ]);

        [$trainer, ] = $this->createUserWithRole('trainer');
        FitnessClass::create([
            'name' => 'Morning HIIT',
            'slug' => 'morning-hiit',
            'trainer_id' => $trainer->id,
            'capacity' => 20,
            'start_time' => Carbon::today()->setHour(9)->setMinute(0),
            'end_time' => Carbon::today()->setHour(10)->setMinute(0),
            'price' => 200,
            'currency' => 'ETB',
            'status' => 'scheduled',
        ]);

        Payment::create([
            'payment_number' => 'PAY-2001',
            'user_id' => $member->id,
            'amount' => 1500,
            'currency' => 'ETB',
            'payment_method' => 'cash',
            'payment_type' => 'membership_subscription',
            'status' => 'completed',
            'paid_at' => Carbon::now(),
            'recorded_by' => $receptionist->id,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/reception/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'stats' => [
                        'active_members',
                        'today_check_ins',
                        'expected_members',
                        'expiring_memberships',
                        'currently_inside',
                        'capacity_limit',
                    ],
                    'recent_check_ins',
                    'membership_alerts',
                    'today_activities',
                    'today_classes',
                    'notifications',
                    'receptionist' => [
                        'name',
                        'role',
                        'current_date',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertEquals(1, $data['stats']['active_members']);
        $this->assertEquals(1, $data['stats']['today_check_ins']);
        $this->assertEquals(1, $data['stats']['expiring_memberships']);
        $this->assertNotEmpty($data['recent_check_ins']);
        $this->assertNotEmpty($data['membership_alerts']);
        $this->assertNotEmpty($data['today_classes']);
    }

    public function test_admin_can_also_access_reception_dashboard(): void
    {
        [, $adminToken] = $this->createUserWithRole('admin');

        $response = $this->withHeader('Authorization', "Bearer {$adminToken}")
            ->getJson('/api/reception/dashboard');

        $response->assertStatus(200);
    }

    public function test_member_is_forbidden_from_reception_dashboard(): void
    {
        [, $memberToken] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', "Bearer {$memberToken}")
            ->getJson('/api/reception/dashboard');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_reception_dashboard(): void
    {
        $response = $this->getJson('/api/reception/dashboard');

        $response->assertStatus(401);
    }
}
