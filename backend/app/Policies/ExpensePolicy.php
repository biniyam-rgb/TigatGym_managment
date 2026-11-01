<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class ExpensePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any expenses.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist');
    }

    /**
     * Determine whether the user can view the expense.
     */
    public function view(User $user, Expense $expense): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist');
    }

    /**
     * Determine whether the user can record an expense.
     */
    public function create(User $user): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only gym staff can record operational expenses.');
    }

    /**
     * Determine whether the user can update the expense.
     */
    public function update(User $user, Expense $expense): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym administrators or owners can edit expenses.');
    }

    /**
     * Determine whether the user can approve the expense.
     */
    public function approve(User $user, Expense $expense): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym administrators or owners can approve expenses.');
    }

    /**
     * Determine whether the user can delete the expense.
     */
    public function delete(User $user, Expense $expense): Response
    {
        if ($user->hasRole('owner')) {
            return Response::allow();
        }

        return Response::deny('Only the gym owner can remove expense records.');
    }
}
