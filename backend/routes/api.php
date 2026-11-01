<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FitnessClassController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\MembershipPlanController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TrainerController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkoutController;
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

    // Module C: Membership Plans & Subscriptions
    Route::apiResource('membership-plans', MembershipPlanController::class);
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::post('/subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew']);
    Route::post('/subscriptions/{subscription}/freeze', [SubscriptionController::class, 'freeze']);
    Route::post('/subscriptions/{subscription}/unfreeze', [SubscriptionController::class, 'unfreeze']);
    Route::post('/subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel']);

    // Module D: Payments & Financial Ledger
    Route::get('/payments/summary', [PaymentController::class, 'summary']);
    Route::apiResource('payments', PaymentController::class)->except(['update', 'destroy']);
    Route::post('/payments/{payment}/refund', [PaymentController::class, 'refund']);

    // Operating Expenses
    Route::get('/expenses/summary', [ExpenseController::class, 'summary']);
    Route::apiResource('expenses', ExpenseController::class);
    Route::post('/expenses/{expense}/approve', [ExpenseController::class, 'approve']);

    // Module E: Attendance & QR Check-in
    Route::get('/attendance/summary', [AttendanceController::class, 'summary']);
    Route::get('/attendance/lookup', [AttendanceController::class, 'lookup']);
    Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn']);
    Route::post('/attendance/check-out', [AttendanceController::class, 'checkOut']);
    Route::apiResource('attendance', AttendanceController::class)->except(['store', 'destroy']);

    // Module B: Trainer Management & PT Sessions
    Route::get('/trainers', [TrainerController::class, 'index']);
    Route::post('/trainers', [TrainerController::class, 'store']);
    Route::post('/trainers/assign', [TrainerController::class, 'assign']);
    Route::get('/trainers/sessions', [TrainerController::class, 'sessions']);
    Route::post('/trainers/sessions', [TrainerController::class, 'storeSession']);

    // Module G: Fitness Classes & Bookings
    Route::get('/classes', [FitnessClassController::class, 'index']);
    Route::post('/classes', [FitnessClassController::class, 'store']);
    Route::post('/classes/{fitnessClass}/book', [FitnessClassController::class, 'book']);
    Route::post('/classes/{fitnessClass}/cancel-booking', [FitnessClassController::class, 'cancelBooking']);

    // Module F: Workouts & Exercise Directory
    Route::get('/exercises', [WorkoutController::class, 'exercises']);
    Route::post('/exercises', [WorkoutController::class, 'storeExercise']);
    Route::get('/workouts/plans', [WorkoutController::class, 'plans']);
    Route::post('/workouts/plans', [WorkoutController::class, 'storePlan']);
    Route::post('/workouts/logs', [WorkoutController::class, 'logSet']);
    Route::get('/workouts/logs', [WorkoutController::class, 'logs']);

    // Module H: Equipment & Maintenance Inventory
    Route::apiResource('equipment', EquipmentController::class);

    // Roles directory
    Route::get('/roles', [RoleController::class, 'index'])->middleware('role:owner,admin,receptionist');

    // User & Identity Management
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/roles', [UserController::class, 'assignRole']);
    Route::delete('/users/{user}/roles/{role}', [UserController::class, 'removeRole']);

    // Audit Logging (Owner exclusive)
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('role:owner');
});
