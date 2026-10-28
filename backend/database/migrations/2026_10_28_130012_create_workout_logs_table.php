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
        Schema::create('workout_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('workout_assignment_id')->nullable()->constrained('workout_assignments')->nullOnDelete();
            $table->foreignId('exercise_id')->constrained('exercises')->restrictOnDelete();
            $table->date('logged_date')->index();
            $table->unsignedTinyInteger('set_number');
            $table->unsignedSmallInteger('reps_completed');
            $table->decimal('weight_used', 6, 2);
            $table->string('weight_unit', 5)->default('kg');
            $table->decimal('rpe', 3, 1)->nullable(); // 1.0 to 10.0
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['member_id', 'logged_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workout_logs');
    }
};
