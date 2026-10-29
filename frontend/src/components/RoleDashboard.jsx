import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import UserManagement from './UserManagement';
import AuditLogViewer from './AuditLogViewer';

export default function RoleDashboard() {
  const { user, primaryRole, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const isOwner = hasRole('owner');
  const isAdmin = hasRole('admin');
  const isReceptionist = hasRole('receptionist');

  // Permission summaries based on system role matrix
  const permissionsByRole = {
    owner: [
      'Full administrative access to gym operations & financial records',
      'Manage users, assign/revoke all system roles (including owner)',
      'Access sensitive security audit logs and system configuration',
      'Protected against self-lockout and last-owner deletion',
    ],
    admin: [
      'Manage gym members, trainers, membership plans, and subscriptions',
      'Schedule classes, assign trainers, inspect equipment & attendance',
      'Create and update staff accounts (except Owner accounts)',
      'Cannot perform owner-exclusive operations or promote to Owner',
    ],
    receptionist: [
      'Register new gym members and update permitted contact details',
      'Record subscription renewals, day-passes, and payments in ETB',
      'Check-in members and verify attendance records',
      'Restricted from system settings, roles, and owner audit logs',
    ],
    trainer: [
      'View athletes assigned specifically to your coaching roster',
      'Create and update workout routines, plans, and exercise sets',
      'Log 1-on-1 personal training sessions and track client progress',
      'Restricted from financial ledgers and unrelated members’ data',
    ],
    member: [
      'View personal subscription status, renewal date, and invoices',
      'Check workout assignments, personal logs, and training goals',
      'View personal attendance records and class reservations',
      'Restricted from modifying account status, roles, or other members’ data',
    ],
  };

  return (
    <div className="role-dashboard-container">
      {/* User Identity Welcome Header */}
      <div className="user-welcome-card">
        <div className="user-welcome-left">
          <div className="user-avatar-large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>Welcome back, {user?.name}</h2>
            <div className="user-meta-badges">
              <span className={`role-badge role-badge-${primaryRole}`}>
                {primaryRole.toUpperCase()}
              </span>
              <span className={`status-pill status-${user?.status}`}>
                {user?.status}
              </span>
              <span className="user-email-text">{user?.email}</span>
              {user?.phone && <span className="user-phone-text">📞 {user?.phone}</span>}
            </div>
          </div>
        </div>

        {/* Member or Trainer Quick Code Badge */}
        {user?.member_profile && (
          <div className="profile-code-card">
            <span className="code-label">Member ID Code:</span>
            <span className="code-value">{user.member_profile.member_code}</span>
          </div>
        )}
        {user?.trainer_profile && (
          <div className="profile-code-card">
            <span className="code-label">Trainer Coach Code:</span>
            <span className="code-value">{user.trainer_profile.trainer_code}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs based on Role */}
      <div className="dashboard-tabs-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Role Overview & Permissions
        </button>

        {(isOwner || isAdmin || isReceptionist) && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User & Staff Management
          </button>
        )}

        {isOwner && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            🛡️ Security Audit Logs
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="tab-pane">
          <div className="role-permissions-grid">
            {/* Active Role Card */}
            <div className="dashboard-card active-role-card">
              <div className="card-header">
                <h3>System Authorization Profile: {primaryRole.toUpperCase()}</h3>
                <span className="badge">RBAC Active</span>
              </div>
              <p className="role-desc">
                Your authenticated session has been granted the permissions below by the Laravel Sanctum authorization engine:
              </p>
              <ul className="permission-list">
                {(permissionsByRole[primaryRole] || []).map((perm, idx) => (
                  <li key={idx} className="permission-item">
                    <span className="check-icon">✓</span>
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Stats / Action Highlights */}
            <div className="dashboard-card stats-highlight-card">
              <div className="card-header">
                <h3>GymCore Access Scope</h3>
                <span className="badge">Single-Gym Architecture</span>
              </div>
              <div className="scope-highlights">
                <div className="scope-row">
                  <span className="scope-title">Assigned Roles:</span>
                  <div className="roles-list-tags">
                    {(user?.role_names || []).map((rn) => (
                      <span key={rn} className={`role-pill role-pill-${rn}`}>
                        {rn}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="scope-row">
                  <span className="scope-title">Authentication Type:</span>
                  <span className="scope-val highlight">Sanctum Bearer Token</span>
                </div>
                <div className="scope-row">
                  <span className="scope-title">Access Policy:</span>
                  <span className="scope-val">Least-Privilege Role Matrix</span>
                </div>
                <div className="scope-row">
                  <span className="scope-title">Account State:</span>
                  <span className="scope-val text-success">Verified & Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (isOwner || isAdmin || isReceptionist) && (
        <div className="tab-pane">
          <UserManagement />
        </div>
      )}

      {activeTab === 'audit' && isOwner && (
        <div className="tab-pane">
          <AuditLogViewer />
        </div>
      )}
    </div>
  );
}
