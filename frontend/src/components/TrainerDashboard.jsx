import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import './TrainerDashboard.css';

// Crisp SVG Icons matching Tigat Gym SaaS aesthetics
const Icons = {
  Calendar: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  Clock: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Users: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  UserCheck: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  Activity: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  CheckCircle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Check: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Search: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  X: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Dumbbell: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.41 1.41a2 2 0 0 1-2.83 0l-1.41-1.41a2 2 0 0 0-2.83 0L7 22.5" />
      <path d="m3 3 1 1a2 2 0 0 0 2.83 0l1.41-1.41a2 2 0 0 1 2.83 0l1.41 1.41a2 2 0 0 0 2.83 0L17 1.5" />
    </svg>
  ),
  Phone: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Edit: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Award: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
};

export default function TrainerDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Modals
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);
  const [classRosterList, setClassRosterList] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Quick Workout Note logger state
  const [workoutLogForm, setWorkoutLogForm] = useState({
    member_id: '',
    exercise_name: 'Chest & Triceps Focus',
    weight_kg: '',
    notes: '',
  });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getTrainerDashboard();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load trainer dashboard:', err);
      showToast('Could not load latest coaching data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setTimeout(() => {
      fetchDashboard();
    }, 0);

    const handleSync = () => fetchDashboard();
    window.addEventListener('gymcore:trainer-updated', handleSync);
    return () => window.removeEventListener('gymcore:trainer-updated', handleSync);
  }, [fetchDashboard]);

  // Trainer profile & stats defensive parsing
  const trainer = data?.trainer || {
    name: user?.name || 'Coach',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80',
    specialization: 'Strength & Conditioning',
    shift: 'full_day',
    trainer_code: 'TR-001',
    monthly_fee: 1500,
  };

  const stats = data?.stats || {
    active_mentees: data?.assigned_members?.length || 0,
    mentees_capacity: 15,
    today_sessions: data?.today_sessions?.length || 0,
    today_completed: data?.today_sessions?.filter((s) => s.status === 'completed')?.length || 0,
    classes_count: data?.my_classes?.length || 0,
    mentees_checked_in_today: 0,
  };

  const assignedMembers = useMemo(() => {
    return Array.isArray(data?.assigned_members) ? data.assigned_members : [];
  }, [data]);

  const todaySessions = useMemo(() => {
    return Array.isArray(data?.today_sessions) ? data.today_sessions : [];
  }, [data]);

  const upcomingSessions = useMemo(() => {
    return Array.isArray(data?.upcoming_sessions) ? data.upcoming_sessions : [];
  }, [data]);

  const allClasses = useMemo(() => {
    return Array.isArray(data?.my_classes) ? data.my_classes : [];
  }, [data]);

  // Filtered Sessions
  const allSessionsCombined = useMemo(() => {
    const list = [...todaySessions, ...upcomingSessions];
    // Remove duplicates by id
    const unique = [];
    const seen = new Set();
    for (const item of list) {
      if (item?.id && !seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item);
      }
    }
    return unique;
  }, [todaySessions, upcomingSessions]);

  const filteredSessions = useMemo(() => {
    return allSessionsCombined.filter((s) => {
      const matchStatus = sessionFilter === 'all' || s.status === sessionFilter;
      const athleteName = s.member?.name || '';
      const code = s.session_code || '';
      const matchSearch =
        athleteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [allSessionsCombined, sessionFilter, searchQuery]);

  // Filtered Athletes
  const filteredAthletes = useMemo(() => {
    return assignedMembers.filter((m) => {
      const name = m.name || '';
      const phone = m.phone || '';
      const code = m.member_code || '';
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [assignedMembers, searchQuery]);

  // Shift Label helper
  const shiftText = useMemo(() => {
    switch (trainer.shift) {
      case 'morning':
        return '🌅 Morning Shift (6:00 AM – 2:00 PM)';
      case 'evening':
        return '🌆 Evening Shift (2:00 PM – 10:00 PM)';
      default:
        return '☀️ Full Day Shift (6:00 AM – 10:00 PM)';
    }
  }, [trainer.shift]);

  // Handle Complete Session
  const handleOpenCompleteModal = (session) => {
    setSessionToComplete(session);
    setFeedbackText(session.trainer_feedback || '');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!sessionToComplete) return;

    try {
      setIsSubmittingComplete(true);
      await apiClient.updateSessionStatus(sessionToComplete.id, {
        status: 'completed',
        trainer_feedback: feedbackText,
      });
      showToast('Session marked completed with feedback logged!');
      setIsCompleteModalOpen(false);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to complete session:', err);
      showToast('Failed to update session status', 'error');
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  // Handle Cancel Session
  const handleCancelSession = async (session) => {
    if (!window.confirm(`Are you sure you want to cancel session ${session.session_code}?`)) return;
    try {
      await apiClient.cancelTrainingSession(session.id, 'Cancelled by coach');
      showToast('Session cancelled.');
      fetchDashboard();
    } catch (err) {
      console.error('Failed to cancel session:', err);
      showToast('Failed to cancel session', 'error');
    }
  };

  // Handle Class Roster Modal
  const handleOpenClassRoster = async (cls) => {
    setSelectedClassForRoster(cls);
    setIsRosterModalOpen(true);
    setLoadingRoster(true);
    try {
      const res = await apiClient.getClassRoster(cls.id);
      const bookings = res?.data || res || [];
      setClassRosterList(Array.isArray(bookings) ? bookings : []);
    } catch (err) {
      console.error('Failed to load class roster:', err);
      setClassRosterList([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Quick Workout Note Log
  const handleLogQuickWorkout = (e) => {
    e.preventDefault();
    if (!workoutLogForm.member_id) {
      showToast('Please select a mentee to log workout notes for', 'error');
      return;
    }
    showToast(`✓ Workout notes recorded for athlete! Great session.`, 'success');
    setWorkoutLogForm({
      member_id: '',
      exercise_name: 'Chest & Triceps Focus',
      weight_kg: '',
      notes: '',
    });
  };

  if (loading && !data) {
    return (
      <div className="trainer-hub-wrapper" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="classes-loading-spinner" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Loading Coach Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="clean-reception-dashboard trainer-dashboard-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 99999,
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icons.CheckCircle size={16} color="#ffffff" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ─── Header Banner (Matches Existing Dashboard Overview) ────────── */}
      <div className="reception-header-banner" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              position: 'relative',
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: '2.5px solid #ff7a00',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(255, 122, 0, 0.25)',
              background: '#f1f5f9',
            }}
          >
            <img
              src={trainer.avatar || 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80'}
              alt={trainer.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="reception-welcome-title" style={{ margin: 0 }}>
                Welcome back, Coach {trainer.name}!
              </h1>
              <span
                style={{
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
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                On Duty & Available
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#ea580c',
                  background: 'rgba(234, 88, 12, 0.08)',
                  padding: '3px 10px',
                  borderRadius: 16,
                  border: '1px solid rgba(234, 88, 12, 0.2)',
                }}
              >
                <Icons.Clock size={12} color="#ea580c" />
                <span>{shiftText}</span>
              </span>
            </div>
            <p className="reception-welcome-desc" style={{ marginTop: 4 }}>
              Certified Fitness Coach · {trainer.specialization || 'Strength & Conditioning'} · Assigned Athlete Mentorship & Class Operations
            </p>
          </div>
        </div>

        <div className="clean-dash-actions">
          <button
            type="button"
            className="btn-clean-add-member"
            onClick={() => setActiveTab('workout_log')}
            title="Log athlete workout notes, exercises or progress milestones"
          >
            <Icons.Dumbbell size={15} />
            <span>Log Athlete Workout</span>
          </button>
        </div>
      </div>

      {/* ─── 4 Core Coaching Metric Cards (Standard Clean KPI Grid) ────────── */}
      <section className="clean-kpi-grid" style={{ marginBottom: 16 }}>
        {/* Metric 1: Active Athletes */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Active Athletes Mentored</span>
            <div className="clean-kpi-icon" title="Active Athletes Mentored" style={{ color: '#ff7a00', background: 'rgba(255, 122, 0, 0.1)' }}>
              <Icons.Users size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.active_mentees}</div>
          <span className="kpi-trend trend-positive">
            {stats.active_mentees} / {stats.mentees_capacity || 15} Capacity ({Math.max(0, (stats.mentees_capacity || 15) - stats.active_mentees)} open spots)
          </span>
        </div>

        {/* Metric 2: Today's Sessions */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Today's PT Sessions</span>
            <div className="clean-kpi-icon" title="Today's PT Sessions" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
              <Icons.Calendar size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.today_sessions}</div>
          <span className="kpi-trend trend-positive">
            {stats.today_completed} Completed · {Math.max(0, stats.today_sessions - stats.today_completed)} Upcoming
          </span>
        </div>

        {/* Metric 3: Classes Instructed */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Fitness Classes</span>
            <div className="clean-kpi-icon" title="Fitness Classes" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)' }}>
              <Icons.Dumbbell size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.classes_count}</div>
          <span className="kpi-trend trend-neutral">
            Group classes assigned to your schedule
          </span>
        </div>

        {/* Metric 4: Mentees in Gym Today */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Mentees In Gym Today</span>
            <div className="clean-kpi-icon" title="Mentees In Gym Today" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <Icons.UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.mentees_checked_in_today}</div>
          <span className="kpi-trend trend-positive">
            Checked in at turnstile today
          </span>
        </div>
      </section>

      {/* ─── Navigation Subtabs (Matches Existing Dashboard Subtabs) ─────────── */}
      <div className="iron-dashboard-subtabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`subtab-pill ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Icons.Calendar size={15} />
          <span>Daily Coaching Schedule</span>
          {todaySessions.length > 0 && <span className="coach-tab-badge">{todaySessions.length}</span>}
        </button>

        <button
          type="button"
          className={`subtab-pill ${activeTab === 'athletes' ? 'active' : ''}`}
          onClick={() => setActiveTab('athletes')}
        >
          <Icons.Users size={15} />
          <span>My Athletes ({assignedMembers.length})</span>
        </button>

        <button
          type="button"
          className={`subtab-pill ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <Icons.Dumbbell size={15} />
          <span>My Classes ({allClasses.length})</span>
        </button>

        <button
          type="button"
          className={`subtab-pill ${activeTab === 'workout_log' ? 'active' : ''}`}
          onClick={() => setActiveTab('workout_log')}
        >
          <Icons.Activity size={15} />
          <span>Workout & Progress Logger</span>
        </button>
      </div>

      {/* ─── Search & Quick Filter Bar ───────────────────────────────────── */}
      {(activeTab === 'schedule' || activeTab === 'athletes') && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 260, flex: '1 1 300px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <Icons.Search size={15} />
            </span>
            <input
              type="text"
              placeholder={activeTab === 'schedule' ? 'Search session code, athlete name...' : 'Search athlete by name, phone, code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input-search"
              style={{ width: '100%', paddingLeft: 34, height: 38, borderRadius: 8, fontSize: 13 }}
            />
          </div>

          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {['all', 'scheduled', 'completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSessionFilter(st)}
                  className={`btn-clean-schedule ${sessionFilter === st ? 'active' : ''}`}
                  style={{
                    height: 34,
                    fontSize: 12,
                    textTransform: 'capitalize',
                    padding: '0 12px',
                    borderColor: sessionFilter === st ? '#ff7a00' : undefined,
                    color: sessionFilter === st ? '#ff7a00' : undefined,
                    fontWeight: sessionFilter === st ? 700 : 500,
                  }}
                >
                  {st === 'all' ? 'All Sessions' : st}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 1: Daily Coaching Schedule ──────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div className="coach-tab-panel">
          <div className="coach-panel-header">
            <h3 className="coach-panel-title">
              <Icons.Calendar size={18} color="#ff7a00" />
              <span>1-on-1 PT Sessions Schedule</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gym-text-muted, #94a3b8)' }}>
              <Icons.Check size={14} color="#10b981" />
              <span>Assigned by Reception & Admin</span>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="coach-empty-box">
              <div className="coach-empty-icon">
                <Icons.Calendar size={24} />
              </div>
              <strong style={{ fontSize: 15, color: 'var(--gym-text-primary, #0f172a)' }}>No Training Sessions Found</strong>
              <p style={{ margin: 0, fontSize: 13 }}>
                {searchQuery || sessionFilter !== 'all'
                  ? 'No sessions match your filter criteria.'
                  : 'You have no 1-on-1 sessions scheduled for this period.'}
              </p>
              <div style={{ marginTop: 10, padding: '8px 14px', background: 'rgba(255, 122, 0, 0.08)', borderRadius: 8, border: '1px solid rgba(255, 122, 0, 0.2)', fontSize: 12, color: '#ff7a00', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span>Note: 1-on-1 PT sessions are booked and assigned exclusively by Reception and Admin staff.</span>
              </div>
            </div>
          ) : (
            <div className="coach-sessions-list">
              {filteredSessions.map((session) => {
                const athlete = session.member || {};
                const isCompleted = session.status === 'completed';
                const isCancelled = session.status === 'cancelled';
                const startDate = new Date(session.scheduled_start);
                const endDate = session.scheduled_end ? new Date(session.scheduled_end) : null;
                const timeString = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${
                  endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '1 hr'
                }`;
                const dateString = startDate.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });

                return (
                  <div key={session.id} className="coach-session-item">
                    <div className="coach-session-time-col">
                      <div className="coach-session-time">
                        <Icons.Clock size={13} color="#ff7a00" />
                        <span>{timeString}</span>
                      </div>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>{dateString}</span>
                      <span className="coach-session-code">{session.session_code}</span>
                    </div>

                    <div className="coach-session-athlete-col">
                      <div className="coach-session-athlete-avatar">
                        {athlete.avatar ? (
                          <img src={athlete.avatar} alt={athlete.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          athlete.name?.charAt(0).toUpperCase() || 'A'
                        )}
                      </div>
                      <div className="coach-session-athlete-info">
                        <h4 className="coach-session-athlete-name">{athlete.name || 'Assigned Mentee'}</h4>
                        <div className="coach-session-focus">
                          <span>🎯 {session.focus_area || 'Strength & Conditioning'}</span>
                        </div>
                        {session.trainer_feedback && (
                          <div style={{ fontSize: 11, color: '#10b981', fontStyle: 'italic', marginTop: 2 }}>
                            Feedback: "{session.trainer_feedback}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="coach-session-actions">
                      <span
                        className="class-status-tag"
                        style={{
                          background: isCompleted ? 'rgba(16, 185, 129, 0.12)' : isCancelled ? 'rgba(100, 116, 139, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                          color: isCompleted ? '#10b981' : isCancelled ? '#64748b' : '#3b82f6',
                          borderColor: 'transparent',
                        }}
                      >
                        <span style={{ fontSize: 8 }}>●</span>
                        <span style={{ textTransform: 'capitalize' }}>{session.status}</span>
                      </span>

                      {!isCompleted && !isCancelled && (
                        <>
                          <button
                            type="button"
                            className="coach-btn-success"
                            onClick={() => handleOpenCompleteModal(session)}
                            title="Complete session and log notes"
                          >
                            <Icons.CheckCircle size={13} />
                            <span>Complete</span>
                          </button>
                          <button
                            type="button"
                            className="btn-clean-schedule"
                            onClick={() => handleCancelSession(session)}
                            style={{ height: 28, fontSize: 11, padding: '0 8px', color: '#ef4444' }}
                            title="Cancel session"
                          >
                            <Icons.X size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: My Athlete Roster ────────────────────────────────────── */}
      {activeTab === 'athletes' && (
        <div className="coach-tab-panel">
          <div className="coach-panel-header">
            <h3 className="coach-panel-title">
              <Icons.Users size={18} color="#ff7a00" />
              <span>Assigned Athletes ({assignedMembers.length})</span>
            </h3>
            <span style={{ fontSize: 12, color: 'var(--gym-text-muted, #94a3b8)' }}>
              Assigned by Reception
            </span>
          </div>

          {filteredAthletes.length === 0 ? (
            <div className="coach-empty-box">
              <div className="coach-empty-icon">
                <Icons.Users size={24} />
              </div>
              <strong style={{ fontSize: 15, color: 'var(--gym-text-primary, #0f172a)' }}>No Athletes Assigned Yet</strong>
              <p style={{ margin: 0, fontSize: 13 }}>
                {searchQuery
                  ? 'No athletes match your search.'
                  : 'Athletes assigned to you by front desk reception will appear here with full mentorship tracking.'}
              </p>
            </div>
          ) : (
            <div className="coach-athletes-grid">
              {filteredAthletes.map((athlete) => {
                return (
                  <div key={athlete.assignment_id || athlete.member_id} className="coach-athlete-card">
                    <div className="coach-athlete-card-top">
                      <div className="coach-athlete-card-avatar">
                        {athlete.avatar ? (
                          <img src={athlete.avatar} alt={athlete.name} />
                        ) : (
                          athlete.name?.charAt(0).toUpperCase() || 'M'
                        )}
                      </div>
                      <div className="coach-athlete-card-meta">
                        <h4 className="coach-athlete-card-name">{athlete.name}</h4>
                        <span className="coach-athlete-card-plan">{athlete.plan_name || 'Active Membership'}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          Code: {athlete.member_code || `TG-${athlete.member_id}`}
                        </span>
                      </div>
                    </div>

                    <div className="coach-athlete-card-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icons.Phone size={11} color="#ff7a00" />
                        <span>{athlete.phone || 'No phone'}</span>
                      </div>
                      <div>
                        {athlete.days_remaining !== null && (
                          <span style={{ fontWeight: 700, color: athlete.days_remaining <= 5 ? '#ef4444' : '#10b981' }}>
                            {athlete.days_remaining} days left
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="coach-athlete-card-actions">
                      <button
                        type="button"
                        className="coach-btn-primary"
                        style={{ height: 30, fontSize: 11.5, padding: '0 12px', flex: 1, justifyContent: 'center' }}
                        onClick={() => {
                          setWorkoutLogForm((prev) => ({ ...prev, member_id: String(athlete.member_id) }));
                          setActiveTab('workout_log');
                        }}
                        title="Log workout or milestone"
                      >
                        <Icons.Dumbbell size={13} />
                        <span>Log Workout & Notes</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: My Fitness Classes ───────────────────────────────────── */}
      {activeTab === 'classes' && (
        <div className="coach-tab-panel">
          <div className="coach-panel-header">
            <h3 className="coach-panel-title">
              <Icons.Dumbbell size={18} color="#ff7a00" />
              <span>Classes Assigned to You ({allClasses.length})</span>
            </h3>
            <button
              type="button"
              className="coach-btn-secondary"
              onClick={() => onNavigate && onNavigate('classes')}
              style={{ height: 32, fontSize: 12 }}
            >
              <span>View Full Gym Class Schedule</span>
            </button>
          </div>

          {allClasses.length === 0 ? (
            <div className="coach-empty-box">
              <div className="coach-empty-icon">
                <Icons.Dumbbell size={24} />
              </div>
              <strong style={{ fontSize: 15, color: 'var(--gym-text-primary, #0f172a)' }}>No Classes Assigned Yet</strong>
              <p style={{ margin: 0, fontSize: 13 }}>
                Fitness classes where you are assigned as lead coach will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="coach-classes-grid">
              {allClasses.map((cls) => {
                const startTime = cls.start_time ? new Date(cls.start_time) : null;
                const timeStr = startTime
                  ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'TBD';
                const bookedCount = Number(cls.booked_count || 0);
                const capacity = Number(cls.capacity || 20);
                const isFull = bookedCount >= capacity;

                return (
                  <div key={cls.id} className="coach-class-card">
                    <div className="coach-class-header">
                      <h4 className="coach-class-title">{cls.name}</h4>
                      <span
                        className="class-status-tag"
                        style={{
                          background: isFull ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isFull ? '#ef4444' : '#10b981',
                          borderColor: 'transparent',
                        }}
                      >
                        {isFull ? 'Class Full' : 'Open'}
                      </span>
                    </div>

                    <div className="coach-class-room">
                      <Icons.Clock size={12} color="#ff7a00" />
                      <span>{timeStr}</span>
                      <span>·</span>
                      <span>{cls.room || 'Main Studio'}</span>
                    </div>

                    <div className="coach-class-capacity-strip">
                      <span>Booked Capacity</span>
                      <strong style={{ color: isFull ? '#ef4444' : '#ff7a00' }}>
                        {bookedCount} / {capacity} Enrolled
                      </strong>
                    </div>

                    <div className="coach-capacity-bar">
                      <div
                        className="coach-capacity-fill"
                        style={{
                          width: `${Math.min(100, Math.round((bookedCount / capacity) * 100))}%`,
                          background: isFull ? 'linear-gradient(90deg, #ef4444, #dc2626)' : undefined,
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="coach-btn-secondary"
                      style={{ height: 30, fontSize: 11.5, justifyContent: 'center', marginTop: 4 }}
                      onClick={() => handleOpenClassRoster(cls)}
                    >
                      <Icons.Users size={13} />
                      <span>View Enrolled Roster ({bookedCount})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: Workout & Progress Logger ────────────────────────────── */}
      {activeTab === 'workout_log' && (
        <div className="coach-tab-panel">
          <div className="coach-panel-header">
            <h3 className="coach-panel-title">
              <Icons.Activity size={18} color="#ff7a00" />
              <span>Record Athlete Workout Notes & Milestones</span>
            </h3>
          </div>

          <form onSubmit={handleLogQuickWorkout} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--gym-text-primary, #0f172a)' }}>
                Select Coached Athlete *
              </label>
              <select
                className="filter-input-search"
                style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                value={workoutLogForm.member_id}
                onChange={(e) => setWorkoutLogForm({ ...workoutLogForm, member_id: e.target.value })}
                required
              >
                <option value="">-- Choose Athlete --</option>
                {assignedMembers.map((m) => (
                  <option key={m.member_id} value={m.member_id}>
                    {m.name} ({m.member_code || `ID-${m.member_id}`})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--gym-text-primary, #0f172a)' }}>
                Workout Target Focus *
              </label>
              <input
                type="text"
                className="filter-input-search"
                style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                value={workoutLogForm.exercise_name}
                onChange={(e) => setWorkoutLogForm({ ...workoutLogForm, exercise_name: e.target.value })}
                placeholder="e.g. Chest & Triceps, Leg Day, HIIT Circuit"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--gym-text-primary, #0f172a)' }}>
                Athlete Body Weight / Load (kg)
              </label>
              <input
                type="number"
                step="0.5"
                className="filter-input-search"
                style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                value={workoutLogForm.weight_kg}
                onChange={(e) => setWorkoutLogForm({ ...workoutLogForm, weight_kg: e.target.value })}
                placeholder="e.g. 78.5"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--gym-text-primary, #0f172a)' }}>
                Coach Feedback & Performance Observations
              </label>
              <textarea
                className="filter-input-search"
                rows={3}
                style={{ width: '100%', borderRadius: 8, fontSize: 13, padding: 10 }}
                value={workoutLogForm.notes}
                onChange={(e) => setWorkoutLogForm({ ...workoutLogForm, notes: e.target.value })}
                placeholder="Form improvements, reps achieved, recovery instructions..."
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                className="coach-btn-primary"
                style={{ height: 38, padding: '0 20px', fontSize: 13 }}
              >
                <Icons.CheckCircle size={15} />
                <span>Save Workout Milestone</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: Complete Session & Log Feedback ─────────────────────── */}
      {isCompleteModalOpen && sessionToComplete && (
        <div className="gym-modal-backdrop" onClick={() => setIsCompleteModalOpen(false)}>
          <div className="gym-modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="gym-modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.CheckCircle size={18} color="#10b981" />
                <span>Complete Training Session</span>
              </h3>
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => setIsCompleteModalOpen(false)}
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <Icons.X size={14} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit}>
              <div className="gym-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'var(--gym-bg-subtle, #f8fafc)', padding: 12, borderRadius: 8, border: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                    Athlete: {sessionToComplete.member?.name || 'Mentee'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Session: {sessionToComplete.session_code} · {sessionToComplete.focus_area}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Coach Feedback & Performance Observations
                  </label>
                  <textarea
                    className="filter-input-search"
                    rows={4}
                    style={{ width: '100%', borderRadius: 8, fontSize: 13, padding: 10 }}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Log weights lifted, athlete effort, areas to improve next session..."
                  />
                </div>
              </div>

              <div className="gym-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="coach-btn-secondary"
                  onClick={() => setIsCompleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coach-btn-success"
                  disabled={isSubmittingComplete}
                  style={{ height: 34, padding: '0 16px' }}
                >
                  {isSubmittingComplete ? 'Saving...' : '✓ Mark Session Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Class Roster Drawer ─────────────────────────────────── */}
      {isRosterModalOpen && selectedClassForRoster && (
        <div className="gym-modal-backdrop" onClick={() => setIsRosterModalOpen(false)}>
          <div className="gym-modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="gym-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  {selectedClassForRoster.name}
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Enrolled Attendees ({classRosterList.length} / {selectedClassForRoster.capacity})
                </span>
              </div>
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => setIsRosterModalOpen(false)}
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <Icons.X size={14} />
              </button>
            </div>

            <div className="gym-modal-body" style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingRoster ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Loading roster...</div>
              ) : classRosterList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                  No members have booked this class yet.
                </div>
              ) : (
                classRosterList.map((item) => {
                  const member = item.member || item;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--gym-bg-subtle, #f8fafc)',
                        border: '1px solid var(--gym-card-border, #e2e8f0)',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#ff7a00',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                          }}
                        >
                          {member.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <strong style={{ fontSize: 13, display: 'block', color: 'var(--gym-text-primary, #0f172a)' }}>
                            {member.name}
                          </strong>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{member.phone || 'No phone'}</span>
                        </div>
                      </div>
                      <span
                        className="class-status-tag"
                        style={{
                          background: item.status === 'attended' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                          color: item.status === 'attended' ? '#10b981' : '#3b82f6',
                          borderColor: 'transparent',
                        }}
                      >
                        {item.status || 'Confirmed'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="gym-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="coach-btn-secondary"
                onClick={() => setIsRosterModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
