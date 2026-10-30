<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $today = Carbon::today();
        $endDate = $this->end_date ? Carbon::parse($this->end_date) : null;
        $daysRemaining = 0;
        if ($endDate && $this->status === 'active') {
            $diff = $today->diffInDays($endDate, false);
            $daysRemaining = (int) max(0, $diff);
        }

        return [
            'id' => $this->id,
            'subscription_number' => $this->subscription_number,
            'member_id' => $this->member_id,
            'member' => $this->whenLoaded('member', function () {
                return [
                    'id' => $this->member->id,
                    'name' => $this->member->name,
                    'email' => $this->member->email,
                    'phone' => $this->member->phone,
                    'status' => $this->member->status,
                    'member_code' => $this->member->memberProfile?->member_code,
                ];
            }),
            'membership_plan_id' => $this->membership_plan_id,
            'plan' => $this->whenLoaded('plan', function () {
                return [
                    'id' => $this->plan->id,
                    'name' => $this->plan->name,
                    'slug' => $this->plan->slug,
                    'duration_type' => $this->plan->duration_type,
                    'duration_value' => $this->plan->duration_value,
                    'access_hours_type' => $this->plan->access_hours_type,
                    'has_trainer_access' => (bool) $this->plan->has_trainer_access,
                    'has_class_access' => (bool) $this->plan->has_class_access,
                ];
            }),
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'status' => $this->status,
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'frozen_until' => $this->frozen_until?->format('Y-m-d'),
            'price' => (float) $this->price,
            'discount' => (float) $this->discount,
            'total_amount' => (float) $this->total_amount,
            'currency' => $this->currency ?? 'ETB',
            'is_auto_renew' => (bool) $this->is_auto_renew,
            'notes' => $this->notes,
            'days_remaining' => $daysRemaining,
            'is_active' => $this->isActive(),
            'is_frozen' => $this->isFrozen(),
            'is_expired' => $this->isExpired(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
