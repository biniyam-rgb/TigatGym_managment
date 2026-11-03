<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\ClassBooking;
use App\Models\FitnessClass;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ReceptionDashboardController extends Controller
{
    /**
     * Get aggregated operational data for the Reception Overview Dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Enforce role permission: Receptionists, Admins, and Owners only
        if (! $user->hasAnyRole('owner', 'admin', 'receptionist')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Only reception staff and management can access this dashboard.',
            ], Response::HTTP_FORBIDDEN);
        }

        $now = Carbon::now();
        $today = Carbon::today();
        $startOfDay = $today->copy()->startOfDay();
        $endOfDay = $today->copy()->endOfDay();
        $nextSevenDays = Carbon::today()->addDays(7)->endOfDay();

        $cacheKey = 'reception_dashboard_stats_'.$today->toDateString();
        if ($request->boolean('refresh')) {
            Cache::forget($cacheKey);
        }

        // Cache operational stats for 15s to keep reception page instantaneous on repeat loads
        $dashboardPayload = Cache::remember($cacheKey, 15, function () use ($now, $today, $startOfDay, $endOfDay, $nextSevenDays) {
            // -------------------------------------------------------------------------
            // 1. Statistics Cards (Actual Database Counts with Index-Optimized Queries)
            // -------------------------------------------------------------------------

            // Card 1: Active Members (Total members with currently active subscriptions)
            $activeMembersCount = Subscription::where('status', 'active')
                ->where('end_date', '>=', $today->toDateString())
                ->distinct('member_id')
                ->count('member_id');

            // Fallback to active member users if subscriptions table has not yet been populated
            if ($activeMembersCount === 0) {
                $activeMembersCount = User::role('member')->where('status', 'active')->count();
            }

            // Card 2: Today's Check-ins (Total successful attendance records admitted today)
            $todayCheckInsCount = AttendanceRecord::where('status', 'admitted')
                ->whereBetween('check_in_time', [$startOfDay, $endOfDay])
                ->count();

            // Card 3: Expected Members Today (Derived from today's fitness class bookings + scheduled sessions)
            $todayClassBookings = ClassBooking::whereHas('fitnessClass', function ($query) use ($startOfDay, $endOfDay) {
                $query->whereBetween('start_time', [$startOfDay, $endOfDay]);
            })
                ->where('status', 'reserved')
                ->count();

            // Total expected attendees: actual bookings plus historical daily baseline if available
            $expectedMembersCount = $todayClassBookings;
            if ($expectedMembersCount === 0) {
                // If no class reservations, check average daily check-ins over the past 7 days
                $weeklyAverage = (int) round(
                    AttendanceRecord::where('status', 'admitted')
                        ->whereBetween('check_in_time', [$today->copy()->subDays(7)->startOfDay(), $endOfDay])
                        ->count() / 7
                );
                $expectedMembersCount = max($weeklyAverage, $todayCheckInsCount);
            }

            // Card 4: Expiring Memberships (Expiring within the next 7 days)
            $expiringMembershipsCount = Subscription::where('status', 'active')
                ->whereBetween('end_date', [$today->toDateString(), $nextSevenDays->toDateString()])
                ->count();

            // Card 5: Revenue this month (Completed payments)
            $startOfMonth = $today->copy()->startOfMonth();
            $endOfMonth = $today->copy()->endOfMonth();
            $monthlyRevenue = (float) Payment::where('status', 'completed')
                ->whereBetween('paid_at', [$startOfMonth, $endOfMonth])
                ->sum('amount');

            // Member Sign-ups in past 30 days
            $thirtyDaysAgo = $today->copy()->subDays(30)->startOfDay();
            $signupsCount = User::role('member')
                ->where('created_at', '>=', $thirtyDaysAgo)
                ->count();

            // -------------------------------------------------------------------------
            // 2. Recent Check-ins (Latest 10 Attendance Records)
            // -------------------------------------------------------------------------
            $recentCheckIns = AttendanceRecord::with([
                'member:id,name,email,status',
                'member.memberProfile:id,user_id,member_code',
                'subscription:id,membership_plan_id,status,end_date',
                'subscription.plan:id,name',
            ])
                ->latest('check_in_time')
                ->limit(10)
                ->get()
                ->map(function ($record) use ($today) {
                    $member = $record->member;
                    $profile = $member?->memberProfile;
                    $subscription = $record->subscription;

                    // Determine membership status display
                    $membershipStatus = 'Active';
                    if ($subscription) {
                        if ($subscription->status === 'expired' || ($subscription->end_date && $subscription->end_date < $today)) {
                            $membershipStatus = 'Expired';
                        } elseif ($subscription->end_date && Carbon::parse($subscription->end_date)->diffInDays($today) <= 7) {
                            $membershipStatus = 'Expiring Soon';
                        } else {
                            $membershipStatus = ucfirst($subscription->status);
                        }
                    } elseif ($member) {
                        $membershipStatus = ucfirst($member->status);
                    }

                    return [
                        'id' => $record->id,
                        'member_id' => $record->member_id,
                        'member_name' => $member?->name ?? 'Unknown Member',
                        'member_code' => $profile?->member_code ?? ('TG-'.(1000 + $record->member_id)),
                        'check_in_time' => $record->check_in_time ? $record->check_in_time->format('h:i A') : '—',
                        'check_in_datetime' => $record->check_in_time ? $record->check_in_time->toIso8601String() : null,
                        'method' => $record->method ?? 'qr_code',
                        'attendance_status' => $record->status,
                        'membership_status' => $membershipStatus,
                        'plan_name' => $subscription?->plan?->name ?? 'Standard Membership',
                        'duration_minutes' => $record->duration_minutes,
                    ];
                });

            // -------------------------------------------------------------------------
            // 3. Membership Alerts (Expiring Soon, Expired, Inactive)
            // -------------------------------------------------------------------------
            $expiringSoonSubscriptions = Subscription::with([
                'member:id,name,phone,status',
                'member.memberProfile:id,user_id,member_code',
                'plan:id,name',
            ])
                ->where('status', 'active')
                ->whereBetween('end_date', [$today->toDateString(), $nextSevenDays->toDateString()])
                ->orderBy('end_date')
                ->limit(8)
                ->get()
                ->map(function ($sub) use ($today) {
                    $endDate = Carbon::parse($sub->end_date);
                    $daysRemaining = max(0, $today->diffInDays($endDate, false));

                    return [
                        'id' => $sub->id,
                        'member_id' => $sub->member_id,
                        'member_name' => $sub->member?->name ?? 'Member',
                        'member_code' => $sub->member?->memberProfile?->member_code ?? ('TG-'.(1000 + $sub->member_id)),
                        'plan_name' => $sub->plan?->name ?? 'Membership Plan',
                        'expiration_date' => $endDate->format('M d, Y'),
                        'days_remaining' => (int) $daysRemaining,
                        'type' => 'expiring_soon',
                        'status_label' => $daysRemaining === 0 ? 'Expires Today' : "{$daysRemaining}d remaining",
                        'severity' => $daysRemaining <= 2 ? 'high' : 'medium',
                    ];
                });

            $expiredSubscriptions = Subscription::with([
                'member:id,name,phone,status',
                'member.memberProfile:id,user_id,member_code',
                'plan:id,name',
            ])
                ->where(function ($query) use ($today) {
                    $query->where('status', 'expired')
                        ->orWhere(function ($q) use ($today) {
                            $q->where('status', 'active')->where('end_date', '<', $today->toDateString());
                        });
                })
                ->orderByDesc('end_date')
                ->limit(6)
                ->get()
                ->map(function ($sub) {
                    $endDate = $sub->end_date ? Carbon::parse($sub->end_date) : null;

                    return [
                        'id' => $sub->id,
                        'member_id' => $sub->member_id,
                        'member_name' => $sub->member?->name ?? 'Member',
                        'member_code' => $sub->member?->memberProfile?->member_code ?? ('TG-'.(1000 + $sub->member_id)),
                        'plan_name' => $sub->plan?->name ?? 'Membership Plan',
                        'expiration_date' => $endDate ? $endDate->format('M d, Y') : 'Expired',
                        'days_remaining' => 0,
                        'type' => 'expired',
                        'status_label' => 'Expired',
                        'severity' => 'high',
                    ];
                });

            $inactiveMembers = User::role('member')
                ->where('status', 'inactive')
                ->with('memberProfile:id,user_id,member_code')
                ->limit(5)
                ->get()
                ->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'member_id' => $member->id,
                        'member_name' => $member->name,
                        'member_code' => $member->memberProfile?->member_code ?? ('TG-'.(1000 + $member->id)),
                        'plan_name' => 'Account Inactive',
                        'expiration_date' => '—',
                        'days_remaining' => 0,
                        'type' => 'inactive',
                        'status_label' => 'Inactive Account',
                        'severity' => 'medium',
                    ];
                });

            $membershipAlerts = $expiringSoonSubscriptions->concat($expiredSubscriptions)->concat($inactiveMembers)->values();

            // -------------------------------------------------------------------------
            // 4. Today's Front-Desk Activities (Chronological Real Feed)
            // -------------------------------------------------------------------------
            $activities = collect();

            // A. Today's check-ins
            AttendanceRecord::with('member:id,name')
                ->whereBetween('check_in_time', [$startOfDay, $endOfDay])
                ->latest('check_in_time')
                ->limit(6)
                ->get()
                ->each(function ($att) use (&$activities) {
                    $activities->push([
                        'id' => 'att_'.$att->id,
                        'category' => 'check_in',
                        'title' => 'Member Admitted',
                        'description' => ($att->member?->name ?? 'Member').' verified via '.($att->method === 'qr_code' ? 'QR Pass' : 'front desk'),
                        'status' => $att->status,
                        'timestamp' => $att->check_in_time?->toIso8601String(),
                        'time_formatted' => $att->check_in_time ? $att->check_in_time->format('h:i A') : '—',
                    ]);
                });

            // B. Recent registrations (past 48 hours)
            User::role('member')
                ->where('created_at', '>=', $today->copy()->subDays(2)->startOfDay())
                ->latest('created_at')
                ->limit(4)
                ->get()
                ->each(function ($mem) use (&$activities) {
                    $activities->push([
                        'id' => 'reg_'.$mem->id,
                        'category' => 'registration',
                        'title' => 'New Registration',
                        'description' => $mem->name.' registered at reception desk',
                        'status' => $mem->status,
                        'timestamp' => $mem->created_at?->toIso8601String(),
                        'time_formatted' => $mem->created_at ? $mem->created_at->format('h:i A') : '—',
                    ]);
                });

            // C. Recent payments
            Payment::with('member:id,name')
                ->whereBetween('paid_at', [$startOfDay, $endOfDay])
                ->latest('paid_at')
                ->limit(4)
                ->get()
                ->each(function ($pay) use (&$activities) {
                    $amountFormatted = number_format($pay->amount, 2).' ETB';
                    $activities->push([
                        'id' => 'pay_'.$pay->id,
                        'category' => 'payment',
                        'title' => 'Payment Received',
                        'description' => "{$amountFormatted} collected from ".($pay->member?->name ?? 'Member').' via '.ucfirst(str_replace('_', ' ', $pay->payment_method ?? 'cash')),
                        'status' => $pay->status,
                        'timestamp' => $pay->paid_at?->toIso8601String(),
                        'time_formatted' => $pay->paid_at ? $pay->paid_at->format('h:i A') : '—',
                    ]);
                });

            // Sort combined activities by timestamp descending
            $todayActivities = $activities->sortByDesc('timestamp')->values()->take(10);

            // -------------------------------------------------------------------------
            // 5. Today's Classes (Today's Scheduled Fitness Classes)
            // -------------------------------------------------------------------------
            $todayClasses = FitnessClass::with(['trainer:id,name', 'bookings'])
                ->whereBetween('start_time', [$startOfDay, $endOfDay])
                ->orderBy('start_time')
                ->get()
                ->map(function ($class) {
                    $reservedCount = $class->bookings->where('status', 'reserved')->count();
                    $available = max(0, $class->capacity - $reservedCount);

                    return [
                        'id' => $class->id,
                        'name' => $class->name,
                        'trainer_name' => $class->trainer?->name ?? 'Assigned Trainer',
                        'room' => $class->room ?? 'Main Studio',
                        'start_time' => $class->start_time ? $class->start_time->format('h:i A') : '—',
                        'end_time' => $class->end_time ? $class->end_time->format('h:i A') : '—',
                        'start_datetime' => $class->start_time?->toIso8601String(),
                        'capacity' => $class->capacity,
                        'booking_count' => $reservedCount,
                        'available_capacity' => $available,
                        'is_full' => $available === 0,
                        'status' => $class->status ?? 'scheduled',
                    ];
                });

            // -------------------------------------------------------------------------
            // 6. Notifications (Receptionist Alerts & Reminders)
            // -------------------------------------------------------------------------
            $notifications = collect();

            // A. Expiration alerts
            if ($expiringMembershipsCount > 0) {
                $notifications->push([
                    'id' => 'notif_expiring',
                    'type' => 'warning',
                    'title' => 'Membership Expiration Warning',
                    'message' => "{$expiringMembershipsCount} member memberships are expiring within the next 7 days.",
                    'action_label' => 'View Expiring',
                    'action_target' => 'memberships',
                    'created_at' => $now->toIso8601String(),
                    'read' => false,
                ]);
            }

            // B. Uncollected/Pending Payments notice
            $pendingPaymentsCount = Payment::where('status', 'pending')
                ->where('created_at', '>=', $today->copy()->subDays(3)->startOfDay())
                ->count();
            if ($pendingPaymentsCount > 0) {
                $notifications->push([
                    'id' => 'notif_pending_payments',
                    'type' => 'warning',
                    'title' => 'Pending Invoices',
                    'message' => "There are {$pendingPaymentsCount} pending transactions awaiting payment verification.",
                    'action_label' => 'Open Ledger',
                    'action_target' => 'payments',
                    'created_at' => $now->toIso8601String(),
                    'read' => false,
                ]);
            }

            // C. Denied check-ins today
            $deniedCount = AttendanceRecord::where('status', 'denied')
                ->whereBetween('check_in_time', [$startOfDay, $endOfDay])
                ->count();
            if ($deniedCount > 0) {
                $notifications->push([
                    'id' => 'notif_denied',
                    'type' => 'error',
                    'title' => 'Turnstile Entry Denials',
                    'message' => "{$deniedCount} check-in attempts denied today due to inactive pass or anti-passback rule.",
                    'action_label' => 'Review Check-ins',
                    'action_target' => 'attendance',
                    'created_at' => $now->toIso8601String(),
                    'read' => false,
                ]);
            }

            // D. High floor occupancy warning if capacity > 80%
            $capacityLimit = 100;
            $currentlyInside = AttendanceRecord::where('status', 'admitted')
                ->whereNull('check_out_time')
                ->whereBetween('check_in_time', [$startOfDay, $endOfDay])
                ->count();

            if ($currentlyInside >= ($capacityLimit * 0.8)) {
                $notifications->push([
                    'id' => 'notif_capacity',
                    'type' => 'warning',
                    'title' => 'High Floor Occupancy',
                    'message' => "Gym floor is at {$currentlyInside}/{$capacityLimit} capacity.",
                    'action_label' => 'View Floor',
                    'action_target' => 'attendance',
                    'created_at' => $now->toIso8601String(),
                    'read' => false,
                ]);
            }

            return [
                'stats' => [
                    'active_members' => $activeMembersCount,
                    'today_check_ins' => $todayCheckInsCount,
                    'expected_members' => $expectedMembersCount,
                    'expiring_memberships' => $expiringMembershipsCount,
                    'revenue_this_month' => $monthlyRevenue,
                    'signups_last_30_days' => $signupsCount,
                    'currently_inside' => $currentlyInside,
                    'capacity_limit' => $capacityLimit,
                ],
                'recent_check_ins' => $recentCheckIns,
                'membership_alerts' => $membershipAlerts,
                'today_activities' => $todayActivities,
                'today_classes' => $todayClasses,
                'notifications' => $notifications->values(),
            ];
        });

        // Attach live user information to cached metrics
        $dashboardPayload['receptionist'] = [
            'name' => $user->name,
            'role' => 'Receptionist',
            'current_date' => $now->format('l, F j, Y'),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $dashboardPayload,
        ]);
    }
}
