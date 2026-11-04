import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

// Clean Lucide-style SVG icons
const Icons = {
  Refresh: ({ isSpinning }) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={isSpinning ? 'header-svg-spin' : ''}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Calendar: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

export default function Header({
  title,
  subtitle,
  onRefresh,
  theme = 'light',
  onToggleTheme,
  onNavigate,
}) {
  const { user, primaryRole } = useAuth();
  const [apiStatus, setApiStatus] = useState({ state: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Notifications Dropdown Popover State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const checkConnection = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await apiClient.checkStatus();
      setApiStatus({ state: 'online', data });
    } catch {
      setApiStatus({ state: 'offline', data: null });
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient.checkStatus()
      .then((data) => {
        if (!ignore) setApiStatus({ state: 'online', data });
      })
      .catch(() => {
        if (!ignore) setApiStatus({ state: 'offline', data: null });
      });

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

  const handleManualRefresh = () => {
    checkConnection();
    if (onRefresh) onRefresh();
  };

  const displayName = user?.name || (primaryRole === 'receptionist' ? 'Front Desk Staff' : 'Staff Member');
  const roleLabel = primaryRole ? (primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)) : 'Staff';
  const initial = displayName.charAt(0).toUpperCase();

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="gymcore-header">
      {/* Title & View Context on Left */}
      <div className="header-title-block">
        <h1 className="view-title">{title}</h1>
        {subtitle && <p className="view-subtitle">{subtitle}</p>}
      </div>

      {/* Right Tools Bar */}
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

        {/* Date Capsule Badge */}
        <div className="header-date-badge" title="Current gym date">
          <Icons.Calendar />
          <span>{formattedDate}</span>
        </div>

        {/* Live System Indicator */}
        <div
          className={`header-status-pill ${apiStatus.state}`}
          title={`System status: ${apiStatus.state === 'online' ? 'Live & Connected' : 'Offline'}`}
        >
          <span className="header-status-dot"></span>
          <span className="header-status-text">
            {apiStatus.state === 'loading' ? 'Syncing' : apiStatus.state === 'online' ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Notifications Shortcut with Real Dynamic Badge & Interactive Popover */}
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

        {/* Refresh Shortcut */}
        <button
          type="button"
          className="header-tool-btn"
          onClick={handleManualRefresh}
          title="Refresh data & ping server"
          aria-label="Refresh data"
        >
          <Icons.Refresh isSpinning={isRefreshing || apiStatus.state === 'loading'} />
        </button>

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

        {/* Executive Staff Profile Capsule */}
        <div
          className="header-staff-chip"
          onClick={() => onNavigate && onNavigate('profile')}
          title={`Signed in as ${displayName} (${roleLabel}) — Click to view Profile`}
          style={{ cursor: 'pointer' }}
        >
          <div className="header-staff-avatar">{initial}</div>
          <div className="header-staff-meta">
            <span className="header-staff-name">{displayName}</span>
            <span className="header-staff-role-badge">
              <span className="role-green-dot" />
              <span>{roleLabel}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
