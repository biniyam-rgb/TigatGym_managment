import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import useDebounce from '../hooks/useDebounce';

const Icons = {
  Refresh: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  ),
  Calendar: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Snowflake: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="12" y1="8" x2="8" y2="6" />
      <line x1="12" y1="8" x2="16" y2="6" />
      <line x1="12" y1="16" x2="8" y2="18" />
      <line x1="12" y1="16" x2="16" y2="18" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="8" y1="12" x2="6" y2="8" />
      <line x1="8" y1="12" x2="6" y2="16" />
      <line x1="16" y1="12" x2="18" y2="8" />
      <line x1="16" y1="12" x2="18" y2="16" />
    </svg>
  ),
  ArrowRight: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Pause: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  Play: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  CheckCircle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  Plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Clock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  AlertTriangle: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Edit: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  ),
  Trash: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  ),
  Search: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  PassCard: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Package: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <polyline points="21 8 21 16 12 21 3 16 3 8 12 3 21 8" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

export default function SubscriptionManagement() {
  const { hasRole } = useAuth();
  const isStaff = hasRole('owner') || hasRole('admin') || hasRole('receptionist');
  const isOwnerOrAdmin = hasRole('owner') || hasRole('admin');

  // Sub-tabs
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'plans'

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [subsSearch, setSubsSearch] = useState('');
  const debouncedSubsSearch = useDebounce(subsSearch, 250);
  const [subsStatusFilter, setSubsStatusFilter] = useState('');
  const [subsPlanFilter, setSubsPlanFilter] = useState('');
  const [subsPage, setSubsPage] = useState(1);
  const [subsMeta, setSubsMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Membership plans state
  const [plans, setPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [membersList, setMembersList] = useState([]);

  // Notifications
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unfreezingId, setUnfreezingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    member_id: '',
    membership_plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    discount: '0',
    notes: '',
  });

  // Renew Form
  const [renewForm, setRenewForm] = useState({
    membership_plan_id: '',
    discount: '0',
    notes: '',
  });

  // Freeze Form
  const [freezeMinDate, setFreezeMinDate] = useState('');
  const [freezeForm, setFreezeForm] = useState({
    frozen_until: '',
    reason: '',
  });

  // Cancel Form
  const [cancelForm, setCancelForm] = useState({
    cancellation_reason: '',
  });

  // Plan Form (Create/Edit)
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_type: 'month',
    duration_value: '1',
    access_hours_type: 'all_day',
    has_trainer_access: false,
    has_class_access: false,
    max_class_bookings: '',
    is_active: true,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const res = await apiClient.getMembershipPlans();
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to fetch membership plans:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setIsLoadingSubs(true);
    try {
      const params = {
        page: subsPage,
        per_page: 10,
      };
      if (subsSearch) params.search = subsSearch;
      if (subsStatusFilter) params.status = subsStatusFilter;
      if (subsPlanFilter) params.plan_id = subsPlanFilter;

      const res = await apiClient.getSubscriptions(params);
      setSubscriptions(res.data || []);
      if (res.meta) {
        setSubsMeta(res.meta);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      showNotification('error', 'Unable to retrieve subscriptions ledger.');
    } finally {
      setIsLoadingSubs(false);
    }
  }, [subsPage, subsSearch, subsStatusFilter, subsPlanFilter]);

  // Load plans & members once on mount
  useEffect(() => {
    let ignore = false;

    apiClient.getMembershipPlans()
      .then((res) => {
        if (!ignore) {
          setPlans(res.data || []);
          setIsLoadingPlans(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to fetch membership plans:', err);
          setIsLoadingPlans(false);
        }
      });

    if (isStaff) {
      apiClient.getMembers({ per_page: 100 })
        .then((res) => {
          if (!ignore) setMembersList(res.data || []);
        })
        .catch(console.error);
    }

    return () => {
      ignore = true;
    };
  }, [isStaff]);

  // Load subscriptions on search / filter / page changes
  useEffect(() => {
    let ignore = false;
    setTimeout(() => {
      if (!ignore) setIsLoadingSubs(true);
    }, 0);

    const params = {
      page: subsPage,
      per_page: 10,
    };
    if (debouncedSubsSearch) params.search = debouncedSubsSearch;
    if (subsStatusFilter) params.status = subsStatusFilter;
    if (subsPlanFilter) params.plan_id = subsPlanFilter;

    apiClient.getSubscriptions(params)
      .then((res) => {
        if (!ignore) {
          setSubscriptions(res.data || []);
          if (res.meta) setSubsMeta(res.meta);
          setIsLoadingSubs(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to fetch subscriptions:', err);
          setIsLoadingSubs(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [subsPage, debouncedSubsSearch, subsStatusFilter, subsPlanFilter]);

  // Selected plan calculation helper for Assign Modal
  const selectedAssignPlan = useMemo(() => {
    return plans.find(p => String(p.id) === String(assignForm.membership_plan_id));
  }, [plans, assignForm.membership_plan_id]);

  const assignTotalAmount = useMemo(() => {
    if (!selectedAssignPlan) return 0;
    const price = Number(selectedAssignPlan.price) || 0;
    const discount = Number(assignForm.discount) || 0;
    return Math.max(0, price - discount);
  }, [selectedAssignPlan, assignForm.discount]);

  // Freeze date calculation helper & presets
  const freezeDateInputRef = useRef(null);

  const freezeCalculation = useMemo(() => {
    if (!freezeForm.frozen_until) {
      return { days: 0, newEnd: selectedSub?.end_date || '—', formattedUntil: '—' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const until = new Date(freezeForm.frozen_until + 'T00:00:00');
    const diffDays = Math.max(1, Math.round((until - today) / 86400000));

    let newEndFormatted = '—';
    if (selectedSub?.end_date) {
      const origEnd = new Date(selectedSub.end_date + 'T00:00:00');
      origEnd.setDate(origEnd.getDate() + diffDays);
      newEndFormatted = origEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const formattedUntil = until.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    return {
      days: diffDays,
      newEnd: newEndFormatted,
      formattedUntil,
    };
  }, [freezeForm.frozen_until, selectedSub]);

  const handleApplyFreezePreset = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    setFreezeForm(prev => ({
      ...prev,
      frozen_until: target.toISOString().split('T')[0],
    }));
  };

  const handleApplyReasonChip = (reason) => {
    setFreezeForm(prev => {
      if (!prev.reason) return { ...prev, reason };
      if (prev.reason.includes(reason)) return prev;
      return { ...prev, reason: `${prev.reason}, ${reason}` };
    });
  };

  const handleOpenFreezeDatePicker = () => {
    if (freezeDateInputRef.current) {
      if (typeof freezeDateInputRef.current.showPicker === 'function') {
        try {
          freezeDateInputRef.current.showPicker();
        } catch {
          freezeDateInputRef.current.focus();
        }
      } else {
        freezeDateInputRef.current.focus();
      }
    }
  };

  // --- Handlers ---

  // 1. Assign Subscription
  const handleOpenAssignModal = () => {
    setFormErrors({});
    setAssignForm({
      member_id: membersList.length > 0 ? membersList[0].user_id : '',
      membership_plan_id: plans.length > 0 ? plans[0].id : '',
      start_date: new Date().toISOString().split('T')[0],
      discount: '0',
      notes: '',
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        member_id: Number(assignForm.member_id),
        membership_plan_id: Number(assignForm.membership_plan_id),
        start_date: assignForm.start_date,
        discount: Number(assignForm.discount) || 0,
        notes: assignForm.notes || undefined,
      };

      const res = await apiClient.createSubscription(payload);
      showNotification('success', res.message || 'Subscription assigned successfully!');
      setIsAssignModalOpen(false);
      fetchSubscriptions();
      fetchPlans();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        showNotification('error', err.message || 'Failed to assign subscription.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Renew Subscription
  const handleOpenRenewModal = (sub) => {
    setSelectedSub(sub);
    setFormErrors({});
    setRenewForm({
      membership_plan_id: sub.membership_plan_id || (sub.plan ? sub.plan.id : ''),
      discount: '0',
      notes: '',
    });
    setIsRenewModalOpen(true);
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        membership_plan_id: Number(renewForm.membership_plan_id) || undefined,
        discount: Number(renewForm.discount) || 0,
        notes: renewForm.notes || undefined,
      };

      const res = await apiClient.renewSubscription(selectedSub.id, payload);
      showNotification('success', res.message || 'Subscription renewed successfully!');
      setIsRenewModalOpen(false);
      fetchSubscriptions();
      fetchPlans();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        showNotification('error', err.message || 'Failed to renew subscription.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Freeze Subscription
  const handleOpenFreezeModal = (sub) => {
    setSelectedSub(sub);
    setFormErrors({});
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFreezeMinDate(tomorrow.toISOString().split('T')[0]);

    // Default freeze date 14 days ahead
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    setFreezeForm({
      frozen_until: twoWeeksLater.toISOString().split('T')[0],
      reason: '',
    });
    setIsFreezeModalOpen(true);
  };

  const handleFreezeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsSubmitting(true);
    setFormErrors({});

    try {
      await apiClient.freezeSubscription(selectedSub.id, freezeForm);
      showNotification(
        'success',
        `❄️ Membership pass for ${selectedSub.member?.name || 'Member'} (${selectedSub.member?.member_code || 'ID'}) frozen until ${freezeForm.frozen_until}. Expiration extended!`
      );
      setIsFreezeModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        showNotification('error', `⚠️ Failed to freeze pass: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Instant 1-Click Unfreeze Subscription (No browser popup dialog, just like Check In)
  const handleUnfreeze = async (sub) => {
    if (!sub) return;
    setUnfreezingId(sub.id);
    try {
      await apiClient.unfreezeSubscription(sub.id);
      showNotification(
        'success',
        `✓ Membership pass for ${sub.member?.name || 'Member'} (${sub.member?.member_code || 'ID'}) has been unfrozen and reactivated!`
      );
      fetchSubscriptions();
    } catch (err) {
      showNotification('error', `⚠️ Failed to unfreeze pass: ${err.message || 'Unknown error'}`);
    } finally {
      setUnfreezingId(null);
    }
  };

  // 5. Cancel Subscription
  const handleOpenCancelModal = (sub) => {
    setSelectedSub(sub);
    setFormErrors({});
    setCancelForm({ cancellation_reason: '' });
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const res = await apiClient.cancelSubscription(selectedSub.id, cancelForm);
      showNotification('success', res.message || 'Subscription cancelled.');
      setIsCancelModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        showNotification('error', err.message || 'Failed to cancel subscription.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Plan Create / Edit
  const handleOpenCreatePlanModal = () => {
    setSelectedPlanForEdit(null);
    setFormErrors({});
    setPlanForm({
      name: '',
      description: '',
      price: '',
      duration_type: 'month',
      duration_value: '1',
      access_hours_type: 'all_day',
      has_trainer_access: false,
      has_class_access: false,
      max_class_bookings: '',
      is_active: true,
    });
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlanModal = (plan) => {
    setSelectedPlanForEdit(plan);
    setFormErrors({});
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price),
      duration_type: plan.duration_type,
      duration_value: String(plan.duration_value),
      access_hours_type: plan.access_hours_type || 'all_day',
      has_trainer_access: Boolean(plan.has_trainer_access),
      has_class_access: Boolean(plan.has_class_access),
      max_class_bookings: plan.max_class_bookings ? String(plan.max_class_bookings) : '',
      is_active: Boolean(plan.is_active),
    });
    setIsPlanModalOpen(true);
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const payload = {
        name: planForm.name,
        description: planForm.description || null,
        price: Number(planForm.price),
        duration_type: planForm.duration_type,
        duration_value: Number(planForm.duration_value),
        access_hours_type: planForm.access_hours_type,
        has_trainer_access: Boolean(planForm.has_trainer_access),
        has_class_access: Boolean(planForm.has_class_access),
        max_class_bookings: planForm.max_class_bookings ? Number(planForm.max_class_bookings) : null,
        is_active: Boolean(planForm.is_active),
      };

      if (selectedPlanForEdit) {
        await apiClient.updateMembershipPlan(selectedPlanForEdit.id, payload);
        showNotification('success', `Plan '${payload.name}' updated successfully.`);
      } else {
        await apiClient.createMembershipPlan(payload);
        showNotification('success', `Plan '${payload.name}' created successfully.`);
      }

      setIsPlanModalOpen(false);
      fetchPlans();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        showNotification('error', err.message || 'Failed to save plan.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`Delete or archive '${plan.name}'?`)) return;
    try {
      const res = await apiClient.deleteMembershipPlan(plan.id);
      showNotification('success', res.message || 'Plan removed.');
      fetchPlans();
    } catch (err) {
      showNotification('error', err.message || 'Failed to remove plan.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: notification.type === 'success' ? '#10b981' : '#f87171',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {notification.type === 'success' ? <Icons.CheckCircle size={17} /> : <Icons.AlertTriangle size={17} />}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Controls & Navigation Bar */}
      <div
        className="dashboard-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          padding: '14px 20px',
        }}
      >
        {/* Sub-Tabs: Subscriptions vs Plans */}
        <div className="subs-tab-container">
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`subs-tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          >
            <Icons.PassCard size={15} />
            <span>Member Passes & Subscriptions</span>
            <span className="subs-tab-count">
              {subsMeta.total || subscriptions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`subs-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          >
            <Icons.Package size={15} />
            <span>Membership Packages Catalog</span>
            <span className="subs-tab-count">
              {plans.length}
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isStaff && activeTab === 'subscriptions' && (
            <button
              type="button"
              className="subs-btn-cta-primary"
              onClick={handleOpenAssignModal}
            >
              <Icons.Plus size={15} />
              <span>Assign Membership</span>
            </button>
          )}
          {isOwnerOrAdmin && activeTab === 'plans' && (
            <button
              type="button"
              className="subs-btn-cta-primary"
              onClick={handleOpenCreatePlanModal}
            >
              <Icons.Plus size={15} />
              <span>Create New Package</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Subscriptions Ledger */}
      {activeTab === 'subscriptions' && (
        <>
          {/* Filters Bar */}
          <div
            className="dashboard-card"
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
              padding: '14px 20px',
            }}
          >
            {/* Search Input */}
            <div className="search-bar-wrapper" style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                className="form-input search-input-field"
                placeholder="Search member ID, name, phone, package..."
                value={subsSearch}
                onChange={(e) => {
                  setSubsSearch(e.target.value);
                  setSubsPage(1);
                }}
                style={{
                  paddingLeft: 36,
                  paddingRight: subsSearch ? 34 : 14,
                  width: '100%',
                  height: 42,
                  minHeight: 42,
                  boxSizing: 'border-box',
                  fontSize: 13.5,
                  borderRadius: 8,
                }}
              />
              {subsSearch && (
                <button
                  type="button"
                  onClick={() => { setSubsSearch(''); setSubsPage(1); }}
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
            <select
              className="form-input"
              value={subsStatusFilter}
              onChange={(e) => {
                setSubsStatusFilter(e.target.value);
                setSubsPage(1);
              }}
              style={{
                flex: '0 1 160px',
                height: 42,
                minHeight: 42,
                boxSizing: 'border-box',
                fontSize: 13.5,
                borderRadius: 8,
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="frozen">Frozen</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Plan Filter */}
            <select
              className="form-input"
              value={subsPlanFilter}
              onChange={(e) => {
                setSubsPlanFilter(e.target.value);
                setSubsPage(1);
              }}
              style={{
                flex: '0 1 180px',
                height: 42,
                minHeight: 42,
                boxSizing: 'border-box',
                fontSize: 13.5,
                borderRadius: 8,
              }}
            >
              <option value="">All Packages</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {(subsSearch || subsStatusFilter || subsPlanFilter) && (
              <button
                type="button"
                className="subs-page-btn"
                onClick={() => {
                  setSubsSearch('');
                  setSubsStatusFilter('');
                  setSubsPlanFilter('');
                  setSubsPage(1);
                }}
                style={{
                  height: 42,
                  minHeight: 42,
                  padding: '0 14px',
                  boxSizing: 'border-box',
                  borderRadius: 8,
                }}
              >
                <Icons.XCircle size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Subscriptions Table */}
          <div className="subs-table-wrapper">
            <div className="table-responsive">
              <table className="subs-dense-table">
                <thead>
                  <tr>
                    <th style={{ width: '115px' }}>
                      Member ID
                      <span className="subs-th-sub">Permanent Code</span>
                    </th>
                    <th style={{ width: '150px' }}>
                      Member Name
                      <span className="subs-th-sub">Full Name</span>
                    </th>
                    <th style={{ width: '150px' }}>
                      Membership Plan
                      <span className="subs-th-sub">Package & Features</span>
                    </th>
                    <th style={{ width: '150px' }}>
                      Coverage Period
                      <span className="subs-th-sub">Start → End Date</span>
                    </th>
                    <th style={{ width: '95px' }}>
                      Status
                      <span className="subs-th-sub">Live State</span>
                    </th>
                    <th style={{ width: '95px' }}>
                      Days Left
                      <span className="subs-th-sub">Remaining</span>
                    </th>
                    <th style={{ width: '115px' }}>
                      Price (ETB)
                      <span className="subs-th-sub">Rate & Promo</span>
                    </th>
                    <th style={{ width: '140px', textAlign: 'right' }}>
                      Actions
                      <span className="subs-th-sub">Quick Manage</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingSubs ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0' }}>
                        <span className="spinner" style={{ margin: '0 auto', display: 'block' }}></span>
                        <div style={{ color: '#94a3b8', marginTop: 12, fontSize: 13 }}>
                          Loading subscriptions ledger...
                        </div>
                      </td>
                    </tr>
                  ) : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '48px 0' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                        <div className="subs-empty-title" style={{ fontSize: 16, fontWeight: 700 }}>No subscriptions found</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                          {subsSearch || subsStatusFilter || subsPlanFilter
                            ? 'Try clearing filters to see more results.'
                            : 'Assign a member pass to begin tracking subscriptions.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isActive = sub.status === 'active';
                      const isFrozen = sub.status === 'frozen';
                      const isExpired = sub.status === 'expired';

                      return (
                        <tr key={sub.id}>
                          {/* Member ID */}
                          <td>
                            <span className="subs-pass-id-badge">
                              {sub.member?.member_code || (sub.member?.id ? `TG-${String(sub.member.id).padStart(4, '0')}` : '—')}
                            </span>
                          </td>

                          {/* Member Name (Only member's name) */}
                          <td>
                            <span className="subs-member-name-text" style={{ fontSize: 13.5, fontWeight: 700 }}>
                              {sub.member?.name || 'Unknown Member'}
                            </span>
                          </td>

                          {/* Plan */}
                          <td>
                            <div className="subs-plan-name" style={{ fontWeight: 700, fontSize: 13 }}>
                              {sub.plan?.name || 'Standard Package'}
                            </div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                              {sub.plan?.has_trainer_access && (
                                <span className="subs-feature-chip subs-chip-pt">
                                  PT Included
                                </span>
                              )}
                              {sub.plan?.has_class_access && (
                                <span className="subs-feature-chip subs-chip-class">
                                  Classes
                                </span>
                              )}
                              {sub.plan?.duration_value && (
                                <span className="subs-feature-chip subs-chip-duration">
                                  {sub.plan.duration_value} {sub.plan.duration_type}{sub.plan.duration_value > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Validity */}
                          <td>
                            <div className="subs-validity-text" style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{sub.start_date}</span>
                              <span style={{ color: '#ff7a00', opacity: 0.8 }}>→</span>
                              <span>{sub.end_date}</span>
                            </div>
                            {isFrozen && sub.frozen_until ? (
                              <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>❄️ Frozen until {sub.frozen_until}</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>
                                Valid coverage
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`subs-status-pill status-${sub.status}`}>
                              <span className="status-dot" />
                              <span>{sub.status}</span>
                            </span>
                          </td>

                          {/* Days Left */}
                          <td>
                            {isActive ? (
                              <span className={`subs-days-pill ${sub.days_remaining <= 5 ? 'days-critical' : sub.days_remaining <= 10 ? 'days-warning' : 'days-ok'}`}>
                                <Icons.Clock size={11} />
                                <span>{sub.days_remaining} {sub.days_remaining === 1 ? 'day' : 'days'}</span>
                              </span>
                            ) : isFrozen ? (
                              <span className="subs-days-pill days-frozen">
                                <Icons.Pause size={11} />
                                <span>On Hold</span>
                              </span>
                            ) : (
                              <span className="subs-days-pill days-expired">
                                <Icons.AlertTriangle size={11} />
                                <span>Expired</span>
                              </span>
                            )}
                          </td>

                          {/* Price */}
                          <td>
                            <div className="subs-price-text" style={{ fontWeight: 800, fontSize: 13.5 }}>
                              {Number(sub.total_amount).toLocaleString()} <span style={{ fontSize: 11, fontWeight: 700, color: '#ff7a00' }}>{sub.currency || 'ETB'}</span>
                            </div>
                            {Number(sub.discount) > 0 ? (
                              <div className="subs-discount-chip">
                                -{Number(sub.discount).toLocaleString()} ETB promo
                              </div>
                            ) : (
                              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>Standard rate</div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="subs-table-actions">
                              {/* Renew Button (for Active or Expired) */}
                              {isStaff && (isActive || isExpired) && (
                                <button
                                  type="button"
                                  className="subs-btn-action subs-btn-renew"
                                  onClick={() => handleOpenRenewModal(sub)}
                                  title="Renew Subscription"
                                >
                                  <Icons.Refresh size={12} />
                                  <span>Renew</span>
                                </button>
                              )}

                              {/* Freeze Button (for Active) */}
                              {isStaff && isActive && (
                                <button
                                  type="button"
                                  className="subs-btn-action subs-btn-freeze"
                                  onClick={() => handleOpenFreezeModal(sub)}
                                  title="Freeze Pass"
                                >
                                  <Icons.Pause size={12} />
                                  <span>Freeze</span>
                                </button>
                              )}

                              {/* Unfreeze Button (for Frozen) - 1-Click action */}
                              {isStaff && isFrozen && (
                                <button
                                  type="button"
                                  className="subs-btn-action subs-btn-unfreeze"
                                  onClick={() => handleUnfreeze(sub)}
                                  disabled={unfreezingId === sub.id}
                                  title="Reactivate Frozen Pass"
                                >
                                  <Icons.Play size={12} />
                                  <span>{unfreezingId === sub.id ? 'Unfreezing...' : 'Unfreeze'}</span>
                                </button>
                              )}

                              {/* Cancel Button (Owner/Admin) */}
                              {isOwnerOrAdmin && (isActive || isFrozen) && (
                                <button
                                  type="button"
                                  className="subs-btn-action subs-btn-cancel"
                                  onClick={() => handleOpenCancelModal(sub)}
                                  title="Terminate Pass"
                                >
                                  <Icons.XCircle size={12} />
                                  <span>Cancel</span>
                                </button>
                              )}

                              {!isActive && !isFrozen && (
                                <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', paddingRight: 6 }}>
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination: 10 members per page */}
            {subsMeta.total > 0 && (
              <div className="subs-pagination-bar">
                <div>
                  Showing <strong>{(subsMeta.current_page - 1) * 10 + 1}</strong> to{' '}
                  <strong>{Math.min(subsMeta.current_page * 10, subsMeta.total)}</strong> of{' '}
                  <strong style={{ color: '#ff7a00' }}>{subsMeta.total}</strong> members
                  {subsMeta.last_page > 1 && (
                    <span style={{ marginLeft: 8, opacity: 0.8 }}>
                      (Page {subsMeta.current_page} of {subsMeta.last_page})
                    </span>
                  )}
                </div>
                {subsMeta.last_page > 1 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="subs-page-btn"
                      disabled={subsPage <= 1}
                      onClick={() => setSubsPage((p) => Math.max(1, p - 1))}
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      className="subs-page-btn"
                      disabled={subsPage >= subsMeta.last_page}
                      onClick={() => setSubsPage((p) => Math.min(subsMeta.last_page, p + 1))}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: Membership Packages Catalog */}
      {activeTab === 'plans' && (
        <div>
          {isLoadingPlans ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <span className="spinner" style={{ margin: '0 auto', display: 'block' }}></span>
              <div style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>
                Loading membership packages...
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📦</div>
              <h3 className="subs-empty-heading" style={{ marginBottom: 6 }}>No Membership Packages Configured</h3>
              <p style={{ color: '#64748b', maxWidth: 420, margin: '0 auto 20px auto', fontSize: 13 }}>
                Configure TIGAT GYM monthly, quarterly, or annual packages in Ethiopian Birr.
              </p>
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenCreatePlanModal}
                >
                  Create First Package
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 20,
              }}
            >
              {plans.map((plan) => {
                const isActive = plan.is_active;

                return (
                  <div
                    key={plan.id}
                    className="dashboard-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: 24,
                      position: 'relative',
                      border: isActive ? '1px solid rgba(255, 138, 0, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                      transition: 'border-color 0.2s, transform 0.2s',
                    }}
                  >
                    <div>
                      {/* Top Header: Name & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h4 className="subs-plan-card-title" style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
                            {plan.name}
                          </h4>
                          <span style={{ fontSize: 12, color: '#ff8a00', fontFamily: 'monospace' }}>
                            {plan.slug}
                          </span>
                        </div>

                        <span
                          className="badge"
                          style={{
                            background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#10b981' : '#f87171',
                            border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Pricing Banner */}
                      <div className="subs-price-banner" style={{ margin: '16px 0', padding: '12px 16px', borderRadius: 8, border: '1px solid rgba(255, 138, 0, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 28, fontWeight: 800, color: '#ff8a00' }}>
                            {Number(plan.price).toLocaleString()}
                          </span>
                          <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600 }}>
                            {plan.currency || 'ETB'}
                          </span>
                          <span style={{ fontSize: 13, color: '#64748b', marginLeft: 'auto' }}>
                            / {plan.duration_label || `${plan.duration_value} ${plan.duration_type}`}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p style={{ color: '#64748b', fontSize: 13, minHeight: 40, lineHeight: 1.5, marginBottom: 16 }}>
                        {plan.description || 'Access to modern strength training, cardio floor, and locker facilities.'}
                      </p>

                      {/* Perks Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        <div className="subs-perk-item" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ color: '#10b981' }}>✓</span>
                          <span>
                            Access Hours: <strong className="subs-strong-text" style={{ textTransform: 'capitalize' }}>{plan.access_hours_type?.replace('_', ' ') || 'All Day'}</strong>
                          </span>
                        </div>

                        <div className="subs-perk-item" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ color: plan.has_trainer_access ? '#10b981' : '#64748b' }}>
                            {plan.has_trainer_access ? '✓' : '✕'}
                          </span>
                          <span>
                            {plan.has_trainer_access ? 'Personal Trainer Consultation' : 'No Personal Trainer'}
                          </span>
                        </div>

                        <div className="subs-perk-item" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <span style={{ color: plan.has_class_access ? '#10b981' : '#64748b' }}>
                            {plan.has_class_access ? '✓' : '✕'}
                          </span>
                          <span>
                            {plan.has_class_access
                              ? `Group Classes (${plan.max_class_bookings ? `${plan.max_class_bookings} bookings` : 'Unlimited'})`
                              : 'No Fitness Classes'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Active Subscriptions & Admin Actions */}
                    <div style={{ borderTop: '1px solid #1a1f2c', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        {plan.active_subscribers_count ?? 0} active subscribers
                      </span>

                      {isOwnerOrAdmin && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className="subs-card-btn-edit"
                            onClick={() => handleOpenEditPlanModal(plan)}
                          >
                            <Icons.Edit size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="subs-card-btn-archive"
                            onClick={() => handleDeletePlan(plan)}
                          >
                            <Icons.Trash size={13} />
                            <span>Archive</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL 1: Assign Subscription --- */}
      {isAssignModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Assign Membership Pass</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAssignModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Member Selector */}
                <div>
                  <label className="form-label">Gym Member *</label>
                  <select
                    className="form-input"
                    value={assignForm.member_id}
                    onChange={(e) => setAssignForm({ ...assignForm, member_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Member --</option>
                    {membersList.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name} ({m.member_code}) — {m.phone || 'No Phone'}
                      </option>
                    ))}
                  </select>
                  {formErrors.member_id && (
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                      {formErrors.member_id[0]}
                    </div>
                  )}
                </div>

                {/* Membership Plan Selector */}
                <div>
                  <label className="form-label">Package Plan *</label>
                  <select
                    className="form-input"
                    value={assignForm.membership_plan_id}
                    onChange={(e) => setAssignForm({ ...assignForm, membership_plan_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Plan --</option>
                    {plans.filter(p => p.is_active).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {Number(p.price).toLocaleString()} {p.currency} ({p.duration_label})
                      </option>
                    ))}
                  </select>
                  {formErrors.membership_plan_id && (
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                      {formErrors.membership_plan_id[0]}
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={assignForm.start_date}
                    onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                    required
                  />
                </div>

                {/* Price Breakdown Banner */}
                {selectedAssignPlan && (
                  <div
                    style={{
                      background: 'rgba(255, 138, 0, 0.08)',
                      border: '1px solid rgba(255, 138, 0, 0.25)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Package Price</div>
                      <div className="subs-modal-val" style={{ fontSize: 15, fontWeight: 700 }}>
                        {Number(selectedAssignPlan.price).toLocaleString()} ETB
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#ff8a00' }}>Net Payable Total</div>
                      <div style={{ fontSize: 18, color: '#ff8a00', fontWeight: 800 }}>
                        {assignTotalAmount.toLocaleString()} ETB
                      </div>
                    </div>
                  </div>
                )}

                {/* Internal Notes */}
                <div>
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Promotion code, special requests, desk receipt notes..."
                    value={assignForm.notes}
                    onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm & Assign Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Renew Subscription --- */}
      {isRenewModalOpen && selectedSub && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                Renew Membership: {selectedSub.member?.name || 'Member'} ({selectedSub.member?.member_code || 'ID'})
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsRenewModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRenewSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Member Summary */}
                <div className="subs-modal-summary-box" style={{ padding: 12, borderRadius: 8 }}>
                  <div className="subs-modal-val" style={{ fontWeight: 700 }}>{selectedSub.member?.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                    Current Expiration: <strong style={{ color: '#ff8a00' }}>{selectedSub.end_date}</strong>
                  </div>
                  <div style={{ color: '#10b981', fontSize: 12, marginTop: 4 }}>
                    {selectedSub.is_active
                      ? '✓ Active coverage: Renewal will seamlessly append to current end date + 1 day.'
                      : '⚡ Expired: Renewal will begin coverage starting from today.'}
                  </div>
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="form-label">Renew Package</label>
                  <select
                    className="form-input"
                    value={renewForm.membership_plan_id}
                    onChange={(e) => setRenewForm({ ...renewForm, membership_plan_id: e.target.value })}
                    required
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {Number(p.price).toLocaleString()} {p.currency} ({p.duration_label})
                      </option>
                    ))}
                  </select>
                </div>


                {/* Renewal Notes */}
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Renewal payment reference or remarks..."
                    value={renewForm.notes}
                    onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsRenewModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Renewing...' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Compact Modern Freeze Subscription Pass --- */}
      {isFreezeModalOpen && selectedSub && (
        <div className="modal-backdrop">
          <div className="modal-card freeze-modal-card">
            {/* Header */}
            <div className="modal-header" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="freeze-header-badge">
                  <Icons.Snowflake size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Freeze Membership Pass</h3>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {selectedSub.member?.name || 'Member'} ({selectedSub.member?.member_code || 'ID'}) • Temporary Suspension
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFreezeModalOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFreezeSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 0 }}>
                {/* 1-Line Member & Plan Info Bar */}
                <div className="freeze-member-bar">
                  <span>Pass for: <strong>{selectedSub.member?.name || 'Member'}</strong> <span style={{ color: '#E67C00', fontWeight: 700 }}>({selectedSub.member?.member_code || `ID: ${selectedSub.member_id}`})</span></span>
                  <span style={{ fontWeight: 600 }}>{selectedSub.plan?.name || 'Package'}</span>
                </div>

                {/* Date Selector with Inline Duration Presets */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="freeze-input-label">Freeze Until (Date) *</label>
                    <div className="freeze-presets-row">
                      {[
                        { label: '7d', days: 7 },
                        { label: '14d', days: 14 },
                        { label: '21d', days: 21 },
                        { label: '30d', days: 30 },
                      ].map(preset => (
                        <button
                          key={preset.days}
                          type="button"
                          className={`freeze-preset-btn ${freezeCalculation.days === preset.days ? 'active' : ''}`}
                          onClick={() => handleApplyFreezePreset(preset.days)}
                        >
                          +{preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="freeze-date-input-wrap" onClick={handleOpenFreezeDatePicker}>
                    <span className="freeze-calendar-icon">
                      <Icons.Calendar size={15} />
                    </span>
                    <input
                      ref={freezeDateInputRef}
                      type="date"
                      className="freeze-date-input"
                      min={freezeMinDate}
                      value={freezeForm.frozen_until}
                      onChange={(e) => setFreezeForm({ ...freezeForm, frozen_until: e.target.value })}
                      required
                    />
                  </div>

                  <div className="freeze-date-hint">
                    <span>🗓️ Access pauses until <strong>{freezeCalculation.formattedUntil}</strong></span>
                  </div>

                  {formErrors.frozen_until && (
                    <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2, fontWeight: 600 }}>
                      {formErrors.frozen_until[0]}
                    </div>
                  )}
                </div>

                {/* 1-Line Extension Visualizer */}
                <div className="freeze-extension-visualizer">
                  <span>Expiry: <strong>{selectedSub.end_date || '—'}</strong></span>
                  <span className="freeze-ext-pill">+{freezeCalculation.days}d Extends</span>
                  <span>New: <strong style={{ color: '#16a34a' }}>{freezeCalculation.newEnd}</strong></span>
                </div>

                {/* Reason with Inline Chips */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="freeze-input-label">Reason *</label>
                    <div className="freeze-reasons-wrap">
                      {['Medical', 'Travel', 'Study', 'Personal'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          className="freeze-reason-chip"
                          onClick={() => handleApplyReasonChip(chip)}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    className="freeze-textarea"
                    rows="2"
                    placeholder="Work travel abroad, medical recovery, personal request..."
                    value={freezeForm.reason}
                    onChange={(e) => setFreezeForm({ ...freezeForm, reason: e.target.value })}
                    required
                  ></textarea>

                  {formErrors.reason && (
                    <div style={{ color: '#ef4444', fontSize: 11, marginTop: 2, fontWeight: 600 }}>
                      {formErrors.reason[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Footer */}
              <div className="modal-footer" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsFreezeModalOpen(false)}
                  disabled={isSubmitting}
                  style={{ borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{
                    background: '#E67C00',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: '6px 16px',
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(230, 124, 0, 0.3)',
                  }}
                  disabled={isSubmitting}
                >
                  <Icons.Pause size={12} />
                  <span>{isSubmitting ? 'Freezing...' : `Freeze Pass (+${freezeCalculation.days}d)`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Cancel Subscription --- */}
      {isCancelModalOpen && selectedSub && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ color: '#f87171', fontSize: 18, fontWeight: 600 }}>Cancel Membership Pass</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCancelModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 13,
                    color: '#f87171',
                  }}
                >
                  ⚠️ Warning: This will immediately revoke membership privileges for{' '}
                  <strong>{selectedSub.member?.name}</strong>. This action is permanently audited.
                </div>

                <div>
                  <label className="form-label">Audit Cancellation Reason *</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Relocation, refund requested, policy violation..."
                    value={cancelForm.cancellation_reason}
                    onChange={(e) => setCancelForm({ ...cancelForm, cancellation_reason: e.target.value })}
                    required
                  ></textarea>
                  {formErrors.cancellation_reason && (
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                      {formErrors.cancellation_reason[0]}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Terminating...' : 'Terminate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 5: Create / Edit Package Plan --- */}
      {isPlanModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                {selectedPlanForEdit ? `Edit Package: ${selectedPlanForEdit.name}` : 'Create Membership Package'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsPlanModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePlanSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name */}
                <div>
                  <label className="form-label">Package Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Monthly Standard, VIP Black Annual"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    required
                  />
                  {formErrors.name && (
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                      {formErrors.name[0]}
                    </div>
                  )}
                </div>

                {/* Price & Duration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label">Price (ETB) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-input"
                      placeholder="2500"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Duration Type *</label>
                    <select
                      className="form-input"
                      value={planForm.duration_type}
                      onChange={(e) => setPlanForm({ ...planForm, duration_type: e.target.value })}
                      required
                    >
                      <option value="day">Days</option>
                      <option value="week">Weeks</option>
                      <option value="month">Months</option>
                      <option value="year">Years</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Value *</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={planForm.duration_value}
                      onChange={(e) => setPlanForm({ ...planForm, duration_value: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Access Hours */}
                <div>
                  <label className="form-label">Access Hours</label>
                  <select
                    className="form-input"
                    value={planForm.access_hours_type}
                    onChange={(e) => setPlanForm({ ...planForm, access_hours_type: e.target.value })}
                  >
                    <option value="all_day">All Day (Full Facility Hours)</option>
                    <option value="off_peak">Off-Peak Hours (9:00 AM - 4:00 PM)</option>
                    <option value="morning">Morning Only (6:00 AM - 12:00 PM)</option>
                    <option value="evening">Evening Only (4:00 PM - 10:00 PM)</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Package details and equipment access..."
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  ></textarea>
                </div>

                {/* Perks Checkboxes */}
                <div className="subs-checkbox-box" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 8 }}>
                  <label className="subs-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={planForm.has_trainer_access}
                      onChange={(e) => setPlanForm({ ...planForm, has_trainer_access: e.target.checked })}
                    />
                    Includes Trainer Consultation & Coaching
                  </label>

                  <label className="subs-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={planForm.has_class_access}
                      onChange={(e) => setPlanForm({ ...planForm, has_class_access: e.target.checked })}
                    />
                    Includes Group Workout Classes
                  </label>

                  {planForm.has_class_access && (
                    <div style={{ paddingLeft: 24 }}>
                      <label className="form-label">Max Class Bookings (Leave blank for unlimited)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="e.g. 12"
                        value={planForm.max_class_bookings}
                        onChange={(e) => setPlanForm({ ...planForm, max_class_bookings: e.target.value })}
                      />
                    </div>
                  )}

                  <label className="subs-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={planForm.is_active}
                      onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    />
                    Package Is Active & Available For Enrollment
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsPlanModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
