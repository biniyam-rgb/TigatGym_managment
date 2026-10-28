<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkoutPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'goal',
        'difficulty_level',
        'duration_weeks',
        'days_per_week',
        'created_by',
        'is_template',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'duration_weeks' => 'integer',
            'days_per_week' => 'integer',
            'is_template' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function planExercises(): HasMany
    {
        return $this->hasMany(WorkoutPlanExercise::class);
    }

    public function exercises(): BelongsToMany
    {
        return $this->belongsToMany(Exercise::class, 'workout_plan_exercises')
            ->withPivot(['day_number', 'order_in_day', 'sets', 'reps_min', 'reps_max', 'rest_seconds', 'target_weight', 'notes'])
            ->withTimestamps();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(WorkoutAssignment::class);
    }
}
