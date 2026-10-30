<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MembershipPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'currency',
        'duration_type',
        'duration_value',
        'access_hours_type',
        'has_trainer_access',
        'has_class_access',
        'max_class_bookings',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'duration_value' => 'integer',
            'has_trainer_access' => 'boolean',
            'has_class_access' => 'boolean',
            'max_class_bookings' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($plan) {
            if (empty($plan->slug)) {
                $plan->slug = Str::slug($plan->name);
            }
        });
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Calculate subscription end date based on duration_type and duration_value.
     */
    public function calculateEndDate(?Carbon $startDate = null): Carbon
    {
        $start = $startDate ? $startDate->copy() : now()->startOfDay();

        return match ($this->duration_type) {
            'day' => $start->addDays($this->duration_value - 1),
            'week' => $start->addWeeks($this->duration_value)->subDay(),
            'month' => $start->addMonths($this->duration_value)->subDay(),
            'year' => $start->addYears($this->duration_value)->subDay(),
            default => $start->addDays(30)->subDay(),
        };
    }
}
