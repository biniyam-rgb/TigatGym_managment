<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassBooking;
use App\Models\FitnessClass;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\User;
use App\Rules\ValidMoneyAmount;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class FitnessClassController extends Controller
{
    /**
     * Get aggregate statistics for fitness classes (Manager / Admin, or scoped to assigned classes for Trainers).
     */
    public function stats(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $isTrainer = $currentUser && $currentUser->hasRole('trainer') && ! $currentUser->hasAnyRole('owner', 'admin');

        $cacheKey = $isTrainer ? ('fitness_classes_stats_trainer_' . $currentUser->id) : 'fitness_classes_stats_v1';

        $data = Cache::remember($cacheKey, 30, function () use ($isTrainer, $currentUser) {
            $today = Carbon::today();

            $baseQuery = FitnessClass::query();
            if ($isTrainer) {
                $baseQuery->where('trainer_id', $currentUser->id);
            }

            $totalClasses = (clone $baseQuery)->count();
            $todayClasses = (clone $baseQuery)->whereDate('start_time', $today)
                ->whereIn('status', ['scheduled', 'ongoing'])
                ->count();

            $activeClasses = (clone $baseQuery)->whereIn('status', ['scheduled', 'ongoing'])
                ->select(['id', 'capacity', 'trainer_id'])
                ->get();

            $totalCapacity = $activeClasses->sum('capacity');
            $activeClassIds = $activeClasses->pluck('id');
            $allClassIds = (clone $baseQuery)->pluck('id');

            $totalBookings = $allClassIds->isNotEmpty()
                ? ClassBooking::whereIn('fitness_class_id', $allClassIds)
                    ->whereIn('status', ['reserved', 'attended'])
                    ->count()
                : 0;

            $attendedCount = $allClassIds->isNotEmpty()
                ? ClassBooking::whereIn('fitness_class_id', $allClassIds)
                    ->where('status', 'attended')
                    ->count()
                : 0;

            $activeBookings = $activeClassIds->isNotEmpty()
                ? ClassBooking::whereIn('fitness_class_id', $activeClassIds)
                    ->whereIn('status', ['reserved', 'attended'])
                    ->count()
                : 0;

            $occupancyRate = $totalCapacity > 0 ? round(($activeBookings / $totalCapacity) * 100, 1) : 0;
            $activeTrainers = $isTrainer ? ($totalClasses > 0 ? 1 : 0) : $activeClasses->pluck('trainer_id')->filter()->unique()->count();

            return [
                'total_classes' => $totalClasses,
                'today_classes' => $todayClasses,
                'total_bookings' => $totalBookings,
                'attended_count' => $attendedCount,
                'occupancy_rate' => $occupancyRate,
                'active_trainers' => $activeTrainers,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Auto-sync class statuses based on current time and auto-remove
     * completed non-recurring classes after 48 hours. Recurring classes
     * (daily, weekly, biweekly) are preserved.
     */
    public static function cleanupCompletedClasses(): int
    {
        $now = Carbon::now();

        // 1. Sync finished sessions to 'completed'
        FitnessClass::where('status', '!=', 'cancelled')
            ->whereNotNull('end_time')
            ->where('end_time', '<=', $now)
            ->where('status', '!=', 'completed')
            ->update(['status' => 'completed']);

        // 2. Sync active sessions to 'ongoing'
        FitnessClass::where('status', '!=', 'cancelled')
            ->whereNotNull('start_time')
            ->where('start_time', '<=', $now)
            ->where('end_time', '>', $now)
            ->where('status', '!=', 'ongoing')
            ->update(['status' => 'ongoing']);

        // 3. Sync upcoming sessions to 'scheduled'
        FitnessClass::where('status', '!=', 'cancelled')
            ->whereNotNull('start_time')
            ->where('start_time', '>', $now)
            ->where('status', '!=', 'scheduled')
            ->update(['status' => 'scheduled']);

        // 4. Auto-remove completed non-recurring classes older than 48 hours (end_time <= now - 48h)
        $cutoff = $now->copy()->subHours(48);

        $classesToRemove = FitnessClass::where('status', 'completed')
            ->whereNotNull('end_time')
            ->where('end_time', '<=', $cutoff)
            ->where(function ($q) {
                $q->whereNull('recurrence')
                    ->orWhere('recurrence', '')
                    ->orWhere('recurrence', 'none');
            })
            ->get();

        $deletedCount = 0;
        foreach ($classesToRemove as $cls) {
            $cls->delete(); // Soft deletes the completed session
            $deletedCount++;
        }

        return $deletedCount;
    }

    /**
     * List scheduled fitness classes with capacity, filters & booking stats.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        // Throttle auto-sync to at most once per 3 minutes to avoid executing 3 UPDATE queries on every GET request
        if (Cache::add('fitness_classes_cleanup_lock', true, 180)) {
            self::cleanupCompletedClasses();
        }

        $query = FitnessClass::with(['trainer'])
            ->withCount(['bookings as booked_count' => function ($q) {
                $q->whereIn('status', ['reserved', 'attended']);
            }])
            ->withCount(['bookings as attended_count' => function ($q) {
                $q->where('status', 'attended');
            }]);

        // Trainer role scoping: Trainers can ONLY see their own assigned classes
        if ($currentUser && $currentUser->hasRole('trainer') && ! $currentUser->hasAnyRole('owner', 'admin')) {
            $query->where('trainer_id', $currentUser->id);
        } elseif ($request->filled('trainer_id')) {
            $query->where('trainer_id', $request->trainer_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('start_time', $request->date);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('room', 'like', "%{$s}%")
                    ->orWhereHas('trainer', function ($tq) use ($s) {
                        $tq->where('name', 'like', "%{$s}%");
                    });
            });
        }

        $rawClasses = $query->orderBy('start_time')->get();

        // Batch load current user's bookings to avoid N+1 queries
        $myBookings = ($currentUser && $rawClasses->isNotEmpty())
            ? ClassBooking::where('member_id', $currentUser->id)
                ->whereIn('status', ['reserved', 'attended'])
                ->whereIn('fitness_class_id', $rawClasses->pluck('id'))
                ->get()
                ->keyBy('fitness_class_id')
            : collect();

        $classes = $rawClasses->map(function ($c) use ($currentUser, $myBookings) {
            $myBooking = $currentUser ? $myBookings->get($c->id) : null;
            $isBookedByMe = (bool) $myBooking;

            return [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
                'room' => $c->room,
                'image_url' => $c->image_url,
                'capacity' => (int) $c->capacity,
                'booked_count' => (int) $c->booked_count,
                'attended_count' => (int) $c->attended_count,
                'is_full' => (int) $c->booked_count >= (int) $c->capacity,
                'start_time' => $c->start_time?->toIso8601String(),
                'end_time' => $c->end_time?->toIso8601String(),
                'recurrence' => $c->recurrence,
                'status' => $c->status,
                'price' => (float) $c->price,
                'currency' => $c->currency ?? 'ETB',
                'trainer' => $c->trainer ? [
                    'id' => $c->trainer->id,
                    'name' => $c->trainer->name,
                    'email' => $c->trainer->email,
                ] : null,
                'is_booked_by_current_user' => $isBookedByMe,
                'my_booking_status' => $myBooking?->status,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $classes,
        ]);
    }

    /**
     * Show single fitness class details.
     */
    public function show(FitnessClass $fitnessClass): JsonResponse
    {
        if ($fitnessClass->status !== 'cancelled') {
            $now = now();
            $autoStatus = ($fitnessClass->end_time && $now->gte($fitnessClass->end_time))
                ? 'completed'
                : (($fitnessClass->start_time && $now->gte($fitnessClass->start_time)) ? 'ongoing' : 'scheduled');
            if ($fitnessClass->status !== $autoStatus) {
                $fitnessClass->update(['status' => $autoStatus]);
            }
        }

        $fitnessClass->load('trainer');
        $fitnessClass->loadCount(['bookings as booked_count' => function ($q) {
            $q->whereIn('status', ['reserved', 'attended']);
        }]);

        return response()->json([
            'status' => 'success',
            'data' => $fitnessClass,
        ]);
    }

    /**
     * Schedule a new fitness class (Owner / Admin).
     */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only managers can schedule classes.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'trainer_id' => ['required', 'integer', 'exists:users,id'],
            'room' => ['nullable', 'string', 'max:50'],
            'capacity' => ['required', 'integer', 'min:10', 'max:40'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'recurrence' => ['nullable', 'string', 'in:none,daily,weekly,biweekly'],
            'price' => ['nullable', new ValidMoneyAmount(0, 50000, true)],
            'image' => ['nullable'],
            'image_url' => ['nullable', 'string'],
        ], [
            'capacity.min' => 'Class capacity must be between 10 and 40 spots.',
            'capacity.max' => 'Class capacity must be between 10 and 40 spots.',
        ]);

        $imageUrl = null;
        $rawImage = $request->input('image') ?: $request->input('image_url');
        if ($request->hasFile('image')) {
            $request->validate(['image' => ['image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120']]);
            $file = $request->file('image');
            $filename = 'class_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('classes', $filename, 'public');
            $imageUrl = '/storage/' . $path;
        } elseif ($rawImage && is_string($rawImage) && str_starts_with($rawImage, 'data:image')) {
            preg_match('/^data:image\/(\w+);base64,/', $rawImage, $matches);
            $extension = $matches[1] ?? 'png';
            $base64Data = substr($rawImage, strpos($rawImage, ',') + 1);
            $decoded = base64_decode($base64Data);
            if ($decoded !== false) {
                $filename = 'class_' . time() . '_' . Str::random(8) . '.' . $extension;
                Storage::disk('public')->put('classes/' . $filename, $decoded);
                $imageUrl = '/storage/classes/' . $filename;
            }
        } elseif ($request->filled('image_url') && !str_starts_with($request->input('image_url'), 'data:image')) {
            $imageUrl = $request->input('image_url');
        }

        $slug = Str::slug($validated['name']) . '-' . uniqid();

        // Status is automatically determined by session start and end time
        $now = now();
        $startTime = Carbon::parse($validated['start_time']);
        $endTime = Carbon::parse($validated['end_time']);
        $initialStatus = $now->gte($endTime) ? 'completed' : ($now->gte($startTime) ? 'ongoing' : 'scheduled');

        $class = FitnessClass::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'trainer_id' => $validated['trainer_id'],
            'room' => $validated['room'] ?? 'Studio A (Main Hall)',
            'image_url' => $imageUrl,
            'capacity' => $validated['capacity'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'recurrence' => $validated['recurrence'] ?? 'none',
            'status' => $initialStatus,
            'price' => $validated['price'] ?? 0.00,
            'currency' => 'ETB',
        ]);

        $class->load('trainer');

        AuditLogger::log(
            action: 'class.scheduled',
            auditable: $class,
            notes: "Scheduled fitness class {$class->name} with capacity {$class->capacity}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Fitness class {$class->name} scheduled successfully.",
            'data' => $class,
        ], Response::HTTP_CREATED);
    }

    /**
     * Update an existing fitness class (Owner / Admin).
     */
    public function update(Request $request, FitnessClass $fitnessClass): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only managers can edit classes.'], Response::HTTP_FORBIDDEN);
        }

        // Sessions that have already started or completed cannot be edited by admin
        $now = now();
        if ($fitnessClass->start_time && $now->gte($fitnessClass->start_time)) {
            return response()->json([
                'message' => 'Cannot edit a class that has already started or completed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($fitnessClass->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot edit a cancelled class.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'trainer_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'room' => ['nullable', 'string', 'max:50'],
            'capacity' => ['sometimes', 'required', 'integer', 'min:10', 'max:40'],
            'start_time' => ['sometimes', 'required', 'date'],
            'end_time' => ['sometimes', 'required', 'date', 'after:start_time'],
            'recurrence' => ['nullable', 'string', 'in:none,daily,weekly,biweekly'],
            'status' => ['nullable', 'string'],
            'cancellation_reason' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', new ValidMoneyAmount(0, 50000, true)],
            'image' => ['nullable'],
            'image_url' => ['nullable', 'string'],
            'remove_image' => ['nullable', 'boolean'],
        ], [
            'capacity.min' => 'Class capacity must be between 10 and 40 spots.',
            'capacity.max' => 'Class capacity must be between 10 and 40 spots.',
        ]);

        $rawImage = $request->input('image') ?: $request->input('image_url');
        if ($request->boolean('remove_image')) {
            if ($fitnessClass->image_url && str_starts_with($fitnessClass->image_url, '/storage/classes/')) {
                $filePath = str_replace('/storage/', '', $fitnessClass->image_url);
                Storage::disk('public')->delete($filePath);
            }
            $validated['image_url'] = null;
        } elseif ($request->hasFile('image')) {
            $request->validate(['image' => ['image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120']]);
            $file = $request->file('image');
            $filename = 'class_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('classes', $filename, 'public');
            $validated['image_url'] = '/storage/' . $path;
        } elseif ($rawImage && is_string($rawImage) && str_starts_with($rawImage, 'data:image')) {
            preg_match('/^data:image\/(\w+);base64,/', $rawImage, $matches);
            $extension = $matches[1] ?? 'png';
            $base64Data = substr($rawImage, strpos($rawImage, ',') + 1);
            $decoded = base64_decode($base64Data);
            if ($decoded !== false) {
                $filename = 'class_' . time() . '_' . Str::random(8) . '.' . $extension;
                Storage::disk('public')->put('classes/' . $filename, $decoded);
                $validated['image_url'] = '/storage/classes/' . $filename;
            }
        } elseif ($request->filled('image_url') && !str_starts_with($request->input('image_url'), 'data:image')) {
            $validated['image_url'] = $request->input('image_url');
        }
        unset($validated['image'], $validated['remove_image']);

        // Status is automatically determined by session time; admin cannot manually set ongoing or completed.
        // Only admin cancellation is permitted.
        if ($request->input('status') === 'cancelled' || $request->filled('cancellation_reason')) {
            $validated['status'] = 'cancelled';
        } elseif ($fitnessClass->status !== 'cancelled') {
            $now = now();
            $st = Carbon::parse($validated['start_time'] ?? $fitnessClass->start_time);
            $et = Carbon::parse($validated['end_time'] ?? $fitnessClass->end_time);
            $validated['status'] = $now->gte($et) ? 'completed' : ($now->gte($st) ? 'ongoing' : 'scheduled');
        }

        $fitnessClass->update($validated);
        $fitnessClass->load('trainer');

        AuditLogger::log(
            action: 'class.updated',
            auditable: $fitnessClass,
            notes: "Updated fitness class {$fitnessClass->name}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Class {$fitnessClass->name} updated successfully.",
            'data' => $fitnessClass,
        ]);
    }

    /**
     * Cancel and archive a fitness class (Owner / Admin).
     */
    public function destroy(Request $request, FitnessClass $fitnessClass): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only managers can cancel classes.'], Response::HTTP_FORBIDDEN);
        }

        // Classes that have already started or completed cannot be cancelled
        $now = now();
        if ($fitnessClass->start_time && $now->gte($fitnessClass->start_time)) {
            return response()->json([
                'message' => 'Cannot cancel a class that has already started or completed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($fitnessClass->status === 'cancelled') {
            return response()->json([
                'message' => 'Class is already cancelled.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $reason = $request->input('reason', 'Cancelled by administration');
        $className = $fitnessClass->name;

        $fitnessClass->update([
            'status' => 'cancelled',
            'cancellation_reason' => $reason,
        ]);
        $fitnessClass->delete();

        AuditLogger::log(
            action: 'class.cancelled',
            auditable: $fitnessClass,
            notes: "Cancelled fitness class {$className}. Reason: {$reason}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Class \"{$className}\" has been cancelled.",
        ]);
    }

    /**
     * Get attendee roster with member contact & check-in details.
     */
    public function roster(Request $request, FitnessClass $fitnessClass): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'trainer', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized to view roster.'], Response::HTTP_FORBIDDEN);
        }

        if ($fitnessClass->status !== 'cancelled') {
            $now = now();
            $autoStatus = ($fitnessClass->end_time && $now->gte($fitnessClass->end_time))
                ? 'completed'
                : (($fitnessClass->start_time && $now->gte($fitnessClass->start_time)) ? 'ongoing' : 'scheduled');
            if ($fitnessClass->status !== $autoStatus) {
                $fitnessClass->update(['status' => $autoStatus]);
            }
        }

        $fitnessClass->load('trainer');

        $bookings = ClassBooking::with(['member.memberProfile', 'member.subscriptions.plan', 'payment'])
            ->where('fitness_class_id', $fitnessClass->id)
            ->orderBy('booking_time', 'desc')
            ->get()
            ->map(function ($b) {
                $sub = $b->member?->activeSubscription();
                return [
                    'id' => $b->id,
                    'status' => $b->status,
                    'booking_time' => $b->booking_time?->toIso8601String(),
                    'cancelled_at' => $b->cancelled_at?->toIso8601String(),
                    'cancellation_reason' => $b->cancellation_reason,
                    'payment' => $b->payment ? [
                        'id' => $b->payment->id,
                        'amount' => (float) $b->payment->amount,
                        'currency' => $b->payment->currency ?? 'ETB',
                        'method' => $b->payment->payment_method,
                        'receipt_number' => $b->payment->receipt_number,
                        'status' => $b->payment->status,
                    ] : null,
                    'member' => $b->member ? [
                        'id' => $b->member->id,
                        'name' => $b->member->name,
                        'email' => $b->member->email,
                        'phone' => $b->member->memberProfile?->phone_number ?? 'N/A',
                        'photo' => $b->member->memberProfile?->photo_url,
                        'plan_name' => $sub?->plan?->name ?? 'Standard Pass',
                        'membership_status' => $sub?->status ?? 'none',
                    ] : null,
                ];
            });

        $reservedCount = $bookings->where('status', 'reserved')->count();
        $attendedCount = $bookings->where('status', 'attended')->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'class' => [
                    'id' => $fitnessClass->id,
                    'name' => $fitnessClass->name,
                    'room' => $fitnessClass->room,
                    'image_url' => $fitnessClass->image_url,
                    'start_time' => $fitnessClass->start_time?->toIso8601String(),
                    'end_time' => $fitnessClass->end_time?->toIso8601String(),
                    'capacity' => (int) $fitnessClass->capacity,
                    'status' => $fitnessClass->status,
                    'price' => (float) $fitnessClass->price,
                    'trainer_name' => $fitnessClass->trainer?->name ?? 'Unassigned',
                ],
                'bookings' => $bookings,
                'reserved_count' => $reservedCount,
                'attended_count' => $attendedCount,
                'total_booked' => $reservedCount + $attendedCount,
            ],
        ]);
    }

    /**
     * Mark an attendee's status (attended, reserved, no_show).
     */
    public function checkInBooking(Request $request, FitnessClass $fitnessClass, ClassBooking $classBooking): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'trainer', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized to update attendance.'], Response::HTTP_FORBIDDEN);
        }

        if ((int) $classBooking->fitness_class_id !== (int) $fitnessClass->id) {
            return response()->json(['message' => 'Booking does not belong to this class.'], Response::HTTP_BAD_REQUEST);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:attended,reserved,no_show,cancelled'],
        ]);

        $classBooking->update([
            'status' => $validated['status'],
        ]);

        AuditLogger::log(
            action: 'class.check_in',
            auditable: $classBooking,
            notes: "Updated attendance status to {$validated['status']} for {$fitnessClass->name}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Attendee status marked as {$validated['status']}.",
            'data' => $classBooking,
        ]);
    }

    /**
     * Staff removal of a member's booking from the roster.
     */
    public function removeBooking(Request $request, FitnessClass $fitnessClass, ClassBooking $classBooking): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized to remove reservations.'], Response::HTTP_FORBIDDEN);
        }

        if ((int) $classBooking->fitness_class_id !== (int) $fitnessClass->id) {
            return response()->json(['message' => 'Booking does not belong to this class.'], Response::HTTP_BAD_REQUEST);
        }

        $bookingMember = $classBooking->member;
        $memberName = $bookingMember?->name ?? "Member #{$classBooking->member_id}";

        $classBooking->delete();

        AuditLogger::log(
            action: 'class.booking_removed',
            auditable: $fitnessClass,
            notes: "Removed reservation for {$memberName} from {$fitnessClass->name}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Attendee reservation removed from class.",
        ]);
    }

    /**
     * Reserve a spot in a class with anti-duplicate, capacity, start-time & payment processing.
     */
    public function book(Request $request, FitnessClass $fitnessClass): JsonResponse
    {
        $currentUser = $request->user();
        $memberId = $request->input('member_id', $currentUser->id);

        if ($memberId !== $currentUser->id && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized to book for other members.'], Response::HTTP_FORBIDDEN);
        }

        // 1. Strict Start Time check: Booking is only allowed BEFORE the class starts
        $classStartTime = Carbon::parse($fitnessClass->start_time);
        if ($classStartTime->isPast() || $fitnessClass->status !== 'scheduled') {
            return response()->json([
                'status' => 'error',
                'message' => "Booking closed: Class \"{$fitnessClass->name}\" has already started or is not scheduled.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $member = User::findOrFail($memberId);

        // 2. Anti-duplicate booking check
        $alreadyBooked = ClassBooking::where('fitness_class_id', $fitnessClass->id)
            ->where('member_id', $member->id)
            ->whereIn('status', ['reserved', 'attended'])
            ->exists();

        if ($alreadyBooked) {
            return response()->json([
                'status' => 'error',
                'message' => "{$member->name} already has an active reservation in {$fitnessClass->name}.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 3. Capacity check
        $reservedCount = ClassBooking::where('fitness_class_id', $fitnessClass->id)
            ->whereIn('status', ['reserved', 'attended'])
            ->count();

        if ($reservedCount >= $fitnessClass->capacity) {
            return response()->json([
                'status' => 'error',
                'message' => "Class {$fitnessClass->name} is fully booked ({$fitnessClass->capacity}/{$fitnessClass->capacity} spots filled).",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 4. Payment & Membership validation
        $currentUser = $request->user();
        $isStaff = $currentUser && $currentUser->hasAnyRole('owner', 'admin', 'receptionist');
        $hasActiveSub = (bool) $member->activeSubscription();
        $price = $request->filled('amount') ? (float) $request->input('amount') : (float) ($fitnessClass->price ?? 0);
        $paymentMethod = $request->input('payment_method'); // 'cash', 'chapa', 'complimentary', or 'membership_pass'

        // If member doesn't have active pass and class has no fee, reject only if self-booking without staff authorization
        if (! $hasActiveSub && $price <= 0 && (! $paymentMethod || $paymentMethod === 'membership_pass') && ! $isStaff) {
            return response()->json([
                'status' => 'error',
                'message' => "Member {$member->name} does not have an active membership pass required for class bookings.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Default payment method if not supplied
        if (! $paymentMethod) {
            $paymentMethod = $price > 0 ? 'cash' : 'membership_pass';
        }

        // 5. Create booking and payment inside a database transaction
        return DB::transaction(function () use ($fitnessClass, $member, $price, $paymentMethod, $request, $currentUser) {
            $booking = ClassBooking::updateOrCreate(
                ['fitness_class_id' => $fitnessClass->id, 'member_id' => $member->id],
                ['status' => 'reserved', 'booking_time' => now(), 'cancelled_at' => null, 'cancellation_reason' => null]
            );

            $payment = null;
            if ($price > 0 && in_array($paymentMethod, ['cash', 'chapa'], true)) {
                $paymentNumber = Payment::generateNextPaymentNumber();
                $receiptNumber = Payment::generateNextReceiptNumber();
                $payStatus = 'completed';

                $payment = Payment::create([
                    'payment_number' => $paymentNumber,
                    'receipt_number' => $receiptNumber,
                    'user_id' => $member->id,
                    'payable_type' => FitnessClass::class,
                    'payable_id' => $fitnessClass->id,
                    'amount' => $price,
                    'currency' => $fitnessClass->currency ?? 'ETB',
                    'payment_method' => $paymentMethod,
                    'payment_type' => 'class_fee',
                    'status' => $payStatus,
                    'paid_at' => now(),
                    'recorded_by' => $currentUser->id,
                    'notes' => $request->input('notes', "Class booking fee for {$fitnessClass->name} ({$fitnessClass->room})"),
                ]);

                $gateway = $paymentMethod === 'chapa' ? 'chapa' : 'manual';
                $gatewayRef = $request->input('payment_reference') ?: null;
                $txRef = PaymentTransaction::generateTransactionReference();

                PaymentTransaction::create([
                    'payment_id' => $payment->id,
                    'transaction_reference' => $txRef,
                    'gateway' => $gateway,
                    'gateway_reference' => $gatewayRef,
                    'amount' => $price,
                    'currency' => $fitnessClass->currency ?? 'ETB',
                    'status' => 'successful',
                    'verified_at' => now(),
                ]);

                // Link booking to the created payment record
                $booking->update(['payment_id' => $payment->id]);
            }

            AuditLogger::log(
                action: 'class.booked',
                auditable: $fitnessClass,
                notes: "Reserved spot for {$member->name} in {$fitnessClass->name}" . ($payment ? " with {$paymentMethod} payment ({$price} ETB, Receipt: {$payment->receipt_number})" : "")
            );

            $message = "Reservation in {$fitnessClass->name} confirmed for {$member->name}!";
            if ($payment) {
                $message .= " Payment of {$price} ETB received via " . strtoupper($paymentMethod) . " (Receipt: {$payment->receipt_number}).";
            }

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => [
                    'booking' => $booking,
                    'payment' => $payment ? [
                        'id' => $payment->id,
                        'payment_number' => $payment->payment_number,
                        'receipt_number' => $payment->receipt_number,
                        'amount' => $payment->amount,
                        'currency' => $payment->currency,
                        'payment_method' => $payment->payment_method,
                        'paid_at' => $payment->paid_at?->toIso8601String(),
                    ] : null,
                ],
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Cancel a class booking.
     */
    public function cancelBooking(Request $request, FitnessClass $fitnessClass): JsonResponse
    {
        $currentUser = $request->user();
        $memberId = $request->input('member_id', $currentUser->id);

        $booking = ClassBooking::where('fitness_class_id', $fitnessClass->id)
            ->where('member_id', $memberId)
            ->firstOrFail();

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $request->input('reason', 'Cancelled by member/staff'),
        ]);

        $bookingMember = User::find($memberId);
        $memberName = $bookingMember?->name ?? "Member #{$memberId}";

        AuditLogger::log(
            action: 'class.booking_cancelled',
            auditable: $fitnessClass,
            notes: "Cancelled reservation for {$memberName} in {$fitnessClass->name}. Reason: " . $request->input('reason', 'Cancelled by member/staff')
        );

        return response()->json([
            'status' => 'success',
            'message' => "Reservation for {$fitnessClass->name} has been cancelled.",
        ]);
    }
}
