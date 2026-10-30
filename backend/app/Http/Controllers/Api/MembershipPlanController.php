<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MembershipPlanResource;
use App\Models\MembershipPlan;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class MembershipPlanController extends Controller
{
    /**
     * Display a listing of membership plans.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', MembershipPlan::class);

        $currentUser = $request->user();
        $isStaff = $currentUser && $currentUser->hasAnyRole('owner', 'admin', 'receptionist');

        $query = MembershipPlan::withCount(['subscriptions' => function ($q) {
            $q->where('status', 'active');
        }]);

        // Non-staff or explicitly requested active_only gets only active plans
        if (! $isStaff || $request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $plans = $query->orderBy('price', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => MembershipPlanResource::collection($plans),
        ]);
    }

    /**
     * Store a newly created membership plan.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', MembershipPlan::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'duration_type' => ['required', 'string', 'in:day,week,month,year'],
            'duration_value' => ['required', 'integer', 'min:1', 'max:365'],
            'access_hours_type' => ['nullable', 'string', 'in:all_day,off_peak,morning,evening'],
            'has_trainer_access' => ['nullable', 'boolean'],
            'has_class_access' => ['nullable', 'boolean'],
            'max_class_bookings' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $baseSlug = Str::slug($validated['name']);
        $slug = $baseSlug;
        $counter = 1;
        while (MembershipPlan::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $plan = MembershipPlan::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'currency' => strtoupper($validated['currency'] ?? 'ETB'),
            'duration_type' => $validated['duration_type'],
            'duration_value' => $validated['duration_value'],
            'access_hours_type' => $validated['access_hours_type'] ?? 'all_day',
            'has_trainer_access' => (bool) ($validated['has_trainer_access'] ?? false),
            'has_class_access' => (bool) ($validated['has_class_access'] ?? false),
            'max_class_bookings' => $validated['max_class_bookings'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AuditLogger::log(
            action: 'plan.created',
            auditable: $plan,
            newValues: ['name' => $plan->name, 'price' => $plan->price, 'slug' => $plan->slug],
            notes: "Created membership plan {$plan->name} ({$plan->price} {$plan->currency})"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Membership plan '{$plan->name}' created successfully.",
            'data' => new MembershipPlanResource($plan),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified membership plan.
     */
    public function show(MembershipPlan $membership_plan): JsonResponse
    {
        $this->authorize('view', $membership_plan);

        $membership_plan->loadCount(['subscriptions' => function ($q) {
            $q->where('status', 'active');
        }]);

        return response()->json([
            'status' => 'success',
            'data' => new MembershipPlanResource($membership_plan),
        ]);
    }

    /**
     * Update the specified membership plan.
     */
    public function update(Request $request, MembershipPlan $membership_plan): JsonResponse
    {
        $this->authorize('update', $membership_plan);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'duration_type' => ['sometimes', 'required', 'string', 'in:day,week,month,year'],
            'duration_value' => ['sometimes', 'required', 'integer', 'min:1', 'max:365'],
            'access_hours_type' => ['nullable', 'string', 'in:all_day,off_peak,morning,evening'],
            'has_trainer_access' => ['nullable', 'boolean'],
            'has_class_access' => ['nullable', 'boolean'],
            'max_class_bookings' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (isset($validated['name']) && $validated['name'] !== $membership_plan->name) {
            $baseSlug = Str::slug($validated['name']);
            $slug = $baseSlug;
            $counter = 1;
            while (MembershipPlan::withTrashed()->where('slug', $slug)->where('id', '!=', $membership_plan->id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $validated['slug'] = $slug;
        }

        $membership_plan->update($validated);

        AuditLogger::log(
            action: 'plan.updated',
            auditable: $membership_plan,
            newValues: $validated,
            notes: "Updated membership plan {$membership_plan->name}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Membership plan '{$membership_plan->name}' updated successfully.",
            'data' => new MembershipPlanResource($membership_plan),
        ]);
    }

    /**
     * Remove the specified membership plan from storage.
     */
    public function destroy(Request $request, MembershipPlan $membership_plan): JsonResponse
    {
        $this->authorize('delete', $membership_plan);

        $activeSubscriptions = $membership_plan->subscriptions()->where('status', 'active')->count();
        if ($activeSubscriptions > 0) {
            // If active members are currently subscribed, deactivate instead of force deleting
            $membership_plan->update(['is_active' => false]);

            AuditLogger::log(
                action: 'plan.deactivated',
                auditable: $membership_plan,
                notes: "Deactivated membership plan {$membership_plan->name} with {$activeSubscriptions} active subscriptions"
            );

            return response()->json([
                'status' => 'success',
                'message' => "Plan has active subscriptions; it has been deactivated rather than deleted.",
            ]);
        }

        $membership_plan->delete();

        AuditLogger::log(
            action: 'plan.deleted',
            auditable: $membership_plan,
            notes: "Deleted membership plan {$membership_plan->name}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Membership plan '{$membership_plan->name}' deleted successfully.",
        ]);
    }
}
