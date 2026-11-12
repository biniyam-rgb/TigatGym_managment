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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
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

        // Auto-rehash password to optimal 10 rounds if needed
        if (Hash::needsRehash($user->password)) {
            $user->password = Hash::make($validated['password']);
            $user->save();
        }

        // Prune previous auth tokens for this user to keep token table lean & fast
        $user->tokens()->where('name', 'gymcore_auth')->delete();

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
     * Update authenticated user's profile, avatar, and personal details.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email:rfc', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'avatar' => ['nullable'],
            'remove_avatar' => ['sometimes', 'boolean'],

            // Member-specific fields
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'max:10'],
            'address' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:100'],

            // Trainer-specific fields
            'specialization' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'certifications' => ['nullable', 'string', 'max:500'],
        ], [
            'name.required' => 'Full name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address is already registered to another account.',
        ]);

        if (! empty($validated['phone'])) {
            $existingPhoneUser = User::findUserByPhone($validated['phone'], $user->id);
            if ($existingPhoneUser) {
                throw ValidationException::withMessages([
                    'phone' => ["The phone number '{$validated['phone']}' is already registered to another user ({$existingPhoneUser->name})."],
                ]);
            }
        }

        $oldValues = $user->only(['name', 'email', 'phone', 'avatar']);

        // Handle Avatar removal or upload
        if ($request->boolean('remove_avatar')) {
            if ($user->avatar && str_starts_with($user->avatar, '/storage/avatars/')) {
                $filePath = str_replace('/storage/', '', $user->avatar);
                Storage::disk('public')->delete($filePath);
            }
            $user->avatar = null;
        } elseif ($request->hasFile('avatar')) {
            $request->validate([
                'avatar' => ['image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            ]);
            $file = $request->file('avatar');
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            $user->avatar = '/storage/' . $path;
        } elseif ($request->filled('avatar') && is_string($request->input('avatar'))) {
            $avatarStr = $request->input('avatar');
            if (str_starts_with($avatarStr, 'data:image')) {
                $parts = explode(',', $avatarStr, 2);
                if (count($parts) === 2) {
                    $decoded = base64_decode($parts[1]);
                    $ext = 'jpg';
                    if (str_contains($parts[0], 'png')) $ext = 'png';
                    elseif (str_contains($parts[0], 'webp')) $ext = 'webp';
                    $filename = 'avatar_' . $user->id . '_' . time() . '.' . $ext;
                    Storage::disk('public')->put('avatars/' . $filename, $decoded);
                    $user->avatar = '/storage/avatars/' . $filename;
                }
            } else {
                $user->avatar = $avatarStr;
            }
        }

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (array_key_exists('phone', $validated)) $user->phone = $validated['phone'];

        $user->save();

        // Update member profile if user has one
        if ($user->memberProfile) {
            $memberData = array_intersect_key($validated, array_flip([
                'date_of_birth', 'gender', 'blood_type', 'address',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            ]));
            if (! empty($memberData)) {
                $user->memberProfile->update($memberData);
            }
        }

        // Update trainer profile if user has one
        if ($user->trainerProfile) {
            $trainerData = array_intersect_key($validated, array_flip([
                'specialization', 'bio', 'certifications',
            ]));
            if (! empty($trainerData)) {
                $user->trainerProfile->update($trainerData);
            }
        }

        AuditLogger::log(
            action: 'auth.profile_updated',
            auditable: $user,
            oldValues: $oldValues,
            newValues: $user->only(['name', 'email', 'phone', 'avatar']),
            notes: 'User updated personal profile details',
            userId: $user->id
        );

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => new UserResource($user->fresh(['roles', 'memberProfile', 'trainerProfile'])),
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
