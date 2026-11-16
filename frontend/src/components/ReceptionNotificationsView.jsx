import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import './ReceptionNotificationsView.css';

// Crisp Modern SVG Icons (100% Zero-Emoji Compliant)
const Icons = {
  AlertTriangle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Clock: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Info: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  CheckCircle: ({ size = 28, color = '#10b981' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  X: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Search: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Bell: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Shield: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  ArrowRight: ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Check: ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  RotateCcw: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
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

export default function ReceptionNotificationsView({ onNavigate }) {
  const { primaryRole, hasRole } = useAuth();
  const isTrainer = primaryRole === 'trainer' || hasRole('trainer');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'expiring' | 'expired' | 'suspended' | 'reception_activity' | 'admin_activity'
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('tigat_dismissed_notifs') || '[]'));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    let ignore = false;

    if (isTrainer) {
      setTimeout(() => {
        if (!ignore) {
          setData({
            activity_notifications: [
              {
                id: 'tr_notif_1',
                title: 'Coach Duty Schedule',
                message: 'Your personal training schedule and athlete mentorship sessions are active.',
                time: 'Today',
                type: 'primary',
              },
              {
                id: 'tr_notif_2',
                title: 'Turnstile Check-In Sync',
                message: 'Assigned athletes checking in at the front desk will sync directly with your roster.',
                time: 'Today',
                type: 'info',
              },
            ],
            membership_alerts: [],
          });
          setIsLoading(false);
        }
      }, 0);
      return;
    }

    apiClient.getReceptionDashboard()
      .then((res) => {
        if (!ignore && res?.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load notifications data:', err);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isTrainer]);

  const defaultNotifications = useMemo(() => [
    {
      id: 'notif_1',
      title: 'Membership Approaching Expiration',
      message: '3 members have subscriptions expiring in the next 7 days.',
      type: 'expiring',
      date: 'Today',
      badge: 'Expiring Pass',
      actionText: 'Review Memberships',
      actionView: 'memberships',
    },
    {
      id: 'notif_2',
      title: 'Expired Subscription Alert',
      message: 'Hana Tadesse membership expired 2 days ago. Renewal pending.',
      type: 'expired',
      date: 'Yesterday',
      badge: 'Expired Plan',
      actionText: 'Renew Now',
      actionView: 'memberships',
    },
    {
      id: 'notif_3',
      title: 'Class Capacity Milestone',
      message: 'Strength Training class has reached 22/30 capacity for today.',
      type: 'general',
      date: 'Today',
      badge: 'Capacity Alert',
      actionText: 'View Schedule',
      actionView: 'classes',
    },
    {
      id: 'notif_4',
      title: 'Front-Desk Attendance Check',
      message: '48 total check-ins recorded so far today. Attendance pace is normal.',
      type: 'general',
      date: 'Today',
      badge: 'Turnstile Notice',
      actionText: 'Open Attendance',
      actionView: 'attendance',
    },
  ], []);

  // Role-Based Activity Notifications
  const apiActivities = useMemo(() => {
    return safeArray(data?.activity_notifications).map((act) => ({
      id: act.id,
      title: act.title,
      message: act.message,
      type: act.type || 'reception_activity',
      badge: act.badge || (act.type === 'admin_activity' ? 'Admin Action' : 'Front Desk'),
      actor_name: act.actor_name,
      actor_role: act.actor_role,
      date: act.time || 'Recent',
      actionText: act.view ? `Open ${act.view.charAt(0).toUpperCase() + act.view.slice(1)}` : 'View Details',
      actionView: act.view || 'notifications',
    }));
  }, [data]);

  // Combine live membership alerts from API
  const apiAlerts = useMemo(() => {
    return safeArray(data?.membership_alerts).map((alert) => ({
      id: `alert_${alert.id}`,
      title: alert.type === 'suspended'
        ? `Suspended: ${alert.member_name} (${alert.member_code})`
        : alert.type === 'expired'
          ? `Expired: ${alert.member_name}`
          : `Expiring Soon: ${alert.member_name}`,
      message: alert.type === 'suspended'
        ? `Reason: "${alert.reason || 'Administrative hold'}" — Suspended by ${alert.suspended_by || 'Management'}`
        : alert.type === 'expired'
          ? 'Membership is inactive. Please record renewal payment.'
          : `Plan expires in ${alert.days_remaining ?? 3} days.`,
      type: alert.type === 'suspended' ? 'suspended' : alert.type === 'expired' ? 'expired' : 'expiring',
      badge: alert.type === 'suspended' ? 'Account Hold' : alert.type === 'expired' ? 'Expired Plan' : 'Renewal Due',
      date: alert.suspended_at || 'Recent',
      actionText: alert.type === 'suspended' ? 'Review Member' : 'Renew Subscription',
      actionView: alert.type === 'suspended' ? 'members' : 'memberships',
    }));
  }, [data]);

  // System notifications
  const apiSystemNotifs = useMemo(() => {
    return safeArray(data?.notifications).map((notif) => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type === 'error' ? 'suspended' : 'general',
      badge: notif.type === 'error' ? 'Security Alert' : 'System Notice',
      date: 'Today',
      actionText: notif.action_label || 'View Details',
      actionView: notif.action_target || 'notifications',
    }));
  }, [data]);

  const allList = useMemo(() => {
    return apiActivities.length > 0 || apiAlerts.length > 0 || apiSystemNotifs.length > 0
      ? [...apiActivities, ...apiAlerts, ...apiSystemNotifs]
      : defaultNotifications;
  }, [apiActivities, apiAlerts, apiSystemNotifs, defaultNotifications]);

  const unreadList = useMemo(() => {
    return allList.filter((item) => !dismissedIds.has(item.id));
  }, [allList, dismissedIds]);

  // Category counts
  const counts = useMemo(() => {
    return {
      all: unreadList.length,
      expiring: unreadList.filter((i) => i.type === 'expiring').length,
      expired: unreadList.filter((i) => i.type === 'expired').length,
      suspended: unreadList.filter((i) => i.type === 'suspended').length,
      reception_activity: unreadList.filter((i) => i.type === 'reception_activity').length,
      admin_activity: unreadList.filter((i) => i.type === 'admin_activity').length,
    };
  }, [unreadList]);

  // Filtered and searched list
  const filteredList = useMemo(() => {
    return unreadList.filter((item) => {
      const matchType = filter === 'all' || item.type === filter;
      if (!matchType) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchMsg = item.message?.toLowerCase().includes(q);
      const matchBadge = item.badge?.toLowerCase().includes(q);
      return matchTitle || matchMsg || matchBadge;
    });
  }, [unreadList, filter, searchQuery]);

  const handleDismiss = (id) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(id);
      localStorage.setItem('tigat_dismissed_notifs', JSON.stringify([...next]));
      return next;
    });
  };

  const handleDismissAll = () => {
    const next = new Set([...dismissedIds, ...allList.map((i) => i.id)]);
    localStorage.setItem('tigat_dismissed_notifs', JSON.stringify([...next]));
    setDismissedIds(next);
  };

  return (
    <div className="notif-center-wrapper">
      {/* ── Page Header Banner ── */}
      <div className="notif-header-banner">
        <div className="notif-header-title-box">
          <h2 className="notif-page-title">Notification & Activity Center</h2>
          <p className="notif-page-desc">
            Real-time front-desk notices, membership expirations, and administrative alerts.
          </p>
        </div>

        {unreadList.length > 0 && (
          <button
            type="button"
            className="btn-clean-schedule"
            onClick={handleDismissAll}
            style={{ height: 34, padding: '0 14px', fontSize: 12, gap: 6 }}
          >
            <Icons.Check size={13} color="#10b981" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* ── Micro-KPI Summary Strip ── */}
      <div className="notif-summary-strip">
        <div className="notif-summary-chip">
          <span className="chip-dot total" />
          <span>Active Notices: <strong>{counts.all}</strong></span>
        </div>
        <div className="notif-summary-chip">
          <span className="chip-dot warning" />
          <span>Expiring Passes: <strong>{counts.expiring}</strong></span>
        </div>
        <div className="notif-summary-chip">
          <span className="chip-dot danger" />
          <span>Account Holds: <strong>{counts.suspended}</strong></span>
        </div>
        <div className="notif-summary-chip">
          <span className="chip-dot primary" />
          <span>Desk Activities: <strong>{counts.reception_activity + counts.admin_activity}</strong></span>
        </div>
      </div>

      {/* ── Controls Toolbar: Search & Segment Filter Pills ── */}
      <div className="notif-controls-bar">
        {/* Embedded Icon Search Input */}
        <div className="notif-search-box">
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: '#94a3b8',
              zIndex: 2,
            }}
          >
            <Icons.Search size={14} />
          </span>
          <input
            type="text"
            className="notif-search-input"
            placeholder="Search alerts by member, keyword, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="notif-filter-pills">
          {[
            { key: 'all', label: 'All Alerts', count: counts.all },
            { key: 'expiring', label: 'Expiring', count: counts.expiring },
            { key: 'expired', label: 'Expired', count: counts.expired },
            { key: 'suspended', label: 'Suspended', count: counts.suspended },
            { key: 'reception_activity', label: 'Front Desk', count: counts.reception_activity },
            { key: 'admin_activity', label: 'Admin Audits', count: counts.admin_activity },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`notif-pill-btn ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              <span>{tab.label}</span>
              <span className="notif-pill-count">{tab.count}</span>
            </button>
          ))}

          {(searchQuery || filter !== 'all') && (
            <button
              type="button"
              className="notif-pill-btn"
              onClick={() => {
                setSearchQuery('');
                setFilter('all');
              }}
              title="Reset search and filters"
              style={{ padding: '0 8px' }}
            >
              <Icons.RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Notification Cards Stream ── */}
      <div className="notif-stream-list">
        {isLoading ? (
          <div style={{ padding: 50, textAlign: 'center', color: '#94a3b8' }}>
            <div className="spinner" style={{ margin: '0 auto 10px' }} />
            <div>Loading notification feed...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="notif-empty-card-modern">
            <Icons.CheckCircle size={36} color="#10b981" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 2px', color: 'var(--gym-text-main, #0f172a)' }}>
              All Caught Up!
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: 0, maxWidth: 400 }}>
              {searchQuery || filter !== 'all'
                ? 'No alerts match your current filter or search criteria.'
                : 'There are no pending operational notices or urgent account holds.'}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                style={{ marginTop: 8 }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredList.map((item) => {
            const isSuspended = item.type === 'suspended';
            const isExpired = item.type === 'expired';
            const isExpiring = item.type === 'expiring';
            const isReceptionAct = item.type === 'reception_activity';
            const isAdminAct = item.type === 'admin_activity';

            return (
              <div
                key={item.id}
                className={`notif-item-card-modern ${item.type || 'general'}`}
              >
                {/* Left Column: Icon Bubble + Details */}
                <div className="notif-card-main-col">
                  <div className={`notif-icon-bubble ${item.type || 'general'}`}>
                    {isSuspended ? (
                      <Icons.AlertTriangle size={18} color="#dc2626" />
                    ) : isExpired ? (
                      <Icons.AlertTriangle size={18} color="#ea580c" />
                    ) : isExpiring ? (
                      <Icons.Clock size={18} color="#d97706" />
                    ) : isReceptionAct ? (
                      <Icons.Bell size={18} color="#2563eb" />
                    ) : isAdminAct ? (
                      <Icons.Shield size={18} color="#7c3aed" />
                    ) : (
                      <Icons.Info size={18} color="#0d9488" />
                    )}
                  </div>

                  <div className="notif-card-details">
                    <div className="notif-title-row">
                      <span className={`notif-tag-pill ${item.type || 'general'}`}>
                        {item.badge || 'Notice'}
                      </span>
                      <h4 className="notif-title-text">{item.title}</h4>
                      <span className="notif-time-badge">
                        <Icons.Clock size={11} />
                        <span>{item.date}</span>
                      </span>
                    </div>
                    <p className="notif-desc-text">{item.message}</p>
                  </div>
                </div>

                {/* Right Column: Interactive Actions */}
                <div className="notif-card-actions">
                  {item.actionText && (
                    <button
                      type="button"
                      className={`notif-action-btn-modern ${isSuspended ? 'danger-action' : 'primary-action'}`}
                      onClick={() => onNavigate && onNavigate(item.actionView)}
                    >
                      <span>{item.actionText}</span>
                      <Icons.ArrowRight size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="notif-dismiss-btn-modern"
                    onClick={() => handleDismiss(item.id)}
                    title="Dismiss notification"
                    aria-label="Dismiss"
                  >
                    <Icons.X size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
