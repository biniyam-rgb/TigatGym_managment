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
        // 1. member_profiles: Fast lookups and filtering
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->index('gender', 'idx_member_profiles_gender');
            $table->index('deleted_at', 'idx_member_profiles_deleted_at');
        });

        // 2. trainer_profiles: Fast filtering by availability, shift, and specialization
        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->index('is_available', 'idx_trainer_profiles_available');
            $table->index('shift', 'idx_trainer_profiles_shift');
            $table->index('specialization', 'idx_trainer_profiles_specialization');
        });

        // 3. payments: Fast composite lookup for revenue aggregates and dashboard
        Schema::table('payments', function (Blueprint $table) {
            $table->index(['status', 'paid_at'], 'idx_payments_status_paid_at');
            $table->index(['created_at', 'status'], 'idx_payments_created_at_status');
        });

        // 4. subscriptions: Fast composite lookup for active expiring/upcoming memberships
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index(['status', 'end_date'], 'idx_subscriptions_status_end_date');
        });

        // 5. attendance_records: Fast composite index for admitted check-ins and active gym occupancy
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->index(['status', 'check_in_time'], 'idx_attendance_status_check_in');
            $table->index('check_out_time', 'idx_attendance_check_out');
        });

        // 6. class_bookings: Fast composite index for class capacity calculations
        Schema::table('class_bookings', function (Blueprint $table) {
            $table->index(['fitness_class_id', 'status'], 'idx_class_bookings_class_status');
        });

        // 7. trainer_assignments: Fast composite index for active member personal coach resolution
        Schema::table('trainer_assignments', function (Blueprint $table) {
            $table->index(['member_id', 'status', 'end_date'], 'idx_trainer_assignments_mem_status_end');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_profiles', function (Blueprint $table) {
            $table->dropIndex('idx_member_profiles_gender');
            $table->dropIndex('idx_member_profiles_deleted_at');
        });

        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->dropIndex('idx_trainer_profiles_available');
            $table->dropIndex('idx_trainer_profiles_shift');
            $table->dropIndex('idx_trainer_profiles_specialization');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_status_paid_at');
            $table->dropIndex('idx_payments_created_at_status');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('idx_subscriptions_status_end_date');
        });

        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_status_check_in');
            $table->dropIndex('idx_attendance_check_out');
        });

        Schema::table('class_bookings', function (Blueprint $table) {
            $table->dropIndex('idx_class_bookings_class_status');
        });

        Schema::table('trainer_assignments', function (Blueprint $table) {
            $table->dropIndex('idx_trainer_assignments_mem_status_end');
        });
    }
};
