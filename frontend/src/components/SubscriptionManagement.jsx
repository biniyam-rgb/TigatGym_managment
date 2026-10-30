import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';

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
        per_page: 15,
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

    const params = {
      page: subsPage,
      per_page: 15,
    };
    if (subsSearch) params.search = subsSearch;
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
  }, [subsPage, subsSearch, subsStatusFilter, subsPlanFilter, isStaff]);

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
      const res = await apiClient.freezeSubscription(selectedSub.id, freezeForm);
      showNotification('success', res.message || 'Subscription frozen successfully.');
      setIsFreezeModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        showNotification('error', err.message || 'Failed to freeze subscription.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Unfreeze Subscription
  const handleUnfreeze = async (sub) => {
    if (!window.confirm(`Unfreeze and reactivate pass for ${sub.member?.name || 'this member'}?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiClient.unfreezeSubscription(sub.id);
      showNotification('success', res.message || 'Subscription reactivated.');
      fetchSubscriptions();
    } catch (err) {
      showNotification('error', err.message || 'Failed to unfreeze subscription.');
    } finally {
      setIsSubmitting(false);
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
          <span>{notification.message}</span>
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
          padding: '16px 20px',
        }}
      >
        {/* Sub-Tabs: Subscriptions vs Plans */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`btn btn-sm ${activeTab === 'subscriptions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Member Passes & Subscriptions
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                background: activeTab === 'subscriptions' ? 'rgba(0,0,0,0.3)' : 'rgba(255,138,0,0.2)',
                color: activeTab === 'subscriptions' ? '#fff' : '#ff8a00',
              }}
            >
              {subsMeta.total || subscriptions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`btn btn-sm ${activeTab === 'plans' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Membership Packages Catalog
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                background: activeTab === 'plans' ? 'rgba(0,0,0,0.3)' : 'rgba(255,138,0,0.2)',
                color: activeTab === 'plans' ? '#fff' : '#ff8a00',
              }}
            >
              {plans.length}
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isStaff && activeTab === 'subscriptions' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenAssignModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Assign Subscription Pass
            </button>
          )}

          {isOwnerOrAdmin && activeTab === 'plans' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreatePlanModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New Package
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
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search SUB-#, member name, code, phone..."
                value={subsSearch}
                onChange={(e) => {
                  setSubsSearch(e.target.value);
                  setSubsPage(1);
                }}
                style={{ paddingLeft: 36, width: '100%' }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                }}
              >
                🔍
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
              style={{ flex: '0 1 160px' }}
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
              style={{ flex: '0 1 180px' }}
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
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSubsSearch('');
                  setSubsStatusFilter('');
                  setSubsPlanFilter('');
                  setSubsPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Subscriptions Table */}
          <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pass ID</th>
                    <th>Member Details</th>
                    <th>Membership Plan</th>
                    <th>Coverage Period</th>
                    <th>Status</th>
                    <th>Days Left</th>
                    <th>Price (ETB)</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
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
                        <div style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>No subscriptions found</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                          {subsSearch || subsStatusFilter
                            ? 'Try clearing filters to see more results.'
                            : 'Assign a member pass to begin tracking subscriptions.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const isActive = sub.status === 'active';
                      const isFrozen = sub.status === 'frozen';
                      const isExpired = sub.status === 'expired' || sub.is_expired;

                      let statusBadgeBg = 'rgba(16, 185, 129, 0.15)';
                      let statusColor = '#10b981';
                      let statusBorder = 'rgba(16, 185, 129, 0.3)';

                      if (isFrozen) {
                        statusBadgeBg = 'rgba(56, 189, 248, 0.15)';
                        statusColor = '#38bdf8';
                        statusBorder = 'rgba(56, 189, 248, 0.3)';
                      } else if (isExpired) {
                        statusBadgeBg = 'rgba(245, 158, 11, 0.15)';
                        statusColor = '#f59e0b';
                        statusBorder = 'rgba(245, 158, 11, 0.3)';
                      } else if (sub.status === 'cancelled') {
                        statusBadgeBg = 'rgba(239, 68, 68, 0.15)';
                        statusColor = '#f87171';
                        statusBorder = 'rgba(239, 68, 68, 0.3)';
                      }

                      return (
                        <tr key={sub.id}>
                          {/* Pass ID */}
                          <td>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                color: '#ff8a00',
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              {sub.subscription_number}
                            </span>
                          </td>

                          {/* Member */}
                          <td>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>
                              {sub.member?.name || 'Unknown Member'}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#ff8a00',
                                  background: 'rgba(255,138,0,0.1)',
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                {sub.member?.member_code || 'No Code'}
                              </span>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                {sub.member?.phone || ''}
                              </span>
                            </div>
                          </td>

                          {/* Plan */}
                          <td>
                            <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: 13 }}>
                              {sub.plan?.name || 'Standard Package'}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 11 }}>
                              {sub.plan?.has_trainer_access && (
                                <span style={{ color: '#ff8a00', background: 'rgba(255,138,0,0.15)', padding: '1px 5px', borderRadius: 3 }}>
                                  PT Included
                                </span>
                              )}
                              {sub.plan?.has_class_access && (
                                <span style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '1px 5px', borderRadius: 3 }}>
                                  Classes
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Validity */}
                          <td>
                            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                              {sub.start_date} <span style={{ color: '#64748b' }}>→</span> {sub.end_date}
                            </div>
                            {isFrozen && sub.frozen_until && (
                              <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 2 }}>
                                Frozen until {sub.frozen_until}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: statusBadgeBg,
                                color: statusColor,
                                border: `1px solid ${statusBorder}`,
                                textTransform: 'capitalize',
                              }}
                            >
                              {sub.status}
                            </span>
                          </td>

                          {/* Days Left */}
                          <td>
                            {isActive ? (
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: sub.days_remaining <= 5 ? '#f87171' : sub.days_remaining <= 10 ? '#f59e0b' : '#10b981',
                                }}
                              >
                                {sub.days_remaining} {sub.days_remaining === 1 ? 'day' : 'days'}
                              </span>
                            ) : isFrozen ? (
                              <span style={{ fontSize: 12, color: '#38bdf8' }}>On Hold</span>
                            ) : (
                              <span style={{ fontSize: 12, color: '#64748b' }}>—</span>
                            )}
                          </td>

                          {/* Price */}
                          <td>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>
                              {Number(sub.total_amount).toLocaleString()} {sub.currency || 'ETB'}
                            </div>
                            {Number(sub.discount) > 0 && (
                              <div style={{ fontSize: 11, color: '#10b981' }}>
                                -{Number(sub.discount).toLocaleString()} ETB promo
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              {/* Renew Button */}
                              {isStaff && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenRenewModal(sub)}
                                  title="Renew Subscription"
                                  style={{ padding: '4px 8px', fontSize: 12 }}
                                >
                                  Renew
                                </button>
                              )}

                              {/* Freeze Button (for Active) */}
                              {isStaff && isActive && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenFreezeModal(sub)}
                                  title="Freeze Pass"
                                  style={{ padding: '4px 8px', fontSize: 12, color: '#38bdf8' }}
                                >
                                  Freeze
                                </button>
                              )}

                              {/* Unfreeze Button (for Frozen) */}
                              {isStaff && isFrozen && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleUnfreeze(sub)}
                                  title="Reactivate Frozen Pass"
                                  style={{ padding: '4px 8px', fontSize: 12, color: '#10b981' }}
                                >
                                  Unfreeze
                                </button>
                              )}

                              {/* Cancel Button (Owner/Admin) */}
                              {isOwnerOrAdmin && (isActive || isFrozen) && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenCancelModal(sub)}
                                  title="Terminate Pass"
                                  style={{ padding: '4px 8px', fontSize: 12, color: '#f87171' }}
                                >
                                  Cancel
                                </button>
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

            {/* Pagination */}
            {subsMeta.last_page > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid #1a1f2c',
                  fontSize: 13,
                  color: '#94a3b8',
                }}
              >
                <div>
                  Page {subsMeta.current_page} of {subsMeta.last_page} ({subsMeta.total} records)
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={subsPage <= 1}
                    onClick={() => setSubsPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={subsPage >= subsMeta.last_page}
                    onClick={() => setSubsPage((p) => Math.min(subsMeta.last_page, p + 1))}
                  >
                    Next →
                  </button>
                </div>
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
              <h3 style={{ color: '#fff', marginBottom: 6 }}>No Membership Packages Configured</h3>
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
                          <h4 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>
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
                      <div style={{ margin: '16px 0', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid #1a1f2c' }}>
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
                      <p style={{ color: '#94a3b8', fontSize: 13, minHeight: 40, lineHeight: 1.5, marginBottom: 16 }}>
                        {plan.description || 'Access to modern strength training, cardio floor, and locker facilities.'}
                      </p>

                      {/* Perks Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
                          <span style={{ color: '#10b981' }}>✓</span>
                          <span>
                            Access Hours: <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{plan.access_hours_type?.replace('_', ' ') || 'All Day'}</strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
                          <span style={{ color: plan.has_trainer_access ? '#10b981' : '#64748b' }}>
                            {plan.has_trainer_access ? '✓' : '✕'}
                          </span>
                          <span style={{ color: plan.has_trainer_access ? '#cbd5e1' : '#64748b' }}>
                            {plan.has_trainer_access ? 'Personal Trainer Consultation' : 'No Personal Trainer'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1' }}>
                          <span style={{ color: plan.has_class_access ? '#10b981' : '#64748b' }}>
                            {plan.has_class_access ? '✓' : '✕'}
                          </span>
                          <span style={{ color: plan.has_class_access ? '#cbd5e1' : '#64748b' }}>
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
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditPlanModal(plan)}
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDeletePlan(plan)}
                            style={{ fontSize: 12, padding: '4px 10px', color: '#f87171' }}
                          >
                            Archive
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
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Assign Membership Pass</h3>
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

                {/* Date & Discount row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

                  <div>
                    <label className="form-label">Discount (ETB)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-input"
                      placeholder="0.00"
                      value={assignForm.discount}
                      onChange={(e) => setAssignForm({ ...assignForm, discount: e.target.value })}
                    />
                  </div>
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
                      <div style={{ fontSize: 15, color: '#fff', fontWeight: 600 }}>
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
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                Renew Pass: {selectedSub.subscription_number}
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
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, border: '1px solid #1a1f2c' }}>
                  <div style={{ color: '#fff', fontWeight: 600 }}>{selectedSub.member?.name}</div>
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

                {/* Discount */}
                <div>
                  <label className="form-label">Discount (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    placeholder="0.00"
                    value={renewForm.discount}
                    onChange={(e) => setRenewForm({ ...renewForm, discount: e.target.value })}
                  />
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

      {/* --- MODAL 3: Freeze Subscription --- */}
      {isFreezeModalOpen && selectedSub && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Freeze Membership Pass</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFreezeModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFreezeSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                  Freezing temporarily suspends gym access for <strong style={{ color: '#fff' }}>{selectedSub.member?.name}</strong>.
                  Their pass expiration date will automatically be extended by the freeze duration.
                </p>

                <div>
                  <label className="form-label">Freeze Until (Future Date) *</label>
                  <input
                    type="date"
                    className="form-input"
                    min={freezeMinDate}
                    value={freezeForm.frozen_until}
                    onChange={(e) => setFreezeForm({ ...freezeForm, frozen_until: e.target.value })}
                    required
                  />
                  {formErrors.frozen_until && (
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                      {formErrors.frozen_until[0]}
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">Reason for Freezing *</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Work travel abroad, medical recovery, personal request..."
                    value={freezeForm.reason}
                    onChange={(e) => setFreezeForm({ ...freezeForm, reason: e.target.value })}
                    required
                  ></textarea>
                  {formErrors.reason && (
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                      {formErrors.reason[0]}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsFreezeModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#38bdf8', borderColor: '#38bdf8', color: '#000' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Freezing...' : 'Freeze Pass'}
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
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
                    <input
                      type="checkbox"
                      checked={planForm.has_trainer_access}
                      onChange={(e) => setPlanForm({ ...planForm, has_trainer_access: e.target.checked })}
                    />
                    Includes Trainer Consultation & Coaching
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
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

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
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
