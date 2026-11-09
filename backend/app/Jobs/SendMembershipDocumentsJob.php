<?php

namespace App\Jobs;

use App\Mail\MembershipDocumentsMail;
use App\Models\MembershipDocumentDelivery;
use App\Services\GymPdfService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendMembershipDocumentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [60, 300, 600];

    public function __construct(public MembershipDocumentDelivery $delivery) {}

    public function handle(): void
    {
        $this->delivery->refresh();

        // Idempotency: Never re-send if already marked sent
        if ($this->delivery->isSent()) {
            Log::info("Document delivery #{$this->delivery->id} already sent, skipping.");
            return;
        }

        $payment = $this->delivery->payment;
        $user = $this->delivery->user;
        $subscription = $this->delivery->subscription;

        if (! $payment || ! $user) {
            $this->delivery->update([
                'status' => 'failed',
                'error_message' => 'Associated payment or user record missing.',
                'last_attempt_at' => now(),
            ]);
            return;
        }

        $email = trim((string) $this->delivery->recipient_email);

        // Check for missing or placeholder emails
        if (empty($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL) || str_ends_with($email, '@members.tigatgym.com')) {
            $this->delivery->update([
                'status' => 'skipped_no_email',
                'error_message' => 'Member has no valid personal email address registered.',
                'last_attempt_at' => now(),
            ]);
            Log::info("Skipped document delivery #{$this->delivery->id}: member #{$user->id} has no valid email.");
            return;
        }

        $this->delivery->increment('attempts');
        $this->delivery->update(['last_attempt_at' => now()]);

        try {
            $profile = $user->memberProfile;
            $memberCode = $profile?->member_code ?? ("TG-" . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT));

            // Determine plan name and validity
            $planName = $subscription?->plan?->name ?? 'Gym Membership';
            $validityPeriod = '1 Year Turnstile Access';
            if ($subscription && $subscription->start_date && $subscription->end_date) {
                $validityPeriod = GymPdfService::formatDate(Carbon::parse($subscription->start_date)) . ' — ' . GymPdfService::formatDate(Carbon::parse($subscription->end_date));
            }

            // Generate PDFs
            $cardPdf = GymPdfService::generateMembershipCardPdf($user, $profile, $subscription);
            $receiptPdf = GymPdfService::generatePaymentReceiptPdf($payment, $user, $subscription);

            $safeMemberCode = preg_replace('/[^A-Za-z0-9_-]/', '', $memberCode);
            $safeReceiptNum = preg_replace('/[^A-Za-z0-9_-]/', '', $payment->receipt_number);
            $cardFilename = "TigatGym-Membership-Card-{$safeMemberCode}.pdf";
            $receiptFilename = "TigatGym-Payment-Receipt-{$safeReceiptNum}.pdf";

            // Send Email with both attachments
            Mail::to($email)->send(
                new MembershipDocumentsMail(
                    user: $user,
                    payment: $payment,
                    subscription: $subscription,
                    cardPdfBinary: $cardPdf,
                    receiptPdfBinary: $receiptPdf,
                    memberCode: $memberCode,
                    planName: $planName,
                    validityPeriod: $validityPeriod
                )
            );

            $this->delivery->update([
                'status' => 'sent',
                'card_filename' => $cardFilename,
                'receipt_filename' => $receiptFilename,
                'sent_at' => now(),
                'error_message' => null,
            ]);

            Log::info("Successfully sent membership documents for payment #{$payment->payment_number} to {$email}");
        } catch (Throwable $e) {
            $safeMessage = substr(strip_tags($e->getMessage()), 0, 500);
            $this->delivery->update([
                'status' => 'failed',
                'error_message' => $safeMessage,
            ]);

            Log::error("Failed to send membership documents for delivery #{$this->delivery->id}: {$safeMessage}");
            throw $e;
        }
    }

    public function failed(?Throwable $exception): void
    {
        $safeMessage = $exception ? substr(strip_tags($exception->getMessage()), 0, 500) : 'Job failed after all attempts.';
        $this->delivery->update([
            'status' => 'failed',
            'error_message' => $safeMessage,
            'last_attempt_at' => now(),
        ]);
    }
}
