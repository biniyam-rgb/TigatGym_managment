<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Models\WorkoutLog;
use App\Models\WorkoutPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class WorkoutController extends Controller
{
    /**
     * List exercises from directory.
     */
    public function exercises(Request $request): JsonResponse
    {
        $query = Exercise::where('is_active', true);

        if ($request->filled('muscle_group')) {
            $query->where('muscle_group', $request->muscle_group);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('muscle_group', 'like', "%{$search}%")
                  ->orWhere('equipment_needed', 'like', "%{$search}%");
            });
        }

        $exercises = $query->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $exercises,
        ]);
    }

    /**
     * Add new exercise to directory (Trainers / Admin / Owner).
     */
    public function storeExercise(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:50'],
            'muscle_group' => ['required', 'string', 'max:50'],
            'equipment_needed' => ['nullable', 'string', 'max:100'],
            'difficulty' => ['nullable', 'string', 'in:beginner,intermediate,advanced'],
            'instructions' => ['nullable', 'string', 'max:1000'],
        ]);

        $exercise = Exercise::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']) . '-' . uniqid(),
            'category' => $validated['category'],
            'muscle_group' => $validated['muscle_group'],
            'equipment_needed' => $validated['equipment_needed'] ?? 'None',
            'difficulty' => $validated['difficulty'] ?? 'intermediate',
            'instructions' => $validated['instructions'] ?? null,
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Exercise {$exercise->name} added to movement directory.",
            'data' => $exercise,
        ], Response::HTTP_CREATED);
    }

    /**
     * List workout routine templates.
     */
    public function plans(Request $request): JsonResponse
    {
        $plans = WorkoutPlan::with(['exercises'])->where('is_active', true)->get();

        return response()->json([
            'status' => 'success',
            'data' => $plans,
        ]);
    }

    /**
     * Create workout plan template.
     */
    public function storePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'goal' => ['required', 'string', 'max:50'],
            'difficulty_level' => ['required', 'string', 'in:beginner,intermediate,advanced'],
            'duration_weeks' => ['required', 'integer', 'min:1'],
            'days_per_week' => ['required', 'integer', 'min:1', 'max:7'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $plan = WorkoutPlan::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . uniqid(),
            'description' => $validated['description'] ?? null,
            'goal' => $validated['goal'],
            'difficulty_level' => $validated['difficulty_level'],
            'duration_weeks' => $validated['duration_weeks'],
            'days_per_week' => $validated['days_per_week'],
            'created_by' => $request->user()->id,
            'is_template' => true,
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Workout routine {$plan->title} created successfully.",
            'data' => $plan,
        ], Response::HTTP_CREATED);
    }

    /**
     * Log a completed workout set for member progress tracking.
     */
    public function logSet(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        $validated = $request->validate([
            'member_id' => ['nullable', 'integer', 'exists:users,id'],
            'exercise_id' => ['required', 'integer', 'exists:exercises,id'],
            'set_number' => ['required', 'integer', 'min:1'],
            'reps_completed' => ['required', 'integer', 'min:1'],
            'weight_used' => ['required', 'numeric', 'min:0'],
            'weight_unit' => ['nullable', 'string', 'in:kg,lbs'],
            'rpe' => ['nullable', 'numeric', 'min:1', 'max:10'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $memberId = $validated['member_id'] ?? $currentUser->id;

        $log = WorkoutLog::create([
            'member_id' => $memberId,
            'exercise_id' => $validated['exercise_id'],
            'logged_date' => now()->toDateString(),
            'set_number' => $validated['set_number'],
            'reps_completed' => $validated['reps_completed'],
            'weight_used' => $validated['weight_used'],
            'weight_unit' => $validated['weight_unit'] ?? 'kg',
            'rpe' => $validated['rpe'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $log->load('exercise');

        return response()->json([
            'status' => 'success',
            'message' => 'Workout set recorded.',
            'data' => $log,
        ], Response::HTTP_CREATED);
    }

    /**
     * List workout logs for member.
     */
    public function logs(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $memberId = $request->input('member_id', $currentUser->id);

        $logs = WorkoutLog::with('exercise')
            ->where('member_id', $memberId)
            ->orderByDesc('logged_date')
            ->orderByDesc('id')
            ->limit(30)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $logs,
        ]);
    }
}
