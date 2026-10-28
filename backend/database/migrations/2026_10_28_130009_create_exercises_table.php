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
        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120)->unique();
            $table->string('slug', 140)->unique();
            $table->string('category', 40)->index(); // strength, cardio, hypertrophy, flexibility, endurance, calisthenics, olympic_weightlifting, other
            $table->string('muscle_group', 40)->index(); // chest, back, shoulders, biceps, triceps, legs, glutes, calves, core, full_body
            $table->string('equipment_needed', 100)->nullable();
            $table->string('difficulty', 20)->default('beginner'); // beginner, intermediate, advanced
            $table->text('instructions')->nullable();
            $table->string('video_url', 255)->nullable();
            $table->string('image_path', 255)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
