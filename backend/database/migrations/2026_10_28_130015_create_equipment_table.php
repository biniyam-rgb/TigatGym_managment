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
        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->string('equipment_code', 40)->unique();
            $table->string('name', 150);
            $table->string('category', 40)->index(); // cardio, strength, free_weights, machines, accessories, audio_visual, recovery, other
            $table->string('brand', 100)->nullable();
            $table->string('model_number', 100)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_cost', 12, 2)->nullable();
            $table->string('currency', 3)->default('ETB');
            $table->string('status', 30)->default('operational')->index(); // operational, needs_maintenance, under_repair, out_of_service, decommissioned
            $table->string('location_area', 100)->nullable();
            $table->date('last_inspected_at')->nullable();
            $table->date('next_maintenance_due')->nullable()->index();
            $table->text('maintenance_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipment');
    }
};
