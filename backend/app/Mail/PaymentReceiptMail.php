<?php

namespace App\Mail;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Payment $payment,
        public User $user,
        public ?string $qrCodeDataUri,
        public string $planName,
        public ?string $validityPeriod
    ) {}

    public function envelope(): Envelope
    {
        $senderAddress = config('mail.from.address', 'support@tigatgym.com');
        $senderName = config('mail.from.name', 'Tigat Gym');

        return new Envelope(
            from: new Address($senderAddress, $senderName),
            subject: "Payment Receipt #{$this->payment->receipt_number} - Tigat Gym"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-receipt'
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
