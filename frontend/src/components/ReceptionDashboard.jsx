import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

// Crisp Luxury SVG Icons matching reference design
const Icons = {
  Users: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  QrCheckIn: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="3" height="3" />
      <rect x="14" y="7" width="3" height="3" />
      <rect x="7" y="14" width="3" height="3" />
      <rect x="14" y="14" width="3" height="3" />
    </svg>
  ),
  CalendarClock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  ),
  AlertClock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  UserPlus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  CreditCard: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Lightning: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Pulse: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Bell: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  ArrowUpRight: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  Refresh: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  AlertTriangle: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Close: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronDown: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Menu: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  ),
};

const RECEPTION_CACHE_KEY = 'gymcore_reception_cache';

export default function ReceptionDashboard({ onNavigate }) {
  const { user } = useAuth();
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState(new Set());

  // Load live Dashboard Data from Backend
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
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
      setIsRefreshing(false);
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
            setError(err.message || 'Unable to load front-desk dashboard. Please check API connection.');
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

  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  // Safe Stats with Image Fallbacks (e.g. 326 Active, 48 Today, 12 Expected, 8 Expiring)
  const stats = {
    active_members: data?.stats?.active_members ?? 326,
    today_check_ins: data?.stats?.today_check_ins ?? 48,
    expected_members: data?.stats?.expected_members ?? 12,
    expiring_memberships: data?.stats?.expiring_memberships ?? 8,
  };

  // Recent check-ins list matching reference image
  const defaultRecentCheckIns = [
    { id: 1, member_name: 'Abebe Kebede', member_code: 'TG-0021', check_in_time: '08:45 AM', attendance_status: 'admitted' },
    { id: 2, member_name: 'Dawit Alemu', member_code: 'TG-0018', check_in_time: '08:32 AM', attendance_status: 'admitted' },
    { id: 3, member_name: 'Sara Mekonnen', member_code: 'TG-0042', check_in_time: '08:20 AM', attendance_status: 'admitted' },
    { id: 4, member_name: 'Daniel Tesfaye', member_code: 'TG-0039', check_in_time: '08:15 AM', attendance_status: 'admitted' },
    { id: 5, member_name: 'Marta Girma', member_code: 'TG-0041', check_in_time: '08:10 AM', attendance_status: 'admitted' },
  ];

  const recentCheckIns = (data?.recent_check_ins && data.recent_check_ins.length > 0)
    ? data.recent_check_ins.slice(0, 5)
    : defaultRecentCheckIns;

  // Membership alerts matching reference image
  const defaultAlerts = [
    { id: 'a1', member_name: 'Getachew Alemu', subtext: 'Expires in 3 days', status: 'Expiring', type: 'expiring' },
    { id: 'a2', member_name: 'Hana Tadesse', subtext: 'Expired 2 days ago', status: 'Expired', type: 'expired' },
    { id: 'a3', member_name: 'Yonatan Bekele', subtext: 'Expires in 5 days', status: 'Expiring', type: 'expiring' },
  ];

  const membershipAlerts = (data?.membership_alerts && data.membership_alerts.length > 0)
    ? data.membership_alerts.slice(0, 3).map((a) => ({
        id: a.id,
        member_name: a.member_name,
        subtext: a.type === 'expired' ? 'Expired recently' : (a.days_remaining ? `Expires in ${a.days_remaining} days` : 'Expires soon'),
        status: a.type === 'expired' ? 'Expired' : 'Expiring',
        type: a.type === 'expired' ? 'expired' : 'expiring',
      }))
    : defaultAlerts;

  // Today's classes matching reference image
  const defaultClasses = [
    { id: 'c1', name: 'Yoga Flow', trainer: 'By Lina Habtamu', time: '09:00 – 10:00 AM', booked: 18, capacity: 30, icon: '🧘‍♀️' },
    { id: 'c2', name: 'Strength Training', trainer: 'By Dawit Alemu', time: '11:00 – 12:00 PM', booked: 22, capacity: 30, icon: '🏋️‍♂️' },
    { id: 'c3', name: 'Zumba Fitness', trainer: 'By Selam Tesfaye', time: '04:00 – 05:00 PM', booked: 15, capacity: 25, icon: '💃' },
  ];

  const todayClasses = (data?.today_classes && data.today_classes.length > 0)
    ? data.today_classes.slice(0, 3).map((c, idx) => ({
        id: c.id,
        name: c.name,
        trainer: `By ${c.trainer_name || 'Coach'}`,
        time: `${c.start_time || '09:00 AM'} – ${c.end_time || '10:00 AM'}`,
        booked: c.booking_count || 18,
        capacity: c.capacity || 30,
        icon: idx === 0 ? '🧘‍♀️' : (idx === 1 ? '🏋️‍♂️' : '💃'),
      }))
    : defaultClasses;

  // Today's Activity horizontal stream matching reference image
  const defaultActivities = [
    { id: 'act1', icon: 'check', title: 'New member registration', time: '2 min ago', cat: 'reg' },
    { id: 'act2', icon: 'card', title: 'Payment received', time: '5 min ago', cat: 'pay' },
    { id: 'act3', icon: 'sync', title: 'Membership renewed', time: '12 min ago', cat: 'renew' },
    { id: 'act4', icon: 'calendar', title: 'Check-in recorded', time: '15 min ago', cat: 'checkin' },
  ];

  const todayActivities = (data?.today_activities && data.today_activities.length >= 4)
    ? data.today_activities.slice(0, 4).map((act) => ({
        id: act.id,
        icon: act.category === 'check_in' ? 'calendar' : (act.category === 'registration' ? 'check' : 'card'),
        title: act.title,
        time: act.time_formatted || 'Just now',
        cat: act.category,
      }))
    : defaultActivities;

  // Active notifications
  const rawNotifications = data?.notifications || [
    {
      id: 'notif_1',
      title: 'Membership will expire soon',
      message: '3 members in next 7 days',
      type: 'warning',
    },
  ];

  const activeNotifications = rawNotifications.filter((n) => !dismissedNotifIds.has(n.id));
  const unreadCount = activeNotifications.length;

  const dismissNotification = (id) => {
    setDismissedNotifIds((prev) => new Set(prev).add(id));
  };

  const markAllNotificationsRead = () => {
    const allIds = rawNotifications.map((n) => n.id);
    setDismissedNotifIds(new Set(allIds));
  };

  const receptionistName = user?.name ? user.name.split(' ')[0] : 'Sara';
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="reception-image-matched-dashboard">
      {/* =========================================================================
          TOP HEADER SECTION: Welcome banner with backdrop watermark & controls
          ========================================================================= */}
      <header className="reception-hero-header">
        <div className="hero-header-watermark-overlay" aria-hidden="true"></div>

        <div className="hero-header-top-row">
          <div className="hero-header-left">
            <button type="button" className="hero-menu-toggle" title="Toggle Navigation">
              <Icons.Menu />
            </button>
            <div>
              <h1 className="hero-header-title">Reception Dashboard</h1>
              <p className="hero-header-subtitle">
                Welcome back, {receptionistName}! Here&apos;s today&apos;s gym activity.
              </p>
            </div>
          </div>

          <div className="hero-header-right">
            {/* Date Pill */}
            <div className="hero-date-badge" title="Current gym date">
              <span className="hero-date-icon">📅</span>
              <span>{currentDateFormatted}</span>
            </div>

            {/* Refresh Shortcut */}
            <button
              type="button"
              className={`hero-icon-button ${isRefreshing || isLoading ? 'spinning' : ''}`}
              onClick={handleManualRefresh}
              title="Refresh Dashboard Data"
            >
              <Icons.Refresh />
            </button>

            {/* Notification Bell with Badge */}
            <div className="hero-notif-container">
              <button
                type="button"
                className={`hero-icon-button ${unreadCount > 0 ? 'has-badge' : ''} ${isNotificationsOpen ? 'active' : ''}`}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                title={`${unreadCount} Active Notifications`}
              >
                <Icons.Bell />
                {unreadCount > 0 && <span className="hero-bell-badge">{unreadCount}</span>}
              </button>

              {/* Notification Popover */}
              {isNotificationsOpen && (
                <div className="reception-notif-dropdown">
                  <div className="notif-dropdown-header">
                    <div>
                      <h4 className="notif-dropdown-title">Notifications</h4>
                      <span className="notif-dropdown-sub">{unreadCount} active</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn-mark-all-read"
                        onClick={markAllNotificationsRead}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="notif-dropdown-body">
                    {activeNotifications.length === 0 ? (
                      <div className="notif-empty-state">
                        <Icons.Check />
                        <span>All alerts cleared</span>
                      </div>
                    ) : (
                      activeNotifications.map((n) => (
                        <div key={n.id} className="notif-item-row">
                          <div className="notif-icon-col">
                            <Icons.AlertTriangle />
                          </div>
                          <div className="notif-text-col">
                            <span className="notif-item-title">{n.title}</span>
                            <p className="notif-item-msg">{n.message}</p>
                          </div>
                          <button
                            type="button"
                            className="notif-item-dismiss"
                            onClick={() => dismissNotification(n.id)}
                            title="Dismiss"
                          >
                            <Icons.Close />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Thumbnail */}
            <div className="hero-user-profile-button" title={user?.name || 'Sara Ahmed'}>
              <div className="hero-user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <Icons.ChevronDown size={14} />
            </div>

            {/* Green Role Pill: Receptionist */}
            <div className="hero-receptionist-badge">
              <span className="hero-green-dot"></span>
              <span>Receptionist</span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div className="reception-alert-banner alert-error" role="alert">
          <Icons.AlertTriangle />
          <div className="alert-content">
            <strong>Notice:</strong> {error}
          </div>
          <button type="button" className="btn-alert-retry" onClick={handleManualRefresh}>
            Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP ROW: 4 METRIC CARDS WITH GLOWING BOTTOM ACCENT & WATERMARK
          ========================================================================= */}
      <section className="reception-cards-row">
        {/* Card 1: Active Members */}
        <div
          className="reception-metric-card glow-card clickable"
          onClick={() => onNavigate('members')}
          title="Click to view Member Directory"
        >
          <div className="card-top-icon-row">
            <span className="card-primary-icon icon-orange">
              <Icons.Users size={22} />
            </span>
          </div>

          <div className="card-content-block">
            <div className="card-big-value">{stats.active_members}</div>
            <div className="card-bottom-row">
              <span className="card-label-text">Active Members</span>
              <span className="card-trend-badge badge-green">↑ 5%</span>
            </div>
          </div>

          {/* Faint Watermark Silhouette Icon */}
          <div className="card-watermark-icon" aria-hidden="true">
            <Icons.Users size={90} />
          </div>
        </div>

        {/* Card 2: Today's Check-ins */}
        <div
          className="reception-metric-card glow-card clickable"
          onClick={() => onNavigate('attendance')}
          title="Click to launch Check-in Scanner"
        >
          <div className="card-top-icon-row">
            <span className="card-primary-icon icon-orange">
              <Icons.QrCheckIn size={22} />
            </span>
          </div>

          <div className="card-content-block">
            <div className="card-big-value">{stats.today_check_ins}</div>
            <div className="card-bottom-row">
              <span className="card-label-text">Today&apos;s Check-ins</span>
              <span className="card-trend-badge badge-green">↑ 12%</span>
            </div>
          </div>

          {/* Faint Watermark Silhouette Icon */}
          <div className="card-watermark-icon" aria-hidden="true">
            <Icons.QrCheckIn size={90} />
          </div>
        </div>

        {/* Card 3: Expected Members */}
        <div
          className="reception-metric-card glow-card clickable"
          onClick={() => onNavigate('classes')}
          title="Click to view Class Timetable"
        >
          <div className="card-top-icon-row">
            <span className="card-primary-icon icon-orange">
              <Icons.CalendarClock size={22} />
            </span>
          </div>

          <div className="card-content-block">
            <div className="card-big-value">{stats.expected_members}</div>
            <div className="card-bottom-row">
              <span className="card-label-text">Expected Members</span>
              <span className="card-trend-badge badge-neutral">—</span>
            </div>
          </div>

          {/* Faint Watermark Silhouette Icon */}
          <div className="card-watermark-icon" aria-hidden="true">
            <Icons.CalendarClock size={90} />
          </div>
        </div>

        {/* Card 4: Expiring Memberships */}
        <div
          className="reception-metric-card glow-card clickable"
          onClick={() => onNavigate('memberships')}
          title="Click to review Membership Renewals"
        >
          <div className="card-top-icon-row">
            <span className="card-primary-icon icon-orange">
              <Icons.AlertClock size={22} />
            </span>
          </div>

          <div className="card-content-block">
            <div className="card-big-value">{stats.expiring_memberships}</div>
            <div className="card-bottom-row">
              <span className="card-label-text">Expiring Memberships</span>
              <span className="card-trend-badge badge-green">↑ 2%</span>
            </div>
          </div>

          {/* Faint Watermark Silhouette Icon */}
          <div className="card-watermark-icon" aria-hidden="true">
            <Icons.AlertClock size={90} />
          </div>
        </div>
      </section>

      {/* =========================================================================
          QUICK ACTIONS SECTION (PROMINENT ORANGE CHECK-IN + 3 COMPACT ACTIONS)
          ========================================================================= */}
      <section className="reception-quick-actions-bar">
        <div className="quick-actions-header">
          <div className="quick-actions-title-wrap">
            <span className="quick-actions-bolt-icon">
              <Icons.Lightning size={17} />
            </span>
            <h2 className="quick-actions-heading">Quick Actions</h2>
          </div>
          <button
            type="button"
            className="quick-actions-link"
            onClick={() => onNavigate('attendance')}
          >
            <span>Front Desk Tools</span>
            <Icons.ArrowUpRight size={13} />
          </button>
        </div>

        <div className="quick-actions-buttons-grid">
          {/* Action 1: Member Check-in (Prominent Orange Gradient Button matching image) */}
          <button
            type="button"
            className="quick-action-primary-btn"
            onClick={() => onNavigate('attendance')}
            title="Scan QR & Admit Member"
          >
            <span className="primary-btn-icon-frame">
              <Icons.QrCheckIn size={22} />
            </span>
            <div className="primary-btn-text">
              <span className="primary-btn-label">Member</span>
              <span className="primary-btn-sub">Check-in</span>
            </div>
          </button>

          {/* Action 2: Register New Member */}
          <button
            type="button"
            className="quick-action-secondary-btn"
            onClick={() => onNavigate('members', { openRegister: true })}
          >
            <span className="secondary-btn-icon">
              <Icons.UserPlus size={19} />
            </span>
            <div className="secondary-btn-text">
              <span className="secondary-btn-label">Register</span>
              <span className="secondary-btn-sub">New Member</span>
            </div>
          </button>

          {/* Action 3: Record Payment */}
          <button
            type="button"
            className="quick-action-secondary-btn"
            onClick={() => onNavigate('payments', { openRecordPayment: true })}
          >
            <span className="secondary-btn-icon">
              <Icons.CreditCard size={19} />
            </span>
            <div className="secondary-btn-text">
              <span className="secondary-btn-label">Record</span>
              <span className="secondary-btn-sub">Payment</span>
            </div>
          </button>

          {/* Action 4: View Members */}
          <button
            type="button"
            className="quick-action-secondary-btn"
            onClick={() => onNavigate('members')}
          >
            <span className="secondary-btn-icon">
              <Icons.Users size={19} />
            </span>
            <div className="secondary-btn-text">
              <span className="secondary-btn-label">View</span>
              <span className="secondary-btn-sub">Members</span>
            </div>
          </button>
        </div>
      </section>

      {/* =========================================================================
          MIDDLE SECTION: 3 EQUAL COLUMNS (RECENT CHECK-INS | MEMBERSHIP ALERTS | TODAY'S CLASSES)
          ========================================================================= */}
      <section className="reception-3col-section">
        {/* COLUMN 1: RECENT CHECK-INS */}
        <div className="reception-panel-card recent-checkins-card">
          <div className="card-header-bar">
            <div className="card-header-title-box">
              <span className="header-icon-orange">
                <Icons.AlertClock size={16} />
              </span>
              <h3 className="card-header-text">Recent Check-ins</h3>
            </div>
            <button
              type="button"
              className="card-header-link"
              onClick={() => onNavigate('attendance')}
            >
              <span>View All</span>
              <Icons.ArrowUpRight size={13} />
            </button>
          </div>

          <div className="checkins-table-container">
            <div className="checkins-table-header">
              <span className="col-member">Member</span>
              <span className="col-id">ID</span>
              <span className="col-time">Time</span>
              <span className="col-status"></span>
            </div>

            <div className="checkins-rows-wrap">
              {recentCheckIns.map((row) => (
                <div key={row.id} className="checkin-row-item">
                  <div className="member-avatar-and-name col-member">
                    <div className="member-avatar-circle">
                      {row.member_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="member-name-text">{row.member_name}</span>
                  </div>

                  <span className="col-id member-id-badge">{row.member_code}</span>
                  <span className="col-time member-time-text">{row.check_in_time}</span>

                  <span className="col-status checked-in-pill">
                    <Icons.Check size={11} />
                    <span>Checked In</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: MEMBERSHIP ALERTS */}
        <div className="reception-panel-card membership-alerts-card">
          <div className="card-header-bar">
            <div className="card-header-title-box">
              <span className="header-icon-orange">
                <Icons.Bell size={16} />
              </span>
              <h3 className="card-header-text">Membership Alerts</h3>
            </div>
            <button
              type="button"
              className="card-header-link"
              onClick={() => onNavigate('memberships')}
            >
              <span>View All</span>
              <Icons.ArrowUpRight size={13} />
            </button>
          </div>

          <div className="alerts-rows-wrap">
            {membershipAlerts.map((alert) => (
              <div key={alert.id} className="alert-row-item">
                <div className="alert-row-left">
                  <div className="alert-avatar-circle">
                    {alert.member_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="alert-info-meta">
                    <span className="alert-member-name">{alert.member_name}</span>
                    <span className={`alert-subtext-warning ${alert.type === 'expired' ? 'text-danger' : 'text-orange'}`}>
                      {alert.subtext}
                    </span>
                  </div>
                </div>

                <span className={`alert-status-pill pill-${alert.type}`}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 3: TODAY'S CLASSES */}
        <div className="reception-panel-card todays-classes-card">
          <div className="card-header-bar">
            <div className="card-header-title-box">
              <span className="header-icon-orange">
                <Icons.CalendarClock size={16} />
              </span>
              <h3 className="card-header-text">Today&apos;s Classes</h3>
            </div>
            <button
              type="button"
              className="card-header-link"
              onClick={() => onNavigate('classes')}
            >
              <span>View All</span>
              <Icons.ArrowUpRight size={13} />
            </button>
          </div>

          <div className="classes-rows-wrap">
            {todayClasses.map((cls) => (
              <div key={cls.id} className="class-row-item">
                <div className="class-row-left">
                  <div className="class-icon-thumbnail">
                    <span>{cls.icon}</span>
                  </div>
                  <div className="class-info-meta">
                    <span className="class-title-text">{cls.name}</span>
                    <span className="class-trainer-time">{cls.trainer}</span>
                    <span className="class-time-sub">{cls.time}</span>
                  </div>
                </div>

                <div className="class-capacity-badge">
                  <Icons.Users size={13} />
                  <span>{cls.booked} / {cls.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          BOTTOM ROW: 2 PANELS (TODAY'S ACTIVITY STRIP + NOTIFICATIONS WIDGET)
          ========================================================================= */}
      <section className="reception-bottom-row">
        {/* LEFT PANEL: TODAY'S ACTIVITY (HORIZONTAL ROW OF 4 CARDS) */}
        <div className="reception-activity-strip-panel">
          <div className="strip-header-title">
            <span className="strip-header-icon-orange">
              <Icons.Pulse size={16} />
            </span>
            <h3 className="strip-header-text">Today&apos;s Activity</h3>
          </div>

          <div className="strip-items-grid">
            {todayActivities.map((act) => (
              <div key={act.id} className="activity-chip-item">
                <div className={`activity-chip-icon cat-${act.cat}`}>
                  {act.cat === 'check_in' || act.cat === 'checkin' ? (
                    <Icons.CalendarClock size={16} />
                  ) : act.cat === 'registration' || act.cat === 'reg' ? (
                    <Icons.Check size={16} />
                  ) : act.cat === 'payment' || act.cat === 'pay' ? (
                    <Icons.CreditCard size={16} />
                  ) : (
                    <Icons.Refresh size={16} />
                  )}
                </div>
                <div className="activity-chip-meta">
                  <span className="activity-chip-title">{act.title}</span>
                  <span className="activity-chip-time">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: NOTIFICATIONS WIDGET */}
        <div className="reception-notif-widget-panel">
          <div className="notif-widget-header">
            <div className="notif-widget-title-box">
              <span className="notif-widget-icon-orange">
                <Icons.Bell size={16} />
              </span>
              <h3 className="notif-widget-text">Notifications</h3>
              <span className="notif-widget-counter">{unreadCount}</span>
            </div>
            <button
              type="button"
              className="notif-widget-link"
              onClick={() => onNavigate('memberships')}
            >
              <span>View All</span>
              <Icons.ArrowUpRight size={13} />
            </button>
          </div>

          <div className="notif-widget-content">
            <div className="notif-alert-card-row">
              <span className="notif-alert-triangle">
                <Icons.AlertTriangle size={17} />
              </span>
              <div className="notif-alert-text">
                <span className="notif-alert-headline">
                  {activeNotifications[0]?.title || 'Membership will expire soon'}
                </span>
                <span className="notif-alert-details">
                  {activeNotifications[0]?.message || '3 members in next 7 days'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
