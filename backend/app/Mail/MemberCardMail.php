<?php

namespace App\Mail;

use App\Models\MemberProfile;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MemberCardMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public MemberProfile $profile,
        public string $qrCodeDataUri,
        public string $joiningDateFormatted,
        public string $validThruFormatted
    ) {}

    public function envelope(): Envelope
    {
        $senderAddress = config('mail.from.address', 'support@tigatgym.com');
        $senderName = config('mail.from.name', 'Tigat Gym');

        return new Envelope(
            from: new Address($senderAddress, $senderName),
            subject: "Welcome to Tigat Gym! Your Official 1-Year Member Card ({$this->profile->member_code})"
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.member-card'
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
