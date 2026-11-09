import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import BrandLogo from './BrandLogo';
import QRCodeDisplay from './QRCodeDisplay';

export default function PaymentLedger({ initialOpenRecordPayment = false }) {
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
  const [membershipPlans, setMembershipPlans] = useState([]);

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(initialOpenRecordPayment);
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
    membership_plan_id: '',
    subscription_id: '',
    start_date: new Date().toISOString().split('T')[0],
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

  // Chapa Mobile Push & Verification Automation State
  const [chapaProvider, setChapaProvider] = useState('telebirr');
  const [chapaPayerPhone, setChapaPayerPhone] = useState('');
  const [chapaStatus, setChapaStatus] = useState('idle'); // 'idle' | 'push_sent' | 'verified' | 'cancelled'
  const [chapaTxRef, setChapaTxRef] = useState('');
  const [chapaCheckoutUrl, setChapaCheckoutUrl] = useState('');
  const [chapaIsLoading, setChapaIsLoading] = useState(false);
  const [chapaNotice, setChapaNotice] = useState('');
  const [chapaElapsedSeconds, setChapaElapsedSeconds] = useState(0);

  const chapaPollTimerRef = useRef(null);
  const chapaElapsedTimerRef = useRef(null);

  const stopChapaTimers = useCallback(() => {
    if (chapaPollTimerRef.current) {
      clearInterval(chapaPollTimerRef.current);
      chapaPollTimerRef.current = null;
    }
    if (chapaElapsedTimerRef.current) {
      clearInterval(chapaElapsedTimerRef.current);
      chapaElapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopChapaTimers();
    };
  }, [stopChapaTimers]);

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

      apiClient.getMembershipPlans({ active_only: 1 })
        .then(res => {
          if (!ignore && res?.data) {
            setMembershipPlans(res.data || []);
          }
        })
        .catch(err => console.error('Failed to load membership plans for payments:', err));
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
      membership_plan_id: '',
      subscription_id: '',
      start_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      bank_name: 'Commercial Bank of Ethiopia (CBE)',
      gateway_reference: '',
      bank_account_number: '',
      notes: '',
    });
    setIsRecordPaymentOpen(true);
    handleChapaReset();
  };

  const handleChapaReset = () => {
    stopChapaTimers();
    setChapaStatus('idle');
    setChapaNotice('');
    setChapaElapsedSeconds(0);
    setChapaCheckoutUrl('');
    setPaymentForm((prev) => ({ ...prev, gateway_reference: '' }));
  };

  const handleChapaSendPush = async () => {
    const selectedMember = membersList.find(
      (m) => String(m.user_id) === String(paymentForm.user_id) || String(m.id) === String(paymentForm.user_id)
    );
    const targetPhone = (chapaPayerPhone || selectedMember?.phone || '').trim();
    if (!targetPhone) {
      showNotification('error', 'Please enter or select a valid payer mobile phone number.');
      return;
    }
    const amountNum = Number(paymentForm.amount) || 0;
    if (amountNum <= 0) {
      showNotification('error', 'Please enter a valid payment amount in ETB.');
      return;
    }

    setChapaIsLoading(true);
    setChapaNotice('');
    stopChapaTimers();
    setChapaElapsedSeconds(0);

    let activeMerchantRef = `TG-${Date.now().toString().slice(-8)}`;
    const returnUrl = window.location.origin + window.location.pathname + '?payment=chapa';

    try {
      const res = await apiClient.initializeChapa({
        amount: amountNum,
        phone: targetPhone,
        provider: chapaProvider,
        name: selectedMember?.name || 'Tigat Member',
        email: selectedMember?.email,
        return_url: returnUrl,
      });

      const data = res.data || res;
      activeMerchantRef = data.merchant_reference || data.tx_ref || activeMerchantRef;
      const checkoutUrl = data.checkout_url || '';

      setChapaTxRef(activeMerchantRef);
      setChapaCheckoutUrl(checkoutUrl);
      setChapaStatus('push_sent');
      setChapaNotice(res.message || `Chapa Hosted Checkout session created! Open checkout page or authorize payment.`);
    } catch (err) {
      console.error('Chapa initialization error:', err);
      const errMsg = err.response?.data?.message || err.message || `Failed to initialize Chapa payment session.`;
      setChapaNotice(errMsg);
      setChapaStatus('cancelled');
      setChapaIsLoading(false);
      return;
    } finally {
      setChapaIsLoading(false);
    }

    // Start timer counter
    chapaElapsedTimerRef.current = setInterval(() => {
      setChapaElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Auto-Polling: every 3 seconds
    let attempts = 0;
    const maxAttempts = 40; // 120s
    chapaPollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        stopChapaTimers();
        setChapaStatus('cancelled');
        setChapaNotice('⏱️ Request Timed Out: Payment was not completed within the time limit.');
        return;
      }

      try {
        const checkRes = await apiClient.verifyChapa({
          merchant_reference: activeMerchantRef,
        });

        if (checkRes.status === 'success' && (checkRes.data?.is_paid || checkRes.data?.status === 'completed')) {
          stopChapaTimers();
          const verifiedRef = checkRes.data?.gateway_reference || activeMerchantRef;
          setChapaStatus('verified');
          setPaymentForm((prev) => ({ ...prev, gateway_reference: verifiedRef }));
          setChapaNotice(`✅ Payment Successful! Verified Ref: ${verifiedRef}`);
        } else if (checkRes.status === 'failed' || checkRes.data?.status === 'failed' || checkRes.status === 'cancelled') {
          stopChapaTimers();
          setChapaStatus('cancelled');
          setChapaNotice('⚠️ Notice: Payment was cancelled or rejected.');
        }
      } catch (err) {
        const errData = err.response?.data;
        if (errData?.status === 'cancelled' || errData?.status === 'failed') {
          stopChapaTimers();
          setChapaStatus('cancelled');
          setChapaNotice(errData?.message || '⚠️ Notice: Payment was unsuccessful or cancelled.');
        }
      }
    }, 3000);
  };

  const handleChapaCheckStatusNow = async () => {
    if (!chapaTxRef) return;
    setChapaIsLoading(true);
    try {
      const checkRes = await apiClient.verifyChapa({
        merchant_reference: chapaTxRef,
      });

      if (checkRes.status === 'success' && (checkRes.data?.is_paid || checkRes.data?.status === 'completed')) {
        stopChapaTimers();
        const verifiedRef = checkRes.data?.gateway_reference || chapaTxRef;
        setChapaStatus('verified');
        setPaymentForm((prev) => ({ ...prev, gateway_reference: verifiedRef }));
        setChapaNotice(`✅ Payment Successful! Verified Ref: ${verifiedRef}`);
      } else if (checkRes.status === 'pending' || checkRes.data?.status === 'pending') {
        setChapaNotice(`⏳ Payment is still pending on Chapa. Awaiting completion.`);
      } else {
        stopChapaTimers();
        setChapaStatus('cancelled');
        setChapaNotice(checkRes.message || 'Payment has not been completed or was cancelled.');
      }
    } catch (err) {
      console.error('Manual check error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to verify payment with Chapa.';
      setChapaNotice(msg);
    } finally {
      setChapaIsLoading(false);
    }
  };

  const handleChapaCancel = async () => {
    stopChapaTimers();
    setChapaIsLoading(false);
    setChapaStatus('cancelled');
    setChapaNotice('⚠️ Notice: Checkout session cancelled by front-desk.');
  };

  // Member selection handler in Record Payment
  const handleMemberSelect = (memberId) => {
    const member = membersList.find(m => String(m.user_id) === String(memberId) || String(m.id) === String(memberId));
    if (member?.phone) {
      setChapaPayerPhone(member.phone);
    }
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

      if (paymentForm.payment_type === 'subscription' && paymentForm.membership_plan_id) {
        payload.membership_plan_id = Number(paymentForm.membership_plan_id);
        payload.start_date = paymentForm.start_date;
      } else if (paymentForm.subscription_id) {
        payload.subscription_id = Number(paymentForm.subscription_id);
      }

      if (paymentForm.payment_method === 'chapa' && paymentForm.gateway_reference) {
        payload.gateway_reference = paymentForm.gateway_reference.trim();
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
              <h3 className="pay-section-heading" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Financial Transactions & Receipts
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
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
              <table className="gymcore-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Receipt / Payment #</th>
                    <th>Member</th>
                    <th>Type</th>
                    <th>Payment Method</th>
                    <th>Amount (ETB)</th>
                    <th>Status</th>
                    <th>Delivery</th>
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
                                <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 2, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.document_delivery.recipient_email}>
                                  {p.document_delivery.recipient_email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b' }}>—</span>
                          )}
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

                            {/* Download Card PDF */}
                            {p.document_delivery && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDownloadCard(p)}
                                title="Download Membership Card PDF"
                                style={{ padding: '4px 8px', fontSize: 12, color: '#ff8a00' }}
                              >
                                📇 Card
                              </button>
                            )}

                            {/* Resend Documents (Staff only) */}
                            {isStaff && p.document_delivery && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleResendDocuments(p)}
                                title="Resend Card & Receipt PDFs via Email"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                              >
                                ✉️ Resend
                              </button>
                            )}

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
              <h3 className="pay-section-heading" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Gym Operating Expenditures & Outflows
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
                Track facility overhead: Facility rent, utilities, equipment maintenance, and supplies.
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
                <h3 className="modal-title-themed" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  Record Official Payment
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 12 }}>
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

              {/* Membership Plan Selection (Required for subscription/membership payment) */}
              {paymentForm.payment_type === 'subscription' && (
                <div style={{
                  background: 'rgba(230, 124, 0, 0.08)',
                  border: '1px solid rgba(230, 124, 0, 0.35)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
                      Membership Plan (Required) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#E67C00', background: 'rgba(230, 124, 0, 0.15)', padding: '2px 8px', borderRadius: 6 }}>
                      Auto-Activates Pass
                    </span>
                  </div>
                  <select
                    className="form-control"
                    value={paymentForm.membership_plan_id}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const selected = membershipPlans.find(p => String(p.id) === String(pId));
                      setPaymentForm(prev => ({
                        ...prev,
                        membership_plan_id: pId,
                        amount: selected ? String(selected.price) : prev.amount,
                      }));
                    }}
                    required={paymentForm.payment_type === 'subscription'}
                    style={{
                      border: '1.5px solid #E67C00',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 13.5,
                      fontWeight: 600,
                    }}
                  >
                    <option value="">-- Choose Membership Package to Activate / Extend --</option>
                    {membershipPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {formatETB(plan.price)} ({plan.duration_value} {plan.duration_type}{plan.duration_value > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  {paymentForm.membership_plan_id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 12, color: '#ea580c' }}>
                      <span>✓ Plan selected: Service duration automatically calculated</span>
                      <span style={{ fontWeight: 700 }}>Price: {formatETB(paymentForm.amount)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Purpose / Type & Amount */}
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
                    placeholder="e.g. 2500.00"
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { id: 'cash', label: 'Cash (Desk Drawer)', icon: '💵' },
                    { id: 'chapa', label: 'Chapa Pay', icon: '⚡' },
                  ].map((m) => (
                    <label
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: paymentForm.payment_method === m.id ? 'rgba(230, 124, 0, 0.15)' : '#0d1017',
                        border: paymentForm.payment_method === m.id ? '1.5px solid #E67C00' : '1px solid #232936',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 700,
                        color: paymentForm.payment_method === m.id ? '#E67C00' : '#d4d4d8',
                        transition: 'all 0.15s ease',
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
                      <span style={{ fontSize: 16 }}>{m.icon}</span>
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional Chapa Mobile Money & Reference Field */}
              {paymentForm.payment_method === 'chapa' && (
                <div style={{
                  background: 'rgba(230, 124, 0, 0.08)',
                  border: '1.5px solid rgba(230, 124, 0, 0.35)',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 16,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#E67C00', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>⚡</span> Chapa Mobile Money (Telebirr / CBE Birr)
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(230, 124, 0, 0.2)', padding: '2px 8px', borderRadius: 10 }}>
                      Automatic STK Push
                    </span>
                  </div>

                  {/* Provider Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      { id: 'telebirr', name: 'Telebirr', icon: '📱' },
                      { id: 'cbebirr', name: 'CBE Birr', icon: '🏦' },
                      { id: 'mpesa', name: 'M-Pesa', icon: '🟢' },
                    ].map((prov) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => setChapaProvider(prov.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '7px 8px',
                          borderRadius: 6,
                          background: chapaProvider === prov.id ? '#1e2430' : '#0d1017',
                          border: chapaProvider === prov.id ? '1.5px solid #E67C00' : '1px solid #232936',
                          color: chapaProvider === prov.id ? '#E67C00' : '#94a3b8',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{prov.icon}</span>
                        <span>{prov.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Payer Phone Input & Push Button */}
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label" style={{ display: 'block', fontSize: 11, marginBottom: 4 }}>
                      Member Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="09... or 07..."
                        value={chapaPayerPhone || membersList.find(m => String(m.user_id) === String(paymentForm.user_id) || String(m.id) === String(paymentForm.user_id))?.phone || ''}
                        onChange={(e) => setChapaPayerPhone(e.target.value)}
                        disabled={chapaStatus === 'verified' || chapaStatus === 'push_sent' || chapaIsLoading}
                        style={{ height: 36, fontSize: 13 }}
                      />
                      {chapaStatus === 'idle' && (
                        <button
                          type="button"
                          onClick={handleChapaSendPush}
                          disabled={chapaIsLoading || !paymentForm.amount}
                          className="btn btn-primary"
                          style={{
                            height: 36,
                            padding: '0 14px',
                            fontSize: 12,
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            background: '#E67C00',
                            borderColor: '#E67C00',
                          }}
                        >
                          {chapaIsLoading ? 'Sending...' : '⚡ Send Push to Phone'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Push Sent: Waiting for Member's Phone PIN */}
                  {chapaStatus === 'push_sent' && (
                    <div style={{
                      background: 'rgba(230, 124, 0, 0.12)',
                      border: '1px solid rgba(230, 124, 0, 0.4)',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#f59e0b' }}>
                          USSD Prompt Sent to Member's Phone!
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>
                          Waiting: {chapaElapsedSeconds}s
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#d4d4d8', marginBottom: 6 }}>
                        Prompt delivered via <strong>{chapaProvider.toUpperCase()}</strong>. Member is entering password/PIN on their mobile phone.
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginBottom: 10 }}>
                        🔒 The system will automatically detect approval when the member enters their PIN.
                      </div>

                      {/* Controls */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 8 }}>
                        {chapaCheckoutUrl && (
                          <a
                            href={chapaCheckoutUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              background: '#E67C00',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: 6,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Proceed to Chapa Checkout ↗
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={handleChapaCheckStatusNow}
                          disabled={chapaIsLoading}
                          className="btn btn-sm"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          {chapaIsLoading ? 'Verifying...' : 'Check Status Now'}
                        </button>
                        <button
                          type="button"
                          onClick={handleChapaCancel}
                          disabled={chapaIsLoading}
                          className="btn btn-sm"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            padding: '5px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Verified Confirmation */}
                  {chapaStatus === 'verified' && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1.5px solid #10b981',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#34d399' }}>
                          ✅ Payment Authorized Automatically!
                        </div>
                        <div style={{ fontSize: 11.5, color: '#a7f3d0' }}>
                          Reference: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{paymentForm.gateway_reference || chapaTxRef}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleChapaReset}
                        style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {/* Cancelled Alert Notice */}
                  {chapaStatus === 'cancelled' && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1.5px solid #ef4444',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#f87171', marginBottom: 4 }}>
                        ⚠️ Notice: Payment Cancelled by Member
                      </div>
                      <div style={{ fontSize: 11.5, color: '#fca5a5', marginBottom: 10 }}>
                        {chapaNotice || 'The member cancelled or rejected the payment prompt on their phone. No money was deducted.'}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={handleChapaSendPush}
                          className="btn btn-sm"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#E67C00',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '5px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          🔁 Retry Push
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleChapaReset();
                            setPaymentForm(prev => ({ ...prev, payment_method: 'cash' }));
                          }}
                          className="btn btn-sm"
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '5px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          💵 Switch to Cash
                        </button>
                        <button
                          type="button"
                          onClick={handleChapaReset}
                          style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual Code Fallback */}
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label className="form-label" style={{ display: 'block', fontSize: 11, marginBottom: 4, color: '#94a3b8' }}>
                      Manual Reference Code (Optional / Auto-filled)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={paymentForm.gateway_reference}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, gateway_reference: e.target.value }))}
                      placeholder="e.g. CHP-tx-987654321"
                      style={{ fontSize: 12 }}
                    />
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
                <h4 style={{ margin: 0, color: '#f5f5f5', fontSize: 16, fontWeight: 800, letterSpacing: '0.06em' }}>
                  TIGAT GYM
                </h4>
                <div style={{ fontSize: 11, color: '#ff8a00', fontWeight: 700, letterSpacing: '0.1em', marginTop: 2 }}>
                  OFFICIAL PAYMENT RECEIPT
                </div>
                <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>
                  Tigat Gym • Addis Ababa, Ethiopia
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

            {/* Document Delivery Status Banner in Receipt Modal */}
            {selectedPayment?.document_delivery && (
              <div style={{
                background: '#0d1117',
                border: '1px solid #1f293d',
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ff8a00', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Automated Document Delivery (Card & Receipt PDFs)
                  </div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: 700,
                      color: selectedPayment.document_delivery.status === 'sent' ? '#22c55e' :
                             selectedPayment.document_delivery.status === 'failed' ? '#ef4444' :
                             selectedPayment.document_delivery.status === 'skipped_no_email' ? '#94a3b8' : '#f59e0b',
                    }}>
                      ● {selectedPayment.document_delivery.status?.toUpperCase()}
                    </span>
                    {selectedPayment.document_delivery.recipient_email && (
                      <span style={{ color: '#94a3b8' }}>
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
                    style={{ fontSize: 12, padding: '5px 10px', color: '#ff8a00', fontWeight: 600 }}
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
