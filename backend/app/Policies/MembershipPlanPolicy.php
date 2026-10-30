<?php

namespace App\Policies;

use App\Models\MembershipPlan;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class MembershipPlanPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view membership plans.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view a specific membership plan.
     */
    public function view(User $user, MembershipPlan $plan): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create membership plans.
     */
    public function create(User $user): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym owners and administrators can create membership plans.');
    }

    /**
     * Determine whether the user can update the membership plan.
     */
    public function update(User $user, MembershipPlan $plan): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym owners and administrators can modify membership plans.');
    }

    /**
     * Determine whether the user can delete or archive the membership plan.
     */
    public function delete(User $user, MembershipPlan $plan): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym owners and administrators can delete membership plans.');
    }
}
