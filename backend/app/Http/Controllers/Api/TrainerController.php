<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\TrainerAssignment;
use App\Models\TrainerProfile;
use App\Models\TrainingSession;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class TrainerController extends Controller
{
    /**
     * List all trainers with profiles and client counts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::role('trainer')->with(['trainerProfile']);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhereHas('trainerProfile', function ($tpq) use ($search) {
                      $tpq->where('specialization', 'like', "%{$search}%")
                          ->orWhere('trainer_code', 'like', "%{$search}%");
                  });
            });
        }

        $trainers = $query->get()->map(function ($t) {
            $activeClientsCount = TrainerAssignment::where('trainer_id', $t->id)
                ->where('status', 'active')
                ->count();

            return [
                'id' => $t->id,
                'name' => $t->name,
                'email' => $t->email,
                'phone' => $t->phone,
                'status' => $t->status,
                'avatar' => $t->avatar,
                'profile' => $t->trainerProfile ? [
                    'id' => $t->trainerProfile->id,
                    'trainer_code' => $t->trainerProfile->trainer_code,
                    'specialization' => $t->trainerProfile->specialization,
                    'bio' => $t->trainerProfile->bio,
                    'certifications' => $t->trainerProfile->certifications,
                    'hourly_rate' => (float) $t->trainerProfile->hourly_rate,
                    'is_available' => (bool) $t->trainerProfile->is_available,
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
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['nullable', 'string', 'min:8'],
            'specialization' => ['required', 'string', 'max:150'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'certifications' => ['nullable', 'string', 'max:255'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
        ]);

        $trainer = DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'] ?? null,
                'status' => 'active',
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
                'bio' => $validated['bio'] ?? null,
                'certifications' => $validated['certifications'] ?? null,
                'hourly_rate' => $validated['hourly_rate'],
                'is_available' => true,
                'joined_at' => now()->toDateString(),
            ]);

            AuditLogger::log(
                action: 'trainer.created',
                auditable: $user,
                notes: "Registered coach {$user->name} ({$code}) with specialization {$validated['specialization']}"
            );

            return $user;
        });

        return response()->json([
            'status' => 'success',
            'message' => "Trainer {$trainer->name} created successfully.",
            'data' => $trainer->load('trainerProfile'),
        ], Response::HTTP_CREATED);
    }

    /**
     * Assign a gym member to a trainer for personal coaching.
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

        $assignment = TrainerAssignment::create([
            'trainer_id' => $validated['trainer_id'],
            'member_id' => $validated['member_id'],
            'assigned_by' => $request->user()->id,
            'status' => 'active',
            'start_date' => $validated['start_date'] ?? now()->toDateString(),
            'end_date' => $validated['end_date'] ?? now()->addMonth()->toDateString(),
            'notes' => $validated['notes'] ?? null,
        ]);

        $assignment->load(['trainer', 'member.memberProfile']);

        AuditLogger::log(
            action: 'trainer.assigned',
            auditable: $assignment,
            notes: "Assigned member {$assignment->member?->name} to coach {$assignment->trainer?->name}"
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Member assigned to personal trainer successfully.',
            'data' => $assignment,
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
     */
    public function storeSession(Request $request): JsonResponse
    {
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
}
