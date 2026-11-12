import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import useDebounce from '../hooks/useDebounce';

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
                  title: a.type === 'suspended' ? `⛔ Suspended: ${a.member_name}` : a.type === 'expired' ? `Expired: ${a.member_name}` : `Expiring: ${a.member_name}`,
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
                <span className="header-notif-title">
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
                    style={{ background: 'transparent', border: 'none', color: '#ff8a00', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
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
                      className="header-notif-row"
                      onClick={() => {
                        setIsNotifOpen(false);
                        if (onNavigate) onNavigate(n.view);
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{n.type === 'danger' ? '⚠️' : '⏰'}</span>
                      <div style={{ flex: 1 }}>
                        <div className="header-notif-item-title">{n.title}</div>
                        <div className="header-notif-item-desc">{n.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div className="header-notif-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    if (onNavigate) onNavigate('notifications');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#ff8a00', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
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
