<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\MemberProfile;
use App\Models\Role;
use App\Models\TrainerProfile;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users with search and filter capabilities.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $currentUser = $request->user();
        $query = User::with(['roles', 'memberProfile', 'trainerProfile']);

        // Receptionists can only view members and trainers
        if ($currentUser->isReceptionist()) {
            $query->whereHas('roles', function ($q) {
                $q->whereIn('name', ['member', 'trainer']);
            });
        }

        // Search filter: name, email, phone
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere(function ($pq) use ($search) {
                      $pq->wherePhoneMatches($search);
                  });
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->latest('id')->paginate($request->integer('per_page', 15));

        return response()->json($users, Response::HTTP_OK);
    }

    /**
     * Store a newly created user with designated role and auto-profile creation.
     */
    public function store(Request $request): JsonResponse
    {
        $targetRole = $request->input('role', 'member');
        $this->authorize('create', [User::class, $targetRole]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'exists:roles,name'],
            'status' => ['sometimes', 'string', 'in:active,inactive,suspended'],
            // Staff specific credentials (receptionist, admin, trainer)
            'work_shift' => ['nullable', 'string', 'max:60'],
            'desk_station' => ['nullable', 'string', 'max:100'],
            'emergency_contact' => ['nullable', 'string', 'max:100'],
            'employee_id_number' => ['nullable', 'string', 'max:50'],
            // Trainer specific credentials
            'specialization' => ['nullable', 'string', 'max:150'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'certifications' => ['nullable', 'string', 'max:500'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0'],
        ], [
            'name.required' => 'Full name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'The email address is already taken by another account.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
        ]);

        if (! empty($validated['phone'])) {
            $existingPhoneUser = User::findUserByPhone($validated['phone']);
            if ($existingPhoneUser) {
                throw ValidationException::withMessages([
                    'phone' => ["The phone number '{$validated['phone']}' is already registered to another user ({$existingPhoneUser->name})."],
                ]);
            }
        }

        $user = DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'work_shift' => $validated['work_shift'] ?? null,
                'desk_station' => $validated['desk_station'] ?? null,
                'emergency_contact' => $validated['emergency_contact'] ?? null,
                'employee_id_number' => $validated['employee_id_number'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'password' => Hash::make($validated['password']),
            ]);

            $role = Role::where('name', $validated['role'])->firstOrFail();
            $user->roles()->attach($role->id);

            // Automatically create domain profile based on role
            if ($validated['role'] === 'member') {
                $uniqueCode = MemberProfile::generateNextMemberCode();

                MemberProfile::create([
                    'user_id' => $user->id,
                    'member_code' => $uniqueCode,
                    'qr_code_token' => Str::random(40),
                    'joined_at' => now(),
                ]);
            } elseif ($validated['role'] === 'trainer') {
                $uniqueCode = 'TG-T-' . strtoupper(Str::random(6));
                while (TrainerProfile::where('trainer_code', $uniqueCode)->exists()) {
                    $uniqueCode = 'TG-T-' . strtoupper(Str::random(6));
                }

                TrainerProfile::create([
                    'user_id' => $user->id,
                    'trainer_code' => $uniqueCode,
                    'specialization' => $validated['specialization'] ?? null,
                    'bio' => $validated['bio'] ?? null,
                    'certifications' => $validated['certifications'] ?? null,
                    'hourly_rate' => $validated['hourly_rate'] ?? 0.00,
                    'is_available' => true,
                    'joined_at' => now(),
                ]);
            }

            AuditLogger::log(
                action: 'user.created',
                auditable: $user,
                oldValues: null,
                newValues: [
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $validated['role'],
                    'status' => $user->status,
                ],
                notes: "User created with role {$validated['role']}"
            );

            return $user;
        });

        return response()->json([
            'message' => 'User created successfully.',
            'user' => new UserResource($user->load(['roles', 'memberProfile', 'trainerProfile'])),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json([
            'user' => new UserResource($user->load(['roles', 'memberProfile', 'trainerProfile'])),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified user profile and status.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email:rfc', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'work_shift' => ['nullable', 'string', 'max:60'],
            'desk_station' => ['nullable', 'string', 'max:100'],
            'emergency_contact' => ['nullable', 'string', 'max:100'],
            'employee_id_number' => ['nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'string', 'in:active,inactive,suspended'],
            'suspension_reason' => ['nullable', 'string', 'max:1000'],
            'avatar' => ['nullable', 'string'],
        ], [
            'email.unique' => 'The email address is already taken by another account.',
            'email.email' => 'Please enter a valid email address.',
        ]);

        if (! empty($validated['phone'])) {
            $existingPhoneUser = User::findUserByPhone($validated['phone'], $user->id);
            if ($existingPhoneUser) {
                throw ValidationException::withMessages([
                    'phone' => ["The phone number '{$validated['phone']}' is already registered to another user ({$existingPhoneUser->name})."],
                ]);
            }
        }

        // If status change is requested, check policy
        if (isset($validated['status']) && $validated['status'] !== $user->status) {
            $this->authorize('changeStatus', [$user, $validated['status']]);
        }

        if (isset($validated['status'])) {
            if ($validated['status'] === 'suspended') {
                $validated['suspension_reason'] = $request->input('suspension_reason') ?? $user->suspension_reason ?? 'Administrative suspension';
                $validated['suspended_at'] = now();
                $validated['suspended_by'] = $request->user()->id;
            } elseif ($validated['status'] === 'active') {
                $validated['suspension_reason'] = null;
                $validated['suspended_at'] = null;
                $validated['suspended_by'] = null;
            }
        } elseif (array_key_exists('suspension_reason', $validated)) {
            $validated['suspension_reason'] = $validated['suspension_reason'];
        }

        $oldValues = $user->only(['name', 'email', 'phone', 'status', 'avatar']);

        DB::transaction(function () use ($user, $validated) {
            $user->update($validated);

            // If account is suspended or inactivated, immediately revoke all active tokens
            if (isset($validated['status']) && $validated['status'] !== 'active') {
                $user->tokens()->delete();
            }
        });

        // Invalidate cached dashboard metrics so alerts show immediately
        Cache::forget('reception_dashboard_stats_'.today()->toDateString());

        AuditLogger::log(
            action: 'user.updated',
            auditable: $user,
            oldValues: $oldValues,
            newValues: $user->only(array_keys($validated)),
            notes: 'User account updated'
        );

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => new UserResource($user->fresh(['roles', 'memberProfile', 'trainerProfile'])),
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified user (soft-delete with last active owner guard).
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        DB::transaction(function () use ($user) {
            // Revoke all tokens immediately
            $user->tokens()->delete();
            $user->delete();

            AuditLogger::log(
                action: 'user.deleted',
                auditable: $user,
                oldValues: ['email' => $user->email, 'roles' => $user->roles->pluck('name')->toArray()],
                newValues: null,
                notes: 'User soft-deleted'
            );
        });

        return response()->json([
            'message' => 'User account deleted successfully.',
        ], Response::HTTP_OK);
    }

    /**
     * Assign a role to a user.
     */
    public function assignRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'exists:roles,name'],
        ]);

        $roleName = $validated['role'];
        $this->authorize('assignRole', [$user, $roleName]);

        if ($user->hasRole($roleName)) {
            return response()->json([
                'message' => 'User already has this role assigned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($user, $roleName) {
            $user->assignRole($roleName);

            // Create profile if missing
            if ($roleName === 'member' && ! $user->memberProfile) {
                $uniqueCode = MemberProfile::generateNextMemberCode();
                MemberProfile::create([
                    'user_id' => $user->id,
                    'member_code' => $uniqueCode,
                    'qr_code_token' => Str::random(40),
                    'joined_at' => now(),
                ]);
            } elseif ($roleName === 'trainer' && ! $user->trainerProfile) {
                $uniqueCode = 'TG-T-' . strtoupper(Str::random(6));
                while (TrainerProfile::where('trainer_code', $uniqueCode)->exists()) {
                    $uniqueCode = 'TG-T-' . strtoupper(Str::random(6));
                }
                TrainerProfile::create([
                    'user_id' => $user->id,
                    'trainer_code' => $uniqueCode,
                    'is_available' => true,
                    'joined_at' => now(),
                ]);
            }

            AuditLogger::log(
                action: 'user.role_assigned',
                auditable: $user,
                oldValues: null,
                newValues: ['assigned_role' => $roleName],
                notes: "Role {$roleName} assigned to user"
            );
        });

        return response()->json([
            'message' => "Role {$roleName} assigned successfully.",
            'user' => new UserResource($user->fresh(['roles', 'memberProfile', 'trainerProfile'])),
        ], Response::HTTP_OK);
    }

    /**
     * Remove a role from a user.
     */
    public function removeRole(User $user, string $role): JsonResponse
    {
        $roleModel = Role::where('name', $role)->first();
        if (! $roleModel) {
            return response()->json([
                'message' => "Role '{$role}' does not exist.",
            ], Response::HTTP_NOT_FOUND);
        }

        $this->authorize('removeRole', [$user, $role]);

        if (! $user->hasRole($role)) {
            return response()->json([
                'message' => "User does not possess the '{$role}' role.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Must retain at least one role to prevent orphan accounts
        if ($user->roles()->count() <= 1) {
            return response()->json([
                'message' => 'Cannot remove the only role assigned to this account. Each user must have at least one role.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($user, $role) {
            $user->removeRole($role);

            AuditLogger::log(
                action: 'user.role_removed',
                auditable: $user,
                oldValues: ['removed_role' => $role],
                newValues: null,
                notes: "Role {$role} removed from user"
            );
        });

        return response()->json([
            'message' => "Role '{$role}' removed successfully.",
            'user' => new UserResource($user->fresh(['roles', 'memberProfile', 'trainerProfile'])),
        ], Response::HTTP_OK);
    }
}
