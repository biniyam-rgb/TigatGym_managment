<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'workout_assignment_id',
        'exercise_id',
        'logged_date',
        'set_number',
        'reps_completed',
        'weight_used',
        'weight_unit',
        'rpe',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'logged_date' => 'date',
            'set_number' => 'integer',
            'reps_completed' => 'integer',
            'weight_used' => 'decimal:2',
            'rpe' => 'decimal:1',
        ];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function workoutAssignment(): BelongsTo
    {
        return $this->belongsTo(WorkoutAssignment::class);
    }

    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
