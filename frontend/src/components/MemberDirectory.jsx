import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import QRCodeDisplay from './QRCodeDisplay';
import BrandLogo from './BrandLogo';
import { BLOOD_TYPES, calculateAge, validateMemberForm } from '../utils/memberValidators';

export default function MemberDirectory({ initialOpenRegister = false }) {
  const { hasRole } = useAuth();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Notifications
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(initialOpenRegister);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [registeredMemberPass, setRegisteredMemberPass] = useState(null);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

  const isStaff = hasRole('owner') || hasRole('admin') || hasRole('receptionist');
  const isManagement = hasRole('owner') || hasRole('admin');

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getMembers({
        search,
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
  }, [search, statusFilter, genderFilter, page]);

  useEffect(() => {
    let ignore = false;
    apiClient.getMembers({ search, status: statusFilter, gender: genderFilter, page, per_page: 10 })
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

    apiClient.getMembershipPlans({ active_only: 1 })
      .then((res) => {
        if (!ignore && res?.data) {
          setMembershipPlans(res.data || []);
        }
      })
      .catch((err) => console.error('Failed to load membership plans:', err));

    return () => {
      ignore = true;
    };
  }, [search, statusFilter, genderFilter, page]);

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

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const errors = validateMemberForm(formData, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setNotification({
        type: 'danger',
        message: 'Please review and fix the highlighted form errors before proceeding.',
      });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
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
      if (formData.membership_plan_id && createdMember?.id) {
        try {
          const subRes = await apiClient.createSubscription({
            member_id: createdMember.id,
            membership_plan_id: Number(formData.membership_plan_id),
            start_date: formData.start_date || new Date().toISOString().split('T')[0],
          });
          createdSubscription = subRes.data || subRes;

          // 3. If immediate payment was selected (not pay_later), record payment
          if (formData.payment_method !== 'pay_later' && createdSubscription?.id) {
            const payAmount = Number(formData.payment_amount) || Number(selectedPlan?.price) || 0;
            const paymentPayload = {
              user_id: createdMember.id,
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
      });

      setFormData(initialFormData);
      fetchMembers();
    } catch (err) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      }
      setNotification({ type: 'danger', message: err.message || 'Failed to register member' });
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
        blood_type: formData.blood_type || null,
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
        message: res.message || 'Member updated successfully!',
      });
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      if (err.data?.errors) {
        setFormErrors(err.data.errors);
      }
      setNotification({ type: 'danger', message: err.message || 'Failed to update member' });
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
      blood_type: m.blood_type || '',
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
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(res.member);
      }
      fetchMembers();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to regenerate QR token.' });
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

  const toggleSelectMember = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)));
    }
  };

  const getExpiryMeta = (m) => {
    if (!m.active_subscription?.end_date) {
      return { text: 'NO ACTIVE PLAN', isExpired: true, date: '—', color: 'text-muted' };
    }
    const end = new Date(m.active_subscription.end_date);
    const now = new Date();
    const diffDays = Math.round((end - now) / 86400000);
    const formattedDate = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    if (diffDays < 0) {
      return { text: `EXPIRED ${Math.abs(diffDays)}D AGO`, isExpired: true, date: formattedDate, color: 'text-red' };
    }
    return { text: `IN ${diffDays} DAYS`, isExpired: false, date: formattedDate, color: 'text-green' };
  };

  return (
    <div className="member-directory-container gymflow-view">
      {/* 4 Top Stat KPI Cards matching clean Tigat Gym SaaS aesthetics */}
      <div className="gymflow-metrics-row">
        {/* Card 1: Total Members */}
        <div className="gymflow-kpi-card kpi-white">
          <div className="kpi-label">TOTAL MEMBERS</div>
          <div className="kpi-value font-mono">{totalMembers || members.length || 0}</div>
        </div>

        {/* Card 2: Expiring Soon */}
        <div className="gymflow-kpi-card kpi-white">
          <div className="kpi-label">EXPIRING SOON</div>
          <div className="kpi-value kpi-red font-mono">0</div>
        </div>

        {/* Card 3: At-Risk */}
        <div className="gymflow-kpi-card kpi-white">
          <div className="kpi-label">AT-RISK</div>
          <div className="kpi-value kpi-orange font-mono">2</div>
        </div>

        {/* Card 4: Total Dues */}
        <div className="gymflow-kpi-card kpi-white">
          <div className="kpi-label">TOTAL DUES</div>
          <div className="kpi-value kpi-red font-mono">0 ETB</div>
        </div>

        {/* Action Button: + ADD MEMBER */}
        {isStaff && (
          <button
            type="button"
            className="gymflow-add-member-btn"
            onClick={() => setIsRegisterOpen(true)}
            title="Register a new member at reception desk"
          >
            <span className="add-plus-icon">+</span>
            <span>ADD MEMBER</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`alert alert-${notification.type}`} role="alert" style={{ marginTop: 16 }}>
          <span>{notification.type === 'danger' ? '⚠️' : '✓'} {notification.message}</span>
          <button type="button" className="btn-dismiss" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Search & Filter Controls Toolbar matching Image 1 */}
      <div className="gymflow-controls-bar">
        {/* Rounded Search Input with Magnifier & Microphone */}
        <div className="gymflow-search-box">
          <span className="search-icon-lens">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="gymflow-search-input"
            placeholder="Search by name, phone, reg no, plan, or status"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <span className="search-icon-mic" title="Voice search shortcut">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
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
                <th style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    className="gymflow-checkbox"
                    checked={members.length > 0 && selectedIds.size === members.length}
                    onChange={toggleSelectAll}
                    title="Select all members"
                  />
                </th>
                <th>MEMBER</th>
                <th>
                  ENGAGEMENT
                  <span className="th-subtext">Green = checked in</span>
                </th>
                <th>PLAN / STATUS</th>
                <th>EXPIRY ↑</th>
                <th className="text-right">QUICK ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <span className="spinner"></span> Loading registered members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No gym members found matching criteria.
                  </td>
                </tr>
              ) : (
                members.map((m, idx) => {
                  const expiry = getExpiryMeta(m);
                  const isSelected = selectedIds.has(m.id);
                  const initials = m.name?.charAt(0).toLowerCase() || 'm';

                  // Dynamic color tag for initial square
                  const avatarColors = ['#1e293b', '#d97706', '#0f766e', '#4338ca', '#be123c'];
                  const avatarBg = avatarColors[idx % avatarColors.length];

                  return (
                    <tr key={m.id} className={isSelected ? 'row-selected' : ''}>
                      {/* Checkbox */}
                      <td>
                        <input
                          type="checkbox"
                          className="gymflow-checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectMember(m.id)}
                        />
                      </td>

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
                          <span className={`gymflow-status-pill pill-${m.status === 'active' ? 'active' : m.status === 'inactive' ? 'at-risk' : 'lost'}`}>
                            • {m.status === 'active' ? 'ACTIVE' : m.status === 'inactive' ? 'AT-RISK' : 'LOST'}
                          </span>
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

                      {/* Quick Action Circles matching Image 1 */}
                      <td className="text-right">
                        <div className="gymflow-actions-flex">
                          {/* Dark Circle Check-in Button */}
                          <button
                            type="button"
                            className="gymflow-circle-action action-check"
                            title="Verify Check-in Pass"
                            onClick={() => setSelectedMember(m)}
                          >
                            ✓
                          </button>

                          {/* Orange Circle Renew Button */}
                          <button
                            type="button"
                            className="gymflow-circle-action action-renew"
                            title="Renew / Modify Subscription"
                            onClick={() => isStaff && handleOpenEdit(m)}
                          >
                            ↻
                          </button>

                          {/* Green Circle WhatsApp / Message Button */}
                          <a
                            href={`https://wa.me/${m.phone?.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gymflow-circle-action action-message"
                            title="Direct Message via WhatsApp"
                          >
                            💬
                          </a>

                          {/* 3-Dots Action Button */}
                          <button
                            type="button"
                            className="gymflow-circle-action action-more"
                            title="Member Profile & Management"
                            onClick={() => setSelectedMember(m)}
                          >
                            ⋮
                          </button>
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
          {members.map((m, idx) => {
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
                    🪪 QR Pass
                  </button>
                  {isStaff && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleOpenEdit(m)}
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {isManagement && (
                    <button
                      type="button"
                      className="btn-action-icon btn-danger-icon"
                      onClick={() => handleDeleteMember(m)}
                      title="Delete member record"
                    >
                      🗑️
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

      {/* Modal 1: Register New Member */}
      {isRegisterOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-wide">
            <div className="modal-header">
              <h3>Register New Member</h3>
              <button type="button" className="btn-close" onClick={() => setIsRegisterOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="modal-form" noValidate>
              <h4 className="form-section-title">Personal Information</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className={`form-control ${formErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Abebe Bikila"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                  {formErrors.name && <span className="form-error-text">⚠️ {formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    required
                    className={`form-control ${formErrors.phone ? 'input-error' : ''}`}
                    placeholder="09... or +2519..."
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                  {formErrors.phone && <span className="form-error-text">⚠️ {formErrors.phone}</span>}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Email Address (Optional)</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'input-error' : ''}`}
                    placeholder="e.g. member@email.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                  {formErrors.email && <span className="form-error-text">⚠️ {formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-control"
                    value={formData.gender}
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label>Date of Birth (Select Date)</label>
                    {formData.date_of_birth && !formErrors.date_of_birth && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                        ✓ Age: {calculateAge(formData.date_of_birth)} yrs
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="date"
                      className={`form-control ${formErrors.date_of_birth ? 'input-error' : ''}`}
                      max={maxDobString}
                      min="1920-01-01"
                      value={formData.date_of_birth}
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      style={{ cursor: 'pointer', width: '100%' }}
                      title="Click to select birth date"
                    />
                  </div>
                  {formData.date_of_birth && !formErrors.date_of_birth && (
                    <span style={{ fontSize: 11, color: '#0284c7', marginTop: 3, display: 'block' }}>
                      Selected: {new Date(formData.date_of_birth + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {formErrors.date_of_birth && (
                    <span className="form-error-text">⚠️ {formErrors.date_of_birth}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Blood Type (Optional)</label>
                  <select
                    className={`form-control ${formErrors.blood_type ? 'input-error' : ''}`}
                    value={formData.blood_type}
                    onChange={(e) => handleFieldChange('blood_type', e.target.value)}
                  >
                    <option value="">-- Select Blood Group (Optional) --</option>
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt.value} value={bt.value}>
                        {bt.value}
                      </option>
                    ))}
                  </select>
                  {formErrors.blood_type && (
                    <span className="form-error-text">⚠️ {formErrors.blood_type}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Residential Address (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Woreda 03, Bole, Addis Ababa"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
              </div>

              <h4 className="form-section-title" style={{ marginTop: 16 }}>Emergency Contact</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Almaz Bekele"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.emergency_contact_phone ? 'input-error' : ''}`}
                    placeholder="09... or +2519..."
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                  />
                  {formErrors.emergency_contact_phone && (
                    <span className="form-error-text">⚠️ {formErrors.emergency_contact_phone}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Spouse, Brother, Parent"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
                />
              </div>

              <h4 className="form-section-title" style={{ marginTop: 16 }}>Fitness & Health Notes (Optional)</h4>
              <div className="form-group">
                <label>Fitness Goals</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Muscle hypertrophy, fat loss, marathon training"
                  value={formData.fitness_goals}
                  onChange={(e) => handleFieldChange('fitness_goals', e.target.value)}
                />
              </div>

              <div className="form-group">
                <div className="label-with-hint">
                  <label>Medical / Exercise Restrictions (Privacy Protected)</label>
                  <span className="text-xs text-muted">Visible only to authorized trainers and management</span>
                </div>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Previous knee injury, asthma, lower back sensitivity"
                  value={formData.health_conditions}
                  onChange={(e) => handleFieldChange('health_conditions', e.target.value)}
                />
              </div>

              {/* Membership Plan & Initial Payment Reception */}
              <h4 className="form-section-title" style={{ marginTop: 22, color: '#E67C00', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>💳</span> Membership Plan & Payment Reception
              </h4>

              <div style={{
                background: '#fffaf5',
                border: '1.5px solid #fed7aa',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 16,
              }}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                    Select Membership Plan <span style={{ color: '#E67C00' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={formData.membership_plan_id}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const selected = membershipPlans.find((p) => String(p.id) === String(pId));
                      setFormData({
                        ...formData,
                        membership_plan_id: pId,
                        payment_amount: selected ? String(selected.price) : '',
                      });
                    }}
                    style={{ background: '#ffffff', borderColor: '#E67C00', fontWeight: 600, fontSize: 13.5 }}
                  >
                    <option value="">-- No plan yet (Register Only / Pay Later) --</option>
                    {membershipPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} — {Number(plan.price).toLocaleString()} ETB ({plan.duration_value} {plan.duration_type}{plan.duration_value > 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11.5, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Selecting a plan automatically creates the subscription and activates gym access.
                  </span>
                </div>

                {formData.membership_plan_id && (
                  <>
                    <div className="form-row-2" style={{ marginBottom: 14 }}>
                      <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: 12 }}>Package Price (ETB)</label>
                        <input
                          type="number"
                          className={`form-control ${formErrors.payment_amount ? 'input-error' : ''}`}
                          value={formData.payment_amount}
                          onChange={(e) => handleFieldChange('payment_amount', e.target.value)}
                          placeholder="Price in ETB"
                          style={{ fontWeight: 700, color: '#E67C00' }}
                        />
                        {formErrors.payment_amount && (
                          <span className="form-error-text">⚠️ {formErrors.payment_amount}</span>
                        )}
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: 12 }}>Plan Start Date</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="date"
                            min={minStartDateString}
                            max={maxStartDateString}
                            className={`form-control ${formErrors.start_date ? 'input-error' : ''}`}
                            value={formData.start_date}
                            onChange={(e) => handleFieldChange('start_date', e.target.value)}
                            onClick={(e) => openDatePicker(e.currentTarget)}
                            style={{ cursor: 'pointer', width: '100%' }}
                            title="Click to select start day"
                          />
                        </div>
                        {formErrors.start_date && (
                          <span className="form-error-text">⚠️ {formErrors.start_date}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: 12 }}>
                        Payment Method <span style={{ color: '#E67C00' }}>*</span>
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
                              padding: '10px 14px',
                              borderRadius: 8,
                              background: formData.payment_method === m.id ? '#fff7ed' : '#ffffff',
                              border: formData.payment_method === m.id ? '2px solid #E67C00' : '1px solid #e2e8f0',
                              cursor: 'pointer',
                              fontSize: 13,
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
                            <span style={{ fontSize: 16 }}>{m.icon}</span>
                            <span>{m.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {formData.payment_method === 'chapa' && (
                      <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: 12 }}>
                          Chapa Reference / Transaction ID <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.payment_reference ? 'input-error' : ''}`}
                          placeholder="e.g. Chapa Tx Ref (CHP-123456 or Receipt ID)"
                          value={formData.payment_reference}
                          onChange={(e) => handleFieldChange('payment_reference', e.target.value)}
                        />
                        {formErrors.payment_reference && (
                          <span className="form-error-text">⚠️ {formErrors.payment_reference}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRegisterOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#E67C00', borderColor: '#E67C00' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering & Processing...' : 'Register Member & Issue Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Digital QR Pass & Official Receipt (Shown Immediately After Registration) */}
      {registeredMemberPass && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 520, textAlign: 'center', padding: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>
              ✓
            </div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
              Member Registered & Pass Ready!
            </h3>
            <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#64748b' }}>
              Official admission credentials for front-desk QR turnstile & mobile pass.
            </p>

            <div style={{
              background: '#ffffff',
              border: '2px solid #E67C00',
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              boxShadow: '0 8px 30px rgba(230, 124, 0, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                <BrandLogo variant="reception" />
                <span className="badge" style={{ background: '#ecfdf5', color: '#059669', fontWeight: 700 }}>
                  Active Pass
                </span>
              </div>

              <div style={{ margin: '14px 0', display: 'flex', justifyContent: 'center' }}>
                <QRCodeDisplay
                  text={registeredMemberPass.member?.qr_token || registeredMemberPass.member?.member_code || 'TIGAT-MEMBER'}
                  size={150}
                  level="M"
                />
              </div>

              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                {registeredMemberPass.member?.name}
              </div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#E67C00', marginTop: 2 }}>
                {registeredMemberPass.member?.member_code || 'TG-0000'}
              </div>

              {registeredMemberPass.plan && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#64748b' }}>Plan:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{registeredMemberPass.plan.name}</span>
                </div>
              )}

              {registeredMemberPass.payment && (
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#64748b' }}>Paid ({registeredMemberPass.paymentMethod?.toUpperCase()}):</span>
                  <span style={{ fontWeight: 800, color: '#16a34a' }}>
                    {Number(registeredMemberPass.payment.amount || registeredMemberPass.plan?.price || 0).toLocaleString()} ETB
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>🖨️</span> Print Pass / Receipt
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setRegisteredMemberPass(null)}
                style={{ background: '#E67C00', borderColor: '#E67C00' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Member Profile */}
      {editingMember && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-wide">
            <div className="modal-header">
              <h3>Edit Member Profile: {editingMember.name} ({editingMember.member_code})</h3>
              <button type="button" className="btn-close" onClick={() => setEditingMember(null)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="modal-form" noValidate>
              <h4 className="form-section-title">Personal Information</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className={`form-control ${formErrors.name ? 'input-error' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                  />
                  {formErrors.name && <span className="form-error-text">⚠️ {formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    required
                    className={`form-control ${formErrors.phone ? 'input-error' : ''}`}
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                  />
                  {formErrors.phone && <span className="form-error-text">⚠️ {formErrors.phone}</span>}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${formErrors.email ? 'input-error' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                  />
                  {formErrors.email && <span className="form-error-text">⚠️ {formErrors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-control"
                    value={formData.gender}
                    onChange={(e) => handleFieldChange('gender', e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label>Date of Birth (Select Date)</label>
                    {formData.date_of_birth && !formErrors.date_of_birth && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                        ✓ Age: {calculateAge(formData.date_of_birth)} yrs
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="date"
                      className={`form-control ${formErrors.date_of_birth ? 'input-error' : ''}`}
                      max={maxDobString}
                      min="1920-01-01"
                      value={formData.date_of_birth}
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      onClick={(e) => openDatePicker(e.currentTarget)}
                      style={{ cursor: 'pointer', width: '100%' }}
                      title="Click to select birth date"
                    />
                  </div>
                  {formData.date_of_birth && !formErrors.date_of_birth && (
                    <span style={{ fontSize: 11, color: '#0284c7', marginTop: 3, display: 'block' }}>
                      Selected: {new Date(formData.date_of_birth + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {formErrors.date_of_birth && (
                    <span className="form-error-text">⚠️ {formErrors.date_of_birth}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Blood Type (Optional)</label>
                  <select
                    className={`form-control ${formErrors.blood_type ? 'input-error' : ''}`}
                    value={formData.blood_type}
                    onChange={(e) => handleFieldChange('blood_type', e.target.value)}
                  >
                    <option value="">-- Select Blood Group (Optional) --</option>
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt.value} value={bt.value}>
                        {bt.value}
                      </option>
                    ))}
                  </select>
                  {formErrors.blood_type && (
                    <span className="form-error-text">⚠️ {formErrors.blood_type}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Residential Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Woreda 03, Addis Ababa"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
              </div>

              <h4 className="form-section-title" style={{ marginTop: 16 }}>Emergency Contact</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.emergency_contact_phone ? 'input-error' : ''}`}
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                  />
                  {formErrors.emergency_contact_phone && (
                    <span className="form-error-text">⚠️ {formErrors.emergency_contact_phone}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Spouse, Brother, Parent"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
                />
              </div>

              <h4 className="form-section-title" style={{ marginTop: 16 }}>Fitness & Health Notes (Optional)</h4>
              <div className="form-group">
                <label>Fitness Goals</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.fitness_goals}
                  onChange={(e) => handleFieldChange('fitness_goals', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Medical / Exercise Restrictions</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.health_conditions}
                  onChange={(e) => handleFieldChange('health_conditions', e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingMember(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#E67C00', borderColor: '#E67C00' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Digital Gym Card & QR Pass */}
      {selectedMember && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>TIGAT GYM — Digital Member Pass</h3>
              <button type="button" className="btn-close" onClick={() => setSelectedMember(null)}>×</button>
            </div>

            <div className="digital-card-container">
              <div className="gym-pass-card">
                <div className="pass-header">
                  <div className="brand-group">
                    <BrandLogo variant="pass" size={48} showSubtext={false} />
                    <div>
                      <div className="brand-title-sm">TIGAT GYM</div>
                      <span className="brand-subtitle-xs">ትጋት ጂም • MEMBER ACCESS</span>
                    </div>
                  </div>
                  <span className="badge-member-code">{selectedMember.member_code}</span>
                </div>

                <div className="pass-body">
                  <div className="pass-qr-wrapper">
                    <QRCodeDisplay
                      value={selectedMember.qr_code_token}
                      memberCode={selectedMember.member_code}
                      memberName={selectedMember.name}
                      size={180}
                    />
                  </div>

                  <div className="pass-details-list">
                    <div className="pass-row">
                      <span className="pass-label">Full Name:</span>
                      <strong className="pass-val">{selectedMember.name}</strong>
                    </div>
                    <div className="pass-row">
                      <span className="pass-label">Phone:</span>
                      <span className="pass-val">{selectedMember.phone}</span>
                    </div>
                    <div className="pass-row">
                      <span className="pass-label">Membership:</span>
                      <span className="pass-val highlight">
                        {selectedMember.active_subscription
                          ? selectedMember.active_subscription.plan_name
                          : 'No Active Subscription'}
                      </span>
                    </div>
                    <div className="pass-row">
                      <span className="pass-label">Joined Date:</span>
                      <span className="pass-val text-muted">{selectedMember.joined_at}</span>
                    </div>
                    {selectedMember.date_of_birth && (
                      <div className="pass-row">
                        <span className="pass-label">Age / DOB:</span>
                        <span className="pass-val">
                          {calculateAge(selectedMember.date_of_birth)} yrs ({selectedMember.date_of_birth.slice(0, 10)})
                        </span>
                      </div>
                    )}
                    {selectedMember.blood_type && (
                      <div className="pass-row">
                        <span className="pass-label">Blood Type:</span>
                        <span className="pass-val" style={{ color: '#dc2626', fontWeight: 700 }}>
                          🩸 {selectedMember.blood_type}
                        </span>
                      </div>
                    )}
                    {selectedMember.emergency_contact_name && (
                      <div className="pass-row">
                        <span className="pass-label">Emergency:</span>
                        <span className="pass-val text-sm">
                          {selectedMember.emergency_contact_name} ({selectedMember.emergency_contact_phone})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pass-footer">
                  <span>Tamper-proof encrypted QR identification token</span>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              {isStaff ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRegenerateQr(selectedMember.id)}
                  title="Generate a new secure QR token if member lost card"
                >
                  🔄 Regenerate QR Token
                </button>
              ) : <div></div>}

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => window.print()}
              >
                🖨️ Print Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
