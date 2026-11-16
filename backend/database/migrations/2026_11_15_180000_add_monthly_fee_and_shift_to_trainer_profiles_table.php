<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('trainer_profiles', 'monthly_fee')) {
                $table->decimal('monthly_fee', 10, 2)->default(0.00)->after('hourly_rate');
            }
            if (! Schema::hasColumn('trainer_profiles', 'shift')) {
                $table->string('shift', 30)->default('full_day')->after('specialization');
            }
        });
    }

    public function down(): void
    {
        Schema::table('trainer_profiles', function (Blueprint $table) {
            $table->dropColumn(['monthly_fee', 'shift']);
        });
    }
};
