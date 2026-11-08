<?php

namespace App\Services;

use App\Mail\MemberCardMail;
use App\Mail\PaymentReceiptMail;
use App\Models\MemberProfile;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class GymMailService
{
    /**
     * Generate standard QR Code as a base64 SVG data URI
     */
    public static function generateQrDataUri(string $token): string
    {
        try {
            $options = new QROptions();
            $options->outputBase64 = true;
            $options->quietzoneSize = 4;

            return (new QRCode($options))->render($token);
        } catch (Throwable $e) {
            Log::error("Failed to generate QR Code data URI: {$e->getMessage()}");
            return '';
        }
    }

    /**
     * Format a date into '15 MAY 2024'
     */
    public static function formatDate(?Carbon $date): string
    {
        return $date ? strtoupper($date->format('d M Y')) : 'N/A';
    }

    /**
     * Send Official 1-Year Permanent Member Card via Email
     */
    public static function sendMemberCard(User $user, MemberProfile $profile): bool
    {
        if (empty($user->email)) {
            Log::info("Skipped sending member card email: user #{$user->id} has no email.");
            return false;
        }

        // Skip internal placeholder emails
        if (str_ends_with($user->email, '@members.tigatgym.com')) {
            Log::info("Skipped sending member card email to system placeholder: {$user->email}");
            return false;
        }

        try {
            $startDate = $profile->joined_at ? Carbon::parse($profile->joined_at) : now();
            $expiryDate = $startDate->copy()->addYear();

            $joiningDateFormatted = self::formatDate($startDate);
            $validThruFormatted = self::formatDate($expiryDate);

            $token = $profile->qr_code_token ?: $profile->member_code;
            $qrDataUri = self::generateQrDataUri($token);

            Mail::to($user->email)->send(
                new MemberCardMail(
                    user: $user,
                    profile: $profile,
                    qrCodeDataUri: $qrDataUri,
                    joiningDateFormatted: $joiningDateFormatted,
                    validThruFormatted: $validThruFormatted
                )
            );

            Log::info("Successfully sent permanent member card email to {$user->email} ({$profile->member_code})");
            return true;
        } catch (Throwable $e) {
            Log::warning("Could not dispatch member card email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Send Official Payment Receipt via Email
     */
    public static function sendPaymentReceipt(Payment $payment): bool
    {
        $user = $payment->user;
        if (! $user || empty($user->email)) {
            Log::info("Skipped sending receipt email: payment #{$payment->id} has no recipient email.");
            return false;
        }

        if (str_ends_with($user->email, '@members.tigatgym.com')) {
            Log::info("Skipped sending payment receipt email to system placeholder: {$user->email}");
            return false;
        }

        try {
            $profile = $user->memberProfile;
            $token = $profile?->qr_code_token ?: ($profile?->member_code ?: "TG-{$user->id}");
            $qrDataUri = self::generateQrDataUri($token);

            // Determine plan or item description
            $planName = 'General Gym Fee / Service';
            $validityPeriod = null;

            if ($payment->payable && method_exists($payment->payable, 'plan')) {
                $sub = $payment->payable;
                $planName = $sub->plan?->name ?? 'Gym Membership';
                if ($sub->start_date && $sub->end_date) {
                    $validityPeriod = self::formatDate(Carbon::parse($sub->start_date)) . ' — ' . self::formatDate(Carbon::parse($sub->end_date));
                }
            } elseif ($payment->payment_type === 'subscription') {
                $planName = 'Gym Membership Subscription';
            } elseif ($payment->payment_type === 'registration') {
                $planName = 'New Member Registration Fee';
            }

            Mail::to($user->email)->send(
                new PaymentReceiptMail(
                    payment: $payment,
                    user: $user,
                    qrCodeDataUri: $qrDataUri,
                    planName: $planName,
                    validityPeriod: $validityPeriod
                )
            );

            Log::info("Successfully sent payment receipt #{$payment->receipt_number} email to {$user->email}");
            return true;
        } catch (Throwable $e) {
            Log::warning("Could not dispatch payment receipt email to {$user->email}: {$e->getMessage()}");
            return false;
        }
    }
}
