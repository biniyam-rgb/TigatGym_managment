<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class TrainerProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'trainer_code',
        'specialization',
        'bio',
        'certifications',
        'hourly_rate',
        'commission_rate',
        'is_available',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'is_available' => 'boolean',
            'joined_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
