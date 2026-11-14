<?php

namespace Database\Seeders;

use App\Models\Equipment;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if equipment already seeded
        if (Equipment::count() > 0) {
            $this->command->info('Equipment already seeded — skipping.');
            return;
        }

        $items = [
            // ── CARDIO ───────────────────────────────────────────────────────
            ['name' => 'Commercial Treadmill Pro 5000',       'category' => 'cardio',        'brand' => 'Life Fitness',      'model_number' => 'T5-GO-0105',    'status' => 'operational',        'location_area' => 'Cardio Zone',      'purchase_cost' => 185000, 'next_maintenance_due' => '2026-01-15'],
            ['name' => 'Elliptical Cross Trainer X9',          'category' => 'cardio',        'brand' => 'Precor',            'model_number' => 'EFX-5.37i',     'status' => 'operational',        'location_area' => 'Cardio Zone',      'purchase_cost' => 142000, 'next_maintenance_due' => '2026-02-10'],
            ['name' => 'Assault Air Bike',                     'category' => 'cardio',        'brand' => 'Assault Fitness',   'model_number' => 'AirBike-Classic','status' => 'operational',        'location_area' => 'Cardio Zone',      'purchase_cost' =>  48000, 'next_maintenance_due' => '2026-03-01'],
            ['name' => 'Rowing Machine Concept2',              'category' => 'cardio',        'brand' => 'Concept2',          'model_number' => 'RowErg-D',      'status' => 'operational',        'location_area' => 'Cardio Zone',      'purchase_cost' =>  72000, 'next_maintenance_due' => '2026-04-20'],
            ['name' => 'Stair Climber StepMill 10',            'category' => 'cardio',        'brand' => 'StairMaster',       'model_number' => 'SM-10-115V',    'status' => 'needs_maintenance',  'location_area' => 'Cardio Zone',      'purchase_cost' => 125000, 'next_maintenance_due' => '2025-12-01', 'maintenance_notes' => 'Belt showing wear — schedule replacement.'],
            ['name' => 'Spin Bike Commercial Grade',           'category' => 'cardio',        'brand' => 'Schwinn',           'model_number' => 'IC8-Power',     'status' => 'operational',        'location_area' => 'Studio Room',      'purchase_cost' =>  38000, 'next_maintenance_due' => '2026-05-15'],
            ['name' => 'Ski Erg Concept2',                     'category' => 'cardio',        'brand' => 'Concept2',          'model_number' => 'SkiErg-PM5',    'status' => 'operational',        'location_area' => 'Cardio Zone',      'purchase_cost' =>  55000, 'next_maintenance_due' => '2026-06-01'],

            // ── STRENGTH MACHINES ────────────────────────────────────────────
            ['name' => 'Leg Press Machine',                    'category' => 'strength',      'brand' => 'Hammer Strength',   'model_number' => 'HS-LP-V2',      'status' => 'operational',        'location_area' => 'Leg Bay',          'purchase_cost' => 210000, 'next_maintenance_due' => '2026-03-10'],
            ['name' => 'Seated Leg Curl Machine',              'category' => 'strength',      'brand' => 'Technogym',         'model_number' => 'SLC-TG-900',    'status' => 'operational',        'location_area' => 'Leg Bay',          'purchase_cost' => 195000, 'next_maintenance_due' => '2026-04-01'],
            ['name' => 'Leg Extension Machine',                'category' => 'strength',      'brand' => 'Life Fitness',      'model_number' => 'PSLE-D2X',      'status' => 'operational',        'location_area' => 'Leg Bay',          'purchase_cost' => 180000, 'next_maintenance_due' => '2026-04-01'],
            ['name' => 'Seated Calf Raise Machine',            'category' => 'strength',      'brand' => 'Body-Solid',        'model_number' => 'GCSR349',       'status' => 'operational',        'location_area' => 'Leg Bay',          'purchase_cost' =>  95000, 'next_maintenance_due' => '2026-05-20'],
            ['name' => 'Hack Squat Machine 45°',               'category' => 'strength',      'brand' => 'Hammer Strength',   'model_number' => 'MHS-45',        'status' => 'operational',        'location_area' => 'Leg Bay',          'purchase_cost' => 230000, 'next_maintenance_due' => '2026-04-15'],
            ['name' => 'Smith Machine',                        'category' => 'strength',      'brand' => 'Body-Solid',        'model_number' => 'GDCC310',       'status' => 'operational',        'location_area' => 'Main Strength Bay','purchase_cost' => 155000, 'next_maintenance_due' => '2026-03-25'],
            ['name' => 'Cable Crossover Station Dual',        'category' => 'strength',      'brand' => 'Life Fitness',      'model_number' => 'CABLE-X-Pro',   'status' => 'operational',        'location_area' => 'Main Strength Bay','purchase_cost' => 265000, 'next_maintenance_due' => '2026-02-20'],
            ['name' => 'Lat Pulldown / Low Row',               'category' => 'strength',      'brand' => 'Technogym',         'model_number' => 'LP-R-Artis',    'status' => 'operational',        'location_area' => 'Back & Pull Bay',  'purchase_cost' => 198000, 'next_maintenance_due' => '2026-04-10'],
            ['name' => 'Seated Row Machine',                   'category' => 'strength',      'brand' => 'Hammer Strength',   'model_number' => 'ISO-SR-01',     'status' => 'operational',        'location_area' => 'Back & Pull Bay',  'purchase_cost' => 175000, 'next_maintenance_due' => '2026-05-01'],
            ['name' => 'Pec Deck / Butterfly Machine',         'category' => 'strength',      'brand' => 'Technogym',         'model_number' => 'PD-Artis-900',  'status' => 'under_repair',       'location_area' => 'Chest Bay',        'purchase_cost' => 165000, 'next_maintenance_due' => '2025-12-15', 'maintenance_notes' => 'Resistance cam assembly cracked — parts ordered.'],
            ['name' => 'Shoulder Press Machine',               'category' => 'strength',      'brand' => 'Life Fitness',      'model_number' => 'PSSP-D2',       'status' => 'operational',        'location_area' => 'Shoulder Bay',     'purchase_cost' => 185000, 'next_maintenance_due' => '2026-05-10'],
            ['name' => 'Assisted Pull-Up / Dip Machine',       'category' => 'strength',      'brand' => 'Hoist',             'model_number' => 'HD-3400',       'status' => 'operational',        'location_area' => 'Back & Pull Bay',  'purchase_cost' => 142000, 'next_maintenance_due' => '2026-06-15'],
            ['name' => 'Ab Crunch Machine',                    'category' => 'strength',      'brand' => 'Body-Solid',        'model_number' => 'SAC2000',       'status' => 'operational',        'location_area' => 'Core Zone',        'purchase_cost' =>  65000, 'next_maintenance_due' => '2026-07-01'],
            ['name' => 'Back Extension / Roman Chair',         'category' => 'strength',      'brand' => 'Life Fitness',      'model_number' => 'SHL-EXT-45',    'status' => 'operational',        'location_area' => 'Core Zone',        'purchase_cost' =>  48000, 'next_maintenance_due' => '2026-07-15'],
            ['name' => 'Glute Kickback Machine',               'category' => 'strength',      'brand' => 'Inspire Fitness',   'model_number' => 'FT2-GLT',       'status' => 'operational',        'location_area' => 'Glute & Hip Bay',  'purchase_cost' => 115000, 'next_maintenance_due' => '2026-05-25'],
            ['name' => 'Hip Abduction / Adduction Machine',    'category' => 'strength',      'brand' => 'Technogym',         'model_number' => 'HAB-900',       'status' => 'operational',        'location_area' => 'Glute & Hip Bay',  'purchase_cost' => 148000, 'next_maintenance_due' => '2026-06-10'],

            // ── FREE WEIGHTS ─────────────────────────────────────────────────
            ['name' => 'Olympic Barbell Set 20kg (×4)',        'category' => 'free_weights',  'brand' => 'Eleiko',            'model_number' => 'OB-20KG-SET',   'status' => 'operational',        'location_area' => 'Free Weights Area','purchase_cost' =>  96000, 'next_maintenance_due' => '2026-08-01'],
            ['name' => 'Olympic Weight Plate Set (5–25kg)',    'category' => 'free_weights',  'brand' => 'Eleiko',            'model_number' => 'WP-SET-01',     'status' => 'operational',        'location_area' => 'Free Weights Area','purchase_cost' => 220000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => 'Dumbbell Rack Set (5–50kg)',           'category' => 'free_weights',  'brand' => 'Hammer Strength',   'model_number' => 'DB-RACK-50P',   'status' => 'operational',        'location_area' => 'Free Weights Area','purchase_cost' => 380000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => 'EZ Curl Bar Set (×3)',                 'category' => 'free_weights',  'brand' => 'Generic Pro',       'model_number' => 'EZB-X3',        'status' => 'operational',        'location_area' => 'Free Weights Area','purchase_cost' =>  22000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => 'Adjustable Incline Bench',             'category' => 'free_weights',  'brand' => 'Body-Solid',        'model_number' => 'GFID225',       'status' => 'operational',        'location_area' => 'Chest Bay',        'purchase_cost' =>  42000, 'next_maintenance_due' => '2026-09-01'],
            ['name' => 'Flat Utility Bench (×2)',              'category' => 'free_weights',  'brand' => 'Rep Fitness',       'model_number' => 'AB-3000',       'status' => 'operational',        'location_area' => 'Free Weights Area','purchase_cost' =>  28000, 'next_maintenance_due' => '2026-09-01'],
            ['name' => 'Olympic Power Rack',                   'category' => 'free_weights',  'brand' => 'Rogue Fitness',     'model_number' => 'R-3-Pro',       'status' => 'operational',        'location_area' => 'Power Zone',       'purchase_cost' => 185000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => 'Kettlebell Set (8–32kg)',               'category' => 'free_weights',  'brand' => 'Rogue Fitness',     'model_number' => 'KB-SET-7P',     'status' => 'operational',        'location_area' => 'Functional Zone',  'purchase_cost' =>  68000, 'next_maintenance_due' => '2027-01-01'],

            // ── ACCESSORIES / FUNCTIONAL ─────────────────────────────────────
            ['name' => 'Battle Ropes 15m (×2)',                'category' => 'accessories',   'brand' => 'Garage Fit',        'model_number' => 'BR-15M-2IN',    'status' => 'operational',        'location_area' => 'Functional Zone',  'purchase_cost' =>  12000, 'next_maintenance_due' => '2026-10-01'],
            ['name' => 'Plyo Box Set (20/24/30")',              'category' => 'accessories',   'brand' => 'Rep Fitness',       'model_number' => 'PLY-3PACK',     'status' => 'operational',        'location_area' => 'Functional Zone',  'purchase_cost' =>  18000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => 'Resistance Band Set (×10)',             'category' => 'accessories',   'brand' => 'TRX',               'model_number' => 'RB-PRO-10P',    'status' => 'operational',        'location_area' => 'Stretching Zone',  'purchase_cost' =>   8500, 'next_maintenance_due' => '2026-06-01'],
            ['name' => 'TRX Suspension Trainer (×4)',           'category' => 'accessories',   'brand' => 'TRX',               'model_number' => 'TRX-PRO4',      'status' => 'operational',        'location_area' => 'Functional Zone',  'purchase_cost' =>  24000, 'next_maintenance_due' => '2026-08-01'],
            ['name' => 'Medicine Ball Set (3–10kg)',            'category' => 'accessories',   'brand' => 'Dynamax',           'model_number' => 'MB-SET-6P',     'status' => 'operational',        'location_area' => 'Functional Zone',  'purchase_cost' =>  32000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => 'Foam Roller Set (×6)',                  'category' => 'accessories',   'brand' => 'TriggerPoint',      'model_number' => 'GRID-FOAM-6P',  'status' => 'operational',        'location_area' => 'Stretching Zone',  'purchase_cost' =>   9000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => 'Pull-Up Bar Wall Mount (×3)',           'category' => 'accessories',   'brand' => 'Iron Age',          'model_number' => 'WPB-WALL-V2',   'status' => 'operational',        'location_area' => 'Functional Zone',  'purchase_cost' =>  15000, 'next_maintenance_due' => '2026-12-01'],

            // ── RECOVERY ─────────────────────────────────────────────────────
            ['name' => 'Massage Gun Percussive Therapy',       'category' => 'recovery',      'brand' => 'Hyperice',          'model_number' => 'Hypervolt-2',   'status' => 'operational',        'location_area' => 'Recovery Room',    'purchase_cost' =>  18500, 'next_maintenance_due' => '2026-06-01'],
            ['name' => 'Stretch Rack / Cage',                  'category' => 'recovery',      'brand' => 'LifeFitness',       'model_number' => 'SRC-200',       'status' => 'operational',        'location_area' => 'Stretching Zone',  'purchase_cost' =>  55000, 'next_maintenance_due' => '2026-10-01'],
            ['name' => 'Yoga / Stretching Mats (×20)',         'category' => 'recovery',      'brand' => 'Lululemon',         'model_number' => 'YM-5MM-20P',    'status' => 'operational',        'location_area' => 'Studio Room',      'purchase_cost' =>  24000, 'next_maintenance_due' => '2027-01-01'],

            // ── AUDIO / VISUAL ───────────────────────────────────────────────
            ['name' => 'Commercial Sound System',              'category' => 'audio_visual',  'brand' => 'JBL Pro',           'model_number' => 'EON715-SET',    'status' => 'operational',        'location_area' => 'Main Floor',       'purchase_cost' =>  85000, 'next_maintenance_due' => '2027-01-01'],
            ['name' => '75" Smart TV (×2)',                    'category' => 'audio_visual',  'brand' => 'Samsung',           'model_number' => 'QN75QN90C',     'status' => 'operational',        'location_area' => 'Cardio Zone',      'purchase_cost' =>  60000, 'next_maintenance_due' => '2027-01-01'],
        ];

        foreach ($items as $index => $item) {
            $code = sprintf('EQ-%03d', $index + 1);
            Equipment::create([
                'equipment_code'       => $code,
                'name'                 => $item['name'],
                'category'             => $item['category'],
                'brand'                => $item['brand'] ?? null,
                'model_number'         => $item['model_number'] ?? null,
                'status'               => $item['status'],
                'location_area'        => $item['location_area'],
                'purchase_cost'        => $item['purchase_cost'] ?? null,
                'currency'             => 'ETB',
                'next_maintenance_due' => $item['next_maintenance_due'] ?? null,
                'maintenance_notes'    => $item['maintenance_notes'] ?? null,
                'purchase_date'        => now()->subMonths(rand(2, 18))->toDateString(),
                'last_inspected_at'    => now()->subDays(rand(10, 60))->toDateString(),
            ]);
        }

        $this->command->info('Seeded ' . count($items) . ' equipment assets successfully.');
    }
}
