import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import useDebounce from '../hooks/useDebounce';
import './Header.css';

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
  Search: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Calendar: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Refresh: ({ size = 15, isSpinning = false }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        animation: isSpinning ? 'spin 0.7s linear infinite' : 'none',
        display: 'inline-block',
      }}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  ),
  AlertTriangle: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  CheckCircle: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Shield: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  ArrowRight: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

// Defensive conversion ensuring any non-array or object structure safely resolves to an Array
function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

export default function Header({
  title,
  subtitle,
  theme = 'light',
  onToggleTheme,
  onNavigate,
  onRefresh,
}) {
  const { user, primaryRole } = useAuth();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setImageError(false);
    }, 0);
  }, [user?.avatar]);
  const userAvatar = !imageError
    ? (user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
    : null;

  // Refresh System Data State
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
      window.dispatchEvent(new CustomEvent('gymcore:refresh'));
    } catch (err) {
      console.error('Refresh system data failed:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 650);
    }
  };

  // Live Notifications Dropdown Popover State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Quick Header Search State & Live Popover
  const [headerSearch, setHeaderSearch] = useState('');
  const debouncedHeaderSearch = useDebounce(headerSearch, 200);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    const q = debouncedHeaderSearch?.trim();
    if (!q || q.length < 2) {
      setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return;
    }

    let ignore = false;
    setTimeout(() => {
      if (!ignore) setIsSearching(true);
    }, 0);
    apiClient.getMembers({ search: q, per_page: 5 })
      .then((res) => {
        if (!ignore) {
          setSearchResults(res?.data || []);
          setSearchDropdownOpen(true);
          setIsSearching(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Quick header search error:', err);
          setIsSearching(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [debouncedHeaderSearch]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    };
    if (searchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchDropdownOpen]);

  useEffect(() => {
    let ignore = false;

    const loadAlerts = () => {
      // Only call getReceptionDashboard for staff who have permission (owner, admin, receptionist)
      if (primaryRole !== 'owner' && primaryRole !== 'admin' && primaryRole !== 'receptionist') {
        return;
      }

      // Load active notifications
      apiClient.getReceptionDashboard({ refresh: 1 })
        .then((res) => {
          if (!ignore && res?.data) {
            const dismissed = JSON.parse(localStorage.getItem('tigat_dismissed_notifs') || '[]');
            const items = [];

            // 1. Role-specific Activity Notifications (Receptionist activities for Admin, Admin activities for Owner)
            safeArray(res.data.activity_notifications).forEach((act) => {
              if (act && !dismissed.includes(act.id)) {
                items.push({
                  id: act.id,
                  title: act.title,
                  message: act.message,
                  time: act.time || 'Recent',
                  type: act.type === 'admin_activity' ? 'primary' : 'info',
                  view: act.view || 'notifications',
                });
              }
            });

            // 2. Membership Alerts (Suspended, Expiring, Expired)
            safeArray(res.data.membership_alerts).forEach((a) => {
              if (a && !dismissed.includes(`alert_${a.id}`)) {
                items.push({
                  id: `alert_${a.id}`,
                  title: a.type === 'suspended' ? `Suspended: ${a.member_name}` : a.type === 'expired' ? `Expired: ${a.member_name}` : `Expiring: ${a.member_name}`,
                  message: a.type === 'suspended' ? `Reason: ${a.reason || 'Administrative hold'}` : a.type === 'expired' ? 'Membership is expired. Renewal pending.' : `Plan expires in ${a.days_remaining ?? 3} days.`,
                  time: a.suspended_at || 'Urgent',
                  type: a.type === 'suspended' || a.type === 'expired' ? 'danger' : 'warning',
                  view: a.type === 'suspended' ? 'notifications' : 'memberships',
                });
              }
            });

            setNotifications(items);
          }
        })
        .catch(() => {
          // Fallback default operational notifications
          setNotifications([
            { id: 'notif_1', title: 'Expiring Memberships', message: '3 members have plans expiring soon.', type: 'warning', view: 'memberships' },
            { id: 'notif_2', title: 'Front-Desk Attendance', message: 'Check-in pace operating normally today.', type: 'info', view: 'attendance' },
          ]);
        });
    };

    loadAlerts();
    window.addEventListener('gymcore:refresh', loadAlerts);

    return () => {
      ignore = true;
      window.removeEventListener('gymcore:refresh', loadAlerts);
    };
  }, [primaryRole]);

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

  // Live date & time ticking clock across all roles and all dashboards
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const weekdayShort = currentDateTime.toLocaleDateString('en-US', { weekday: 'short' });
  const dateFormatted = currentDateTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = currentDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

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

      {/* Right Tools Bar: Date & Time + Search + Notification Bell + Theme Toggle + User Avatar */}
      <div className="header-right-tools">
        {/* Live Executive Date & Time Pill (Visible in all roles & all dashboards) */}
        <div className="header-datetime-pill" title="TigatGym System Clock (Live)">
          <div className="header-datetime-date-chip">
            <span className="header-datetime-icon-circle">
              <Icons.Calendar size={12} />
            </span>
            <span className="header-datetime-weekday">{weekdayShort}</span>
            <span className="header-datetime-date">{dateFormatted}</span>
          </div>
          <span className="header-datetime-separator" />
          <div className="header-datetime-time-chip">
            <span className="header-datetime-live-dot" title="Live Synced" />
            <span className="header-datetime-icon-circle clock-circle">
              <Icons.Clock size={12} />
            </span>
            <span className="header-datetime-time">{timeFormatted}</span>
          </div>
        </div>

        {/* Quick Search Bar matching modern SaaS Header */}
        <div
          ref={searchWrapperRef}
          className="header-search-wrapper search-bar-wrapper"
          title="Quick Search"
          style={{ position: 'relative' }}
        >
          <Icons.Search className="search-bar-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search anything..."
            value={headerSearch}
            onChange={(e) => {
              setHeaderSearch(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setSearchDropdownOpen(true);
              }
            }}
            onFocus={() => {
              if (searchResults.length > 0 || headerSearch.trim().length >= 2) {
                setSearchDropdownOpen(true);
              }
            }}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              padding: '0 24px 0 0',
              margin: 0,
              width: '100%',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && headerSearch.trim() && onNavigate) {
                setSearchDropdownOpen(false);
                onNavigate('members', { search: headerSearch.trim() });
              }
            }}
          />

          {headerSearch && (
            <button
              type="button"
              onClick={() => {
                setHeaderSearch('');
                setSearchResults([]);
                setSearchDropdownOpen(false);
              }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gym-text-muted, #94a3b8)',
                fontSize: 14,
                padding: '2px 4px',
                borderRadius: 4,
                lineHeight: 1,
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}

          {/* Quick Search Floating Results Popover */}
          {searchDropdownOpen && headerSearch.trim().length >= 2 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                minWidth: 320,
                background: 'var(--gym-card-bg, #ffffff)',
                border: '1px solid var(--gym-border, #e2e8f0)',
                borderRadius: 10,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                zIndex: 1050,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--gym-bg-subtle, #f8fafc)',
                  borderBottom: '1px solid var(--gym-border, #e2e8f0)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--gym-text-muted, #64748b)',
                  letterSpacing: '0.05em',
                }}
              >
                <span>Matching Members</span>
                {isSearching && <span style={{ fontSize: 10, color: '#3b82f6' }}>Searching...</span>}
              </div>

              {isSearching && searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                  Searching Tigat Gym database...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                  No members found matching &quot;<strong>{headerSearch}</strong>&quot;
                </div>
              ) : (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {searchResults.map((m) => {
                    const statusColor = m.status === 'active' ? '#22c55e' : m.status === 'suspended' ? '#ef4444' : '#f59e0b';
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSearchDropdownOpen(false);
                          if (onNavigate) {
                            onNavigate('members', { search: m.name });
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 12px',
                          borderBottom: '1px solid var(--gym-border, #f1f5f9)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gym-bg-subtle, #f8fafc)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--gym-primary-light, #e0e7ff)',
                            color: 'var(--gym-primary, #4338ca)',
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {(m.name || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--gym-text-primary, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.name}
                            </span>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--gym-text-muted, #64748b)' }}>
                              ({m.member_code})
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #64748b)', marginTop: 2 }}>
                            {m.phone || 'No phone'} • {m.current_plan || 'No Active Plan'}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: `${statusColor}18`,
                            color: statusColor,
                            flexShrink: 0,
                          }}
                        >
                          {m.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                onClick={() => {
                  setSearchDropdownOpen(false);
                  if (onNavigate) {
                    onNavigate('members', { search: headerSearch.trim() });
                  }
                }}
                style={{
                  padding: '9px 12px',
                  background: 'var(--gym-bg-subtle, #f8fafc)',
                  borderTop: '1px solid var(--gym-border, #e2e8f0)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--gym-primary, #3b82f6)',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
              >
                Press Enter or click here to view in Member Directory →
              </div>
            </div>
          )}
        </div>

        {/* Refresh System Data Button (Beside Notifications) */}
        <button
          type="button"
          className="header-tool-btn"
          onClick={handleRefreshClick}
          title={isRefreshing ? 'Refreshing system data...' : 'Refresh system data'}
          aria-label="Refresh system data"
          disabled={isRefreshing}
          style={{ cursor: isRefreshing ? 'wait' : 'pointer' }}
        >
          <Icons.Refresh size={15} isSpinning={isRefreshing} />
        </button>

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
            <div className="header-notif-dropdown">
              {/* Popover Header */}
              <div className="header-notif-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="header-notif-title">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="header-notif-count-pill">{notifications.length} active</span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    className="header-notif-markread-btn"
                    onClick={() => {
                      const ids = notifications.map(n => n.id);
                      const dismissed = JSON.parse(localStorage.getItem('tigat_dismissed_notifs') || '[]');
                      localStorage.setItem('tigat_dismissed_notifs', JSON.stringify([...new Set([...dismissed, ...ids])]));
                      setNotifications([]);
                    }}
                  >
                    <Icons.CheckCircle size={12} color="#10b981" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Popover Body List */}
              <div className="header-notif-body-list">
                {notifications.length === 0 ? (
                  <div className="header-notif-empty-state">
                    <div className="header-notif-empty-icon">
                      <Icons.CheckCircle size={22} color="#10b981" />
                    </div>
                    <strong style={{ fontSize: 13, color: 'var(--gym-text-main, #0f172a)' }}>All Caught Up!</strong>
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>No pending alerts or notifications.</span>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isDanger = n.type === 'danger';
                    const isWarning = n.type === 'warning';
                    const isPrimary = n.type === 'primary';

                    return (
                      <div
                        key={n.id}
                        className={`header-notif-row ${n.type || 'info'}`}
                        onClick={() => {
                          setIsNotifOpen(false);
                          if (onNavigate) onNavigate(n.view);
                        }}
                      >
                        <div className={`header-notif-icon-col ${n.type || 'info'}`}>
                          {isDanger ? (
                            <Icons.AlertTriangle size={14} color="#ef4444" />
                          ) : isWarning ? (
                            <Icons.Clock size={14} color="#f59e0b" />
                          ) : isPrimary ? (
                            <Icons.Shield size={14} color="#ff8a00" />
                          ) : (
                            <Icons.Bell />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <div className="header-notif-item-title">{n.title}</div>
                            {n.time && <span className="header-notif-time-tag">{n.time}</span>}
                          </div>
                          <div className="header-notif-item-desc">{n.message}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Popover Footer */}
              <div className="header-notif-footer">
                <button
                  type="button"
                  className="header-notif-footer-link"
                  onClick={() => {
                    setIsNotifOpen(false);
                    if (onNavigate) onNavigate('notifications');
                  }}
                >
                  <span>Open Notification Center</span>
                  <Icons.ArrowRight size={13} />
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
