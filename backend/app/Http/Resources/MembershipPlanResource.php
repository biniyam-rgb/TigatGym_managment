<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MembershipPlanResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (float) $this->price,
            'currency' => $this->currency,
            'duration_type' => $this->duration_type,
            'duration_value' => $this->duration_value,
            'duration_label' => "{$this->duration_value} " . ucfirst($this->duration_type) . ($this->duration_value > 1 ? 's' : ''),
            'access_hours_type' => $this->access_hours_type,
            'has_trainer_access' => (bool) $this->has_trainer_access,
            'has_class_access' => (bool) $this->has_class_access,
            'max_class_bookings' => $this->max_class_bookings,
            'is_active' => (bool) $this->is_active,
            'active_subscribers_count' => $this->whenCounted('subscriptions'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
