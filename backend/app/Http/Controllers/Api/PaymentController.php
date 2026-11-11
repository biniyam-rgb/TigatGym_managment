<?php

namespace App\Http\Controllers\Api;

use App\Events\MembershipActivated;
use App\Exceptions\ChapaException;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\MembershipPlan;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ChapaService;
use App\Services\GymMailService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends Controller
{
    protected ChapaService $chapaService;

    public function __construct(ChapaService $chapaService)
    {
        $this->chapaService = $chapaService;
    }

    /**
     * Display a listing of payments.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Payment::class);

        $currentUser = $request->user();
        $query = Payment::with(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions', 'documentDelivery']);

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
                         ->orWhere(function ($pq) use ($search) {
                             $pq->wherePhoneMatches($search);
                         })
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
            'membership_plan_id' => ['nullable', 'integer', 'exists:membership_plans,id'],
            'start_date' => ['nullable', 'date'],
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
        } elseif (! empty($validated['membership_plan_id'])) {
            $plan = MembershipPlan::findOrFail($validated['membership_plan_id']);
            $startDate = ! empty($validated['start_date']) ? Carbon::parse($validated['start_date']) : Carbon::today();
            $endDate = $plan->calculateEndDate($startDate);
            $sub = Subscription::create([
                'member_id' => $user->id,
                'membership_plan_id' => $plan->id,
                'subscription_number' => Subscription::generateNextSubscriptionNumber(),
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'status' => ($validated['status'] ?? 'completed') === 'completed' ? 'active' : 'pending',
                'price' => (float) $plan->price,
                'discount' => max(0, (float) $plan->price - (float) $validated['amount']),
                'total_amount' => (float) $validated['amount'],
                'currency' => $plan->currency ?? 'ETB',
                'created_by' => $request->user()?->id,
            ]);
            $payableType = Subscription::class;
            $payableId = $sub->id;
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

        $payment->load(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions', 'documentDelivery']);

        // Automatically trigger membership document generation & email delivery
        if ($payment->status === 'completed') {
            $subscription = $payment->payable_type === Subscription::class && $payment->payable_id
                ? Subscription::with('plan')->find($payment->payable_id)
                : null;

            event(new MembershipActivated($payment, $subscription));
        }

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

        $payment->load(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions', 'documentDelivery']);

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

        $payment->load(['user.memberProfile', 'recordedBy', 'payable.plan', 'transactions', 'documentDelivery']);

        return response()->json([
            'status' => 'success',
            'message' => "Payment {$payment->receipt_number} has been refunded.",
            'data' => new PaymentResource($payment),
        ]);
    }

    /**
     * Initialize Chapa v2 Hosted Checkout session for membership subscription.
     */
    public function initializeChapa(Request $request): JsonResponse
    {
        $this->authorize('create', Payment::class);

        $validated = $request->validate([
            'member_id' => ['nullable', 'integer', 'exists:users,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'membership_plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'subscription_id' => ['nullable', 'integer', 'exists:subscriptions,id'],
            'start_date' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:25'],
            'email' => ['nullable', 'email', 'max:255'],
            'return_url' => ['nullable', 'url', 'max:500'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
        ]);

        $memberId = $validated['member_id'] ?? $validated['user_id'] ?? null;
        if (! $memberId) {
            $phone = trim((string) ($request->input('phone') ?? ''));
            $name = trim((string) ($request->input('name') ?? ''));
            if (empty($name) || empty($phone)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'The member_id field is required (or valid name and phone for registration checkout).',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Find existing user by phone or create pending user for new registration
            $member = User::where('phone', $phone)->first();
            if (! $member) {
                $member = DB::transaction(function () use ($name, $phone, $request) {
                    $memberCode = MemberProfile::generateNextMemberCode();
                    $qrToken = MemberProfile::generateUniqueQrToken();
                    $email = $request->input('email') ?: strtolower(str_replace('-', '', $memberCode)) . '@members.tigatgym.com';
                    $u = User::create([
                        'name' => $name,
                        'email' => $email,
                        'phone' => $phone,
                        'status' => 'active',
                        'password' => \Illuminate\Support\Facades\Hash::make('Password123!'),
                    ]);
                    $role = Role::where('name', 'member')->first();
                    if ($role) {
                        $u->roles()->attach($role->id);
                    }
                    MemberProfile::create([
                        'user_id' => $u->id,
                        'member_code' => $memberCode,
                        'qr_code_token' => $qrToken,
                        'joined_at' => now(),
                    ]);
                    return $u;
                });
            }
            $memberId = $member->id;
        } else {
            $member = User::with('memberProfile')->findOrFail($memberId);
        }

        if (! $member->hasRole('member')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Online payments can only be processed for registered members.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Strict credentials check: member must have valid credentials before payment can be initiated
        if (empty(trim($member->name)) || strlen(trim($member->name)) < 2) {
            return response()->json([
                'status' => 'error',
                'message' => 'Member credentials incomplete: valid name is required before initiating payment.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (empty(trim($member->phone))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Member credentials incomplete: valid phone number is required before initiating payment.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($member->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Member account is not active. Cannot process payment for inactive credentials.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 1. Authoritative server-side price validation: retrieve plan price directly from DB
        $plan = MembershipPlan::findOrFail($validated['membership_plan_id']);
        if (! $plan->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'The selected membership plan is currently not active.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $authorizedAmount = (float) $plan->price;

        // 2. Idempotency Key Handling & Safe Retries
        $idempotencyKey = trim((string) (
            $request->header('Idempotency-Key')
            ?: $request->header('X-Idempotency-Key')
            ?: ($validated['idempotency_key'] ?? '')
        ));

        if (! empty($idempotencyKey)) {
            $existingTxn = PaymentTransaction::with('payment')
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existingTxn) {
                // If payment is already completed, prevent duplicate payment
                if ($existingTxn->payment && $existingTxn->payment->status === 'completed') {
                    return response()->json([
                        'status' => 'success',
                        'message' => 'Payment has already been completed for this transaction.',
                        'data' => [
                            'merchant_reference' => $existingTxn->transaction_reference,
                            'gateway_reference' => $existingTxn->gateway_reference,
                            'payment_id' => $existingTxn->payment_id,
                            'status' => 'completed',
                            'amount' => (float) $existingTxn->payment->amount,
                            'currency' => $existingTxn->payment->currency,
                            'is_completed' => true,
                        ],
                    ]);
                }

                // If existing checkout session exists and is pending, reuse active session
                $cachedUrl = $existingTxn->gateway_response['data']['checkout_url']
                    ?? $existingTxn->gateway_response['checkout_url']
                    ?? null;

                if (! empty($cachedUrl)) {
                    return response()->json([
                        'status' => 'success',
                        'message' => 'Reusing active checkout session for this idempotency key.',
                        'data' => [
                            'checkout_url' => $cachedUrl,
                            'merchant_reference' => $existingTxn->transaction_reference,
                            'gateway_reference' => $existingTxn->gateway_reference,
                            'payment_id' => $existingTxn->payment_id,
                            'subscription_id' => $existingTxn->payment?->payable_id,
                            'amount' => (float) $existingTxn->amount,
                            'currency' => $existingTxn->currency,
                            'plan_name' => $plan->name,
                            'status' => 'pending',
                            'is_retry' => true,
                            'idempotency_key' => $idempotencyKey,
                        ],
                    ]);
                }
            }
        } else {
            // Generate a fresh unique idempotency key for this new payment attempt
            $idempotencyKey = 'IDEMP-' . Str::uuid()->toString();
        }

        // 3. Subscription Handling (Strictly Pending)
        if (! empty($validated['subscription_id'])) {
            $subscription = Subscription::where('id', $validated['subscription_id'])
                ->where('member_id', $member->id)
                ->firstOrFail();

            if ($subscription->status === 'active') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This subscription is already active and paid.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        } else {
            // Find existing pending subscription or create a new pending one
            $subscription = Subscription::where('member_id', $member->id)
                ->where('membership_plan_id', $plan->id)
                ->where('status', 'pending')
                ->latest('id')
                ->first();

            if (! $subscription) {
                $startDate = $request->filled('start_date') ? Carbon::parse($validated['start_date']) : Carbon::today();
                $endDate = $plan->calculateEndDate($startDate);

                $subscription = Subscription::create([
                    'member_id' => $member->id,
                    'membership_plan_id' => $plan->id,
                    'subscription_number' => Subscription::generateNextSubscriptionNumber(),
                    'start_date' => $startDate->toDateString(),
                    'end_date' => $endDate->toDateString(),
                    'status' => 'pending', // Strictly pending until server-side payment verification
                    'price' => $authorizedAmount,
                    'discount' => 0.00,
                    'total_amount' => $authorizedAmount,
                    'currency' => 'ETB',
                    'created_by' => $request->user()?->id,
                ]);
            }
        }

        // 4. Generate unique GymCore merchant reference (max 20 characters)
        $merchantReference = PaymentTransaction::generateMerchantReference();

        // 5. Customer details preparation
        $nameParts = explode(' ', trim($member->name));
        $firstName = $nameParts[0] ?? 'GymCore';
        $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : 'Member';
        $customerPhone = $request->input('phone') ?: ($member->phone ?: '+251911000000');
        $customerEmail = $request->input('email') ?: ($member->email ?: 'reception@tigatgym.com');

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $returnUrl = $request->input('return_url') ?: "{$frontendUrl}/payments/verify?ref={$merchantReference}";
        $callbackUrl = url('/api/payments/chapa/webhook');

        // 6. Create Pending Payment & Initiated Transaction in DB
        $payment = DB::transaction(function () use ($member, $subscription, $plan, $authorizedAmount, $merchantReference, $idempotencyKey, $request) {
            $p = Payment::create([
                'payment_number' => Payment::generateNextPaymentNumber(),
                'receipt_number' => Payment::generateNextReceiptNumber(),
                'user_id' => $member->id,
                'payable_type' => Subscription::class,
                'payable_id' => $subscription->id,
                'amount' => $authorizedAmount,
                'currency' => 'ETB',
                'payment_method' => 'chapa',
                'payment_type' => 'subscription',
                'status' => 'pending',
                'recorded_by' => $request->user()?->id,
                'notes' => "Chapa hosted checkout for {$plan->name} ({$subscription->subscription_number})",
            ]);

            PaymentTransaction::create([
                'payment_id' => $p->id,
                'transaction_reference' => $merchantReference,
                'gateway' => 'chapa',
                'gateway_reference' => null, // populated below from Chapa's response
                'amount' => $authorizedAmount,
                'currency' => 'ETB',
                'status' => 'initiated',
                'idempotency_key' => $idempotencyKey,
                'ip_address' => $request->ip(),
            ]);

            return $p;
        });

        // 7. Initialize Chapa Hosted Checkout via ChapaService
        try {
            $chapaResult = $this->chapaService->initializeHostedPayment([
                'amount' => $authorizedAmount,
                'currency' => 'ETB',
                'merchant_reference' => $merchantReference,
                'customer' => [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $customerEmail,
                    'phone_number' => $customerPhone,
                ],
                'callback_url' => $callbackUrl,
                'return_url' => $returnUrl,
                'customization' => [
                    'title' => 'Tigat Gym - ' . $plan->name,
                    'description' => "Membership subscription fee for {$member->name}",
                ],
            ], $idempotencyKey);

            // 8. Update transaction with Chapa's reference and response payload
            $txn = PaymentTransaction::where('transaction_reference', $merchantReference)->first();
            if ($txn) {
                $txn->update([
                    'gateway_reference' => $chapaResult['gateway_reference'],
                    'gateway_response' => $chapaResult['data'],
                    'status' => 'pending',
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Payment initialized successfully. Please redirect customer to Chapa checkout.',
                'data' => [
                    'checkout_url' => $chapaResult['checkout_url'],
                    'merchant_reference' => $merchantReference,
                    'gateway_reference' => $chapaResult['gateway_reference'],
                    'payment_id' => $payment->id,
                    'subscription_id' => $subscription->id,
                    'amount' => $authorizedAmount,
                    'currency' => 'ETB',
                    'plan_name' => $plan->name,
                    'status' => 'pending',
                    'idempotency_key' => $idempotencyKey,
                ],
            ], Response::HTTP_CREATED);
        } catch (ChapaException $e) {
            // Update transaction to failed if gateway refused
            PaymentTransaction::where('transaction_reference', $merchantReference)->update([
                'status' => 'failed',
                'gateway_response' => $e->getResponseBody(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Chapa payment gateway initialization failed: ' . $e->getMessage(),
            ], $e->getStatusCode() ?: Response::HTTP_BAD_GATEWAY);
        }
    }

    /**
     * Verify a Chapa payment transaction against gateway and database.
     */
    public function verifyChapa(Request $request): JsonResponse
    {
        // 1. Resolve GymCore's merchant_reference from route parameter or request input
        $merchantReference = trim((string) (
            $request->route('reference')
            ?: $request->input('merchant_reference')
            ?: $request->input('reference')
            ?: $request->input('tx_ref')
        ));

        if (empty($merchantReference)) {
            return response()->json([
                'status' => 'error',
                'message' => 'GymCore merchant reference is required for payment verification.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 2. Find corresponding PaymentTransaction and Payment
        $transaction = PaymentTransaction::with(['payment.user', 'payment.payable'])
            ->where('transaction_reference', $merchantReference)
            ->first();

        if (! $transaction) {
            return response()->json([
                'status' => 'error',
                'message' => "Payment transaction not found for merchant reference: {$merchantReference}",
            ], Response::HTTP_NOT_FOUND);
        }

        $payment = $transaction->payment;
        if (! $payment) {
            return response()->json([
                'status' => 'error',
                'message' => 'Associated payment record not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        // 3. Authorization Check: Staff or member who owns this payment
        $user = $request->user();
        if (! $user->can('view', $payment)) {
            return response()->json([
                'status' => 'error',
                'message' => 'You are not authorized to verify this payment transaction.',
            ], Response::HTTP_FORBIDDEN);
        }

        // 4. Idempotency Check: If already completed, prevent repeated changes or duplicates
        if ($payment->status === 'completed' && $transaction->status === 'successful') {
            // Ensure subscription is active if not already activated
            $sub = null;
            if ($payment->payable_type === Subscription::class && $payment->payable_id) {
                $sub = Subscription::find($payment->payable_id);
                if ($sub && $sub->status === 'pending') {
                    $sub = $this->activateSubscriptionForPayment($payment, $transaction);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Payment has already been verified and completed.',
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'gateway_reference' => $transaction->gateway_reference,
                    'payment_id' => $payment->id,
                    'subscription_id' => $payment->payable_id,
                    'subscription_status' => $sub?->status ?? 'active',
                    'start_date' => $sub?->start_date?->toDateString(),
                    'end_date' => $sub?->end_date?->toDateString(),
                    'status' => 'completed',
                    'is_paid' => true,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'verified_at' => $transaction->verified_at?->toIso8601String() ?? now()->toIso8601String(),
                    'already_completed' => true,
                ],
            ]);
        }

        // 5. Select correct Chapa payment reference for the Chapa API
        // Never confuse merchant_reference with gateway_reference
        $chapaReference = ! empty($transaction->gateway_reference)
            ? $transaction->gateway_reference
            : $transaction->transaction_reference;

        try {
            $verification = $this->chapaService->verifyPayment($chapaReference);
        } catch (ChapaException $e) {
            DB::transaction(function () use ($transaction, $payment, $e) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => $e->getResponseBody() ?? ['error' => $e->getMessage()],
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => 'Payment verification failed: ' . $e->getMessage(),
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => 'failed',
                ],
            ], $e->getStatusCode() ?: Response::HTTP_BAD_GATEWAY);
        }

        // Handle 404 from gateway
        if (! $verification['success'] || $verification['status'] === 'not_found') {
            return response()->json([
                'status' => 'error',
                'message' => 'Transaction was not found on Chapa payment gateway.',
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => 'not_found',
                    'raw' => $verification['raw'] ?? null,
                ],
            ], Response::HTTP_NOT_FOUND);
        }

        // 6. Verify against database: expected merchant reference, expected amount, and currency
        // Reject verification if merchant_reference is missing OR does not exactly match local transaction_reference.
        // Never skip the comparison when the gateway reference is missing.
        $gatewayMerchantRef = trim((string) ($verification['merchant_reference'] ?? ''));
        if (empty($gatewayMerchantRef) || $gatewayMerchantRef !== $transaction->transaction_reference) {
            \Illuminate\Support\Facades\Log::warning('Chapa payment merchant reference missing or mismatch', [
                'expected' => $transaction->transaction_reference,
                'gateway_merchant_reference' => $gatewayMerchantRef,
            ]);

            DB::transaction(function () use ($transaction, $payment, $verification, $gatewayMerchantRef) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => array_merge($verification['raw'] ?? [], [
                        'error' => empty($gatewayMerchantRef)
                            ? 'Missing merchant reference in gateway response'
                            : 'Merchant reference mismatch',
                    ]),
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => empty($gatewayMerchantRef)
                    ? 'Payment verification failed: Gateway response is missing merchant reference.'
                    : "Payment merchant reference mismatch: expected {$transaction->transaction_reference}, received {$gatewayMerchantRef}.",
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => 'failed',
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Validate amount presence and validity
        if (! isset($verification['amount_in_cents']) || ! ChapaService::isValidMinorUnitsAmount($verification['amount_in_cents'])) {
            DB::transaction(function () use ($transaction, $payment, $verification) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => array_merge($verification['raw'] ?? [], ['error' => 'Invalid or missing payment amount']),
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => 'Payment verification failed: Gateway response contains an invalid or missing amount.',
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => 'failed',
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $expectedCents = ChapaService::convertToMinorUnits($payment->amount);
        $receivedCents = (int) $verification['amount_in_cents'];

        if ($expectedCents !== $receivedCents) {
            \Illuminate\Support\Facades\Log::warning('Chapa payment amount mismatch', [
                'merchant_reference' => $transaction->transaction_reference,
                'expected_cents' => $expectedCents,
                'received_cents' => $receivedCents,
            ]);

            DB::transaction(function () use ($transaction, $payment, $verification) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => array_merge($verification['raw'] ?? [], ['error' => 'Amount mismatch']),
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => "Payment amount mismatch: expected {$payment->amount} ETB, received {$verification['amount']} ETB.",
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => 'failed',
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $expectedCurrency = 'ETB';
        $receivedCurrency = strtoupper($verification['currency']);
        if ($receivedCurrency !== $expectedCurrency) {
            \Illuminate\Support\Facades\Log::warning('Chapa payment currency mismatch', [
                'merchant_reference' => $transaction->transaction_reference,
                'expected' => $expectedCurrency,
                'received' => $receivedCurrency,
            ]);

            DB::transaction(function () use ($transaction, $payment, $verification) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => array_merge($verification['raw'] ?? [], ['error' => 'Currency mismatch']),
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => "Payment currency mismatch: expected {$expectedCurrency}, received {$receivedCurrency}.",
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => 'failed',
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 7. Map Chapa status to GymCore Payment and PaymentTransaction statuses
        $gatewayStatus = $verification['status'];

        if ($gatewayStatus === 'success' && $verification['is_paid']) {
            $now = now();
            $activatedSub = null;
            DB::transaction(function () use ($transaction, $payment, $verification, $now, &$activatedSub) {
                $transaction->update([
                    'gateway_reference' => $verification['chapa_reference'] ?: $transaction->gateway_reference,
                    'status' => 'successful',
                    'verified_at' => $now,
                    'gateway_response' => $verification['raw'],
                ]);

                $paymentUpdates = [
                    'status' => 'completed',
                    'paid_at' => $now,
                ];
                if (empty($payment->receipt_number)) {
                    $paymentUpdates['receipt_number'] = Payment::generateNextReceiptNumber();
                }
                $payment->update($paymentUpdates);

                // Phase 3: Activate subscription for confirmed successful payment
                $activatedSub = $this->activateSubscriptionForPayment($payment, $transaction);
            });

            // Automatically dispatch membership documents (Card + Receipt PDFs) via queue
            $payment->loadMissing(['user.memberProfile', 'payable.plan']);
            event(new MembershipActivated($payment, $activatedSub));

            return response()->json([
                'status' => 'success',
                'message' => 'Payment verified successfully.',
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'gateway_reference' => $transaction->gateway_reference,
                    'payment_id' => $payment->id,
                    'subscription_id' => $payment->payable_id,
                    'subscription_status' => $activatedSub?->status ?? 'active',
                    'start_date' => $activatedSub?->start_date?->toDateString(),
                    'end_date' => $activatedSub?->end_date?->toDateString(),
                    'status' => 'completed',
                    'is_paid' => true,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'verified_at' => $now->toIso8601String(),
                ],
            ]);
        }

        if ($gatewayStatus === 'pending') {
            $transaction->update([
                'status' => 'pending',
                'gateway_response' => $verification['raw'],
            ]);

            return response()->json([
                'status' => 'pending',
                'message' => 'Payment is still pending on Chapa gateway.',
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'gateway_reference' => $transaction->gateway_reference,
                    'payment_id' => $payment->id,
                    'subscription_id' => $payment->payable_id,
                    'status' => 'pending',
                    'is_paid' => false,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                ],
            ]);
        }

        // Failed or cancelled status
        DB::transaction(function () use ($transaction, $payment, $verification) {
            $transaction->update([
                'status' => 'failed',
                'gateway_response' => $verification['raw'],
            ]);

            $payment->update([
                'status' => 'failed',
            ]);
        });

        return response()->json([
            'status' => $gatewayStatus,
            'message' => "Payment verification returned {$gatewayStatus} status.",
            'data' => [
                'merchant_reference' => $transaction->transaction_reference,
                'gateway_reference' => $transaction->gateway_reference,
                'payment_id' => $payment->id,
                'subscription_id' => $payment->payable_id,
                'status' => 'failed',
                'is_paid' => false,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
            ],
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    }

    /**
     * Phase 2: Secure Chapa Webhook endpoint.
     *
     * Endpoint: POST /api/payments/chapa/webhook
     *
     * Requirements:
     * - Authenticate incoming webhooks using Chapa's HMAC-SHA256 signature header.
     * - Locate local payment using GymCore merchant reference.
     * - Never trust webhook data alone; perform server-side verification with Chapa gateway.
     * - Handle duplicate webhook deliveries idempotently without modifying already completed payments.
     * - Activate membership only upon successful verification.
     * - Never expose API credentials or private keys.
     * - Return appropriate HTTP responses.
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $rawPayload = $request->getContent();
        $signature = $request->header('Chapa-Signature')
            ?: $request->header('x-chapa-signature')
            ?: $request->header('Signature');

        Log::info('Chapa webhook received', [
            'ip' => $request->ip(),
            'has_signature' => ! empty($signature),
        ]);

        // 1. Verify Webhook Signature
        if (empty($signature) || ! $this->chapaService->verifyWebhookSignature($rawPayload, $signature)) {
            Log::warning('Chapa webhook signature verification failed', [
                'ip' => $request->ip(),
                'has_signature' => ! empty($signature),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or missing Chapa webhook signature.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $payload = json_decode($rawPayload, true) ?: [];
        $data = $payload['data'] ?? $payload;

        // 2. Extract GymCore merchant reference
        $merchantReference = trim((string) (
            $data['merchant_reference']
            ?? $payload['merchant_reference']
            ?? ''
        ));

        // Fallback to tx_ref if present in webhook payload to locate our transaction
        if (empty($merchantReference)) {
            $merchantReference = trim((string) (
                $data['tx_ref']
                ?? $payload['tx_ref']
                ?? $data['trx_ref']
                ?? $payload['trx_ref']
                ?? ''
            ));
        }

        if (empty($merchantReference)) {
            Log::warning('Chapa webhook missing merchant reference', ['payload' => $payload]);

            return response()->json([
                'status' => 'error',
                'message' => 'Merchant reference is missing in webhook payload.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 3. Locate local transaction and payment
        $transaction = PaymentTransaction::with(['payment.payable', 'payment.user'])
            ->where('transaction_reference', $merchantReference)
            ->first();

        if (! $transaction) {
            // Also check by gateway reference if merchant ref was not found directly
            $transaction = PaymentTransaction::with(['payment.payable', 'payment.user'])
                ->where('gateway_reference', $merchantReference)
                ->first();
        }

        if (! $transaction || ! $transaction->payment) {
            Log::warning('Chapa webhook transaction not found for reference', [
                'merchant_reference' => $merchantReference,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => "Payment transaction not found for reference: {$merchantReference}",
            ], Response::HTTP_NOT_FOUND);
        }

        $payment = $transaction->payment;

        // 4. Idempotency Guard: Handle duplicate webhook deliveries safely
        if ($payment->status === 'completed' && $transaction->status === 'successful') {
            // Ensure subscription is active if not already activated
            if ($payment->payable_type === Subscription::class && $payment->payable_id) {
                $sub = Subscription::find($payment->payable_id);
                if ($sub && $sub->status === 'pending') {
                    $this->activateSubscriptionForPayment($payment, $transaction);
                }
            }

            Log::info('Chapa webhook: Payment already completed and verified (duplicate delivery)', [
                'merchant_reference' => $transaction->transaction_reference,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Webhook received. Payment is already completed.',
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => 'completed',
                    'already_processed' => true,
                ],
            ], Response::HTTP_OK);
        }

        // 5. Critical Security Rule: Never trust webhook data alone to mark payment completed.
        // Perform server-side verification with Chapa gateway.
        $chapaReference = ! empty($transaction->gateway_reference)
            ? $transaction->gateway_reference
            : (! empty($data['chapa_reference']) ? (string) $data['chapa_reference'] : $transaction->transaction_reference);

        try {
            $verification = $this->chapaService->verifyPayment($chapaReference);
        } catch (ChapaException $e) {
            Log::error('Chapa webhook server-side verification failed', [
                'merchant_reference' => $transaction->transaction_reference,
                'chapa_reference' => $chapaReference,
                'error' => $e->getMessage(),
            ]);

            DB::transaction(function () use ($transaction, $payment, $e) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => $e->getResponseBody() ?? ['error' => $e->getMessage()],
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => 'Gateway server-side verification failed: ' . $e->getMessage(),
            ], Response::HTTP_BAD_GATEWAY);
        }

        // Check reference mismatch
        $gatewayMerchantRef = trim((string) ($verification['merchant_reference'] ?? ''));
        if (empty($gatewayMerchantRef) || $gatewayMerchantRef !== $transaction->transaction_reference) {
            Log::warning('Chapa webhook merchant reference mismatch during verification', [
                'expected' => $transaction->transaction_reference,
                'received' => $gatewayMerchantRef,
            ]);

            DB::transaction(function () use ($transaction, $payment, $verification) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => array_merge($verification['raw'] ?? [], ['error' => 'Merchant reference mismatch']),
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => 'Merchant reference mismatch during server-side verification.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Check amount and currency
        $expectedCents = ChapaService::convertToMinorUnits($payment->amount);
        $receivedCents = (int) ($verification['amount_in_cents'] ?? 0);
        $receivedCurrency = strtoupper((string) ($verification['currency'] ?? ''));

        if ($expectedCents !== $receivedCents || $receivedCurrency !== 'ETB') {
            Log::warning('Chapa webhook amount or currency mismatch during verification', [
                'expected_cents' => $expectedCents,
                'received_cents' => $receivedCents,
                'received_currency' => $receivedCurrency,
            ]);

            DB::transaction(function () use ($transaction, $payment, $verification) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => array_merge($verification['raw'] ?? [], ['error' => 'Amount or currency mismatch']),
                ]);
                $payment->update(['status' => 'failed']);
            });

            return response()->json([
                'status' => 'error',
                'message' => 'Payment amount or currency mismatch during verification.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // 6. Handle verified payment status
        if ($verification['status'] === 'success' && $verification['is_paid']) {
            $now = now();
            $activatedSub = null;
            DB::transaction(function () use ($transaction, $payment, $verification, $now, &$activatedSub) {
                $transaction->update([
                    'gateway_reference' => $verification['chapa_reference'] ?: $transaction->gateway_reference,
                    'status' => 'successful',
                    'verified_at' => $now,
                    'gateway_response' => $verification['raw'],
                ]);

                $paymentUpdates = [
                    'status' => 'completed',
                    'paid_at' => $now,
                ];
                if (empty($payment->receipt_number)) {
                    $paymentUpdates['receipt_number'] = Payment::generateNextReceiptNumber();
                }
                $payment->update($paymentUpdates);

                // Phase 3: Activate subscription upon successful verification
                $activatedSub = $this->activateSubscriptionForPayment($payment, $transaction);
            });

            // Automatically dispatch membership documents (Card + Receipt PDFs) via queue
            $payment->loadMissing(['user.memberProfile', 'payable.plan']);
            event(new MembershipActivated($payment, $activatedSub));

            return response()->json([
                'status' => 'success',
                'message' => 'Webhook verified successfully. Payment completed and subscription activated.',
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'gateway_reference' => $transaction->gateway_reference,
                    'status' => 'completed',
                    'is_paid' => true,
                ],
            ], Response::HTTP_OK);
        }

        // If status is failed or pending
        $transaction->update([
            'status' => $verification['status'] === 'pending' ? 'pending' : 'failed',
            'gateway_response' => $verification['raw'],
        ]);

        if ($verification['status'] !== 'pending') {
            $payment->update(['status' => 'failed']);
        }

        return response()->json([
            'status' => $verification['status'],
            'message' => "Webhook processed with status: {$verification['status']}",
        ], Response::HTTP_OK);
    }

    /**
     * Handle browser or gateway return callback.
     *
     * Endpoint: GET|POST /api/payments/chapa/callback
     *
     * Note: This is a browser/gateway return redirect, NOT a signed machine-to-machine webhook.
     * It does NOT require an HMAC signature header, but it NEVER trusts query/post parameters
     * as proof of payment. It always initiates authoritative server-side verification with Chapa API.
     */
    public function handleCallback(Request $request): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        // 1. Resolve GymCore merchant reference from query params (GET) or request body (POST)
        $merchantReference = trim((string) (
            $request->input('merchant_reference')
            ?: $request->input('reference')
            ?: $request->input('trx_ref')
            ?: $request->input('tx_ref')
            ?: $request->query('merchant_reference')
            ?: $request->query('reference')
            ?: $request->query('trx_ref')
            ?: $request->query('tx_ref')
        ));

        if (empty($merchantReference)) {
            Log::warning('Chapa callback received without reference');

            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Merchant reference is required for payment callback.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            return redirect()->to(rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/?payment=chapa&status=failed&error=missing_reference');
        }

        // 2. Locate local transaction and payment
        $transaction = PaymentTransaction::with(['payment.payable', 'payment.user'])
            ->where('transaction_reference', $merchantReference)
            ->first();

        if (! $transaction) {
            $transaction = PaymentTransaction::with(['payment.payable', 'payment.user'])
                ->where('gateway_reference', $merchantReference)
                ->first();
        }

        if (! $transaction || ! $transaction->payment) {
            Log::warning('Chapa callback transaction not found', ['reference' => $merchantReference]);

            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Payment transaction not found for reference: {$merchantReference}",
                ], Response::HTTP_NOT_FOUND);
            }

            return redirect()->to(rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . "/?payment=chapa&merchant_reference={$merchantReference}&status=not_found");
        }

        $payment = $transaction->payment;

        // 3. Idempotency Check: If already completed, ensure subscription is active and return
        if ($payment->status === 'completed' && $transaction->status === 'successful') {
            if ($payment->payable_type === Subscription::class && $payment->payable_id) {
                $sub = Subscription::find($payment->payable_id);
                if ($sub && $sub->status === 'pending') {
                    $this->activateSubscriptionForPayment($payment, $transaction);
                }
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Payment has already been verified and completed.',
                    'data' => [
                        'merchant_reference' => $transaction->transaction_reference,
                        'gateway_reference' => $transaction->gateway_reference,
                        'status' => 'completed',
                        'is_paid' => true,
                        'already_completed' => true,
                    ],
                ]);
            }

            return redirect()->to(rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . "/?payment=chapa&merchant_reference={$transaction->transaction_reference}&status=completed");
        }

        // 4. Critical: Perform server-side payment verification with Chapa gateway
        // Never trust browser callback parameters as proof of payment
        $chapaReference = ! empty($transaction->gateway_reference)
            ? $transaction->gateway_reference
            : $transaction->transaction_reference;

        try {
            $verification = $this->chapaService->verifyPayment($chapaReference);
        } catch (ChapaException $e) {
            Log::error('Chapa callback server-side verification failed', [
                'merchant_reference' => $transaction->transaction_reference,
                'error' => $e->getMessage(),
            ]);

            DB::transaction(function () use ($transaction, $payment, $e) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => $e->getResponseBody() ?? ['error' => $e->getMessage()],
                ]);
                $payment->update(['status' => 'failed']);
            });

            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to verify payment with Chapa: ' . $e->getMessage(),
                    'data' => [
                        'merchant_reference' => $transaction->transaction_reference,
                        'status' => 'failed',
                    ],
                ], Response::HTTP_BAD_GATEWAY);
            }

            return redirect()->to(rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . "/?payment=chapa&merchant_reference={$transaction->transaction_reference}&status=failed");
        }

        // Check reference, amount, and currency
        $gatewayMerchantRef = trim((string) ($verification['merchant_reference'] ?? ''));
        $expectedCents = ChapaService::convertToMinorUnits($payment->amount);
        $receivedCents = (int) ($verification['amount_in_cents'] ?? 0);
        $receivedCurrency = strtoupper((string) ($verification['currency'] ?? ''));

        if (
            empty($gatewayMerchantRef)
            || $gatewayMerchantRef !== $transaction->transaction_reference
            || $expectedCents !== $receivedCents
            || $receivedCurrency !== 'ETB'
        ) {
            DB::transaction(function () use ($transaction, $payment, $verification) {
                $transaction->update([
                    'status' => 'failed',
                    'gateway_response' => array_merge($verification['raw'] ?? [], ['error' => 'Verification validation failed']),
                ]);
                $payment->update(['status' => 'failed']);
            });

            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment validation failed during callback verification.',
                    'data' => [
                        'merchant_reference' => $transaction->transaction_reference,
                        'status' => 'failed',
                    ],
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            return redirect()->to(rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . "/?payment=chapa&merchant_reference={$transaction->transaction_reference}&status=failed");
        }

        // 5. Update payment and activate membership upon confirmed success
        if ($verification['status'] === 'success' && $verification['is_paid']) {
            $now = now();
            $activatedSub = null;
            DB::transaction(function () use ($transaction, $payment, $verification, $now, &$activatedSub) {
                $transaction->update([
                    'gateway_reference' => $verification['chapa_reference'] ?: $transaction->gateway_reference,
                    'status' => 'successful',
                    'verified_at' => $now,
                    'gateway_response' => $verification['raw'],
                ]);

                $paymentUpdates = [
                    'status' => 'completed',
                    'paid_at' => $now,
                ];
                if (empty($payment->receipt_number)) {
                    $paymentUpdates['receipt_number'] = Payment::generateNextReceiptNumber();
                }
                $payment->update($paymentUpdates);

                $activatedSub = $this->activateSubscriptionForPayment($payment, $transaction);
            });

            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Payment verified successfully and membership activated.',
                    'data' => [
                        'merchant_reference' => $transaction->transaction_reference,
                        'gateway_reference' => $transaction->gateway_reference,
                        'subscription_id' => $payment->payable_id,
                        'subscription_status' => $activatedSub?->status ?? 'active',
                        'status' => 'completed',
                        'is_paid' => true,
                        'amount' => (float) $payment->amount,
                        'currency' => $payment->currency,
                    ],
                ]);
            }

            return redirect()->to(rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . "/?payment=chapa&merchant_reference={$transaction->transaction_reference}&status=completed");
        }

        // Pending or failed on gateway
        $transaction->update([
            'status' => $verification['status'] === 'pending' ? 'pending' : 'failed',
            'gateway_response' => $verification['raw'],
        ]);
        if ($verification['status'] !== 'pending') {
            $payment->update(['status' => 'failed']);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'status' => $verification['status'],
                'message' => "Payment callback processed with status: {$verification['status']}",
                'data' => [
                    'merchant_reference' => $transaction->transaction_reference,
                    'status' => $verification['status'],
                ],
            ]);
        }

        return redirect()->to(rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . "/?payment=chapa&merchant_reference={$transaction->transaction_reference}&status={$verification['status']}");
    }

    /**
     * Backward-compatible alias for Chapa callback.
     */
    public function chapaCallback(Request $request): JsonResponse|\Illuminate\Http\RedirectResponse
    {
        return $this->handleCallback($request);
    }

    /**
     * Phase 3: Activate the associated pending subscription for a confirmed successful payment.
     *
     * Rules:
     * - Only a confirmed successful payment can activate the associated pending subscription.
     * - Verify amount, currency, member, plan, and payment/subscription relationship.
     * - Activate the subscription exactly once (idempotent).
     * - Set correct start and end dates using the membership plan duration logic.
     * - Ensure member status is active and QR membership pass token is available.
     * - Record audit log.
     */
    protected function activateSubscriptionForPayment(Payment $payment, PaymentTransaction $transaction): ?Subscription
    {
        // 1. Guard: Only confirmed completed payments and successful transactions can activate
        if ($payment->status !== 'completed' || $transaction->status !== 'successful') {
            Log::warning('Subscription activation aborted: payment is not completed or transaction not successful', [
                'payment_id' => $payment->id,
                'payment_status' => $payment->status,
                'transaction_status' => $transaction->status,
            ]);

            return null;
        }

        // 2. Relationship Check: Must be linked to a Subscription
        if ($payment->payable_type !== Subscription::class || empty($payment->payable_id)) {
            return null;
        }

        $subscription = Subscription::with(['plan', 'member.memberProfile'])->find($payment->payable_id);
        if (! $subscription) {
            Log::warning('Subscription activation aborted: Subscription record not found', [
                'payable_id' => $payment->payable_id,
                'payment_id' => $payment->id,
            ]);

            return null;
        }

        // 3. Member & Plan Verification
        if ((int) $subscription->member_id !== (int) $payment->user_id) {
            Log::warning('Subscription activation aborted: Member mismatch between payment and subscription', [
                'payment_user_id' => $payment->user_id,
                'subscription_member_id' => $subscription->member_id,
            ]);

            return null;
        }

        // 4. Amount and Currency Consistency
        $expectedCents = ChapaService::convertToMinorUnits($subscription->total_amount);
        $paidCents = ChapaService::convertToMinorUnits($payment->amount);
        if ($expectedCents !== $paidCents || strtoupper($payment->currency) !== 'ETB') {
            Log::warning('Subscription activation aborted: Amount or currency mismatch', [
                'subscription_amount' => $subscription->total_amount,
                'payment_amount' => $payment->amount,
                'currency' => $payment->currency,
            ]);

            return null;
        }

        // 5. Idempotency: Activate exactly once
        if ($subscription->status === 'active') {
            Log::info('Subscription is already active, skipping re-activation', [
                'subscription_id' => $subscription->id,
                'subscription_number' => $subscription->subscription_number,
            ]);

            return $subscription;
        }

        // 6. Calculate correct start and end dates using membership plan duration logic
        $plan = $subscription->plan;
        $startDate = Carbon::today();
        // If start_date was specified in the future, honor it; otherwise start from today
        if ($subscription->start_date && Carbon::parse($subscription->start_date)->isFuture()) {
            $startDate = Carbon::parse($subscription->start_date);
        }
        $endDate = $plan ? $plan->calculateEndDate($startDate) : $startDate->copy()->addMonth()->subDay();

        $subscription->update([
            'status' => 'active',
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
        ]);

        // 7. Ensure member user status is active and QR membership pass token is available
        $member = $subscription->member;
        if ($member) {
            if ($member->status !== 'active') {
                $member->update(['status' => 'active']);
            }

            if ($member->memberProfile) {
                if (empty($member->memberProfile->qr_code_token)) {
                    $member->memberProfile->update([
                        'qr_code_token' => 'QR-' . strtoupper(Str::random(16)),
                    ]);
                }
            }
        }

        // 8. Audit Logging
        AuditLogger::log(
            action: 'subscription.activated',
            auditable: $subscription,
            newValues: [
                'subscription_number' => $subscription->subscription_number,
                'member_id' => $subscription->member_id,
                'plan_name' => $plan?->name,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'status' => 'active',
                'payment_id' => $payment->id,
                'transaction_reference' => $transaction->transaction_reference,
            ],
            notes: "Subscription {$subscription->subscription_number} activated for member {$member?->name} upon verified payment {$payment->payment_number}"
        );

        return $subscription;
    }

    /**
     * Send or resend payment receipt to member registered email.
     */
    public function sendReceiptEmail(Payment $payment): JsonResponse
    {
        $this->authorize('view', $payment);

        $payment->load(['user.memberProfile', 'payable.plan']);
        $user = $payment->user;
        if (! $user || empty($user->email) || str_ends_with($user->email, '@members.tigatgym.com')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Member does not have a valid personal email address registered.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $sent = GymMailService::sendPaymentReceipt($payment);

        if ($sent) {
            return response()->json([
                'status' => 'success',
                'message' => "Payment receipt #{$payment->receipt_number} emailed successfully to {$user->email}.",
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Could not send receipt email. Please check server email/SMTP configuration.',
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
}
