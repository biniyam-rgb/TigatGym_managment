<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();
        $isSelf = $currentUser && $currentUser->id === $this->user_id;
        $isStaff = $currentUser && $currentUser->hasAnyRole('owner', 'admin', 'receptionist');
        $isTrainer = $currentUser && $currentUser->hasRole('trainer');

        // Check if trainer is assigned to this member
        $isAssignedTrainer = false;
        if ($isTrainer) {
            $isAssignedTrainer = \App\Models\TrainerAssignment::where('trainer_id', $currentUser->id)
                ->where('member_id', $this->user_id)
                ->where('status', 'active')
                ->exists();
        }

        $canViewSensitive = $isSelf || $isStaff || $isAssignedTrainer;

        // Retrieve active subscription covering the member's paid duration
        $activeSubscription = $this->whenLoaded('subscriptions', function () {
            $today = now()->toDateString();
            return $this->subscriptions
                ->where('status', 'active')
                ->filter(function ($s) use ($today) {
                    $end = $s->end_date ? $s->end_date->format('Y-m-d') : null;
                    return $end && $end >= $today;
                })
                ->sortByDesc('end_date')
                ->first();
        });

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'member_code' => $this->member_code,
            'name' => $this->user?->name,
            'email' => $this->user?->email,
            'phone' => $this->user?->phone,
            'status' => $this->user?->status ?? 'active',
            'suspension_reason' => $this->user?->suspension_reason,
            'suspended_at' => $this->user?->suspended_at?->toIso8601String(),
            'suspended_by' => $this->user?->suspended_by,
            'suspended_by_name' => $this->user?->suspender?->name,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'gender' => $this->gender,
            'blood_type' => $this->blood_type,
            'address' => $this->address,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'emergency_contact_relationship' => $this->emergency_contact_relationship,
            'fitness_goals' => $this->fitness_goals,
            // Sensitive medical/health notes are protected by least privilege
            'health_conditions' => $canViewSensitive ? $this->health_conditions : null,
            // QR code token for scanning/display
            'qr_code_token' => $this->qr_code_token,
            'joined_at' => $this->joined_at?->format('Y-m-d'),
            'card_expires_at' => $this->joined_at ? $this->joined_at->copy()->addYear()->format('Y-m-d') : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'active_subscription' => $activeSubscription ? [
                'id' => $activeSubscription->id,
                'subscription_number' => $activeSubscription->subscription_number,
                'membership_plan_id' => $activeSubscription->membership_plan_id,
                'plan_name' => $activeSubscription->membershipPlan?->name,
                'start_date' => $activeSubscription->start_date?->format('Y-m-d'),
                'end_date' => $activeSubscription->end_date?->format('Y-m-d'),
                'status' => $activeSubscription->status,
                'days_remaining' => $activeSubscription->days_remaining,
            ] : null,
        ];
    }
}
