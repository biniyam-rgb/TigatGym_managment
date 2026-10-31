import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import BrandLogo from './BrandLogo';
import QRCodeDisplay from './QRCodeDisplay';

export default function PaymentLedger() {
  const { user, hasRole } = useAuth();
  const isStaff = hasRole('owner') || hasRole('admin') || hasRole('receptionist');
  const isOwnerOrAdmin = hasRole('owner') || hasRole('admin');
  const isOwner = hasRole('owner');

  // Main active tab: 'payments' | 'expenses'
  const [activeTab, setActiveTab] = useState('payments');

  // Payments State
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsMeta, setPaymentsMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Summary State
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [expenseSummary, setExpenseSummary] = useState(null);

  // Expenses State
  const [expenses, setExpenses] = useState([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [expensesSearch, setExpensesSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('');
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesMeta, setExpensesMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Members list for recording payments
  const [membersList, setMembersList] = useState([]);

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    user_id: '',
    amount: '',
    payment_method: 'cash',
    payment_type: 'subscription',
    subscription_id: '',
    status: 'completed',
    bank_name: 'Commercial Bank of Ethiopia (CBE)',
    gateway_reference: '',
    bank_account_number: '',
    notes: '',
  });

  // Refund Form
  const [refundForm, setRefundForm] = useState({
    reason: '',
  });

  // Expense Form
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'utilities',
    amount: '',
    payment_method: 'cash',
    expense_date: new Date().toISOString().split('T')[0],
    recipient: '',
    description: '',
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch Payment Summary
  const fetchPaymentSummary = useCallback(async () => {
    try {
      const res = await apiClient.getPaymentSummary();
      setPaymentSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch payment summary:', err);
    }
  }, []);

  // Fetch Expense Summary
  const fetchExpenseSummary = useCallback(async () => {
    if (!isStaff) return;
    try {
      const res = await apiClient.getExpenseSummary();
      setExpenseSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch expense summary:', err);
    }
  }, [isStaff]);

  // Fetch Payments List
  const fetchPayments = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const params = {
        page: paymentsPage,
        per_page: 15,
      };
      if (paymentsSearch.trim()) params.search = paymentsSearch.trim();
      if (paymentStatusFilter) params.status = paymentStatusFilter;
      if (paymentMethodFilter) params.payment_method = paymentMethodFilter;
      if (paymentTypeFilter) params.payment_type = paymentTypeFilter;

      const res = await apiClient.getPayments(params);
      setPayments(res.data || []);
      if (res.meta) setPaymentsMeta(res.meta);
    } catch (err) {
      showNotification('error', err.message || 'Failed to load payments ledger');
    } finally {
      setIsLoadingPayments(false);
    }
  }, [paymentsPage, paymentsSearch, paymentStatusFilter, paymentMethodFilter, paymentTypeFilter]);

  // Fetch Expenses List
  const fetchExpenses = useCallback(async () => {
    if (!isStaff) return;
    setIsLoadingExpenses(true);
    try {
      const params = {
        page: expensesPage,
        per_page: 15,
      };
      if (expensesSearch.trim()) params.search = expensesSearch.trim();
      if (expenseCategoryFilter) params.category = expenseCategoryFilter;
      if (expenseStatusFilter) params.status = expenseStatusFilter;

      const res = await apiClient.getExpenses(params);
      setExpenses(res.data || []);
      if (res.meta) setExpensesMeta(res.meta);
    } catch (err) {
      showNotification('error', err.message || 'Failed to load expenses ledger');
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [isStaff, expensesPage, expensesSearch, expenseCategoryFilter, expenseStatusFilter]);

  // Initial data loading using async promises to avoid synchronous cascading renders
  useEffect(() => {
    let ignore = false;

    const paymentParams = {
      page: paymentsPage,
      per_page: 15,
    };
    if (paymentsSearch.trim()) paymentParams.search = paymentsSearch.trim();
    if (paymentStatusFilter) paymentParams.status = paymentStatusFilter;
    if (paymentMethodFilter) paymentParams.payment_method = paymentMethodFilter;
    if (paymentTypeFilter) paymentParams.payment_type = paymentTypeFilter;

    apiClient.getPayments(paymentParams)
      .then(res => {
        if (!ignore && res) {
          setPayments(res.data || []);
          if (res.meta) setPaymentsMeta(res.meta);
          setIsLoadingPayments(false);
        }
      })
      .catch(err => {
        if (!ignore) {
          showNotification('error', err.message || 'Failed to load payments ledger');
          setIsLoadingPayments(false);
        }
      });

    apiClient.getPaymentSummary()
      .then(res => {
        if (!ignore && res?.data) {
          setPaymentSummary(res.data);
        }
      })
      .catch(err => console.error('Failed to load payment summary:', err));

    if (isStaff) {
      const expenseParams = {
        page: expensesPage,
        per_page: 15,
      };
      if (expensesSearch.trim()) expenseParams.search = expensesSearch.trim();
      if (expenseCategoryFilter) expenseParams.category = expenseCategoryFilter;
      if (expenseStatusFilter) expenseParams.status = expenseStatusFilter;

      apiClient.getExpenses(expenseParams)
        .then(res => {
          if (!ignore && res) {
            setExpenses(res.data || []);
            if (res.meta) setExpensesMeta(res.meta);
            setIsLoadingExpenses(false);
          }
        })
        .catch(err => {
          if (!ignore) {
            showNotification('error', err.message || 'Failed to load expenses');
            setIsLoadingExpenses(false);
          }
        });

      apiClient.getExpenseSummary()
        .then(res => {
          if (!ignore && res?.data) {
            setExpenseSummary(res.data);
          }
        })
        .catch(err => console.error('Failed to load expense summary:', err));

      apiClient.getMembers({ per_page: 100 })
        .then(res => {
          if (!ignore && res?.data) {
            setMembersList(res.data || []);
          }
        })
        .catch(err => console.error('Failed to load members for payments:', err));
    }

    return () => {
      ignore = true;
    };
  }, [
    paymentsPage, paymentsSearch, paymentStatusFilter, paymentMethodFilter, paymentTypeFilter,
    expensesPage, expensesSearch, expenseCategoryFilter, expenseStatusFilter,
    isStaff
  ]);

  // Format currency in ETB
  const formatETB = (amount) => {
    const val = Number(amount) || 0;
    return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
  };

  // Open Record Payment Modal
  const handleOpenRecordPayment = () => {
    setFormErrors({});
    setPaymentForm({
      user_id: '',
      amount: '',
      payment_method: 'cash',
      payment_type: 'subscription',
      subscription_id: '',
      status: 'completed',
      bank_name: 'Commercial Bank of Ethiopia (CBE)',
      gateway_reference: '',
      bank_account_number: '',
      notes: '',
    });
    setIsRecordPaymentOpen(true);
  };

  // Member selection handler in Record Payment
  const handleMemberSelect = (memberId) => {
    setPaymentForm(prev => ({
      ...prev,
      user_id: memberId,
    }));
  };

  // Submit Payment
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        user_id: Number(paymentForm.user_id),
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_type: paymentForm.payment_type,
        status: paymentForm.status,
        notes: paymentForm.notes.trim() || undefined,
      };

      if (['bank_slip', 'bank_transfer', 'pos'].includes(paymentForm.payment_method)) {
        if (paymentForm.gateway_reference) payload.gateway_reference = paymentForm.gateway_reference.trim();
        if (paymentForm.bank_name) payload.bank_name = paymentForm.bank_name.trim();
        if (paymentForm.bank_account_number) payload.bank_account_number = paymentForm.bank_account_number.trim();
      }

      const res = await apiClient.createPayment(payload);
      showNotification('success', res.message || 'Payment recorded and official receipt generated!');
      setIsRecordPaymentOpen(false);
      fetchPayments();
      fetchPaymentSummary();

      // Automatically open receipt view for immediate printing
      if (res.data) {
        setSelectedPayment(res.data);
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      showNotification('error', err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = (payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  // Open Refund Modal
  const handleOpenRefund = (payment) => {
    setSelectedPayment(payment);
    setRefundForm({ reason: '' });
    setFormErrors({});
    setIsRefundModalOpen(true);
  };

  // Submit Refund
  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const res = await apiClient.refundPayment(selectedPayment.id, {
        reason: refundForm.reason.trim(),
      });
      showNotification('success', res.message || `Payment ${selectedPayment.receipt_number} refunded.`);
      setIsRefundModalOpen(false);
      fetchPayments();
      fetchPaymentSummary();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      showNotification('error', err.message || 'Failed to refund payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Record Expense Modal
  const handleOpenRecordExpense = () => {
    setFormErrors({});
    setExpenseForm({
      title: '',
      category: 'utilities',
      amount: '',
      payment_method: 'cash',
      expense_date: new Date().toISOString().split('T')[0],
      recipient: '',
      description: '',
    });
    setIsRecordExpenseOpen(true);
  };

  // Submit Expense
  const handleRecordExpenseSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        ...expenseForm,
        amount: Number(expenseForm.amount),
      };
      const res = await apiClient.createExpense(payload);
      showNotification('success', res.message || 'Operating expense recorded successfully.');
      setIsRecordExpenseOpen(false);
      fetchExpenses();
      fetchExpenseSummary();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      }
      showNotification('error', err.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve Expense
  const handleApproveExpense = async (expense) => {
    try {
      const res = await apiClient.approveExpense(expense.id);
      showNotification('success', res.message || `Expense ${expense.expense_number} approved and marked paid.`);
      fetchExpenses();
      fetchExpenseSummary();
    } catch (err) {
      showNotification('error', err.message || 'Failed to approve expense');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Are you sure you want to delete expense ${expense.expense_number} (${expense.title})?`)) {
      return;
    }
    try {
      const res = await apiClient.deleteExpense(expense.id);
      showNotification('success', res.message || 'Expense deleted successfully.');
      fetchExpenses();
      fetchExpenseSummary();
    } catch (err) {
      showNotification('error', err.message || 'Failed to delete expense');
    }
  };

  // Print Receipt Action
  const handlePrintReceipt = () => {
    window.print();
  };

  // Compute Net Operating Balance (Revenue - Expenses)
  const netOperatingBalance = useMemo(() => {
    const rev = paymentSummary?.total_revenue || 0;
    const exp = expenseSummary?.total_expenses || 0;
    return rev - exp;
  }, [paymentSummary, expenseSummary]);

  return (
    <div className="payment-ledger-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type === 'error' ? 'toast-error' : 'toast-success'}`} style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: 8,
          background: notification.type === 'error' ? '#ef4444' : '#22c55e',
          color: '#fff',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {notification.message}
        </div>
      )}

      {/* Top Level Financial KPIs */}
      <div className="financial-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Total Collected Revenue */}
        <div className="dashboard-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Revenue (ETB)
            </span>
            <span style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              💰
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.02em' }}>
            {paymentSummary ? formatETB(paymentSummary.total_revenue) : '...'}
          </div>
          <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>●</span> {paymentSummary?.completed_count || 0} completed receipts
          </div>
        </div>

        {/* Today's Collections */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Today's Collections
            </span>
            <span style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 138, 0, 0.15)',
              color: '#ff8a00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              📅
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ff8a00', letterSpacing: '-0.02em' }}>
            {paymentSummary ? formatETB(paymentSummary.today_revenue) : '...'}
          </div>
          <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>
            Daily desk turnover (ETB)
          </div>
        </div>

        {/* This Month's Revenue */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Monthly Revenue
            </span>
            <span style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              📈
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.02em' }}>
            {paymentSummary ? formatETB(paymentSummary.month_revenue) : '...'}
          </div>
          <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>
            Current billing cycle collections
          </div>
        </div>

        {/* Operating Expenses (Staff only) */}
        {isStaff && (
          <div className="dashboard-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Operating Expenses
              </span>
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                📉
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>
              {expenseSummary ? formatETB(expenseSummary.total_expenses) : '0.00 ETB'}
            </div>
            <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>
              Rent, utilities, gear & staff
            </div>
          </div>
        )}

        {/* Net Operating Balance */}
        {isStaff && (
          <div className="dashboard-card" style={{
            padding: 20,
            background: 'linear-gradient(135deg, #151a22 0%, #1e2633 100%)',
            border: '1px solid rgba(255, 138, 0, 0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ffb347', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Net Cash Balance
              </span>
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(255, 138, 0, 0.2)',
                color: '#ff8a00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                ⚖️
              </span>
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 800,
              color: netOperatingBalance >= 0 ? '#22c55e' : '#ef4444',
              letterSpacing: '-0.02em',
            }}>
              {formatETB(netOperatingBalance)}
            </div>
            <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>
              Total Revenue minus Total Expenses
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      {isStaff && (
        <div className="auth-mode-tabs" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            💳 Payments & Receipts Ledger
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            📉 Operating Expenditures ({expenses.length})
          </button>
        </div>
      )}

      {/* ==================== TAB 1: PAYMENTS LEDGER ==================== */}
      {activeTab === 'payments' && (
        <div className="dashboard-card" style={{ padding: 24 }}>
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
                Financial Transactions & Receipts
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: 13 }}>
                Audited ledger of all front-desk cash, mobile bank slip, POS, and online transactions.
              </p>
            </div>

            {isStaff && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenRecordPayment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  fontWeight: 700,
                }}
              >
                <span>+</span> Record Payment (ETB)
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
            background: '#0d1017',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #232936',
          }}>
            {/* Search Input */}
            <div style={{ gridColumn: 'span 2' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search receipt #, member name, phone, or bank ref..."
                value={paymentsSearch}
                onChange={(e) => {
                  setPaymentsSearch(e.target.value);
                  setPaymentsPage(1);
                }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="form-control"
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPaymentsPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed (Paid)</option>
                <option value="pending">Pending Verification</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                className="form-control"
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setPaymentsPage(1);
                }}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash (Desk Drawer)</option>
                <option value="bank_slip">Bank Transfer / CBE / Telebirr</option>
                <option value="pos">POS Machine (Card)</option>
                <option value="chapa">Chapa Gateway</option>
              </select>
            </div>

            {/* Payment Type Filter */}
            <div>
              <select
                className="form-control"
                value={paymentTypeFilter}
                onChange={(e) => {
                  setPaymentTypeFilter(e.target.value);
                  setPaymentsPage(1);
                }}
              >
                <option value="">All Purposes</option>
                <option value="subscription">Subscription Pass</option>
                <option value="registration">Registration Fee</option>
                <option value="trainer_fee">Personal Trainer</option>
                <option value="class_fee">Special Class</option>
                <option value="product">Water / Shake / Gear</option>
                <option value="other">Other / Misc</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          {isLoadingPayments ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#a1a1aa' }}>
              <span className="spinner" style={{ width: 28, height: 28, display: 'inline-block', marginBottom: 12 }}></span>
              <p>Loading transactions ledger from secure engine...</p>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#a1a1aa', background: '#0a0d13', borderRadius: 8 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
              <p style={{ fontWeight: 600, color: '#f5f5f5' }}>No payments found</p>
              <p style={{ fontSize: 13 }}>Try adjusting your search keywords or filter options.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="gymcore-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Receipt / Payment #</th>
                    <th>Member</th>
                    <th>Type</th>
                    <th>Payment Method</th>
                    <th>Amount (ETB)</th>
                    <th>Status</th>
                    <th>Date & Staff</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const isCompleted = p.status === 'completed';
                    const isRefunded = p.status === 'refunded';
                    const method = p.payment_method;

                    return (
                      <tr key={p.id}>
                        {/* Receipt & Payment Code */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#ff8a00', fontFamily: 'monospace' }}>
                            {p.receipt_number || p.payment_number}
                          </div>
                          {p.receipt_number && (
                            <div style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace' }}>
                              {p.payment_number}
                            </div>
                          )}
                        </td>

                        {/* Member */}
                        <td>
                          <div style={{ fontWeight: 600, color: '#f5f5f5' }}>
                            {p.member?.name || `Member #${p.user_id}`}
                          </div>
                          <div style={{ fontSize: 11, color: '#a1a1aa' }}>
                            {p.member?.member_code || p.member?.phone || ''}
                          </div>
                        </td>

                        {/* Payment Type */}
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#d4d4d8',
                            textTransform: 'capitalize',
                          }}>
                            {p.payment_type?.replace('_', ' ') || 'Subscription'}
                          </span>
                        </td>

                        {/* Method & Bank Slip reference */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              background: method === 'cash' ? 'rgba(34, 197, 94, 0.15)' :
                                          method === 'pos' ? 'rgba(168, 85, 247, 0.15)' :
                                          method === 'chapa' ? 'rgba(255, 138, 0, 0.15)' :
                                          'rgba(59, 130, 246, 0.15)',
                              color: method === 'cash' ? '#22c55e' :
                                     method === 'pos' ? '#c084fc' :
                                     method === 'chapa' ? '#ff8a00' :
                                     '#60a5fa',
                              textTransform: 'uppercase',
                            }}>
                              {method === 'bank_slip' || method === 'bank_transfer' ? 'BANK SLIP' : method}
                            </span>
                          </div>
                          {p.transactions?.[0]?.gateway_reference && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                              Ref: {p.transactions[0].gateway_reference}
                            </div>
                          )}
                          {p.transactions?.[0]?.bank_name && (
                            <div style={{ fontSize: 10, color: '#64748b' }}>
                              {p.transactions[0].bank_name}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td>
                          <div style={{ fontWeight: 800, color: isRefunded ? '#ef4444' : '#22c55e', fontSize: 14 }}>
                            {isRefunded && '-'}{formatETB(p.amount)}
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isCompleted ? 'rgba(34, 197, 94, 0.15)' :
                                        isRefunded ? 'rgba(239, 68, 68, 0.15)' :
                                        'rgba(245, 158, 11, 0.15)',
                            color: isCompleted ? '#22c55e' :
                                   isRefunded ? '#ef4444' :
                                   '#f59e0b',
                            textTransform: 'uppercase',
                          }}>
                            {p.status}
                          </span>
                        </td>

                        {/* Date & Recorded By */}
                        <td>
                          <div style={{ fontSize: 12, color: '#f5f5f5' }}>
                            {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: 11, color: '#a1a1aa' }}>
                            by {p.recorded_by?.name || 'Staff'}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {/* View / Print Receipt */}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenReceipt(p)}
                              title="View & Print Official Gym Receipt"
                              style={{ padding: '4px 8px', fontSize: 12 }}
                            >
                              Receipt
                            </button>

                            {/* Refund (Owner/Admin only) */}
                            {isOwnerOrAdmin && isCompleted && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleOpenRefund(p)}
                                title="Issue Audited Refund"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: 12,
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                }}
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {paymentsMeta.last_page > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <div style={{ fontSize: 13, color: '#a1a1aa' }}>
                Showing page {paymentsMeta.current_page} of {paymentsMeta.last_page} ({paymentsMeta.total} total receipts)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={paymentsPage <= 1}
                  onClick={() => setPaymentsPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={paymentsPage >= paymentsMeta.last_page}
                  onClick={() => setPaymentsPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: OPERATING EXPENSES ==================== */}
      {activeTab === 'expenses' && isStaff && (
        <div className="dashboard-card" style={{ padding: 24 }}>
          {/* Header Controls */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
                Gym Operating Expenditures & Outflows
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: 13 }}>
                Track facility overhead: Bole facility rent, utilities, equipment maintenance, and supplies.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenRecordExpense}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                fontWeight: 700,
              }}
            >
              <span>+</span> Record Operating Expense
            </button>
          </div>

          {/* Expense Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
            background: '#0d1017',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #232936',
          }}>
            <div style={{ gridColumn: 'span 2' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search expense #, title, or vendor recipient..."
                value={expensesSearch}
                onChange={(e) => {
                  setExpensesSearch(e.target.value);
                  setExpensesPage(1);
                }}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <select
                className="form-control"
                value={expenseCategoryFilter}
                onChange={(e) => {
                  setExpenseCategoryFilter(e.target.value);
                  setExpensesPage(1);
                }}
              >
                <option value="">All Categories</option>
                <option value="rent">Facility Rent</option>
                <option value="utilities">Utilities (Water, Power, Net)</option>
                <option value="equipment">Gym Equipment Purchase</option>
                <option value="maintenance">Maintenance & Repairs</option>
                <option value="salary">Staff Salaries / Coaching</option>
                <option value="cleaning">Sanitation & Cleaning</option>
                <option value="marketing">Marketing & Promotion</option>
                <option value="supplies">Gym Supplies</option>
                <option value="tax">Licensing & Taxes</option>
                <option value="other">Other Overhead</option>
              </select>
            </div>

            <div>
              <select
                className="form-control"
                value={expenseStatusFilter}
                onChange={(e) => {
                  setExpenseStatusFilter(e.target.value);
                  setExpensesPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid & Approved</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>

          {/* Expenses Table */}
          {isLoadingExpenses ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#a1a1aa' }}>
              <span className="spinner" style={{ width: 28, height: 28, display: 'inline-block', marginBottom: 12 }}></span>
              <p>Loading expenditures ledger...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#a1a1aa', background: '#0a0d13', borderRadius: 8 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
              <p style={{ fontWeight: 600, color: '#f5f5f5' }}>No operating expenses recorded yet</p>
              <p style={{ fontSize: 13 }}>Record outgoing gym expenses to maintain accurate net profit metrics.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="gymcore-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Expense #</th>
                    <th>Title & Description</th>
                    <th>Category</th>
                    <th>Recipient / Vendor</th>
                    <th>Amount (ETB)</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ffb347' }}>
                        {exp.expense_number}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f5f5f5' }}>{exp.title}</div>
                        {exp.description && (
                          <div style={{ fontSize: 12, color: '#a1a1aa', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {exp.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'rgba(255, 138, 0, 0.1)',
                          color: '#ff8a00',
                          textTransform: 'uppercase',
                        }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ color: '#d4d4d8', fontSize: 13 }}>
                        {exp.recipient || '—'}
                      </td>
                      <td style={{ fontWeight: 800, color: '#ef4444' }}>
                        {formatETB(exp.amount)}
                      </td>
                      <td style={{ fontSize: 12, color: '#a1a1aa' }}>
                        {exp.expense_date}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          background: exp.status === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: exp.status === 'paid' ? '#22c55e' : '#f59e0b',
                          textTransform: 'uppercase',
                        }}>
                          {exp.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {isOwnerOrAdmin && exp.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleApproveExpense(exp)}
                              style={{
                                padding: '4px 8px',
                                fontSize: 12,
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                              }}
                            >
                              Approve
                            </button>
                          )}
                          {isOwner && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleDeleteExpense(exp)}
                              style={{
                                padding: '4px 8px',
                                fontSize: 12,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expenses Pagination */}
          {expensesMeta.last_page > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <div style={{ fontSize: 13, color: '#a1a1aa' }}>
                Showing page {expensesMeta.current_page} of {expensesMeta.last_page} ({expensesMeta.total} total expenses)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={expensesPage <= 1}
                  onClick={() => setExpensesPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={expensesPage >= expensesMeta.last_page}
                  onClick={() => setExpensesPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL 1: RECORD PAYMENT ==================== */}
      {isRecordPaymentOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
                  Record Official Payment
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: 12 }}>
                  Issue branded Ethiopian Birr (ETB) receipt and update member balance.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsRecordPaymentOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit}>
              {/* Member Selection */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                  Select Member <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  className="form-control"
                  value={paymentForm.user_id}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  required
                >
                  <option value="">-- Choose registered member --</option>
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.member_code || `ID #${m.id}`}) — {m.phone || m.email}
                    </option>
                  ))}
                </select>
                {formErrors.user_id && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{formErrors.user_id[0]}</div>
                )}
              </div>

              {/* Payment Purpose / Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                    Payment Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={paymentForm.payment_type}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_type: e.target.value }))}
                    required
                  >
                    <option value="subscription">Membership Plan / Subscription</option>
                    <option value="registration">Registration / Card Fee</option>
                    <option value="trainer_fee">Personal Trainer Session</option>
                    <option value="class_fee">Special Class Fee</option>
                    <option value="product">Water / Shake / Merchandise</option>
                    <option value="other">Other / Miscellaneous</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                    Amount (ETB) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control"
                    placeholder="e.g. 3000.00"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                  {formErrors.amount && (
                    <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{formErrors.amount[0]}</div>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                  Payment Method <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {[
                    { id: 'cash', label: 'Cash (Desk Drawer)', icon: '💵' },
                    { id: 'bank_slip', label: 'CBE / Telebirr Slip', icon: '🏦' },
                    { id: 'pos', label: 'POS Terminal (Card)', icon: '💳' },
                    { id: 'chapa', label: 'Chapa Gateway', icon: '⚡' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: paymentForm.payment_method === m.id ? 'rgba(255, 138, 0, 0.15)' : '#0d1017',
                        border: paymentForm.payment_method === m.id ? '1px solid #ff8a00' : '1px solid #232936',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        color: paymentForm.payment_method === m.id ? '#ff8a00' : '#d4d4d8',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={m.id}
                        checked={paymentForm.payment_method === m.id}
                        onChange={() => setPaymentForm(prev => ({ ...prev, payment_method: m.id }))}
                        style={{ display: 'none' }}
                      />
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional Bank Slip / POS Fields */}
              {['bank_slip', 'bank_transfer', 'pos'].includes(paymentForm.payment_method) && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 10 }}>
                    Bank Slip / Electronic Reference Verification
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>
                        Bank / Service Provider
                      </label>
                      <select
                        className="form-control"
                        value={paymentForm.bank_name}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, bank_name: e.target.value }))}
                      >
                        <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                        <option value="Telebirr (Ethio Telecom)">Telebirr (Ethio Telecom)</option>
                        <option value="Awash Bank">Awash Bank</option>
                        <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                        <option value="Dashen Bank">Dashen Bank</option>
                        <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
                        <option value="Front Desk POS Terminal">Front Desk POS Terminal</option>
                        <option value="Other">Other Bank / Transfer</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>
                        Slip / Transaction Ref <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. CBE-FT-998877"
                        value={paymentForm.gateway_reference}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, gateway_reference: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Staff Notes */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                  Audit / Front-Desk Notes (Optional)
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Paid in full for 1-month VIP pass renewal."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !paymentForm.user_id || !paymentForm.amount}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  {isSubmitting && <span className="spinner" style={{ width: 14, height: 14 }}></span>}
                  <span>Issue Official Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: BRANDED PRINTABLE RECEIPT ==================== */}
      {isReceiptModalOpen && selectedPayment && (
        <div className="modal-backdrop">
          <div className="modal-card receipt-modal-card" style={{
            maxWidth: 500,
            background: '#0d1017',
            border: '1px solid #292e38',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}>
            {/* Receipt Modal Controls (Hidden in print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                Verified Official Receipt
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Container */}
            <div id="printable-receipt" style={{
              background: '#07090e',
              border: '1px dashed #292e38',
              borderRadius: 12,
              padding: 24,
              color: '#f5f5f5',
            }}>
              {/* Header Branding */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid #1f242d', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <BrandLogo variant="sidebar" size={80} showSubtext={false} />
                </div>
                <h4 style={{ margin: 0, color: '#f5f5f5', fontSize: 16, fontWeight: 800, letterSpacing: '0.05em' }}>
                  ትጋት ጂም • TIGAT GYM
                </h4>
                <div style={{ fontSize: 11, color: '#ff8a00', fontWeight: 700, letterSpacing: '0.1em', marginTop: 2 }}>
                  OFFICIAL PAYMENT RECEIPT
                </div>
                <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>
                  Bole Medhanialem Branch • Addis Ababa, Ethiopia
                </div>
              </div>

              {/* Receipt Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#a1a1aa' }}>Receipt Number:</div>
                  <div style={{ fontWeight: 800, color: '#ff8a00', fontFamily: 'monospace' }}>
                    {selectedPayment.receipt_number || selectedPayment.payment_number}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#a1a1aa' }}>Date & Time:</div>
                  <div style={{ fontWeight: 600 }}>
                    {selectedPayment.paid_at ? new Date(selectedPayment.paid_at).toLocaleString() : new Date(selectedPayment.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#a1a1aa' }}>Billed To:</div>
                  <div style={{ fontWeight: 700, color: '#f5f5f5' }}>
                    {selectedPayment.member?.name || 'Member'}
                  </div>
                  <div style={{ fontSize: 11, color: '#a1a1aa' }}>
                    Code: {selectedPayment.member?.member_code || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#a1a1aa' }}>Front Desk Officer:</div>
                  <div style={{ fontWeight: 600, color: '#d4d4d8' }}>
                    {selectedPayment.recorded_by?.name || user?.name || 'Reception Staff'}
                  </div>
                </div>
              </div>

              {/* Itemized Breakdown Table */}
              <div style={{ borderTop: '1px solid #1f242d', borderBottom: '1px solid #1f242d', padding: '12px 0', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                  <span>Description</span>
                  <span>Amount (ETB)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                  <span>
                    {selectedPayment.payable?.plan_name ||
                     (selectedPayment.payment_type ? selectedPayment.payment_type.replace('_', ' ').toUpperCase() : 'MEMBERSHIP ACCESS')}
                  </span>
                  <span>{formatETB(selectedPayment.amount)}</span>
                </div>
                {selectedPayment.notes && (
                  <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4, fontStyle: 'italic' }}>
                    "{selectedPayment.notes}"
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Paid
                  </div>
                  <div style={{ fontSize: 11, color: '#ff8a00', fontWeight: 600, textTransform: 'capitalize' }}>
                    Method: {selectedPayment.payment_method?.replace('_', ' ')}
                  </div>
                  {selectedPayment.transactions?.[0]?.gateway_reference && (
                    <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                      Txn Ref: {selectedPayment.transactions[0].gateway_reference}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>
                  {formatETB(selectedPayment.amount)}
                </div>
              </div>

              {/* QR Verification Matrix */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #1f242d', paddingTop: 16 }}>
                <div style={{ display: 'inline-block', background: '#fff', padding: 8, borderRadius: 8, marginBottom: 8 }}>
                  <QRCodeDisplay
                    value={`TIGAT-VERIFIED-RECEIPT:${selectedPayment.receipt_number}:${selectedPayment.amount}ETB`}
                    size={80}
                  />
                </div>
                <div style={{ fontSize: 10, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Security Token: {selectedPayment.payment_number}
                </div>
                <div style={{ fontSize: 11, color: '#ff8a00', fontWeight: 600, marginTop: 4 }}>
                  Thank you for training with TIGAT GYM! 💪
                </div>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrintReceipt}
                style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
              >
                <span>🖨️</span> Print Official Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: REFUND CONFIRMATION ==================== */}
      {isRefundModalOpen && selectedPayment && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#ef4444', fontSize: 18, fontWeight: 700 }}>
                Issue Audited Refund
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsRefundModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
              fontSize: 13,
              color: '#fca5a5',
            }}>
              ⚠️ You are issuing a refund for Receipt <strong>{selectedPayment.receipt_number}</strong> of <strong>{formatETB(selectedPayment.amount)}</strong>.
              This action will reverse the transaction and record an immutable audit entry with the gym owner.
            </div>

            <form onSubmit={handleRefundSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                  Mandatory Refund Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explain why this refund is being granted (minimum 5 characters)..."
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ reason: e.target.value })}
                  required
                  minLength={5}
                />
                {formErrors.reason && (
                  <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{formErrors.reason[0]}</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRefundModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isSubmitting || refundForm.reason.trim().length < 5}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Audited Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: RECORD EXPENSE ==================== */}
      {isRecordExpenseOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
                  Record Gym Operating Expense
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: 12 }}>
                  Log facility expenditures (rent, utilities, gear repairs) for net accounting.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsRecordExpenseOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordExpenseSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                  Expense Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Monthly Backup Generator Fuel (Diesel)"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                    Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="rent">Facility Rent</option>
                    <option value="utilities">Utilities (Water, Power, Net)</option>
                    <option value="equipment">Gym Equipment Purchase</option>
                    <option value="maintenance">Maintenance & Repairs</option>
                    <option value="salary">Staff Salaries / Coaching</option>
                    <option value="cleaning">Sanitation & Cleaning</option>
                    <option value="marketing">Marketing & Promotion</option>
                    <option value="supplies">Gym Supplies</option>
                    <option value="tax">Licensing & Taxes</option>
                    <option value="other">Other Overhead</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                    Amount (ETB) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control"
                    placeholder="e.g. 1500.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                    Payment Method <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    required
                  >
                    <option value="cash">Petty Cash</option>
                    <option value="bank_transfer">Bank Transfer (CBE/Telebirr)</option>
                    <option value="check">Check</option>
                    <option value="card">Debit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                    Date of Expense <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={expenseForm.expense_date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                  Recipient / Vendor Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TotalEnergies Bole Medhanialem"
                  value={expenseForm.recipient}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, recipient: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                  Description / Notes
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Additional expense details..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRecordExpenseOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || !expenseForm.title || !expenseForm.amount}
                  style={{ fontWeight: 700 }}
                >
                  {isSubmitting ? 'Recording...' : 'Record Operating Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
