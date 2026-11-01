<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceResource;
use App\Models\AttendanceRecord;
use App\Models\MemberProfile;
use App\Models\Subscription;
use App\Models\TrainerAssignment;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AttendanceController extends Controller
{
    /**
     * Display a listing of attendance records.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AttendanceRecord::class);

        $currentUser = $request->user();
        $query = AttendanceRecord::with(['member.memberProfile', 'subscription.plan', 'verifiedBy']);

        // Scoping: Members see only their own visits
        if ($currentUser->hasRole('member') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            $query->where('member_id', $currentUser->id);
        } elseif ($currentUser->hasRole('trainer') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            $assignedMemberIds = TrainerAssignment::where('trainer_id', $currentUser->id)
                ->where('status', 'active')
                ->pluck('member_id');
            $query->whereIn('member_id', $assignedMemberIds);
        }

        // Filter by member
        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by method
        if ($request->filled('method')) {
            $query->where('method', $request->method);
        }

        // Filter by currently inside gym
        if ($request->boolean('currently_inside')) {
            $query->where('status', 'admitted')
                ->whereNull('check_out_time')
                ->whereDate('check_in_time', Carbon::today());
        }

        // Date filters
        if ($request->filled('date')) {
            $query->whereDate('check_in_time', $request->date);
        } else {
            if ($request->filled('date_from')) {
                $query->whereDate('check_in_time', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('check_in_time', '<=', $request->date_to);
            }
        }

        // Search by member name, member code, phone
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->whereHas('member', function ($mq) use ($search) {
                $mq->where('name', 'like', "%{$search}%")
                   ->orWhere('phone', 'like', "%{$search}%")
                   ->orWhereHas('memberProfile', function ($pq) use ($search) {
                       $pq->where('member_code', 'like', "%{$search}%");
                   });
            });
        }

        $perPage = $request->integer('per_page', 15);
        $records = $query->orderByDesc('check_in_time')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => AttendanceResource::collection($records),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    /**
     * Real-time front-desk attendance summary statistics.
     */
    public function summary(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $currentUser = $request->user();
        $isMemberOnly = $currentUser->hasRole('member') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist');

        $baseQuery = AttendanceRecord::query();
        if ($isMemberOnly) {
            $baseQuery->where('member_id', $currentUser->id);
        }

        $todayTotal = (clone $baseQuery)->whereDate('check_in_time', $today)->count();
        $todayAdmitted = (clone $baseQuery)->whereDate('check_in_time', $today)->where('status', 'admitted')->count();
        $todayDenied = (clone $baseQuery)->whereDate('check_in_time', $today)->where('status', 'denied')->count();
        $currentlyInside = (clone $baseQuery)
            ->whereDate('check_in_time', $today)
            ->where('status', 'admitted')
            ->whereNull('check_out_time')
            ->count();

        // Breakdown by method for today
        $byMethod = (clone $baseQuery)->whereDate('check_in_time', $today)
            ->select('method', DB::raw('COUNT(*) as count'))
            ->groupBy('method')
            ->pluck('count', 'method');

        // Hourly breakdown for peak gym traffic analysis
        $hourlyDistribution = (clone $baseQuery)
            ->whereDate('check_in_time', $today)
            ->where('status', 'admitted')
            ->select(DB::raw('strftime("%H", check_in_time) as hour'), DB::raw('COUNT(*) as count'))
            ->groupBy('hour')
            ->pluck('count', 'hour');

        return response()->json([
            'status' => 'success',
            'data' => [
                'today_total' => $todayTotal,
                'today_admitted' => $todayAdmitted,
                'today_denied' => $todayDenied,
                'currently_inside' => $currentlyInside,
                'by_method' => $byMethod,
                'hourly_distribution' => $hourlyDistribution,
            ],
        ]);
    }

    /**
     * Quick member lookup for front-desk reception preview before scanning.
     */
    public function lookup(Request $request): JsonResponse
    {
        $this->authorize('create', AttendanceRecord::class);

        $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $search = trim($request->input('query'));

        $member = User::whereHas('roles', fn ($q) => $q->where('name', 'member'))
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('memberProfile', function ($pq) use ($search) {
                      $pq->where('member_code', 'like', "%{$search}%")
                         ->orWhere('qr_code_token', $search);
                  });
            })
            ->with(['memberProfile', 'subscriptions.plan'])
            ->first();

        if (! $member) {
            return response()->json([
                'status' => 'not_found',
                'message' => 'No registered member found matching query.',
            ], Response::HTTP_NOT_FOUND);
        }

        $activeSubscription = $member->activeSubscription();
        $latestSubscription = $member->latestSubscription();
        $openVisit = AttendanceRecord::where('member_id', $member->id)
            ->whereDate('check_in_time', Carbon::today())
            ->whereNull('check_out_time')
            ->where('status', 'admitted')
            ->first();

        $isEligible = $member->status === 'active' && $activeSubscription !== null;
        $reason = null;

        if ($member->status !== 'active') {
            $reason = "Member account is {$member->status}.";
        } elseif (! $activeSubscription) {
            if ($latestSubscription?->isFrozen()) {
                $reason = "Membership is frozen until {$latestSubscription->frozen_until?->format('M d, Y')}.";
            } elseif ($latestSubscription?->isExpired()) {
                $reason = "Membership expired on {$latestSubscription->end_date?->format('M d, Y')}. Renewal required.";
            } else {
                $reason = "No active membership plan on file.";
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'member' => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'phone' => $member->phone,
                    'member_code' => $member->memberProfile?->member_code,
                    'gender' => $member->memberProfile?->gender,
                    'avatar' => $member->avatar,
                    'qr_code_token' => $member->memberProfile?->qr_code_token,
                    'status' => $member->status,
                ],
                'is_eligible' => $isEligible,
                'ineligibility_reason' => $reason,
                'is_currently_inside' => $openVisit !== null,
                'open_visit_id' => $openVisit?->id,
                'checked_in_at' => $openVisit?->check_in_time?->toIso8601String(),
                'active_subscription' => $activeSubscription ? [
                    'id' => $activeSubscription->id,
                    'plan_name' => $activeSubscription->plan?->name,
                    'end_date' => $activeSubscription->end_date?->toDateString(),
                    'days_remaining' => Carbon::today()->diffInDays($activeSubscription->end_date, false),
                ] : null,
                'latest_subscription' => $latestSubscription ? [
                    'id' => $latestSubscription->id,
                    'plan_name' => $latestSubscription->plan?->name,
                    'status' => $latestSubscription->status,
                    'end_date' => $latestSubscription->end_date?->toDateString(),
                ] : null,
            ],
        ]);
    }

    /**
     * Process a member check-in attempt via QR scanner, member code, or manual reception desk.
     */
    public function checkIn(Request $request): JsonResponse
    {
        $this->authorize('create', AttendanceRecord::class);

        $validated = $request->validate([
            'qr_token' => ['nullable', 'string', 'max:255'],
            'member_code' => ['nullable', 'string', 'max:30'],
            'member_id' => ['nullable', 'integer', 'exists:users,id'],
            'method' => ['nullable', 'string', 'in:qr_code,manual_reception,member_code,rfid'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $member = null;
        $method = $validated['method'] ?? 'qr_code';

        // 1. Resolve member from QR Token
        if (! empty($validated['qr_token'])) {
            $token = trim($validated['qr_token']);
            // If scanner reads an embedded composite like TIGAT-PASS:TG-0001:TOKEN, extract token
            if (preg_match('/TIGAT-[A-Za-z0-9_-]+/', $token, $matches)) {
                $token = $matches[0];
            }
            $profile = MemberProfile::where('qr_code_token', $token)->first();
            if ($profile) {
                $member = $profile->user;
                $method = 'qr_code';
            }
        }

        // 2. Resolve member from sequential Member Code (TG-XXXX)
        if (! $member && ! empty($validated['member_code'])) {
            $code = strtoupper(trim($validated['member_code']));
            $profile = MemberProfile::where('member_code', $code)->first();
            if ($profile) {
                $member = $profile->user;
                $method = 'member_code';
            }
        }

        // 3. Resolve member from direct User ID
        if (! $member && ! empty($validated['member_id'])) {
            $member = User::find($validated['member_id']);
            $method = $validated['method'] ?? 'manual_reception';
        }

        if (! $member || ! $member->hasRole('member')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Member QR pass or identification code was not recognized in TIGAT GYM registry.',
            ], Response::HTTP_NOT_FOUND);
        }

        $now = now();
        $staffUser = $request->user();

        // -------------------------------------------------------------
        // Security Check 1: Member Account Status (active/suspended)
        // -------------------------------------------------------------
        if ($member->status !== 'active') {
            $denialReason = "Member account is {$member->status}. Please contact front-desk management.";

            $deniedRecord = AttendanceRecord::create([
                'member_id' => $member->id,
                'subscription_id' => null,
                'check_in_time' => $now,
                'method' => $method,
                'status' => 'denied',
                'denial_reason' => $denialReason,
                'verified_by' => $staffUser->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            AuditLogger::log(
                action: 'attendance.denied',
                auditable: $deniedRecord,
                notes: "Denied entry to {$member->name} ({$member->memberProfile?->member_code}): {$denialReason}"
            );

            return response()->json([
                'status' => 'denied',
                'message' => $denialReason,
                'data' => new AttendanceResource($deniedRecord->load(['member.memberProfile', 'verifiedBy'])),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // -------------------------------------------------------------
        // Security Check 2: Active & Non-Expired Subscription
        // -------------------------------------------------------------
        $activeSubscription = $member->activeSubscription();

        if (! $activeSubscription) {
            $latestSub = $member->latestSubscription();
            if ($latestSub?->isFrozen()) {
                $denialReason = "Membership pass is currently frozen until {$latestSub->frozen_until?->format('M d, Y')}.";
            } elseif ($latestSub?->isExpired()) {
                $denialReason = "Membership pass expired on {$latestSub->end_date?->format('M d, Y')}. Renewal required for gym entry.";
            } elseif ($latestSub && $latestSub->status === 'pending') {
                $denialReason = "Membership pass payment is pending front-desk verification.";
            } else {
                $denialReason = "No active membership pass found. Registration or pass renewal required.";
            }

            $deniedRecord = AttendanceRecord::create([
                'member_id' => $member->id,
                'subscription_id' => $latestSub?->id,
                'check_in_time' => $now,
                'method' => $method,
                'status' => 'denied',
                'denial_reason' => $denialReason,
                'verified_by' => $staffUser->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            AuditLogger::log(
                action: 'attendance.denied',
                auditable: $deniedRecord,
                notes: "Denied entry to {$member->name} ({$member->memberProfile?->member_code}): {$denialReason}"
            );

            return response()->json([
                'status' => 'denied',
                'message' => $denialReason,
                'data' => new AttendanceResource($deniedRecord->load(['member.memberProfile', 'subscription.plan', 'verifiedBy'])),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // -------------------------------------------------------------
        // Security Check 3: Anti-Passback & Rapid Double Check-in Alert
        // -------------------------------------------------------------
        $openVisit = AttendanceRecord::where('member_id', $member->id)
            ->whereDate('check_in_time', Carbon::today())
            ->where('status', 'admitted')
            ->whereNull('check_out_time')
            ->latest('check_in_time')
            ->first();

        if ($openVisit) {
            // If checked in within the last 5 minutes, flag as anti-passback violation
            $minutesAgo = $openVisit->check_in_time->diffInMinutes($now);
            if ($minutesAgo < 5) {
                $denialReason = "Anti-passback alert: {$member->name} already checked in {$minutesAgo} min ago (at {$openVisit->check_in_time->format('h:i A')}).";

                $deniedRecord = AttendanceRecord::create([
                    'member_id' => $member->id,
                    'subscription_id' => $activeSubscription->id,
                    'check_in_time' => $now,
                    'method' => $method,
                    'status' => 'denied',
                    'denial_reason' => $denialReason,
                    'verified_by' => $staffUser->id,
                    'notes' => $validated['notes'] ?? 'Anti-passback rapid double-entry prevented',
                ]);

                AuditLogger::log(
                    action: 'attendance.anti_passback_alert',
                    auditable: $deniedRecord,
                    notes: $denialReason
                );

                return response()->json([
                    'status' => 'denied',
                    'message' => $denialReason,
                    'data' => new AttendanceResource($deniedRecord->load(['member.memberProfile', 'subscription.plan', 'verifiedBy'])),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        // -------------------------------------------------------------
        // ADMISSION GRANTED
        // -------------------------------------------------------------
        $qrHash = ! empty($validated['qr_token']) ? hash('sha256', $validated['qr_token']) : null;

        $record = AttendanceRecord::create([
            'member_id' => $member->id,
            'subscription_id' => $activeSubscription->id,
            'check_in_time' => $now,
            'method' => $method,
            'status' => 'admitted',
            'qr_payload_hash' => $qrHash,
            'verified_by' => $staffUser->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        AuditLogger::log(
            action: 'attendance.check_in',
            auditable: $record,
            newValues: [
                'member_id' => $member->id,
                'member_code' => $member->memberProfile?->member_code,
                'method' => $method,
                'status' => 'admitted',
            ],
            notes: "Admitted {$member->name} ({$member->memberProfile?->member_code}) via {$method}"
        );

        $record->load(['member.memberProfile', 'subscription.plan', 'verifiedBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Welcome to TIGAT GYM, {$member->name}! Access granted.",
            'data' => new AttendanceResource($record),
        ], Response::HTTP_CREATED);
    }

    /**
     * Process member check-out.
     */
    public function checkOut(Request $request): JsonResponse
    {
        $this->authorize('checkOut', AttendanceRecord::class);

        $validated = $request->validate([
            'attendance_id' => ['nullable', 'integer', 'exists:attendance_records,id'],
            'member_id' => ['nullable', 'integer', 'exists:users,id'],
            'qr_token' => ['nullable', 'string'],
        ]);

        $query = AttendanceRecord::where('status', 'admitted')->whereNull('check_out_time');

        if (! empty($validated['attendance_id'])) {
            $query->where('id', $validated['attendance_id']);
        } elseif (! empty($validated['member_id'])) {
            $query->where('member_id', $validated['member_id'])->whereDate('check_in_time', Carbon::today());
        } elseif (! empty($validated['qr_token'])) {
            $token = trim($validated['qr_token']);
            if (preg_match('/TIGAT-[A-Za-z0-9_-]+/', $token, $matches)) {
                $token = $matches[0];
            }
            $profile = MemberProfile::where('qr_code_token', $token)->first();
            if ($profile) {
                $query->where('member_id', $profile->user_id)->whereDate('check_in_time', Carbon::today());
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Member QR code not found.',
                ], Response::HTTP_NOT_FOUND);
            }
        } else {
            return response()->json([
                'status' => 'error',
                'message' => 'Please provide attendance_id, member_id, or scan member QR code to check out.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $record = $query->latest('check_in_time')->first();

        if (! $record) {
            return response()->json([
                'status' => 'error',
                'message' => 'No active open check-in visit found for this member today.',
            ], Response::HTTP_NOT_FOUND);
        }

        $now = now();
        $record->update(['check_out_time' => $now]);

        $duration = $record->duration_minutes;

        AuditLogger::log(
            action: 'attendance.check_out',
            auditable: $record,
            notes: "Checked out {$record->member?->name}. Session duration: {$duration} minutes"
        );

        $record->load(['member.memberProfile', 'subscription.plan', 'verifiedBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Checked out successfully. Workout duration: {$duration} minutes.",
            'data' => new AttendanceResource($record),
        ]);
    }

    /**
     * Display a specific attendance record.
     */
    public function show(AttendanceRecord $attendance): JsonResponse
    {
        $this->authorize('view', $attendance);

        $attendance->load(['member.memberProfile', 'subscription.plan', 'verifiedBy']);

        return response()->json([
            'status' => 'success',
            'data' => new AttendanceResource($attendance),
        ]);
    }

    /**
     * Correct an attendance entry with mandatory audit justification (Owner & Admin only).
     */
    public function update(Request $request, AttendanceRecord $attendance): JsonResponse
    {
        $this->authorize('update', $attendance);

        $validated = $request->validate([
            'check_in_time' => ['sometimes', 'required', 'date'],
            'check_out_time' => ['nullable', 'date', 'after_or_equal:check_in_time'],
            'notes' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $oldValues = $attendance->only(['check_in_time', 'check_out_time', 'notes']);

        $attendance->update([
            'check_in_time' => $validated['check_in_time'] ?? $attendance->check_in_time,
            'check_out_time' => array_key_exists('check_out_time', $validated) ? $validated['check_out_time'] : $attendance->check_out_time,
            'notes' => trim(($attendance->notes ? $attendance->notes . "\n" : '') . "[CORRECTED by " . $request->user()->name . ": " . $validated['notes'] . "]"),
        ]);

        AuditLogger::log(
            action: 'attendance.corrected',
            auditable: $attendance,
            oldValues: $oldValues,
            newValues: $attendance->only(['check_in_time', 'check_out_time', 'notes']),
            notes: "Audited attendance correction for record #{$attendance->id}. Reason: {$validated['notes']}"
        );

        $attendance->load(['member.memberProfile', 'subscription.plan', 'verifiedBy']);

        return response()->json([
            'status' => 'success',
            'message' => 'Attendance record corrected successfully.',
            'data' => new AttendanceResource($attendance),
        ]);
    }
}
