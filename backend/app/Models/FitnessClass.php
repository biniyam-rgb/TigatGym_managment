<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FitnessClass extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'trainer_id',
        'room',
        'capacity',
        'start_time',
        'end_time',
        'recurrence',
        'status',
        'cancellation_reason',
        'price',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'price' => 'decimal:2',
        ];
    }

    public function trainer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trainer_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(ClassBooking::class);
    }

    public function reservedCount(): int
    {
        return $this->bookings()->where('status', 'reserved')->count();
    }

    public function isFull(): bool
    {
        return $this->reservedCount() >= $this->capacity;
    }
}
