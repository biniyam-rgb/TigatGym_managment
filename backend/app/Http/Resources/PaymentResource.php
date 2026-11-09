<?php

namespace App\Http\Resources;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'payment_number' => $this->payment_number,
            'receipt_number' => $this->receipt_number,
            'user_id' => $this->user_id,
            'amount' => (float) $this->amount,
            'currency' => $this->currency ?? 'ETB',
            'payment_method' => $this->payment_method,
            'payment_type' => $this->payment_type,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'member' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                    'member_code' => $this->user->memberProfile?->member_code,
                    'status' => $this->user->status,
                ];
            }),
            'recorded_by' => $this->whenLoaded('recordedBy', function () {
                return [
                    'id' => $this->recordedBy?->id,
                    'name' => $this->recordedBy?->name,
                    'email' => $this->recordedBy?->email,
                ];
            }),
            'payable_type' => $this->payable_type,
            'payable_id' => $this->payable_id,
            'payable' => $this->whenLoaded('payable', function () {
                if ($this->payable instanceof Subscription) {
                    return [
                        'id' => $this->payable->id,
                        'subscription_number' => $this->payable->subscription_number,
                        'plan_name' => $this->payable->plan?->name,
                        'plan_id' => $this->payable->membership_plan_id,
                        'start_date' => $this->payable->start_date?->toDateString(),
                        'end_date' => $this->payable->end_date?->toDateString(),
                        'status' => $this->payable->status,
                    ];
                }
                return null;
            }),
            'document_delivery' => $this->whenLoaded('documentDelivery', function () {
                return [
                    'id' => $this->documentDelivery->id,
                    'status' => $this->documentDelivery->status,
                    'recipient_email' => $this->documentDelivery->recipient_email,
                    'sent_at' => $this->documentDelivery->sent_at?->toIso8601String(),
                    'last_attempt_at' => $this->documentDelivery->last_attempt_at?->toIso8601String(),
                    'attempts' => $this->documentDelivery->attempts,
                    'card_filename' => $this->documentDelivery->card_filename,
                    'receipt_filename' => $this->documentDelivery->receipt_filename,
                    'error_message' => $this->documentDelivery->error_message,
                ];
            }),
            'transactions' => $this->whenLoaded('transactions', function () {
                return $this->transactions->map(function ($tx) {
                    return [
                        'id' => $tx->id,
                        'transaction_reference' => $tx->transaction_reference,
                        'gateway' => $tx->gateway,
                        'gateway_reference' => $tx->gateway_reference,
                        'amount' => (float) $tx->amount,
                        'currency' => $tx->currency,
                        'status' => $tx->status,
                        'bank_name' => $tx->bank_name,
                        'bank_account_number' => $tx->bank_account_number,
                        'verified_at' => $tx->verified_at?->toIso8601String(),
                        'created_at' => $tx->created_at?->toIso8601String(),
                    ];
                });
            }),
        ];
    }
}
