import { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../services/api';
import './TrainerDashboard.css';

const Icons = {
  Activity: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  TrendingUp: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
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
  Dumbbell: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.41 1.41a2 2 0 0 1-2.83 0l-1.41-1.41a2 2 0 0 0-2.83 0L7 22.5" />
      <path d="m3 3 1 1a2 2 0 0 0 2.83 0l1.41-1.41a2 2 0 0 1 2.83 0l1.41 1.41a2 2 0 0 0 2.83 0L17 1.5" />
    </svg>
  ),
  Award: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  CheckCircle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Search: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Plus: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

function MemberProgressSkeleton() {
  return (
    <div className="clean-reception-dashboard" style={{ animation: 'trainerHubFadeIn 0.2s ease-out' }}>
      {/* Top Header Action Row Skeleton */}
      <section className="clean-dash-header-row" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="trainer-skeleton-pulse" style={{ width: 220, height: 26, borderRadius: 6 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 340, height: 14, borderRadius: 4 }} />
        </div>
        <div className="clean-dash-actions" style={{ gap: 10 }}>
          <div className="trainer-skeleton-pulse" style={{ width: 130, height: 36, borderRadius: 8 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 140, height: 36, borderRadius: 8 }} />
        </div>
      </section>

      {/* Athlete Selector Strip Skeleton */}
      <div className="coach-tab-panel" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="trainer-skeleton-pulse" style={{ width: 90, height: 16, borderRadius: 4 }} />
            <div className="trainer-skeleton-pulse" style={{ width: 280, height: 38, borderRadius: 8 }} />
          </div>
          <div className="trainer-skeleton-pulse" style={{ width: 180, height: 18, borderRadius: 4 }} />
        </div>
      </div>

      {/* 4 Performance KPI Badges Skeleton */}
      <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="clean-kpi-card" style={{ gap: 10 }}>
            <div className="clean-kpi-top">
              <div className="trainer-skeleton-pulse" style={{ width: '55%', height: 14, borderRadius: 4 }} />
              <div className="trainer-skeleton-pulse" style={{ width: 32, height: 32, borderRadius: 8 }} />
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: '45%', height: 28, borderRadius: 6, margin: '6px 0' }} />
            <div className="trainer-skeleton-pulse" style={{ width: '60%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </section>

      {/* 2-Column Split: Log Form Card & Workout History Table Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        <div className="coach-tab-panel" style={{ padding: '20px' }}>
          <div className="trainer-skeleton-pulse" style={{ width: '45%', height: 20, borderRadius: 6, marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="trainer-skeleton-pulse" style={{ width: '100%', height: 38, borderRadius: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="trainer-skeleton-pulse" style={{ height: 38, borderRadius: 8 }} />
              <div className="trainer-skeleton-pulse" style={{ height: 38, borderRadius: 8 }} />
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: '100%', height: 60, borderRadius: 8 }} />
            <div className="trainer-skeleton-pulse" style={{ width: '100%', height: 40, borderRadius: 8, marginTop: 6 }} />
          </div>
        </div>

        <div className="coach-tab-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="trainer-skeleton-pulse" style={{ width: '35%', height: 20, borderRadius: 6 }} />
            <div className="trainer-skeleton-pulse" style={{ width: 140, height: 30, borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="trainer-skeleton-pulse" style={{ width: '100%', height: 36, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemberProgress({ initialMemberId = null, initialExerciseId = null, onNavigate }) {
  // State: Assigned athletes list
  const [assignedAthletes, setAssignedAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(initialMemberId || '');
  const [isLoadingAthletes, setIsLoadingAthletes] = useState(true);

  // State: Workout logs for selected athlete
  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // State: Exercise Library list for dropdown
  const [exercises, setExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // State: Record Set form
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [logForm, setLogForm] = useState({
    exercise_id: initialExerciseId || '',
    set_number: 1,
    reps_completed: 10,
    weight_used: 50,
    weight_unit: 'kg',
    rpe: 8,
    notes: '',
  });

  // 1. Load trainer's assigned athletes (strictly scoped to this trainer)
  const loadAssignedAthletes = useCallback(async () => {
    setIsLoadingAthletes(true);
    try {
      const res = await apiClient.getTrainerDashboard();
      const athletes = Array.isArray(res?.data?.assigned_members) ? res.data.assigned_members : [];
      setAssignedAthletes(athletes);

      if (athletes.length > 0) {
        // If initialMemberId is provided and exists in assigned list, select it; otherwise default to first
        const found = initialMemberId ? athletes.find((a) => String(a.member_id) === String(initialMemberId)) : null;
        setSelectedAthleteId(found ? String(found.member_id) : String(athletes[0].member_id));
      }
    } catch (err) {
      console.error('Failed to load assigned athletes:', err);
      showToast('Could not load assigned athletes list', 'error');
    } finally {
      setIsLoadingAthletes(false);
    }
  }, [initialMemberId]);

  // 2. Load exercise library for dropdown
  const loadExercises = useCallback(async () => {
    try {
      const res = await apiClient.getExercises();
      const list = Array.isArray(res?.data) ? res.data : [];
      setExercises(list);
      if (list.length > 0 && !logForm.exercise_id) {
        setLogForm((prev) => ({ ...prev, exercise_id: initialExerciseId || list[0].id }));
      }
    } catch (err) {
      console.error('Failed to load exercises for progress tracker:', err);
    }
  }, [initialExerciseId, logForm.exercise_id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssignedAthletes();
      loadExercises();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAssignedAthletes, loadExercises]);

  // 3. Load workout logs whenever selected athlete changes
  const loadMemberLogs = useCallback(async (mId) => {
    if (!mId) {
      setLogs([]);
      return;
    }
    setIsLoadingLogs(true);
    try {
      const res = await apiClient.getWorkoutLogs({ member_id: mId });
      setLogs(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load athlete workout logs:', err);
      showToast(err.message || 'Failed to load athlete logs', 'error');
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAthleteId) {
      const timer = setTimeout(() => {
        loadMemberLogs(selectedAthleteId);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedAthleteId, loadMemberLogs]);

  // Selected athlete object
  const selectedAthlete = useMemo(() => {
    return assignedAthletes.find((a) => String(a.member_id) === String(selectedAthleteId)) || null;
  }, [assignedAthletes, selectedAthleteId]);

  // Athlete Progress KPI calculations
  const metrics = useMemo(() => {
    if (logs.length === 0) {
      return { totalSets: 0, maxWeight: 0, totalVolume: 0, avgRpe: 0, topExercise: '—' };
    }

    let maxWeight = 0;
    let totalVolume = 0;
    let rpeSum = 0;
    let rpeCount = 0;
    const exCountMap = {};

    logs.forEach((l) => {
      const weight = Number(l.weight_used) || 0;
      const reps = Number(l.reps_completed) || 0;
      if (weight > maxWeight) maxWeight = weight;
      totalVolume += weight * reps;

      if (l.rpe) {
        rpeSum += Number(l.rpe);
        rpeCount++;
      }

      const exName = l.exercise?.name || 'Exercise';
      exCountMap[exName] = (exCountMap[exName] || 0) + 1;
    });

    let topExercise = '—';
    let topCount = 0;
    Object.entries(exCountMap).forEach(([name, count]) => {
      if (count > topCount) {
        topCount = count;
        topExercise = name;
      }
    });

    return {
      totalSets: logs.length,
      maxWeight,
      totalVolume,
      avgRpe: rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : '—',
      topExercise,
    };
  }, [logs]);

  // Handle Log Set Submit
  const handleLogSetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAthleteId || !logForm.exercise_id) return;

    setIsSubmittingLog(true);
    try {
      const payload = {
        member_id: Number(selectedAthleteId),
        exercise_id: Number(logForm.exercise_id),
        set_number: Number(logForm.set_number),
        reps_completed: Number(logForm.reps_completed),
        weight_used: Number(logForm.weight_used),
        weight_unit: logForm.weight_unit || 'kg',
        rpe: logForm.rpe ? Number(logForm.rpe) : null,
        notes: logForm.notes || '',
      };

      const res = await apiClient.logWorkoutSet(payload);
      showToast('Workout set recorded for ' + (selectedAthlete?.name || 'Athlete'));

      // If created log returned, prepend to logs
      if (res?.data) {
        setLogs((prev) => [res.data, ...prev]);
      } else {
        loadMemberLogs(selectedAthleteId);
      }

      // Increment set number for next entry
      setLogForm((prev) => ({
        ...prev,
        set_number: Number(prev.set_number) + 1,
        notes: '',
      }));
    } catch (err) {
      console.error('Failed to log workout set:', err);
      showToast(err.message || 'Failed to record workout set', 'error');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Filter logs by search
  const filteredLogs = useMemo(() => {
    if (!exerciseSearch.trim()) return logs;
    const q = exerciseSearch.toLowerCase();
    return logs.filter((l) => {
      const exName = (l.exercise?.name || '').toLowerCase();
      const notes = (l.notes || '').toLowerCase();
      const muscle = (l.exercise?.muscle_group || '').toLowerCase();
      return exName.includes(q) || notes.includes(q) || muscle.includes(q);
    });
  }, [logs, exerciseSearch]);

  if (isLoadingAthletes) {
    return <MemberProgressSkeleton />;
  }

  return (
    <div className="clean-reception-dashboard" style={{ animation: 'trainerHubFadeIn 0.2s ease-out' }}>
      {/* Toast Alert */}
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
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>✓ {toast.msg}</span>
        </div>
      )}

      {/* Top Header Action Row */}
      <section className="clean-dash-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="clean-dash-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icons.TrendingUp size={24} color="#3b82f6" />
            <span>Member Progress</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gym-text-muted, #64748b)' }}>
            Athlete progressive overload logs, working sets, and personal record tracking
          </p>
        </div>
        <div className="clean-dash-actions">
          {onNavigate && (
            <button
              type="button"
              className="btn-clean-schedule"
              onClick={() => onNavigate('dashboard')}
            >
              <span>← Trainer Overview</span>
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              className="btn-clean-schedule"
              onClick={() => onNavigate('exercises')}
            >
              <Icons.Dumbbell size={14} color="#ff7a00" />
              <span>Exercise Library →</span>
            </button>
          )}
        </div>
      </section>

      {/* No Assigned Athletes Case */}
      {assignedAthletes.length === 0 ? (
        <div className="coach-empty-box" style={{ padding: '60px 20px', background: 'var(--gym-card-bg, #ffffff)' }}>
          <div className="coach-empty-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Icons.Users size={32} />
          </div>
          <strong style={{ fontSize: 16, color: 'var(--gym-text-primary, #0f172a)' }}>
            No Assigned Athletes on Your Roster
          </strong>
          <p style={{ margin: '8px 0 14px', fontSize: 13, color: 'var(--gym-text-muted, #64748b)', maxWidth: 420 }}>
            You can only access progress records for members actively assigned to you. When reception staff or gym management assigns athletes to your coaching roster, their profiles, logs, and progression metrics will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Athlete Selector Strip */}
          <div className="coach-tab-panel" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                  Active Athlete:
                </span>
                <select
                  className="filter-input-search"
                  style={{ minWidth: 260, height: 38, fontSize: 13, borderRadius: 8, fontWeight: 600 }}
                  value={selectedAthleteId}
                  onChange={(e) => setSelectedAthleteId(e.target.value)}
                >
                  {assignedAthletes.map((a) => (
                    <option key={a.member_id} value={a.member_id}>
                      {a.name} ({a.member_code || `ID-${a.member_id}`}) · {a.plan_name || 'Standard Pass'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAthlete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                  <span>Plan: <strong style={{ color: '#ff7a00' }}>{selectedAthlete.plan_name}</strong></span>
                  <span>•</span>
                  <span>Days Left: <strong>{selectedAthlete.days_remaining ?? 'Active'}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* 4 Performance KPI Badges for Selected Athlete */}
          <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 16 }}>
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Logged Sets</span>
                <div className="clean-kpi-icon" title="Sets Recorded" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                  <Icons.Activity size={16} />
                </div>
              </div>
              <div className="kpi-value">{metrics.totalSets}</div>
              <span className="kpi-trend trend-positive">Recorded working sets</span>
            </div>

            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Heaviest Lift (PR)</span>
                <div className="clean-kpi-icon" title="Peak Weight" style={{ color: '#ff7a00', background: 'rgba(255, 122, 0, 0.1)' }}>
                  <Icons.Award size={16} />
                </div>
              </div>
              <div className="kpi-value">{metrics.maxWeight} <span style={{ fontSize: 14 }}>kg</span></div>
              <span className="kpi-trend trend-positive">Max load logged</span>
            </div>

            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Total Volume Lifted</span>
                <div className="clean-kpi-icon" title="Tonnage" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <Icons.TrendingUp size={16} />
                </div>
              </div>
              <div className="kpi-value">{metrics.totalVolume.toLocaleString()} <span style={{ fontSize: 14 }}>kg</span></div>
              <span className="kpi-trend trend-positive">Cumulative work capacity</span>
            </div>

            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Avg Workout RPE</span>
                <div className="clean-kpi-icon" title="Effort Rating" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)' }}>
                  <Icons.Dumbbell size={16} />
                </div>
              </div>
              <div className="kpi-value">{metrics.avgRpe} <span style={{ fontSize: 14 }}>/ 10</span></div>
              <span className="kpi-trend trend-neutral">Perceived exertion rating</span>
            </div>
          </section>

          {/* 2-Column Split: Form (Left) & Historical Progress Table (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, alignItems: 'start' }}>
            {/* Column 1: Record Workout Set */}
            <div className="coach-tab-panel" style={{ padding: 20 }}>
              <div className="coach-panel-header" style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255, 122, 0, 0.1)', color: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Plus size={15} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                      Record Set for {selectedAthlete?.name}
                    </h4>
                    <span style={{ fontSize: 11.5, color: 'var(--gym-text-muted, #64748b)' }}>Log progressive overload milestones</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogSetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Select Exercise *
                  </label>
                  <select
                    className="filter-input-search"
                    style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                    value={logForm.exercise_id}
                    onChange={(e) => setLogForm({ ...logForm, exercise_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Movement from Library --</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.muscle_group} · {ex.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Set #
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={logForm.set_number}
                      onChange={(e) => setLogForm({ ...logForm, set_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Reps *
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={logForm.reps_completed}
                      onChange={(e) => setLogForm({ ...logForm, reps_completed: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={logForm.weight_used}
                      onChange={(e) => setLogForm({ ...logForm, weight_used: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    RPE Rating (1 to 10 effort scale)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    className="filter-input-search"
                    style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                    value={logForm.rpe}
                    onChange={(e) => setLogForm({ ...logForm, rpe: e.target.value })}
                    placeholder="e.g. 8.5 (1-2 reps in reserve)"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Coach Technique & Effort Notes
                  </label>
                  <textarea
                    rows={2}
                    className="filter-input-search"
                    style={{ width: '100%', borderRadius: 8, fontSize: 13, padding: 8 }}
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                    placeholder="Tempo, bar speed, technical adjustments..."
                  />
                </div>

                <button
                  type="submit"
                  className="coach-btn-primary"
                  disabled={isSubmittingLog || !logForm.exercise_id}
                  style={{ height: 38, marginTop: 4, justifyContent: 'center' }}
                >
                  <Icons.CheckCircle size={15} />
                  <span>{isSubmittingLog ? 'Recording Set...' : '+ Save Workout Set'}</span>
                </button>
              </form>
            </div>

            {/* Column 2: Historical Progress Log Table */}
            <div className="coach-tab-panel" style={{ padding: 20 }}>
              <div className="coach-panel-header" style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--gym-card-border, #e2e8f0)', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.TrendingUp size={15} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                      Performance History
                    </h4>
                    <span style={{ fontSize: 11.5, color: 'var(--gym-text-muted, #64748b)' }}>
                      {filteredLogs.length} sets logged for {selectedAthlete?.name}
                    </span>
                  </div>
                </div>

                <div className="search-bar-wrapper" style={{ position: 'relative', width: 170 }}>
                  <input
                    type="text"
                    placeholder="Filter lifts..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    className="form-input search-input-field"
                    style={{ height: 30, fontSize: 11.5, paddingLeft: 28, borderRadius: 6 }}
                  />
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Icons.Search size={12} />
                  </span>
                </div>
              </div>

              {isLoadingLogs ? (
                <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1.5fr 60px 100px 50px 1fr', gap: 12, alignItems: 'center' }}>
                      <div className="trainer-skeleton-pulse" style={{ height: 16, borderRadius: 4 }} />
                      <div className="trainer-skeleton-pulse" style={{ height: 16, borderRadius: 4 }} />
                      <div className="trainer-skeleton-pulse" style={{ height: 16, borderRadius: 4 }} />
                      <div className="trainer-skeleton-pulse" style={{ height: 16, borderRadius: 4 }} />
                      <div className="trainer-skeleton-pulse" style={{ height: 16, borderRadius: 4 }} />
                      <div className="trainer-skeleton-pulse" style={{ height: 16, borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="coach-empty-box" style={{ padding: '36px 16px' }}>
                  <Icons.Activity size={24} color="#94a3b8" />
                  <strong style={{ fontSize: 13.5, color: 'var(--gym-text-primary, #0f172a)', marginTop: 6 }}>
                    No Working Sets Recorded Yet
                  </strong>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--gym-text-muted, #64748b)' }}>
                    Use the form on the left to log your first exercise set for {selectedAthlete?.name}.
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  <table className="gym-table" style={{ fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Exercise</th>
                        <th>Set</th>
                        <th>Reps × Weight</th>
                        <th>RPE</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((l) => (
                        <tr key={l.id}>
                          <td style={{ fontSize: 11.5, color: 'var(--gym-text-muted, #64748b)', whiteSpace: 'nowrap' }}>
                            {l.logged_date}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--gym-text-primary, #0f172a)' }}>
                              {l.exercise?.name || 'Movement'}
                            </strong>
                            <div style={{ fontSize: 10.5, color: '#ff7a00' }}>
                              {l.exercise?.muscle_group}
                            </div>
                          </td>
                          <td>
                            <span className="coach-tag" style={{ fontSize: 10.5, padding: '1px 6px' }}>
                              #{l.set_number}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <strong style={{ color: '#10b981' }}>
                              {l.reps_completed} reps × {l.weight_used} kg
                            </strong>
                          </td>
                          <td>
                            {l.rpe ? (
                              <span className="coach-tag" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: 10.5 }}>
                                RPE {l.rpe}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ fontSize: 11.5, color: 'var(--gym-text-muted, #64748b)' }}>
                            {l.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
