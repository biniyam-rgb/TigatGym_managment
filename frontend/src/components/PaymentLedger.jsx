import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import useDebounce from '../hooks/useDebounce';
import BrandLogo from './BrandLogo';
import QRCodeDisplay from './QRCodeDisplay';

const Icons = {
  Search: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  CreditCard: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Calendar: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  TrendingUp: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  TrendingDown: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  Scale: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  ),
  Receipt: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  ),
};

export default function PaymentLedger({ initialTab = 'payments' }) {
  const { user, hasRole } = useAuth();
  const isStaff = hasRole('owner') || hasRole('admin') || hasRole('receptionist');
  const isOwnerOrAdmin = hasRole('owner') || hasRole('admin');
  const isOwner = hasRole('owner');

  // Main active tab: 'payments' | 'expenses'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setTimeout(() => {
        setActiveTab(initialTab);
      }, 0);
    }
  }, [initialTab]);

  // Payments State
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [paymentsSearch, setPaymentsSearch] = useState('');
  const debouncedPaymentsSearch = useDebounce(paymentsSearch, 250);
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
  const debouncedExpensesSearch = useDebounce(expensesSearch, 250);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState('');
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesMeta, setExpensesMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Members list for recording payments — removed (payments are recorded via Member Registration and Subscription Renewal)
  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [formErrors, setFormErrors] = useState({});

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
      if (debouncedPaymentsSearch.trim()) params.search = debouncedPaymentsSearch.trim();
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
  }, [paymentsPage, debouncedPaymentsSearch, paymentStatusFilter, paymentMethodFilter, paymentTypeFilter]);

  // Fetch Expenses List
  const fetchExpenses = useCallback(async () => {
    if (!isStaff) return;
    setIsLoadingExpenses(true);
    try {
      const params = {
        page: expensesPage,
        per_page: 15,
      };
      if (debouncedExpensesSearch.trim()) params.search = debouncedExpensesSearch.trim();
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
  }, [isStaff, expensesPage, debouncedExpensesSearch, expenseCategoryFilter, expenseStatusFilter]);

  // Initial reference & summary data loading once on mount
  useEffect(() => {
    let ignore = false;

    apiClient.getPaymentSummary()
      .then(res => {
        if (!ignore && res?.data) {
          setPaymentSummary(res.data);
        }
      })
      .catch(err => console.error('Failed to load payment summary:', err));

    if (isStaff) {
      apiClient.getExpenseSummary()
        .then(res => {
          if (!ignore && res?.data) {
            setExpenseSummary(res.data);
          }
        })
        .catch(err => console.error('Failed to load expense summary:', err));
    }

    return () => {
      ignore = true;
    };
  }, [isStaff]);

  // Payments data loading (triggered only on payment pagination/search/filters)
  useEffect(() => {
    let ignore = false;
    setTimeout(() => {
      if (!ignore) setIsLoadingPayments(true);
    }, 0);

    const paymentParams = {
      page: paymentsPage,
      per_page: 15,
    };
    if (debouncedPaymentsSearch.trim()) paymentParams.search = debouncedPaymentsSearch.trim();
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

    return () => {
      ignore = true;
    };
  }, [paymentsPage, debouncedPaymentsSearch, paymentStatusFilter, paymentMethodFilter, paymentTypeFilter]);

  // Expenses data loading (triggered only on expense pagination/search/filters)
  useEffect(() => {
    if (!isStaff) return;
    let ignore = false;
    setTimeout(() => {
      if (!ignore) setIsLoadingExpenses(true);
    }, 0);

    const expenseParams = {
      page: expensesPage,
      per_page: 15,
    };
    if (debouncedExpensesSearch.trim()) expenseParams.search = debouncedExpensesSearch.trim();
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

    return () => {
      ignore = true;
    };
  }, [isStaff, expensesPage, debouncedExpensesSearch, expenseCategoryFilter, expenseStatusFilter]);

  // Format currency in ETB
  const formatETB = (amount) => {
    const val = Number(amount) || 0;
    return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
  };


  // Open Receipt Modal
  const handleOpenReceipt = (payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  // Open Refund Modal

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

  const [isSendingReceiptEmail, setIsSendingReceiptEmail] = useState(false);
  const [receiptEmailStatus, setReceiptEmailStatus] = useState(null);

  const handleEmailReceipt = async () => {
    if (!selectedPayment?.id) return;
    setIsSendingReceiptEmail(true);
    setReceiptEmailStatus(null);
    try {
      const res = await apiClient.sendPaymentReceiptEmail(selectedPayment.id);
      setReceiptEmailStatus({ success: true, message: res.message || 'Payment receipt emailed successfully!' });
      setTimeout(() => setReceiptEmailStatus(null), 4000);
    } catch (err) {
      setReceiptEmailStatus({ success: false, message: err.message || 'Could not send receipt email.' });
      setTimeout(() => setReceiptEmailStatus(null), 5000);
    } finally {
      setIsSendingReceiptEmail(false);
    }
  };

  const handleResendDocuments = async (payment) => {
    const targetPayment = payment || selectedPayment;
    const delivery = targetPayment?.document_delivery;
    if (!delivery?.id) {
      showNotification('error', 'No document delivery record found for this payment.');
      return;
    }

    const currentEmail = delivery.recipient_email || targetPayment.member?.email || '';
    const updatedEmail = window.prompt(
      'Resend Membership Card & Receipt PDFs?\nEnter recipient email address:',
      currentEmail && !currentEmail.endsWith('@members.tigatgym.com') ? currentEmail : ''
    );

    if (updatedEmail === null) return;

    if (!updatedEmail || !updatedEmail.includes('@')) {
      showNotification('error', 'Please enter a valid email address.');
      return;
    }

    try {
      showNotification('info', 'Queueing membership documents for delivery...');
      const res = await apiClient.resendDocumentDelivery(delivery.id, { recipient_email: updatedEmail });
      showNotification('success', res.message || 'Membership documents queued for delivery!');
      fetchPayments();
      if (selectedPayment && selectedPayment.id === targetPayment.id) {
        setSelectedPayment(prev => ({
          ...prev,
          document_delivery: res.data || { ...prev.document_delivery, status: 'pending', recipient_email: updatedEmail },
        }));
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to resend documents.');
    }
  };

  const handleDownloadCard = async (payment) => {
    const targetPayment = payment || selectedPayment;
    const deliveryId = targetPayment?.document_delivery?.id;
    if (!deliveryId) {
      showNotification('error', 'Document delivery record not found for card download.');
      return;
    }
    try {
      showNotification('info', 'Downloading Membership Card PDF...');
      await apiClient.downloadDeliveryCard(deliveryId);
      showNotification('success', 'Membership Card PDF downloaded successfully.');
    } catch (err) {
      showNotification('error', err.message || 'Failed to download Membership Card PDF.');
    }
  };

  const handleDownloadReceipt = async (payment) => {
    const targetPayment = payment || selectedPayment;
    const deliveryId = targetPayment?.document_delivery?.id;
    if (!deliveryId) {
      showNotification('error', 'Document delivery record not found for receipt download.');
      return;
    }
    try {
      showNotification('info', 'Downloading Payment Receipt PDF...');
      await apiClient.downloadDeliveryReceipt(deliveryId);
      showNotification('success', 'Payment Receipt PDF downloaded successfully.');
    } catch (err) {
      showNotification('error', err.message || 'Failed to download Receipt PDF.');
    }
  };

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
      <div className="clean-kpi-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* Total Collected Revenue */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Total Revenue (ETB)</span>
            <div className="clean-kpi-icon" title="Total Revenue">
              <Icons.CreditCard size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {paymentSummary ? formatETB(paymentSummary.total_revenue) : '...'}
          </div>
          <span className="kpi-trend trend-positive" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>●</span> {paymentSummary?.completed_count || 0} completed receipts
          </span>
        </div>

        {/* Today's Collections */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Today's Collections</span>
            <div className="clean-kpi-icon" title="Today's Collections">
              <Icons.Calendar size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {paymentSummary ? formatETB(paymentSummary.today_revenue) : '...'}
          </div>
          <span className="kpi-trend" style={{ color: '#64748b' }}>
            Daily desk turnover (ETB)
          </span>
        </div>

        {/* Monthly Revenue */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Monthly Revenue</span>
            <div className="clean-kpi-icon" title="Monthly Revenue">
              <Icons.TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value">
            {paymentSummary ? formatETB(paymentSummary.month_revenue) : '...'}
          </div>
          <span className="kpi-trend trend-positive">
            Current billing cycle collections
          </span>
        </div>

        {/* Completed Receipts Count */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Total Receipts</span>
            <div className="clean-kpi-icon" title="Total Receipts">
              <Icons.Receipt size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#ff8a00' }}>
            {paymentSummary?.completed_count || 0}
          </div>
          <span className="kpi-trend" style={{ color: '#64748b' }}>
            Audited desk transactions
          </span>
        </div>
      </div>


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
              <h3 className="pay-section-heading" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Financial Transactions & Receipts
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
                Audited ledger of all front-desk cash, mobile bank slip, POS, and online transactions.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            className="dashboard-card"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 20,
              padding: 14,
              borderRadius: 10,
            }}
          >
            {/* Search Input */}
            <div className="search-bar-wrapper" style={{ gridColumn: 'span 2', position: 'relative' }}>
              <input
                type="text"
                className="form-input search-input-field"
                placeholder="Search receipt #, member name, phone, or bank ref..."
                value={paymentsSearch}
                onChange={(e) => {
                  setPaymentsSearch(e.target.value);
                  setPaymentsPage(1);
                }}
                style={{
                  paddingLeft: 36,
                  paddingRight: paymentsSearch ? 34 : 14,
                  width: '100%',
                  height: 42,
                  minHeight: 42,
                  boxSizing: 'border-box',
                  fontSize: 13.5,
                  borderRadius: 8,
                }}
              />
              {paymentsSearch && (
                <button
                  type="button"
                  onClick={() => { setPaymentsSearch(''); setPaymentsPage(1); }}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gym-text-muted, #94a3b8)',
                    fontSize: 15,
                    padding: '4px 6px',
                    borderRadius: 4,
                    lineHeight: 1,
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <span
                className="search-bar-icon"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Icons.Search size={15} />
              </span>
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
                <option value="">All Payment Methods</option>
                <option value="cash">Cash (Desk Drawer)</option>
                <option value="chapa">Chapa Pay</option>
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
              <table className="gym-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Receipt / Payment #</th>
                    <th>Member</th>
                    <th>Payment Method</th>
                    <th>Amount (ETB)</th>
                    <th>Status</th>
                    <th>Delivery</th>
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
                        {/* Receipt Code */}
                        <td style={{ minWidth: 150 }}>
                          <div style={{ fontWeight: 700, color: '#ff8a00', fontFamily: 'monospace', fontSize: 13.5 }}>
                            {p.receipt_number || p.payment_number}
                          </div>
                        </td>

                        {/* Member */}
                        <td style={{ minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: 'rgba(255, 122, 0, 0.12)',
                              border: '1px solid rgba(255, 122, 0, 0.3)',
                              color: '#ff7a00',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {p.member?.name ? p.member.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                              <div style={{
                                fontWeight: 700,
                                fontSize: 13.5,
                                color: 'var(--gym-text-main, #0f172a)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {p.member?.name || `Member #${p.user_id}`}
                              </div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 2,
                                fontSize: 11,
                                color: 'var(--gym-text-muted, #64748b)'
                              }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: '#ff8a00',
                                  background: 'rgba(255, 122, 0, 0.08)',
                                  padding: '1px 5px',
                                  borderRadius: 4
                                }}>
                                  {p.member?.member_code || `TG-${String(p.user_id).padStart(4, '0')}`}
                                </span>
                              </div>
                            </div>
                          </div>
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
                            <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)', marginTop: 2, fontFamily: 'monospace' }}>
                              Ref: {p.transactions[0].gateway_reference}
                            </div>
                          )}
                          {p.transactions?.[0]?.bank_name && (
                            <div style={{ fontSize: 10, color: 'var(--gym-text-muted, #64748b)' }}>
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

                        {/* Document Delivery */}
                        <td>
                          {p.document_delivery ? (
                            <div>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                background: p.document_delivery.status === 'sent' ? 'rgba(34, 197, 94, 0.15)' :
                                            p.document_delivery.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' :
                                            p.document_delivery.status === 'skipped_no_email' ? 'rgba(148, 163, 184, 0.15)' :
                                            'rgba(245, 158, 11, 0.15)',
                                color: p.document_delivery.status === 'sent' ? '#22c55e' :
                                       p.document_delivery.status === 'failed' ? '#ef4444' :
                                       p.document_delivery.status === 'skipped_no_email' ? '#94a3b8' :
                                       '#f59e0b',
                                textTransform: 'uppercase',
                              }}
                              title={p.document_delivery.error_message || (p.document_delivery.sent_at ? `Sent to ${p.document_delivery.recipient_email} at ${new Date(p.document_delivery.sent_at).toLocaleString()}` : '')}>
                                {p.document_delivery.status === 'sent' ? '✓ Sent' :
                                 p.document_delivery.status === 'failed' ? '⚠ Failed' :
                                 p.document_delivery.status === 'skipped_no_email' ? '✉ No Email' :
                                 '⏳ Pending'}
                              </span>
                              {p.document_delivery.recipient_email && p.document_delivery.status !== 'skipped_no_email' && (
                                <div style={{ fontSize: 10, color: 'var(--gym-text-muted, #a1a1aa)', marginTop: 2, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.document_delivery.recipient_email}>
                                  {p.document_delivery.recipient_email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--gym-text-muted, #64748b)' }}>—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
                            {isOwnerOrAdmin && p.status === 'completed' && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenRefund(p)}
                                title="Issue Audited Refund"
                                style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
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
              <h3 className="pay-section-heading" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Gym Operating Expenditures & Outflows
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
                Track facility overhead {expenseSummary?.total_expenses ? `(Total: ${formatETB(expenseSummary.total_expenses)})` : ''}: Facility rent, utilities, equipment maintenance, and supplies.
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
          <div
            className="dashboard-card"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 20,
              padding: 14,
              borderRadius: 10,
            }}
          >
            <div className="search-bar-wrapper" style={{ gridColumn: 'span 2', position: 'relative' }}>
              <input
                type="text"
                className="form-input search-input-field"
                placeholder="Search expense #, title, or vendor recipient..."
                value={expensesSearch}
                onChange={(e) => {
                  setExpensesSearch(e.target.value);
                  setExpensesPage(1);
                }}
                style={{
                  paddingLeft: 36,
                  paddingRight: expensesSearch ? 34 : 14,
                  width: '100%',
                  height: 42,
                  minHeight: 42,
                  boxSizing: 'border-box',
                  fontSize: 13.5,
                  borderRadius: 8,
                }}
              />
              {expensesSearch && (
                <button
                  type="button"
                  onClick={() => { setExpensesSearch(''); setExpensesPage(1); }}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gym-text-muted, #94a3b8)',
                    fontSize: 15,
                    padding: '4px 6px',
                    borderRadius: 4,
                    lineHeight: 1,
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <span
                className="search-bar-icon"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Icons.Search size={15} />
              </span>
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
      {/* ==================== MODAL 2: BRANDED PRINTABLE RECEIPT ==================== */}
      {isReceiptModalOpen && selectedPayment && (
        <div className="modal-backdrop" onClick={() => setIsReceiptModalOpen(false)}>
          <div className="modal-card receipt-modal-card" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: 520,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
            color: '#0f172a',
          }}>
            {/* Receipt Modal Controls (Hidden in print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', border: '1px solid rgba(34, 197, 94, 0.3)', fontWeight: 700 }}>
                Verified Official Receipt
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ padding: '4px 8px', fontSize: 13 }}
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Container */}
            <div id="printable-receipt" style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 24,
              color: '#0f172a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              {/* Header Branding */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <BrandLogo variant="sidebar" size={80} showSubtext={false} />
                </div>
                <h4 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 900, letterSpacing: '0.06em' }}>
                  TIGAT GYM
                </h4>
                <div style={{ fontSize: 11, color: '#E67C00', fontWeight: 800, letterSpacing: '0.12em', marginTop: 3 }}>
                  OFFICIAL PAYMENT RECEIPT
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Tigat Gym • Addis Ababa, Ethiopia
                </div>
              </div>

              {/* Receipt Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>Receipt Number:</div>
                  <div style={{ fontWeight: 800, color: '#E67C00', fontFamily: 'monospace', fontSize: 13.5, marginTop: 1 }}>
                    {selectedPayment.receipt_number || selectedPayment.payment_number}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>Date & Time:</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 1 }}>
                    {selectedPayment.paid_at ? new Date(selectedPayment.paid_at).toLocaleString() : new Date(selectedPayment.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>Billed To:</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13.5, marginTop: 1 }}>
                    {selectedPayment.member?.name || 'Member'}
                  </div>
                  <div style={{ fontSize: 11, color: '#E67C00', fontWeight: 700, fontFamily: 'monospace', marginTop: 1 }}>
                    Code: {selectedPayment.member?.member_code || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>Front Desk Officer:</div>
                  <div style={{ fontWeight: 600, color: '#334155', marginTop: 1 }}>
                    {selectedPayment.recorded_by?.name || user?.name || 'Reception Staff'}
                  </div>
                </div>
              </div>

              {/* Itemized Breakdown Table */}
              <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '12px 0', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>
                  <span>Description</span>
                  <span>Amount (ETB)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                  <span>
                    {selectedPayment.payable?.plan_name ||
                     (selectedPayment.payment_type ? selectedPayment.payment_type.replace('_', ' ').toUpperCase() : 'MEMBERSHIP ACCESS')}
                  </span>
                  <span>{formatETB(selectedPayment.amount)}</span>
                </div>
                {selectedPayment.notes && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                    "{selectedPayment.notes}"
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>
                    Total Paid
                  </div>
                  <div style={{ fontSize: 12, color: '#E67C00', fontWeight: 700, textTransform: 'capitalize', marginTop: 2 }}>
                    Method: {selectedPayment.payment_method?.replace('_', ' ')}
                  </div>
                  {selectedPayment.transactions?.[0]?.gateway_reference && (
                    <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                      Txn Ref: {selectedPayment.transactions[0].gateway_reference}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
                  {formatETB(selectedPayment.amount)}
                </div>
              </div>

              {/* QR Verification Matrix */}
              <div style={{ textAlign: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: 16 }}>
                <div style={{
                  display: 'inline-block',
                  background: '#ffffff',
                  padding: 8,
                  borderRadius: 10,
                  marginBottom: 8,
                  border: '1.5px solid #fed7aa',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <QRCodeDisplay
                    value={`TIGAT-VERIFIED-RECEIPT:${selectedPayment.receipt_number}:${selectedPayment.amount}ETB`}
                    size={80}
                  />
                </div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Security Token: {selectedPayment.payment_number}
                </div>
                <div style={{ fontSize: 12, color: '#E67C00', fontWeight: 700, marginTop: 4 }}>
                  Thank you for training with TIGAT GYM! 💪
                </div>
              </div>
            </div>

            {/* Document Delivery Status Banner in Receipt Modal */}
            {selectedPayment?.document_delivery && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '12px 14px',
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#E67C00', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Automated Document Delivery (Card & Receipt PDFs)
                  </div>
                  <div style={{ fontSize: 12, color: '#0f172a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: 700,
                      color: selectedPayment.document_delivery.status === 'sent' ? '#16a34a' :
                             selectedPayment.document_delivery.status === 'failed' ? '#ef4444' :
                             selectedPayment.document_delivery.status === 'skipped_no_email' ? '#64748b' : '#f59e0b',
                    }}>
                      ● {selectedPayment.document_delivery.status?.toUpperCase()}
                    </span>
                    {selectedPayment.document_delivery.recipient_email && (
                      <span style={{ color: '#475569' }}>
                        to <strong>{selectedPayment.document_delivery.recipient_email}</strong>
                      </span>
                    )}
                    {selectedPayment.document_delivery.sent_at && (
                      <span style={{ color: '#64748b', fontSize: 11 }}>
                        ({new Date(selectedPayment.document_delivery.sent_at).toLocaleString()})
                      </span>
                    )}
                  </div>
                  {selectedPayment.document_delivery.error_message && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>
                      {selectedPayment.document_delivery.error_message}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDownloadCard(selectedPayment)}
                    style={{ fontSize: 12, padding: '5px 10px', color: '#E67C00', fontWeight: 600 }}
                  >
                    📇 Download Card PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDownloadReceipt(selectedPayment)}
                    style={{ fontSize: 12, padding: '5px 10px', fontWeight: 600 }}
                  >
                    📄 Download Receipt PDF
                  </button>
                  {isStaff && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleResendDocuments(selectedPayment)}
                      style={{ fontSize: 12, padding: '5px 10px', fontWeight: 600 }}
                    >
                      ✉️ Resend Documents
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Print, Email & Close Buttons */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsReceiptModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleEmailReceipt}
                  disabled={isSendingReceiptEmail}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                >
                  <span>✉️</span> {isSendingReceiptEmail ? 'Sending...' : 'Email Receipt'}
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

              {receiptEmailStatus && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: receiptEmailStatus.success ? '#16a34a' : '#dc2626',
                    background: receiptEmailStatus.success ? '#f0fdf4' : '#fef2f2',
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: `1px solid ${receiptEmailStatus.success ? '#bbf7d0' : '#fecaca'}`,
                    textAlign: 'right',
                  }}
                >
                  {receiptEmailStatus.message}
                </div>
              )}
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
                <h3 className="modal-title-themed" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  Record Gym Operating Expense
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 12 }}>
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
                  placeholder="e.g. Utility & Electricity Authority, Vendor"
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
