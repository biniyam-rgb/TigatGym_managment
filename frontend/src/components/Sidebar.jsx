import { useAuth } from '../context/useAuth';
import BrandLogo from './BrandLogo';

// Crisp, luxury SVG icons for navigation items
function NavIcon({ id }) {
  switch (id) {
    case 'dashboard':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'members':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'memberships':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
          <path d="m14 15 2 2 4-4" />
        </svg>
      );
    case 'payments':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      );
    case 'attendance':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 15" />
        </svg>
      );
    case 'trainers':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v14" />
          <path d="M18 5v14" />
          <path d="M2 9v6" />
          <path d="M22 9v6" />
          <path d="M6 12h12" />
          <rect x="4" y="7" width="2" height="10" rx="1" />
          <rect x="18" y="7" width="2" height="10" rx="1" />
        </svg>
      );
    case 'workouts':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
          <path d="M9 8h2" />
        </svg>
      );
    case 'classes':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'equipment':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'expenses':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      );
    case 'users':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      );
    case 'audit':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function Sidebar({ activeView, onViewChange, onOpenPasswordModal }) {
  const { user, primaryRole, hasRole, logout } = useAuth();

  // Navigation items structured by permissions
  const navItems = [
    { id: 'dashboard', label: 'Overview', roles: ['owner', 'admin', 'receptionist', 'trainer', 'member'] },
    { id: 'members', label: 'Members', roles: ['owner', 'admin', 'receptionist', 'trainer'] },
    { id: 'memberships', label: 'Memberships', roles: ['owner', 'admin', 'receptionist', 'member'] },
    { id: 'payments', label: 'Payments', roles: ['owner', 'admin', 'receptionist', 'member'] },
    { id: 'attendance', label: 'Attendance', roles: ['owner', 'admin', 'receptionist', 'trainer', 'member'] },
    { id: 'trainers', label: 'Trainers', roles: ['owner', 'admin', 'receptionist', 'trainer'] },
    { id: 'workouts', label: 'Workouts', roles: ['owner', 'admin', 'trainer', 'member'] },
    { id: 'classes', label: 'Classes', roles: ['owner', 'admin', 'receptionist', 'trainer', 'member'] },
    { id: 'equipment', label: 'Equipment', roles: ['owner', 'admin'] },
    { id: 'expenses', label: 'Expenses', roles: ['owner', 'admin'] },
    { id: 'users', label: 'Staff Accounts', roles: ['owner', 'admin'] },
    { id: 'audit', label: 'Audit Logs', roles: ['owner'] },
  ];

  // Filter items based on active role
  const visibleNav = navItems.filter((item) =>
    item.roles.some((r) => hasRole(r))
  );

  return (
    <aside className="gymcore-sidebar">
      {/* Brand Header with Horizontal Lockup matching reference image */}
      <div className="sidebar-brand">
        <BrandLogo variant="sidebar" />
      </div>

      {/* Navigation Links with Crisp SVG Icons & Vibrant Orange Active Pill */}
      <nav className="sidebar-nav">
        {visibleNav.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
            >
              <span className="nav-icon">
                <NavIcon id={item.id} />
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer matching reference image: User Profile + Prominent Sign Out Button */}
      <div className="sidebar-footer">
        {/* User Profile Row */}
        <div className="sidebar-user-row">
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="sidebar-user-meta">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-email">
              {user?.email || `${primaryRole?.toUpperCase()} ACCOUNT`}
            </span>
          </div>
          <button
            type="button"
            className="sidebar-user-key-btn"
            onClick={onOpenPasswordModal}
            title="Change Password"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7.5" cy="15.5" r="4.5" />
              <path d="m21 3-9.5 9.5" />
              <path d="m15.5 7.5 3 3" />
            </svg>
          </button>
        </div>

        {/* Dedicated Sign Out Button matching reference */}
        <button
          type="button"
          className="sidebar-signout-btn"
          onClick={logout}
          title="Sign out of GymCore"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
}
