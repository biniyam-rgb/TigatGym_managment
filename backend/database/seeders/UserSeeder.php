<?php

namespace Database\Seeders;

use App\Models\MemberProfile;
use App\Models\Role;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'Tigat Owner',
                'email' => 'owner@tigatgym.com',
                'phone' => '+251911000001',
                'role' => 'owner',
            ],
            [
                'name' => 'Abebe Admin',
                'email' => 'admin@tigatgym.com',
                'phone' => '+251911000002',
                'role' => 'admin',
            ],
            [
                'name' => 'Sara Receptionist',
                'email' => 'receptionist@tigatgym.com',
                'phone' => '+251911000003',
                'role' => 'receptionist',
            ],
            [
                'name' => 'Dawit Trainer',
                'email' => 'trainer@tigatgym.com',
                'phone' => '+251911000004',
                'role' => 'trainer',
            ],
            [
                'name' => 'Yonas Member',
                'email' => 'member@tigatgym.com',
                'phone' => '+251911000005',
                'role' => 'member',
            ],
        ];

        foreach ($accounts as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'status' => 'active',
                    'password' => Hash::make('Password123!'),
                    'email_verified_at' => now(),
                ]
            );

            $role = Role::where('name', $data['role'])->first();
            if ($role && ! $user->hasRole($data['role'])) {
                $user->roles()->attach($role->id);
            }

            // Ensure profile exists for trainer
            if ($data['role'] === 'trainer' && ! $user->trainerProfile) {
                TrainerProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'trainer_code' => 'TG-T-0001',
                        'specialization' => 'Strength & Conditioning',
                        'bio' => 'Certified trainer specializing in hypertrophy and functional strength.',
                        'hourly_rate' => 350.00,
                        'commission_rate' => 15.00,
                        'is_available' => true,
                        'joined_at' => now(),
                    ]
                );
            }

            // Ensure profile exists for member
            if ($data['role'] === 'member' && ! $user->memberProfile) {
                MemberProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'member_code' => 'TG-M-0001',
                        'qr_code_token' => 'TIGAT-QR-' . Str::random(32),
                        'date_of_birth' => '1995-05-15',
                        'gender' => 'male',
                        'blood_type' => 'O+',
                        'address' => 'Bole Subcity, Addis Ababa',
                        'emergency_contact_name' => 'Chaltu Tadesse',
                        'emergency_contact_phone' => '+251911999999',
                        'emergency_contact_relationship' => 'Spouse',
                        'fitness_goals' => 'Cardiovascular endurance and muscle tone',
                        'joined_at' => now(),
                    ]
                );
            }
        }
    }
}
