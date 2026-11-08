<?php

namespace App\Mail;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MembershipDocumentsMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Payment $payment,
        public ?Subscription $subscription,
        public string $cardPdfBinary,
        public string $receiptPdfBinary,
        public string $memberCode,
        public string $planName,
        public string $validityPeriod
    ) {}

    public function envelope(): Envelope
    {
        $senderAddress = config('mail.from.address', 'support@tigatgym.com');
        $senderName = config('mail.from.name', 'Tigat Gym');

        return new Envelope(
            from: new Address($senderAddress, $senderName),
            subject: "Your TIGAT GYM Membership Is Active!"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.membership-active'
        );
    }

    public function attachments(): array
    {
        $safeMemberCode = preg_replace('/[^A-Za-z0-9_-]/', '', $this->memberCode);
        $safeReceiptNum = preg_replace('/[^A-Za-z0-9_-]/', '', $this->payment->receipt_number);

        return [
            Attachment::fromData(fn () => $this->cardPdfBinary, "TigatGym-Membership-Card-{$safeMemberCode}.pdf")
                ->withMime('application/pdf'),
            Attachment::fromData(fn () => $this->receiptPdfBinary, "TigatGym-Payment-Receipt-{$safeReceiptNum}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
