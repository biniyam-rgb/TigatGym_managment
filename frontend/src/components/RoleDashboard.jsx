import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import AuditLogViewer from './AuditLogViewer';
import ReceptionDashboard from './ReceptionDashboard';

// Clean SVG Icons for zero-emoji compliance
function DeskIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h16" />
      <path d="M4 15h16" />
      <path d="M4 11h16" />
      <path d="M8 7h8" />
      <path d="M6 7v12" />
      <path d="M18 7v12" />
    </svg>
  );
}

function BellIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function AlertTriangleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ChartIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function UsersIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ActivityIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function CreditCardIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function ClockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckCircleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ArrowUpRightIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function XIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Defensive conversion ensuring any non-array or object structure safely resolves to an Array
function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

export default function RoleDashboard({ onNavigate }) {
  const { hasRole, primaryRole } = useAuth();
  const [activeTab, setActiveTab] = useState('finance'); // 'finance' | 'reception' | 'audit'

  const isOwner = hasRole('owner');
  const isAdmin = hasRole('admin');

  // Operational Metrics
  const [metrics, setMetrics] = useState({
    totalMembers: 89,
    activeSubscriptions: 89,
    totalTrainers: 12,
    todayCheckIns: 0,
    monthRevenue: 45300,
    monthExpenses: 16200,
    isLoading: true,
  });

  const [trainersList, setTrainersList] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activityNotifications, setActivityNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const alertsList = safeArray(alerts);
  const activityList = safeArray(activityNotifications);
  const systemList = safeArray(systemNotifications);

  const suspendedAlerts = alertsList.filter((a) => a && a.type === 'suspended');
  const expiredAlerts = alertsList.filter((a) => a && a.type === 'expired');

  // Seen Urgent Alert Tracking - Once seen on the overview dashboard, they do not show again
  const [seenUrgentIds, setSeenUrgentIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('tigat_seen_urgent_ids') || '[]'));
    } catch {
      return new Set();
    }
  });

  const markUrgentAsSeen = (id) => {
    setSeenUrgentIds((prev) => {
      const next = new Set(prev).add(id);
      localStorage.setItem('tigat_seen_urgent_ids', JSON.stringify([...next]));
      return next;
    });
  };

  const markAllUrgentAsSeen = (ids) => {
    setSeenUrgentIds((prev) => {
      const next = new Set([...prev, ...ids]);
      localStorage.setItem('tigat_seen_urgent_ids', JSON.stringify([...next]));
      return next;
    });
  };

  const urgentAlerts = [
    // 1. Suspended Members (Turnstile access blocked, administrative hold)
    ...suspendedAlerts.map((sub) => ({
      id: `urgent_susp_${sub.id}`,
      severity: 'danger',
      badge: 'Account Suspended',
      title: sub.member_name,
      code: sub.member_code,
      desc: `Reason: "${sub.reason || 'Administrative policy hold'}"`,
      meta: `Suspended by ${sub.suspended_by || 'Management'} • ${sub.suspended_at || 'Recently'}`,
      view: 'members',
      actionText: 'Review Member',
    })),

    // 2. Turnstile Entry Denials Today (Anti-passback, expired pass, security block)
    ...systemList
      .filter((n) => n && (n.id === 'notif_denied' || n.type === 'error'))
      .map((denial) => ({
        id: `urgent_${denial.id}_${denial.message || ''}`,
        severity: 'danger',
        badge: 'Turnstile Block',
        title: denial.title,
        code: 'SECURITY',
        desc: denial.message,
        meta: 'Turnstile entry denied today • Front-desk check required',
        view: 'attendance',
        actionText: 'Turnstile Logs',
      })),

    // 3. Expired Subscriptions (Turnstile blocked at door, renewal required)
    ...expiredAlerts.map((exp) => ({
      id: `urgent_exp_${exp.id}`,
      severity: 'warning',
      badge: 'Membership Expired',
      title: exp.member_name,
      code: exp.member_code,
      desc: `${exp.plan_name || 'Membership'} has expired. Access denied at turnstile.`,
      meta: `Expired: ${exp.expiration_date || 'Recently'}`,
      view: 'memberships',
      actionText: 'Renew Subscription',
    })),

    // 4. Floor Capacity Limit (>80% occupied)
    ...systemList
      .filter((n) => n && n.id === 'notif_capacity')
      .map((cap) => ({
        id: `urgent_${cap.id}_${cap.message || ''}`,
        severity: 'warning',
        badge: 'Capacity Alert',
        title: cap.title,
        code: 'FLOOR-LIMIT',
        desc: cap.message,
        meta: 'Admissions monitoring recommended',
        view: 'attendance',
        actionText: 'View Floor',
      })),
  ];

  const unseenUrgentAlerts = urgentAlerts.filter((item) => !seenUrgentIds.has(item.id));
  const unseenIdsRef = useRef([]);

  useEffect(() => {
    unseenIdsRef.current = unseenUrgentAlerts.map((a) => a.id);
  }, [unseenUrgentAlerts]);

  // Auto-mark as seen after viewing for 5 seconds or when leaving the overview dashboard
  useEffect(() => {
    if (unseenIdsRef.current.length > 0) {
      const timer = setTimeout(() => {
        try {
          const stored = new Set(JSON.parse(localStorage.getItem('tigat_seen_urgent_ids') || '[]'));
          unseenIdsRef.current.forEach((id) => stored.add(id));
          localStorage.setItem('tigat_seen_urgent_ids', JSON.stringify([...stored]));
        } catch {
          // ignore localStorage access issues
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [unseenUrgentAlerts.length]);

  useEffect(() => {
    return () => {
      if (unseenIdsRef.current.length > 0) {
        try {
          const stored = new Set(JSON.parse(localStorage.getItem('tigat_seen_urgent_ids') || '[]'));
          unseenIdsRef.current.forEach((id) => stored.add(id));
          localStorage.setItem('tigat_seen_urgent_ids', JSON.stringify([...stored]));
        } catch {
          // ignore localStorage access issues
        }
      }
    };
  }, []);

  // Featured coaches for the business analytics view
  const defaultTrainers = [
    {
      id: 1,
      name: 'Zelalem Bekele',
      specialization: 'Strength & Conditioning',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      initials: 'ZB',
      status: 'Active',
      rating: '4.9',
    },
    {
      id: 2,
      name: 'Biniyam Amir',
      specialization: 'Hypertrophy & Physique',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      initials: 'BA',
      status: 'Active',
      rating: '5.0',
    },
    {
      id: 3,
      name: 'Kalkidan Ashenafi',
      specialization: 'High Intensity & HIIT',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      initials: 'KA',
      status: 'Active',
      rating: '4.8',
    },
    {
      id: 4,
      name: 'Fitsum Abel',
      specialization: 'Mobility & Rehab',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      initials: 'FA',
      status: 'Active',
      rating: '4.9',
    },
  ];

  useEffect(() => {
    if (primaryRole === 'receptionist') {
      return;
    }

    let ignore = false;

    const fetchAllData = () => {
      // Load live metrics from API (financials, members, subscriptions, trainers, reception alerts)
      Promise.allSettled([
        apiClient.getPaymentSummary(),
        apiClient.getMembers({ per_page: 1 }),
        apiClient.getSubscriptions({ status: 'active', per_page: 1 }),
        apiClient.getTrainers(),
        apiClient.getReceptionDashboard({ refresh: 1 }),
      ]).then(([payRes, memRes, subRes, trainRes, recRes]) => {
        if (ignore) return;

        const pay = payRes.status === 'fulfilled' ? (payRes.value?.data || payRes.value || {}) : {};
        const mem = memRes.status === 'fulfilled' ? (memRes.value?.meta || memRes.value || {}) : {};
        const sub = subRes.status === 'fulfilled' ? (subRes.value?.meta || subRes.value || {}) : {};
        const trainers = trainRes.status === 'fulfilled' ? (trainRes.value?.data || trainRes.value || []) : [];
        const rec = recRes.status === 'fulfilled' ? (recRes.value?.data || recRes.value || {}) : {};

        if (Array.isArray(trainers) && trainers.length > 0) {
          setTrainersList(trainers.slice(0, 4));
        }

        if (rec?.membership_alerts) {
          setAlerts(safeArray(rec.membership_alerts));
        }

        if (rec?.activity_notifications) {
          setActivityNotifications(safeArray(rec.activity_notifications));
        }

        if (rec?.notifications) {
          setSystemNotifications(safeArray(rec.notifications));
        }

        setMetrics((prev) => ({
          ...prev,
          totalMembers: mem?.total || prev.totalMembers,
          activeSubscriptions: sub?.total || prev.activeSubscriptions,
          totalTrainers: Array.isArray(trainers) ? trainers.length : prev.totalTrainers,
          todayCheckIns: rec?.stats?.today_check_ins ?? prev.todayCheckIns,
          monthRevenue: pay?.month_revenue || pay?.total_revenue || prev.monthRevenue,
          monthExpenses: pay?.month_expenses || prev.monthExpenses,
          isLoading: false,
        }));
      }).catch((err) => {
        console.error('Failed to load dashboard metrics:', err);
        if (!ignore) {
          setMetrics((prev) => ({ ...prev, isLoading: false }));
        }
      });
    };

    fetchAllData();

    // Auto-refresh notifications and metrics every 15 seconds
    const intervalId = setInterval(fetchAllData, 15000);

    const handleFocus = () => {
      fetchAllData();
    };

    window.addEventListener('gymcore:refresh', fetchAllData);
    window.addEventListener('focus', handleFocus);

    return () => {
      ignore = true;
      clearInterval(intervalId);
      window.removeEventListener('gymcore:refresh', fetchAllData);
      window.removeEventListener('focus', handleFocus);
    };
  }, [primaryRole]);

  // Revenue analytics monthly series
  const monthlyData = [
    { month: 'Jan', rev: 850, exp: 420 },
    { month: 'Feb', rev: 1100, exp: 510 },
    { month: 'Mar', rev: 720, exp: 380 },
    { month: 'Apr', rev: 1380, exp: 590 },
    { month: 'May', rev: 1150, exp: 620 },
    { month: 'Jun', rev: 1220, exp: 680 },
    { month: 'Jul', rev: 1420, exp: 710 },
    { month: 'Aug', rev: 1350, exp: 690 },
  ];

  // Curated high-resolution fitness trainer portraits for coaches without custom uploads
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  ];

  // Map real trainers with default portraits if missing, and backfill up to 4 so the grid is always complete
  const displayTrainers = (() => {
    const mappedReal = trainersList.map((t, idx) => ({
      ...t,
      id: t.id || `coach_${idx}`,
      name: t.name || 'Personal Trainer',
      specialization: t.profile?.specialization || t.specialization || 'Strength & Conditioning',
      avatar: t.avatar || defaultAvatars[idx % defaultAvatars.length],
      rating: t.rating || '4.9',
      active_clients: t.active_clients_count ?? t.clients ?? 14,
      status: t.status || 'Active',
    }));

    if (mappedReal.length >= 4) {
      return mappedReal.slice(0, 4);
    }

    const needed = 4 - mappedReal.length;
    const realNames = new Set(mappedReal.map((m) => (m.name || '').toLowerCase()));
    const backfill = defaultTrainers
      .filter((d) => !realNames.has((d.name || '').toLowerCase()))
      .slice(0, needed)
      .map((d, idx) => ({
        ...d,
        avatar: d.avatar || defaultAvatars[(mappedReal.length + idx) % defaultAvatars.length],
        active_clients: 12 + idx * 3,
      }));

    return [...mappedReal, ...backfill];
  })();

  // Dedicated Receptionist view without administrator tabs
  if (primaryRole === 'receptionist') {
    return <ReceptionDashboard onNavigate={onNavigate} />;
  }

  return (
    <div className="iron-dashboard-wrapper">
      {/* Role-Based Secondary Navigation Tabs */}
      {(isOwner || isAdmin) && (
        <div className="iron-dashboard-subtabs">
          <button
            type="button"
            className={`subtab-pill ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveTab('finance')}
          >
            <ChartIcon size={16} />
            <span>Revenue & Analytics</span>
          </button>

          <button
            type="button"
            className={`subtab-pill ${activeTab === 'reception' ? 'active' : ''}`}
            onClick={() => setActiveTab('reception')}
          >
            <DeskIcon size={16} />
            <span>Front Desk Reception</span>
          </button>

          {isOwner && (
            <button
              type="button"
              className={`subtab-pill ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <ShieldIcon size={16} />
              <span>Audit Trail</span>
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 1: FINANCIAL & BUSINESS ANALYTICS (DEFAULT FOR OWNER/ADMIN/MEMBERS)
          ========================================================================= */}
      {(activeTab === 'finance' || (!isOwner && !isAdmin)) && (
        <>
          {/* Header Banner */}
          <div className="reception-header-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 className="reception-welcome-title" style={{ margin: 0 }}>Gym Operations & Performance Overview</h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#16a34a',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  Live Updates Active
                </span>
              </div>
              <p className="reception-welcome-desc" style={{ marginTop: 4 }}>
                Real-time front-desk reception activities, membership alerts, and operational metrics.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('notifications')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 9,
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                }}
              >
                <BellIcon size={16} />
                <span>Notification Center</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              URGENT OPERATIONAL & SECURITY ALERTS ONLY (ZERO CLUTTER ON DASHBOARD)
              Seen notifications do not come to overview dashboard even if urgent
              ========================================================================= */}
          {(() => {
            const totalFeedCount = activityList.length + alertsList.length + systemList.length;

            if (unseenUrgentAlerts.length === 0) {
              return (
                <div className="urgent-allclear-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircleIcon size={20} />
                    <div>
                      <div className="urgent-allclear-title">Security & Turnstile Access: All Normal</div>
                      <div className="urgent-allclear-desc">
                        0 active turnstile denials, 0 account suspensions, and no critical operational blocks.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="urgent-alerts-viewall-btn"
                    onClick={() => onNavigate && onNavigate('notifications')}
                  >
                    <span>Notification Feed ({totalFeedCount})</span>
                    <ArrowUpRightIcon size={13} />
                  </button>
                </div>
              );
            }

            return (
              <div className="urgent-alerts-container">
                <div className="urgent-alerts-panel">
                  {/* Top Header */}
                  <div className="urgent-alerts-topbar">
                    <div className="urgent-alerts-title-wrap">
                      <div className="urgent-alert-icon-pulse">
                        <AlertTriangleIcon size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 className="urgent-alerts-heading">Urgent Security & Operational Alerts</h3>
                          <span className="urgent-badge danger">{unseenUrgentAlerts.length} Action Needed</span>
                        </div>
                        <p className="urgent-alerts-subtext">
                          Critical turnstile access blocks, suspended accounts, and expired passes requiring staff action.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="urgent-markall-btn"
                        onClick={() => markAllUrgentAsSeen(unseenUrgentAlerts.map((a) => a.id))}
                        title="Mark all as seen so they do not show on overview dashboard"
                      >
                        <CheckIcon size={13} />
                        <span>Mark All as Seen</span>
                      </button>
                      <button
                        type="button"
                        className="urgent-alerts-viewall-btn"
                        onClick={() => onNavigate && onNavigate('notifications')}
                      >
                        <span>Full Notification Feed ({totalFeedCount})</span>
                        <ArrowUpRightIcon size={13} />
                      </button>
                    </div>
                  </div>

                  {/* List of Urgent Items */}
                  <div className="urgent-alerts-grid">
                    {unseenUrgentAlerts.map((item, idx) => (
                      <div key={item.id || `urgent_${idx}`} className={`urgent-item-card ${item.severity}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span className={`urgent-badge ${item.severity}`}>{item.badge}</span>
                              <span className="urgent-member-name">{item.title}</span>
                              {item.code && <span className="urgent-member-code">{item.code}</span>}
                            </div>
                            <div className="urgent-item-desc">{item.desc}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div className="urgent-item-meta">{item.meta}</div>
                          <button
                            type="button"
                            className={`urgent-action-btn ${item.severity}`}
                            onClick={() => {
                              markUrgentAsSeen(item.id);
                              if (item.view && onNavigate) onNavigate(item.view);
                            }}
                          >
                            {item.actionText} →
                          </button>
                          <button
                            type="button"
                            className="urgent-dismiss-btn"
                            onClick={() => markUrgentAsSeen(item.id)}
                            title="Mark as seen (dismiss from overview dashboard)"
                            aria-label="Dismiss alert"
                          >
                            <XIcon size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 4 Stat KPI Cards */}
          <div className="iron-stat-cards-grid">
            {/* Card 1: Revenue */}
            <div
              className="iron-stat-card card-revenue clickable-card"
              onClick={() => onNavigate && onNavigate('payments')}
            >
              <div className="stat-card-top">
                <span className="stat-card-icon icon-orange" style={{ padding: 6, borderRadius: 8 }}>
                  <CreditCardIcon size={20} />
                </span>
                <span className="stat-card-label">Revenue</span>
              </div>
              <div className="stat-card-main-val font-mono">
                {metrics.monthRevenue > 0
                  ? `${(metrics.monthRevenue / 1000).toFixed(1)}k ETB`
                  : '45.3k ETB'}
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-period">Month / Current</span>
                <span className="stat-pill-badge badge-green">
                  ↗ +2.1%
                </span>
              </div>
            </div>

            {/* Card 2: Operating Expenses (Owner) or Today's Check-ins (Admin) */}
            {isOwner ? (
              <div
                className="iron-stat-card card-expenses clickable-card"
                onClick={() => onNavigate && onNavigate('expenses')}
              >
                <div className="stat-card-top">
                  <span className="stat-card-icon icon-purple" style={{ padding: 6, borderRadius: 8 }}>
                    <CreditCardIcon size={20} />
                  </span>
                  <span className="stat-card-label">Expenses</span>
                </div>
                <div className="stat-card-main-val font-mono">
                  {metrics.monthExpenses > 0
                    ? `${(metrics.monthExpenses / 1000).toFixed(1)}k ETB`
                    : '16.2k ETB'}
                </div>
                <div className="stat-card-bottom">
                  <span className="stat-card-period">Month / Current</span>
                  <span className="stat-pill-badge badge-neutral" style={{ color: '#ea580c' }}>
                    Operational
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="iron-stat-card clickable-card"
                style={{ borderTop: '3px solid #3b82f6' }}
                onClick={() => onNavigate && onNavigate('notifications')}
              >
                <div className="stat-card-top">
                  <span className="stat-card-icon" style={{ padding: 6, borderRadius: 8, background: '#eff6ff', color: '#3b82f6' }}>
                    <ActivityIcon size={20} />
                  </span>
                  <span className="stat-card-label">Today's Check-ins</span>
                </div>
                <div className="stat-card-main-val font-mono">
                  {metrics.todayCheckIns ?? 0}
                </div>
                <div className="stat-card-bottom">
                  <span className="stat-card-period">Front Desk Verified</span>
                  <span className="stat-pill-badge badge-green">
                    Live Feed
                  </span>
                </div>
              </div>
            )}

            {/* Card 3: Members */}
            <div
              className="iron-stat-card card-members clickable-card"
              onClick={() => onNavigate && onNavigate('members')}
            >
              <div className="stat-card-top">
                <span className="stat-card-icon icon-blue" style={{ padding: 6, borderRadius: 8 }}>
                  <UsersIcon size={20} />
                </span>
                <span className="stat-card-label">Members</span>
              </div>
              <div className="stat-card-main-val font-mono">
                {metrics.totalMembers}
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-period">Active Members</span>
                <span className="stat-pill-badge badge-green">
                  ↗ +1.8%
                </span>
              </div>
            </div>

            {/* Card 4: Trainers */}
            <div
              className="iron-stat-card card-trainers clickable-card"
              onClick={() => onNavigate && onNavigate('trainers')}
            >
              <div className="stat-card-top">
                <span className="stat-card-icon icon-green" style={{ padding: 6, borderRadius: 8 }}>
                  <DeskIcon size={20} />
                </span>
                <span className="stat-card-label">Trainers</span>
              </div>
              <div className="stat-card-main-val font-mono">
                {metrics.totalTrainers}
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-period">Active Coaches</span>
                <span className="stat-pill-badge badge-green">
                  ↗ +3.0%
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Analytics Chart */}
          <div className="iron-card-panel iron-revenue-panel" style={{ marginBottom: 24 }}>
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Revenue & Expense Analytics</h3>
                <span className="panel-subtitle">Jan – Aug 2026 (ETB in thousands)</span>
              </div>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-dot dot-orange"></span>
                  <span>Revenue</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot dot-grey"></span>
                  <span>Expense</span>
                </span>
              </div>
            </div>

            <div className="revenue-chart-container">
              <div className="chart-y-axis">
                <span>1400</span>
                <span>1200</span>
                <span>1000</span>
                <span>800</span>
                <span>$0</span>
              </div>

              <div className="chart-bars-wrap">
                <div className="chart-gridlines" aria-hidden="true">
                  <div className="gridline"></div>
                  <div className="gridline"></div>
                  <div className="gridline"></div>
                  <div className="gridline"></div>
                  <div className="gridline"></div>
                </div>

                <div className="chart-columns-flex">
                  {monthlyData.map((item) => {
                    const maxScale = 1600;
                    const revHeight = (item.rev / maxScale) * 100;
                    const expHeight = (item.exp / maxScale) * 100;

                    return (
                      <div key={item.month} className="monthly-column-group">
                        <div className="bars-pair">
                          <div
                            className="bar bar-revenue"
                            style={{ height: `${revHeight}%` }}
                            title={`Revenue: ${item.rev} ETB`}
                          ></div>
                          <div
                            className="bar bar-expense"
                            style={{ height: `${expHeight}%` }}
                            title={`Expense: ${item.exp} ETB`}
                          ></div>
                        </div>
                        <span className="month-label">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Coaches Roster */}
          <div className="iron-trainers-section">
            <div className="trainers-section-header">
              <div>
                <h3 className="section-heading">Featured Personal Trainers</h3>
                <p className="section-subheading">Certified fitness coaches, specialist trainers, and PT bookings</p>
              </div>
              <button
                type="button"
                className="view-all-link-btn"
                onClick={() => onNavigate && onNavigate('trainers')}
              >
                <span>View All Coaches</span>
                <ArrowUpRightIcon size={14} />
              </button>
            </div>

            <div className="iron-trainers-row">
              {displayTrainers.map((coach, idx) => {
                const initial = (coach.name || 'C').charAt(0).toUpperCase();
                return (
                  <div key={coach.id || idx} className="iron-coach-card">
                    {/* Immersive Photo Container with Overlays */}
                    <div className="coach-photo-wrap">
                      <img
                        src={coach.avatar || defaultAvatars[idx % defaultAvatars.length]}
                        alt={coach.name}
                        className="coach-portrait-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fb = e.target.parentElement?.querySelector('.coach-fallback-portrait');
                          if (fb) fb.style.display = 'flex';
                        }}
                      />
                      <div className="coach-fallback-portrait" style={{ display: 'none' }}>
                        <span className="coach-fallback-letter">{initial}</span>
                        <span className="coach-fallback-role">Certified PT</span>
                      </div>

                      {/* Top Overlay Badges */}
                      <div className="coach-photo-top-bar">
                        <span className="coach-status-pill">
                          <span className="coach-status-dot pulse"></span>
                          <span>Active</span>
                        </span>
                        <span className="coach-rating-pill">
                          <span style={{ color: '#f59e0b' }}>★</span>
                          <span>{coach.rating || '4.9'}</span>
                        </span>
                      </div>

                      {/* Bottom Gradient Scrim with Specialty */}
                      <div className="coach-photo-scrim">
                        <span className="coach-specialty-badge">
                          {coach.specialization || 'Strength & Conditioning'}
                        </span>
                      </div>
                    </div>

                    {/* Trainer Profile Meta */}
                    <div className="coach-info-body">
                      <div className="coach-name-row">
                        <h4 className="coach-full-name">{coach.name}</h4>
                        <span className="coach-verified-icon" title="Certified Personal Trainer">✓</span>
                      </div>

                      <div className="coach-meta-stats">
                        <span className="coach-meta-item">
                          <UsersIcon size={12} />
                          <span>{coach.active_clients || 14} Clients</span>
                        </span>
                        <span className="coach-meta-divider">•</span>
                        <span className="coach-meta-item">
                          <span>{coach.status || 'Full-Time'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Bar: Book Session & Direct Consult */}
                    <div className="coach-actions-bar">
                      <button
                        type="button"
                        className="coach-book-btn"
                        onClick={() => onNavigate && onNavigate('trainers')}
                        title="Book Personal Training Session"
                      >
                        <ClockIcon size={14} />
                        <span>Book PT</span>
                      </button>
                      <button
                        type="button"
                        className="coach-consult-btn"
                        onClick={() => onNavigate && onNavigate('trainers')}
                        title="Direct Consultation / Message"
                      >
                        <DeskIcon size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: FRONT DESK RECEPTION OPERATIONS (ONLY WHEN TAB IS EXPLICITLY CLICKED)
          ========================================================================= */}
      {activeTab === 'reception' && (isOwner || isAdmin) && (
        <ReceptionDashboard onNavigate={onNavigate} />
      )}

      {/* =========================================================================
          TAB 3: SYSTEM AUDIT TRAIL (OWNER ONLY)
          ========================================================================= */}
      {activeTab === 'audit' && isOwner && (
        <div className="subtab-pane">
          <AuditLogViewer />
        </div>
      )}
    </div>
  );
}
