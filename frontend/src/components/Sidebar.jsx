import { useAuth } from '../context/useAuth';
import BrandLogo from './BrandLogo';

// Crisp, consistent Lucide-style SVG icons for navigation items
function NavIcon({ id }) {
  switch (id) {
    case 'dashboard':
      // Lucide LayoutDashboard
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case 'attendance':
      // Lucide CalendarCheck
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      );
    case 'members':
      // Lucide Users
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'memberships':
      // Lucide Crown
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
      );
    case 'payments':
      // Lucide CreditCard
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      );
    case 'classes':
      // Lucide CalendarDays
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
          <path d="M16 18h.01" />
        </svg>
      );
    case 'notifications':
      // Lucide Bell
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case 'profile':
      // Lucide User
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'logout':
      // Lucide LogOut
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" x2="9" y1="12" y2="12" />
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

export default function Sidebar({
  activeView,
  onViewChange,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const { primaryRole, hasRole, logout } = useAuth();

  // Navigation items structured by permissions
  const defaultNavItems = [
    { id: 'dashboard', label: 'Overview', roles: ['owner', 'admin', 'trainer', 'member'] },
    { id: 'members', label: 'Members', roles: ['owner', 'admin', 'trainer'] },
    { id: 'memberships', label: 'Memberships', roles: ['owner', 'admin', 'member'] },
    { id: 'payments', label: 'Payments', roles: ['owner', 'admin', 'member'] },
    { id: 'trainers', label: 'Trainers', roles: ['owner', 'admin', 'trainer'] },
    { id: 'workouts', label: 'Workouts', roles: ['owner', 'admin', 'trainer', 'member'] },
    { id: 'classes', label: 'Classes', roles: ['owner', 'admin', 'trainer', 'member'] },
    { id: 'equipment', label: 'Equipment', roles: ['owner', 'admin'] },
    { id: 'expenses', label: 'Expenses', roles: ['owner'] },
    { id: 'users', label: 'Staff Accounts', roles: ['owner', 'admin'] },
    { id: 'audit', label: 'Audit Logs', roles: ['owner'] },
    { id: 'notifications', label: 'Notifications', roles: ['owner', 'admin', 'trainer', 'member'] },
    { id: 'profile', label: 'My Profile', roles: ['owner', 'admin', 'trainer', 'member'] },
  ];

  // Specific Receptionist navigation with the 8 requested menu items:
  // 1. Dashboard, 2. Attendance, 3. Members, 4. Memberships, 5. Payments, 6. Classes, 7. Notifications, 8. My Profile
  const receptionNavItems = [
    { id: 'dashboard', label: 'overview' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'members', label: 'Members' },
    { id: 'memberships', label: 'Memberships' },
    { id: 'payments', label: 'Payments' },
    { id: 'classes', label: 'Classes' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'profile', label: 'My Profile' },
  ];

  // Filter items based on active role
  const visibleNav = primaryRole === 'receptionist'
    ? receptionNavItems
    : defaultNavItems.filter((item) => item.roles.some((r) => hasRole(r)));

  return (
    <aside className={`gymcore-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header with Directional Collapse/Expand Arrow */}
      <div className="sidebar-brand">
        {isCollapsed ? (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand sidebar"
            style={{
              width: 38,
              height: 38,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: 'rgba(255, 122, 0, 0.15)',
              border: '1px solid rgba(255, 122, 0, 0.35)',
              color: '#ff7a00',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Right-pointing arrow (→) to indicate expand */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <BrandLogo variant="sidebar" />
            {/* Left-pointing arrow (←) to indicate collapse */}
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links with Consistent Lucide SVG Icons & Tooltips */}
      <nav className="sidebar-nav">
        {visibleNav.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">
                <NavIcon id={item.id} />
              </span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Logout */}
      <div className="sidebar-footer">
        {/* Dedicated Separate Logout Button */}
        <button
          type="button"
          className="sidebar-signout-btn"
          onClick={logout}
          title={isCollapsed ? 'Sign out of GymCore' : undefined}
        >
          <span className="nav-icon">
            <NavIcon id="logout" />
          </span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
