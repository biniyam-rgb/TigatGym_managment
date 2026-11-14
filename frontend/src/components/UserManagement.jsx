import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import useDebounce from '../hooks/useDebounce';

const Icons = {
  Search: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

export default function UserManagement() {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Status/Error notification
  const [notification, setNotification] = useState(null);

  // Create User Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'Password123!',
    role: 'member',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role Assignment Modal state
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roleToAssign, setRoleToAssign] = useState('');

  // Suspension Reason Modal state
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  const PRESET_SUSPENSION_REASONS = [
    'Facility Rule Violation',
    'Payment Dispute / Outstanding Fees',
    'Misconduct / Conduct Incident',
    'Equipment Misuse or Damage',
    'Gym Safety Policy Breach',
    'Temporary Medical Hold',
  ];

  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient.getUsers({
        search: debouncedSearch,
        role: selectedRole,
        status: selectedStatus,
        page,
        per_page: 10,
      });

      if (res?.data) {
        setUsers(res.data);
        setTotalPages(res.last_page || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to load users' });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedRole, selectedStatus, page]);

  // Load roles once on mount
  useEffect(() => {
    let ignore = false;
    apiClient.getRoles()
      .then((rolesRes) => {
        if (!ignore && rolesRes?.roles) {
          setRoles(rolesRes.roles);
        }
      })
      .catch((err) => console.warn('Could not fetch roles list:', err.message));

    return () => {
      ignore = true;
    };
  }, []);

  // Load users when search, role, status, or page changes
  useEffect(() => {
    let ignore = false;
    setTimeout(() => {
      if (!ignore) setIsLoading(true);
    }, 0);

    apiClient.getUsers({
      search: debouncedSearch,
      role: selectedRole,
      status: selectedStatus,
      page,
      per_page: 10,
    })
      .then((usersRes) => {
        if (!ignore && usersRes?.data) {
          setUsers(usersRes.data);
          setTotalPages(usersRes.last_page || 1);
          setTotalCount(usersRes.total || 0);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setNotification({ type: 'danger', message: err.message || 'Failed to load users' });
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [debouncedSearch, selectedRole, selectedStatus, page]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.createUser(createForm);
      setNotification({ type: 'success', message: `User "${createForm.name}" created successfully.` });
      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        password: 'Password123!',
        role: 'member',
        status: 'active',
      });
      fetchUsers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to create user.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (targetUser, newStatus) => {
    if (newStatus === 'suspended') {
      setSuspendModalUser(targetUser);
      setSuspensionReason(targetUser.suspension_reason || '');
      return;
    }

    try {
      await apiClient.updateUser(targetUser.id, { status: newStatus });
      setNotification({
        type: 'success',
        message: newStatus === 'active'
          ? `Account for "${targetUser.name}" reactivated successfully.`
          : `Account status for "${targetUser.name}" changed to ${newStatus}.`,
      });
      fetchUsers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Status change rejected.' });
    }
  };

  const handleConfirmSuspension = async (e) => {
    e?.preventDefault();
    if (!suspendModalUser) return;
    if (!suspensionReason.trim()) {
      setNotification({
        type: 'danger',
        message: 'Please provide a clear reason for suspension so the front desk can explain it to the user.',
      });
      return;
    }

    setIsSuspending(true);
    try {
      await apiClient.updateUser(suspendModalUser.id, {
        status: 'suspended',
        suspension_reason: suspensionReason.trim(),
      });
      setNotification({
        type: 'success',
        message: `Account for "${suspendModalUser.name}" suspended. Reason logged for Reception dashboard.`,
      });
      setSuspendModalUser(null);
      setSuspensionReason('');
      fetchUsers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to suspend user.' });
    } finally {
      setIsSuspending(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to delete account for "${targetUser.name}"?`)) {
      return;
    }
    try {
      await apiClient.deleteUser(targetUser.id);
      setNotification({ type: 'success', message: `Account "${targetUser.name}" deleted.` });
      fetchUsers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Could not delete user.' });
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!roleModalUser || !roleToAssign) return;

    try {
      await apiClient.assignRole(roleModalUser.id, roleToAssign);
      setNotification({
        type: 'success',
        message: `Role "${roleToAssign}" granted to ${roleModalUser.name}.`,
      });
      setRoleModalUser(null);
      setRoleToAssign('');
      fetchUsers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Role assignment failed.' });
    }
  };

  const handleRemoveRole = async (targetUser, roleName) => {
    if (!window.confirm(`Revoke role "${roleName}" from ${targetUser.name}?`)) {
      return;
    }
    try {
      await apiClient.removeRole(targetUser.id, roleName);
      setNotification({
        type: 'success',
        message: `Role "${roleName}" revoked from ${targetUser.name}.`,
      });
      fetchUsers();
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Role removal failed.' });
    }
  };

  const isOwner = hasRole('owner');
  const isAdmin = hasRole('admin');

  return (
    <div className="user-management-section">
      <div className="section-toolbar">
        <div>
          <h3>User & Staff Directory</h3>
          <span className="text-muted">Total accounts registered: {totalCount}</span>
        </div>

        {(isOwner || isAdmin) && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateOpen(true)}
          >
            + Add New User
          </button>
        )}
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`} role="alert">
          <span>{notification.type === 'danger' ? '⚠️' : '✓'} {notification.message}</span>
          <button
            type="button"
            className="btn-dismiss"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-bar-wrapper" style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            className="form-input search-input-field"
            placeholder="Search by name, email, or phone..."
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

        <select
          className="form-control filter-select"
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.display_name}
            </option>
          ))}
        </select>

        <select
          className="form-control filter-select"
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <table className="gym-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Assigned Roles</th>
              <th>Account Status</th>
              <th>Registered</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <span className="spinner"></span> Loading user accounts...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No users found matching current filters.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const userRoles = u.roles || [];
                const roleNames = userRoles.map((r) => r.name);
                const isTargetOwner = roleNames.includes('owner');

                return (
                  <tr key={u.id} className={u.id === currentUser?.id ? 'row-current-user' : ''}>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                          {u.id === currentUser?.id && (
                            <span className="badge badge-you">You</span>
                          )}
                          <div className="text-muted text-sm">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <div className="roles-pill-group">
                        {userRoles.map((r) => (
                          <span key={r.id} className={`role-pill role-pill-${r.name}`}>
                            {r.display_name}
                            {(isOwner || (isAdmin && !isTargetOwner)) && userRoles.length > 1 && (
                              <button
                                type="button"
                                className="btn-remove-role"
                                onClick={() => handleRemoveRole(u, r.name)}
                                title={`Revoke ${r.display_name}`}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                        {(isOwner || (isAdmin && !isTargetOwner)) && (
                          <button
                            type="button"
                            className="btn-add-role-tiny"
                            onClick={() => {
                              setRoleModalUser(u);
                              setRoleToAssign('');
                            }}
                            title="Assign additional role"
                          >
                            + Role
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-tag status-${u.status}`}>
                        {u.status}
                      </span>
                      {u.status === 'suspended' && u.suspension_reason && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: 11,
                            color: '#ef4444',
                            fontWeight: 600,
                            marginTop: 3,
                            maxWidth: 160,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={`Reason: ${u.suspension_reason}`}
                        >
                          ⚠️ {u.suspension_reason}
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-group">
                        {/* Status switcher */}
                        {(isOwner || (isAdmin && !isTargetOwner)) && u.id !== currentUser?.id && (
                          <select
                            className="status-dropdown-sm"
                            value={u.status}
                            onChange={(e) => handleStatusChange(u, e.target.value)}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        )}

                        {/* Delete button */}
                        {(isOwner || (isAdmin && !isTargetOwner)) && u.id !== currentUser?.id && (
                          <button
                            type="button"
                            className="btn-action-icon btn-danger-icon"
                            onClick={() => handleDeleteUser(u)}
                            title="Delete user"
                          >
                            🗑️
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

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create New User Account</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsCreateOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Enter staff full name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  className="form-control"
                  placeholder="Enter staff email address"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter phone number (optional)"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Temporary Password</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  className="form-control"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Assign Role</label>
                  <select
                    className="form-control"
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  >
                    {roles
                      .filter((r) => isOwner || r.name !== 'owner')
                      .map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.display_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {roleModalUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Assign Role to {roleModalUser.name}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setRoleModalUser(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAssignRole} className="modal-form">
              <p className="text-muted text-sm">
                Select an additional role to grant to this user. Each role unlocks specific system capabilities.
              </p>

              <div className="form-group">
                <label>Role</label>
                <select
                  required
                  className="form-control"
                  value={roleToAssign}
                  onChange={(e) => setRoleToAssign(e.target.value)}
                >
                  <option value="">-- Choose a Role --</option>
                  {roles
                    .filter((r) => isOwner || r.name !== 'owner')
                    .filter((r) => !(roleModalUser.roles || []).some((ur) => ur.name === r.name))
                    .map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.display_name} — {r.description}
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRoleModalUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!roleToAssign}
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspension Reason Definition Modal */}
      {suspendModalUser && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: 520, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>⛔</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#991b1b' }}>Suspend Account</h3>
                  <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 2 }}>{suspendModalUser.name} ({suspendModalUser.email})</div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSuspendModalUser(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 20, color: '#991b1b', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmSuspension} style={{ padding: 20 }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#9a3412', lineHeight: 1.4 }}>
                ℹ️ <strong>Receptionist Visibility:</strong> The reason specified below will immediately sync to the <strong>Reception Dashboard</strong> and <strong>Alerts</strong> feed so front-desk staff know why access is blocked.
              </div>

              {/* Quick Presets */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Quick Preset Reasons:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PRESET_SUSPENSION_REASONS.map((preset) => (
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
                  placeholder="Clearly explain the reason for suspension (e.g. Failure to comply with gym rules, payment dispute, misconduct)..."
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: 10, fontSize: 13, boxSizing: 'border-box', background: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSuspendModalUser(null)}
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
