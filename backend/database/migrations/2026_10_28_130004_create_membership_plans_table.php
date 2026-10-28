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
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2);
            $table->string('currency', 3)->default('ETB');
            $table->string('duration_type', 20); // day, week, month, year
            $table->unsignedInteger('duration_value'); // e.g. 1, 3, 6, 12
            $table->string('access_hours_type', 30)->default('all_day'); // all_day, off_peak, morning, evening
            $table->boolean('has_trainer_access')->default(false);
            $table->boolean('has_class_access')->default(false);
            $table->unsignedInteger('max_class_bookings')->nullable();
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
        Schema::dropIfExists('membership_plans');
    }
};
