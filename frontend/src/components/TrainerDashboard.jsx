import { useState, useEffect, useCallback, useMemo } from 'react';
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
  RotateCw: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  ),
  RefreshCw: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
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
  AlertTriangle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Award: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Filter: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  ChevronDown: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronLeft: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ArrowRight: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

function TrainerDashboardSkeleton() {
  return (
    <div className="clean-reception-dashboard trainer-dashboard-wrapper" style={{ opacity: 0.95 }}>
      {/* Top Action Row Skeleton */}
      <section className="clean-dash-header-row" style={{ marginBottom: 12, justifyContent: 'flex-end' }}>
        <div className="clean-dash-actions" style={{ gap: 10 }}>
          <div className="trainer-skeleton-pulse" style={{ width: 120, height: 36, borderRadius: 8 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 125, height: 36, borderRadius: 8 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 130, height: 36, borderRadius: 8 }} />
        </div>
      </section>

      {/* Hero Banner Skeleton */}
      <div
        className="coach-hero-banner"
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.9))',
          borderColor: 'rgba(255, 122, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, width: '100%' }}>
          <div className="trainer-skeleton-pulse" style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <div className="trainer-skeleton-pulse" style={{ width: 140, height: 16, borderRadius: 6 }} />
            <div className="trainer-skeleton-pulse" style={{ width: 260, height: 26, borderRadius: 6 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <div className="trainer-skeleton-pulse" style={{ width: 160, height: 22, borderRadius: 9999 }} />
              <div className="trainer-skeleton-pulse" style={{ width: 120, height: 22, borderRadius: 9999 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards Grid Skeleton */}
      <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="clean-kpi-card" style={{ gap: 12 }}>
            <div className="clean-kpi-top">
              <div className="trainer-skeleton-pulse" style={{ width: 110, height: 14 }} />
              <div className="trainer-skeleton-pulse" style={{ width: 32, height: 32, borderRadius: 8 }} />
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: 60, height: 32, borderRadius: 6 }} />
            <div className="trainer-skeleton-pulse" style={{ width: '85%', height: 14 }} />
          </div>
        ))}
      </section>

      {/* 2-Column Today Schedule Section Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
        {[1, 2].map((col) => (
          <div key={col} className="coach-tab-panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--gym-card-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="trainer-skeleton-pulse" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="trainer-skeleton-pulse" style={{ width: 150, height: 16 }} />
                  <div className="trainer-skeleton-pulse" style={{ width: 100, height: 12 }} />
                </div>
              </div>
              <div className="trainer-skeleton-pulse" style={{ width: 70, height: 22, borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2].map((row) => (
                <div
                  key={row}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--gym-card-border, #e2e8f0)',
                    background: 'var(--gym-bg, #f8fafc)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div className="trainer-skeleton-pulse" style={{ width: 38, height: 38, borderRadius: col === 1 ? '50%' : 8, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div className="trainer-skeleton-pulse" style={{ width: '45%', height: 14 }} />
                      <div className="trainer-skeleton-pulse" style={{ width: '70%', height: 12 }} />
                    </div>
                  </div>
                  <div className="trainer-skeleton-pulse" style={{ width: 75, height: 26, borderRadius: 6 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Coaching Tools: Exercise Library & Member Progress Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 16 }}>
        {[1, 2].map((i) => (
          <div key={i} className="coach-tab-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="trainer-skeleton-pulse" style={{ width: 44, height: 44, borderRadius: 12 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="trainer-skeleton-pulse" style={{ width: '50%', height: 16, borderRadius: 4 }} />
                <div className="trainer-skeleton-pulse" style={{ width: '80%', height: 12, borderRadius: 4 }} />
              </div>
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: '100%', height: 36, borderRadius: 6 }} />
            <div className="trainer-skeleton-pulse" style={{ width: '100%', height: 36, borderRadius: 8, marginTop: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrainerDashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);
  const [classRosterList, setClassRosterList] = useState([]);
  const [rosterMeta, setRosterMeta] = useState(null);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

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
    window.addEventListener('gymcore:refresh', handleSync);
    return () => {
      window.removeEventListener('gymcore:trainer-updated', handleSync);
      window.removeEventListener('gymcore:refresh', handleSync);
    };
  }, [fetchDashboard]);

  const stats = data?.stats || {
    active_mentees: data?.assigned_members?.length || 0,
    mentees_capacity: 15,
    today_sessions: data?.today_sessions?.length || 0,
    today_completed: data?.today_sessions?.filter((s) => s.status === 'completed')?.length || 0,
    today_classes: 0,
    active_workout_plans: 0,
    upcoming_sessions: data?.upcoming_sessions?.length || 0,
    classes_count: data?.my_classes?.length || 0,
    mentees_checked_in_today: 0,
  };

  const assignedMembers = useMemo(() => {
    return Array.isArray(data?.assigned_members) ? data.assigned_members : [];
  }, [data]);

  const todaySessions = useMemo(() => {
    return Array.isArray(data?.today_sessions) ? data.today_sessions : [];
  }, [data]);

  const todayClassesList = useMemo(() => {
    return Array.isArray(data?.today_classes_list) ? data.today_classes_list : [];
  }, [data]);

  const athleteAlerts = useMemo(() => {
    return Array.isArray(data?.athlete_alerts) ? data.athlete_alerts : [];
  }, [data]);

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

  // Handle Class Roster Modal
  const handleOpenClassRoster = async (cls) => {
    setSelectedClassForRoster(cls);
    setIsRosterModalOpen(true);
    setLoadingRoster(true);
    try {
      const res = await apiClient.getFitnessClassRoster(cls.id);
      const dataPayload = res?.data || res;
      const bookings = dataPayload?.bookings || (Array.isArray(dataPayload) ? dataPayload : []);
      const parsedBookings = Array.isArray(bookings) ? bookings : [];
      setClassRosterList(parsedBookings);
      setRosterMeta({
        reservedCount: dataPayload?.reserved_count ?? parsedBookings.filter((b) => b.status === 'reserved').length,
        attendedCount: dataPayload?.attended_count ?? parsedBookings.filter((b) => b.status === 'attended').length,
        totalBooked: dataPayload?.total_booked ?? parsedBookings.length,
      });
    } catch (err) {
      console.error('Failed to load class roster:', err);
      showToast('Could not load class attendee roster', 'error');
      setClassRosterList([]);
      setRosterMeta(null);
    } finally {
      setLoadingRoster(false);
    }
  };

  // Toggle Attendee Check-In / Attendance
  const handleToggleAttendeeCheckIn = async (bookingId, currentStatus) => {
    if (!selectedClassForRoster) return;
    const nextStatus = currentStatus === 'attended' ? 'reserved' : 'attended';
    setUpdatingBookingId(bookingId);
    try {
      await apiClient.checkInClassBooking(selectedClassForRoster.id, bookingId, nextStatus);
      setClassRosterList((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
      );
      setRosterMeta((prev) => {
        if (!prev) return prev;
        const deltaAttended = nextStatus === 'attended' ? 1 : -1;
        const deltaReserved = nextStatus === 'reserved' ? 1 : -1;
        return {
          ...prev,
          attendedCount: Math.max(0, prev.attendedCount + deltaAttended),
          reservedCount: Math.max(0, prev.reservedCount + deltaReserved),
        };
      });
      showToast(
        nextStatus === 'attended'
          ? 'Attendee marked as Attended (Checked In)!'
          : 'Attendee status reverted to Reserved.'
      );
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update attendee status:', err);
      showToast('Failed to update attendee check-in status', 'error');
    } finally {
      setUpdatingBookingId(null);
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
    return <TrainerDashboardSkeleton />;
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

      {/* ─── Top Dashboard Quick Actions Row ───────────────────────────── */}
      <section className="clean-dash-header-row" style={{ marginBottom: 8, justifyContent: 'flex-end' }}>
        <div className="clean-dash-actions">
          <button
            type="button"
            className="btn-clean-add-member"
            onClick={() => {
              document.getElementById('quick-workout-logger')?.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Jump to Quick Workout Logger"
          >
            <Icons.Plus size={15} />
            <span>+ Log Workout</span>
          </button>
          {onNavigate && (
            <>
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => onNavigate('exercises')}
                title="Open Exercise Library"
              >
                <Icons.Dumbbell size={15} />
                <span>Exercise Library →</span>
              </button>
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => onNavigate('progress')}
                title="Open Member Progress & Logs"
              >
                <Icons.Activity size={15} />
                <span>Member Progress →</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* ─── Athlete Alerts (Suspended / Inactive Members on Coach Roster) ─── */}
      {athleteAlerts.length > 0 ? (
        <div className="urgent-alerts-container" style={{ marginBottom: 16 }}>
          <div className="urgent-alerts-panel">
            <div className="urgent-alerts-topbar">
              <div className="urgent-alerts-title-wrap">
                <div className="urgent-alert-icon-pulse">
                  <Icons.AlertTriangle size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="urgent-alerts-heading" style={{ margin: 0 }}>
                      Athlete Status & Coaching Alerts
                    </h3>
                    <span className="urgent-badge danger">{athleteAlerts.length} Action Needed</span>
                  </div>
                  <p className="urgent-alerts-subtext" style={{ margin: '2px 0 0' }}>
                    Assigned athlete accounts suspended by management or with inactive passes. 1-on-1 PT sessions are paused.
                  </p>
                </div>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  className="urgent-alerts-viewall-btn"
                  onClick={() => onNavigate('members')}
                >
                  <span>View in My Athletes →</span>
                </button>
              )}
            </div>

            <div className="urgent-alerts-grid" style={{ marginTop: 10 }}>
              {athleteAlerts.map((alt) => (
                <div key={alt.id} className={`urgent-item-card ${alt.type === 'suspended' ? 'danger' : 'warning'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className={`urgent-badge ${alt.type === 'suspended' ? 'danger' : 'warning'}`}>
                          {alt.type === 'suspended' ? 'SUSPENDED' : 'INACTIVE'}
                        </span>
                        <span className="urgent-member-name">{alt.name}</span>
                        <span className="urgent-member-code">{alt.member_code}</span>
                      </div>
                      <div className="urgent-item-desc">{alt.message}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div className="urgent-item-meta">
                      {alt.type === 'suspended' ? `By: ${alt.suspended_by}` : 'Pass Inactive'}
                    </div>
                    {onNavigate && (
                      <button
                        type="button"
                        className={`urgent-action-btn ${alt.type === 'suspended' ? 'danger' : 'warning'}`}
                        onClick={() => onNavigate('members', { search: alt.name })}
                      >
                        Inspect Athlete →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="urgent-allclear-strip" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icons.CheckCircle size={20} />
            <div>
              <div className="urgent-allclear-title">Coached Athlete Roster: All Normal</div>
              <div className="urgent-allclear-desc">
                0 suspended athlete accounts and all assigned member passes are active.
              </div>
            </div>
          </div>
          {onNavigate && (
            <button
              type="button"
              className="urgent-alerts-viewall-btn"
              onClick={() => onNavigate('members')}
            >
              <span>My Athletes ({assignedMembers.length}) →</span>
            </button>
          )}
        </div>
      )}

      {/* ─── 5 Core Coaching Metric Cards (Unified Clean KPI Grid) ────────── */}
      <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 16 }}>
        {/* Metric 1: Assigned Members */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Assigned Members</span>
            <div className="clean-kpi-icon" title="Assigned Members" style={{ color: '#ff7a00', background: 'rgba(255, 122, 0, 0.1)' }}>
              <Icons.Users size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.active_mentees ?? 0}</div>
          <span className="kpi-trend trend-positive">
            {stats.active_mentees ?? 0} / {stats.mentees_capacity || 15} Capacity ({Math.max(0, (stats.mentees_capacity || 15) - (stats.active_mentees ?? 0))} open)
          </span>
        </div>

        {/* Metric 2: Today's Sessions */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Today's Sessions</span>
            <div className="clean-kpi-icon" title="Today's Sessions" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
              <Icons.Calendar size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.today_sessions ?? 0}</div>
          <span className="kpi-trend trend-positive">
            {stats.today_completed ?? 0} Completed · {Math.max(0, (stats.today_sessions ?? 0) - (stats.today_completed ?? 0))} Scheduled
          </span>
        </div>

        {/* Metric 3: Today's Group Classes */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Today's Group Classes</span>
            <div className="clean-kpi-icon" title="Today's Group Classes" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)' }}>
              <Icons.Dumbbell size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.today_classes ?? 0}</div>
          <span className="kpi-trend trend-neutral">
            {stats.classes_count ?? 0} total on weekly schedule
          </span>
        </div>

        {/* Metric 4: Active Workout Plans */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Active Workout Plans</span>
            <div className="clean-kpi-icon" title="Active Workout Plans" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <Icons.Activity size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.active_workout_plans ?? 0}</div>
          <span className="kpi-trend trend-positive">
            Assigned & active routines
          </span>
        </div>

        {/* Metric 5: Upcoming Sessions */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Upcoming Sessions</span>
            <div className="clean-kpi-icon" title="Upcoming Sessions" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
              <Icons.Clock size={16} />
            </div>
          </div>
          <div className="kpi-value">{stats.upcoming_sessions ?? 0}</div>
          <span className="kpi-trend trend-neutral">
            Future 1-on-1 PT bookings
          </span>
        </div>
      </section>

      {/* ─── 1. Today's Coaching Schedule Section ─────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icons.Calendar size={18} color="#ff7a00" />
                  <span>Today's Coaching Schedule</span>
                </h3>
                <div style={{ fontSize: 12, color: 'var(--gym-text-muted, #64748b)', marginTop: 2 }}>
                  Personal training sessions and group classes are managed separately
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
              {/* Column 1: Today's 1-on-1 PT Sessions */}
              <div className="coach-tab-panel" style={{ margin: 0, padding: 18 }}>
                <div className="coach-panel-header" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Calendar size={15} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                        1-on-1 Personal Training
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--gym-text-muted, #64748b)' }}>Individual athlete sessions</span>
                    </div>
                  </div>
                  <span className="coach-tag" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: 11, fontWeight: 700 }}>
                    {todaySessions.length} {todaySessions.length === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>

                {todaySessions.length === 0 ? (
                  <div className="coach-empty-box" style={{ padding: '28px 16px' }}>
                    <Icons.Calendar size={22} color="#94a3b8" />
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gym-text-primary, #0f172a)', marginTop: 6 }}>No 1-on-1 PT Sessions Today</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                      New sessions are scheduled and assigned by Reception & Admin.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {todaySessions.map((session) => {
                      const athlete = session.member || {};
                      const isCompleted = session.status === 'completed';
                      return (
                        <div
                          key={session.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--gym-card-border, #e2e8f0)',
                            background: 'var(--gym-bg, #f8fafc)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ff7a00, #ea580c)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 14,
                                flexShrink: 0,
                              }}
                            >
                              {athlete.name ? athlete.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gym-text-primary, #0f172a)' }}>
                                {athlete.name || 'Assigned Member'}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--gym-text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Icons.Clock size={12} />
                                <span>
                                  {session.scheduled_start
                                    ? new Date(session.scheduled_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    : 'Flexible'}
                                </span>
                                <span>•</span>
                                <span style={{ color: '#ff7a00', fontWeight: 600 }}>{session.focus_area || 'General Coaching'}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`coach-tag coach-tag-${session.status || 'scheduled'}`} style={{ fontSize: 11 }}>
                              {session.status}
                            </span>
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleOpenCompleteModal(session)}
                                style={{
                                  height: 28,
                                  padding: '0 10px',
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  borderRadius: 6,
                                  border: 'none',
                                  background: '#10b981',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Icons.Check size={12} />
                                <span>Complete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Column 2: Today's Group Fitness Classes */}
              <div className="coach-tab-panel" style={{ margin: 0, padding: 18 }}>
                <div className="coach-panel-header" style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Dumbbell size={15} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                        Today's Group Classes
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--gym-text-muted, #64748b)' }}>Studio group workouts & drills</span>
                    </div>
                  </div>
                  <span className="coach-tag" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)', fontSize: 11, fontWeight: 700 }}>
                    {todayClassesList.length} {todayClassesList.length === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>

                {todayClassesList.length === 0 ? (
                  <div className="coach-empty-box" style={{ padding: '28px 16px' }}>
                    <Icons.Dumbbell size={22} color="#94a3b8" />
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gym-text-primary, #0f172a)', marginTop: 6 }}>No Group Classes Today</div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                      No studio classes scheduled for your shift today.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {todayClassesList.map((cls) => (
                      <div
                        key={cls.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          border: '1px solid var(--gym-card-border, #e2e8f0)',
                          background: 'var(--gym-bg, #f8fafc)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 8,
                              background: 'rgba(168, 85, 247, 0.1)',
                              color: '#a855f7',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icons.Dumbbell size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gym-text-primary, #0f172a)' }}>
                              {cls.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--gym-text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Icons.Clock size={12} />
                              <span>
                                {cls.start_time
                                  ? new Date(cls.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                  : 'TBD'}
                              </span>
                              <span>•</span>
                              <span>{cls.room || 'Main Studio'}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontWeight: 600,
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                            }}
                          >
                            {cls.booked_count || 0} / {cls.capacity} Enrolled
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenClassRoster(cls)}
                            style={{
                              height: 28,
                              padding: '0 10px',
                              fontSize: 11.5,
                              fontWeight: 600,
                              borderRadius: 6,
                              border: '1px solid rgba(168, 85, 247, 0.3)',
                              background: 'rgba(168, 85, 247, 0.08)',
                              color: '#a855f7',
                              cursor: 'pointer',
                            }}
                          >
                            Roster
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      {/* ─── 2. Coaching Tools: Exercise Library & Member Progress Hub ──── */}
      <div id="trainer-tools-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {/* Exercise Library Quick Card */}
        <div className="coach-tab-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(255, 122, 0, 0.12)',
                    color: '#ff7a00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 122, 0, 0.25)',
                  }}
                >
                  <Icons.Dumbbell size={22} color="#ff7a00" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                    Exercise Library
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                    Master movements, muscle targeting & technique guides
                  </p>
                </div>
              </div>
              <span className="badge-class-status active" style={{ fontSize: 11 }}>
                Catalog
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--gym-text-secondary, #334155)', margin: '10px 0 16px', lineHeight: 1.5 }}>
              Browse comprehensive exercise movements categorized by muscle groups (Chest, Back, Legs, Shoulders, Arms, Core) and difficulty levels with detailed coaching execution notes.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].map((grp) => (
                <span
                  key={grp}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'var(--gym-bg-secondary, rgba(255, 122, 0, 0.08))',
                    color: 'var(--gym-text-primary, #0f172a)',
                    border: '1px solid var(--gym-card-border, #e2e8f0)',
                  }}
                >
                  {grp}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--gym-card-border, #e2e8f0)' }}>
            {onNavigate && (
              <button
                type="button"
                className="coach-btn-primary"
                onClick={() => onNavigate('exercises')}
                style={{ height: 36, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}
              >
                <Icons.Dumbbell size={14} />
                <span>Open Exercise Library →</span>
              </button>
            )}
          </div>
        </div>

        {/* Member Progress & Logs Quick Card */}
        <div className="coach-tab-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <Icons.Activity size={22} color="#3b82f6" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                    Member Progress & Analytics
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                    Track progressive overload, PRs, sets & RPE intensity
                  </p>
                </div>
              </div>
              <span className="badge-class-status active" style={{ fontSize: 11, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                {stats.active_mentees ?? 0} Coached
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--gym-text-secondary, #334155)', margin: '10px 0 16px', lineHeight: 1.5 }}>
              Monitor individualized workout logs and performance tracking strictly scoped to your assigned athletes. Record working sets, measure total tonnage, and verify progression overload.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--gym-bg-secondary, #f8fafc)', border: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #64748b)' }}>Assigned Athletes</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{stats.active_mentees ?? 0} Members</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--gym-bg-secondary, #f8fafc)', border: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #64748b)' }}>Active Routines</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{stats.active_workout_plans ?? 0} Plans</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--gym-card-border, #e2e8f0)' }}>
            {onNavigate && (
              <button
                type="button"
                className="coach-btn-primary"
                onClick={() => onNavigate('progress')}
                style={{ height: 36, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', background: '#3b82f6', borderColor: '#2563eb' }}
              >
                <Icons.Activity size={14} />
                <span>Open Member Progress →</span>
              </button>
            )}
          </div>
        </div>
      </div>





      {/* ─── 3. Quick Workout & Progress Logger ─────────────────────────── */}
      <div id="quick-workout-logger" className="coach-tab-panel">
        <div className="coach-panel-header">
          <div>
            <h3 className="coach-panel-title">
              <Icons.Activity size={18} color="#ff7a00" />
              <span>Quick Workout & Progress Logger</span>
            </h3>
            <span style={{ fontSize: 12, color: 'var(--gym-text-muted, #94a3b8)', marginTop: 2, display: 'block' }}>
              Record personal bests, load, and performance feedback for coached athletes
            </span>
          </div>
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

      {/* ─── MODAL: Complete Session & Log Feedback ─────────────────────── */}
      {isCompleteModalOpen && sessionToComplete && (
        <div
          className="gym-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16,
          }}
          onClick={() => setIsCompleteModalOpen(false)}
        >
          <div
            className="gym-modal-card"
            style={{
              maxWidth: 460,
              width: '100%',
              background: 'var(--gym-card-bg, #ffffff)',
              color: 'var(--gym-text-primary, #0f172a)',
              borderRadius: 16,
              border: '1px solid var(--gym-card-border, #e2e8f0)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              maxHeight: 'calc(100vh - 40px)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* ─── MODAL 3: Interactive Class Roster & Check-In Drawer ──────────── */}
      {isRosterModalOpen && selectedClassForRoster && (
        <div
          className="gym-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={() => setIsRosterModalOpen(false)}
        >
          <div
            className="gym-modal-card"
            style={{
              maxWidth: 720,
              width: '100%',
              minHeight: 560,
              background: 'var(--gym-card-bg, #ffffff)',
              color: 'var(--gym-text-primary, #0f172a)',
              borderRadius: 18,
              border: '1px solid var(--gym-card-border, #e2e8f0)',
              boxShadow: '0 25px 65px -10px rgba(0, 0, 0, 0.35), 0 10px 20px -5px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              maxHeight: 'calc(100vh - 48px)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top gradient highlight strip */}
            <div style={{ height: 4, width: '100%', background: 'linear-gradient(90deg, #ff7a00, #ea580c, #f59e0b)' }} />

            {/* Modal Header */}
            <div
              className="gym-modal-header"
              style={{
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                borderBottom: '1px solid var(--gym-card-border, #e2e8f0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.14), rgba(245, 158, 11, 0.08))',
                    border: '1px solid rgba(255, 122, 0, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff7a00',
                    flexShrink: 0,
                  }}
                >
                  <Icons.Users size={22} color="#ff7a00" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)', letterSpacing: '-0.01em' }}>
                      {selectedClassForRoster.name || 'Class Roster'}
                    </h3>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(255, 122, 0, 0.12)',
                        color: '#ff7a00',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Class Roster
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--gym-text-muted, #64748b)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>📍 {selectedClassForRoster.room || 'Main Studio'}</span>
                    <span>·</span>
                    <span>👥 Max Capacity: {selectedClassForRoster.capacity || 20} Athletes</span>
                    {selectedClassForRoster.start_time && (
                      <>
                        <span>·</span>
                        <span>⏰ {new Date(selectedClassForRoster.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Structured Actions: Refresh & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleOpenClassRoster(selectedClassForRoster)}
                  disabled={loadingRoster}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    height: 35,
                    padding: '0 13px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: '1px solid var(--gym-card-border, #cbd5e1)',
                    background: 'var(--gym-card-bg, #ffffff)',
                    color: 'var(--gym-text-primary, #0f172a)',
                    cursor: loadingRoster ? 'wait' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Reload latest attendees from server"
                >
                  <Icons.RotateCw
                    size={14}
                    color="#ff7a00"
                    style={{
                      animation: loadingRoster ? 'spin 0.8s linear infinite' : 'none',
                    }}
                  />
                  <span>{loadingRoster ? 'Refreshing...' : 'Refresh Roster'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRosterModalOpen(false)}
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: 8,
                    border: '1px solid var(--gym-card-border, #cbd5e1)',
                    background: 'var(--gym-card-bg, #ffffff)',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Close Roster"
                >
                  <Icons.X size={16} />
                </button>
              </div>
            </div>

            {/* Attendance KPI Cards Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                padding: '12px 24px',
                background: 'var(--gym-bg-subtle, #f8fafc)',
                borderBottom: '1px solid var(--gym-card-border, #e2e8f0)',
              }}
            >
              <div style={{ background: 'var(--gym-card-bg, #ffffff)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gym-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Enrolled</span>
                  <Icons.Users size={14} color="#ff7a00" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)', marginTop: 2 }}>
                  {classRosterList.length} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>/ {selectedClassForRoster.capacity || 20}</span>
                </div>
                <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.round((classRosterList.length / (selectedClassForRoster.capacity || 20)) * 100))}%`,
                      background: 'linear-gradient(90deg, #ff7a00, #ea580c)',
                    }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Checked In</span>
                  <Icons.CheckCircle size={14} color="#10b981" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 2 }}>
                  {rosterMeta?.attendedCount ?? classRosterList.filter((b) => b.status === 'attended').length}
                </div>
                <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>In Studio Now</span>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(59, 130, 246, 0.22)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending</span>
                  <Icons.Clock size={14} color="#3b82f6" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#3b82f6', marginTop: 2 }}>
                  {rosterMeta?.reservedCount ?? classRosterList.filter((b) => b.status !== 'attended').length}
                </div>
                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Reserved Athletes</span>
              </div>
            </div>

            {/* Modal Body: Attendee Cards List */}
            <div
              className="gym-modal-body"
              style={{
                minHeight: 340,
                maxHeight: 480,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '20px 24px',
              }}
            >
              {loadingRoster ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: 'var(--gym-card-bg, #ffffff)',
                        border: '1px solid var(--gym-card-border, #e2e8f0)',
                        borderRadius: 12,
                        gap: 16,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 13, flex: 1 }}>
                        <div className="trainer-skeleton-pulse" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                          <div className="trainer-skeleton-pulse" style={{ width: 160, height: 14 }} />
                          <div className="trainer-skeleton-pulse" style={{ width: 120, height: 12 }} />
                        </div>
                      </div>
                      <div className="trainer-skeleton-pulse" style={{ width: 85, height: 34, borderRadius: 8 }} />
                    </div>
                  ))}
                </div>
              ) : classRosterList.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '50px 24px',
                    color: '#64748b',
                    background: 'var(--gym-bg-subtle, #f8fafc)',
                    borderRadius: 14,
                    border: '1px dashed var(--gym-card-border, #cbd5e1)',
                    margin: 'auto 0',
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: 'rgba(255, 122, 0, 0.1)',
                      color: '#ff7a00',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <Icons.Users size={26} color="#ff7a00" />
                  </div>
                  <strong style={{ display: 'block', fontSize: 15, color: 'var(--gym-text-primary, #0f172a)' }}>
                    No Enrolled Members Yet
                  </strong>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', maxWidth: 360, marginInline: 'auto' }}>
                    Athletes can book this class through the reception desk, the kiosk scanner, or their member portal.
                  </p>
                </div>
              ) : (
                classRosterList.map((item) => {
                  const member = item?.member || item || {};
                  const isAttended = item?.status === 'attended';
                  const isUpdating = updatingBookingId === item?.id;

                  return (
                    <div
                      key={item?.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: isAttended ? 'rgba(16, 185, 129, 0.04)' : 'var(--gym-card-bg, #ffffff)',
                        border: isAttended ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--gym-card-border, #e2e8f0)',
                        borderRadius: 12,
                        gap: 16,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Left: Avatar & Member Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 13, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 10,
                            background: isAttended
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : 'linear-gradient(135deg, #ff7a00, #ea580c)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 15,
                            flexShrink: 0,
                            boxShadow: isAttended ? '0 4px 10px rgba(16, 185, 129, 0.3)' : '0 4px 10px rgba(255, 122, 0, 0.3)',
                          }}
                        >
                          {member.photo ? (
                            <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                          ) : (
                            member.name?.charAt(0).toUpperCase() || 'M'
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <strong
                            style={{
                              fontSize: 14.5,
                              fontWeight: 700,
                              display: 'block',
                              color: 'var(--gym-text-primary, #0f172a)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {member.name || 'Enrolled Member'}
                          </strong>
                          <div style={{ fontSize: 12, color: 'var(--gym-text-muted, #64748b)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Icons.Phone size={12} color="#94a3b8" />
                              <span>{member.phone || 'No phone'}</span>
                            </span>
                            <span>·</span>
                            <span
                              style={{
                                padding: '1px 7px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                background: 'rgba(255, 122, 0, 0.08)',
                                color: '#ff7a00',
                                border: '1px solid rgba(255, 122, 0, 0.2)',
                              }}
                            >
                              {member.plan_name || 'Standard Pass'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Pill & Check-In Action Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {isAttended ? (
                          <>
                            <span
                              style={{
                                padding: '5px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Icons.Check size={13} color="#059669" />
                              <span>Attended</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendeeCheckIn(item.id, item.status)}
                              disabled={isUpdating}
                              style={{
                                height: 32,
                                padding: '0 10px',
                                fontSize: 11.5,
                                fontWeight: 600,
                                borderRadius: 6,
                                border: '1px solid var(--gym-card-border, #cbd5e1)',
                                background: 'transparent',
                                color: 'var(--gym-text-muted, #64748b)',
                                cursor: isUpdating ? 'wait' : 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title="Revert status to Reserved"
                            >
                              {isUpdating ? 'Saving...' : 'Revert'}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleAttendeeCheckIn(item.id, item.status)}
                            disabled={isUpdating}
                            style={{
                              height: 35,
                              padding: '0 18px',
                              fontSize: 12.5,
                              fontWeight: 700,
                              borderRadius: 8,
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#ffffff',
                              cursor: isUpdating ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 3px 8px rgba(16, 185, 129, 0.28)',
                              transition: 'all 0.15s ease',
                              opacity: isUpdating ? 0.7 : 1,
                            }}
                            title="Mark athlete as Checked In"
                          >
                            {isUpdating ? (
                              'Saving...'
                            ) : (
                              <>
                                <Icons.CheckCircle size={14} color="#ffffff" />
                                <span>Check In</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="gym-modal-footer"
              style={{
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--gym-card-border, #e2e8f0)',
                background: 'var(--gym-bg-subtle, #f8fafc)',
              }}
            >
              <div style={{ fontSize: 12.5, color: 'var(--gym-text-muted, #64748b)' }}>
                Showing <strong>{classRosterList.length}</strong> registered {classRosterList.length === 1 ? 'athlete' : 'athletes'}
              </div>
              <button
                type="button"
                className="coach-btn-secondary"
                onClick={() => setIsRosterModalOpen(false)}
                style={{ height: 36, padding: '0 22px', fontSize: 13, borderRadius: 8, fontWeight: 700 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
