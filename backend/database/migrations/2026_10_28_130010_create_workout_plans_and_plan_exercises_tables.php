<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('workout_plans', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('slug', 170)->unique();
            $table->text('description')->nullable();
            $table->string('goal', 40)->index(); // fat_loss, muscle_gain, strength, general_fitness, endurance, athletic_performance, rehabilitation
            $table->string('difficulty_level', 20)->default('beginner'); // beginner, intermediate, advanced
            $table->unsignedSmallInteger('duration_weeks')->default(4);
            $table->unsignedTinyInteger('days_per_week')->default(3);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_template')->default(true)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('workout_plan_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_plan_id')->constrained('workout_plans')->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained('exercises')->restrictOnDelete();
            $table->unsignedTinyInteger('day_number'); // 1, 2, 3, etc.
            $table->unsignedTinyInteger('order_in_day')->default(1);
            $table->unsignedTinyInteger('sets')->default(3);
            $table->unsignedSmallInteger('reps_min')->nullable();
            $table->unsignedSmallInteger('reps_max')->nullable();
            $table->unsignedSmallInteger('rest_seconds')->default(60);
            $table->decimal('target_weight', 6, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['workout_plan_id', 'day_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workout_plan_exercises');
        Schema::dropIfExists('workout_plans');
    }
};
