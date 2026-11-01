<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::policy(\App\Models\User::class, \App\Policies\UserPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\AuditLog::class, \App\Policies\AuditLogPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\MemberProfile::class, \App\Policies\MemberPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\MembershipPlan::class, \App\Policies\MembershipPlanPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Subscription::class, \App\Policies\SubscriptionPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Payment::class, \App\Policies\PaymentPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Expense::class, \App\Policies\ExpensePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\AttendanceRecord::class, \App\Policies\AttendancePolicy::class);

        \Illuminate\Support\Facades\Route::model('member', \App\Models\MemberProfile::class);
        \Illuminate\Support\Facades\Route::model('subscription', \App\Models\Subscription::class);
        \Illuminate\Support\Facades\Route::model('membership_plan', \App\Models\MembershipPlan::class);
        \Illuminate\Support\Facades\Route::model('payment', \App\Models\Payment::class);
        \Illuminate\Support\Facades\Route::model('expense', \App\Models\Expense::class);
        \Illuminate\Support\Facades\Route::model('attendance', \App\Models\AttendanceRecord::class);
        \Illuminate\Support\Facades\Route::model('fitnessClass', \App\Models\FitnessClass::class);
        \Illuminate\Support\Facades\Route::model('equipment', \App\Models\Equipment::class);

        \Illuminate\Support\Facades\RateLimiter::for('login', function (\Illuminate\Http\Request $request) {
            $email = (string) $request->input('email');
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($email . '|' . $request->ip())->response(function () {
                return response()->json([
                    'message' => 'Too many login attempts. Please try again in 1 minute.',
                ], 429);
            });
        });

        \Illuminate\Support\Facades\RateLimiter::for('password-reset', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(3)->by($request->ip())->response(function () {
                return response()->json([
                    'message' => 'Too many password reset requests. Please try again shortly.',
                ], 429);
            });
        });

        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip()
            );
        });
    }
}
