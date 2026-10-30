<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Models\MemberProfile;
use App\Models\Role;
use App\Models\TrainerAssignment;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class MemberController extends Controller
{
    /**
     * Display a listing of gym members.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', MemberProfile::class);

        $currentUser = $request->user();
        $query = MemberProfile::with(['user', 'subscriptions.membershipPlan']);

        // Trainers can only view members actively assigned to them
        if ($currentUser->hasRole('trainer') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            $assignedMemberUserIds = TrainerAssignment::where('trainer_id', $currentUser->id)
                ->where('status', 'active')
                ->pluck('member_id');

            $query->whereIn('user_id', $assignedMemberUserIds);
        }

        // Search: member_code, name, email, phone
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('member_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by user account status
        if ($request->filled('status')) {
            $status = $request->status;
            $query->whereHas('user', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        // Filter by gender
        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        $members = $query->latest('id')->paginate($request->integer('per_page', 15));

        return response()->json([
            'data' => MemberResource::collection($members->items()),
            'current_page' => $members->currentPage(),
            'last_page' => $members->lastPage(),
            'per_page' => $members->perPage(),
            'total' => $members->total(),
        ], Response::HTTP_OK);
    }

    /**
     * Store a newly created gym member.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', MemberProfile::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'max:10'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],
            'fitness_goals' => ['nullable', 'string', 'max:1000'],
            'health_conditions' => ['nullable', 'string', 'max:1000'],
        ]);

        $memberProfile = DB::transaction(function () use ($validated) {
            $memberCode = MemberProfile::generateNextMemberCode();
            $qrToken = MemberProfile::generateUniqueQrToken();

            // Fallback email if member does not provide one
            $email = ! empty($validated['email'])
                ? $validated['email']
                : strtolower(str_replace('-', '', $memberCode)) . '@members.tigatgym.com';

            // User account creation
            $user = User::create([
                'name' => $validated['name'],
                'email' => $email,
                'phone' => $validated['phone'],
                'status' => 'active',
                'password' => Hash::make($validated['password'] ?? 'Password123!'),
            ]);

            $memberRole = Role::where('name', 'member')->firstOrFail();
            $user->roles()->attach($memberRole->id);

            // Member profile creation
            $profile = MemberProfile::create([
                'user_id' => $user->id,
                'member_code' => $memberCode,
                'qr_code_token' => $qrToken,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'blood_type' => $validated['blood_type'] ?? null,
                'address' => $validated['address'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'emergency_contact_relationship' => $validated['emergency_contact_relationship'] ?? null,
                'fitness_goals' => $validated['fitness_goals'] ?? null,
                'health_conditions' => $validated['health_conditions'] ?? null,
                'joined_at' => now(),
            ]);

            AuditLogger::log(
                action: 'member.created',
                auditable: $profile,
                oldValues: null,
                newValues: [
                    'member_code' => $memberCode,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'email' => $user->email,
                ],
                notes: "Registered member {$memberCode} ({$user->name})"
            );

            return $profile;
        });

        return response()->json([
            'message' => "Member {$memberProfile->member_code} registered successfully.",
            'member' => new MemberResource($memberProfile->load(['user', 'subscriptions.membershipPlan'])),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified member profile.
     */
    public function show(MemberProfile $member): JsonResponse
    {
        $this->authorize('view', $member);

        return response()->json([
            'member' => new MemberResource($member->load(['user', 'subscriptions.membershipPlan'])),
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified member profile.
     */
    public function update(Request $request, MemberProfile $member): JsonResponse
    {
        $this->authorize('update', $member);

        $currentUser = $request->user();
        $isStaff = $currentUser->hasAnyRole('owner', 'admin', 'receptionist');

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users,email,' . $member->user_id],
            'phone' => ['sometimes', 'string', 'max:30'],
            'status' => ['sometimes', 'string', 'in:active,inactive,suspended'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'max:10'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],
            'fitness_goals' => ['nullable', 'string', 'max:1000'],
            'health_conditions' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldProfileValues = $member->only([
            'gender', 'blood_type', 'address', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship',
            'fitness_goals', 'health_conditions',
        ]);

        DB::transaction(function () use ($member, $validated, $isStaff) {
            // Update User fields
            $userFields = [];
            if (isset($validated['name'])) $userFields['name'] = $validated['name'];
            if (isset($validated['email'])) $userFields['email'] = $validated['email'];
            if (isset($validated['phone'])) $userFields['phone'] = $validated['phone'];
            if ($isStaff && isset($validated['status'])) $userFields['status'] = $validated['status'];

            if (! empty($userFields)) {
                $member->user->update($userFields);
            }

            // Update MemberProfile fields
            $profileFields = array_intersect_key($validated, array_flip([
                'date_of_birth', 'gender', 'blood_type', 'address',
                'emergency_contact_name', 'emergency_contact_phone',
                'emergency_contact_relationship', 'fitness_goals', 'health_conditions',
            ]));

            if (! empty($profileFields)) {
                $member->update($profileFields);
            }
        });

        AuditLogger::log(
            action: 'member.updated',
            auditable: $member,
            oldValues: $oldProfileValues,
            newValues: $validated,
            notes: "Updated member {$member->member_code} profile"
        );

        return response()->json([
            'message' => "Member {$member->member_code} updated successfully.",
            'member' => new MemberResource($member->fresh(['user', 'subscriptions.membershipPlan'])),
        ], Response::HTTP_OK);
    }

    /**
     * Regenerate a member's QR identification token.
     */
    public function regenerateQr(MemberProfile $member): JsonResponse
    {
        $this->authorize('regenerateQr', $member);

        $newToken = MemberProfile::generateUniqueQrToken();
        $oldToken = $member->qr_code_token;

        $member->update(['qr_code_token' => $newToken]);

        AuditLogger::log(
            action: 'member.qr_regenerated',
            auditable: $member,
            oldValues: ['qr_code_token' => '[REDACTED]'],
            newValues: ['qr_code_token' => '[REDACTED]'],
            notes: "Regenerated QR token for member {$member->member_code}"
        );

        return response()->json([
            'message' => "QR identification token regenerated for {$member->member_code}.",
            'member' => new MemberResource($member->fresh(['user', 'subscriptions.membershipPlan'])),
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified member.
     */
    public function destroy(MemberProfile $member): JsonResponse
    {
        $this->authorize('delete', $member);

        DB::transaction(function () use ($member) {
            $user = $member->user;
            if ($user) {
                $user->tokens()->delete();
                $user->delete();
            }
            $member->delete();

            AuditLogger::log(
                action: 'member.deleted',
                auditable: $member,
                oldValues: ['member_code' => $member->member_code],
                newValues: null,
                notes: "Member {$member->member_code} soft-deleted"
            );
        });

        return response()->json([
            'message' => "Member {$member->member_code} deleted successfully.",
        ], Response::HTTP_OK);
    }
}
