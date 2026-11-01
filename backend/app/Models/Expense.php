<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Expense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'expense_number',
        'category',
        'title',
        'description',
        'amount',
        'currency',
        'payment_method',
        'expense_date',
        'recipient',
        'receipt_attachment_path',
        'recorded_by',
        'approved_by',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Generate the next sequential expense number: EXP-0001, EXP-0002...
     */
    public static function generateNextExpenseNumber(): string
    {
        $existing = self::withTrashed()
            ->where('expense_number', 'like', 'EXP-%')
            ->pluck('expense_number');

        $maxNum = 0;
        foreach ($existing as $code) {
            if (preg_match('/^EXP-(\d+)$/', $code, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextNum = $maxNum + 1;
        $number = sprintf('EXP-%04d', $nextNum);

        while (self::withTrashed()->where('expense_number', $number)->exists()) {
            $nextNum++;
            $number = sprintf('EXP-%04d', $nextNum);
        }

        return $number;
    }
}
