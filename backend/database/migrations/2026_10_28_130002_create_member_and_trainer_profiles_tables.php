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
        Schema::create('member_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('member_code', 30)->unique();
            $table->string('qr_code_token', 64)->unique();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('blood_type', 10)->nullable();
            $table->text('address')->nullable();
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 30)->nullable();
            $table->string('emergency_contact_relationship', 50)->nullable();
            $table->text('health_conditions')->nullable();
            $table->text('fitness_goals')->nullable();
            $table->date('joined_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('trainer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('trainer_code', 30)->unique();
            $table->string('specialization', 150)->nullable();
            $table->text('bio')->nullable();
            $table->text('certifications')->nullable();
            $table->decimal('hourly_rate', 10, 2)->default(0.00);
            $table->decimal('commission_rate', 5, 2)->default(0.00);
            $table->boolean('is_available')->default(true);
            $table->date('joined_at')->useCurrent();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trainer_profiles');
        Schema::dropIfExists('member_profiles');
    }
};
