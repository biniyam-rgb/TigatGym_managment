<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendMembershipDocumentsJob;
use App\Models\MembershipDocumentDelivery;
use App\Services\GymPdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MembershipDocumentDeliveryController extends Controller
{
    /**
     * List membership document deliveries with filtering & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        $query = MembershipDocumentDelivery::with([
            'payment',
            'subscription.plan',
            'user.memberProfile',
        ]);

        // Members can only see their own deliveries; staff can see all
        if ($currentUser->hasRole('member') && ! $currentUser->hasAnyRole('owner', 'admin', 'receptionist')) {
            $query->where('user_id', $currentUser->id);
        } else {
            $this->authorize('viewAny', MembershipDocumentDelivery::class);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('payment_id')) {
            $query->where('payment_id', $request->payment_id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('recipient_email', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhereHas('memberProfile', function ($mpq) use ($search) {
                             $mpq->where('member_code', 'like', "%{$search}%");
                         });
                  })
                  ->orWhereHas('payment', function ($pq) use ($search) {
                      $pq->where('receipt_number', 'like', "%{$search}%")
                         ->orWhere('payment_number', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->integer('per_page', 15);
        $deliveries = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $deliveries->items(),
            'meta' => [
                'current_page' => $deliveries->currentPage(),
                'last_page' => $deliveries->lastPage(),
                'per_page' => $deliveries->perPage(),
                'total' => $deliveries->total(),
            ],
        ]);
    }

    /**
     * Get a specific document delivery details.
     */
    public function show(Request $request, MembershipDocumentDelivery $delivery): JsonResponse
    {
        $this->authorize('view', $delivery);

        $delivery->load([
            'payment.transactions',
            'subscription.plan',
            'user.memberProfile',
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $delivery,
        ]);
    }

    /**
     * Resend/retry document delivery to member (with optional updated email).
     */
    public function resend(Request $request, MembershipDocumentDelivery $delivery): JsonResponse
    {
        $this->authorize('resend', $delivery);

        $validated = $request->validate([
            'recipient_email' => 'nullable|email|max:255',
        ]);

        if (! empty($validated['recipient_email'])) {
            $newEmail = trim($validated['recipient_email']);
            $delivery->recipient_email = $newEmail;

            // Also keep user's profile email updated if desired
            if ($delivery->user && (empty($delivery->user->email) || str_ends_with($delivery->user->email, '@members.tigatgym.com'))) {
                $delivery->user->update(['email' => $newEmail]);
            }
        }

        $delivery->status = 'pending';
        $delivery->error_message = null;
        $delivery->save();

        // Dispatch queued document generation & email delivery
        SendMembershipDocumentsJob::dispatch($delivery);

        return response()->json([
            'status' => 'success',
            'message' => 'Membership documents queued for delivery.',
            'data' => $delivery->fresh(['payment', 'subscription.plan', 'user.memberProfile']),
        ]);
    }

    /**
     * Download the membership card PDF.
     */
    public function downloadCard(Request $request, MembershipDocumentDelivery $delivery)
    {
        $this->authorize('download', $delivery);

        $user = $delivery->user;
        $profile = $user?->memberProfile;
        $subscription = $delivery->subscription;

        $pdfBinary = GymPdfService::generateMembershipCardPdf($user, $profile, $subscription);

        $memberCode = $profile?->member_code ?? ("TG-" . str_pad((string) ($user?->id ?? 0), 4, '0', STR_PAD_LEFT));
        $safeMemberCode = preg_replace('/[^A-Za-z0-9_-]/', '', $memberCode);
        $filename = "TigatGym-Membership-Card-{$safeMemberCode}.pdf";

        return response($pdfBinary, Response::HTTP_OK, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Download the payment receipt PDF.
     */
    public function downloadReceipt(Request $request, MembershipDocumentDelivery $delivery)
    {
        $this->authorize('download', $delivery);

        $payment = $delivery->payment;
        $user = $delivery->user;
        $subscription = $delivery->subscription;

        $pdfBinary = GymPdfService::generatePaymentReceiptPdf($payment, $user, $subscription);

        $receiptNum = $payment->receipt_number ?: "PAY-{$payment->id}";
        $safeReceiptNum = preg_replace('/[^A-Za-z0-9_-]/', '', $receiptNum);
        $filename = "TigatGym-Payment-Receipt-{$safeReceiptNum}.pdf";

        return response($pdfBinary, Response::HTTP_OK, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
