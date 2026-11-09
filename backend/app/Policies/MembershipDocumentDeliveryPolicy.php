<?php

namespace App\Policies;

use App\Models\MembershipDocumentDelivery;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MembershipDocumentDeliveryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist');
    }

    public function view(User $user, MembershipDocumentDelivery $delivery): bool
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return true;
        }

        return $user->hasRole('member') && (int) $delivery->user_id === (int) $user->id;
    }

    public function resend(User $user, MembershipDocumentDelivery $delivery): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist');
    }

    public function download(User $user, MembershipDocumentDelivery $delivery): bool
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return true;
        }

        return $user->hasRole('member') && (int) $delivery->user_id === (int) $user->id;
    }
}
