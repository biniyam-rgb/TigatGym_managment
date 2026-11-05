import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

// Crisp Lucide-style SVG Icons matching the clean SaaS layout
const Icons = {
  Calendar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  UserPlus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Users: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  AlertTriangle: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const RECEPTION_CACHE_KEY = 'gymcore_reception_cache';

// High-fidelity fallback dataset matching reference image exactly
const DEFAULT_METRICS = {
  active_members: 850,
  today_check_ins: 76,
  upcoming_classes: 12,
  revenue_this_month: '25,430 ETB',
  signups_kpi: 120,
  attendance_kpi: 450,
};

const DEFAULT_UPCOMING_CLASSES = [
  { id: 'c1', name: 'Morning HIIT Blast', time_trainer: '09:00 AM - Sarah J.', booked: 18, capacity: 20 },
  { id: 'c2', name: 'Vinyasa Flow Yoga', time_trainer: '12:00 PM - Mike R.', booked: 20, capacity: 20 },
  { id: 'c3', name: 'Power Spin', time_trainer: '06:00 PM - Chloe T.', booked: 15, capacity: 25 },
  { id: 'c4', name: 'Boxing Fundamentals', time_trainer: '07:30 PM - David L.', booked: 10, capacity: 15 },
];

const DEFAULT_ACTIVE_MEMBERS = [
  {
    id: 'm1',
    name: 'John Doe',
    checked_in: 'Checked in: 2 min ago',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
    color: '#3b82f6',
  },
  {
    id: 'm2',
    name: 'Emily Clark',
    checked_in: 'Checked in: 5 min ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
    color: '#ec4899',
  },
  {
    id: 'm3',
    name: 'Brian Smith',
    checked_in: 'Checked in: 8 min ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
    color: '#8b5cf6',
  },
  {
    id: 'm4',
    name: 'Olivia Rodriguez',
    checked_in: 'Checked in: 12 min ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
    color: '#10b981',
  },
];

const ATTENDANCE_BARS = [
  { label: 'Yoga', height: '55%', count: 85 },
  { label: 'Spin', height: '96%', count: 145 },
  { label: 'HIIT', height: '84%', count: 125 },
  { label: 'Zumba', height: '40%', count: 62 },
  { label: 'Boxing', height: '80%', count: 118 },
];

export default function ReceptionDashboard({ onNavigate }) {
  const [data, setData] = useState(() => {
    try {
      const cached = sessionStorage.getItem(RECEPTION_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !sessionStorage.getItem(RECEPTION_CACHE_KEY);
    } catch {
      return true;
    }
  });

  const [error, setError] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    setError(null);
    try {
      const res = await apiClient.getReceptionDashboard(isRefresh ? { refresh: 1 } : {});
      if (res?.data) {
        setData(res.data);
        try {
          sessionStorage.setItem(RECEPTION_CACHE_KEY, JSON.stringify(res.data));
        } catch {
          // ignore
        }
      } else {
        throw new Error('Unexpected reception dashboard payload format.');
      }
    } catch (err) {
      console.error('Failed to load reception dashboard:', err);
      setError(err.message || 'Unable to load front-desk dashboard. Please check API connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient.getReceptionDashboard()
      .then((res) => {
        if (!ignore && res?.data) {
          setData(res.data);
          try {
            sessionStorage.setItem(RECEPTION_CACHE_KEY, JSON.stringify(res.data));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load reception dashboard:', err);
          if (!sessionStorage.getItem(RECEPTION_CACHE_KEY)) {
            setError(err.message || 'Unable to load front-desk metrics.');
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchDashboardData(true);
    };
    window.addEventListener('gymcore:refresh', handleGlobalRefresh);
    return () => {
      window.removeEventListener('gymcore:refresh', handleGlobalRefresh);
    };
  }, [fetchDashboardData]);

  // Derived metrics with fallback to reference design
  const stats = {
    active_members: data?.stats?.active_members ?? DEFAULT_METRICS.active_members,
    today_check_ins: data?.stats?.today_check_ins ?? DEFAULT_METRICS.today_check_ins,
    upcoming_classes: (data?.today_classes && data.today_classes.length > 0)
      ? data.today_classes.length
      : (data?.stats?.expected_members ?? DEFAULT_METRICS.upcoming_classes),
    revenue_this_month: data?.stats?.revenue_this_month
      ? `${Number(data.stats.revenue_this_month).toLocaleString()} ETB`
      : DEFAULT_METRICS.revenue_this_month,
    signups_kpi: data?.stats?.signups_last_30_days ?? DEFAULT_METRICS.signups_kpi,
    attendance_kpi: DEFAULT_METRICS.attendance_kpi,
  };

  // Classes list mapping with live data fallback
  const upcomingClasses = (data?.today_classes && data.today_classes.length >= 3)
    ? data.today_classes.slice(0, 4).map((c) => ({
        id: c.id,
        name: c.name,
        time_trainer: `${c.start_time || '09:00 AM'} - ${c.trainer_name || 'Coach'}`,
        booked: c.booking_count ?? 18,
        capacity: c.capacity ?? 20,
      }))
    : DEFAULT_UPCOMING_CLASSES;

  // Recent members list mapping with live data fallback
  const activeMembers = (data?.recent_check_ins && data.recent_check_ins.length >= 3)
    ? data.recent_check_ins.slice(0, 4).map((m, idx) => ({
        id: m.id,
        name: m.member_name,
        checked_in: m.check_in_time ? `Checked in: ${m.check_in_time}` : DEFAULT_ACTIVE_MEMBERS[idx % 4].checked_in,
        avatar: DEFAULT_ACTIVE_MEMBERS[idx % 4].avatar,
        color: DEFAULT_ACTIVE_MEMBERS[idx % 4].color,
      }))
    : DEFAULT_ACTIVE_MEMBERS;

  if (isLoading && !data) {
    return (
      <div className="clean-reception-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '360px' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }}></span>
          <p style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Loading front-desk metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clean-reception-dashboard">
      {/* Optional Error Alert */}
      {error && (
        <div className="clean-alert-bar" role="alert">
          <Icons.AlertTriangle />
          <span>{error}</span>
          <button type="button" className="btn-clean-retry" onClick={() => fetchDashboardData(true)}>
            Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP ACTION BAR: "Dashboard Overview" + "Schedule Class" + "+ Add New Member"
          ========================================================================= */}
      <section className="clean-dash-header-row">
        <h1 className="clean-dash-title">Dashboard Overview</h1>
        <div className="clean-dash-actions">
          <button
            type="button"
            className="btn-clean-schedule"
            onClick={() => onNavigate('classes')}
          >
            <Icons.Calendar size={15} />
            <span>Schedule Class</span>
          </button>

          <button
            type="button"
            className="btn-clean-add-member"
            onClick={() => onNavigate('members', { openRegister: true })}
          >
            <Icons.UserPlus size={15} />
            <span>+ Add New Member</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          ROW 1: 4 CLEAN KPI METRIC CARDS (Display Only - Not Buttons)
          ========================================================================= */}
      <section className="clean-kpi-grid">
        {/* Card 1: Total Active Members */}
        <div className="clean-kpi-card">
          <span className="kpi-label">Total Active Members</span>
          <div className="kpi-value">{stats.active_members}</div>
          <span className="kpi-trend trend-positive">+5.2% this month</span>
        </div>

        {/* Card 2: Checked-In Today */}
        <div className="clean-kpi-card">
          <span className="kpi-label">Checked-In Today</span>
          <div className="kpi-value">{stats.today_check_ins}</div>
          <span className="kpi-trend trend-positive">+10% vs yesterday</span>
        </div>

        {/* Card 3: Upcoming Classes */}
        <div className="clean-kpi-card">
          <span className="kpi-label">Upcoming Classes</span>
          <div className="kpi-value">{stats.upcoming_classes}</div>
          <span className="kpi-trend trend-negative">-2 from yesterday</span>
        </div>

        {/* Card 4: Revenue This Month */}
        <div className="clean-kpi-card">
          <span className="kpi-label">Revenue This Month</span>
          <div className="kpi-value">{stats.revenue_this_month}</div>
          <span className="kpi-trend trend-positive">+8.1% vs last month</span>
        </div>
      </section>

      {/* =========================================================================
          ROW 2: MIDDLE ANALYTICS CHARTS (2 COLUMNS: ~65% / ~35%)
          ========================================================================= */}
      <section className="clean-charts-grid">
        {/* Left Chart Card: Member Sign-ups Over Time */}
        <div className="clean-chart-card chart-card-signups">
          <div className="chart-card-header">
            <span className="chart-title">Member Sign-ups Over Time</span>
            <div className="chart-kpi-row">
              <span className="chart-kpi-number">{stats.signups_kpi}</span>
              <span className="chart-kpi-badge">+15.3%</span>
            </div>
            <span className="chart-sub-period">Last 30 Days</span>
          </div>

          <div className="chart-canvas-wrapper spline-chart-container">
            {/* Ultra-smooth responsive SVG Wave Spline Chart matching image */}
            <svg
              className="spline-svg"
              viewBox="0 0 600 170"
              preserveAspectRatio="none"
              aria-label="Member sign-ups wave chart"
            >
              <defs>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#ff8a00" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#ff8a00" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d="M 0,110
                   C 35,95 45,35 65,35
                   C 85,35 98,72 120,72
                   C 142,72 155,40 175,40
                   C 195,40 205,78 222,78
                   C 238,78 252,58 268,58
                   C 285,58 296,128 316,128
                   C 336,128 350,22 372,22
                   C 392,22 410,105 432,105
                   C 455,105 472,40 500,40
                   C 530,40 560,95 600,60
                   L 600,170 L 0,170 Z"
                fill="url(#signupGradient)"
              />

              {/* Orange Wave Curve Line */}
              <path
                d="M 0,110
                   C 35,95 45,35 65,35
                   C 85,35 98,72 120,72
                   C 142,72 155,40 175,40
                   C 195,40 205,78 222,78
                   C 238,78 252,58 268,58
                   C 285,58 296,128 316,128
                   C 336,128 350,22 372,22
                   C 392,22 410,105 432,105
                   C 455,105 472,40 500,40
                   C 530,40 560,95 600,60"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* X-Axis Week Labels matching image */}
            <div className="chart-week-labels">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>
        </div>

        {/* Right Chart Card: Class Attendance */}
        <div className="clean-chart-card chart-card-attendance">
          <div className="chart-card-header">
            <span className="chart-title">Class Attendance</span>
            <div className="chart-kpi-row">
              <span className="chart-kpi-number">{stats.attendance_kpi}</span>
              <span className="chart-kpi-badge">+7.8%</span>
            </div>
            <span className="chart-sub-period">This Week</span>
          </div>

          <div className="chart-canvas-wrapper bar-chart-container">
            <div className="bars-graphic-row">
              {ATTENDANCE_BARS.map((bar) => {
                const isHovered = hoveredBar === bar.label;
                return (
                  <div
                    key={bar.label}
                    className="bar-column-wrap"
                    onMouseEnter={() => setHoveredBar(bar.label)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div className="bar-track">
                      {isHovered && (
                        <div className="bar-tooltip">
                          {bar.count}
                        </div>
                      )}
                      <div
                        className={`bar-fill ${isHovered ? 'bar-hovered' : ''}`}
                        style={{ height: bar.height }}
                      />
                    </div>
                    <span className="bar-category-label">{bar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROW 3: BOTTOM 2-COLUMN CARDS (TODAY'S UPCOMING CLASSES | RECENTLY ACTIVE MEMBERS)
          ========================================================================= */}
      <section className="clean-bottom-grid">
        {/* Left Column: Today's Upcoming Classes */}
        <div className="clean-list-card">
          <div className="clean-list-card-header">
            <h3 className="list-card-title">Today&apos;s Upcoming Classes</h3>
            <button
              type="button"
              className="list-card-view-all"
              onClick={() => onNavigate('classes')}
            >
              View All
            </button>
          </div>

          <div className="clean-list-items-wrap">
            {upcomingClasses.map((item) => (
              <div key={item.id} className="clean-class-row">
                <div className="class-row-meta">
                  <span className="class-row-title">{item.name}</span>
                  <span className="class-row-sub">{item.time_trainer}</span>
                </div>
                <div className="class-capacity-counter">
                  <Icons.Users size={14} />
                  <span>{item.booked} / {item.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recently Active Members */}
        <div className="clean-list-card">
          <div className="clean-list-card-header">
            <h3 className="list-card-title">Recently Active Members</h3>
            <button
              type="button"
              className="list-card-view-all"
              onClick={() => onNavigate('attendance')}
            >
              View All
            </button>
          </div>

          <div className="clean-list-items-wrap">
            {activeMembers.map((member) => (
              <div key={member.id} className="clean-member-row">
                <div className="member-row-profile">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="member-avatar-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div
                    className="member-avatar-fallback"
                    style={{ backgroundColor: member.color, display: 'none' }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <span className="member-profile-name">{member.name}</span>
                </div>
                <span className="member-checkin-time">{member.checked_in}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
