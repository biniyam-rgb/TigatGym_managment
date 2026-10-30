<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes
|--------------------------------------------------------------------------
*/

Route::get('/status', function () {
    return response()->json([
        'system' => 'GymCore API',
        'brand' => 'TIGAT GYM',
        'version' => '1.0.0',
        'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Authentication Lifecycle Routes (Rate-limited)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');
});

/*
|--------------------------------------------------------------------------
| Protected API Routes (Requires Authenticated Sanctum Token & Active Status)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    // Current user & authentication management
    Route::get('/user', [AuthController::class, 'me']);
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Module A: Member Management & Profiles
    Route::apiResource('members', MemberController::class);
    Route::post('/members/{member}/regenerate-qr', [MemberController::class, 'regenerateQr']);

    // Roles directory
    Route::get('/roles', [RoleController::class, 'index'])->middleware('role:owner,admin,receptionist');

    // User & Identity Management
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/roles', [UserController::class, 'assignRole']);
    Route::delete('/users/{user}/roles/{role}', [UserController::class, 'removeRole']);

    // Audit Logging (Owner exclusive)
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('role:owner');
});
