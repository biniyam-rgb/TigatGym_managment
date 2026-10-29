<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any users list.
     */
    public function viewAny(User $user): bool
    {
        // Owner and Admin can list users. Receptionist can view members and trainers.
        return $user->hasAnyRole('owner', 'admin', 'receptionist');
    }

    /**
     * Determine whether the user can view a specific user's details.
     */
    public function view(User $user, User $target): bool
    {
        // Owners and Admins have global view access
        if ($user->hasAnyRole('owner', 'admin')) {
            return true;
        }

        // Users can view their own profile
        if ($user->id === $target->id) {
            return true;
        }

        // Receptionists can view members and trainers
        if ($user->hasRole('receptionist') && $target->hasAnyRole('member', 'trainer')) {
            return true;
        }

        // Trainers can view members assigned to them
        if ($user->hasRole('trainer') && $target->hasRole('member')) {
            // Check if member is assigned to this trainer
            $isAssigned = \App\Models\TrainerAssignment::where('trainer_id', $user->id)
                ->where('member_id', $target->id)
                ->where('status', 'active')
                ->exists();

            return $isAssigned;
        }

        return false;
    }

    /**
     * Determine whether the user can create accounts.
     */
    public function create(User $user, string $targetRole = 'member'): Response
    {
        if ($user->isOwner()) {
            return Response::allow();
        }

        if ($user->isAdmin()) {
            if ($targetRole === 'owner') {
                return Response::deny('Admins cannot create owner accounts.');
            }
            return Response::allow();
        }

        if ($user->isReceptionist()) {
            if ($targetRole === 'member') {
                return Response::allow();
            }
            return Response::deny('Receptionists can only register member accounts.');
        }

        return Response::deny('You do not have permission to create user accounts.');
    }

    /**
     * Determine whether the user can update the target user.
     */
    public function update(User $user, User $target): Response
    {
        // Owners can update any account
        if ($user->isOwner()) {
            return Response::allow();
        }

        // Target is an owner, but user is not an owner
        if ($target->isOwner() && ! $user->isOwner()) {
            return Response::deny('Only gym owners can update owner accounts.');
        }

        // Admin can update staff (except owners) and members
        if ($user->isAdmin()) {
            return Response::allow();
        }

        // Receptionists can update member details
        if ($user->isReceptionist() && $target->hasRole('member')) {
            return Response::allow();
        }

        // Members can only update their own profile
        if ($user->id === $target->id) {
            return Response::allow();
        }

        return Response::deny('You do not have permission to update this user.');
    }

    /**
     * Determine whether the user can change account status (active/inactive/suspended).
     */
    public function changeStatus(User $user, User $target, string $newStatus): Response
    {
        if ($user->id === $target->id && $newStatus !== 'active') {
            return Response::deny('You cannot deactivate or suspend your own account.');
        }

        // Target is an owner
        if ($target->isOwner()) {
            if (! $user->isOwner()) {
                return Response::deny('Only gym owners can modify owner account status.');
            }

            // Check last owner safety: if target is being deactivated/suspended
            if ($newStatus !== 'active') {
                $activeOwnersCount = User::role('owner')->where('status', 'active')->count();
                if ($activeOwnersCount <= 1) {
                    return Response::deny('Cannot disable the last active owner account.');
                }
            }
        }

        if ($user->isOwner()) {
            return Response::allow();
        }

        if ($user->isAdmin()) {
            if ($target->isOwner()) {
                return Response::deny('Admins cannot modify owner status.');
            }
            return Response::allow();
        }

        return Response::deny('You do not have permission to modify account status.');
    }

    /**
     * Determine whether the user can delete the target user.
     */
    public function delete(User $user, User $target): Response
    {
        // Target is an owner
        if ($target->isOwner()) {
            if (! $user->isOwner()) {
                return Response::deny('Only gym owners can delete owner accounts.');
            }

            // Safety rule: Never delete the last active owner
            $activeOwnersCount = User::role('owner')->where('status', 'active')->count();
            if ($activeOwnersCount <= 1) {
                return Response::deny('Cannot delete the last active owner account.');
            }
        }

        // Prevent self-deletion
        if ($user->id === $target->id) {
            return Response::deny('You cannot delete your own account.');
        }

        if ($user->isOwner()) {
            return Response::allow();
        }

        if ($user->isAdmin()) {
            if ($target->isOwner()) {
                return Response::deny('Admins cannot delete owner accounts.');
            }
            return Response::allow();
        }

        return Response::deny('You do not have permission to delete this user.');
    }

    /**
     * Determine whether the user can assign a role to target.
     */
    public function assignRole(User $user, User $target, string $roleName): Response
    {
        // Only owners and admins can assign roles
        if (! $user->hasAnyRole('owner', 'admin')) {
            return Response::deny('You do not have permission to assign roles.');
        }

        // Only owners can assign or promote to the 'owner' role
        if ($roleName === 'owner' && ! $user->isOwner()) {
            return Response::deny('Only gym owners can grant the owner role.');
        }

        // Non-owners cannot modify an owner's roles
        if ($target->isOwner() && ! $user->isOwner()) {
            return Response::deny('Only gym owners can modify roles of an owner.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the user can remove a role from target.
     */
    public function removeRole(User $user, User $target, string $roleName): Response
    {
        // Only owners and admins can remove roles
        if (! $user->hasAnyRole('owner', 'admin')) {
            return Response::deny('You do not have permission to manage roles.');
        }

        // Non-owners cannot remove roles from an owner
        if ($target->isOwner() && ! $user->isOwner()) {
            return Response::deny('Only gym owners can remove roles from an owner.');
        }

        // If removing 'owner' role, check if target is the last active owner
        if ($roleName === 'owner') {
            if (! $user->isOwner()) {
                return Response::deny('Only gym owners can revoke the owner role.');
            }

            $activeOwnersCount = User::role('owner')->where('status', 'active')->count();
            if ($activeOwnersCount <= 1) {
                return Response::deny('Cannot revoke the owner role from the last active owner account.');
            }
        }

        return Response::allow();
    }
}
