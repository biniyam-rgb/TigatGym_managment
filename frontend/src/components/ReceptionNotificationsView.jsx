import { useState, useEffect } from 'react';
import apiClient from '../services/api';

// Crisp Lucide-style SVG Icons
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
  CheckCircle: ({ size = 32, color = '#22c55e' }) => (
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
};

// Defensive conversion ensuring any non-array or object structure safely resolves to an Array
function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

export default function ReceptionNotificationsView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'expiring' | 'expired' | 'general'
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('tigat_dismissed_notifs') || '[]'));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    let ignore = false;
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
  }, []);

  const defaultNotifications = [
    {
      id: 'notif_1',
      title: 'Membership Approaching Expiration',
      message: '3 members have subscriptions expiring in the next 7 days.',
      type: 'expiring',
      date: 'Today',
      actionText: 'Review Memberships',
      actionView: 'memberships',
    },
    {
      id: 'notif_2',
      title: 'Expired Subscription Alert',
      message: 'Hana Tadesse membership expired 2 days ago. Renewal pending.',
      type: 'expired',
      date: 'Yesterday',
      actionText: 'Renew Now',
      actionView: 'memberships',
    },
    {
      id: 'notif_3',
      title: 'Class Capacity Milestone',
      message: 'Strength Training class has reached 22/30 capacity for today.',
      type: 'general',
      date: 'Today',
      actionText: 'View Schedule',
      actionView: 'classes',
    },
    {
      id: 'notif_4',
      title: 'Front-Desk Attendance Check',
      message: '48 total check-ins recorded so far today. Attendance pace is normal.',
      type: 'general',
      date: 'Today',
      actionText: 'Open Attendance',
      actionView: 'attendance',
    },
  ];

  // Role-Based Activity Notifications (Receptionist activities for Admin, Admin activities for Owner)
  const apiActivities = safeArray(data?.activity_notifications).map((act) => ({
    id: act.id,
    title: act.title,
    message: act.message,
    type: act.type, // 'reception_activity' | 'admin_activity'
    badge: act.badge,
    actor_name: act.actor_name,
    actor_role: act.actor_role,
    date: act.time || 'Recent',
    actionText: act.view ? `Open ${act.view.charAt(0).toUpperCase() + act.view.slice(1)}` : 'View Details',
    actionView: act.view || 'notifications',
  }));

  // Combine live notifications from API if available
  const apiAlerts = safeArray(data?.membership_alerts).map((alert) => ({
    id: `alert_${alert.id}`,
    title: alert.type === 'suspended'
      ? `Member Suspended: ${alert.member_name} (${alert.member_code})`
      : alert.type === 'expired'
        ? `Subscription Expired: ${alert.member_name}`
        : `Expiring Soon: ${alert.member_name}`,
    message: alert.type === 'suspended'
      ? `Reason: "${alert.reason || 'Administrative hold'}" — Suspended by ${alert.suspended_by || 'Management'}`
      : alert.type === 'expired'
        ? 'Membership is inactive. Please record renewal payment.'
        : `Plan expires in ${alert.days_remaining ?? 3} days.`,
    type: alert.type === 'suspended' ? 'suspended' : alert.type === 'expired' ? 'expired' : 'expiring',
    date: alert.suspended_at || 'Recent',
    actionText: alert.type === 'suspended' ? 'View Member' : 'View Subscription',
    actionView: alert.type === 'suspended' ? 'members' : 'memberships',
  }));

  // System notifications (Turnstile entry denials, pending invoices, floor capacity)
  const apiSystemNotifs = safeArray(data?.notifications).map((notif) => ({
    id: notif.id,
    title: notif.title,
    message: notif.message,
    type: notif.type === 'error' ? 'suspended' : 'general',
    badge: notif.type === 'error' ? 'Security Alert' : 'System Notice',
    date: 'Today',
    actionText: notif.action_label || 'View Details',
    actionView: notif.action_target || 'notifications',
  }));

  const allList = apiActivities.length > 0 || apiAlerts.length > 0 || apiSystemNotifs.length > 0
    ? [...apiActivities, ...apiAlerts, ...apiSystemNotifs]
    : defaultNotifications;
  const filteredList = allList.filter((item) => {
    if (dismissedIds.has(item.id)) return false;
    if (filter === 'all') return true;
    return item.type === filter;
  });

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
    <div className="reception-notifications-page" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="reception-notif-page-title">Notifications & Alerts</h2>
          <p className="reception-notif-page-desc">
            Real-time membership expiration notices, front-desk reminders, and admissions alerts.
          </p>
        </div>
        {filteredList.length > 0 && (
          <button
            type="button"
            className="reception-notif-dismissall-btn"
            onClick={handleDismissAll}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="reception-notif-filter-bar">
        {[
          { key: 'all', label: 'All Alerts & Activity' },
          { key: 'reception_activity', label: 'Reception Activities' },
          { key: 'admin_activity', label: 'Admin Activities' },
          { key: 'suspended', label: 'Suspended Accounts' },
          { key: 'expiring', label: 'Expiring Soon' },
          { key: 'expired', label: 'Expired' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`reception-notif-filter-btn ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading notifications...</div>
        ) : filteredList.length === 0 ? (
          <div className="reception-notif-empty-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Icons.CheckCircle size={36} color="#16a34a" />
            <h3 className="reception-notif-item-title" style={{ fontSize: 16 }}>All Caught Up!</h3>
            <p className="reception-notif-item-desc">No pending alerts or notifications in this filter.</p>
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
                className={`reception-notif-item-card ${item.type || 'general'}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isSuspended ? 'rgba(220, 38, 38, 0.15)' : isExpired ? 'rgba(239, 68, 68, 0.12)' : isExpiring ? 'rgba(230, 124, 0, 0.15)' : isReceptionAct ? 'rgba(37, 99, 235, 0.15)' : isAdminAct ? 'rgba(124, 58, 237, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isSuspended ? '#dc2626' : isExpired ? '#ef4444' : isExpiring ? '#ea580c' : isReceptionAct ? '#2563eb' : isAdminAct ? '#7c3aed' : '#3b82f6',
                    }}
                  >
                    {isSuspended ? (
                      <span style={{ fontSize: 18 }}>⛔</span>
                    ) : isExpired ? (
                      <Icons.AlertTriangle size={17} color="#ef4444" />
                    ) : isExpiring ? (
                      <Icons.Clock size={17} color="#ea580c" />
                    ) : isReceptionAct ? (
                      <span style={{ fontSize: 16 }}>🛎️</span>
                    ) : isAdminAct ? (
                      <span style={{ fontSize: 16 }}>🛡️</span>
                    ) : (
                      <Icons.Info size={17} color="#3b82f6" />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 className="reception-notif-item-title">{item.title}</h4>
                      {item.badge && (
                        <span className={`notif-role-badge ${isReceptionAct ? 'reception' : isAdminAct ? 'admin' : 'reception'}`}>
                          {item.badge}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.date}</span>
                    </div>
                    <p className="reception-notif-item-desc">{item.message}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {item.actionText && (
                    <button
                      type="button"
                      onClick={() => onNavigate(item.actionView)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        background: isSuspended ? '#dc2626' : '#ea580c',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {item.actionText}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id)}
                    title="Dismiss notification"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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
