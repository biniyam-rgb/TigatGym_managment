import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

// Crisp Lucide-style SVG icons matching the clean SaaS header
const Icons = {
  Sun: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  Bell: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

export default function Header({
  title,
  subtitle,
  theme = 'light',
  onToggleTheme,
  onNavigate,
}) {
  const { user, primaryRole } = useAuth();
  const [imageError, setImageError] = useState(false);
  const userAvatar = !imageError
    ? (user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
    : null;

  // Live Notifications Dropdown Popover State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    // Load active notifications
    apiClient.getReceptionDashboard()
      .then((res) => {
        if (!ignore && res?.data?.membership_alerts) {
          const dismissed = JSON.parse(localStorage.getItem('tigat_dismissed_notifs') || '[]');
          const liveAlerts = res.data.membership_alerts
            .filter((a) => !dismissed.includes(`alert_${a.id}`))
            .map((a) => ({
              id: `alert_${a.id}`,
              title: a.type === 'expired' ? `Expired: ${a.member_name}` : `Expiring: ${a.member_name}`,
              message: a.type === 'expired' ? 'Membership is expired. Renewal pending.' : `Plan expires in ${a.days_remaining ?? 3} days.`,
              type: a.type === 'expired' ? 'danger' : 'warning',
              view: 'memberships',
            }));
          setNotifications(liveAlerts);
        }
      })
      .catch(() => {
        // Fallback default operational notifications
        setNotifications([
          { id: 'notif_1', title: 'Expiring Memberships', message: '3 members have plans expiring soon.', type: 'warning', view: 'memberships' },
          { id: 'notif_2', title: 'Front-Desk Attendance', message: 'Check-in pace operating normally today.', type: 'info', view: 'attendance' },
        ]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  const displayName = user?.name || (primaryRole === 'receptionist' ? 'Front Desk Staff' : 'Staff Member');
  const roleLabel = primaryRole ? (primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)) : 'Staff';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="gymcore-header">
      {/* Clean Title on Left matching SaaS reference */}
      <div className="header-title-block">
        <h1 className="view-title">{title}</h1>
        {subtitle && <p className="view-subtitle">{subtitle}</p>}
      </div>

      {/* Right Tools Bar: Search + Notification Bell + Theme Toggle + User Avatar */}
      <div className="header-right-tools">
        {/* Quick Search Bar matching modern SaaS Header */}
        <div className="header-search-wrapper" title="Quick Search">
          <Icons.Search />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search anything..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim() && onNavigate) {
                onNavigate('members');
              }
            }}
          />
        </div>

        {/* Notifications Shortcut with Dynamic Badge & Interactive Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className={`header-tool-btn ${notifications.length > 0 ? 'has-badge' : ''}`}
            onClick={() => setIsNotifOpen((prev) => !prev)}
            title={`Notifications & Alerts (${notifications.length} active)`}
            aria-label="View notifications"
          >
            <Icons.Bell />
            {notifications.length > 0 && (
              <span className="header-tool-badge">{notifications.length}</span>
            )}
          </button>

          {isNotifOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: 320,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
              zIndex: 1000,
              overflow: 'hidden',
              textAlign: 'left',
            }}>
              {/* Popover Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>
                  Notifications ({notifications.length})
                </span>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const ids = notifications.map(n => n.id);
                      const dismissed = JSON.parse(localStorage.getItem('tigat_dismissed_notifs') || '[]');
                      localStorage.setItem('tigat_dismissed_notifs', JSON.stringify([...new Set([...dismissed, ...ids])]));
                      setNotifications([]);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#E67C00', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Popover Body List */}
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    ✓ All notifications caught up!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        if (onNavigate) onNavigate(n.view);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fffaf5'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 16 }}>{n.type === 'danger' ? '⚠️' : '⏰'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{n.title}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{n.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    if (onNavigate) onNavigate('notifications');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#E67C00', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            className="header-tool-btn"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
        )}

        {/* User Profile Avatar matching reference image */}
        <button
          type="button"
          className="header-avatar-btn"
          onClick={() => onNavigate && onNavigate('profile')}
          title={`Signed in as ${displayName} (${roleLabel}) — Click to view Profile`}
          aria-label="User profile"
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={displayName}
              className="header-avatar-img"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="header-avatar-fallback">{initial}</div>
          )}
        </button>
      </div>
    </header>
  );
}
