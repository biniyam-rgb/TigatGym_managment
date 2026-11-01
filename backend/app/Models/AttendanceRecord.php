<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'subscription_id',
        'check_in_time',
        'check_out_time',
        'method',
        'status',
        'denial_reason',
        'qr_payload_hash',
        'verified_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'check_in_time' => 'datetime',
            'check_out_time' => 'datetime',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function scopeAdmitted($query)
    {
        return $query->where('status', 'admitted');
    }

    public function scopeDenied($query)
    {
        return $query->where('status', 'denied');
    }

    public function scopeCurrentlyInside($query)
    {
        return $query->where('status', 'admitted')
            ->whereNull('check_out_time')
            ->whereDate('check_in_time', Carbon::today());
    }

    public function isCheckedIn(): bool
    {
        return $this->status === 'admitted' && is_null($this->check_out_time);
    }

    public function getDurationMinutesAttribute(): ?int
    {
        if (! $this->check_out_time || ! $this->check_in_time) {
            return null;
        }

        return $this->check_in_time->diffInMinutes($this->check_out_time);
    }
}
