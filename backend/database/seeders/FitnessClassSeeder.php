<?php

namespace Database\Seeders;

use App\Models\ClassBooking;
use App\Models\FitnessClass;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FitnessClassSeeder extends Seeder
{
    public function run(): void
    {
        $trainer = User::whereHas('roles', fn ($q) => $q->where('name', 'trainer'))->first()
            ?? User::first();

        $members = User::whereHas('roles', fn ($q) => $q->where('name', 'member'))->get();

        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        $dayAfter = Carbon::today()->addDays(2);

        $classesData = [
            [
                'name' => 'Tigat Morning HIIT',
                'description' => 'High-intensity interval circuit targeting explosive power, athletic conditioning, and rapid caloric burn.',
                'room' => 'Studio A (Main Hall)',
                'capacity' => 20,
                'start_time' => $today->copy()->setTime(7, 0),
                'end_time' => $today->copy()->setTime(8, 0),
                'recurrence' => 'daily',
                'status' => 'scheduled',
                'price' => 0.00,
            ],
            [
                'name' => 'Power Spin & Cadence',
                'description' => 'Rhythmic high-cadence indoor cycling session with resistance hill climbs, sprint intervals, and music sync.',
                'room' => 'Cardio Spin Studio',
                'capacity' => 18,
                'start_time' => $today->copy()->setTime(10, 30),
                'end_time' => $today->copy()->setTime(11, 30),
                'recurrence' => 'weekly',
                'status' => 'scheduled',
                'price' => 150.00,
            ],
            [
                'name' => 'Functional Strength Circuit',
                'description' => 'Multi-joint compound kettlebell, barbell, and plyometric circuit for core stability and functional muscle building.',
                'room' => 'Strength Bay & Turf',
                'capacity' => 16,
                'start_time' => $today->copy()->setTime(17, 30),
                'end_time' => $today->copy()->setTime(18, 30),
                'recurrence' => 'weekly',
                'status' => 'scheduled',
                'price' => 200.00,
            ],
            [
                'name' => 'Vinyasa Yoga & Mobility Flow',
                'description' => 'Postural alignment, fascia decompression, controlled breathing mechanics, and deep restorative stretching.',
                'room' => 'Studio B (Zen Room)',
                'capacity' => 22,
                'start_time' => $tomorrow->copy()->setTime(8, 0),
                'end_time' => $tomorrow->copy()->setTime(9, 0),
                'recurrence' => 'weekly',
                'status' => 'scheduled',
                'price' => 0.00,
            ],
            [
                'name' => 'Olympic Lifting Workshop',
                'description' => 'Technical barbell clinic covering clean & jerk, snatch progressions, hip drive mechanics, and heavy pulls.',
                'room' => 'Olympic Platform Zone',
                'capacity' => 12,
                'start_time' => $tomorrow->copy()->setTime(16, 0),
                'end_time' => $tomorrow->copy()->setTime(17, 30),
                'recurrence' => 'weekly',
                'status' => 'scheduled',
                'price' => 250.00,
            ],
            [
                'name' => 'Core & Abdominals Blast',
                'description' => 'Direct abdominal hypertrophy, oblique isolation, rotational anti-flexion core stability, and lower back reinforcement.',
                'room' => 'Studio A (Main Hall)',
                'capacity' => 25,
                'start_time' => $dayAfter->copy()->setTime(7, 30),
                'end_time' => $dayAfter->copy()->setTime(8, 15),
                'recurrence' => 'weekly',
                'status' => 'scheduled',
                'price' => 0.00,
            ],
        ];

        foreach ($classesData as $index => $data) {
            $class = FitnessClass::firstOrCreate(
                ['slug' => Str::slug($data['name'])],
                array_merge($data, [
                    'trainer_id' => $trainer->id,
                    'currency' => 'ETB',
                ])
            );

            // Seed sample bookings for the first 3 classes
            if ($index < 3 && $members->isNotEmpty()) {
                $bookCount = min($members->count(), $index === 0 ? 4 : ($index === 1 ? 3 : 2));
                for ($i = 0; $i < $bookCount; $i++) {
                    $m = $members[$i];
                    ClassBooking::firstOrCreate(
                        [
                            'fitness_class_id' => $class->id,
                            'member_id' => $m->id,
                        ],
                        [
                            'status' => ($index === 0 && $i === 0) ? 'attended' : 'reserved',
                            'booking_time' => Carbon::now()->subHours(rand(1, 12)),
                        ]
                    );
                }
            }
        }
    }
}
