import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import AuditLogViewer from './AuditLogViewer';
import ReceptionDashboard from './ReceptionDashboard';

// ─── SVG Icon Library ────────────────────────────────────────────────────────

function DeskIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h16" /><path d="M4 15h16" /><path d="M4 11h16" />
      <path d="M8 7h8" /><path d="M6 7v12" /><path d="M18 7v12" />
    </svg>
  );
}

function AlertTriangleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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

function CalendarIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UserPlusIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
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
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

function TrendingUpIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendingDownIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function TrendNeutralIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ProfitIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function WarningClockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function UserCheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
}

/** Format a trend percentage with sign and label */
function TrendBadge({ value, suffix = '% vs last month', zeroLabel = 'No change' }) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;

  if (num === 0) {
    return (
      <span className="kpi-trend trend-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <TrendNeutralIcon size={12} />
        {zeroLabel}
      </span>
    );
  }
  if (num > 0) {
    return (
      <span className="kpi-trend trend-positive" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <TrendingUpIcon size={12} />
        +{Math.abs(num)}%{suffix ? ' ' + suffix : ''}
      </span>
    );
  }
  return (
    <span className="kpi-trend trend-negative" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <TrendingDownIcon size={12} />
      -{Math.abs(num)}%{suffix ? ' ' + suffix : ''}
    </span>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

const ACTIVITY_ICONS = {
  check_in: '✓',
  registration: '＋',
  payment: '₿',
  default: '•',
};

const ACTIVITY_COLORS = {
  check_in: '#10b981',
  registration: '#3b82f6',
  payment: '#f59e0b',
  default: '#94a3b8',
};

function ActivityFeedItem({ item }) {
  const color = ACTIVITY_COLORS[item.category] || ACTIVITY_COLORS.default;
  const icon = ACTIVITY_ICONS[item.category] || ACTIVITY_ICONS.default;
  return (
    <div className="dash-activity-item">
      <div className="dash-activity-dot" style={{ background: color, color: '#fff' }}>
        <span style={{ fontSize: 10, fontWeight: 700 }}>{icon}</span>
      </div>
      <div className="dash-activity-body">
        <div className="dash-activity-title">{item.title}</div>
        <div className="dash-activity-desc">{item.description}</div>
      </div>
      <div className="dash-activity-time">{item.time_formatted || '—'}</div>
    </div>
  );
}

// ─── Class Schedule Item ──────────────────────────────────────────────────────

function ClassScheduleItem({ cls }) {
  const fillPct = cls.capacity > 0 ? Math.min(100, Math.round((cls.booking_count / cls.capacity) * 100)) : 0;
  const fillColor = cls.is_full ? '#ef4444' : fillPct >= 70 ? '#f59e0b' : '#10b981';

  return (
    <div className="dash-class-item">
      <div className="dash-class-time">
        <span className="dash-class-time-start">{cls.start_time}</span>
        <span className="dash-class-time-end">{cls.end_time}</span>
      </div>
      <div className="dash-class-body">
        <div className="dash-class-name">{cls.name}</div>
        <div className="dash-class-meta">
          <span>{cls.trainer_name}</span>
          <span className="dash-class-sep">·</span>
          <span>{cls.room || 'Main Studio'}</span>
        </div>
        <div className="dash-class-capacity-bar">
          <div
            className="dash-class-capacity-fill"
            style={{ width: `${fillPct}%`, background: fillColor }}
          />
        </div>
        <div className="dash-class-capacity-label">
          {cls.booking_count}/{cls.capacity} booked
          {cls.is_full && <span className="dash-class-full-badge"> Full</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoleDashboard({ onNavigate }) {
  const { hasRole, primaryRole } = useAuth();
  const [activeTab, setActiveTab] = useState('finance');

  const isOwner = hasRole('owner');
  const isAdmin = hasRole('admin');

  // ── Operational Metrics ───────────────────────────────────────────────────
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeSubscriptions: 0,
    totalTrainers: 0,
    todayCheckIns: 0,
    upcomingClasses: 0,
    monthRevenue: 0,
    monthExpenses: 0,
    expiringMemberships: 0,
    signupsLast30Days: 0,
    currentlyInside: 0,
    capacityLimit: 100,
    isLoading: true,
  });

  // Real trend values from monthly-summary endpoint
  const [trends, setTrends] = useState({
    revenue: null,
    expenses: null,
    checkIns: null,
    signups: null,
    isLoading: true,
  });

  // Real monthly chart series from API
  const [monthlyData, setMonthlyData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  const [trainersList, setTrainersList] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activityNotifications, setActivityNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);

  // Today's activities for the feed
  const [todayActivities, setTodayActivities] = useState([]);
  // Today's classes for schedule widget
  const [todayClasses, setTodayClasses] = useState([]);

  const alertsList = safeArray(alerts);
  const activityList = safeArray(activityNotifications);
  const systemList = safeArray(systemNotifications);
  const suspendedAlerts = alertsList.filter((a) => a && a.type === 'suspended');
  const expiredAlerts = alertsList.filter((a) => a && a.type === 'expired');

  // ── Seen Urgent Alert Tracking ────────────────────────────────────────────
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

  useEffect(() => {
    if (unseenIdsRef.current.length > 0) {
      const timer = setTimeout(() => {
        try {
          const stored = new Set(JSON.parse(localStorage.getItem('tigat_seen_urgent_ids') || '[]'));
          unseenIdsRef.current.forEach((id) => stored.add(id));
          localStorage.setItem('tigat_seen_urgent_ids', JSON.stringify([...stored]));
        } catch { /* ignore */ }
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
        } catch { /* ignore */ }
      }
    };
  }, []);

  // ── Default Trainers Backfill ─────────────────────────────────────────────
  const defaultTrainers = [
    { id: 1, name: 'Zelalem Bekele', specialization: 'Strength & Conditioning', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', initials: 'ZB', status: 'Active', rating: '4.9' },
    { id: 2, name: 'Biniyam Amir', specialization: 'Hypertrophy & Physique', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', initials: 'BA', status: 'Active', rating: '5.0' },
    { id: 3, name: 'Kalkidan Ashenafi', specialization: 'High Intensity & HIIT', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', initials: 'KA', status: 'Active', rating: '4.8' },
    { id: 4, name: 'Fitsum Abel', specialization: 'Mobility & Rehab', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', initials: 'FA', status: 'Active', rating: '4.9' },
  ];

  // ── Main Data Fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (primaryRole === 'receptionist') return;

    let ignore = false;

    const fetchAllData = () => {
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

        if (rec?.membership_alerts) setAlerts(safeArray(rec.membership_alerts));
        if (rec?.activity_notifications) setActivityNotifications(safeArray(rec.activity_notifications));
        if (rec?.notifications) setSystemNotifications(safeArray(rec.notifications));
        if (rec?.today_activities) setTodayActivities(safeArray(rec.today_activities));
        if (rec?.today_classes) setTodayClasses(safeArray(rec.today_classes));

        setMetrics((prev) => ({
          ...prev,
          totalMembers: rec?.stats?.active_members ?? (mem?.total || prev.totalMembers),
          activeSubscriptions: sub?.total || prev.activeSubscriptions,
          totalTrainers: Array.isArray(trainers) ? trainers.length : prev.totalTrainers,
          todayCheckIns: rec?.stats?.today_check_ins ?? prev.todayCheckIns,
          upcomingClasses: rec?.stats?.upcoming_classes ?? (Array.isArray(rec?.today_classes) ? rec.today_classes.length : prev.upcomingClasses),
          monthRevenue: rec?.stats?.revenue_this_month ?? (pay?.month_revenue || pay?.total_revenue || prev.monthRevenue),
          monthExpenses: pay?.month_expenses || prev.monthExpenses,
          expiringMemberships: rec?.stats?.expiring_memberships ?? prev.expiringMemberships,
          signupsLast30Days: rec?.stats?.signups_last_30_days ?? prev.signupsLast30Days,
          currentlyInside: rec?.stats?.currently_inside ?? prev.currentlyInside,
          capacityLimit: rec?.stats?.capacity_limit ?? prev.capacityLimit,
          isLoading: false,
        }));
      }).catch(() => {
        if (!ignore) setMetrics((prev) => ({ ...prev, isLoading: false }));
      });
    };

    fetchAllData();
    const intervalId = setInterval(fetchAllData, 15000);
    const handleFocus = () => fetchAllData();
    window.addEventListener('gymcore:refresh', fetchAllData);
    window.addEventListener('focus', handleFocus);
    return () => {
      ignore = true;
      clearInterval(intervalId);
      window.removeEventListener('gymcore:refresh', fetchAllData);
      window.removeEventListener('focus', handleFocus);
    };
  }, [primaryRole]);

  // ── Monthly Summary (chart + trends) ─────────────────────────────────────
  useEffect(() => {
    if (primaryRole === 'receptionist') return;
    let ignore = false;

    const fetchMonthlySummary = () => {
      setChartLoading(true);
      apiClient.getPaymentMonthlySummary()
        .then((res) => {
          if (ignore) return;
          const data = res?.data || res || {};
          if (Array.isArray(data.series) && data.series.length > 0) {
            setMonthlyData(data.series);
          }
          if (data.trends) {
            setTrends({
              revenue: data.trends.revenue_vs_last_month ?? null,
              expenses: data.trends.expenses_vs_last_month ?? null,
              checkIns: data.trends.checkins_vs_yesterday ?? null,
              signups: data.trends.signups_vs_prior_30d ?? null,
              isLoading: false,
            });
          }
          setChartLoading(false);
        })
        .catch(() => {
          if (!ignore) {
            setTrends((prev) => ({ ...prev, isLoading: false }));
            setChartLoading(false);
          }
        });
    };

    fetchMonthlySummary();
    return () => { ignore = true; };
  }, [primaryRole]);

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  ];

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
    if (mappedReal.length >= 4) return mappedReal.slice(0, 4);
    const needed = 4 - mappedReal.length;
    const realNames = new Set(mappedReal.map((m) => (m.name || '').toLowerCase()));
    const backfill = defaultTrainers
      .filter((d) => !realNames.has((d.name || '').toLowerCase()))
      .slice(0, needed)
      .map((d, idx) => ({ ...d, avatar: d.avatar || defaultAvatars[(mappedReal.length + idx) % defaultAvatars.length], active_clients: 12 + idx * 3 }));
    return [...mappedReal, ...backfill];
  })();

  // Computed profit
  const netProfit = Number(metrics.monthRevenue || 0) - Number(metrics.monthExpenses || 0);
  const isProfit = netProfit >= 0;

  // Occupancy percentage
  const occupancyPct = metrics.capacityLimit > 0
    ? Math.min(100, Math.round((metrics.currentlyInside / metrics.capacityLimit) * 100))
    : 0;
  const occupancyColor = occupancyPct >= 80 ? '#ef4444' : occupancyPct >= 60 ? '#f59e0b' : '#10b981';

  // Chart scale
  const maxChartVal = monthlyData.length > 0
    ? Math.max(...monthlyData.map((d) => Math.max(d.rev, d.exp)), 1)
    : 1600;

  // Receptionist view
  if (primaryRole === 'receptionist') {
    return <ReceptionDashboard onNavigate={onNavigate} />;
  }

  return (
    <div className="iron-dashboard-wrapper">

      {/* ── Tabs (Owner only: Revenue & Analytics / Audit Trail) ── */}
      {isOwner && (
        <div className="iron-dashboard-subtabs">
          <button type="button" className={`subtab-pill ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>
            <ChartIcon size={16} /><span>Revenue & Analytics</span>
          </button>
          <button type="button" className={`subtab-pill ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
            <ShieldIcon size={16} /><span>Audit Trail</span>
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FINANCE & ANALYTICS TAB
         ══════════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'finance' || (!isOwner && !isAdmin)) && (
        <>
          {/* Header Banner */}
          <div className="reception-header-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 className="reception-welcome-title" style={{ margin: 0 }}>Gym Operations & Performance Overview</h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                  Live Updates Active
                </span>
              </div>
              <p className="reception-welcome-desc" style={{ marginTop: 4 }}>
                Real-time operational metrics, turnstile attendance, and gym performance.
              </p>
            </div>
            <div className="clean-dash-actions">
              <button type="button" className="btn-clean-schedule" onClick={() => onNavigate && onNavigate('classes', { openSchedule: true })} title="Schedule a group fitness class">
                <CalendarIcon size={15} /><span>Schedule Class</span>
              </button>
              <button type="button" className="btn-clean-add-member" onClick={() => onNavigate && onNavigate('members', { openRegister: true })} title="Register new gym member">
                <UserPlusIcon size={15} /><span>+ Add New Member</span>
              </button>
            </div>
          </div>

          {/* ── Urgent Alerts ── */}
          {(() => {
            const totalFeedCount = activityList.length + alertsList.length + systemList.length;
            if (unseenUrgentAlerts.length === 0) {
              return (
                <div className="urgent-allclear-strip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircleIcon size={20} />
                    <div>
                      <div className="urgent-allclear-title">Security & Turnstile Access: All Normal</div>
                      <div className="urgent-allclear-desc">0 active turnstile denials, 0 account suspensions, and no critical operational blocks.</div>
                    </div>
                  </div>
                  <button type="button" className="urgent-alerts-viewall-btn" onClick={() => onNavigate && onNavigate('notifications')}>
                    <span>Notification Feed ({totalFeedCount})</span><ArrowUpRightIcon size={13} />
                  </button>
                </div>
              );
            }
            return (
              <div className="urgent-alerts-container">
                <div className="urgent-alerts-panel">
                  <div className="urgent-alerts-topbar">
                    <div className="urgent-alerts-title-wrap">
                      <div className="urgent-alert-icon-pulse"><AlertTriangleIcon size={18} /></div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <h3 className="urgent-alerts-heading">Urgent Security & Operational Alerts</h3>
                          <span className="urgent-badge danger">{unseenUrgentAlerts.length} Action Needed</span>
                        </div>
                        <p className="urgent-alerts-subtext">Critical turnstile access blocks, suspended accounts, and expired passes requiring staff action.</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="urgent-markall-btn" onClick={() => markAllUrgentAsSeen(unseenUrgentAlerts.map((a) => a.id))}>
                        <CheckIcon size={13} /><span>Mark All as Seen</span>
                      </button>
                      <button type="button" className="urgent-alerts-viewall-btn" onClick={() => onNavigate && onNavigate('notifications')}>
                        <span>Full Notification Feed ({totalFeedCount})</span><ArrowUpRightIcon size={13} />
                      </button>
                    </div>
                  </div>
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
                          <button type="button" className={`urgent-action-btn ${item.severity}`} onClick={() => { markUrgentAsSeen(item.id); if (item.view && onNavigate) onNavigate(item.view); }}>
                            {item.actionText} →
                          </button>
                          <button type="button" className="urgent-dismiss-btn" onClick={() => markUrgentAsSeen(item.id)} aria-label="Dismiss alert">
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

          {/* ── KPI Cards Row 1: Core Metrics ── */}
          <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>

            {/* Card 1: Total Active Members */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Total Active Members</span>
                <div className="clean-kpi-icon"><UsersIcon size={16} /></div>
              </div>
              <div className="kpi-value">{metrics.totalMembers ?? 0}</div>
              <TrendBadge value={trends.signups} suffix="% sign-ups vs prior 30d" zeroLabel="Stable growth" />
            </div>

            {/* Card 2: Checked-In Today */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Checked-In Today</span>
                <div className="clean-kpi-icon"><CheckCircleIcon size={16} /></div>
              </div>
              <div className="kpi-value">{metrics.todayCheckIns ?? 0}</div>
              <TrendBadge value={trends.checkIns} suffix="% vs yesterday" zeroLabel="Same as yesterday" />
            </div>

            {/* Card 3: Upcoming Classes */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Upcoming Classes</span>
                <div className="clean-kpi-icon"><CalendarIcon size={16} /></div>
              </div>
              <div className="kpi-value">{metrics.upcomingClasses ?? 0}</div>
              <span className="kpi-trend" style={{ color: '#94a3b8', fontSize: 12 }}>Scheduled today</span>
            </div>

            {/* Card 4: Revenue This Month */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Revenue This Month</span>
                <div className="clean-kpi-icon"><CreditCardIcon size={16} /></div>
              </div>
              <div className="kpi-value">{Number(metrics.monthRevenue || 0).toLocaleString()} ETB</div>
              <TrendBadge value={trends.revenue} suffix="% vs last month" zeroLabel="Same as last month" />
            </div>
          </section>

          {/* ── KPI Cards Row 2: Business Health ── */}
          <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>

            {/* Card 5: Net Profit */}
            <div className="clean-kpi-card" style={{ borderLeft: `3px solid ${isProfit ? '#10b981' : '#ef4444'}` }}>
              <div className="clean-kpi-top">
                <span className="kpi-label">Net Profit This Month</span>
                <div className="clean-kpi-icon" style={{ background: isProfit ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isProfit ? '#10b981' : '#ef4444' }}>
                  <ProfitIcon size={16} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: isProfit ? '#10b981' : '#ef4444' }}>
                {isProfit ? '+' : '-'}{Math.abs(netProfit).toLocaleString()} ETB
              </div>
              <span className="kpi-trend" style={{ color: '#94a3b8', fontSize: 12 }}>
                Revenue {Number(metrics.monthRevenue || 0).toLocaleString()} − Expenses {Number(metrics.monthExpenses || 0).toLocaleString()}
              </span>
            </div>

            {/* Card 6: Expiring Memberships */}
            <div className="clean-kpi-card" style={{ borderLeft: metrics.expiringMemberships > 0 ? '3px solid #f59e0b' : undefined }}>
              <div className="clean-kpi-top">
                <span className="kpi-label">Expiring in 7 Days</span>
                <div className="clean-kpi-icon" style={metrics.expiringMemberships > 0 ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' } : {}}>
                  <WarningClockIcon size={16} />
                </div>
              </div>
              <div className="kpi-value" style={metrics.expiringMemberships > 0 ? { color: '#f59e0b' } : {}}>
                {metrics.expiringMemberships ?? 0}
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('memberships')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: metrics.expiringMemberships > 0 ? '#f59e0b' : '#94a3b8' }}
              >
                <span>{metrics.expiringMemberships > 0 ? 'View expiring' : 'All memberships current'}</span>
                {metrics.expiringMemberships > 0 && <ArrowUpRightIcon size={11} />}
              </button>
            </div>

            {/* Card 7: New Sign-ups */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">New Sign-ups (30d)</span>
                <div className="clean-kpi-icon"><UserCheckIcon size={16} /></div>
              </div>
              <div className="kpi-value">{metrics.signupsLast30Days ?? 0}</div>
              <TrendBadge value={trends.signups} suffix="% vs prior 30 days" zeroLabel="Stable" />
            </div>
          </section>

          {/* ── Live Occupancy Bar ── */}
          <div className="iron-card-panel" style={{ marginBottom: 24, padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h3 className="panel-title" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Live Floor Occupancy</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Members currently inside the gym floor right now</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: occupancyColor }}>
                  {metrics.currentlyInside}
                </span>
                <span style={{ fontSize: 14, color: '#94a3b8' }}>/ {metrics.capacityLimit} capacity</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: occupancyPct >= 80 ? 'rgba(239,68,68,0.12)' : occupancyPct >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                  color: occupancyColor,
                  border: `1px solid ${occupancyColor}30`,
                }}>
                  {occupancyPct}%
                </span>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 999, height: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${occupancyPct}%`,
                  background: occupancyPct >= 80
                    ? 'linear-gradient(90deg, #ef4444, #f87171)'
                    : occupancyPct >= 60
                    ? 'linear-gradient(90deg, #f59e0b, #fcd34d)'
                    : 'linear-gradient(90deg, #10b981, #34d399)',
                  borderRadius: 999,
                  transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>0</span>
              <span style={{ fontSize: 11, color: occupancyPct >= 80 ? '#ef4444' : '#94a3b8' }}>
                {occupancyPct >= 80 ? 'Near capacity — monitor admissions' : occupancyPct >= 60 ? 'Moderate — approaching busy' : 'Low traffic'}
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{metrics.capacityLimit}</span>
            </div>
          </div>

          {/* ── Revenue Analytics Chart (real data) + Today's Schedule (side by side) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24, alignItems: 'start' }}>

            {/* Revenue Chart */}
            <div className="iron-card-panel iron-revenue-panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Revenue & Expense Analytics</h3>
                  <span className="panel-subtitle">
                    {chartLoading ? 'Loading...' : monthlyData.length > 0 ? `${monthlyData[0]?.month} – ${monthlyData[monthlyData.length - 1]?.month} (ETB)` : 'Last 8 months (ETB)'}
                  </span>
                </div>
                <div className="chart-legend">
                  <span className="legend-item"><span className="legend-dot dot-orange"></span><span>Revenue</span></span>
                  <span className="legend-item"><span className="legend-dot dot-grey"></span><span>Expense</span></span>
                </div>
              </div>

              {chartLoading ? (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Loading chart data...
                </div>
              ) : (
                <div className="revenue-chart-container">
                  <div className="chart-y-axis">
                    {[1.0, 0.75, 0.5, 0.25, 0].map((pct, i) => (
                      <span key={i}>{Math.round(maxChartVal * pct).toLocaleString()}</span>
                    ))}
                  </div>
                  <div className="chart-bars-wrap">
                    <div className="chart-gridlines" aria-hidden="true">
                      <div className="gridline"></div><div className="gridline"></div>
                      <div className="gridline"></div><div className="gridline"></div>
                      <div className="gridline"></div>
                    </div>
                    <div className="chart-columns-flex">
                      {(monthlyData.length > 0 ? monthlyData : Array(8).fill({ month: '—', rev: 0, exp: 0 })).map((item, idx) => {
                        const revHeight = maxChartVal > 0 ? (item.rev / maxChartVal) * 100 : 0;
                        const expHeight = maxChartVal > 0 ? (item.exp / maxChartVal) * 100 : 0;
                        return (
                          <div key={item.month || idx} className="monthly-column-group">
                            <div className="bars-pair">
                              <div className="bar bar-revenue" style={{ height: `${revHeight}%` }} title={`Revenue: ${Number(item.rev).toLocaleString()} ETB`}></div>
                              <div className="bar bar-expense" style={{ height: `${expHeight}%` }} title={`Expense: ${Number(item.exp).toLocaleString()} ETB`}></div>
                            </div>
                            <span className="month-label">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Today's Class Schedule */}
            <div className="iron-card-panel" style={{ padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 className="panel-title" style={{ margin: 0, fontSize: 15 }}>Today's Classes</h3>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Live booking status</span>
                </div>
                <button
                  type="button"
                  className="view-all-link-btn"
                  onClick={() => onNavigate && onNavigate('classes')}
                  style={{ fontSize: 12 }}
                >
                  <span>All Classes</span><ArrowUpRightIcon size={12} />
                </button>
              </div>

              {todayClasses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 13 }}>
                  <CalendarIcon size={28} />
                  <div style={{ marginTop: 8 }}>No classes scheduled today</div>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('classes', { openSchedule: true })}
                    style={{ marginTop: 10, background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', color: '#f59e0b' }}
                  >
                    + Schedule a class
                  </button>
                </div>
              ) : (
                <div className="dash-class-list">
                  {todayClasses.map((cls) => (
                    <ClassScheduleItem key={cls.id} cls={cls} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Recent Activity Feed ── */}
          <div className="iron-card-panel" style={{ marginBottom: 28, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 className="panel-title" style={{ margin: 0, fontSize: 15 }}>Today's Activity Feed</h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Check-ins, registrations, and payments — chronological</span>
              </div>
              <button type="button" className="view-all-link-btn" onClick={() => onNavigate && onNavigate('notifications')} style={{ fontSize: 12 }}>
                <span>Full Feed</span><ArrowUpRightIcon size={12} />
              </button>
            </div>

            {todayActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>
                <ActivityIcon size={26} />
                <div style={{ marginTop: 8 }}>No activity recorded yet today</div>
              </div>
            ) : (
              <div className="dash-activity-list">
                {todayActivities.slice(0, 8).map((item, idx) => (
                  <ActivityFeedItem key={item.id || `act_${idx}`} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* ── Featured Coaches ── */}
          <div className="iron-trainers-section">
            <div className="trainers-section-header">
              <div>
                <h3 className="section-heading">Featured Personal Trainers</h3>
                <p className="section-subheading">Certified fitness coaches, specialist trainers, and PT bookings</p>
              </div>
              <button type="button" className="view-all-link-btn" onClick={() => onNavigate && onNavigate('trainers')}>
                <span>View All Coaches</span><ArrowUpRightIcon size={14} />
              </button>
            </div>

            <div className="iron-trainers-row">
              {displayTrainers.map((coach, idx) => {
                const initial = (coach.name || 'C').charAt(0).toUpperCase();
                return (
                  <div key={coach.id || idx} className="iron-coach-card">
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
                      <div className="coach-photo-top-bar">
                        <span className="coach-status-pill">
                          <span className="coach-status-dot pulse"></span><span>Active</span>
                        </span>
                        <span className="coach-rating-pill">
                          <span style={{ color: '#f59e0b' }}>★</span><span>{coach.rating || '4.9'}</span>
                        </span>
                      </div>
                      <div className="coach-photo-scrim">
                        <span className="coach-specialty-badge">{coach.specialization || 'Strength & Conditioning'}</span>
                      </div>
                    </div>
                    <div className="coach-info-body">
                      <div className="coach-name-row">
                        <h4 className="coach-full-name">{coach.name}</h4>
                        <span className="coach-verified-icon" title="Certified Personal Trainer">✓</span>
                      </div>
                      <div className="coach-meta-stats">
                        <span className="coach-meta-item"><UsersIcon size={12} /><span>{coach.active_clients || 14} Clients</span></span>
                        <span className="coach-meta-divider">•</span>
                        <span className="coach-meta-item"><span>{coach.status || 'Full-Time'}</span></span>
                      </div>
                    </div>
                    <div className="coach-actions-bar">
                      <button type="button" className="coach-book-btn" onClick={() => onNavigate && onNavigate('trainers')} title="Book Personal Training Session">
                        <ClockIcon size={14} /><span>Book PT</span>
                      </button>
                      <button type="button" className="coach-consult-btn" onClick={() => onNavigate && onNavigate('trainers')} title="Direct Consultation">
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

      {/* ── Audit Trail Tab ── */}
      {activeTab === 'audit' && isOwner && (
        <div className="subtab-pane">
          <AuditLogViewer />
        </div>
      )}
    </div>
  );
}
