<?php

namespace App\Policies;

use App\Models\MemberProfile;
use App\Models\TrainerAssignment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class MemberPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the member directory.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist', 'trainer');
    }

    /**
     * Determine whether the user can view a specific member's details.
     */
    public function view(User $user, MemberProfile $memberProfile): bool
    {
        // Staff global access
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return true;
        }

        // Member accessing own profile
        if ($user->id === $memberProfile->user_id) {
            return true;
        }

        // Trainer accessing assigned member
        if ($user->hasRole('trainer')) {
            return TrainerAssignment::where('trainer_id', $user->id)
                ->where('member_id', $memberProfile->user_id)
                ->where('status', 'active')
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can register new members.
     */
    public function create(User $user): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only authorized reception and management staff can register members.');
    }

    /**
     * Determine whether the user can update the member's profile.
     */
    public function update(User $user, MemberProfile $memberProfile): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        // Member can update their own permitted fields
        if ($user->id === $memberProfile->user_id) {
            return Response::allow();
        }

        return Response::deny('You do not have permission to update this member profile.');
    }

    /**
     * Determine whether the user can regenerate a member's QR token.
     */
    public function regenerateQr(User $user, MemberProfile $memberProfile): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only authorized staff can regenerate member QR identification tokens.');
    }

    /**
     * Determine whether the user can delete a member account.
     */
    public function delete(User $user, MemberProfile $memberProfile): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym owners and administrators can remove member records.');
    }
}
