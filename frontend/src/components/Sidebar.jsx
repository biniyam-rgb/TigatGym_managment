import { useAuth } from '../context/useAuth';
import BrandLogo from './BrandLogo';

export default function Sidebar({ activeView, onViewChange, onOpenPasswordModal }) {
  const { user, primaryRole, hasRole, logout } = useAuth();

  // Navigation items structured by permissions
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: '📊', roles: ['owner', 'admin', 'receptionist', 'trainer', 'member'] },
    { id: 'members', label: 'Members', icon: '👥', roles: ['owner', 'admin', 'receptionist', 'trainer'] },
    { id: 'memberships', label: 'Memberships', icon: '💳', roles: ['owner', 'admin', 'receptionist', 'member'] },
    { id: 'payments', label: 'Payments', icon: '💰', roles: ['owner', 'admin', 'receptionist', 'member'] },
    { id: 'attendance', label: 'Attendance', icon: '⏱️', roles: ['owner', 'admin', 'receptionist', 'trainer', 'member'] },
    { id: 'trainers', label: 'Trainers', icon: '🏋️', roles: ['owner', 'admin', 'receptionist', 'trainer'] },
    { id: 'workouts', label: 'Workouts', icon: '📋', roles: ['owner', 'admin', 'trainer', 'member'] },
    { id: 'classes', label: 'Classes', icon: '📅', roles: ['owner', 'admin', 'receptionist', 'trainer', 'member'] },
    { id: 'equipment', label: 'Equipment', icon: '⚙️', roles: ['owner', 'admin'] },
    { id: 'expenses', label: 'Expenses', icon: '📉', roles: ['owner', 'admin'] },
    { id: 'users', label: 'Staff Accounts', icon: '🔑', roles: ['owner', 'admin'] },
    { id: 'audit', label: 'Audit Logs', icon: '🛡️', roles: ['owner'] },
  ];

  // Filter items based on active role
  const visibleNav = navItems.filter((item) =>
    item.roles.some((r) => hasRole(r))
  );

  return (
    <aside className="gymcore-sidebar">
      {/* Brand Header with Luxury TIGAT GYM Emblem */}
      <div className="sidebar-brand">
        <BrandLogo variant="sidebar" />
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">MAIN NAVIGATION</div>
        {visibleNav.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {isActive && <span className="active-glow-pill"></span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: System Status & User Card */}
      <div className="sidebar-footer">
        {/* Live sync indicator matching reference screenshot */}
        <div className="live-status-card">
          <div className="status-indicator-group">
            <span className="status-pulse-dot"></span>
            <span className="status-live-text">Data updated • just now</span>
          </div>
        </div>

        {/* User profile pill matching reference screenshot */}
        <div className="sidebar-user-card">
          <div className="user-avatar-circle">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details-text">
            <span className="user-display-name">{user?.name}</span>
            <span className={`user-role-tag role-badge-${primaryRole}`}>
              {primaryRole}
            </span>
          </div>
          <div className="user-actions-quick">
            <button
              type="button"
              className="btn-user-action"
              onClick={onOpenPasswordModal}
              title="Change Password"
            >
              🔑
            </button>
            <button
              type="button"
              className="btn-user-action"
              onClick={logout}
              title="Sign Out"
            >
              🚪
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
