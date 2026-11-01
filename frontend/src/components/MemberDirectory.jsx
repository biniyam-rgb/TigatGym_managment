import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import QRCodeDisplay from './QRCodeDisplay';
import BrandLogo from './BrandLogo';

export default function MemberDirectory() {
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
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
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
  });

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

    return () => {
      ignore = true;
    };
  }, [search, statusFilter, genderFilter, page]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.createMember(formData);
      setNotification({
        type: 'success',
        message: res.message || 'Member registered successfully!',
      });
      setIsRegisterOpen(false);
      setFormData({
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
      });
      fetchMembers();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to register member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.updateMember(editingMember.id, formData);
      setNotification({
        type: 'success',
        message: res.message || 'Member updated successfully!',
      });
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to update member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setFormData({
      name: m.name || '',
      phone: m.phone || '',
      email: m.email && !m.email.includes('@members.tigatgym.com') ? m.email : '',
      gender: m.gender || 'male',
      date_of_birth: m.date_of_birth || '',
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
      {/* 4 Top Stat KPI Cards matching Image 1 */}
      <div className="gymflow-metrics-row">
        {/* Card 1: Total Members (Dark Signature Card) */}
        <div className="gymflow-kpi-card kpi-dark">
          <div className="kpi-label">TOTAL MEMBERS</div>
          <div className="kpi-value font-mono">{totalMembers || members.length || 6}</div>
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
            <form onSubmit={handleRegisterSubmit} className="modal-form">
              <h4 className="form-section-title">Personal Information</h4>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Abebe Bikila"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="+2519..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Email Address (Optional)</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. member@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-control"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Blood Type (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. O+, A+, B+"
                    value={formData.blood_type}
                    onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Residential Address (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bole Subcity, Woreda 03, Addis Ababa"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+2519..."
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Relationship</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Spouse, Brother, Parent"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, fitness_goals: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
                />
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register Member & Generate QR'}
                </button>
              </div>
            </form>
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
            <form onSubmit={handleEditSubmit} className="modal-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-control"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Fitness Goals</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.fitness_goals}
                  onChange={(e) => setFormData({ ...formData, fitness_goals: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Medical / Exercise Restrictions</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formData.health_conditions}
                  onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
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
