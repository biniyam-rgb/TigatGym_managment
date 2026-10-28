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
        Schema::create('fitness_classes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            $table->text('description')->nullable();
            $table->foreignId('trainer_id')->constrained('users')->restrictOnDelete();
            $table->string('room', 50)->nullable();
            $table->unsignedSmallInteger('capacity')->default(20);
            $table->dateTime('start_time')->index();
            $table->dateTime('end_time');
            $table->string('recurrence', 20)->default('none'); // none, daily, weekly, biweekly
            $table->string('status', 20)->default('scheduled')->index(); // scheduled, ongoing, completed, cancelled
            $table->text('cancellation_reason')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('currency', 3)->default('ETB');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['start_time', 'status']);
        });

        Schema::create('class_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fitness_class_id')->constrained('fitness_classes')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('status', 20)->default('reserved')->index(); // reserved, attended, cancelled, no_show
            $table->timestamp('booking_time')->useCurrent();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason', 255)->nullable();
            $table->timestamps();

            $table->unique(['fitness_class_id', 'member_id']); // Duplicate booking prevention
            $table->index(['member_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_bookings');
        Schema::dropIfExists('fitness_classes');
    }
};
