<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('attendance:auto-checkout', function () {
    $count = \App\Http\Controllers\Api\AttendanceController::autoCheckOutOverstayRecords();
    $this->info("Auto-checked out {$count} member visit(s) exceeding 4-hour limit.");
})->purpose('Auto-check out members who have been inside the gym for more than 4 hours');

\Illuminate\Support\Facades\Schedule::command('attendance:auto-checkout')->everyFifteenMinutes();

Artisan::command('classes:cleanup-completed', function () {
    $count = \App\Http\Controllers\Api\FitnessClassController::cleanupCompletedClasses();
    $this->info("Cleaned up {$count} completed non-recurring class(es) older than 48 hours.");
})->purpose('Remove non-recurring classes completed more than 48 hours ago');

\Illuminate\Support\Facades\Schedule::command('classes:cleanup-completed')->hourly();
