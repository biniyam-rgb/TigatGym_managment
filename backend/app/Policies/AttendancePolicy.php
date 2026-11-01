<?php

namespace App\Policies;

use App\Models\AttendanceRecord;
use App\Models\TrainerAssignment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Auth\Access\Response;

class AttendancePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any attendance records.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole('owner', 'admin', 'receptionist', 'trainer', 'member');
    }

    /**
     * Determine whether the user can view the specific attendance record.
     */
    public function view(User $user, AttendanceRecord $record): bool
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return true;
        }

        if ($user->hasRole('member') && $record->member_id === $user->id) {
            return true;
        }

        if ($user->hasRole('trainer')) {
            return TrainerAssignment::where('trainer_id', $user->id)
                ->where('member_id', $record->member_id)
                ->where('status', 'active')
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can process check-in for members.
     */
    public function create(User $user): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only front-desk staff and management can process member check-ins.');
    }

    /**
     * Determine whether the user can process check-out.
     */
    public function checkOut(User $user): Response
    {
        if ($user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return Response::allow();
        }

        return Response::deny('Only front-desk staff and management can process check-outs.');
    }

    /**
     * Determine whether the user can update/correct an attendance record.
     */
    public function update(User $user, AttendanceRecord $record): Response
    {
        if ($user->hasAnyRole('owner', 'admin')) {
            return Response::allow();
        }

        return Response::deny('Only administrators or owners can correct attendance history.');
    }

    /**
     * Determine whether the user can delete an attendance record.
     * Per SRS Section 2.2: Attendance history cannot be deleted directly.
     */
    public function delete(User $user, AttendanceRecord $record): Response
    {
        return Response::deny('Attendance audit history cannot be deleted per gym security policies.');
    }
}
