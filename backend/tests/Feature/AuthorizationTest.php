<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\TrainerAssignment;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    protected function createUserWithRole(string $role, array $attributes = []): array
    {
        $user = User::create(array_merge([
            'name' => ucfirst($role) . ' User',
            'email' => $role . '_' . uniqid() . '@example.com',
            'phone' => '+251911' . rand(100000, 999999),
            'status' => 'active',
            'password' => Hash::make('Password123!'),
        ], $attributes));

        $roleModel = Role::where('name', $role)->firstOrFail();
        $user->roles()->attach($roleModel->id);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [$user, $token];
    }

    public function test_owner_can_access_audit_logs(): void
    {
        [$owner, $token] = $this->createUserWithRole('owner');

        AuditLog::create([
            'user_id' => $owner->id,
            'action' => 'test.action',
            'ip_address' => '127.0.0.1',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/audit-logs');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'total']);
    }

    public function test_admin_cannot_access_owner_exclusive_audit_logs(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/audit-logs');

        $response->assertStatus(403);
    }

    public function test_admin_cannot_promote_user_to_owner(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$targetUser] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/users/{$targetUser->id}/roles", [
                'role' => 'owner',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_modify_owner_account(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');
        [$owner] = $this->createUserWithRole('owner');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/users/{$owner->id}", [
                'name' => 'Hacked Owner Name',
            ]);

        $response->assertStatus(403);
    }

    public function test_receptionist_cannot_manage_system_roles(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');
        [$member] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/users/{$member->id}/roles", [
                'role' => 'trainer',
            ]);

        $response->assertStatus(403);
    }

    public function test_member_cannot_view_another_members_profile(): void
    {
        [$memberA, $tokenA] = $this->createUserWithRole('member');
        [$memberB] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson("/api/users/{$memberB->id}");

        $response->assertStatus(403);
    }

    public function test_member_can_view_their_own_profile(): void
    {
        [$member, $token] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/users/{$member->id}");

        $response->assertStatus(200)
            ->assertJsonPath('user.id', $member->id);
    }

    public function test_member_cannot_modify_their_own_status(): void
    {
        [$member, $token] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/users/{$member->id}", [
                'status' => 'inactive',
            ]);

        $response->assertStatus(403);
    }

    public function test_trainer_cannot_view_unassigned_member_details(): void
    {
        [$trainer, $token] = $this->createUserWithRole('trainer');
        [$member] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/users/{$member->id}");

        $response->assertStatus(403);
    }

    public function test_trainer_can_view_assigned_member_details(): void
    {
        [$trainer, $token] = $this->createUserWithRole('trainer');
        [$member] = $this->createUserWithRole('member');

        // Assign member to trainer
        TrainerAssignment::create([
            'trainer_id' => $trainer->id,
            'member_id' => $member->id,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/users/{$member->id}");

        $response->assertStatus(200)
            ->assertJsonPath('user.id', $member->id);
    }

    public function test_cannot_assign_unknown_role(): void
    {
        [$owner, $token] = $this->createUserWithRole('owner');
        [$member] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/users/{$member->id}/roles", [
                'role' => 'super_hacker',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    public function test_cannot_assign_duplicate_role(): void
    {
        [$owner, $token] = $this->createUserWithRole('owner');
        [$member] = $this->createUserWithRole('member');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/users/{$member->id}/roles", [
                'role' => 'member',
            ]);

        $response->assertStatus(422)
            ->assertJson(['message' => 'User already has this role assigned.']);
    }

    public function test_last_active_owner_cannot_be_deleted(): void
    {
        [$owner, $token] = $this->createUserWithRole('owner');

        // Ensure there is only 1 active owner
        $this->assertEquals(1, User::role('owner')->where('status', 'active')->count());

        // Attempt to delete this owner
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson("/api/users/{$owner->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $owner->id, 'deleted_at' => null]);
    }

    public function test_last_active_owner_cannot_be_deactivated(): void
    {
        [$ownerA, $tokenA] = $this->createUserWithRole('owner');
        [$ownerB, $tokenB] = $this->createUserWithRole('owner');

        // Initially 2 owners
        $this->assertEquals(2, User::role('owner')->where('status', 'active')->count());

        // Deactivate ownerB
        $deactivateBResponse = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->putJson("/api/users/{$ownerB->id}", [
                'status' => 'inactive',
            ]);
        $deactivateBResponse->assertStatus(200);

        // Now ownerA is the only active owner
        $this->assertEquals(1, User::role('owner')->where('status', 'active')->count());

        // Another request trying to deactivate ownerA should be rejected
        $deactivateLastResponse = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->putJson("/api/users/{$ownerA->id}", [
                'status' => 'inactive',
            ]);

        $responseStatus = $deactivateLastResponse->status();
        $this->assertEquals(403, $responseStatus);
    }
}
