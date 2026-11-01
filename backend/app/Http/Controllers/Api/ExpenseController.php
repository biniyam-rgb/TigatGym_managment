<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\AuditLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ExpenseController extends Controller
{
    /**
     * Display a listing of gym operating expenses.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Expense::class);

        $query = Expense::with(['recordedBy', 'approvedBy']);

        // Filter by category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by payment method
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        // Search by title, recipient, or expense number
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('expense_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('recipient', 'like', "%{$search}%");
            });
        }

        $perPage = $request->integer('per_page', 15);
        $expenses = $query->orderByDesc('expense_date')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => ExpenseResource::collection($expenses),
            'meta' => [
                'current_page' => $expenses->currentPage(),
                'last_page' => $expenses->lastPage(),
                'per_page' => $expenses->perPage(),
                'total' => $expenses->total(),
            ],
        ]);
    }

    /**
     * Financial expense summary metrics.
     */
    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Expense::class);

        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        $totalPaidExpenses = Expense::whereIn('status', ['paid', 'approved'])->sum('amount');
        $monthPaidExpenses = Expense::whereIn('status', ['paid', 'approved'])->where('expense_date', '>=', $startOfMonth)->sum('amount');
        $pendingExpenses = Expense::where('status', 'pending')->sum('amount');

        $byCategory = Expense::whereIn('status', ['paid', 'approved'])
            ->select('category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->get()
            ->keyBy('category');

        return response()->json([
            'status' => 'success',
            'data' => [
                'currency' => 'ETB',
                'total_expenses' => (float) $totalPaidExpenses,
                'month_expenses' => (float) $monthPaidExpenses,
                'pending_expenses' => (float) $pendingExpenses,
                'by_category' => $byCategory,
            ],
        ]);
    }

    /**
     * Record a new gym expenditure.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Expense::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'in:rent,utilities,equipment,maintenance,salary,marketing,cleaning,supplies,tax,other'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'string', 'in:cash,bank_transfer,check,card,other'],
            'expense_date' => ['required', 'date'],
            'recipient' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $currentUser = $request->user();
        $isExecutive = $currentUser->hasAnyRole('owner', 'admin');
        $status = $isExecutive ? 'paid' : 'pending';
        $approvedBy = $isExecutive ? $currentUser->id : null;

        $expense = DB::transaction(function () use ($validated, $currentUser, $status, $approvedBy) {
            $expenseNumber = Expense::generateNextExpenseNumber();

            $exp = Expense::create([
                'expense_number' => $expenseNumber,
                'category' => $validated['category'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'amount' => $validated['amount'],
                'currency' => 'ETB',
                'payment_method' => $validated['payment_method'],
                'expense_date' => $validated['expense_date'],
                'recipient' => $validated['recipient'] ?? null,
                'recorded_by' => $currentUser->id,
                'approved_by' => $approvedBy,
                'status' => $status,
            ]);

            AuditLogger::log(
                action: 'expense.recorded',
                auditable: $exp,
                newValues: [
                    'expense_number' => $exp->expense_number,
                    'title' => $exp->title,
                    'amount' => $exp->amount,
                    'category' => $exp->category,
                    'status' => $exp->status,
                ],
                notes: "Recorded expense {$exp->expense_number} ({$exp->title}) of {$exp->amount} ETB"
            );

            return $exp;
        });

        $expense->load(['recordedBy', 'approvedBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Expense {$expense->expense_number} recorded successfully.",
            'data' => new ExpenseResource($expense),
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified expense.
     */
    public function show(Expense $expense): JsonResponse
    {
        $this->authorize('view', $expense);

        $expense->load(['recordedBy', 'approvedBy']);

        return response()->json([
            'status' => 'success',
            'data' => new ExpenseResource($expense),
        ]);
    }

    /**
     * Update the specified expense.
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('update', $expense);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'category' => ['sometimes', 'required', 'string', 'in:rent,utilities,equipment,maintenance,salary,marketing,cleaning,supplies,tax,other'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'payment_method' => ['sometimes', 'required', 'string', 'in:cash,bank_transfer,check,card,other'],
            'expense_date' => ['sometimes', 'required', 'date'],
            'recipient' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldValues = $expense->only(['title', 'category', 'amount', 'payment_method', 'expense_date', 'recipient']);
        $expense->update($validated);

        AuditLogger::log(
            action: 'expense.updated',
            auditable: $expense,
            oldValues: $oldValues,
            newValues: $expense->only(array_keys($validated)),
            notes: "Updated expense {$expense->expense_number}"
        );

        $expense->load(['recordedBy', 'approvedBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Expense {$expense->expense_number} updated successfully.",
            'data' => new ExpenseResource($expense),
        ]);
    }

    /**
     * Approve a pending expense (Owner / Admin).
     */
    public function approve(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('approve', $expense);

        $oldStatus = $expense->status;
        $expense->update([
            'status' => 'paid',
            'approved_by' => $request->user()->id,
        ]);

        AuditLogger::log(
            action: 'expense.approved',
            auditable: $expense,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => 'paid', 'approved_by' => $request->user()->id],
            notes: "Approved expense {$expense->expense_number} ({$expense->amount} ETB)"
        );

        $expense->load(['recordedBy', 'approvedBy']);

        return response()->json([
            'status' => 'success',
            'message' => "Expense {$expense->expense_number} approved and marked paid.",
            'data' => new ExpenseResource($expense),
        ]);
    }

    /**
     * Soft delete an expense (Owner only).
     */
    public function destroy(Expense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);

        $expenseNumber = $expense->expense_number;
        $expenseAmount = $expense->amount;

        $expense->delete();

        AuditLogger::log(
            action: 'expense.deleted',
            auditable: $expense,
            notes: "Deleted expense {$expenseNumber} ({$expenseAmount} ETB)"
        );

        return response()->json([
            'status' => 'success',
            'message' => "Expense {$expenseNumber} deleted successfully.",
        ]);
    }
}
