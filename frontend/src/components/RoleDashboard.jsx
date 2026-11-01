import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import UserManagement from './UserManagement';
import AuditLogViewer from './AuditLogViewer';

export default function RoleDashboard({ onNavigate }) {
  const { user, primaryRole, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'audit'

  const isOwner = hasRole('owner');
  const isAdmin = hasRole('admin');
  const isReceptionist = hasRole('receptionist');

  // Metrics from API
  const [metrics, setMetrics] = useState({
    totalMembers: 89,
    activeSubscriptions: 89,
    currentlyInside: 56,
    totalTrainers: 12,
    todayCheckIns: 56,
    monthRevenue: 45300,
    monthExpenses: 16200,
    capacityLimit: 100,
    isLoading: true,
  });

  const [trainersList, setTrainersList] = useState([]);

  // Default featured coaches matching Image 1
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
    let ignore = false;

    // Load metrics from endpoints
    Promise.allSettled([
      apiClient.getAttendanceSummary(),
      (isOwner || isAdmin || isReceptionist) ? apiClient.getPaymentSummary() : Promise.resolve({ data: {} }),
      (isOwner || isAdmin || isReceptionist) ? apiClient.getMembers({ per_page: 1 }) : Promise.resolve({ meta: {} }),
      (isOwner || isAdmin || isReceptionist) ? apiClient.getSubscriptions({ status: 'active', per_page: 1 }) : Promise.resolve({ meta: {} }),
      apiClient.getTrainers(),
    ]).then(([attRes, payRes, memRes, subRes, trainRes]) => {
      if (!ignore) {
        const att = attRes.status === 'fulfilled' ? attRes.value?.data : {};
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
          currentlyInside: att?.currently_inside || prev.currentlyInside,
          todayCheckIns: att?.today_admitted || prev.todayCheckIns,
          totalTrainers: trainers?.length || prev.totalTrainers,
          monthRevenue: pay?.month_revenue || pay?.total_revenue || prev.monthRevenue,
          isLoading: false,
        }));
      }
    }).catch((err) => {
      console.error('Failed to load dashboard metrics:', err);
      if (!ignore) {
        setMetrics((prev) => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      ignore = true;
    };
  }, [isOwner, isAdmin, isReceptionist]);

  // Capacity calculation
  const capacitySpots = metrics.currentlyInside || 56;
  const totalCapacity = metrics.capacityLimit || 100;
  const capacityPercent = Math.min(100, Math.round((capacitySpots / totalCapacity) * 100));

  // Determine capacity label
  let capacityLevel = 'Moderate';
  if (capacityPercent < 35) capacityLevel = 'Low Traffic';
  else if (capacityPercent > 75) capacityLevel = 'High / Peak';

  // Revenue analytics monthly series matching Image 1
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

  // Coaches to display
  const displayTrainers = trainersList.length > 0 ? trainersList : defaultTrainers;

  return (
    <div className="iron-dashboard-wrapper">
      {/* Secondary Management Tabs (when Staff or Owner logged in) */}
      {(isOwner || isAdmin || isReceptionist) && (
        <div className="iron-dashboard-subtabs">
          <button
            type="button"
            className={`subtab-pill ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Business Overview
          </button>
          <button
            type="button"
            className={`subtab-pill ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Staff Accounts
          </button>
          {isOwner && (
            <button
              type="button"
              className={`subtab-pill ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              🛡️ Audit Trail
            </button>
          )}
        </div>
      )}

      {/* Tab 1: Business Overview matching Image 1 */}
      {activeTab === 'overview' && (
        <>
          {/* Top Welcome Title & Utility Controls */}
          <div className="iron-welcome-header">
            <div className="iron-welcome-left">
              <h1 className="iron-main-title">Manage your Fitness business</h1>
              <p className="iron-sub-title">
                Welcome back! Here&apos;s your fitness business overview.
              </p>
            </div>

            <div className="iron-welcome-right">
              {/* Quick Search Button */}
              <button
                type="button"
                className="iron-circle-btn"
                title="Search athletes or invoices"
                onClick={() => onNavigate && onNavigate('members')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Notification Bell with Badge */}
              <button
                type="button"
                className="iron-circle-btn has-notification"
                title="Recent front desk alerts"
                onClick={() => onNavigate && onNavigate('attendance')}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="iron-notification-dot"></span>
              </button>

              {/* User Avatar with Dropdown Arrow */}
              <div className="iron-user-pill" title={`${user?.name} (${primaryRole?.toUpperCase()})`}>
                <div className="iron-user-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="iron-user-name-text">
                  {user?.name?.split(' ')[0]}
                </span>
                <span className="iron-user-chevron">▼</span>
              </div>
            </div>
          </div>

          {/* 4 Stat KPI Cards matching Image 1 & 2 */}
          <div className="iron-stat-cards-grid">
            {/* Card 1: Revenue */}
            <div className="iron-stat-card card-revenue">
              <div className="stat-card-top">
                <span className="stat-card-icon">💲</span>
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
                <span className="stat-card-icon">👥</span>
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

            {/* Card 3: Trainer */}
            <div
              className="iron-stat-card card-trainers clickable-card"
              onClick={() => onNavigate && onNavigate('trainers')}
            >
              <div className="stat-card-top">
                <span className="stat-card-icon">🏋️</span>
                <span className="stat-card-label">Trainer</span>
              </div>
              <div className="stat-card-main-val font-mono">
                {metrics.totalTrainers}
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-period">Active Trainers</span>
                <span className="stat-pill-badge badge-green">
                  ↗ +3.0%
                </span>
              </div>
            </div>

            {/* Card 4: Visited / Attendance */}
            <div
              className="iron-stat-card card-visited clickable-card"
              onClick={() => onNavigate && onNavigate('attendance')}
            >
              <div className="stat-card-top">
                <span className="stat-card-icon">🚶</span>
                <span className="stat-card-label">Visited</span>
              </div>
              <div className="stat-card-main-val font-mono">
                {capacitySpots}
              </div>
              <div className="stat-card-bottom">
                <span className="stat-card-period">Daily Average</span>
                <span className="stat-pill-badge badge-red">
                  ↘ -1.2%
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: Revenue Analytics & Gym Capacity Dot Matrix */}
          <div className="iron-middle-grid">
            {/* Left Card: Revenue Analytics Chart */}
            <div className="iron-card-panel iron-revenue-panel">
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Revenue Analytics</h3>
                  <span className="panel-subtitle">Jan – Aug 2026</span>
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

              {/* Modern Paired Bar Chart */}
              <div className="revenue-chart-container">
                {/* Y-Axis scale */}
                <div className="chart-y-axis">
                  <span>1400</span>
                  <span>1200</span>
                  <span>1000</span>
                  <span>800</span>
                  <span>$0</span>
                </div>

                {/* Bars & Grid */}
                <div className="chart-bars-wrap">
                  {/* Subtle Gridlines */}
                  <div className="chart-gridlines" aria-hidden="true">
                    <div className="gridline"></div>
                    <div className="gridline"></div>
                    <div className="gridline"></div>
                    <div className="gridline"></div>
                    <div className="gridline"></div>
                  </div>

                  {/* Paired Columns */}
                  <div className="chart-columns-flex">
                    {monthlyData.map((item) => {
                      const maxScale = 1600;
                      const revHeight = (item.rev / maxScale) * 100;
                      const expHeight = (item.exp / maxScale) * 100;

                      return (
                        <div key={item.month} className="monthly-column-group">
                          <div className="bars-pair">
                            {/* Revenue Bar (Orange) */}
                            <div
                              className="bar bar-revenue"
                              style={{ height: `${revHeight}%` }}
                              title={`Revenue: ${item.rev} ETB`}
                            ></div>
                            {/* Expense Bar (Dark Grey) */}
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

            {/* Right Card: Gym Capacity with 10x10 Dot Matrix matching Image 1 */}
            <div className="iron-card-panel iron-capacity-panel">
              <div className="panel-header">
                <h3 className="panel-title">Gym Capacity</h3>
                <button
                  type="button"
                  className="iron-mini-action-btn"
                  title="Live Floor Scanner"
                  onClick={() => onNavigate && onNavigate('attendance')}
                >
                  ↗
                </button>
              </div>

              {/* 10 x 10 Dot Matrix Grid matching Image 1 */}
              <div className="capacity-matrix-container">
                <div className="dot-matrix-grid">
                  {Array.from({ length: 100 }).map((_, idx) => {
                    const isOccupied = idx < capacitySpots;
                    return (
                      <span
                        key={idx}
                        className={`matrix-dot ${isOccupied ? 'dot-occupied' : 'dot-unoccupied'}`}
                        title={isOccupied ? `Occupied Spot #${idx + 1}` : `Open Spot #${idx + 1}`}
                      ></span>
                    );
                  })}
                </div>
              </div>

              {/* Capacity Status & Percentage */}
              <div className="capacity-footer-meta">
                <div className="capacity-numbers">
                  <strong>{capacitySpots} / {totalCapacity} spots</strong>
                  <span className="capacity-pct-text">{capacityPercent}%</span>
                </div>
                <span className="capacity-status-badge">
                  {capacityLevel}
                </span>
              </div>

              {/* Solid Orange Capsule Progress Bar matching Image 1 */}
              <div className="capacity-capsule-track">
                <div
                  className="capacity-capsule-fill"
                  style={{ width: `${capacityPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Personal Trainer matching Image 1 */}
          <div className="iron-trainers-section">
            <div className="trainers-section-header">
              <h3 className="section-heading">Personal Trainer</h3>
              <button
                type="button"
                className="view-all-link-btn"
                onClick={() => onNavigate && onNavigate('trainers')}
              >
                View All
              </button>
            </div>

            {/* 4 Trainer Cards matching Image 1 */}
            <div className="iron-trainers-row">
              {displayTrainers.map((coach, idx) => (
                <div key={coach.id || idx} className="iron-coach-card">
                  {/* Top Coach Badge with Indicator Dot */}
                  <div className="coach-top-badge">
                    <span className="coach-status-dot"></span>
                    <span className="coach-badge-name">{coach.name}</span>
                  </div>

                  {/* Coach Photo / High Quality Silhouette Portrait */}
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

                  {/* Action Icons matching Image 1 */}
                  <div className="coach-actions-bar">
                    <button
                      type="button"
                      className="coach-action-btn"
                      title="Direct Consultation"
                      onClick={() => onNavigate && onNavigate('trainers')}
                    >
                      💬
                    </button>
                    <button
                      type="button"
                      className="coach-action-btn"
                      title="Schedule PT Session"
                      onClick={() => onNavigate && onNavigate('trainers')}
                    >
                      ⏱️
                    </button>
                    <button
                      type="button"
                      className="coach-action-btn check-btn"
                      title="Assigned Coach"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tab 2: User & Staff Management */}
      {activeTab === 'users' && (isOwner || isAdmin || isReceptionist) && (
        <div className="subtab-pane">
          <UserManagement />
        </div>
      )}

      {/* Tab 3: Security Audit Ledger */}
      {activeTab === 'audit' && isOwner && (
        <div className="subtab-pane">
          <AuditLogViewer />
        </div>
      )}
    </div>
  );
}
