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
        Schema::table('users', function (Blueprint $table) {
            $table->string('work_shift', 60)->nullable()->after('phone');
            $table->string('desk_station', 100)->nullable()->after('work_shift');
            $table->string('emergency_contact', 100)->nullable()->after('desk_station');
            $table->string('employee_id_number', 50)->nullable()->after('emergency_contact');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'work_shift',
                'desk_station',
                'emergency_contact',
                'employee_id_number',
            ]);
        });
    }
};
