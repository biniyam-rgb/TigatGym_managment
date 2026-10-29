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
            'status' => $this->status,
            'avatar' => $this->avatar,
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
