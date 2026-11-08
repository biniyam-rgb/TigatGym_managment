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
        Schema::create('membership_document_deliveries', function (Blueprint $table) {
            $table->id();
            // Strict 1:1 link with confirmed payment ensures idempotency
            $table->foreignId('payment_id')->unique()->constrained('payments')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('recipient_email')->nullable()->index();
            $table->string('status', 30)->default('pending')->index(); // pending, sent, failed, skipped_no_email
            $table->string('card_filename')->nullable();
            $table->string('receipt_filename')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('last_attempt_at')->nullable();
            $table->unsignedInteger('attempts')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('membership_document_deliveries');
    }
};
