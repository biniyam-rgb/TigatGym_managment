<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\MemberProfile;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Register a new member account and issue Sanctum token.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:25'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:25'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],
            'fitness_goals' => ['nullable', 'string', 'max:1000'],
            'health_conditions' => ['nullable', 'string', 'max:1000'],
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => strtolower(trim($validated['email'])),
                'phone' => $validated['phone'],
                'status' => 'active',
                'password' => Hash::make($validated['password']),
            ]);

            // Assign default 'member' role
            $memberRole = Role::where('name', 'member')->firstOrFail();
            $user->roles()->attach($memberRole->id);

            // Generate next sequential member code & QR token
            $memberCode = MemberProfile::generateNextMemberCode();
            $qrToken = MemberProfile::generateUniqueQrToken();

            $profile = MemberProfile::create([
                'user_id' => $user->id,
                'member_code' => $memberCode,
                'qr_code_token' => $qrToken,
                'gender' => $validated['gender'] ?? null,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'emergency_contact_relationship' => $validated['emergency_contact_relationship'] ?? null,
                'fitness_goals' => $validated['fitness_goals'] ?? null,
                'health_conditions' => $validated['health_conditions'] ?? null,
                'joined_at' => now()->toDateString(),
            ]);

            AuditLogger::log(
                action: 'auth.registered',
                auditable: $user,
                newValues: [
                    'member_code' => $memberCode,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
                notes: "New member self-registered online: {$user->name} ({$memberCode})",
                userId: $user->id
            );

            return [$user, $profile];
        });

        [$user] = $result;
        $user->load(['roles', 'memberProfile']);

        // Issue Sanctum personal access token for immediate session
        $token = $user->createToken('gymcore_auth')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Registration successful! Welcome to TIGAT GYM.',
            'token' => $token,
            'user' => new UserResource($user),
        ], Response::HTTP_CREATED);
    }

    /**
     * Authenticate user and issue Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('roles')->where('email', $validated['email'])->first();

        // Generic error message for invalid credentials to prevent email enumeration
        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            AuditLogger::log(
                action: 'auth.login_failed',
                auditable: null,
                oldValues: null,
                newValues: ['email' => $validated['email']],
                notes: 'Invalid credentials attempted'
            );

            return response()->json([
                'message' => 'Invalid credentials.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Account status verification
        if ($user->isSuspended()) {
            AuditLogger::log(
                action: 'auth.login_blocked_suspended',
                auditable: $user,
                oldValues: null,
                newValues: ['status' => $user->status],
                notes: 'Login attempt on suspended account',
                userId: $user->id
            );

            return response()->json([
                'message' => 'Your account has been suspended. Please contact gym management.',
                'status' => 'suspended',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user->isInactive()) {
            AuditLogger::log(
                action: 'auth.login_blocked_inactive',
                auditable: $user,
                oldValues: null,
                newValues: ['status' => $user->status],
                notes: 'Login attempt on inactive account',
                userId: $user->id
            );

            return response()->json([
                'message' => 'Your account is inactive. Please contact gym management.',
                'status' => 'inactive',
            ], Response::HTTP_FORBIDDEN);
        }

        // Create Sanctum personal access token
        $token = $user->createToken('gymcore_auth')->plainTextToken;

        AuditLogger::log(
            action: 'auth.login_success',
            auditable: $user,
            oldValues: null,
            newValues: ['roles' => $user->roles->pluck('name')->toArray()],
            notes: 'User logged in successfully',
            userId: $user->id
        );

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => new UserResource($user),
        ], Response::HTTP_OK);
    }

    /**
     * Log out authenticated user by revoking current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        if ($user) {
            AuditLogger::log(
                action: 'auth.logout',
                auditable: $user,
                oldValues: null,
                newValues: null,
                notes: 'User logged out and revoked current token',
                userId: $user->id
            );
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ], Response::HTTP_OK);
    }

    /**
     * Get the authenticated user's profile and roles.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'memberProfile', 'trainerProfile']);

        return response()->json([
            'user' => new UserResource($user),
        ], Response::HTTP_OK);
    }

    /**
     * Change password for authenticated user.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            AuditLogger::log(
                action: 'auth.password_change_failed',
                auditable: $user,
                oldValues: null,
                newValues: null,
                notes: 'Incorrect current password provided during password change attempt',
                userId: $user->id
            );

            return response()->json([
                'message' => 'The provided current password does not match our records.',
                'errors' => [
                    'current_password' => ['The provided current password is incorrect.'],
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user->forceFill([
            'password' => Hash::make($validated['new_password']),
        ])->save();

        // Revoke all tokens except the current one for security
        $currentTokenId = $user->currentAccessToken()?->id;
        if ($currentTokenId) {
            $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        }

        AuditLogger::log(
            action: 'auth.password_change_success',
            auditable: $user,
            oldValues: null,
            newValues: null,
            notes: 'Password updated and other active tokens invalidated',
            userId: $user->id
        );

        return response()->json([
            'message' => 'Password updated successfully.',
        ], Response::HTTP_OK);
    }

    /**
     * Request a password reset token.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        $token = null;
        if ($user) {
            $plainToken = Str::random(60);

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($plainToken),
                    'created_at' => now(),
                ]
            );

            AuditLogger::log(
                action: 'auth.forgot_password_requested',
                auditable: $user,
                oldValues: null,
                newValues: ['email' => $user->email],
                notes: 'Password reset link/token generated',
                userId: $user->id
            );

            if (app()->environment('local', 'testing')) {
                $token = $plainToken;
            }
        }

        // Generic response to prevent email enumeration
        $response = [
            'message' => 'If an account matches that email address, password reset instructions have been generated.',
        ];

        if ($token && app()->environment('local', 'testing')) {
            $response['debug_reset_token'] = $token;
        }

        return response()->json($response, Response::HTTP_OK);
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        // Tokens valid for 60 minutes
        if (! $record || ! Hash::check($validated['token'], $record->token) || now()->subMinutes(60)->gt($record->created_at)) {
            return response()->json([
                'message' => 'This password reset token is invalid or has expired.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json([
                'message' => 'User not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        // Invalidate all tokens for this user
        $user->tokens()->delete();

        // Clean up reset token
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        AuditLogger::log(
            action: 'auth.password_reset_success',
            auditable: $user,
            oldValues: null,
            newValues: null,
            notes: 'Password successfully reset via token and all sessions revoked',
            userId: $user->id
        );

        return response()->json([
            'message' => 'Your password has been reset successfully. You may now log in.',
        ], Response::HTTP_OK);
    }
}
