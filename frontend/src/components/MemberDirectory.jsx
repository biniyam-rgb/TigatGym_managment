import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import useDebounce from '../hooks/useDebounce';
import QRCodeDisplay from './QRCodeDisplay';
import BrandLogo from './BrandLogo';
import PermanentMemberCard from './PermanentMemberCard';
import { calculateAge, validateMemberForm, validateSingleField } from '../utils/memberValidators';

// Crisp Lucide-style SVG Icons (replacing emojis)
const Icons = {
  Users: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Clock: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  UserPlus: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  AlertCircle: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  AlertTriangle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  QrCode: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  ),
  Edit: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  ),
  Trash: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  ),
  CreditCard: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Cash: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  Zap: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Printer: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </svg>
  ),
  Droplet: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  ),
  Refresh: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  ),
  MessageCircle: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
    </svg>
  ),
  Edit3: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Search: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

const CHAPA_PROVIDERS = [
  { id: 'telebirr', name: 'Telebirr', badge: 'Ethio Telecom', color: '#0284c7', icon: '📱' },
  { id: 'cbebirr', name: 'CBE Birr', badge: 'CBE Bank', color: '#9333ea', icon: '🏦' },
  { id: 'mpesa', name: 'M-Pesa', badge: 'Safaricom', color: '#16a34a', icon: '🟢' },
  { id: 'awash', name: 'AwashBirr', badge: 'Awash Bank', color: '#d97706', icon: '💳' },
];

