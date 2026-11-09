<?php

namespace App\Listeners;

use App\Events\MembershipActivated;
use App\Jobs\SendMembershipDocumentsJob;
use App\Models\MembershipDocumentDelivery;
use Illuminate\Support\Facades\Log;

class SendMembershipDocuments
{
    public function handle(MembershipActivated $event): void
    {
        $payment = $event->payment;

        // Security check: Never send receipt or card for uncompleted/failed payments
        if ($payment->status !== 'completed') {
            Log::warning("Skipped SendMembershipDocuments: payment #{$payment->id} status is '{$payment->status}'.");
            return;
        }

        $payment->loadMissing(['user.memberProfile', 'payable.plan']);
        $user = $payment->user;
        if (! $user) {
            Log::warning("Skipped SendMembershipDocuments: payment #{$payment->id} has no associated user.");
            return;
        }

        $subscription = $event->subscription;
        if (! $subscription && $payment->payable_type === \App\Models\Subscription::class && $payment->payable_id) {
            $subscription = \App\Models\Subscription::with('plan')->find($payment->payable_id);
        }

        $recipientEmail = trim((string) $user->email);

        // Idempotency: firstOrCreate ensures only 1 delivery record per payment
        $delivery = MembershipDocumentDelivery::firstOrCreate(
            ['payment_id' => $payment->id],
            [
                'subscription_id' => $subscription?->id,
                'user_id' => $user->id,
                'recipient_email' => $recipientEmail,
                'status' => 'pending',
            ]
        );

        // If already sent, do not re-dispatch
        if ($delivery->isSent()) {
            Log::info("Document delivery for payment #{$payment->id} already completed, skipping.");
            return;
        }

        // Dispatch queued document generation & email delivery
        SendMembershipDocumentsJob::dispatch($delivery);
    }
}
