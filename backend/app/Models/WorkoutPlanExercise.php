<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutPlanExercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'workout_plan_id',
        'exercise_id',
        'day_number',
        'order_in_day',
        'sets',
        'reps_min',
        'reps_max',
        'rest_seconds',
        'target_weight',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'day_number' => 'integer',
            'order_in_day' => 'integer',
            'sets' => 'integer',
            'reps_min' => 'integer',
            'reps_max' => 'integer',
            'rest_seconds' => 'integer',
            'target_weight' => 'decimal:2',
        ];
    }

    public function workoutPlan(): BelongsTo
    {
        return $this->belongsTo(WorkoutPlan::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
