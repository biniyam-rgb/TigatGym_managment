<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\TrainerAssignment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class SubscriptionPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view subscriptions list.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist', 'trainer', 'member');
    }

    /**
     * Determine whether the user can view a specific subscription.
     */
    public function view(User $user, Subscription $subscription): bool
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return true;
        }

        if ($user->id === $subscription->member_id) {
            return true;
        }

        if ($user->hasRole('trainer')) {
            return TrainerAssignment::where('trainer_id', $user->id)
                ->where('member_id', $subscription->member_id)
                ->where('status', 'active')
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can assign a subscription.
     */
    public function create(User $user): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only reception and management staff can assign subscriptions.');
    }

    /**
     * Determine whether the user can renew a subscription.
     */
    public function renew(User $user, Subscription $subscription): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only reception and management staff can process subscription renewals.');
    }

    /**
     * Determine whether the user can freeze a subscription.
     */
    public function freeze(User $user, Subscription $subscription): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only authorized staff can freeze subscriptions.');
    }

    /**
     * Determine whether the user can unfreeze a subscription.
     */
    public function unfreeze(User $user, Subscription $subscription): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only authorized staff can unfreeze subscriptions.');
    }

    /**
     * Determine whether the user can cancel a subscription.
     */
    public function cancel(User $user, Subscription $subscription): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym owners and administrators can terminate subscriptions.');
    }

    /**
     * Determine whether the user can delete a subscription record.
     */
    public function delete(User $user, Subscription $subscription): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym owners and administrators can delete subscription records.');
    }
}
