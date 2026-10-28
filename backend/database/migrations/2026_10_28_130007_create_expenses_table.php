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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_number', 40)->unique();
            $table->string('category', 40)->index(); // rent, utilities, equipment, maintenance, salary, marketing, cleaning, supplies, tax, other
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('ETB');
            $table->string('payment_method', 30); // cash, bank_transfer, check, card, other
            $table->date('expense_date')->index();
            $table->string('recipient', 150)->nullable();
            $table->string('receipt_attachment_path', 255)->nullable();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('paid')->index(); // pending, approved, rejected, paid
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
