<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'member_id',
        'membership_plan_id',
        'subscription_number',
        'start_date',
        'end_date',
        'status',
        'cancellation_reason',
        'cancelled_at',
        'frozen_until',
        'price',
        'discount',
        'total_amount',
        'currency',
        'is_auto_renew',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'cancelled_at' => 'datetime',
            'frozen_until' => 'date',
            'price' => 'decimal:2',
            'discount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'is_auto_renew' => 'boolean',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }

    public function membershipPlan(): BelongsTo
    {
        return $this->plan();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && now()->toDateString() <= $this->end_date->format('Y-m-d');
    }

    public function isFrozen(): bool
    {
        return $this->status === 'frozen';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->status === 'active' && now()->toDateString() > $this->end_date->format('Y-m-d'));
    }

    /**
     * Scope to retrieve currently valid subscriptions.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('end_date', '>=', now()->toDateString());
    }

    /**
     * Generate the next sequential subscription code: SUB-0001, SUB-0002...
     */
    public static function generateNextSubscriptionNumber(): string
    {
        $existing = self::withTrashed()
            ->where('subscription_number', 'like', 'SUB-%')
            ->pluck('subscription_number');

        $maxNum = 0;
        foreach ($existing as $code) {
            if (preg_match('/^SUB-(\d+)$/', $code, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextNum = $maxNum + 1;
        $number = sprintf('SUB-%04d', $nextNum);

        while (self::withTrashed()->where('subscription_number', $number)->exists()) {
            $nextNum++;
            $number = sprintf('SUB-%04d', $nextNum);
        }

        return $number;
    }
}
