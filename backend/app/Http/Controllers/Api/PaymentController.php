<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Payment::class);

        $currentUser = $request->user();
        $query = Payment::with(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions']);

        // Scoping: Members only see their own payments
        if ($currentUser->hasRole('member') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            $query->where('user_id', $currentUser->id);
        }

        // Filter by member
        if ($request->filled('member_id')) {
            $query->where('user_id', $request->member_id);
        } elseif ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by payment method
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Filter by payment type
        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->payment_type);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search by receipt number, payment number, member name/code, reference
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('receipt_number', 'like', "%{$search}%")
                  ->orWhere('payment_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%")
                         ->orWhereHas('memberProfile', function ($mq) use ($search) {
                             $mq->where('member_code', 'like', "%{$search}%");
                         });
                  })
                  ->orWhereHas('transactions', function ($tq) use ($search) {
                      $tq->where('gateway_reference', 'like', "%{$search}%")
                         ->orWhere('transaction_reference', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->integer('per_page', 15);
        $payments = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => PaymentResource::collection($payments),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Financial summary / KPIs endpoint.
     */
    public function summary(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $isMemberOnly = $currentUser->hasRole('member') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist');

        $baseQuery = Payment::query();
        if ($isMemberOnly) {
            $baseQuery->where('user_id', $currentUser->id);
        }

        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $totalRevenue = (clone $baseQuery)->where('status', 'completed')->sum('amount');
        $todayRevenue = (clone $baseQuery)->where('status', 'completed')->whereDate('paid_at', $today)->sum('amount');
        $monthRevenue = (clone $baseQuery)->where('status', 'completed')->where('paid_at', '>=', $startOfMonth)->sum('amount');
        $pendingAmount = (clone $baseQuery)->where('status', 'pending')->sum('amount');
        $refundedAmount = (clone $baseQuery)->where('status', 'refunded')->sum('amount');

        // Breakdown by payment method for completed payments
        $byMethod = (clone $baseQuery)->where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get()
            ->keyBy('payment_method');

        // Breakdown by payment type for completed payments
        $byType = (clone $baseQuery)->where('status', 'completed')
            ->select('payment_type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_type')
            ->get()
            ->keyBy('payment_type');

        return response()->json([
            'status' => 'success',
            'data' => [
                'currency' => 'ETB',
                'total_revenue' => (float) $totalRevenue,
                'today_revenue' => (float) $todayRevenue,
                'month_revenue' => (float) $monthRevenue,
                'pending_amount' => (float) $pendingAmount,
                'refunded_amount' => (float) $refundedAmount,
                'completed_count' => (clone $baseQuery)->where('status', 'completed')->count(),
                'by_method' => $byMethod,
                'by_type' => $byType,
            ],
        ]);
    }

    /**
     * Record a newly received payment.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Payment::class);

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'in:cash,bank_transfer,bank_slip,pos,chapa,telebirr,other'],
            'payment_type' => ['nullable', 'string', 'in:subscription,registration,class_fee,trainer_fee,product,other'],
            'status' => ['nullable', 'string', 'in:completed,pending'],
            'payable_type' => ['nullable', 'string'],
            'payable_id' => ['nullable', 'integer'],
            'subscription_id' => ['nullable', 'integer', 'exists:subscriptions,id'],
            'gateway_reference' => ['nullable', 'string', 'max:100'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account_number' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        if (! $user->hasRole('member')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Payments can only be recorded for registered gym members.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $payableType = $validated['payable_type'] ?? null;
        $payableId = $validated['payable_id'] ?? null;
        $paymentType = $validated['payment_type'] ?? 'subscription';

        // Convenient subscription link
        if (! empty($validated['subscription_id'])) {
            $subscription = Subscription::findOrFail($validated['subscription_id']);
            $payableType = Subscription::class;
            $payableId = $subscription->id;
            $paymentType = 'subscription';
        }

        $status = $validated['status'] ?? 'completed';
        $paidAt = $status === 'completed' ? now() : null;

        $payment = DB::transaction(function () use ($validated, $user, $payableType, $payableId, $paymentType, $status, $paidAt, $request) {
            $paymentNumber = Payment::generateNextPaymentNumber();
            $receiptNumber = Payment::generateNextReceiptNumber();

            $p = Payment::create([
                'payment_number' => $paymentNumber,
                'receipt_number' => $receiptNumber,
                'user_id' => $user->id,
                'payable_type' => $payableType,
                'payable_id' => $payableId,
                'amount' => $validated['amount'],
                'currency' => 'ETB',
                'payment_method' => $validated['payment_method'],
                'payment_type' => $paymentType,
                'status' => $status,
                'paid_at' => $paidAt,
                'recorded_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Determine gateway category
            $gateway = match ($validated['payment_method']) {
                'bank_slip', 'bank_transfer' => 'bank_slip',
                'telebirr' => 'telebirr',
                'pos' => 'pos',
                'chapa' => 'chapa',
                default => 'manual',
            };

            PaymentTransaction::create([
                'payment_id' => $p->id,
                'transaction_reference' => PaymentTransaction::generateTransactionReference(),
                'gateway' => $gateway,
                'gateway_reference' => $validated['gateway_reference'] ?? null,
                'amount' => $p->amount,
                'currency' => 'ETB',
                'status' => $status === 'completed' ? 'successful' : 'pending',
                'bank_name' => $validated['bank_name'] ?? null,
                'bank_account_number' => $validated['bank_account_number'] ?? null,
                'verified_at' => $status === 'completed' ? now() : null,
                'ip_address' => $request->ip(),
            ]);

            // If linked to a pending subscription and payment is completed, activate subscription
            if ($payableType === Subscription::class && $payableId && $status === 'completed') {
                $sub = Subscription::find($payableId);
                if ($sub && $sub->status === 'pending') {
                    $sub->update(['status' => 'active']);
                }
            }

            AuditLogger::log(
                action: 'payment.recorded',
                auditable: $p,
                newValues: [
                    'payment_number' => $p->payment_number,
                    'receipt_number' => $p->receipt_number,
                    'member_id' => $user->id,
                    'amount' => $p->amount,
                    'method' => $p->payment_method,
                    'status' => $p->status,
                ],
                notes: "Recorded payment {$p->receipt_number} of {$p->amount} ETB via {$p->payment_method} for {$user->name}"
            );

            return $p;
        });

        $payment->load(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions']);

        return response()->json([
            'status' => 'success',
            'message' => "Payment {$payment->receipt_number} recorded successfully.",
            'data' => new PaymentResource($payment),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified payment receipt.
     */
    public function show(Payment $payment): JsonResponse
    {
        $this->authorize('view', $payment);

        $payment->load(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions']);

        return response()->json([
            'status' => 'success',
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * Issue a refund for a completed payment (Owner / Admin only).
     */
    public function refund(Request $request, Payment $payment): JsonResponse
    {
        $this->authorize('refund', $payment);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if ($payment->status !== 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only completed payments can be refunded.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($payment, $validated, $request) {
            $oldStatus = $payment->status;
            $appendNote = "[REFUNDED on " . now()->toDateTimeString() . " by " . $request->user()->name . ": " . $validated['reason'] . "]";
            $newNotes = trim(($payment->notes ? $payment->notes . "\n" : '') . $appendNote);

            $payment->update([
                'status' => 'refunded',
                'notes' => $newNotes,
            ]);

            // Update associated transactions to refunded
            $payment->transactions()->update(['status' => 'refunded']);

            AuditLogger::log(
                action: 'payment.refunded',
                auditable: $payment,
                oldValues: ['status' => $oldStatus],
                newValues: ['status' => 'refunded', 'reason' => $validated['reason']],
                notes: "Refunded payment {$payment->receipt_number} ({$payment->amount} ETB). Reason: {$validated['reason']}"
            );
        });

        $payment->load(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions']);

        return response()->json([
            'status' => 'success',
            'message' => "Payment {$payment->receipt_number} has been refunded.",
            'data' => new PaymentResource($payment),
        ]);
    }
}
