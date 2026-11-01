<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EquipmentController extends Controller
{
    /**
     * List all facility gym equipment assets.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Equipment::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('equipment_code', 'like', "%{$search}%")
                  ->orWhere('location_area', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('name')->get();

        return response()->json([
            'status' => 'success',
            'data' => $items,
        ]);
    }

    /**
     * Register a new gym equipment asset (Owner / Admin).
     */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin')) {
            return response()->json(['message' => 'Unauthorized. Only management can register equipment.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'in:cardio,strength,free_weights,machines,accessories,audio_visual,recovery,other'],
            'brand' => ['nullable', 'string', 'max:100'],
            'model_number' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:operational,needs_maintenance,under_repair,out_of_service,decommissioned'],
            'location_area' => ['nullable', 'string', 'max:100'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'next_maintenance_due' => ['nullable', 'date'],
            'maintenance_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $count = Equipment::count() + 1;
        $code = sprintf('EQ-%03d', $count);

        $equipment = Equipment::create([
            'equipment_code' => $code,
            'name' => $validated['name'],
            'category' => $validated['category'],
            'brand' => $validated['brand'] ?? null,
            'model_number' => $validated['model_number'] ?? null,
            'status' => $validated['status'] ?? 'operational',
            'location_area' => $validated['location_area'] ?? 'Main Floor',
            'purchase_cost' => $validated['purchase_cost'] ?? null,
            'currency' => 'ETB',
            'next_maintenance_due' => $validated['next_maintenance_due'] ?? null,
            'maintenance_notes' => $validated['maintenance_notes'] ?? null,
        ]);

        AuditLogger::log(
            action: 'equipment.registered',
            auditable: $equipment,
            notes: "Registered equipment {$equipment->name} ({$code})"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Equipment {$equipment->name} ({$code}) registered successfully.",
            'data' => $equipment,
        ], Response::HTTP_CREATED);
    }

    /**
     * Update equipment status or maintenance inspection notes.
     */
    public function update(Request $request, Equipment $equipment): JsonResponse
    {
        if (! $request->user()->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json(['message' => 'Unauthorized.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'required', 'string', 'in:operational,needs_maintenance,under_repair,out_of_service,decommissioned'],
            'location_area' => ['nullable', 'string', 'max:100'],
            'last_inspected_at' => ['nullable', 'date'],
            'next_maintenance_due' => ['nullable', 'date'],
            'maintenance_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldStatus = $equipment->status;
        $equipment->update($validated);

        AuditLogger::log(
            action: 'equipment.updated',
            auditable: $equipment,
            notes: "Updated equipment {$equipment->equipment_code} status: {$oldStatus} -> {$equipment->status}"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Equipment {$equipment->equipment_code} updated successfully.",
            'data' => $equipment,
        ]);
    }

    /**
     * Soft delete an equipment asset (Owner only).
     */
    public function destroy(Request $request, Equipment $equipment): JsonResponse
    {
        if (! $request->user()->hasRole('owner')) {
            return response()->json(['message' => 'Only the gym owner can remove equipment assets.'], Response::HTTP_FORBIDDEN);
        }

        $code = $equipment->equipment_code;
        $name = $equipment->name;

        $equipment->delete();

        AuditLogger::log(
            action: 'equipment.deleted',
            auditable: $equipment,
            notes: "Deleted equipment asset {$code} ({$name})"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Equipment asset {$code} removed successfully.",
        ]);
    }
}
