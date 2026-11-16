<?php

namespace Tests\Feature;

use App\Models\MembershipPlan;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\TrainerAssignment;
use App\Models\TrainerProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrainerManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['owner', 'admin', 'receptionist', 'trainer', 'member'] as $roleName) {
            Role::firstOrCreate(['name' => $roleName], [
                'display_name' => ucfirst($roleName),
                'description' => ucfirst($roleName),
            ]);
        }
    }

    protected function createUserWithRole(string $role): array
    {
        $user = User::factory()->create([
            'email' => "{$role}_" . uniqid() . "@tigatgym.com",
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
        ]);
        $roleModel = Role::where('name', $role)->firstOrFail();
        $user->roles()->attach($roleModel->id);
        $token = $user->createToken('test_token')->plainTextToken;

        return [$user, $token];
    }

    public function test_admin_can_register_new_trainer_with_monthly_fee_and_shift(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');

        $payload = [
            'name' => 'Coach Abel Tesfaye',
            'email' => 'abel.coach@tigatgym.com',
            'phone' => '+251911888999',
            'specialization' => 'Bodybuilding & Hypertrophy',
            'shift' => 'morning',
            'monthly_fee' => 2000,
            'bio' => 'Certified trainer specializing in muscle building and strength mechanics.',
            'certifications' => 'ISSA Certified, CPR Certified',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/trainers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Coach Abel Tesfaye');

        $this->assertDatabaseHas('users', [
            'email' => 'abel.coach@tigatgym.com',
            'name' => 'Coach Abel Tesfaye',
        ]);

        $this->assertDatabaseHas('trainer_profiles', [
            'specialization' => 'Bodybuilding & Hypertrophy',
            'shift' => 'morning',
            'monthly_fee' => 2000.00,
        ]);
    }

    public function test_admin_can_update_trainer_profile_and_fee(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$trainer, ] = $this->createUserWithRole('trainer');

        TrainerProfile::create([
            'user_id' => $trainer->id,
            'trainer_code' => 'TR-099',
            'specialization' => 'Fitness',
            'shift' => 'morning',
            'monthly_fee' => 1500,
            'is_available' => true,
        ]);

        $updatePayload = [
            'name' => 'Coach Sara Bekele (Master Coach)',
            'specialization' => 'Functional Strength & Rehabilitation',
            'shift' => 'evening',
            'monthly_fee' => 2500,
            'status' => 'active',
        ];

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/trainers/{$trainer->id}", $updatePayload);

        $res->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('users', [
            'id' => $trainer->id,
            'name' => 'Coach Sara Bekele (Master Coach)',
        ]);

        $this->assertDatabaseHas('trainer_profiles', [
            'user_id' => $trainer->id,
            'specialization' => 'Functional Strength & Rehabilitation',
            'shift' => 'evening',
            'monthly_fee' => 2500.00,
        ]);
    }

    public function test_admin_and_receptionist_can_assign_member_to_trainer(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');
        [$trainer, ] = $this->createUserWithRole('trainer');
        [$member, ] = $this->createUserWithRole('member');

        TrainerProfile::create([
            'user_id' => $trainer->id,
            'trainer_code' => 'TR-010',
            'specialization' => 'Fat Loss',
            'monthly_fee' => 1800,
        ]);

        $assignPayload = [
            'trainer_id' => $trainer->id,
            'member_id' => $member->id,
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDays(30)->toDateString(),
            'notes' => '12-week body transformation client',
        ];

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/trainers/assign', $assignPayload);

        $res->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('trainer_assignments', [
            'trainer_id' => $trainer->id,
            'member_id' => $member->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_change_or_switch_members_trainer_with_notes(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$oldTrainer, ] = $this->createUserWithRole('trainer');
        [$newTrainer, ] = $this->createUserWithRole('trainer');
        [$member, ] = $this->createUserWithRole('member');

        TrainerProfile::create([
            'user_id' => $oldTrainer->id,
            'trainer_code' => 'TR-001',
            'specialization' => 'Strength',
            'monthly_fee' => 1500,
        ]);

        TrainerProfile::create([
            'user_id' => $newTrainer->id,
            'trainer_code' => 'TR-002',
            'specialization' => 'Mobility',
            'monthly_fee' => 2000,
        ]);

        // Old assignment active
        $oldAssignment = TrainerAssignment::create([
            'trainer_id' => $oldTrainer->id,
            'member_id' => $member->id,
            'assigned_by' => $admin->id,
            'status' => 'active',
            'start_date' => Carbon::today()->subDays(10),
            'end_date' => Carbon::today()->addDays(20),
            'notes' => 'Initial coach assignment',
        ]);

        // Reassign to new trainer
        $reassignPayload = [
            'member_id' => $member->id,
            'new_trainer_id' => $newTrainer->id,
            'reason' => 'Schedule changed from morning to evening',
        ];

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/trainers/change', $reassignPayload);

        $res->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Check old assignment is marked 'transferred'
        $this->assertEquals('transferred', $oldAssignment->fresh()->status);

        // Check new assignment is active with new trainer
        $this->assertDatabaseHas('trainer_assignments', [
            'trainer_id' => $newTrainer->id,
            'member_id' => $member->id,
            'status' => 'active',
        ]);
    }

    public function test_existing_member_can_add_trainer_with_fee_payment(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$trainer, ] = $this->createUserWithRole('trainer');
        [$member, ] = $this->createUserWithRole('member');

        TrainerProfile::create([
            'user_id' => $trainer->id,
            'trainer_code' => 'TR-005',
            'specialization' => 'HIIT',
            'monthly_fee' => 2000,
        ]);

        $payload = [
            'member_id' => $member->id,
            'trainer_id' => $trainer->id,
            'payment_method' => 'cash',
            'notes' => 'Added personal trainer for month of November',
        ];

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/trainers/assign-with-payment', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('status', 'success');

        // Verify payment record created specifically for trainer_fee
        $this->assertDatabaseHas('payments', [
            'user_id' => $member->id,
            'payment_type' => 'trainer_fee',
            'amount' => 2000.00,
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);

        // Verify assignment created
        $this->assertDatabaseHas('trainer_assignments', [
            'member_id' => $member->id,
            'trainer_id' => $trainer->id,
            'status' => 'active',
        ]);
    }
}
