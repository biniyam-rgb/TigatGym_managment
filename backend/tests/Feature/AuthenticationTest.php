<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    protected function createUser(array $attributes = [], string $role = 'member'): User
    {
        $user = User::create(array_merge([
            'name' => 'Test User',
            'email' => 'user@example.com',
            'phone' => '+251911223344',
            'status' => 'active',
            'password' => Hash::make('CorrectPassword123!'),
        ], $attributes));

        $roleModel = Role::where('name', $role)->first();
        if ($roleModel) {
            $user->roles()->attach($roleModel->id);
        }

        return $user;
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = $this->createUser();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'CorrectPassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'status',
                    'role_names',
                    'primary_role',
                ],
            ]);

        $this->assertNotEmpty($response->json('token'));
        $this->assertEquals($user->email, $response->json('user.email'));
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        $user = $this->createUser();

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Invalid credentials.',
            ]);
    }

    public function test_user_cannot_login_with_unknown_account(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'SomePassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Invalid credentials.',
            ]);
    }

    public function test_login_requires_valid_email_and_password(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'not-an-email',
            'password' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_inactive_account_cannot_log_in(): void
    {
        $user = $this->createUser(['status' => 'inactive']);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'CorrectPassword123!',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your account is inactive. Please contact gym management.',
                'status' => 'inactive',
            ]);
    }

    public function test_suspended_account_cannot_log_in(): void
    {
        $user = $this->createUser(['status' => 'suspended']);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'CorrectPassword123!',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your account has been suspended. Please contact gym management.',
                'status' => 'suspended',
            ]);
    }

    public function test_unauthenticated_request_to_protected_route_returns_401(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_current_user_endpoint(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.status', 'active');
    }

    public function test_user_can_logout_and_revoke_token(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test_token')->plainTextToken;

        // Logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully.']);

        // Clear in-memory cached auth state between test HTTP requests
        $this->app['auth']->forgetGuards();

        // Token should now be invalid
        $afterLogoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $afterLogoutResponse->assertStatus(401);
    }

    public function test_user_can_change_password_with_correct_current_password(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/change-password', [
                'current_password' => 'CorrectPassword123!',
                'new_password' => 'BrandNewPassword99!',
                'new_password_confirmation' => 'BrandNewPassword99!',
            ]);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Password updated successfully.']);

        $user->refresh();
        $this->assertTrue(Hash::check('BrandNewPassword99!', $user->password));
    }

    public function test_password_change_fails_with_incorrect_current_password(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/change-password', [
                'current_password' => 'WrongCurrentPassword!',
                'new_password' => 'BrandNewPassword99!',
                'new_password_confirmation' => 'BrandNewPassword99!',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_suspended_user_token_is_blocked_on_protected_endpoints(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test_token')->plainTextToken;

        // User is suspended by admin
        $user->update(['status' => 'suspended']);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $response->assertStatus(403)
            ->assertJsonPath('status', 'suspended');
    }

    public function test_user_can_request_password_reset(): void
    {
        $user = $this->createUser();

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'debug_reset_token']);

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $user->email,
        ]);
    }

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = $this->createUser();

        // Request reset
        $forgotResponse = $this->postJson('/api/auth/forgot-password', [
            'email' => $user->email,
        ]);
        $resetToken = $forgotResponse->json('debug_reset_token');

        // Reset password
        $resetResponse = $this->postJson('/api/auth/reset-password', [
            'token' => $resetToken,
            'email' => $user->email,
            'password' => 'BrandNewPassword123!',
            'password_confirmation' => 'BrandNewPassword123!',
        ]);

        $resetResponse->assertStatus(200)
            ->assertJson(['message' => 'Your password has been reset successfully. You may now log in.']);

        $user->refresh();
        $this->assertTrue(Hash::check('BrandNewPassword123!', $user->password));
    }

    public function test_user_cannot_reset_password_with_invalid_token(): void
    {
        $user = $this->createUser();

        $resetResponse = $this->postJson('/api/auth/reset-password', [
            'token' => 'invalid_or_expired_token',
            'email' => $user->email,
            'password' => 'BrandNewPassword123!',
            'password_confirmation' => 'BrandNewPassword123!',
        ]);

        $resetResponse->assertStatus(422)
            ->assertJson(['message' => 'This password reset token is invalid or has expired.']);
    }

    public function test_new_member_can_self_register_online_and_receive_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Sara Daniel',
            'email' => 'sara.daniel@example.com',
            'phone' => '+251911889900',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'gender' => 'female',
            'date_of_birth' => '1998-05-12',
            'fitness_goals' => 'Strength conditioning & mobility',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonStructure([
                'status',
                'message',
                'token',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'status',
                    'role_names',
                    'primary_role',
                    'member_profile' => [
                        'member_code',
                        'qr_code_token',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'sara.daniel@example.com',
            'status' => 'active',
        ]);

        $memberCode = $response->json('user.member_profile.member_code');
        $this->assertMatchesRegularExpression('/^TG-\d{4}$/', $memberCode);

        $this->assertDatabaseHas('member_profiles', [
            'member_code' => $memberCode,
            'gender' => 'female',
        ]);
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        $this->createUser(['email' => 'existing@tigatgym.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Another User',
            'email' => 'existing@tigatgym.com',
            'phone' => '+251911999999',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_fails_with_password_mismatch_or_short_password(): void
    {
        // Short password
        $shortResponse = $this->postJson('/api/auth/register', [
            'name' => 'Short Pass',
            'email' => 'short@example.com',
            'phone' => '+251911999999',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $shortResponse->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // Password mismatch
        $mismatchResponse = $this->postJson('/api/auth/register', [
            'name' => 'Mismatch Pass',
            'email' => 'mismatch@example.com',
            'phone' => '+251911999999',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ]);

        $mismatchResponse->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
