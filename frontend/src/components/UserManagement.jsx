import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';

export default function UserManagement() {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const fetchUsers = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient.getUsers({
        search,
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
  }, [search, selectedRole, selectedStatus, page]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const rolesRes = await apiClient.getRoles();
        if (!ignore && rolesRes?.roles) {
          setRoles(rolesRes.roles);
        }
      } catch (err) {
        console.warn('Could not fetch roles list:', err.message);
      }

      try {
        const usersRes = await apiClient.getUsers({
          search,
          role: selectedRole,
          status: selectedStatus,
          page,
          per_page: 10,
        });

        if (!ignore && usersRes?.data) {
          setUsers(usersRes.data);
          setTotalPages(usersRes.last_page || 1);
          setTotalCount(usersRes.total || 0);
        }
      } catch (err) {
        if (!ignore) {
          setNotification({ type: 'danger', message: err.message || 'Failed to load users' });
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [search, selectedRole, selectedStatus, page]);

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
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to create user.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (targetUser, newStatus) => {
    try {
      await apiClient.updateUser(targetUser.id, { status: newStatus });
      setNotification({
        type: 'success',
        message: `Account status for "${targetUser.name}" changed to ${newStatus}.`,
      });
      fetchUsers();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Status change rejected.' });
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
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

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
                  placeholder="e.g. Almaz Bekele"
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
                  placeholder="e.g. almaz@tigatgym.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+2519..."
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
    </div>
  );
}
