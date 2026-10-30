<?php

namespace Tests\Feature;

use App\Models\MemberProfile;
use App\Models\Role;
use App\Models\TrainerAssignment;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MemberManagementTest extends TestCase
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

    public function test_receptionist_can_register_new_member_with_auto_generated_code_and_qr(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', [
                'name' => 'Abebe Bikila',
                'phone' => '+251911223344',
                'email' => 'abebe@example.com',
                'gender' => 'male',
                'blood_type' => 'O+',
                'emergency_contact_name' => 'Almaz Bikila',
                'emergency_contact_phone' => '+251911998877',
                'emergency_contact_relationship' => 'Sister',
                'fitness_goals' => 'Cardio endurance and weight loss',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'member' => [
                    'id',
                    'user_id',
                    'member_code',
                    'name',
                    'phone',
                    'email',
                    'qr_code_token',
                    'emergency_contact_name',
                ],
            ]);

        $memberCode = $response->json('member.member_code');
        $this->assertStringStartsWith('TG-', $memberCode);
        $this->assertNotEmpty($response->json('member.qr_code_token'));

        $this->assertDatabaseHas('users', ['email' => 'abebe@example.com']);
        $this->assertDatabaseHas('member_profiles', ['member_code' => $memberCode]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'member.created']);
    }

    public function test_member_codes_increment_sequentially(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');

        $res1 = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', [
                'name' => 'First Member',
                'phone' => '+251911000001',
            ]);
        $res1->assertStatus(201);
        $code1 = $res1->json('member.member_code');

        $res2 = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', [
                'name' => 'Second Member',
                'phone' => '+251911000002',
            ]);
        $res2->assertStatus(201);
        $code2 = $res2->json('member.member_code');

        $this->assertEquals('TG-0001', $code1);
        $this->assertEquals('TG-0002', $code2);
    }

    public function test_receptionist_can_list_and_search_members(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', [
                'name' => 'Kenenisa Bekele',
                'phone' => '+251922334455',
            ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', [
                'name' => 'Derartu Tulu',
                'phone' => '+251933445566',
            ]);

        $searchRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/members?search=Kenenisa');

        $searchRes->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.name', 'Kenenisa Bekele');
    }

    public function test_admin_can_update_member_details(): void
    {
        [$admin, $token] = $this->createUserWithRole('admin');

        $createRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', [
                'name' => 'Haile G',
                'phone' => '+251911556677',
            ]);
        $memberId = $createRes->json('member.id');

        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson("/api/members/{$memberId}", [
                'name' => 'Haile Gebrselassie',
                'fitness_goals' => 'Marathon training',
                'emergency_contact_name' => 'Aster',
            ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('member.name', 'Haile Gebrselassie')
            ->assertJsonPath('member.fitness_goals', 'Marathon training');
    }

    public function test_receptionist_can_regenerate_compromised_qr_token(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');

        $createRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', [
                'name' => 'Tirunesh Dibaba',
                'phone' => '+251911443322',
            ]);
        $memberId = $createRes->json('member.id');
        $oldQrToken = $createRes->json('member.qr_code_token');

        $regenRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/members/{$memberId}/regenerate-qr");

        $regenRes->assertStatus(200);
        $newQrToken = $regenRes->json('member.qr_code_token');

        $this->assertNotEquals($oldQrToken, $newQrToken);
        $this->assertStringStartsWith('TIGAT-', $newQrToken);
    }

    public function test_receptionist_cannot_delete_member_but_admin_can(): void
    {
        [$receptionist, $recToken] = $this->createUserWithRole('receptionist');
        [$admin, $adminToken] = $this->createUserWithRole('admin');

        $createRes = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/members', [
                'name' => 'Sileshi Sihine',
                'phone' => '+251911887766',
            ]);
        $memberId = $createRes->json('member.id');

        // Clear cached auth between different users in test
        $this->app['auth']->forgetGuards();

        // Receptionist attempts deletion -> 403 Forbidden
        $deniedRes = $this->withHeader('Authorization', 'Bearer ' . $recToken)
            ->deleteJson("/api/members/{$memberId}");
        $deniedRes->assertStatus(403);

        $this->app['auth']->forgetGuards();

        // Admin attempts deletion -> 200 OK
        $allowedRes = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->deleteJson("/api/members/{$memberId}");
        $allowedRes->assertStatus(200);

        $this->assertSoftDeleted('member_profiles', ['id' => $memberId]);
    }

    public function test_member_cannot_view_another_members_profile(): void
    {
        [$receptionist, $recToken] = $this->createUserWithRole('receptionist');

        $mem1Res = $this->withHeader('Authorization', 'Bearer ' . $recToken)
            ->postJson('/api/members', [
                'name' => 'Member One',
                'phone' => '+251911000010',
            ]);
        $member1Id = $mem1Res->json('member.id');

        $mem2Res = $this->withHeader('Authorization', 'Bearer ' . $recToken)
            ->postJson('/api/members', [
                'name' => 'Member Two',
                'phone' => '+251911000020',
            ]);
        $member2UserId = $mem2Res->json('member.user_id');

        $user2 = User::find($member2UserId);
        $user2Token = $user2->createToken('token')->plainTextToken;

        $this->app['auth']->forgetGuards();

        // Member Two tries to view Member One -> 403 Forbidden
        $response = $this->withHeader('Authorization', 'Bearer ' . $user2Token)
            ->getJson("/api/members/{$member1Id}");

        $response->assertStatus(403);
    }

    public function test_trainer_can_view_assigned_member_but_not_unassigned(): void
    {
        [$trainer, $trainerToken] = $this->createUserWithRole('trainer');
        [$admin, $adminToken] = $this->createUserWithRole('admin');

        // Create Member A (assigned)
        $resA = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/members', ['name' => 'Assigned Member', 'phone' => '+251911111111']);
        $memberA = MemberProfile::find($resA->json('member.id'));

        // Create Member B (unassigned)
        $resB = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/members', ['name' => 'Unassigned Member', 'phone' => '+251922222222']);
        $memberB = MemberProfile::find($resB->json('member.id'));

        // Assign Member A to Trainer
        TrainerAssignment::create([
            'trainer_id' => $trainer->id,
            'member_id' => $memberA->user_id,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        $this->app['auth']->forgetGuards();

        // Trainer views assigned member -> 200 OK
        $assignedRes = $this->withHeader('Authorization', 'Bearer ' . $trainerToken)
            ->getJson("/api/members/{$memberA->id}");
        $assignedRes->assertStatus(200);

        // Trainer views unassigned member -> 403 Forbidden
        $unassignedRes = $this->withHeader('Authorization', 'Bearer ' . $trainerToken)
            ->getJson("/api/members/{$memberB->id}");
        $unassignedRes->assertStatus(403);
    }

    public function test_registration_requires_name_and_phone(): void
    {
        [$receptionist, $token] = $this->createUserWithRole('receptionist');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/members', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'phone']);
    }
}
