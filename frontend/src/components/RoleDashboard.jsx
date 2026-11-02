import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import UserManagement from './UserManagement';
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

export default function RoleDashboard({ onNavigate }) {
  const { hasRole, primaryRole } = useAuth();
  const [activeTab, setActiveTab] = useState('reception'); // 'reception' | 'finance' | 'users' | 'audit'

  const isOwner = hasRole('owner');
  const isAdmin = hasRole('admin');

  // Operational Metrics
  const [metrics, setMetrics] = useState({
    totalMembers: 89,
    activeSubscriptions: 89,
    currentlyInside: 56,
    totalTrainers: 12,
    todayCheckIns: 56,
    expiringCount: 7,
    monthRevenue: 45300,
    monthExpenses: 16200,
    capacityLimit: 100,
    isLoading: true,
  });

  const [trainersList, setTrainersList] = useState([]);

  // Featured coaches for the business analytics view
  const defaultTrainers = [
    {
      id: 1,
      name: 'David Kim',
      specialization: 'Strength & Conditioning',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      initials: 'DK',
      status: 'Active',
      rating: '4.9',
    },
    {
      id: 2,
      name: 'Michael Rodriguez',
      specialization: 'Hypertrophy & Physique',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      initials: 'MR',
      status: 'Active',
      rating: '5.0',
    },
    {
      id: 3,
      name: 'Emma Chen',
      specialization: 'High Intensity & HIIT',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      initials: 'EC',
      status: 'Active',
      rating: '4.8',
    },
    {
      id: 4,
      name: 'Emily Ross',
      specialization: 'Mobility & Rehab',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      initials: 'ER',
      status: 'Active',
      rating: '4.9',
    },
  ];

  useEffect(() => {
    if (primaryRole === 'receptionist') {
      return;
    }

    let ignore = false;

    // Load live metrics from API
    Promise.allSettled([
      apiClient.getAttendanceSummary(),
      apiClient.getPaymentSummary(),
      apiClient.getMembers({ per_page: 1 }),
      apiClient.getSubscriptions({ status: 'active', per_page: 1 }),
      apiClient.getTrainers(),
    ]).then(([attSumRes, payRes, memRes, subRes, trainRes]) => {
      if (ignore) return;

      const attSum = attSumRes.status === 'fulfilled' ? attSumRes.value?.data : {};
      const pay = payRes.status === 'fulfilled' ? payRes.value?.data : {};
      const mem = memRes.status === 'fulfilled' ? memRes.value?.meta : {};
      const sub = subRes.status === 'fulfilled' ? subRes.value?.meta : {};
      const trainers = trainRes.status === 'fulfilled' ? trainRes.value?.data : [];

      if (trainers && trainers.length > 0) {
        setTrainersList(trainers.slice(0, 4));
      }

      setMetrics((prev) => ({
        ...prev,
        totalMembers: mem?.total || prev.totalMembers,
        activeSubscriptions: sub?.total || prev.activeSubscriptions,
        currentlyInside: attSum?.currently_inside ?? prev.currentlyInside,
        todayCheckIns: attSum?.today_admitted ?? prev.todayCheckIns,
        totalTrainers: trainers?.length || prev.totalTrainers,
        monthRevenue: pay?.month_revenue || pay?.total_revenue || prev.monthRevenue,
        isLoading: false,
      }));
    }).catch((err) => {
      console.error('Failed to load dashboard metrics:', err);
      if (!ignore) {
        setMetrics((prev) => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      ignore = true;
    };
  }, [primaryRole]);

  // Floor Capacity count
  const capacitySpots = metrics.currentlyInside || 56;

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

  const displayTrainers = trainersList.length > 0 ? trainersList : defaultTrainers;

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
            className={`subtab-pill ${activeTab === 'reception' ? 'active' : ''}`}
            onClick={() => setActiveTab('reception')}
          >
            <DeskIcon size={16} />
            <span>Front Desk Reception</span>
          </button>

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
            className={`subtab-pill ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <UsersIcon size={16} />
            <span>Staff Accounts</span>
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
          TAB 1: FRONT DESK RECEPTION OPERATIONS COCKPIT
          ========================================================================= */}
      {activeTab === 'reception' && (
        <ReceptionDashboard onNavigate={onNavigate} />
      )}
            {/* =========================================================================
          TAB 2: FINANCIAL & BUSINESS ANALYTICS (OWNER / ADMIN)
          ========================================================================= */}
      {activeTab === 'finance' && (isOwner || isAdmin) && (
        <>
          <div className="reception-header-banner">
            <div>
              <h2 className="reception-welcome-title">Financial & Revenue Analytics</h2>
              <p className="reception-welcome-desc">
                Revenue streams, operational expenses, and trainer performance metrics.
              </p>
            </div>
          </div>

          {/* 4 Stat KPI Cards */}
          <div className="iron-stat-cards-grid">
            {/* Card 1: Revenue */}
            <div className="iron-stat-card card-revenue">
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

            {/* Card 2: Members */}
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

            {/* Card 3: Trainers */}
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

            {/* Card 4: Daily Visits */}
            <div
              className="iron-stat-card card-visited clickable-card"
              onClick={() => onNavigate && onNavigate('attendance')}
            >
              <div className="stat-card-top">
                <span className="stat-card-icon icon-purple" style={{ padding: 6, borderRadius: 8 }}>
                  <CheckCircleIcon size={20} />
                </span>
                <span className="stat-card-label">Visited</span>
              </div>
              <div className="stat-card-main-val font-mono">
                {capacitySpots}
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-period">Daily Average</span>
                <span className="stat-pill-badge badge-green">
                  ↗ Active
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
              <h3 className="section-heading">Featured Personal Trainers</h3>
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
              {displayTrainers.map((coach, idx) => (
                <div key={coach.id || idx} className="iron-coach-card">
                  <div className="coach-top-badge">
                    <span className="coach-status-dot"></span>
                    <span className="coach-badge-name">{coach.name}</span>
                  </div>

                  <div className="coach-photo-wrap">
                    {coach.avatar ? (
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="coach-portrait-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div className="coach-fallback-portrait">
                      {coach.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="coach-actions-bar">
                    <button
                      type="button"
                      className="coach-action-btn"
                      title="Direct Consultation"
                      onClick={() => onNavigate && onNavigate('trainers')}
                    >
                      <DeskIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="coach-action-btn"
                      title="Schedule PT Session"
                      onClick={() => onNavigate && onNavigate('trainers')}
                    >
                      <ClockIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="coach-action-btn check-btn"
                      title="Certified Coach"
                    >
                      <CheckCircleIcon size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 3: STAFF ACCOUNTS MANAGEMENT
          ========================================================================= */}
      {activeTab === 'users' && (isOwner || isAdmin) && (
        <div className="subtab-pane">
          <UserManagement />
        </div>
      )}

      {/* =========================================================================
          TAB 4: SYSTEM AUDIT TRAIL (OWNER ONLY)
          ========================================================================= */}
      {activeTab === 'audit' && isOwner && (
        <div className="subtab-pane">
          <AuditLogViewer />
        </div>
      )}
    </div>
  );
}
