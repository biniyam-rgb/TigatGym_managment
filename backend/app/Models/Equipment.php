<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Equipment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'equipment_code',
        'name',
        'category',
        'brand',
        'model_number',
        'serial_number',
        'purchase_date',
        'purchase_cost',
        'currency',
        'status',
        'location_area',
        'last_inspected_at',
        'next_maintenance_due',
        'maintenance_notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'purchase_cost' => 'decimal:2',
            'last_inspected_at' => 'date',
            'next_maintenance_due' => 'date',
        ];
    }
}
