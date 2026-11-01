<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class PaymentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any payments.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist', 'member');
    }

    /**
     * Determine whether the user can view the payment.
     */
    public function view(User $user, Payment $payment): bool
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return true;
        }

        return $user->hasRole('member') && $payment->user_id === $user->id;
    }

    /**
     * Determine whether the user can create payments.
     */
    public function create(User $user): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only gym staff can record payments.');
    }

    /**
     * Determine whether the user can update the payment.
     */
    public function update(User $user, Payment $payment): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym administrators or owners can update payment records.');
    }

    /**
     * Determine whether the user can issue a refund for the payment.
     */
    public function refund(User $user, Payment $payment): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only gym administrators or owners can refund payments.');
    }

    /**
     * Determine whether the user can delete the payment.
     * Per SRS 2.2: Strict restriction - No direct deletion of financial history.
     */
    public function delete(User $user, Payment $payment): Response
    {
        return Response::deny('Direct deletion of financial records is strictly forbidden.');
    }
}
