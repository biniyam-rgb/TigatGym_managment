<?php

namespace Database\Seeders;

use App\Models\MembershipPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MembershipPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Monthly Standard',
                'description' => 'Full all-day access to gym facilities and locker rooms for one calendar month.',
                'price' => 2500.00,
                'currency' => 'ETB',
                'duration_type' => 'month',
                'duration_value' => 1,
                'access_hours_type' => 'all_day',
                'has_trainer_access' => false,
                'has_class_access' => false,
                'max_class_bookings' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Quarterly Fitness (3 Months)',
                'description' => 'Three months comprehensive gym access with free initial fitness assessment.',
                'price' => 6800.00,
                'currency' => 'ETB',
                'duration_type' => 'month',
                'duration_value' => 3,
                'access_hours_type' => 'all_day',
                'has_trainer_access' => false,
                'has_class_access' => true,
                'max_class_bookings' => 12,
                'is_active' => true,
            ],
            [
                'name' => 'Semi-Annual Pro (6 Months)',
                'description' => 'Six months unlimited gym access, all group workout classes, and towel service.',
                'price' => 12500.00,
                'currency' => 'ETB',
                'duration_type' => 'month',
                'duration_value' => 6,
                'access_hours_type' => 'all_day',
                'has_trainer_access' => true,
                'has_class_access' => true,
                'max_class_bookings' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Annual VIP Black',
                'description' => 'One full year VIP all-inclusive access: gym floor, trainer consultation, all group classes, guest passes.',
                'price' => 22000.00,
                'currency' => 'ETB',
                'duration_type' => 'year',
                'duration_value' => 1,
                'access_hours_type' => 'all_day',
                'has_trainer_access' => true,
                'has_class_access' => true,
                'max_class_bookings' => null,
                'is_active' => true,
            ],
            [
                'name' => 'Daily Pass',
                'description' => 'Single day all-day pass for casual visitors and guest athletes.',
                'price' => 250.00,
                'currency' => 'ETB',
                'duration_type' => 'day',
                'duration_value' => 1,
                'access_hours_type' => 'all_day',
                'has_trainer_access' => false,
                'has_class_access' => false,
                'max_class_bookings' => null,
                'is_active' => true,
            ],
        ];

        foreach ($plans as $planData) {
            $planData['slug'] = Str::slug($planData['name']);
            MembershipPlan::updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }
    }
}