export default function MemberDirectory({ initialOpenRegister = false, initialSearch = '' }) {
  const { user, hasRole } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 250);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  useEffect(() => {
    if (initialSearch) {
      setTimeout(() => {
        setSearch(initialSearch);
        setPage(1);
      }, 0);
    }
  }, [initialSearch]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [showFilters, setShowFilters] = useState(false);

  // Notifications
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(initialOpenRegister);
  const [prevInitialOpen, setPrevInitialOpen] = useState(initialOpenRegister);
  if (initialOpenRegister !== prevInitialOpen) {
    setPrevInitialOpen(initialOpenRegister);
    if (initialOpenRegister) {
      setIsRegisterOpen(true);
    }
  }
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [registeredMemberPass, setRegisteredMemberPass] = useState(null);
  const [passModalTab, setPassModalTab] = useState('receipt'); // 'receipt' | 'pass' | 'both'
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [registerError, setRegisterError] = useState('');

  // Date boundaries for calendar choosers
  const maxDobString = new Date().toISOString().split('T')[0];
  const minStartDate = new Date();
  minStartDate.setDate(minStartDate.getDate() - 30);
  const minStartDateString = minStartDate.toISOString().split('T')[0];
  const maxStartDate = new Date();
  maxStartDate.setDate(maxStartDate.getDate() + 90);
  const maxStartDateString = maxStartDate.toISOString().split('T')[0];

  // Form state
  const initialFormData = {
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    date_of_birth: '',
    blood_type: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    fitness_goals: '',
    health_conditions: '',
    membership_plan_id: '',
    payment_method: 'cash',
    payment_reference: '',
    payment_amount: '',
    start_date: new Date().toISOString().split('T')[0],
  };
  const [formData, setFormData] = useState(initialFormData);

  // Chapa Direct Mobile Money State (Automated Push / PIN Detection Flow)
  const [chapaProvider, setChapaProvider] = useState('telebirr');
  const [chapaPayerPhone, setChapaPayerPhone] = useState('');
  const [chapaStatus, setChapaStatus] = useState('idle'); // 'idle' | 'push_sent' | 'verified' | 'cancelled' | 'failed'
  const [chapaTxRef, setChapaTxRef] = useState('');
  const [chapaCheckoutUrl, setChapaCheckoutUrl] = useState('');
  const [chapaIsLoading, setChapaIsLoading] = useState(false);
  const [chapaNotice, setChapaNotice] = useState('');
  const [chapaManualMode, setChapaManualMode] = useState(false);
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

  const isStaff = hasRole('owner') || hasRole('admin') || hasRole('receptionist');
  const isManagement = hasRole('owner') || hasRole('admin');

  // Member Suspension Reason Modal state
  const [suspendModalMember, setSuspendModalMember] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  const handlePromptSuspendMember = (member) => {
    setSuspendModalMember(member);
    setSuspensionReason(member.suspension_reason || '');
  };

  const handleConfirmSuspendMember = async (e) => {
    e?.preventDefault();
    if (!suspendModalMember) return;
    if (!suspensionReason.trim()) {
      setNotification({
        type: 'danger',
        message: 'Please provide a clear reason for suspension so the front desk can explain it to the member.',
      });
      return;
    }

    setIsSuspending(true);
    try {
      await apiClient.updateMember(suspendModalMember.id, {
        status: 'suspended',
        suspension_reason: suspensionReason.trim(),
      });
      setNotification({
        type: 'success',
        message: `Member "${suspendModalMember.name}" suspended. Reason logged for Reception alerts.`,
      });
      setSuspendModalMember(null);
      setSuspensionReason('');
      fetchMembers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to suspend member.' });
    } finally {
      setIsSuspending(false);
    }
  };

  const handleReactivateMember = async (member) => {
    try {
      await apiClient.updateMember(member.id, { status: 'active' });
      setNotification({
        type: 'success',
        message: `Member "${member.name}" reactivated successfully.`,
      });
      fetchMembers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to reactivate member.' });
    }
  };

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getMembers({
        search: debouncedSearch,
        status: statusFilter,
        gender: genderFilter,
        page,
        per_page: 10,
      });

      if (res?.data) {
        setMembers(res.data);
        setTotalPages(res.last_page || 1);
        setTotalMembers(res.total || 0);
      }
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to load members' });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, genderFilter, page]);

  // Load plans once on mount
  useEffect(() => {
    apiClient.getMembershipPlans({ active_only: 1 })
      .then((res) => {
        if (res?.data) {
          setMembershipPlans(res.data || []);
        }
      })
      .catch((err) => console.error('Failed to load membership plans:', err));
  }, []);

  // Fetch members when search, filters, or page changes
  useEffect(() => {
    let ignore = false;
    setTimeout(() => {
      if (!ignore) setIsLoading(true);
    }, 0);
    apiClient.getMembers({ search: debouncedSearch, status: statusFilter, gender: genderFilter, page, per_page: 10 })
      .then((res) => {
        if (!ignore && res?.data) {
          setMembers(res.data);
          setTotalPages(res.last_page || 1);
          setTotalMembers(res.total || 0);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setNotification({ type: 'danger', message: err.message || 'Failed to load members' });
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, statusFilter, genderFilter, page]);

  const openDatePicker = (inputEl) => {
    if (!inputEl) return;
    inputEl.focus();
    if (typeof inputEl.showPicker === 'function') {
      try {
        inputEl.showPicker();
      } catch (err) {
        console.debug('Date picker launch error:', err);
      }
    }
  };

  const handleFieldBlur = async (field) => {
    const error = validateSingleField(field, formData[field], formData, !editingMember);
    if (error) {
      setFormErrors((prev) => ({ ...prev, [field]: error }));
      return;
    }

    setFormErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });

    // Real-time server check: verify if phone number or email is already taken
    const currentVal = formData[field];
    if (field === 'phone' && currentVal && currentVal.trim().length >= 9) {
      try {
        const res = await apiClient.checkContactAvailability({
          phone: currentVal.trim(),
          exclude_user_id: editingMember?.user_id || editingMember?.id || undefined,
        });
        if (res.phone_taken) {
          setFormErrors((prev) => ({
            ...prev,
            phone: res.phone_message || 'This phone number is already registered to another member.',
          }));
        }
      } catch (err) {
        console.warn('Phone availability check notice:', err);
      }
    } else if (field === 'email' && currentVal && currentVal.trim().length >= 5) {
      try {
        const res = await apiClient.checkContactAvailability({
          email: currentVal.trim(),
          exclude_user_id: editingMember?.user_id || editingMember?.id || undefined,
        });
        if (res.email_taken) {
          setFormErrors((prev) => ({
            ...prev,
            email: res.email_message || 'This email address is already registered to another account.',
          }));
        }
      } catch (err) {
        console.warn('Email availability check notice:', err);
      }
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const nextData = { ...prev, [field]: value };
      if (formErrors[field]) {
        const err = validateSingleField(field, value, nextData, !editingMember);
        setFormErrors((prevErrors) => {
          if (err) {
            return { ...prevErrors, [field]: err };
          }
          const nextErrors = { ...prevErrors };
          delete nextErrors[field];
          return nextErrors;
        });
      }
      return nextData;
    });
  };

  const handleChapaSendPush = async () => {
    // Strict Validation: Member credentials (Name and Phone) must be provided before paying
    const nameErr = validateSingleField('name', formData.name, formData, true);
    const phoneErr = validateSingleField('phone', formData.phone, formData, true);
    const emailErr = validateSingleField('email', formData.email, formData, true);

    if (nameErr || phoneErr || emailErr) {
      setFormErrors((prev) => ({
        ...prev,
        ...(nameErr ? { name: nameErr } : {}),
        ...(phoneErr ? { phone: phoneErr } : {}),
        ...(emailErr ? { email: emailErr } : {}),
      }));
      setNotification({
        type: 'danger',
        message: 'Strict Validation: Please enter valid member credentials (Full Name and Phone Number) before initiating payment.',
      });
      return;
    }

    const targetPhone = (chapaPayerPhone || formData.phone || '').trim();
    if (!targetPhone) {
      setFormErrors((prev) => ({ ...prev, phone: 'Please enter a valid payer phone number for Chapa push.' }));
      return;
    }
    const selectedPlan = membershipPlans.find((p) => String(p.id) === String(formData.membership_plan_id));
    const amountNum = Number(formData.payment_amount) || Number(selectedPlan?.price) || 0;
    if (amountNum <= 0) {
      setFormErrors((prev) => ({ ...prev, payment_amount: 'Please enter a valid package price in ETB.' }));
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
        name: formData.name.trim(),
        email: formData.email?.trim() || undefined,
        plan_name: selectedPlan?.name,
        membership_plan_id: Number(formData.membership_plan_id),
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

    // Start elapsed counter (seconds)
    chapaElapsedTimerRef.current = setInterval(() => {
      setChapaElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Auto-Polling: every 3 seconds, check if payment is confirmed on gateway
    let attempts = 0;
    const maxAttempts = 40; // 120 seconds timeout
    chapaPollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        stopChapaTimers();
        setChapaStatus('cancelled');
        setChapaNotice('⏱️ Request Timed Out: The member took too long to authorize or cancelled payment. You can retry or switch to cash.');
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
          setFormData((prev) => ({ ...prev, payment_reference: verifiedRef }));
          setFormErrors((prev) => {
            const next = { ...prev };
            delete next.payment_reference;
            return next;
          });
          setChapaNotice(`✅ Payment Confirmed & Membership Activated! Ref: ${verifiedRef}`);
        } else if (checkRes.status === 'failed' || checkRes.data?.status === 'failed' || checkRes.status === 'cancelled') {
          stopChapaTimers();
          setChapaStatus('cancelled');
          setChapaNotice('⚠️ Notice: Member cancelled or declined the payment. No funds were charged.');
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
        setFormData((prev) => ({ ...prev, payment_reference: verifiedRef }));
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next.payment_reference;
          return next;
        });
        setChapaNotice(`✅ Payment Confirmed & Membership Activated! (Ref: ${verifiedRef})`);
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
    setChapaNotice('⚠️ Notice: Checkout session cancelled by front-desk. You can re-initiate or switch to Cash.');
  };

  const handleChapaReset = () => {
    stopChapaTimers();
    setChapaStatus('idle');
    setChapaNotice('');
    setChapaElapsedSeconds(0);
    setChapaCheckoutUrl('');
    setFormData((prev) => ({ ...prev, payment_reference: '' }));
  };

  const handleRegisterSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setRegisterError('');
    const errors = validateMemberForm(formData, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstErr = Object.values(errors)[0];
      setRegisterError(firstErr || 'Please review and fix the highlighted form errors before proceeding.');
      setNotification({
        type: 'danger',
        message: firstErr || 'Please review and fix the highlighted form errors before proceeding.',
      });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      // 0. Pre-validate phone and email uniqueness with server
      try {
        const contactCheck = await apiClient.checkContactAvailability({
          phone: formData.phone?.trim() || undefined,
          email: formData.email?.trim() || undefined,
        });
        const conflictErrs = {};
        if (contactCheck.phone_taken) {
          conflictErrs.phone = contactCheck.phone_message || 'This phone number is already registered to another member.';
        }
        if (contactCheck.email_taken) {
          conflictErrs.email = contactCheck.email_message || 'This email address is already registered to another account.';
        }
        if (Object.keys(conflictErrs).length > 0) {
          setFormErrors(conflictErrs);
          const firstErr = Object.values(conflictErrs)[0];
          setRegisterError(firstErr);
          setNotification({ type: 'danger', message: firstErr });
          setIsSubmitting(false);
          return;
        }
      } catch (checkErr) {
        console.warn('Contact pre-check warning:', checkErr);
      }

      // 1. Create Member Profile
      const memberPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || undefined,
        blood_type: formData.blood_type || undefined,
        address: formData.address?.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name?.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || undefined,
        emergency_contact_relationship: formData.emergency_contact_relationship?.trim() || undefined,
        fitness_goals: formData.fitness_goals?.trim() || undefined,
        health_conditions: formData.health_conditions?.trim() || undefined,
      };

      const memberRes = await apiClient.createMember(memberPayload);
      const createdMember = memberRes.data || memberRes.member || memberRes;

      let createdSubscription = null;
      let createdPayment = null;
      const selectedPlan = membershipPlans.find((p) => String(p.id) === String(formData.membership_plan_id));

      // 2. If a membership plan was selected, create subscription
      const memberUserId = createdMember.user_id || createdMember.id;
      if (formData.membership_plan_id && memberUserId) {
        try {
          const subRes = await apiClient.createSubscription({
            member_id: memberUserId,
            membership_plan_id: Number(formData.membership_plan_id),
            start_date: formData.start_date || new Date().toISOString().split('T')[0],
          });
          createdSubscription = subRes.data || subRes;

          // 3. If immediate payment was selected (not pay_later), record payment
          if (formData.payment_method !== 'pay_later' && createdSubscription?.id) {
            const payAmount = Number(formData.payment_amount) || Number(selectedPlan?.price) || 0;
            const paymentPayload = {
              user_id: memberUserId,
              subscription_id: createdSubscription.id,
              amount: payAmount,
              payment_method: formData.payment_method,
              payment_type: 'subscription',
              status: 'completed',
              notes: `Front-desk registration & plan activation: ${selectedPlan?.name || 'Membership'}`,
            };
            if (formData.payment_reference) {
              paymentPayload.gateway_reference = formData.payment_reference.trim();
            }
            const paymentRes = await apiClient.createPayment(paymentPayload);
            createdPayment = paymentRes.data || paymentRes;
          }
        } catch (subErr) {
          console.error('Subscription/Payment processing notice:', subErr);
        }
      }

      setNotification({
        type: 'success',
        message: `Member "${formData.name}" successfully registered & digital QR pass generated!`,
      });
      setIsRegisterOpen(false);

      // Open Digital Pass & Receipt Modal
      setRegisteredMemberPass({
        member: createdMember,
        subscription: createdSubscription,
        payment: createdPayment,
        plan: selectedPlan,
        paymentMethod: formData.payment_method,
        paymentReference: formData.payment_reference || chapaTxRef,
        chapaProvider: chapaProvider,
        chapaPayerPhone: chapaPayerPhone || formData.phone,
        officerName: user?.name || 'Reception Staff',
        issuedAt: new Date().toISOString(),
      });
      setPassModalTab(createdPayment ? 'receipt' : 'pass');

      setFormData(initialFormData);
      setRegisterError('');
      stopChapaTimers();
      setChapaStatus('idle');
      setChapaTxRef('');
      setChapaNotice('');
      setChapaElapsedSeconds(0);
      fetchMembers();
    } catch (err) {
      console.error('Registration submission error:', err);
      const rawErrors = err.errors || err.data?.errors;
      if (rawErrors) {
        const normalized = {};
        for (const [key, val] of Object.entries(rawErrors)) {
          normalized[key] = Array.isArray(val) ? val[0] : String(val);
        }
        setFormErrors(normalized);
        const firstErr = Object.values(normalized)[0];
        setRegisterError(firstErr || err.message || 'Validation failed. Please verify form fields.');
        setNotification({ type: 'danger', message: firstErr || err.message || 'Validation failed.' });
      } else {
        const msg = err.message || 'Failed to register member. Please check form fields and try again.';
        setRegisterError(msg);
        setNotification({ type: 'danger', message: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    const errors = validateMemberForm(formData, false);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setNotification({
        type: 'danger',
        message: 'Please review and fix the highlighted form errors.',
      });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const editPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || undefined,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || null,
        blood_type: formData.blood_type ? formData.blood_type.toUpperCase().trim() : null,
        address: formData.address?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || null,
        emergency_contact_relationship: formData.emergency_contact_relationship?.trim() || null,
        fitness_goals: formData.fitness_goals?.trim() || null,
        health_conditions: formData.health_conditions?.trim() || null,
      };

      const res = await apiClient.updateMember(editingMember.id, editPayload);
      setNotification({
        type: 'success',
        message: res.message || `Member ${editingMember.name} updated successfully!`,
      });
      if (res.member) {
        setMembers((prev) => prev.map((item) => item.id === editingMember.id ? { ...item, ...res.member } : item));
        if (selectedMember && selectedMember.id === editingMember.id) {
          setSelectedMember(res.member);
        }
      }
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      console.error('Member edit error:', err);
      const rawErrors = err.errors || err.data?.errors;
      if (rawErrors) {
        const normalized = {};
        for (const [key, val] of Object.entries(rawErrors)) {
          normalized[key] = Array.isArray(val) ? val[0] : String(val);
        }
        setFormErrors(normalized);
        const firstErr = Object.values(normalized)[0];
        setNotification({ type: 'danger', message: firstErr || err.message || 'Validation failed. Please verify form fields.' });
      } else {
        const msg = err.data?.message || err.message || 'Failed to update member';
        setNotification({ type: 'danger', message: msg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setFormErrors({});
    setFormData({
      name: m.name || '',
      phone: m.phone || '',
      email: m.email && !m.email.includes('@members.tigatgym.com') ? m.email : '',
      gender: m.gender || 'male',
      date_of_birth: m.date_of_birth ? m.date_of_birth.slice(0, 10) : '',
      blood_type: m.blood_type ? m.blood_type.toUpperCase() : '',
      address: m.address || '',
      emergency_contact_name: m.emergency_contact_name || '',
      emergency_contact_phone: m.emergency_contact_phone || '',
      emergency_contact_relationship: m.emergency_contact_relationship || '',
      fitness_goals: m.fitness_goals || '',
      health_conditions: m.health_conditions || '',
    });
  };

  const handleRegenerateQr = async (memberId) => {
    if (!window.confirm('Regenerate QR identification token? The previous QR code will immediately be invalidated.')) {
      return;
    }
    try {
      const res = await apiClient.regenerateMemberQr(memberId);
      setNotification({ type: 'success', message: res.message || 'QR Token regenerated successfully.' });
      if (res.member) {
        setMembers((prev) => prev.map((item) => item.id === memberId ? { ...item, ...res.member } : item));
      }
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(res.member || { ...selectedMember, qr_code_token: res.qr_code_token });
      }
      fetchMembers();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to regenerate QR token.';
      setNotification({ type: 'danger', message: msg });
    }
  };

  const handleDeleteMember = async (m) => {
    if (!window.confirm(`Are you sure you want to remove member "${m.name}" (${m.member_code})?`)) {
      return;
    }
    try {
      const res = await apiClient.deleteMember(m.id);
      setNotification({ type: 'success', message: res.message || 'Member removed.' });
      fetchMembers();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to delete member.' });
    }
  };

  // Additional Table Features: Sorting, Instant Check-In, Context Menu & CSV/Excel Export
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [checkingInId, setCheckingInId] = useState(null);
  const [openMenuMemberId, setOpenMenuMemberId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Plan Renewal / Assignment Modal State
  const [renewingMember, setRenewingMember] = useState(null);
  const [renewForm, setRenewForm] = useState({
    membership_plan_id: '',
    start_date: '',
    notes: '',
  });
  const [isRenewSubmitting, setIsRenewSubmitting] = useState(false);
  const [renewErrors, setRenewErrors] = useState({});

  const handleOpenRenewModal = async (m) => {
    setRenewingMember(m);
    setRenewErrors({});

    let plans = membershipPlans;
    if (!plans || plans.length === 0) {
      try {
        const fetched = await apiClient.getMembershipPlans({ active_only: 1 });
        plans = fetched.data || (Array.isArray(fetched) ? fetched : []);
        setMembershipPlans(plans);
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    }

    let defaultPlanId = '';
    if (m.active_subscription?.membership_plan_id) {
      defaultPlanId = String(m.active_subscription.membership_plan_id);
    } else if (m.active_subscription?.plan_name && plans && plans.length > 0) {
      const match = plans.find((p) => p.name === m.active_subscription.plan_name);
      if (match) defaultPlanId = String(match.id);
    }
    if (!defaultPlanId && plans && plans.length > 0) {
      defaultPlanId = String(plans[0].id);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    let startDate = todayStr;
    if (m.active_subscription?.end_date) {
      const currentEnd = new Date(m.active_subscription.end_date);
      const today = new Date();
      if (currentEnd > today) {
        const nextDay = new Date(currentEnd);
        nextDay.setDate(nextDay.getDate() + 1);
        startDate = nextDay.toISOString().slice(0, 10);
      }
    }

    setRenewForm({
      membership_plan_id: defaultPlanId,
      start_date: startDate,
      notes: '',
    });
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewingMember) return;
    if (!renewForm.membership_plan_id) {
      setRenewErrors({ membership_plan_id: 'Please select a membership plan.' });
      return;
    }

    setIsRenewSubmitting(true);
    setRenewErrors({});

    const selectedPlan = membershipPlans.find(p => String(p.id) === String(renewForm.membership_plan_id));

    try {
      const payload = {
        member_id: renewingMember.user_id || renewingMember.id,
        membership_plan_id: Number(renewForm.membership_plan_id),
        start_date: renewForm.start_date || undefined,
        discount: 0,
        notes: renewForm.notes?.trim() || `Renewed via Member Directory: ${selectedPlan?.name || 'Membership Plan'}`,
      };

      const res = await apiClient.createSubscription(payload);
      const newSubData = res.data || res;
      setNotification({
        type: 'success',
        message: `🎉 Membership plan (${selectedPlan?.name || 'Active'}) successfully assigned to ${renewingMember.name}!`,
      });

      // Safely update state without overwriting memberProfile id with user id
      setMembers((prev) => prev.map((item) => {
        if (item.id === renewingMember.id) {
          return {
            ...item,
            status: 'active',
            active_subscription: {
              id: newSubData?.id,
              subscription_number: newSubData?.subscription_number,
              membership_plan_id: selectedPlan?.id || newSubData?.membership_plan_id,
              plan_name: selectedPlan?.name || newSubData?.plan?.name,
              start_date: newSubData?.start_date,
              end_date: newSubData?.end_date,
              status: 'active',
            },
          };
        }
        return item;
      }));

      if (selectedMember && selectedMember.id === renewingMember.id) {
        setSelectedMember((prev) => ({
          ...prev,
          status: 'active',
          active_subscription: {
            id: newSubData?.id,
            subscription_number: newSubData?.subscription_number,
            membership_plan_id: selectedPlan?.id || newSubData?.membership_plan_id,
            plan_name: selectedPlan?.name || newSubData?.plan?.name,
            start_date: newSubData?.start_date,
            end_date: newSubData?.end_date,
            status: 'active',
          },
        }));
      }

      setRenewingMember(null);
      fetchMembers();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Failed to renew plan';
      if (err.data?.errors) {
        setRenewErrors(err.data.errors);
      }
      setNotification({
        type: 'danger',
        message: `⚠️ Plan renewal failed: ${msg}`,
      });
    } finally {
      setIsRenewSubmitting(false);
    }
  };

  // Close floating dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuMemberId(null);
      setShowExportMenu(false);
    };
    if (openMenuMemberId !== null || showExportMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuMemberId, showExportMenu]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Instant 1-Click Check-In from Table
  const handleQuickCheckIn = async (member) => {
    if (!member) return;
    setCheckingInId(member.id);
    try {
      await apiClient.checkIn({
        member_id: member.user_id || member.id,
        member_code: member.member_code,
        qr_token: member.qr_code_token,
        method: 'manual_reception',
      });
      setNotification({
        type: 'success',
        message: `✅ ${member.name} (${member.member_code}) checked in successfully for today's workout!`,
      });
      fetchMembers();
    } catch (err) {
      const msg = err.data?.message || err.message || 'Check-in failed';
      setNotification({
        type: 'danger',
        message: `⚠️ Check-in failed for ${member.name}: ${msg}`,
      });
    } finally {
      setCheckingInId(null);
    }
  };

  // Universal Export Handler: Supports Native Microsoft Excel (.xlsx) & CSV (.csv) across all members/pages
  const handleExportData = async (format = 'excel') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      // 1. Fetch all members with all: 1 and high per_page matching active filters
      const res = await apiClient.getMembers({
        search: search?.trim() || undefined,
        status: statusFilter || undefined,
        gender: genderFilter || undefined,
        all: 1,
        per_page: 10000,
      });

      let allMembersList = [];
      if (Array.isArray(res?.data)) {
        allMembersList = [...res.data];
      } else if (Array.isArray(res)) {
        allMembersList = [...res];
      }

      // 2. Fail-safe pagination fallback if the backend returned paginated pages
      if (res?.last_page && res.last_page > 1 && res.current_page === 1) {
        for (let p = 2; p <= res.last_page; p++) {
          try {
            const pageRes = await apiClient.getMembers({
              search: search?.trim() || undefined,
              status: statusFilter || undefined,
              gender: genderFilter || undefined,
              page: p,
              per_page: res.per_page || 15,
            });
            if (Array.isArray(pageRes?.data)) {
              allMembersList.push(...pageRes.data);
            }
          } catch (pageErr) {
            console.warn(`Could not fetch export page ${p}:`, pageErr);
          }
        }
      }

      // Fallback to loaded members in state if API returned empty
      if (allMembersList.length === 0 && members && members.length > 0) {
        allMembersList = [...members];
      }

      if (allMembersList.length === 0) {
        setNotification({ type: 'warning', message: 'No members available to export.' });
        return;
      }

      const dateStamp = new Date().toISOString().split('T')[0];

      if (format === 'excel') {
        // Native Microsoft Excel (.xlsx) Workbook export
        const XLSX = await import('xlsx');
        const excelRows = allMembersList.map((m) => ({
          'Member Code': m.member_code || '',
          'Full Name': m.name || '',
          'Phone': m.phone || '',
          'Email': m.email || '',
          'Gender': m.gender ? (m.gender.charAt(0).toUpperCase() + m.gender.slice(1)) : '',
          'Status': m.status ? (m.status.charAt(0).toUpperCase() + m.status.slice(1)) : '',
          'Active Plan': m.active_subscription?.plan_name || 'Standard',
          'Expiry Date': m.active_subscription?.end_date || m.card_expires_at || '',
          'Blood Type': m.blood_type || '',
          'Emergency Contact': m.emergency_contact_name || '',
          'Emergency Phone': m.emergency_contact_phone || '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelRows);

        // Auto-configure column widths for pristine Excel presentation
        worksheet['!cols'] = [
          { wch: 15 }, // Member Code
          { wch: 25 }, // Full Name
          { wch: 18 }, // Phone
          { wch: 30 }, // Email
          { wch: 12 }, // Gender
          { wch: 12 }, // Status
          { wch: 20 }, // Active Plan
          { wch: 15 }, // Expiry Date
          { wch: 12 }, // Blood Type
          { wch: 22 }, // Emergency Contact
          { wch: 18 }, // Emergency Phone
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tigat Gym Members');
        XLSX.writeFile(workbook, `tigat_gym_all_members_${dateStamp}.xlsx`);

        setNotification({
          type: 'success',
          message: `Successfully exported all ${allMembersList.length} members to Microsoft Excel (.xlsx)!`,
        });
      } else {
        // Excel-compatible CSV with UTF-8 BOM
        const headers = [
          'Member Code',
          'Full Name',
          'Phone',
          'Email',
          'Gender',
          'Status',
          'Plan',
          'Expiry Date',
          'Blood Type',
          'Emergency Contact',
          'Emergency Phone',
        ];

        const rows = allMembersList.map((m) => [
          `"${m.member_code || ''}"`,
          `"${(m.name || '').replace(/"/g, '""')}"`,
          `"${m.phone || ''}"`,
          `"${m.email || ''}"`,
          `"${m.gender || ''}"`,
          `"${m.status || ''}"`,
          `"${m.active_subscription?.plan_name || 'Standard'}"`,
          `"${m.active_subscription?.end_date || m.card_expires_at || ''}"`,
          `"${m.blood_type || ''}"`,
          `"${(m.emergency_contact_name || '').replace(/"/g, '""')}"`,
          `"${m.emergency_contact_phone || ''}"`,
        ]);

        // Prepend UTF-8 BOM '\uFEFF' so Excel automatically opens CSV in proper UTF-8
        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `tigat_gym_all_members_${dateStamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setNotification({
          type: 'success',
          message: `Successfully exported all ${allMembersList.length} members to CSV!`,
        });
      }
    } catch (err) {
      setNotification({
        type: 'danger',
        message: `Export failed: ${err.message || 'Unknown error occurred'}`,
      });
    } finally {
      setIsExporting(false);
    }
  };


  const sortedMembers = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortField === 'status') {
        valA = (a.status || '').toLowerCase();
        valB = (b.status || '').toLowerCase();
      } else if (sortField === 'expiry') {
        valA = a.active_subscription?.end_date || a.card_expires_at || '';
        valB = b.active_subscription?.end_date || b.card_expires_at || '';
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [members, sortField, sortDir]);

  const getExpiryMeta = (m) => {
    if (!m.active_subscription?.end_date) {
      return { text: 'NO ACTIVE PLAN', isExpired: true, date: '—', color: 'text-muted' };
    }
    const end = new Date(m.active_subscription.end_date);
    const formattedDate = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

    let diffDays;
    if (typeof m.active_subscription.days_remaining === 'number') {
      diffDays = m.active_subscription.days_remaining;
    } else {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      diffDays = Math.ceil((endDay - today) / 86400000);
    }

    if (diffDays <= 0) {
      return {
        text: diffDays === 0 ? 'EXPIRES TODAY' : `EXPIRED ${Math.abs(diffDays)}D AGO`,
        isExpired: diffDays < 0,
        date: formattedDate,
        color: diffDays === 0 ? 'text-warning' : 'text-red'
      };
    }
    return { text: `IN ${diffDays} DAYS`, isExpired: false, date: formattedDate, color: 'text-green' };
  };

  return (
    <div className="member-directory-container gymflow-view">
      {/* Header Action Bar matching Dashboard */}
      <section className="clean-dash-header-row" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="clean-dash-title">Membership Management</h1>
        </div>
        {isStaff && (
          <div className="clean-dash-actions">
            <button
              type="button"
              className="btn-clean-add-member"
              onClick={() => setIsRegisterOpen(true)}
              title="Register a new member at reception desk"
            >
              <Icons.UserPlus size={15} />
              <span>+ Add New Member</span>
            </button>
          </div>
        )}
      </section>

      {/* 4 Top Stat KPI Cards (Unified Clean TigatGym Design) */}
      <div className="clean-kpi-grid" style={{ marginBottom: 20 }}>
        {/* Card 1: Total Members */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Total Members</span>
            <div className="clean-kpi-icon" title="Total Members">
              <Icons.Users size={16} />
            </div>
          </div>
          <div className="kpi-value">{totalMembers || members.length || 0}</div>
          <span className="kpi-trend trend-positive">+4.5% this month</span>
        </div>

        {/* Card 2: Expiring Soon */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Expiring Soon</span>
            <div className="clean-kpi-icon" title="Expiring Soon">
              <Icons.Clock size={16} />
            </div>
          </div>
          <div className="kpi-value">0</div>
          <span className="kpi-trend" style={{ color: '#64748b' }}>Next 7 days</span>
        </div>

        {/* Card 3: At-Risk */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">At-Risk Members</span>
            <div className="clean-kpi-icon" title="At-Risk Members">
              <Icons.AlertTriangle size={16} />
            </div>
          </div>
          <div className="kpi-value">2</div>
          <span className="kpi-trend trend-negative">Overdue 14+ days</span>
        </div>

        {/* Card 4: Total Dues */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Total Dues</span>
            <div className="clean-kpi-icon" title="Total Dues">
              <Icons.CreditCard size={16} />
            </div>
          </div>
          <div className="kpi-value">0 ETB</div>
          <span className="kpi-trend trend-positive">All accounts settled</span>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`alert alert-${notification.type}`} role="alert" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          {notification.type === 'danger' ? <Icons.AlertTriangle size={16} /> : <Icons.CheckCircle size={16} />}
          <span>{notification.message}</span>
          <button type="button" className="btn-dismiss" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Search & Filter Controls Toolbar matching Image 1 */}
      <div className="gymflow-controls-bar">
        {/* Search Input matching Membership search bar perfectly */}
        <div className="search-bar-wrapper" style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="form-input search-input-field"
            placeholder="Search by name, phone, reg no, plan, or status..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              paddingLeft: 36,
              paddingRight: search ? 34 : 14,
              width: '100%',
              height: 42,
              minHeight: 42,
              boxSizing: 'border-box',
              fontSize: 13.5,
              borderRadius: 8,
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPage(1); }}
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

        {/* Filter Toggle Button */}
        <button
          type="button"
          className={`gymflow-filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle advanced status and gender filters"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>FILTERS</span>
        </button>

        {/* Modern Interactive Export Pill & Popover */}
        <div style={{ position: 'relative' }}>
          <div className={`gymflow-export-pill ${showExportMenu ? 'active' : ''}`}>
            {/* Primary Action Button: Immediately downloads Excel (.xlsx) */}
            <button
              type="button"
              className="gymflow-export-action-btn"
              onClick={() => handleExportData('excel')}
              disabled={isExporting}
              title="Download all members in Microsoft Excel (.xlsx)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isExporting ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{isExporting ? 'EXPORTING...' : 'EXPORT'}</span>
              <span className="gymflow-export-format-tag">XLSX</span>
            </button>

            {/* Toggle Dropdown Arrow */}
            <button
              type="button"
              className="gymflow-export-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowExportMenu((prev) => !prev);
              }}
              disabled={isExporting}
              title="Choose download format: Excel (.xlsx) or CSV"
            >
              <svg className={`export-chevron-icon ${showExportMenu ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Luxury Floating Popover */}
          {showExportMenu && (
            <div className="gymflow-export-popover" onClick={(e) => e.stopPropagation()}>
              <div className="export-popover-header">
                <span>EXPORT DIRECTORY</span>
                <span className="export-count-pill">{totalMembers || members.length} members</span>
              </div>

              {/* Option 1: Microsoft Excel */}
              <button
                type="button"
                className="export-format-tile tile-excel"
                onClick={() => handleExportData('excel')}
              >
                <div className="export-tile-icon icon-excel">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="16" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="export-tile-meta">
                  <div className="export-tile-title-row">
                    <span className="export-tile-title">Microsoft Excel</span>
                    <span className="export-badge-recommended">RECOMMENDED</span>
                  </div>
                  <div className="export-tile-desc">Formatted .xlsx workbook with auto-fitted columns</div>
                </div>
                <svg className="export-tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Option 2: CSV Spreadsheet */}
              <button
                type="button"
                className="export-format-tile tile-csv"
                onClick={() => handleExportData('csv')}
              >
                <div className="export-tile-icon icon-csv">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <div className="export-tile-meta">
                  <div className="export-tile-title-row">
                    <span className="export-tile-title">CSV Document</span>
                    <span className="export-badge-universal">UNIVERSAL</span>
                  </div>
                  <div className="export-tile-desc">UTF-8 BOM comma-separated spreadsheet (.csv)</div>
                </div>
                <svg className="export-tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div className="export-popover-footer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Exports all pages & applied filters in one single file</span>
              </div>
            </div>
          )}
        </div>

        {/* Table / Cards View Mode Switcher */}
        <div className="gymflow-view-switcher">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            TABLE
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Cards View"
          >
            CARDS
          </button>
        </div>
      </div>

      {/* Collapsible Filter Dropdowns */}
      {showFilters && (
        <div className="gymflow-expanded-filters">
          <div className="filter-group">
            <label>Status:</label>
            <select
              className="gymflow-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive / At-Risk</option>
              <option value="suspended">Suspended / Lost</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Gender:</label>
            <select
              className="gymflow-select"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Members View (Table Mode matching Image 1) */}
      {viewMode === 'table' ? (
        <div className="gymflow-table-wrapper">
          <table className="gymflow-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Member Name"
                >
                  MEMBER <span style={{ opacity: sortField === 'name' ? 1 : 0.4, fontSize: 11 }}>{sortField === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                </th>
                <th>
                  ENGAGEMENT
                  <span className="th-subtext">Green = checked in</span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Plan / Status"
                >
                  PLAN / STATUS <span style={{ opacity: sortField === 'status' ? 1 : 0.4, fontSize: 11 }}>{sortField === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                </th>
                <th
                  onClick={() => handleSort('expiry')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title="Click to sort by Expiry Date"
                >
                  EXPIRY <span style={{ opacity: sortField === 'expiry' ? 1 : 0.4, fontSize: 11 }}>{sortField === 'expiry' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
                </th>
                <th className="text-right" style={{ minWidth: 200 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <span className="spinner"></span> Loading registered members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No gym members found matching criteria.
                  </td>
                </tr>
              ) : (
                sortedMembers.map((m, idx) => {
                  const expiry = getExpiryMeta(m);
                  const initials = m.name?.charAt(0).toLowerCase() || 'm';

                  // Dynamic color tag for initial square
                  const avatarColors = ['#1e293b', '#d97706', '#0f766e', '#4338ca', '#be123c'];
                  const avatarBg = avatarColors[idx % avatarColors.length];

                  return (
                    <tr key={m.id}>
                      {/* Member Info: Square Initial Avatar + Name + Phone + ID */}
                      <td>
                        <div className="gymflow-member-cell">
                          <div
                            className="gymflow-avatar-square"
                            style={{ backgroundColor: avatarBg }}
                          >
                            {initials}
                          </div>
                          <div className="gymflow-member-meta">
                            <span className="member-name-text">{m.name}</span>
                            <span className="member-phone-text">{m.phone}</span>
                            <span className="member-id-text">{m.member_code || 'PENDING ID'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Engagement: 7 Dots + Relative Days */}
                      <td>
                        <div className="gymflow-engagement-cell">
                          <div className="engagement-dots">
                            {[1, 2, 3, 4, 5, 6, 7].map((dotIdx) => {
                              const isGreen = dotIdx <= 2; // Demo recent activity
                              return (
                                <span
                                  key={dotIdx}
                                  className={`eng-dot ${isGreen ? 'dot-active' : 'dot-muted'}`}
                                ></span>
                              );
                            })}
                          </div>
                          <span className="engagement-label">{idx % 2 === 0 ? '30D AGO' : '28D AGO'}</span>
                        </div>
                      </td>

                      {/* Plan / Status */}
                      <td>
                        <div className="gymflow-plan-cell">
                          <span className="plan-name-title">
                            {m.active_subscription?.plan_name || 'MONTHLY'}
                          </span>
                          <span className={`gymflow-status-pill pill-${m.status === 'active' ? 'active' : m.status === 'suspended' ? 'suspended' : m.status === 'inactive' ? 'at-risk' : 'lost'}`}>
                            • {m.status === 'active' ? 'ACTIVE' : m.status === 'suspended' ? 'SUSPENDED' : m.status === 'inactive' ? 'AT-RISK' : 'LOST'}
                          </span>
                          {m.status === 'suspended' && m.suspension_reason && (
                            <span
                              style={{
                                fontSize: 11,
                                color: '#ef4444',
                                fontWeight: 600,
                                display: 'block',
                                marginTop: 3,
                                maxWidth: 170,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={`Reason: ${m.suspension_reason}`}
                            >
                              ⚠️ {m.suspension_reason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td>
                        <div className="gymflow-expiry-cell">
                          <span className={`expiry-status-text ${expiry.color}`}>
                            {expiry.text}
                          </span>
                          <span className="expiry-date-text">
                            {expiry.date}
                          </span>
                        </div>
                      </td>

                      {/* Quick Action Buttons: Pass & 3-Dot Management */}
                      <td className="text-right">
                        <div className="gymflow-table-actions">
                          {/* QR Pass Button */}
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-pass"
                            onClick={() => setSelectedMember(m)}
                            title="View 1-Year Permanent Member Card & QR Pass"
                          >
                            <Icons.QrCode size={13} />
                            <span>Pass</span>
                          </button>

                          {/* 3. More Actions Dropdown Menu (No Duplicates) */}
                          <div className="gymflow-dropdown-wrap">
                            <button
                              type="button"
                              className={`btn-tbl-more ${openMenuMemberId === m.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuMemberId(openMenuMemberId === m.id ? null : m.id);
                              }}
                              title="More Management Actions"
                              aria-label="More actions"
                            >
                              ⋮
                            </button>

                            {openMenuMemberId === m.id && (
                              <div className="gymflow-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                {isStaff && (
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setOpenMenuMemberId(null);
                                      handleOpenEdit(m);
                                    }}
                                  >
                                    <Icons.Edit size={14} />
                                    <span>Edit Profile Details</span>
                                  </button>
                                )}

                                {isStaff && (
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setOpenMenuMemberId(null);
                                      handleOpenRenewModal(m);
                                    }}
                                  >
                                    <Icons.Refresh size={14} />
                                    <span>Renew / Assign Plan</span>
                                  </button>
                                )}

                                {isStaff && m.status === 'active' && (
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    disabled={checkingInId === m.id}
                                    onClick={() => {
                                      setOpenMenuMemberId(null);
                                      handleQuickCheckIn(m);
                                    }}
                                  >
                                    <Icons.CheckCircle size={14} />
                                    <span>{checkingInId === m.id ? 'Checking In...' : 'Quick Check-In'}</span>
                                  </button>
                                )}

                                {isStaff && (
                                  <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => {
                                      setOpenMenuMemberId(null);
                                      handleRegenerateQr(m.id);
                                    }}
                                  >
                                    <Icons.Zap size={14} />
                                    <span>Regenerate QR Token</span>
                                  </button>
                                )}

                                {isManagement && (
                                  <>
                                    <div className="dropdown-divider"></div>
                                    {m.status === 'suspended' ? (
                                      <button
                                        type="button"
                                        className="dropdown-item"
                                        style={{ color: '#16a34a' }}
                                        onClick={() => {
                                          setOpenMenuMemberId(null);
                                          handleReactivateMember(m);
                                        }}
                                      >
                                        <Icons.Check size={14} />
                                        <span>Reactivate Account</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className="dropdown-item"
                                        style={{ color: '#dc2626' }}
                                        onClick={() => {
                                          setOpenMenuMemberId(null);
                                          handlePromptSuspendMember(m);
                                        }}
                                      >
                                        <Icons.AlertTriangle size={14} />
                                        <span>Suspend Member</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="dropdown-item dropdown-item-danger"
                                      onClick={() => {
                                        setOpenMenuMemberId(null);
                                        handleDeleteMember(m);
                                      }}
                                    >
                                      <Icons.Trash size={14} />
                                      <span>Delete Member</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards Mode */
        <div className="gymflow-cards-grid">
          {sortedMembers.map((m, idx) => {
            const expiry = getExpiryMeta(m);
            const initials = m.name?.charAt(0).toLowerCase() || 'm';
            const avatarColors = ['#1e293b', '#d97706', '#0f766e', '#4338ca', '#be123c'];
            const avatarBg = avatarColors[idx % avatarColors.length];

            return (
              <div key={m.id} className="gymflow-card-item">
                <div className="card-item-top">
                  <div className="gymflow-avatar-square" style={{ backgroundColor: avatarBg }}>
                    {initials}
                  </div>
                  <div>
                    <h4 className="member-name-text">{m.name}</h4>
                    <span className="member-id-text">{m.member_code}</span>
                  </div>
                  <span className={`gymflow-status-pill pill-${m.status === 'active' ? 'active' : 'at-risk'}`}>
                    • {m.status?.toUpperCase()}
                  </span>
                </div>

                <div className="card-item-mid">
                  <div><strong>Phone:</strong> {m.phone}</div>
                  <div><strong>Plan:</strong> {m.active_subscription?.plan_name || 'Standard'}</div>
                  <div className={expiry.color}><strong>Expiry:</strong> {expiry.text}</div>
                </div>

                <div className="card-item-bottom">
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => setSelectedMember(m)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icons.QrCode size={13} /> QR Pass
                    </span>
                  </button>
                  {isStaff && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleOpenEdit(m)}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Icons.Edit size={13} /> Edit
                      </span>
                    </button>
                  )}
                  {isStaff && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleOpenRenewModal(m)}
                      title="Renew / Assign Plan"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Icons.Refresh size={13} /> Renew
                      </span>
                    </button>
                  )}
                  {isManagement && (
                    <button
                      type="button"
                      className="btn-action-icon btn-danger-icon"
                      onClick={() => handleDeleteMember(m)}
                      title="Delete member record"
                    >
                      <Icons.Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal 1: Register New Member (Non-Scrollable One-Page Layout) */}
      {isRegisterOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-wide modal-card-register-fit">
            <div className="modal-header-compact">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fff7ed', color: '#E67C00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.UserPlus size={15} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Register New Member</h3>
                  <span style={{ fontSize: 10.5, color: '#64748b' }}>Front-desk digital registration & instant pass issuance</span>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={() => setIsRegisterOpen(false)}>×</button>
            </div>

            <form onSubmit={handleRegisterSubmit} noValidate style={{ margin: 0 }}>
              {/* In-Modal Alert Banner for Immediate Visibility */}
              {registerError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #ef4444',
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#991b1b',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.12)',
                }}>
                  <Icons.AlertCircle size={16} style={{ flexShrink: 0, color: '#dc2626' }} />
                  <span style={{ flex: 1 }}>{registerError}</span>
                  <button
                    type="button"
                    onClick={() => setRegisterError('')}
                    style={{ background: 'transparent', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
                    title="Dismiss alert"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="reg-form-grid">
                {/* Column 1: Member Profile & Emergency Details */}
                <div className="reg-form-col">
                  <div className="reg-section-badge">
                    <Icons.CheckCircle size={12} />
                    <span>1. Member Profile & Identity</span>
                  </div>

                  {/* Full Name & Phone */}
                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <label>Full Name <span style={{ color: '#E67C00' }}>*</span></label>
                      <input
                        type="text"
                        required
                        className={`reg-control ${formErrors.name ? 'input-error' : ''}`}
                        placeholder="e.g. Abebe Bikila"
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        onBlur={() => handleFieldBlur('name')}
                      />
                      {formErrors.name && <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.name}</span>}
                    </div>

                    <div className="reg-form-group">
                      <label>Phone Number <span style={{ color: '#E67C00' }}>*</span></label>
                      <input
                        type="text"
                        required
                        className={`reg-control ${formErrors.phone ? 'input-error' : ''}`}
                        placeholder="09... or +2519..."
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        onBlur={() => handleFieldBlur('phone')}
                      />
                      {formErrors.phone && <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.phone}</span>}
                    </div>
                  </div>

                  {/* Email & Gender */}
                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className={`reg-control ${formErrors.email ? 'input-error' : ''}`}
                        placeholder="member@email.com"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                      />
                      {formErrors.email && <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.email}</span>}
                    </div>

                    <div className="reg-form-group">
                      <label>Gender</label>
                      <select
                        className="reg-control"
                        value={formData.gender}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* DOB & Residential Address */}
                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Date of Birth</label>
                        {formData.date_of_birth && !formErrors.date_of_birth && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <Icons.Check size={10} /> Age: {calculateAge(formData.date_of_birth)} yrs
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        className={`reg-control ${formErrors.date_of_birth ? 'input-error' : ''}`}
                        max={maxDobString}
                        min="1920-01-01"
                        value={formData.date_of_birth}
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                        onBlur={() => handleFieldBlur('date_of_birth')}
                        onClick={(e) => openDatePicker(e.currentTarget)}
                        style={{ cursor: 'pointer' }}
                        title="Click to select birth date"
                      />
                      {formErrors.date_of_birth && <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.date_of_birth}</span>}
                    </div>

                    <div className="reg-form-group">
                      <label>Residential Address</label>
                      <input
                        type="text"
                        className="reg-control"
                        placeholder="e.g. Bole, Addis Ababa"
                        value={formData.address}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="reg-section-badge" style={{ marginTop: 3 }}>
                    <span>Emergency Contact</span>
                  </div>
                  <div className="reg-form-row-3">
                    <div className="reg-form-group">
                      <label>Contact Name</label>
                      <input
                        type="text"
                        className="reg-control"
                        placeholder="e.g. Almaz Bekele"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                      />
                    </div>
                    <div className="reg-form-group">
                      <label>Contact Phone</label>
                      <input
                        type="text"
                        className={`reg-control ${formErrors.emergency_contact_phone ? 'input-error' : ''}`}
                        placeholder="09... or +251..."
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                        onBlur={() => handleFieldBlur('emergency_contact_phone')}
                      />
                      {formErrors.emergency_contact_phone && <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.emergency_contact_phone}</span>}
                    </div>
                    <div className="reg-form-group">
                      <label>Relationship</label>
                      <input
                        type="text"
                        className="reg-control"
                        placeholder="e.g. Spouse, Parent"
                        value={formData.emergency_contact_relationship}
                        onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Health Notes */}
                  <div className="reg-section-badge" style={{ marginTop: 3 }}>
                    <span>Fitness Goals & Health Notes</span>
                  </div>
                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <label>Fitness Goals</label>
                      <input
                        type="text"
                        className="reg-control"
                        placeholder="e.g. Fat loss, muscle hypertrophy"
                        value={formData.fitness_goals}
                        onChange={(e) => handleFieldChange('fitness_goals', e.target.value)}
                      />
                    </div>
                    <div className="reg-form-group">
                      <label>Medical Restrictions</label>
                      <input
                        type="text"
                        className="reg-control"
                        placeholder="e.g. Knee injury, asthma (confidential)"
                        value={formData.health_conditions}
                        onChange={(e) => handleFieldChange('health_conditions', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Membership Plan, Payment Reception & Pass Issuance */}
                <div className="reg-form-col">
                  <div className="reg-section-badge" style={{ color: '#E67C00' }}>
                    <Icons.CreditCard size={12} />
                    <span>2. Membership Plan & Payment</span>
                  </div>

                  <div className="reg-payment-card">
                    {/* Select Plan */}
                    <div className="reg-form-group">
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
                        Select Membership Plan <span style={{ color: '#E67C00' }}>*</span>
                      </label>
                      <select
                        className={`reg-control ${formErrors.membership_plan_id ? 'input-error' : ''}`}
                        value={formData.membership_plan_id}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const selected = membershipPlans.find((p) => String(p.id) === String(pId));
                          setFormData((prev) => ({
                            ...prev,
                            membership_plan_id: pId,
                            payment_amount: selected ? String(selected.price) : '',
                          }));
                          if (formErrors.membership_plan_id) {
                            setFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.membership_plan_id;
                              return next;
                            });
                          }
                        }}
                        style={{
                          borderColor: formErrors.membership_plan_id ? '#ef4444' : '#E67C00',
                          fontWeight: 600,
                          backgroundColor: formErrors.membership_plan_id ? '#fff5f5' : undefined,
                        }}
                      >
                        <option value="">-- Choose a Membership Plan (Required) --</option>
                        {membershipPlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} — {Number(plan.price).toLocaleString()} ETB ({plan.duration_value} {plan.duration_type}{plan.duration_value > 1 ? 's' : ''})
                          </option>
                        ))}
                      </select>
                      {formErrors.membership_plan_id && (
                        <span className="form-error-text" style={{ fontSize: 10.5, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Icons.AlertCircle size={11} /> {formErrors.membership_plan_id}
                        </span>
                      )}
                    </div>

                    {formData.membership_plan_id && (
                      <>
                        {/* Price & Start Date */}
                        <div className="reg-form-row-2">
                          <div className="reg-form-group">
                            <label>Package Price (ETB)</label>
                            <input
                              type="number"
                              className={`reg-control ${formErrors.payment_amount ? 'input-error' : ''}`}
                              value={formData.payment_amount}
                              onChange={(e) => handleFieldChange('payment_amount', e.target.value)}
                              onBlur={() => handleFieldBlur('payment_amount')}
                              placeholder="Price in ETB"
                              style={{ fontWeight: 700, color: '#E67C00' }}
                            />
                            {formErrors.payment_amount && (
                              <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.payment_amount}</span>
                            )}
                          </div>

                          <div className="reg-form-group">
                            <label>Plan Start Date</label>
                            <input
                              type="date"
                              min={minStartDateString}
                              max={maxStartDateString}
                              className={`reg-control ${formErrors.start_date ? 'input-error' : ''}`}
                              value={formData.start_date}
                              onChange={(e) => handleFieldChange('start_date', e.target.value)}
                              onBlur={() => handleFieldBlur('start_date')}
                              onClick={(e) => openDatePicker(e.currentTarget)}
                              style={{ cursor: 'pointer' }}
                              title="Click to select start day"
                            />
                            {formErrors.start_date && (
                              <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.start_date}</span>
                            )}
                          </div>
                        </div>

                        {/* Payment Method Toggle (Cash vs Chapa) */}
                        <div className="reg-form-group">
                          <label style={{ fontSize: 11, fontWeight: 700 }}>
                            Payment Method <span style={{ color: '#E67C00' }}>*</span>
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                            {[
                              { id: 'cash', label: 'Cash (Desk Drawer)', icon: <Icons.Cash size={14} /> },
                              { id: 'chapa', label: 'Chapa Pay', icon: <Icons.Zap size={14} /> },
                            ].map((m) => (
                              <label
                                key={m.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '6px 10px',
                                  borderRadius: 7,
                                  background: formData.payment_method === m.id ? '#fff7ed' : '#ffffff',
                                  border: formData.payment_method === m.id ? '2px solid #E67C00' : '1px solid #cbd5e1',
                                  cursor: 'pointer',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  color: formData.payment_method === m.id ? '#E67C00' : '#475569',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <input
                                  type="radio"
                                  name="reg_payment_method"
                                  value={m.id}
                                  checked={formData.payment_method === m.id}
                                  onChange={() => handleFieldChange('payment_method', m.id)}
                                  style={{ display: 'none' }}
                                />
                                <span style={{ display: 'inline-flex', alignItems: 'center' }}>{m.icon}</span>
                                <span>{m.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* If Chapa: Direct Mobile Money & USSD PIN Push (Dimket Style) */}
                        {formData.payment_method === 'chapa' && (
                          <div style={{
                            background: '#faf5ff',
                            border: '1.5px solid #d8b4fe',
                            borderRadius: 10,
                            padding: 12,
                            marginTop: 10,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: '#6b21a8' }}>
                                <Icons.Zap size={14} />
                                <span>Chapa Direct Mobile Money</span>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f3e8ff', color: '#7e22ce' }}>
                                USSD PIN Push
                              </span>
                            </div>

                            {/* Provider Channel Pills */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                              {CHAPA_PROVIDERS.map((prov) => (
                                <button
                                  key={prov.id}
                                  type="button"
                                  onClick={() => {
                                    setChapaProvider(prov.id);
                                    if (chapaStatus === 'verified') setChapaStatus('idle');
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 2,
                                    padding: '6px 4px',
                                    borderRadius: 6,
                                    background: chapaProvider === prov.id ? '#ffffff' : '#f5f3ff',
                                    border: chapaProvider === prov.id ? `2px solid ${prov.color}` : '1px solid #e9d5ff',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    textAlign: 'center',
                                  }}
                                >
                                  <span style={{ fontSize: 13 }}>{prov.icon}</span>
                                  <span style={{ fontSize: 10.5, fontWeight: 800, color: chapaProvider === prov.id ? prov.color : '#4b5563' }}>
                                    {prov.name}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {/* Payer Phone Input */}
                            <div className="reg-form-group" style={{ marginBottom: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, color: '#374151', marginBottom: 3 }}>
                                <label>Payer Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <span style={{ color: '#6b21a8' }}>
                                  {CHAPA_PROVIDERS.find(p => p.id === chapaProvider)?.badge}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input
                                  type="text"
                                  className="reg-control"
                                  placeholder="09... or 07..."
                                  value={chapaPayerPhone || formData.phone}
                                  onChange={(e) => setChapaPayerPhone(e.target.value)}
                                  disabled={chapaStatus === 'verified' || chapaStatus === 'push_sent' || chapaIsLoading}
                                  style={{ height: 32, fontSize: 11.5, fontWeight: 600 }}
                                />
                                {chapaStatus === 'idle' && (
                                  <button
                                    type="button"
                                    onClick={handleChapaSendPush}
                                    disabled={chapaIsLoading || !formData.payment_amount}
                                    className="btn btn-primary"
                                    style={{
                                      height: 32,
                                      padding: '0 12px',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      whiteSpace: 'nowrap',
                                      background: '#7e22ce',
                                      borderColor: '#7e22ce',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}
                                  >
                                    {chapaIsLoading ? 'Sending...' : '⚡ Send Push to Phone'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* STEP 2: USSD Prompt Sent & Automatic Detection Flow */}
                            {chapaStatus === 'push_sent' && (
                              <div style={{
                                background: '#fdf4ff',
                                border: '1.5px solid #d946ef',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 10,
                                textAlign: 'left',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                                  <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: '#fae8ff',
                                    color: '#a21caf',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    <Icons.Zap size={18} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div style={{ fontSize: 12, fontWeight: 800, color: '#701a75' }}>
                                        USSD Push Sent to Member's Phone!
                                      </div>
                                      <span style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        background: '#f5d0fe',
                                        color: '#86198f',
                                        padding: '2px 7px',
                                        borderRadius: 10,
                                      }}>
                                        Waiting: {chapaElapsedSeconds}s
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: '#4a044e', marginTop: 3, lineHeight: 1.4 }}>
                                      USSD push prompt sent to <strong>{chapaPayerPhone || formData.phone}</strong> via <strong>{chapaProvider.toUpperCase()}</strong>.
                                    </div>
                                    <div style={{ fontSize: 10.5, color: '#86198f', marginTop: 4, fontStyle: 'italic', background: 'rgba(255, 255, 255, 0.7)', padding: '5px 8px', borderRadius: 4, border: '1px solid #f0abfc' }}>
                                      🔒 Member enters their secret PIN/password on their mobile device. The system will <strong>automatically</strong> verify success when approved!
                                    </div>
                                  </div>
                                </div>

                                {/* Chapa Hosted Checkout & Verification Controls */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px dashed #e879f9' }}>
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
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        boxShadow: '0 2px 8px rgba(230, 124, 0, 0.3)',
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
                                      borderRadius: 6,
                                      padding: '6px 10px',
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
                                      fontSize: 10.5,
                                      fontWeight: 600,
                                      background: '#fee2e2',
                                      color: '#b91c1c',
                                      border: '1px solid #fca5a5',
                                      borderRadius: 6,
                                      padding: '6px 9px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* STEP 3: Verified Status Banner */}
                            {chapaStatus === 'verified' && (
                              <div style={{
                                background: '#ecfdf5',
                                border: '1.5px solid #10b981',
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icons.Check size={14} />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#065f46' }}>
                                      Payment Authorized Automatically!
                                    </div>
                                    <div style={{ fontSize: 10.5, color: '#047857' }}>
                                      Member confirmed on phone • Ref: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formData.payment_reference || chapaTxRef}</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleChapaReset}
                                  style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: 10.5, cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  Change
                                </button>
                              </div>
                            )}

                            {/* STEP 4: Notice to Desk if Member Cancels */}
                            {chapaStatus === 'cancelled' && (
                              <div style={{
                                background: '#fef2f2',
                                border: '1.5px solid #ef4444',
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 8,
                                textAlign: 'left',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icons.AlertTriangle size={14} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#991b1b' }}>
                                      Notice: Member Cancelled Payment on Phone
                                    </div>
                                    <div style={{ fontSize: 10.5, color: '#b91c1c', marginTop: 2, lineHeight: 1.4 }}>
                                      {chapaNotice || 'The member cancelled or rejected the payment prompt on their phone. No money was deducted.'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                      <button
                                        type="button"
                                        onClick={handleChapaSendPush}
                                        className="btn btn-sm"
                                        style={{
                                          fontSize: 10.5,
                                          fontWeight: 700,
                                          background: '#7e22ce',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: 5,
                                          padding: '4px 10px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        🔁 Retry Push
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleChapaReset();
                                          setFormData((prev) => ({ ...prev, payment_method: 'cash' }));
                                        }}
                                        className="btn btn-sm"
                                        style={{
                                          fontSize: 10.5,
                                          fontWeight: 700,
                                          background: '#16a34a',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: 5,
                                          padding: '4px 10px',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        💵 Switch to Cash
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleChapaReset}
                                        style={{
                                          fontSize: 10.5,
                                          color: '#64748b',
                                          background: 'transparent',
                                          border: 'none',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Dismiss
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Manual Reference Toggle (Optional fallback) */}
                            <div style={{ textAlign: 'right', marginTop: 4 }}>
                              <button
                                type="button"
                                onClick={() => setChapaManualMode(!chapaManualMode)}
                                style={{ border: 'none', background: 'transparent', color: '#7e22ce', fontSize: 10, cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                {chapaManualMode ? 'Hide manual reference' : 'Have manual Chapa receipt code?'}
                              </button>
                            </div>
                            {chapaManualMode && (
                              <div style={{ marginTop: 6 }}>
                                <input
                                  type="text"
                                  className={`reg-control ${formErrors.payment_reference ? 'input-error' : ''}`}
                                  placeholder="e.g. CHP-tx-123456"
                                  value={formData.payment_reference}
                                  onChange={(e) => handleFieldChange('payment_reference', e.target.value)}
                                  style={{ height: 30, fontSize: 11 }}
                                />
                              </div>
                            )}
                            {formErrors.payment_reference && chapaStatus !== 'verified' && (
                              <span className="form-error-text" style={{ fontSize: 10.5, marginTop: 4 }}>
                                <Icons.AlertCircle size={11} /> {formErrors.payment_reference}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Instant Summary Pill */}
                  <div className="reg-summary-pill">
                    <div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {formData.name ? formData.name : 'New Member'}
                      </span>
                      <span style={{ color: '#64748b', marginLeft: 6, fontSize: 10.5 }}>
                        • {formData.membership_plan_id ? (membershipPlans.find(p => String(p.id) === String(formData.membership_plan_id))?.name || 'Plan') : 'Registration Only'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, color: '#E67C00', fontSize: 12.5 }}>
                      {formData.payment_amount ? `${Number(formData.payment_amount).toLocaleString()} ETB` : '0 ETB'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="reg-actions-row">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsRegisterOpen(false)}
                      disabled={isSubmitting}
                      style={{ height: 32, padding: '0 14px', fontSize: 12 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      onClick={handleRegisterSubmit}
                      className="btn btn-primary"
                      style={{ height: 32, padding: '0 18px', fontSize: 12.5, background: '#E67C00', borderColor: '#E67C00', fontWeight: 700 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Registering...' : 'Register Member & Issue Pass'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Digital QR Pass & Official Receipt (Shown Immediately After Registration) */}
      {registeredMemberPass && (
        <div className="modal-backdrop">
          <div className="reg-success-modal">
            {/* Close Button */}
            <button
              type="button"
              className="reg-success-close-btn no-print"
              onClick={() => setRegisteredMemberPass(null)}
              title="Close and view directory"
            >
              ✕
            </button>

            {/* Clean Hero Header */}
            <div className="reg-success-header no-print">
              <div className="reg-success-badge-icon">
                <Icons.Check size={24} strokeWidth={2.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 className="reg-success-title">Member Registered Successfully!</h3>
                  <span style={{
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    Active Pass
                  </span>
                </div>
                <div className="reg-success-subtitle">
                  Digital turnstile credentials & official receipt issued for Tigat Gym.
                </div>
              </div>
            </div>

            {/* Quick-Info Strip */}
            <div className="reg-summary-strip no-print">
              <div className="reg-summary-item">
                <span className="reg-summary-label">Member</span>
                <span className="reg-summary-val" title={registeredMemberPass.member?.name}>
                  {registeredMemberPass.member?.name}
                </span>
              </div>
              <div className="reg-summary-item">
                <span className="reg-summary-label">Member ID</span>
                <span className="reg-summary-val" style={{ color: '#ea580c', fontFamily: 'monospace', fontWeight: 800 }}>
                  {registeredMemberPass.member?.member_code || 'TG-0000'}
                </span>
              </div>
              <div className="reg-summary-item">
                <span className="reg-summary-label">Assigned Plan</span>
                <span className="reg-summary-val" title={registeredMemberPass.plan ? registeredMemberPass.plan.name : 'Standard Access'}>
                  {registeredMemberPass.plan ? registeredMemberPass.plan.name : 'Standard Access'}
                </span>
              </div>
              <div className="reg-summary-item">
                <span className="reg-summary-label">Total Paid</span>
                <span className="reg-summary-val" style={{ color: '#16a34a', fontWeight: 800 }}>
                  {Number(registeredMemberPass.payment?.amount || registeredMemberPass.plan?.price || 0).toLocaleString()} ETB
                </span>
              </div>
            </div>

            {/* Segmented View Switcher Tabs */}
            <div className="reg-tab-switcher no-print">
              <button
                type="button"
                className={`reg-tab-btn ${passModalTab === 'receipt' ? 'active' : ''}`}
                onClick={() => setPassModalTab('receipt')}
              >
                🧾 Official Receipt
              </button>
              <button
                type="button"
                className={`reg-tab-btn ${passModalTab === 'pass' ? 'active' : ''}`}
                onClick={() => setPassModalTab('pass')}
              >
                💳 Digital Turnstile Card
              </button>
            </div>

            {/* Tab Body with Custom Smooth Scroll */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: 2, margin: '4px 0 10px 0' }}>
              {/* TAB 1: OFFICIAL HIGH-CONTRAST WHITE RECEIPT */}
              <div
                id="printable-receipt"
                className="reg-receipt-sheet"
                style={{
                  display: passModalTab === 'receipt' ? 'block' : 'none',
                }}
              >
                {/* Header Branding */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <BrandLogo variant="reception" size={48} showSubtext={false} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: '0.06em' }}>
                    TIGAT GYM
                  </h4>
                  <div className="receipt-orange" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginTop: 2 }}>
                    OFFICIAL PAYMENT RECEIPT
                  </div>
                  <div className="receipt-muted" style={{ fontSize: 10.5, marginTop: 2 }}>
                    Tigat Fitness Hub • Addis Ababa, Ethiopia
                  </div>
                </div>

                {/* Receipt Key-Value Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11.5, marginBottom: 14 }}>
                  <div>
                    <div className="receipt-muted" style={{ fontSize: 10.5, fontWeight: 600 }}>Receipt Number:</div>
                    <div className="receipt-orange" style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 13, marginTop: 1 }}>
                      {registeredMemberPass.payment?.receipt_number || registeredMemberPass.payment?.payment_number || 'RCT-AUTO'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="receipt-muted" style={{ fontSize: 10.5, fontWeight: 600 }}>Date & Time:</div>
                    <div className="receipt-dark" style={{ fontWeight: 700, marginTop: 1 }}>
                      {registeredMemberPass.issuedAt ? new Date(registeredMemberPass.issuedAt).toLocaleString() : new Date().toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="receipt-muted" style={{ fontSize: 10.5, fontWeight: 600 }}>Billed To:</div>
                    <div className="receipt-dark" style={{ fontWeight: 800, fontSize: 13, marginTop: 1 }}>
                      {registeredMemberPass.member?.name}
                    </div>
                    <div className="receipt-orange" style={{ fontSize: 10.5, fontFamily: 'monospace', fontWeight: 700 }}>
                      Code: {registeredMemberPass.member?.member_code || 'TG-0000'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="receipt-muted" style={{ fontSize: 10.5, fontWeight: 600 }}>Front Desk Officer:</div>
                    <div className="receipt-dark" style={{ fontWeight: 700, marginTop: 1 }}>
                      {registeredMemberPass.officerName || user?.name || 'Reception Staff'}
                    </div>
                  </div>
                </div>

                {/* Itemized Line Items */}
                <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 0', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                    <span className="receipt-muted">Description</span>
                    <span className="receipt-muted">Amount (ETB)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                    <span className="receipt-dark">
                      {registeredMemberPass.plan ? registeredMemberPass.plan.name : 'Registration & Gym Access Pass'}
                    </span>
                    <span className="receipt-dark">
                      {Number(registeredMemberPass.payment?.amount || registeredMemberPass.plan?.price || 0).toLocaleString()} ETB
                    </span>
                  </div>
                  {registeredMemberPass.plan && (
                    <div className="receipt-muted" style={{ fontSize: 11, marginTop: 2 }}>
                      Duration: {registeredMemberPass.plan.duration_value} {registeredMemberPass.plan.duration_type}{registeredMemberPass.plan.duration_value > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Grand Total Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}>
                  <div>
                    <div className="receipt-muted" style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 800 }}>
                      Payment Method
                    </div>
                    <div className="receipt-dark" style={{ fontSize: 12.5, fontWeight: 800, marginTop: 2 }}>
                      {registeredMemberPass.paymentMethod === 'chapa' ? (
                        <>⚡ Chapa Pay ({registeredMemberPass.chapaProvider ? registeredMemberPass.chapaProvider.toUpperCase() : 'TELEBIRR'})</>
                      ) : (
                        <>💵 Cash (Front Desk)</>
                      )}
                    </div>
                    {registeredMemberPass.paymentReference && (
                      <div className="receipt-muted" style={{ fontSize: 10.5, fontFamily: 'monospace', marginTop: 1 }}>
                        Ref: {registeredMemberPass.paymentReference}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="receipt-muted" style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 800 }}>
                      Total Paid
                    </div>
                    <div className="receipt-green" style={{ fontSize: 20, fontWeight: 900 }}>
                      {Number(registeredMemberPass.payment?.amount || registeredMemberPass.plan?.price || 0).toLocaleString()} ETB
                    </div>
                  </div>
                </div>

                {/* Security Token & QR Validation Stamp */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed #e2e8f0',
                  paddingTop: 10,
                }}>
                  <div style={{ textAlign: 'left', fontSize: 10 }}>
                    <div className="receipt-muted" style={{ fontFamily: 'monospace' }}>
                      Token: {registeredMemberPass.payment?.payment_number || 'PAY-OFFICIAL'}
                    </div>
                    <div className="receipt-orange" style={{ fontWeight: 700, marginTop: 2 }}>
                      Thank you for choosing Tigat Gym! 💪
                    </div>
                  </div>
                  <div style={{
                    width: 46,
                    height: 46,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2,
                  }}>
                    <QRCodeDisplay
                      value={`TIGAT-RECEIPT:${registeredMemberPass.payment?.receipt_number || 'RCT-AUTO'}:${registeredMemberPass.member?.member_code}`}
                      size={40}
                    />
                  </div>
                </div>
              </div>

              {/* TAB 2: DIGITAL TURNSTILE MEMBERSHIP CARD */}
              <div
                style={{
                  display: passModalTab === 'pass' ? 'flex' : 'none',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <div style={{ marginBottom: 12, textAlign: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: '#ea580c', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Official Digital Credential • Present at Turnstile for Access
                  </span>
                </div>
                <PermanentMemberCard
                  member={{
                    ...registeredMemberPass.member,
                    joined_at: registeredMemberPass.member?.joined_at || registeredMemberPass.issuedAt || new Date().toISOString().split('T')[0],
                    card_expires_at: registeredMemberPass.member?.card_expires_at,
                  }}
                  membershipTitle="PREMIUM MEMBER"
                  fallbackStartDate={registeredMemberPass.issuedAt}
                  showActions={false}
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="no-print" style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingTop: 12,
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <Icons.Printer size={15} />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setRegisteredMemberPass(null);
                  setFormData(initialFormData);
                  setIsRegisterOpen(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#ea580c', borderColor: '#ea580c' }}
              >
                <Icons.UserPlus size={15} />
                <span>+ Register Another</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setRegisteredMemberPass(null)}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#059669',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icons.Check size={16} />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Member Profile (Non-Scrollable One-Page Layout) */}
      {editingMember && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-wide modal-card-register-fit" style={{ maxWidth: 780 }}>
            <div className="modal-header-compact">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fff7ed', color: '#E67C00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Edit3 size={15} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                    Edit Member Profile: {editingMember.name}
                  </h3>
                  <span style={{ fontSize: 10.5, color: '#64748b' }}>
                    Code: <strong style={{ color: '#E67C00' }}>{editingMember.member_code}</strong> • Status: {editingMember.status || 'Active'}
                  </span>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={() => setEditingMember(null)}>×</button>
            </div>

            <form onSubmit={handleEditSubmit} noValidate style={{ margin: 0 }}>
              <div className="reg-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Column 1: Personal Details */}
                <div className="reg-form-col">
                  <div className="reg-section-badge">
                    <Icons.CheckCircle size={12} />
                    <span>1. Personal & Contact Info</span>
                  </div>

                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <label>Full Name <span style={{ color: '#E67C00' }}>*</span></label>
                      <input
                        type="text"
                        required
                        className={`reg-control ${formErrors.name ? 'input-error' : ''}`}
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                      />
                      {formErrors.name && (
                        <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.name}</span>
                      )}
                    </div>
                    <div className="reg-form-group">
                      <label>Phone Number <span style={{ color: '#E67C00' }}>*</span></label>
                      <input
                        type="text"
                        required
                        className={`reg-control ${formErrors.phone ? 'input-error' : ''}`}
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                      />
                      {formErrors.phone && (
                        <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.phone}</span>
                      )}
                    </div>
                  </div>

                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className={`reg-control ${formErrors.email ? 'input-error' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                      />
                      {formErrors.email && (
                        <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.email}</span>
                      )}
                    </div>
                    <div className="reg-form-group">
                      <label>Gender</label>
                      <select
                        className="reg-control"
                        value={formData.gender}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <label>Date of Birth</label>
                        {formData.date_of_birth && !formErrors.date_of_birth && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>
                            {calculateAge(formData.date_of_birth)} yrs
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        className={`reg-control ${formErrors.date_of_birth ? 'input-error' : ''}`}
                        max={maxDobString}
                        min="1920-01-01"
                        value={formData.date_of_birth}
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                        onClick={(e) => openDatePicker(e.currentTarget)}
                        style={{ cursor: 'pointer' }}
                      />
                      {formErrors.date_of_birth && (
                        <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.date_of_birth}</span>
                      )}
                    </div>
                    <div className="reg-form-group">
                      <label>Blood Type</label>
                      <select
                        className="reg-control"
                        value={formData.blood_type ? formData.blood_type.toUpperCase() : ''}
                        onChange={(e) => handleFieldChange('blood_type', e.target.value)}
                      >
                        <option value="">Select Blood Type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="reg-form-group">
                    <label>Residential Address</label>
                    <input
                      type="text"
                      className="reg-control"
                      placeholder="e.g. Bole, Addis Ababa"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                    />
                  </div>
                </div>

                {/* Column 2: Emergency Contact & Health */}
                <div className="reg-form-col">
                  <div className="reg-section-badge">
                    <Icons.CheckCircle size={12} />
                    <span>2. Emergency Contact & Health</span>
                  </div>

                  <div className="reg-form-row-2">
                    <div className="reg-form-group">
                      <label>Emergency Contact</label>
                      <input
                        type="text"
                        className="reg-control"
                        placeholder="Contact person name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                      />
                    </div>
                    <div className="reg-form-group">
                      <label>Emergency Phone</label>
                      <input
                        type="text"
                        className={`reg-control ${formErrors.emergency_contact_phone ? 'input-error' : ''}`}
                        placeholder="Emergency phone"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                      />
                      {formErrors.emergency_contact_phone && (
                        <span className="form-error-text" style={{ fontSize: 10.5 }}><Icons.AlertCircle size={11} /> {formErrors.emergency_contact_phone}</span>
                      )}
                    </div>
                  </div>

                  <div className="reg-form-group">
                    <label>Relationship to Member</label>
                    <input
                      type="text"
                      className="reg-control"
                      placeholder="e.g. Spouse, Brother, Parent"
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
                    />
                  </div>

                  <div className="reg-form-group">
                    <label>Fitness Goals</label>
                    <textarea
                      className="reg-control"
                      style={{ height: 38, resize: 'none', padding: '4px 8px', fontSize: 11.5 }}
                      rows={1}
                      placeholder="e.g. Weight loss, muscle building"
                      value={formData.fitness_goals}
                      onChange={(e) => handleFieldChange('fitness_goals', e.target.value)}
                    />
                  </div>

                  <div className="reg-form-group">
                    <label>Medical Restrictions</label>
                    <textarea
                      className="reg-control"
                      style={{ height: 38, resize: 'none', padding: '4px 8px', fontSize: 11.5 }}
                      rows={1}
                      placeholder="e.g. Asthma, Knee surgery"
                      value={formData.health_conditions}
                      onChange={(e) => handleFieldChange('health_conditions', e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="reg-actions-row" style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingMember(null)}
                      disabled={isSubmitting}
                      style={{ height: 32, padding: '0 14px', fontSize: 12 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: 32, padding: '0 18px', fontSize: 12.5, background: '#E67C00', borderColor: '#E67C00', fontWeight: 700 }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Renew / Assign Membership Plan */}
      {renewingMember && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-register-fit" style={{ maxWidth: 520 }}>
            <div className="modal-header-compact">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fff7ed', color: '#E67C00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Refresh size={15} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'inherit' }}>
                    Renew / Assign Membership Plan
                  </h3>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {renewingMember.name} • <strong style={{ color: '#E67C00' }}>{renewingMember.member_code}</strong>
                  </span>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={() => setRenewingMember(null)}>×</button>
            </div>

            <form onSubmit={handleRenewSubmit} noValidate style={{ margin: 0 }}>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {renewingMember.active_subscription ? (
                  <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>Current Active Plan: </span>
                    <strong>{renewingMember.active_subscription.plan_name || 'Active'}</strong>
                    {renewingMember.active_subscription.end_date && ` (expires ${new Date(renewingMember.active_subscription.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})`}
                  </div>
                ) : (
                  <div style={{ background: 'rgba(230, 124, 0, 0.08)', border: '1px solid rgba(230, 124, 0, 0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                    <span style={{ color: '#ea580c', fontWeight: 700 }}>No active subscription on file. </span>
                    Assign a membership plan below to enable instant workout check-ins.
                  </div>
                )}

                <div className="reg-form-group">
                  <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Select Membership Plan <span style={{ color: '#E67C00' }}>*</span>
                  </label>
                  <select
                    className={`reg-control ${renewErrors.membership_plan_id ? 'input-error' : ''}`}
                    value={renewForm.membership_plan_id}
                    onChange={(e) => setRenewForm(prev => ({ ...prev, membership_plan_id: e.target.value }))}
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 13 }}
                  >
                    <option value="">-- Choose Plan --</option>
                    {membershipPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {Number(plan.price).toLocaleString()} ETB ({plan.duration_value} {plan.duration_type}{plan.duration_value > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  {renewErrors.membership_plan_id && (
                    <span className="form-error-text" style={{ fontSize: 11, color: '#ef4444' }}>
                      <Icons.AlertCircle size={12} /> {renewErrors.membership_plan_id}
                    </span>
                  )}
                </div>

                <div className="reg-form-group">
                  <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Pass Start Date <span style={{ color: '#E67C00' }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="reg-control"
                    value={renewForm.start_date}
                    onChange={(e) => setRenewForm(prev => ({ ...prev, start_date: e.target.value }))}
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 13 }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748b' }}>
                    Plan duration begins from this date.
                  </span>
                </div>

                <div className="reg-form-group">
                  <label style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                    Front-Desk Renewal Notes
                  </label>
                  <input
                    type="text"
                    className="reg-control"
                    value={renewForm.notes}
                    onChange={(e) => setRenewForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Cash payment received at reception"
                    style={{ width: '100%', height: 38, borderRadius: 8, padding: '0 10px', fontSize: 13 }}
                  />
                </div>

                {(() => {
                  const selPlan = membershipPlans.find(p => String(p.id) === String(renewForm.membership_plan_id));
                  if (!selPlan) return null;
                  const price = Number(selPlan.price) || 0;
                  return (
                    <div style={{ background: 'var(--bg-secondary, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#64748b' }}>Plan Fee:</span>
                        <strong>{price.toLocaleString()} ETB</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px dashed #cbd5e1', fontWeight: 800 }}>
                        <span>Total Payable:</span>
                        <strong style={{ color: '#E67C00' }}>{price.toLocaleString()} ETB</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRenewingMember(null)}
                  disabled={isRenewSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isRenewSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E67C00', borderColor: '#E67C00', fontWeight: 700 }}
                >
                  <Icons.Refresh size={14} />
                  <span>{isRenewSubmitting ? 'Activating...' : 'Confirm & Activate Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Official 1-Year Permanent Member Card */}
      {selectedMember && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 520, overflow: 'hidden' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, color: 'var(--gym-text-primary, #ffffff)' }}>TIGAT GYM — Permanent Member Card</h3>
                <span style={{ fontSize: 11, color: '#ea580c', fontWeight: 700 }}>
                  1-Year Official Membership Credential
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setSelectedMember(null)}>×</button>
            </div>

            <div className="digital-card-container" style={{ padding: '6px 0' }}>
              <PermanentMemberCard
                member={selectedMember}
                membershipTitle="PREMIUM MEMBER"
                showActions={true}
              />
            </div>

            {/* High-Contrast Phone & Emergency Contact Strip */}
            {(selectedMember.phone || selectedMember.emergency_contact_phone) && (
              <div className="member-pass-phone-strip">
                {selectedMember.phone && (
                  <div className="phone-strip-item">
                    <span className="strip-label">Member Phone:</span>
                    <strong className="strip-val">{selectedMember.phone}</strong>
                  </div>
                )}
                {selectedMember.emergency_contact_name && (
                  <div className="phone-strip-item">
                    <span className="strip-label">Emergency Contact:</span>
                    <strong className="strip-val">
                      {selectedMember.emergency_contact_name} {selectedMember.emergency_contact_phone ? `(${selectedMember.emergency_contact_phone})` : ''}
                    </strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Suspension Reason Definition Modal */}
      {suspendModalMember && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 520, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>⛔</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#991b1b' }}>Suspend Member Account</h3>
                  <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 2 }}>{suspendModalMember.name} ({suspendModalMember.member_code})</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSuspendModalMember(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 20, color: '#991b1b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmSuspendMember} style={{ padding: 20 }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#9a3412', lineHeight: 1.4 }}>
                ℹ️ <strong>Reception Notification:</strong> This reason will immediately display on the <strong>Reception Dashboard</strong> and <strong>Attendance Scanner</strong> so receptionists know why access is blocked and can inform the member.
              </div>

              {/* Quick Presets */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Quick Preset Reasons:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Facility Rule Violation',
                    'Payment Dispute / Outstanding Fees',
                    'Misconduct / Conduct Incident',
                    'Equipment Misuse or Damage',
                    'Gym Safety Policy Breach',
                    'Temporary Medical Hold',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSuspensionReason(preset)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                        border: '1px solid #e2e8f0',
                        background: suspensionReason === preset ? '#fee2e2' : '#f8fafc',
                        color: suspensionReason === preset ? '#991b1b' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Reason */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Reason for Suspension <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  className="form-control"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Explain why this member is being suspended so the front desk can explain it to them (e.g. Non-payment, violation of gym rules, misconduct)..."
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: 10, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSuspendModalMember(null)}
                  disabled={isSuspending}
                  style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSuspending || !suspensionReason.trim()}
                  style={{
                    height: 38,
                    padding: '0 20px',
                    borderRadius: 8,
                    background: isSuspending || !suspensionReason.trim() ? '#fca5a5' : '#dc2626',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isSuspending || !suspensionReason.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                  }}
                >
                  {isSuspending ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
