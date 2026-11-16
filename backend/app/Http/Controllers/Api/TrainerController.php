<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FitnessClass;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\Role;
use App\Models\TrainerAssignment;
use App\Models\TrainerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use App\Rules\ValidHumanName;
use App\Rules\ValidMoneyAmount;
use App\Rules\ValidPhone;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class TrainerController extends Controller
{
    /**
     * Handle trainer photo/avatar upload (multipart file, base64 data URI, or preset URL).
     */
    protected function handleAvatarUpload(Request $request, ?string $currentAvatar = null): ?string
    {
        if ($request->boolean('remove_avatar')) {
            if ($currentAvatar && str_starts_with($currentAvatar, '/storage/avatars/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $currentAvatar));
            }
            return null;
        }

        if ($request->hasFile('avatar')) {
            $request->validate(['avatar' => ['image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120']]);
            $file = $request->file('avatar');
            $filename = 'coach_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            return '/storage/' . $path;
        }

        $raw = $request->input('avatar') ?: $request->input('avatar_url') ?: $request->input('photo');
        if ($raw && is_string($raw) && str_starts_with($raw, 'data:image')) {
            preg_match('/^data:image\/(\w+);base64,/', $raw, $matches);
            $extension = $matches[1] ?? 'png';
            $base64Data = substr($raw, strpos($raw, ',') + 1);
            $decoded = base64_decode($base64Data);
            if ($decoded !== false) {
                $filename = 'coach_' . time() . '_' . Str::random(8) . '.' . $extension;
                Storage::disk('public')->put('avatars/' . $filename, $decoded);
                return '/storage/avatars/' . $filename;
            }
        } elseif ($raw && is_string($raw) && !str_starts_with($raw, 'data:image')) {
            return $raw;
        }

        return $currentAvatar;
    }

    /**
     * List all trainers with profiles, pricing, shifts & active client counts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::withTrashed()->role('trainer')->with(['trainerProfile' => function ($q) {
            $q->withTrashed();
        }]);

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('status', 'active')->whereNull('deleted_at');
            } else {
                $query->where(function ($sq) {
                    $sq->where('status', 'inactive')->orWhereNotNull('deleted_at');
                });
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('trainerProfile', function ($tpq) use ($search) {
                      $tpq->where('specialization', 'like', "%{$search}%")
                          ->orWhere('shift', 'like', "%{$search}%")
                          ->orWhere('trainer_code', 'like', "%{$search}%");
                  });
            });
        }

        $trainers = $query->orderBy('name')->get()->map(function ($t) {
            $activeClientsCount = TrainerAssignment::where('trainer_id', $t->id)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('end_date')
                      ->orWhere('end_date', '>=', now()->toDateString());
                })
                ->count();

            $monthlyFee = $t->trainerProfile?->monthly_fee !== null && (float) $t->trainerProfile->monthly_fee > 0
                ? (float) $t->trainerProfile->monthly_fee
                : (float) ($t->trainerProfile?->hourly_rate ?? 0);

            $effectiveStatus = ($t->deleted_at !== null || $t->status === 'inactive') ? 'inactive' : 'active';

            return [
                'id' => $t->id,
                'name' => $t->name,
                'email' => $t->email,
                'phone' => $t->phone,
                'status' => $effectiveStatus,
                'is_deleted' => $t->deleted_at !== null,
                'avatar' => $t->avatar,
                'created_at' => $t->created_at?->toISOString(),
                'profile' => $t->trainerProfile ? [
                    'id' => $t->trainerProfile->id,
                    'trainer_code' => $t->trainerProfile->trainer_code,
                    'specialization' => $t->trainerProfile->specialization,
                    'shift' => $t->trainerProfile->shift ?? 'full_day',
                    'bio' => $t->trainerProfile->bio,
                    'certifications' => $t->trainerProfile->certifications,
                    'monthly_fee' => $monthlyFee,
                    'hourly_rate' => (float) $t->trainerProfile->hourly_rate,
                    'is_available' => (bool) $t->trainerProfile->is_available,
                    'joined_at' => $t->trainerProfile->joined_at?->toDateString(),
                ] : null,
                'active_clients_count' => $activeClientsCount,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $trainers,
        ]);
    }

    /**
     * Create a new trainer account and profile (Owner / Admin).
     */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only management can register trainers.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', new ValidHumanName(2, 100)],
            'email' => ['required', 'email:rfc', 'unique:users,email'],
            'phone' => ['nullable', 'string', new ValidPhone(true)],
            'password' => ['nullable', 'string', 'min:8'],
            'specialization' => ['required', 'string', 'min:2', 'max:150'],
            'shift' => ['nullable', 'string', 'in:morning,afternoon,evening,full_day'],
            'monthly_fee' => ['required', new ValidMoneyAmount(0, 1000000, true)],
            'hourly_rate' => ['nullable', new ValidMoneyAmount(0, 100000, true)],
            'bio' => ['nullable', 'string', 'max:1000'],
            'certifications' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'avatar' => ['nullable'],
        ], [
            'name.required' => 'Trainer full name is required.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'The email address is already taken by another account.',
            'password.min' => 'Password must be at least 8 characters long.',
            'specialization.required' => 'Specialization is required (e.g. Strength, Weight Loss).',
            'monthly_fee.required' => 'Monthly trainer coaching fee in Birr is required.',
        ]);

        if (! empty($validated['phone'])) {
            $normalizedPhone = User::normalizePhone($validated['phone']);
            $existingPhoneUser = User::findUserByPhone($normalizedPhone);
            if ($existingPhoneUser) {
                throw ValidationException::withMessages([
                    'phone' => ["The phone number '{$validated['phone']}' is already registered to another user ({$existingPhoneUser->name})."],
                ]);
            }
            $validated['phone'] = $normalizedPhone;
        }

        $avatarUrl = $this->handleAvatarUpload($request);

        $trainer = DB::transaction(function () use ($validated, $avatarUrl, $request) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'avatar' => $avatarUrl,
                'password' => Hash::make($validated['password'] ?? 'Password123!'),
            ]);

            $trainerRole = Role::where('name', 'trainer')->firstOrFail();
            $user->roles()->attach($trainerRole->id);

            // Sequential trainer code: TR-001
            $count = TrainerProfile::count() + 1;
            $code = sprintf('TR-%03d', $count);

            TrainerProfile::create([
                'user_id' => $user->id,
                'trainer_code' => $code,
                'specialization' => $validated['specialization'],
                'shift' => $validated['shift'] ?? 'full_day',
                'bio' => $validated['bio'] ?? null,
                'certifications' => $validated['certifications'] ?? null,
                'monthly_fee' => $validated['monthly_fee'],
                'hourly_rate' => $validated['hourly_rate'] ?? 0,
                'is_available' => true,
                'joined_at' => now()->toDateString(),
            ]);

            AuditLogger::log(
                action: 'trainer.created',
                auditable: $user,
                notes: "Registered coach {$user->name} ({$code}) with specialization {$validated['specialization']} and fee {$validated['monthly_fee']} ETB"
            );

            return $user;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Coach {$trainer->name} created successfully.",
            'data' => $trainer->load('trainerProfile'),
        ], Response::HTTP_CREATED);
    }

    /**
     * Show trainer profile with active client roster.
     */
    public function show(Request $request, User $trainer): JsonResponse
    {
        if (! $trainer->hasRole('trainer')) {
            return response()->json(['message' => 'User is not a trainer.'], Response::HTTP_NOT_FOUND);
        }

        $trainer->load(['trainerProfile']);

        $activeClients = TrainerAssignment::with(['member.memberProfile', 'member.subscriptions.plan'])
            ->where('trainer_id', $trainer->id)
            ->where('status', 'active')
            ->orderByDesc('start_date')
            ->get()
            ->map(function ($a) {
                $member = $a->member;
                $activeSub = $member ? $member->activeSubscription() : null;
                $daysLeft = $a->end_date ? max(0, (int) Carbon::today()->diffInDays(Carbon::parse($a->end_date), false)) : null;

                return [
                    'assignment_id' => $a->id,
                    'member_id' => $member?->id,
                    'member_name' => $member?->name,
                    'member_code' => $member?->memberProfile?->member_code,
                    'phone' => $member?->phone,
                    'avatar' => $member?->avatar,
                    'gender' => $member?->memberProfile?->gender,
                    'plan_name' => $activeSub?->plan?->name ?? 'None',
                    'plan_expires' => $activeSub?->end_date?->toDateString(),
                    'start_date' => $a->start_date?->toDateString(),
                    'end_date' => $a->end_date?->toDateString(),
                    'days_remaining' => $daysLeft,
                    'status' => $a->status,
                    'notes' => $a->notes,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $trainer->id,
                'name' => $trainer->name,
                'email' => $trainer->email,
                'phone' => $trainer->phone,
                'status' => $trainer->status,
                'avatar' => $trainer->avatar,
                'profile' => $trainer->trainerProfile ? [
                    'id' => $trainer->trainerProfile->id,
                    'trainer_code' => $trainer->trainerProfile->trainer_code,
                    'specialization' => $trainer->trainerProfile->specialization,
                    'shift' => $trainer->trainerProfile->shift ?? 'full_day',
                    'bio' => $trainer->trainerProfile->bio,
                    'certifications' => $trainer->trainerProfile->certifications,
                    'monthly_fee' => (float) ($trainer->trainerProfile->monthly_fee ?: $trainer->trainerProfile->hourly_rate ?: 0),
                    'hourly_rate' => (float) $trainer->trainerProfile->hourly_rate,
                    'is_available' => (bool) $trainer->trainerProfile->is_available,
                ] : null,
                'active_clients_count' => $activeClients->count(),
                'active_clients' => $activeClients,
            ],
        ]);
    }

    /**
     * Update an existing trainer profile (Owner / Admin).
     */
    public function update(Request $request, User $trainer): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only management can update trainers.'], Response::HTTP_FORBIDDEN);
        }

        if (! $trainer->hasRole('trainer')) {
            return response()->json(['message' => 'User is not a trainer.'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', new ValidHumanName(2, 100)],
            'email' => ['sometimes', 'required', 'email:rfc', 'unique:users,email,' . $trainer->id],
            'phone' => ['nullable', 'string', new ValidPhone(true)],
            'specialization' => ['sometimes', 'required', 'string', 'min:2', 'max:150'],
            'shift' => ['nullable', 'string', 'in:morning,afternoon,evening,full_day'],
            'monthly_fee' => ['sometimes', 'required', new ValidMoneyAmount(0, 1000000, true)],
            'hourly_rate' => ['nullable', new ValidMoneyAmount(0, 100000, true)],
            'bio' => ['nullable', 'string', 'max:1000'],
            'certifications' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'is_available' => ['nullable', 'boolean'],
            'avatar' => ['nullable'],
            'remove_avatar' => ['nullable', 'boolean'],
        ]);

        if (isset($validated['phone']) && ! empty($validated['phone'])) {
            $existing = User::findUserByPhone($validated['phone']);
            if ($existing && $existing->id !== $trainer->id) {
                throw ValidationException::withMessages([
                    'phone' => ["Phone number '{$validated['phone']}' is already registered to another user ({$existing->name})."],
                ]);
            }
        }

        $avatarUrl = $this->handleAvatarUpload($request, $trainer->avatar);

        DB::transaction(function () use ($trainer, $validated, $avatarUrl) {
            $userUpdates = [];
            if (isset($validated['name'])) $userUpdates['name'] = $validated['name'];
            if (isset($validated['email'])) $userUpdates['email'] = strtolower($validated['email']);
            if (array_key_exists('phone', $validated)) $userUpdates['phone'] = $validated['phone'];
            if (isset($validated['status'])) $userUpdates['status'] = $validated['status'];
            $userUpdates['avatar'] = $avatarUrl;

            $trainer->update($userUpdates);

            $profileUpdates = [];
            if (isset($validated['specialization'])) $profileUpdates['specialization'] = $validated['specialization'];
            if (isset($validated['shift'])) $profileUpdates['shift'] = $validated['shift'];
            if (isset($validated['monthly_fee'])) $profileUpdates['monthly_fee'] = $validated['monthly_fee'];
            if (isset($validated['hourly_rate'])) $profileUpdates['hourly_rate'] = $validated['hourly_rate'];
            if (array_key_exists('bio', $validated)) $profileUpdates['bio'] = $validated['bio'];
            if (array_key_exists('certifications', $validated)) $profileUpdates['certifications'] = $validated['certifications'];
            if (isset($validated['is_available'])) $profileUpdates['is_available'] = $validated['is_available'];

            $trainer->trainerProfile()->updateOrCreate(['user_id' => $trainer->id], $profileUpdates);

            AuditLogger::log(
                action: 'trainer.updated',
                auditable: $trainer,
                notes: "Updated coach profile for {$trainer->name}"
            );
        });

        return response()->json([
            'status' => 'success',
            'message' => "Coach {$trainer->name} updated successfully.",
            'data' => $trainer->fresh()->load('trainerProfile'),
        ]);
    }

    /**
     * Delete/deactivate a trainer (Owner / Admin) safely without hard deletion.
     */
    public function destroy(Request $request, $trainerId): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only management can deactivate trainers.'], Response::HTTP_FORBIDDEN);
        }

        $trainer = User::withTrashed()->where('id', $trainerId)->first();
        if (! $trainer || ! $trainer->hasRole('trainer')) {
            return response()->json(['message' => 'Coach not found.'], Response::HTTP_NOT_FOUND);
        }

        DB::transaction(function () use ($trainer) {
            $trainer->status = 'inactive';
            $trainer->save();
            if ($trainer->trainerProfile) {
                $trainer->trainerProfile->is_available = false;
                $trainer->trainerProfile->save();
            }

            AuditLogger::log(
                action: 'trainer.deactivated',
                auditable: $trainer,
                notes: "Turned off (deactivated) coach {$trainer->name}"
            );
        });

        return response()->json([
            'status' => 'success',
            'message' => "Coach {$trainer->name} turned off (Inactive). You can turn them back on anytime.",
        ]);
    }

    /**
     * Toggle trainer active / inactive status or turn back on (Owner / Admin).
     */
    public function toggleStatus(Request $request, $trainerId): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only management can toggle coach status.'], Response::HTTP_FORBIDDEN);
        }

        $trainer = User::withTrashed()->where('id', $trainerId)->first();
        if (! $trainer || ! $trainer->hasRole('trainer')) {
            return response()->json(['message' => 'Coach not found.'], Response::HTTP_NOT_FOUND);
        }

        if ($trainer->trashed()) {
            $trainer->restore();
            $trainer->trainerProfile?->restore();
        }

        $newStatus = ($trainer->status === 'active' && ! $trainer->trashed()) ? 'inactive' : 'active';
        $trainer->status = $newStatus;
        $trainer->save();

        if ($trainer->trainerProfile) {
            $trainer->trainerProfile->is_available = ($newStatus === 'active');
            $trainer->trainerProfile->save();
        }

        AuditLogger::log(
            action: 'trainer.status_toggled',
            auditable: $trainer,
            notes: "Toggled coach {$trainer->name} status to {$newStatus}"
        );

        return response()->json([
            'status' => 'success',
            'message' => $newStatus === 'active'
                ? "Coach {$trainer->name} is now turned ON (Active)."
                : "Coach {$trainer->name} is now turned OFF (Inactive).",
            'data' => [
                'id' => $trainer->id,
                'status' => $trainer->status,
                'name' => $trainer->name,
            ],
        ]);
    }

    /**
     * Assign a gym member to a trainer for personal coaching (Admin / Receptionist).
     */
    public function assign(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'trainer_id' => ['required', 'integer', 'exists:users,id'],
            'member_id' => ['required', 'integer', 'exists:users,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $member = User::findOrFail($validated['member_id']);
        $trainer = User::with('trainerProfile')->findOrFail($validated['trainer_id']);

        if (! $trainer->hasRole('trainer')) {
            return response()->json(['message' => 'Selected user is not a coach.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $assignment = DB::transaction(function () use ($member, $trainer, $validated, $request) {
            // Close existing active assignment
            TrainerAssignment::where('member_id', $member->id)
                ->where('status', 'active')
                ->update(['status' => 'transferred']);

            $newAssignment = TrainerAssignment::create([
                'trainer_id' => $trainer->id,
                'member_id' => $member->id,
                'assigned_by' => $request->user()->id,
                'status' => 'active',
                'start_date' => $validated['start_date'] ?? now()->toDateString(),
                'end_date' => $validated['end_date'] ?? now()->addMonth()->toDateString(),
                'notes' => $validated['notes'] ?? null,
            ]);

            AuditLogger::log(
                action: 'trainer.assigned',
                auditable: $newAssignment,
                notes: "Assigned member {$member->name} to coach {$trainer->name}"
            );

            return $newAssignment;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Member {$member->name} assigned to coach {$trainer->name} successfully.",
            'data' => $assignment->load(['trainer.trainerProfile', 'member.memberProfile']),
        ], Response::HTTP_CREATED);
    }

    /**
     * Change / Switch a member's trainer with transfer notes.
     */
    public function changeTrainer(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'member_id' => ['required', 'integer', 'exists:users,id'],
            'new_trainer_id' => ['required', 'integer', 'exists:users,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $member = User::findOrFail($validated['member_id']);
        $newTrainer = User::with('trainerProfile')->findOrFail($validated['new_trainer_id']);

        if (! $newTrainer->hasRole('trainer')) {
            return response()->json(['message' => 'Selected coach is not a valid trainer.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $assignment = DB::transaction(function () use ($member, $newTrainer, $validated, $request) {
            $currentAssignment = TrainerAssignment::where('member_id', $member->id)
                ->where('status', 'active')
                ->latest('id')
                ->first();

            $startDate = now()->toDateString();
            $endDate = now()->addMonth()->toDateString();

            if ($currentAssignment) {
                if ($currentAssignment->end_date && Carbon::parse($currentAssignment->end_date)->isFuture()) {
                    $endDate = $currentAssignment->end_date->toDateString();
                }

                $reasonText = $validated['reason'] ? " Reason: {$validated['reason']}" : '';
                $currentAssignment->update([
                    'status' => 'transferred',
                    'notes' => trim(($currentAssignment->notes ?? '') . " [Transferred to {$newTrainer->name}.{$reasonText}]"),
                ]);
            }

            $newAssignment = TrainerAssignment::create([
                'member_id' => $member->id,
                'trainer_id' => $newTrainer->id,
                'assigned_by' => $request->user()->id,
                'status' => 'active',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'notes' => "Reassigned from " . ($currentAssignment?->trainer?->name ?? 'independent') . ($validated['reason'] ? ": {$validated['reason']}" : ''),
            ]);

            AuditLogger::log(
                action: 'trainer.transferred',
                auditable: $newAssignment,
                notes: "Transferred member {$member->name} to coach {$newTrainer->name} until {$endDate}"
            );

            return $newAssignment;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Member {$member->name} successfully reassigned to Coach {$newTrainer->name}.",
            'data' => $assignment->load(['trainer.trainerProfile', 'member']),
        ]);
    }

    /**
     * List members assigned to a specific trainer.
     */
    public function assignedMembers(Request $request, User $trainer): JsonResponse
    {
        if (! $trainer->hasRole('trainer')) {
            return response()->json(['message' => 'User is not a trainer.'], Response::HTTP_NOT_FOUND);
        }

        $query = TrainerAssignment::with(['member.memberProfile', 'member.subscriptions.plan'])
            ->where('trainer_id', $trainer->id);

        if (! $request->boolean('all')) {
            $query->where('status', 'active');
        }

        $members = $query->orderByDesc('start_date')->get()->map(function ($a) {
            $member = $a->member;
            $activeSub = $member ? $member->activeSubscription() : null;
            $daysLeft = $a->end_date ? max(0, (int) Carbon::today()->diffInDays(Carbon::parse($a->end_date), false)) : null;

            return [
                'assignment_id' => $a->id,
                'member_id' => $member?->id,
                'name' => $member?->name,
                'member_code' => $member?->memberProfile?->member_code,
                'phone' => $member?->phone,
                'avatar' => $member?->avatar,
                'gender' => $member?->memberProfile?->gender,
                'plan_name' => $activeSub?->plan?->name ?? 'No active plan',
                'plan_expires' => $activeSub?->end_date?->toDateString(),
                'start_date' => $a->start_date?->toDateString(),
                'end_date' => $a->end_date?->toDateString(),
                'days_remaining' => $daysLeft,
                'status' => $a->status,
                'notes' => $a->notes,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $members,
        ]);
    }

    /**
     * Existing member adds a personal trainer later (Charges only the trainer fee).
     */
    public function assignWithPayment(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'member_id' => ['required', 'integer', 'exists:users,id'],
            'trainer_id' => ['required', 'integer', 'exists:users,id'],
            'payment_method' => ['required', 'string', 'in:cash,chapa,telebirr,cbe,card,bank_transfer'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'align_with_subscription' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $member = User::findOrFail($validated['member_id']);
        $trainer = User::with('trainerProfile')->findOrFail($validated['trainer_id']);

        if (! $trainer->hasRole('trainer')) {
            return response()->json(['message' => 'Selected user is not a valid coach.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $monthlyFee = (float) ($trainer->trainerProfile?->monthly_fee !== null && (float) $trainer->trainerProfile->monthly_fee > 0
            ? $trainer->trainerProfile->monthly_fee
            : ($trainer->trainerProfile?->hourly_rate ?? 0));

        $result = DB::transaction(function () use ($member, $trainer, $monthlyFee, $validated, $request) {
            $startDate = now()->toDateString();
            $endDate = now()->addMonth()->toDateString();

            $activeSub = $member->activeSubscription();
            if ($request->boolean('align_with_subscription') && $activeSub && $activeSub->end_date) {
                $endDate = $activeSub->end_date->toDateString();
            }

            // Close previous assignment
            TrainerAssignment::where('member_id', $member->id)
                ->where('status', 'active')
                ->update(['status' => 'transferred']);

            // Create new assignment
            $assignment = TrainerAssignment::create([
                'member_id' => $member->id,
                'trainer_id' => $trainer->id,
                'assigned_by' => $request->user()->id,
                'status' => 'active',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'notes' => $validated['notes'] ?? "Personal training coaching pass with Coach {$trainer->name}",
            ]);

            // If fee > 0, record payment
            $payment = null;
            if ($monthlyFee > 0) {
                $paymentNumber = 'PAY-' . strtoupper(Str::random(10));
                $receiptNumber = Payment::generateNextReceiptNumber();

                $payment = Payment::create([
                    'payment_number' => $paymentNumber,
                    'receipt_number' => $receiptNumber,
                    'user_id' => $member->id,
                    'payable_type' => TrainerAssignment::class,
                    'payable_id' => $assignment->id,
                    'amount' => $monthlyFee,
                    'currency' => 'ETB',
                    'payment_method' => $validated['payment_method'],
                    'payment_type' => 'trainer_fee',
                    'status' => 'completed',
                    'paid_at' => now(),
                    'recorded_by' => $request->user()->id,
                    'notes' => "Trainer fee for Coach {$trainer->name} (1 month coaching)",
                ]);

                if (! empty($validated['payment_reference'])) {
                    PaymentTransaction::create([
                        'payment_id' => $payment->id,
                        'transaction_reference' => $validated['payment_reference'],
                        'amount' => $monthlyFee,
                        'currency' => 'ETB',
                        'gateway' => $validated['payment_method'],
                        'status' => 'completed',
                        'response_payload' => ['reference' => $validated['payment_reference']],
                    ]);
                }
            }

            AuditLogger::log(
                action: 'trainer.assigned_with_fee',
                auditable: $assignment,
                notes: "Assigned member {$member->name} to coach {$trainer->name} with fee {$monthlyFee} ETB ({$validated['payment_method']})"
            );

            return [
                'assignment' => $assignment->load(['trainer.trainerProfile', 'member']),
                'payment' => $payment,
            ];
        });

        return response()->json([
            'status' => 'success',
            'message' => "Coach {$trainer->name} assigned to {$member->name} successfully. Trainer fee of {$monthlyFee} ETB recorded.",
            'data' => $result,
        ], Response::HTTP_CREATED);
    }

    /**
     * List 1-on-1 PT Sessions.
     */
    public function sessions(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = TrainingSession::with(['trainer', 'member.memberProfile']);

        if ($currentUser->hasRole('member') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            $query->where('member_id', $currentUser->id);
        } elseif ($currentUser->hasRole('trainer') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            $query->where('trainer_id', $currentUser->id);
        }

        if ($request->filled('trainer_id')) {
            $query->where('trainer_id', $request->trainer_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sessions = $query->orderByDesc('scheduled_start')->limit(50)->get();

        return response()->json([
            'status' => 'success',
            'data' => $sessions,
        ]);
    }

    /**
     * Schedule a new 1-on-1 training session.
     * Restricted strictly to Reception and Admin/Owner staff.
     */
    public function storeSession(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json([
                'message' => 'Unauthorized. Only reception or admin staff can book 1-on-1 personal training sessions.',
            ], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'trainer_id' => ['required', 'integer', 'exists:users,id'],
            'member_id' => ['required', 'integer', 'exists:users,id'],
            'scheduled_start' => ['required', 'date'],
            'scheduled_end' => ['required', 'date', 'after:scheduled_start'],
            'focus_area' => ['nullable', 'string', 'max:150'],
        ]);

        $code = 'PTS-' . strtoupper(substr(uniqid(), -6));

        $session = TrainingSession::create([
            'session_code' => $code,
            'trainer_id' => $validated['trainer_id'],
            'member_id' => $validated['member_id'],
            'scheduled_start' => $validated['scheduled_start'],
            'scheduled_end' => $validated['scheduled_end'],
            'status' => 'scheduled',
            'focus_area' => $validated['focus_area'] ?? 'Strength & Technique',
        ]);

        $session->load(['trainer', 'member.memberProfile']);

        return response()->json([
            'status' => 'success',
            'message' => 'Personal training session scheduled successfully.',
            'data' => $session,
        ], Response::HTTP_CREATED);
    }

    /**
     * Dedicated Trainer Hub Dashboard metrics and schedule.
     */
    public function myDashboard(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        // Determine which trainer to load
        $trainer = null;
        if ($currentUser->hasRole('trainer')) {
            $trainer = $currentUser;
        } elseif ($currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            if ($request->filled('trainer_id')) {
                $trainer = User::role('trainer')->find($request->trainer_id);
            }
            if (! $trainer) {
                $trainer = User::role('trainer')->first();
            }
        }

        if (! $trainer) {
            return response()->json(['message' => 'Trainer not found.'], Response::HTTP_NOT_FOUND);
        }

        $trainer->load(['trainerProfile']);
        $profile = $trainer->trainerProfile;

        // 1. Active assigned members
        $assignedQuery = TrainerAssignment::with(['member.memberProfile', 'member.subscriptions.plan'])
            ->where('trainer_id', $trainer->id)
            ->where('status', 'active');

        $activeMentees = $assignedQuery->orderByDesc('start_date')->get()->map(function ($a) {
            $member = $a->member;
            $activeSub = $member ? $member->activeSubscription() : null;
            $daysLeft = $a->end_date ? max(0, (int) Carbon::today()->diffInDays(Carbon::parse($a->end_date), false)) : null;

            return [
                'assignment_id' => $a->id,
                'member_id' => $member?->id,
                'name' => $member?->name,
                'member_code' => $member?->memberProfile?->member_code,
                'phone' => $member?->phone,
                'avatar' => $member?->avatar,
                'plan_name' => $activeSub?->plan?->name ?? 'Standard Gym Plan',
                'plan_expires' => $activeSub?->end_date?->toDateString(),
                'start_date' => $a->start_date?->toDateString(),
                'end_date' => $a->end_date?->toDateString(),
                'days_remaining' => $daysLeft,
                'notes' => $a->notes,
            ];
        });

        $activeMenteeIds = $activeMentees->pluck('member_id')->filter()->values();

        // 2. Mentees checked in today
        $menteesCheckedInToday = 0;
        if ($activeMenteeIds->isNotEmpty()) {
            $menteesCheckedInToday = AttendanceRecord::whereIn('member_id', $activeMenteeIds)
                ->whereDate('check_in_time', Carbon::today())
                ->where('status', 'admitted')
                ->distinct('member_id')
                ->count('member_id');
        }

        // 3. Today's PT Sessions
        $todaySessions = TrainingSession::with(['member.memberProfile'])
            ->where('trainer_id', $trainer->id)
            ->whereDate('scheduled_start', Carbon::today())
            ->orderBy('scheduled_start')
            ->get();

        // 4. Upcoming PT Sessions (next 7 days)
        $upcomingSessions = TrainingSession::with(['member.memberProfile'])
            ->where('trainer_id', $trainer->id)
            ->where('scheduled_start', '>', Carbon::now())
            ->orderBy('scheduled_start')
            ->limit(10)
            ->get();

        // 5. Total completed sessions
        $completedSessionsCount = TrainingSession::where('trainer_id', $trainer->id)
            ->where('status', 'completed')
            ->count();

        // 6. Fitness Classes instructed by this coach
        $classes = FitnessClass::where('trainer_id', $trainer->id)
            ->withCount(['bookings as booked_count' => function ($q) {
                $q->whereIn('status', ['confirmed', 'attended']);
            }])
            ->orderBy('start_time')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'category' => $c->category,
                    'room' => $c->room ?? 'Main Studio',
                    'day_of_week' => $c->day_of_week,
                    'start_time' => $c->start_time,
                    'end_time' => $c->end_time,
                    'capacity' => $c->capacity,
                    'booked_count' => $c->booked_count ?? 0,
                    'status' => $c->status,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'trainer' => [
                    'id' => $trainer->id,
                    'name' => $trainer->name,
                    'email' => $trainer->email,
                    'phone' => $trainer->phone,
                    'avatar' => $trainer->avatar,
                    'status' => $trainer->status ?? 'active',
                    'specialization' => $profile?->specialization ?? 'Personal Coach',
                    'shift' => $profile?->shift ?? 'full_day',
                    'bio' => $profile?->bio ?? 'Certified Tigat Gym coach specialized in strength & athlete conditioning.',
                    'trainer_code' => $profile?->trainer_code ?? ('TR-' . str_pad((string)$trainer->id, 3, '0', STR_PAD_LEFT)),
                    'monthly_fee' => (float) ($profile?->monthly_fee ?? 1500),
                ],
                'stats' => [
                    'active_mentees' => $activeMentees->count(),
                    'mentees_capacity' => 15,
                    'today_sessions' => $todaySessions->count(),
                    'today_completed' => $todaySessions->where('status', 'completed')->count(),
                    'total_completed' => $completedSessionsCount,
                    'classes_count' => $classes->count(),
                    'mentees_checked_in_today' => $menteesCheckedInToday,
                ],
                'today_sessions' => $todaySessions,
                'upcoming_sessions' => $upcomingSessions,
                'assigned_members' => $activeMentees,
                'my_classes' => $classes,
            ],
        ]);
    }

    /**
     * Update status or log feedback on a 1-on-1 personal training session.
     */
    public function updateSessionStatus(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->hasRole('trainer') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            if ($trainingSession->trainer_id !== $currentUser->id) {
                return response()->json(['message' => 'Unauthorized to modify this session.'], Response::HTTP_FORBIDDEN);
            }
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'string', 'in:scheduled,completed,cancelled'],
            'trainer_feedback' => ['nullable', 'string', 'max:1000'],
            'focus_area' => ['nullable', 'string', 'max:150'],
            'cancellation_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $trainingSession->update($validated);
        $trainingSession->load(['trainer', 'member.memberProfile']);

        return response()->json([
            'status' => 'success',
            'message' => 'Session updated successfully.',
            'data' => $trainingSession,
        ]);
    }

    /**
     * Cancel a scheduled PT session.
     */
    public function cancelSession(Request $request, TrainingSession $trainingSession): JsonResponse
    {
        $currentUser = $request->user();

        if ($currentUser->hasRole('trainer') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            if ($trainingSession->trainer_id !== $currentUser->id) {
                return response()->json(['message' => 'Unauthorized to cancel this session.'], Response::HTTP_FORBIDDEN);
            }
        }

        $trainingSession->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->input('reason', 'Cancelled by trainer'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Session cancelled successfully.',
        ]);
    }
}
