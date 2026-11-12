<?php

namespace App\Services;

use App\Models\MemberProfile;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Facades\Log;
use Throwable;

class GymPdfService
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
            Log::error("Failed to generate QR Code data URI for PDF: {$e->getMessage()}");
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
     * Generate the Membership Card PDF binary
     */
    public static function generateMembershipCardPdf(User $user, ?MemberProfile $profile, ?Subscription $subscription): string
    {
        $profile = $profile ?? $user->memberProfile;
        $memberCode = $profile?->member_code ?? ("TG-" . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT));
        $qrToken = $profile?->qr_code_token ?: $memberCode;
        $qrCodeDataUri = self::generateQrDataUri($qrToken);

        $startDate = $subscription?->start_date
            ? Carbon::parse($subscription->start_date)
            : ($profile?->joined_at ? Carbon::parse($profile->joined_at) : now());

        $endDate = $subscription?->end_date
            ? Carbon::parse($subscription->end_date)
            : $startDate->copy()->addYear();

        $planName = $subscription?->plan?->name ?? 'OFFICIAL MEMBERSHIP PASS';
        $status = $subscription?->status ?? 'ACTIVE';
        $phone = $user->phone ?? ($profile?->emergency_contact_phone ?? 'N/A');

        $data = [
            'user' => $user,
            'profile' => $profile,
            'subscription' => $subscription,
            'memberCode' => $memberCode,
            'planName' => $planName,
            'status' => $status,
            'phone' => $phone,
            'startDateFormatted' => self::formatDate($startDate),
            'endDateFormatted' => self::formatDate($endDate),
            'qrCodeDataUri' => $qrCodeDataUri,
        ];

        $pdf = Pdf::loadView('pdf.membership-card', $data);
        $pdf->setPaper([0, 0, 242.64, 153.0], 'landscape'); // 85.6mm x 54mm standard CR80
        $pdf->setOption('isRemoteEnabled', true);
        $pdf->setOption('isHtml5ParserEnabled', true);

        return $pdf->output();
    }

    /**
     * Generate the Payment Receipt PDF binary
     */
    public static function generatePaymentReceiptPdf(Payment $payment, User $user, ?Subscription $subscription): string
    {
        $profile = $user->memberProfile;
        $memberCode = $profile?->member_code ?? ("TG-" . str_pad((string) $user->id, 4, '0', STR_PAD_LEFT));
        $qrToken = $profile?->qr_code_token ?: $memberCode;
        $qrCodeDataUri = self::generateQrDataUri($qrToken);

        // Resolve plan name and validity
        $planName = 'Gym Membership Fee';
        $validityPeriod = null;

        if ($subscription && $subscription->plan) {
            $planName = $subscription->plan->name;
            if ($subscription->start_date && $subscription->end_date) {
                $validityPeriod = self::formatDate(Carbon::parse($subscription->start_date)) . ' — ' . self::formatDate(Carbon::parse($subscription->end_date));
            }
        } elseif ($payment->payable && method_exists($payment->payable, 'plan')) {
            $sub = $payment->payable;
            $planName = $sub->plan?->name ?? 'Gym Membership Package';
            if ($sub->start_date && $sub->end_date) {
                $validityPeriod = self::formatDate(Carbon::parse($sub->start_date)) . ' — ' . self::formatDate(Carbon::parse($sub->end_date));
            }
        } elseif ($payment->payment_type === 'subscription') {
            $planName = 'Gym Membership Package';
        } elseif ($payment->payment_type === 'registration') {
            $planName = 'New Member Registration Fee';
        }

        // Resolve gateway reference if present
        $chapaReference = null;
        $transaction = null;
        if ($payment->relationLoaded('transactions')) {
            $transaction = $payment->transactions->firstWhere('status', 'successful')
                ?: $payment->transactions->first();
        } elseif ($payment->exists) {
            try {
                $transaction = $payment->transactions()->where('status', 'successful')->first()
                    ?: $payment->transactions()->first();
            } catch (Throwable) {
                $transaction = null;
            }
        }
        if ($transaction && ! empty($transaction->gateway_reference)) {
            $chapaReference = $transaction->gateway_reference;
        }

        $paymentDate = $payment->paid_at ? Carbon::parse($payment->paid_at) : now();

        $data = [
            'payment' => $payment,
            'user' => $user,
            'memberCode' => $memberCode,
            'planName' => $planName,
            'validityPeriod' => $validityPeriod,
            'chapaReference' => $chapaReference,
            'paymentDateFormatted' => $paymentDate->format('d M Y, h:i A'),
            'qrCodeDataUri' => $qrCodeDataUri,
        ];

        $pdf = Pdf::loadView('pdf.payment-receipt', $data);
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption('isRemoteEnabled', true);
        $pdf->setOption('isHtml5ParserEnabled', true);

        return $pdf->output();
    }
}
