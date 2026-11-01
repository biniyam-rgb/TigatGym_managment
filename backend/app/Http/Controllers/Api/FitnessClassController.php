<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassBooking;
use App\Models\FitnessClass;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class FitnessClassController extends Controller
{
    /**
     * List all scheduled fitness classes with capacity & booking stats.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        $query = FitnessClass::with(['trainer'])
            ->withCount(['bookings as booked_count' => function ($q) {
                $q->where('status', 'reserved');
            }]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            $query->whereIn('status', ['scheduled', 'ongoing']);
        }

        if ($request->filled('date')) {
            $query->whereDate('start_time', $request->date);
        }

        $classes = $query->orderBy('start_time')->get()->map(function ($c) use ($currentUser) {
            $isBookedByMe = false;
            if ($currentUser) {
                $isBookedByMe = ClassBooking::where('fitness_class_id', $c->id)
                    ->where('member_id', $currentUser->id)
                    ->where('status', 'reserved')
                    ->exists();
            }

            return [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
                'room' => $c->room,
                'capacity' => (int) $c->capacity,
                'booked_count' => (int) $c->booked_count,
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
                ] : null,
                'is_booked_by_current_user' => $isBookedByMe,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $classes,
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
            'capacity' => ['required', 'integer', 'min:1', 'max:100'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'recurrence' => ['nullable', 'string', 'in:none,daily,weekly,biweekly'],
            'price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $slug = Str::slug($validated['name']) . '-' . uniqid();

        $class = FitnessClass::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'trainer_id' => $validated['trainer_id'],
            'room' => $validated['room'] ?? 'Studio A',
            'capacity' => $validated['capacity'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'recurrence' => $validated['recurrence'] ?? 'none',
            'status' => 'scheduled',
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
     * Reserve a spot in a class with anti-duplicate & capacity enforcement.
     */
    public function book(Request $request, FitnessClass $fitnessClass): JsonResponse
    {
        $currentUser = $request->user();
        $memberId = $request->input('member_id', $currentUser->id);

        if ($memberId !== $currentUser->id && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized to book for other members.'], Response::HTTP_FORBIDDEN);
        }

        $member = User::findOrFail($memberId);

        // Anti-duplicate booking check
        $alreadyBooked = ClassBooking::where('fitness_class_id', $fitnessClass->id)
            ->where('member_id', $member->id)
            ->where('status', 'reserved')
            ->exists();

        if ($alreadyBooked) {
            return response()->json([
                'status' => 'error',
                'message' => "You have already reserved a spot in {$fitnessClass->name}.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Capacity check
        $reservedCount = ClassBooking::where('fitness_class_id', $fitnessClass->id)
            ->where('status', 'reserved')
            ->count();

        if ($reservedCount >= $fitnessClass->capacity) {
            return response()->json([
                'status' => 'error',
                'message' => "Class {$fitnessClass->name} is fully booked ({$fitnessClass->capacity}/{$fitnessClass->capacity} spots filled).",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Active subscription check
        if (! $member->activeSubscription()) {
            return response()->json([
                'status' => 'error',
                'message' => 'An active membership pass is required to book fitness classes.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $booking = ClassBooking::updateOrCreate(
            ['fitness_class_id' => $fitnessClass->id, 'member_id' => $member->id],
            ['status' => 'reserved', 'booking_time' => now(), 'cancelled_at' => null, 'cancellation_reason' => null]
        );

        AuditLogger::log(
            action: 'class.booked',
            auditable: $fitnessClass,
            notes: "Reserved spot for {$member->name} in {$fitnessClass->name}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Your spot in {$fitnessClass->name} has been confirmed!",
            'data' => $booking,
        ], Response::HTTP_CREATED);
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
            'cancellation_reason' => $request->input('reason', 'Cancelled by member'),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Reservation for {$fitnessClass->name} has been cancelled.",
        ]);
    }
}
