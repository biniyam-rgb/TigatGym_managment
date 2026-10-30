<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\MembershipPlan;
use App\Models\Subscription;
use App\Models\TrainerAssignment;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class SubscriptionController extends Controller
{
    /**
     * Display a listing of subscriptions.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Subscription::class);

        $currentUser = $request->user();
        $query = Subscription::with(['member.memberProfile', 'plan', 'createdBy']);

        // Role-based scoping:
        if ($currentUser->hasRole('member')) {
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

        // Filter by plan
        if ($request->filled('plan_id')) {
            $query->where('membership_plan_id', $request->plan_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search by subscription_number or member name/code
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('subscription_number', 'like', "%{$search}%")
                  ->orWhereHas('member', function ($mq) use ($search) {
                      $mq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%")
                         ->orWhereHas('memberProfile', function ($pq) use ($search) {
                             $pq->where('member_code', 'like', "%{$search}%");
                         });
                  });
            });
        }

        $subscriptions = $query->orderBy('created_at', 'desc')->paginate($request->integer('per_page', 25));

        return response()->json([
            'status' => 'success',
            'data' => SubscriptionResource::collection($subscriptions->items()),
            'meta' => [
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
            ],
        ]);
    }

    /**
     * Store a newly created subscription (Assign plan to member).
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Subscription::class);

        $validated = $request->validate([
            'member_id' => ['required', 'integer', 'exists:users,id'],
            'membership_plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'start_date' => ['nullable', 'date'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'is_auto_renew' => ['nullable', 'boolean'],
        ]);

        $member = User::findOrFail($validated['member_id']);
        if (! $member->hasRole('member')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Subscriptions can only be assigned to gym members.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $plan = MembershipPlan::findOrFail($validated['membership_plan_id']);
        $startDate = $request->filled('start_date') ? Carbon::parse($validated['start_date']) : Carbon::today();
        $endDate = $plan->calculateEndDate($startDate);

        $price = (float) $plan->price;
        $discount = (float) ($validated['discount'] ?? 0);
        if ($discount > $price) {
            $discount = $price;
        }
        $totalAmount = max(0, $price - $discount);

        $subscription = DB::transaction(function () use ($validated, $plan, $startDate, $endDate, $price, $discount, $totalAmount, $request) {
            $subscriptionNumber = Subscription::generateNextSubscriptionNumber();

            $sub = Subscription::create([
                'member_id' => $validated['member_id'],
                'membership_plan_id' => $plan->id,
                'subscription_number' => $subscriptionNumber,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'status' => 'active',
                'price' => $price,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'currency' => $plan->currency ?? 'ETB',
                'is_auto_renew' => (bool) ($validated['is_auto_renew'] ?? false),
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            AuditLogger::log(
                action: 'subscription.assigned',
                auditable: $sub,
                newValues: [
                    'subscription_id' => $sub->id,
                    'member_id' => $sub->member_id,
                    'plan_id' => $plan->id,
                    'total_amount' => $totalAmount,
                ],
                notes: "Assigned {$plan->name} ({$sub->subscription_number}) to {$sub->member->name}"
            );

            return $sub;
        });

        $subscription->load(['member.memberProfile', 'plan', 'createdBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Subscription {$subscription->subscription_number} assigned successfully.",
            'data' => new SubscriptionResource($subscription),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified subscription.
     */
    public function show(Subscription $subscription): JsonResponse
    {
        $this->authorize('view', $subscription);

        $subscription->load(['member.memberProfile', 'plan', 'createdBy']);

        return response()->json([
            'status' => 'success',
            'data' => new SubscriptionResource($subscription),
        ]);
    }

    /**
     * Renew an existing subscription.
     * SRS C.5:
     * - If active, appends new duration to the current end date (+1 day).
     * - If expired, begins immediately from today.
     */
    public function renew(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('renew', $subscription);

        $validated = $request->validate([
            'membership_plan_id' => ['nullable', 'integer', 'exists:membership_plans,id'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $plan = isset($validated['membership_plan_id'])
            ? MembershipPlan::findOrFail($validated['membership_plan_id'])
            : $subscription->plan;

        $today = Carbon::today();
        $isCurrentlyActive = $subscription->isActive();

        if ($isCurrentlyActive) {
            $startDate = Carbon::parse($subscription->end_date)->addDay();
        } else {
            $startDate = $today;
        }

        $endDate = $plan->calculateEndDate($startDate);
        $price = (float) $plan->price;
        $discount = (float) ($validated['discount'] ?? 0);
        if ($discount > $price) {
            $discount = $price;
        }
        $totalAmount = max(0, $price - $discount);

        $renewedSubscription = DB::transaction(function () use ($subscription, $plan, $startDate, $endDate, $price, $discount, $totalAmount, $validated, $request) {
            $subscriptionNumber = Subscription::generateNextSubscriptionNumber();

            $newSub = Subscription::create([
                'member_id' => $subscription->member_id,
                'membership_plan_id' => $plan->id,
                'subscription_number' => $subscriptionNumber,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'status' => 'active',
                'price' => $price,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'currency' => $plan->currency ?? 'ETB',
                'notes' => trim(($validated['notes'] ?? '') . " (Renewal of {$subscription->subscription_number})"),
                'created_by' => $request->user()?->id,
            ]);

            // If old subscription was pending or expired, leave status updated
            if ($subscription->status === 'expired' || $subscription->end_date < now()->toDateString()) {
                $subscription->update(['status' => 'expired']);
            }

            AuditLogger::log(
                action: 'subscription.renewed',
                auditable: $newSub,
                newValues: [
                    'previous_subscription_id' => $subscription->id,
                    'new_subscription_id' => $newSub->id,
                    'member_id' => $subscription->member_id,
                ],
                notes: "Renewed subscription for {$subscription->member->name}: {$newSub->subscription_number} ({$startDate->toDateString()} to {$endDate->toDateString()})"
            );

            return $newSub;
        });

        $renewedSubscription->load(['member.memberProfile', 'plan', 'createdBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Subscription renewed successfully as {$renewedSubscription->subscription_number}.",
            'data' => new SubscriptionResource($renewedSubscription),
        ], Response::HTTP_CREATED);
    }

    /**
     * Freeze an active subscription.
     */
    public function freeze(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('freeze', $subscription);

        if ($subscription->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only active subscriptions can be frozen.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'frozen_until' => ['required', 'date', 'after:today'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $frozenUntil = Carbon::parse($validated['frozen_until']);
        $freezeDays = Carbon::today()->diffInDays($frozenUntil);

        // Extend the subscription end_date by the freeze duration
        $currentEnd = Carbon::parse($subscription->end_date);
        $newEnd = $currentEnd->copy()->addDays($freezeDays);

        $subscription->status = 'frozen';
        $subscription->frozen_until = $frozenUntil->toDateString();
        $subscription->end_date = $newEnd->toDateString();
        $subscription->notes = trim(($subscription->notes ?? '') . "\n[Frozen on " . Carbon::today()->toDateString() . " until {$frozenUntil->toDateString()}: {$validated['reason']}]");
        $subscription->save();

        AuditLogger::log(
            action: 'subscription.frozen',
            auditable: $subscription,
            newValues: ['frozen_until' => $frozenUntil->toDateString(), 'reason' => $validated['reason']],
            notes: "Froze subscription {$subscription->subscription_number} until {$frozenUntil->toDateString()} (+{$freezeDays} days extended)"
        );

        $subscription->load(['member.memberProfile', 'plan', 'createdBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Subscription {$subscription->subscription_number} frozen until {$frozenUntil->toDateString()}.",
            'data' => new SubscriptionResource($subscription),
        ]);
    }

    /**
     * Unfreeze a frozen subscription.
     */
    public function unfreeze(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('unfreeze', $subscription);

        if ($subscription->status !== 'frozen') {
            return response()->json([
                'status' => 'error',
                'message' => 'Subscription is not currently frozen.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $subscription->status = 'active';
        $subscription->frozen_until = null;
        $subscription->notes = trim(($subscription->notes ?? '') . "\n[Unfrozen on " . Carbon::today()->toDateString() . "]");
        $subscription->save();

        AuditLogger::log(
            action: 'subscription.unfrozen',
            auditable: $subscription,
            notes: "Unfroze subscription {$subscription->subscription_number}"
        );

        $subscription->load(['member.memberProfile', 'plan', 'createdBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Subscription {$subscription->subscription_number} has been unfrozen and reactivated.",
            'data' => new SubscriptionResource($subscription),
        ]);
    }

    /**
     * Cancel an active or frozen subscription.
     */
    public function cancel(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('cancel', $subscription);

        if (in_array($subscription->status, ['cancelled', 'expired'], true)) {
            return response()->json([
                'status' => 'error',
                'message' => "Subscription is already {$subscription->status}.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'cancellation_reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $subscription->status = 'cancelled';
        $subscription->cancellation_reason = $validated['cancellation_reason'];
        $subscription->cancelled_at = now();
        $subscription->save();

        AuditLogger::log(
            action: 'subscription.cancelled',
            auditable: $subscription,
            newValues: ['cancellation_reason' => $validated['cancellation_reason']],
            notes: "Cancelled subscription {$subscription->subscription_number}: {$validated['cancellation_reason']}"
        );

        $subscription->load(['member.memberProfile', 'plan', 'createdBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Subscription {$subscription->subscription_number} cancelled successfully.",
            'data' => new SubscriptionResource($subscription),
        ]);
    }

    /**
     * Delete a subscription record.
     */
    public function destroy(Request $request, Subscription $subscription): JsonResponse
    {
        $this->authorize('delete', $subscription);

        $subscription->delete();

        AuditLogger::log(
            action: 'subscription.deleted',
            auditable: $subscription,
            notes: "Deleted subscription record {$subscription->subscription_number}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Subscription {$subscription->subscription_number} deleted successfully.",
        ]);
    }
}
