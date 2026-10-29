<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AuditLogPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view audit logs.
     */
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    /**
     * Determine whether the user can view a specific audit log.
     */
    public function view(User $user, AuditLog $auditLog): bool
    {
        return $user->isOwner();
    }
}
