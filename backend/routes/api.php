<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/status', function () {
    return response()->json([
        'system' => 'GymCore API',
        'brand' => 'TIGAT GYM',
        'version' => '1.0.0',
        'database' => \Illuminate\Support\Facades\DB::connection()->getPdo() ? 'connected' : 'disconnected',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
