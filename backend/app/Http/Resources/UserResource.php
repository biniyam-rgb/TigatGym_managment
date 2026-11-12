<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $roleNames = $this->roles->pluck('name')->values()->all();

        // Priority order for multi-role staff: owner > admin > receptionist > trainer > member
        $priorityOrder = ['owner', 'admin', 'receptionist', 'trainer', 'member'];
        $primaryRole = 'member';
        foreach ($priorityOrder as $role) {
            if (in_array($role, $roleNames, true)) {
                $primaryRole = $role;
                break;
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'work_shift' => $this->work_shift,
            'desk_station' => $this->desk_station,
            'emergency_contact' => $this->emergency_contact,
            'employee_id_number' => $this->employee_id_number,
            'status' => $this->status,
            'suspension_reason' => $this->suspension_reason,
            'suspended_at' => $this->suspended_at?->toIso8601String(),
            'suspended_by' => $this->suspended_by,
            'suspended_by_name' => $this->suspender?->name,
            'avatar' => $this->avatar ? (str_starts_with($this->avatar, 'http') || str_starts_with($this->avatar, 'data:') ? $this->avatar : url($this->avatar)) : null,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'roles' => RoleResource::collection($this->whenLoaded('roles', $this->roles)),
            'role_names' => $roleNames,
            'primary_role' => $primaryRole,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'member_profile' => $this->whenLoaded('memberProfile'),
            'trainer_profile' => $this->whenLoaded('trainerProfile'),
        ];
    }
}
