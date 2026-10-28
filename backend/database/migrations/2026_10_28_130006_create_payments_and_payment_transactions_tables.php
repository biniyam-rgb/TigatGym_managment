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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number', 40)->unique();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->nullableMorphs('payable'); // payable_type, payable_id
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('ETB');
            $table->string('payment_method', 30); // cash, bank_transfer, chapa, pos, other
            $table->string('payment_type', 30)->default('subscription'); // subscription, class_fee, trainer_fee, product, registration, other
            $table->string('status', 30)->default('pending')->index(); // pending, completed, failed, refunded, partially_refunded
            $table->timestamp('paid_at')->nullable()->index();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('receipt_number', 50)->nullable()->unique();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->restrictOnDelete();
            $table->string('transaction_reference', 100)->unique();
            $table->string('gateway', 30)->default('manual'); // manual, chapa, bank_slip, cbe_birr, telebirr, other
            $table->string('gateway_reference', 100)->nullable()->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('ETB');
            $table->string('status', 30)->default('initiated')->index(); // initiated, pending, successful, failed, refunded
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->string('bank_name', 100)->nullable();
            $table->string('bank_account_number', 50)->nullable();
            $table->string('proof_attachment_path', 255)->nullable();
            $table->json('gateway_response')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['gateway', 'gateway_reference']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payments');
    }
};
