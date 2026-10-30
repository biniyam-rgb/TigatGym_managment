import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import QRCodeDisplay from './QRCodeDisplay';

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

  return (
    <div className="member-directory-container">
      {/* View Header */}
      <div className="section-toolbar">
        <div>
          <h2>Member Directory & Profiles</h2>
          <span className="text-muted">
            TIGAT GYM Active Members Database ({totalMembers} registered)
          </span>
        </div>

        {isStaff && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsRegisterOpen(true)}
          >
            + Register New Member
          </button>
        )}
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`alert alert-${notification.type}`} role="alert">
          <span>{notification.type === 'danger' ? '⚠️' : '✓'} {notification.message}</span>
          <button type="button" className="btn-dismiss" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="filter-bar">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search by name, TG-XXXX code, or phone number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          className="form-control filter-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          className="form-control filter-select"
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

      {/* Members Table */}
      <div className="table-wrapper">
        <table className="gym-table">
          <thead>
            <tr>
              <th>Member Code</th>
              <th>Member Name</th>
              <th>Contact Info</th>
              <th>Emergency Contact</th>
              <th>Membership Plan</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <span className="spinner"></span> Loading registered members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  No gym members found matching criteria.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className="badge-member-code">{m.member_code}</span>
                  </td>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar-sm">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{m.name}</strong>
                        {m.gender && (
                          <div className="text-xs text-muted capitalize">{m.gender}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div><strong>{m.phone}</strong></div>
                    <div className="text-xs text-muted">
                      {m.email && !m.email.includes('@members.tigatgym.com') ? m.email : '—'}
                    </div>
                  </td>
                  <td>
                    {m.emergency_contact_name ? (
                      <div>
                        <span>{m.emergency_contact_name}</span>
                        <div className="text-xs text-muted">
                          {m.emergency_contact_relationship} • {m.emergency_contact_phone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted text-xs">Not recorded</span>
                    )}
                  </td>
                  <td>
                    {m.active_subscription ? (
                      <span className="badge badge-active-plan">
                        {m.active_subscription.plan_name}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">No active plan</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-tag status-${m.status}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => setSelectedMember(m)}
                        title="View digital gym pass and QR code"
                      >
                        🪪 QR Pass
                      </button>

                      {isStaff && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => handleOpenEdit(m)}
                          title="Edit member details"
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
                    <div className="brand-icon-sm">TG</div>
                    <div>
                      <div className="brand-title-sm">TIGAT GYM</div>
                      <span className="brand-subtitle-xs">OFFICIAL MEMBER ACCESS</span>
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
