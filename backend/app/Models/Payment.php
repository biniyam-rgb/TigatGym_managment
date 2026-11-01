<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'payment_number',
        'user_id',
        'payable_type',
        'payable_id',
        'amount',
        'currency',
        'payment_method',
        'payment_type',
        'status',
        'paid_at',
        'recorded_by',
        'receipt_number',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeRefunded($query)
    {
        return $query->where('status', 'refunded');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Generate the next sequential payment number: PAY-0001, PAY-0002...
     */
    public static function generateNextPaymentNumber(): string
    {
        $existing = self::withTrashed()
            ->where('payment_number', 'like', 'PAY-%')
            ->pluck('payment_number');

        $maxNum = 0;
        foreach ($existing as $code) {
            if (preg_match('/^PAY-(\d+)$/', $code, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextNum = $maxNum + 1;
        $number = sprintf('PAY-%04d', $nextNum);

        while (self::withTrashed()->where('payment_number', $number)->exists()) {
            $nextNum++;
            $number = sprintf('PAY-%04d', $nextNum);
        }

        return $number;
    }

    /**
     * Generate the next sequential receipt number: RCT-0001, RCT-0002...
     */
    public static function generateNextReceiptNumber(): string
    {
        $existing = self::withTrashed()
            ->where('receipt_number', 'like', 'RCT-%')
            ->pluck('receipt_number');

        $maxNum = 0;
        foreach ($existing as $code) {
            if (preg_match('/^RCT-(\d+)$/', $code, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextNum = $maxNum + 1;
        $number = sprintf('RCT-%04d', $nextNum);

        while (self::withTrashed()->where('receipt_number', $number)->exists()) {
            $nextNum++;
            $number = sprintf('RCT-%04d', $nextNum);
        }

        return $number;
    }
}
