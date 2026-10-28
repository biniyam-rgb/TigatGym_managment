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
        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_code', 30)->unique();
            $table->foreignId('trainer_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('scheduled_start')->index();
            $table->dateTime('scheduled_end');
            $table->string('status', 30)->default('scheduled')->index(); // scheduled, in_progress, completed, cancelled_by_member, cancelled_by_trainer, no_show
            $table->text('cancellation_reason')->nullable();
            $table->string('focus_area', 150)->nullable();
            $table->text('trainer_feedback')->nullable();
            $table->unsignedTinyInteger('member_rating')->nullable(); // 1 to 5
            $table->text('member_review')->nullable();
            $table->timestamps();

            $table->index(['trainer_id', 'scheduled_start']);
            $table->index(['member_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_sessions');
    }
};
