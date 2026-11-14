<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Models\MemberProfile;
use App\Models\Role;
use App\Models\TrainerAssignment;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\GymMailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class MemberController extends Controller
{
    /**
     * Check if a phone number or email is already taken before submitting.
     */
    public function checkContact(Request $request): JsonResponse
    {
        $phone = $request->query('phone');
        $email = $request->query('email');
        $excludeUserId = $request->integer('exclude_user_id') ?: null;

        $response = [
            'phone_taken' => false,
            'phone_message' => null,
            'email_taken' => false,
            'email_message' => null,
        ];

        if (! empty($phone)) {
            $existingPhoneUser = User::findUserByPhone($phone, $excludeUserId);
            if ($existingPhoneUser) {
                $response['phone_taken'] = true;
                $response['phone_message'] = "The phone number is already registered to {$existingPhoneUser->name}.";
            }
        }

        if (! empty($email)) {
            $existingEmailUser = User::where('email', strtolower(trim($email)))
                ->when($excludeUserId, fn($q) => $q->where('id', '!=', $excludeUserId))
                ->first();
            if ($existingEmailUser) {
                $response['email_taken'] = true;
                $response['email_message'] = "The email address is already registered to {$existingEmailUser->name}.";
            }
        }

        return response()->json($response, Response::HTTP_OK);
    }

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

        // Search: member_code, name, email, phone, plan
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('member_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere(function ($pq) use ($search) {
                             $pq->wherePhoneMatches($search);
                         });
                  })
                  ->orWhereHas('subscriptions.membershipPlan', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
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

        // Support full export / non-paginated retrieval across all pages
        if ($request->boolean('all') || $request->integer('per_page') >= 1000) {
            $allMembers = $query->latest('id')->get();
            return response()->json([
                'data' => MemberResource::collection($allMembers),
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $allMembers->count(),
                'total' => $allMembers->count(),
            ], Response::HTTP_OK);
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
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['nullable', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'min:9', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'date_of_birth' => ['nullable', 'date', 'before:today', 'after:1920-01-01'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'min:9', 'max:30'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],
            'fitness_goals' => ['nullable', 'string', 'max:1000'],
            'health_conditions' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'Full name is required.',
            'phone.required' => 'Phone number is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'The email address is already taken by another account.',
            'date_of_birth.before' => 'Date of birth must be a past date.',
            'date_of_birth.after' => 'Please enter a realistic birth year (after 1920).',
        ]);

        // Explicit check: ensure phone number is not taken by another user/member
        if (! empty($validated['phone'])) {
            $existingPhoneUser = User::findUserByPhone($validated['phone']);
            if ($existingPhoneUser) {
                throw ValidationException::withMessages([
                    'phone' => ["The phone number '{$validated['phone']}' is already registered to another member ({$existingPhoneUser->name})."],
                ]);
            }
        }

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

        // Automatically dispatch official 1-year member card & access details to member's email
        if ($memberProfile->user) {
            GymMailService::sendMemberCard($memberProfile->user, $memberProfile);
        }

        return response()->json([
            'message' => "Member {$memberProfile->member_code} registered successfully.",
            'member' => new MemberResource($memberProfile->load(['user', 'subscriptions.membershipPlan'])),
        ], Response::HTTP_CREATED);
    }

    /**
     * Send or resend member permanent card to their registered email.
     */
    public function sendCardEmail(MemberProfile $member): JsonResponse
    {
        $this->authorize('view', $member);

        $user = $member->user;
        if (! $user || empty($user->email) || str_ends_with($user->email, '@members.tigatgym.com')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Member does not have a valid personal email address registered.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $sent = GymMailService::sendMemberCard($user, $member);

        if ($sent) {
            return response()->json([
                'status' => 'success',
                'message' => "Permanent member card emailed successfully to {$user->email}.",
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Could not send email. Please check server email/SMTP configuration.',
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
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

        if ($request->has('blood_type') && is_string($request->blood_type)) {
            $request->merge(['blood_type' => strtoupper(trim($request->blood_type))]);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:255'],
            'email' => ['nullable', 'string', 'email:rfc', 'max:255', 'unique:users,email,' . $member->user_id],
            'phone' => ['sometimes', 'string', 'min:9', 'max:30'],
            'status' => ['sometimes', 'string', 'in:active,inactive,suspended'],
            'suspension_reason' => ['nullable', 'string', 'max:1000'],
            'date_of_birth' => ['nullable', 'date', 'before:today', 'after:1920-01-01'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'address' => ['nullable', 'string', 'max:500'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'min:9', 'max:30'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:50'],
            'fitness_goals' => ['nullable', 'string', 'max:1000'],
            'health_conditions' => ['nullable', 'string', 'max:1000'],
        ], [
            'email.unique' => 'The email address is already taken by another account.',
            'email.email' => 'Please enter a valid email address.',
            'date_of_birth.before' => 'Date of birth must be a past date.',
            'date_of_birth.after' => 'Please enter a realistic birth year (after 1920).',
        ]);

        // Explicit check: ensure phone number is not taken by another user/member
        if (! empty($validated['phone'])) {
            $existingPhoneUser = User::findUserByPhone($validated['phone'], $member->user_id);
            if ($existingPhoneUser) {
                throw ValidationException::withMessages([
                    'phone' => ["The phone number '{$validated['phone']}' is already registered to another member ({$existingPhoneUser->name})."],
                ]);
            }
        }

        $oldProfileValues = $member->only([
            'gender', 'blood_type', 'address', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relationship',
            'fitness_goals', 'health_conditions',
        ]);

        DB::transaction(function () use ($member, $validated, $isStaff) {
            // Update User fields
            $userFields = [];
            if (isset($validated['name'])) $userFields['name'] = $validated['name'];
            if (array_key_exists('email', $validated)) {
                if (! empty($validated['email'])) {
                    $userFields['email'] = $validated['email'];
                } else {
                    $userFields['email'] = strtolower(str_replace('-', '', $member->member_code)) . '@members.tigatgym.com';
                }
            }
            if (isset($validated['phone'])) $userFields['phone'] = $validated['phone'];
            if ($isStaff && isset($validated['status'])) {
                $userFields['status'] = $validated['status'];
                if ($validated['status'] === 'suspended') {
                    $userFields['suspension_reason'] = $request->input('suspension_reason') ?? $member->user->suspension_reason ?? 'Administrative suspension';
                    $userFields['suspended_at'] = now();
                    $userFields['suspended_by'] = $currentUser->id;
                    $member->user->tokens()->delete();
                } elseif ($validated['status'] === 'active') {
                    $userFields['suspension_reason'] = null;
                    $userFields['suspended_at'] = null;
                    $userFields['suspended_by'] = null;
                }
            } elseif (array_key_exists('suspension_reason', $validated)) {
                $userFields['suspension_reason'] = $validated['suspension_reason'];
            }

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

        // Invalidate cached dashboard metrics so alerts show immediately
        Cache::forget('reception_dashboard_stats_'.today()->toDateString());

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
                $user->subscriptions()->update(['status' => 'cancelled']);
                $user->attendanceRecords()->delete();
                \App\Models\ClassBooking::where('member_id', $user->id)->update(['status' => 'cancelled']);
                $user->delete();
            }
            $member->delete();

            // Clear Reception and Admin Dashboard Caches so deleted member is reflected immediately
            Cache::forget('reception_dashboard_stats_'.today()->toDateString());
            Cache::forget('reception_dashboard_stats');
            Cache::forget('admin_dashboard_stats');
            Cache::forget('admin_dashboard_stats_'.today()->toDateString());

            AuditLogger::log(
                action: 'member.deleted',
                auditable: $member,
                oldValues: ['member_code' => $member->member_code],
                newValues: null,
                notes: "Member {$member->member_code} deleted"
            );
        });

        return response()->json([
            'message' => "Member {$member->member_code} deleted successfully.",
        ], Response::HTTP_OK);
    }
}
