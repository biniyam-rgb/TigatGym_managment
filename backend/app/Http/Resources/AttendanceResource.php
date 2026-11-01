<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'member_id' => $this->member_id,
            'subscription_id' => $this->subscription_id,
            'check_in_time' => $this->check_in_time?->toIso8601String(),
            'check_out_time' => $this->check_out_time?->toIso8601String(),
            'duration_minutes' => $this->duration_minutes,
            'method' => $this->method,
            'status' => $this->status,
            'denial_reason' => $this->denial_reason,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'member' => $this->whenLoaded('member', function () {
                return [
                    'id' => $this->member->id,
                    'name' => $this->member->name,
                    'email' => $this->member->email,
                    'phone' => $this->member->phone,
                    'status' => $this->member->status,
                    'avatar' => $this->member->avatar,
                    'member_code' => $this->member->memberProfile?->member_code,
                    'gender' => $this->member->memberProfile?->gender,
                    'qr_code_token' => $this->member->memberProfile?->qr_code_token,
                ];
            }),
            'subscription' => $this->whenLoaded('subscription', function () {
                if (! $this->subscription) {
                    return null;
                }
                return [
                    'id' => $this->subscription->id,
                    'subscription_number' => $this->subscription->subscription_number,
                    'plan_name' => $this->subscription->plan?->name,
                    'start_date' => $this->subscription->start_date?->toDateString(),
                    'end_date' => $this->subscription->end_date?->toDateString(),
                    'status' => $this->subscription->status,
                ];
            }),
            'verified_by' => $this->whenLoaded('verifiedBy', function () {
                if (! $this->verifiedBy) {
                    return null;
                }
                return [
                    'id' => $this->verifiedBy->id,
                    'name' => $this->verifiedBy->name,
                ];
            }),
        ];
    }
}
