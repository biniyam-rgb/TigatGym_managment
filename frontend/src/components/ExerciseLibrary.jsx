import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import './TrainerDashboard.css';

const Icons = {
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
  Dumbbell: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.41 1.41a2 2 0 0 1-2.83 0l-1.41-1.41a2 2 0 0 0-2.83 0L7 22.5" />
      <path d="m3 3 1 1a2 2 0 0 0 2.83 0l1.41-1.41a2 2 0 0 1 2.83 0l1.41 1.41a2 2 0 0 0 2.83 0L17 1.5" />
    </svg>
  ),
  X: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowRight: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Activity: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Award: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
};

function ExerciseLibrarySkeleton() {
  return (
    <div className="clean-reception-dashboard" style={{ opacity: 0.95 }}>
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

      {/* 4 KPI Cards Skeleton */}
      <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="clean-kpi-card" style={{ gap: 10 }}>
            <div className="clean-kpi-top">
              <div className="trainer-skeleton-pulse" style={{ width: '55%', height: 14, borderRadius: 4 }} />
              <div className="trainer-skeleton-pulse" style={{ width: 32, height: 32, borderRadius: 8 }} />
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: '40%', height: 28, borderRadius: 6, margin: '4px 0' }} />
            <div className="trainer-skeleton-pulse" style={{ width: '65%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </section>

      {/* Toolbar Skeleton */}
      <div className="coach-tab-panel" style={{ padding: '16px 20px', marginBottom: 18 }}>
        <div className="trainer-skeleton-pulse" style={{ width: '100%', height: 38, borderRadius: 8, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="trainer-skeleton-pulse" style={{ width: 140, height: 32, borderRadius: 6 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 140, height: 32, borderRadius: 6 }} />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="exercises-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="exercise-card" style={{ minHeight: 180, gap: 12 }}>
            <div className="exercise-top">
              <div className="trainer-skeleton-pulse" style={{ width: 60, height: 18, borderRadius: 6 }} />
              <div className="trainer-skeleton-pulse" style={{ width: 75, height: 18, borderRadius: 6 }} />
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: '70%', height: 20, borderRadius: 6 }} />
            <div className="trainer-skeleton-pulse" style={{ width: '50%', height: 14, borderRadius: 4 }} />
            <div className="trainer-skeleton-pulse" style={{ width: '90%', height: 36, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Full Body',
];

const CATEGORIES = [
  'All Categories',
  'Barbell',
  'Dumbbell',
  'Machine',
  'Bodyweight',
  'Cable',
  'Kettlebell',
  'Cardio',
];

export default function ExerciseLibrary({ onNavigate }) {
  const { hasRole } = useAuth();
  const canManage = hasRole('trainer') || hasRole('owner') || hasRole('admin');

  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [muscleFilter, setMuscleFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [search, setSearch] = useState('');

  // Add Exercise Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    category: 'Barbell',
    muscle_group: 'Chest',
    equipment_needed: 'Olympic Barbell & Bench',
    difficulty: 'intermediate',
    instructions: '',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getExercises({
        muscle_group: muscleFilter,
        category: categoryFilter && categoryFilter !== 'All Categories' ? categoryFilter : '',
        search,
      });
      setExercises(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load exercises.');
    } finally {
      setIsLoading(false);
    }
  }, [muscleFilter, categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExercises();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadExercises]);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiClient.createExercise(exerciseForm);
      showToast(`Movement "${exerciseForm.name}" added to Exercise Library.`);
      setIsAddModalOpen(false);
      setExerciseForm({
        name: '',
        category: 'Barbell',
        muscle_group: 'Chest',
        equipment_needed: 'Olympic Barbell & Bench',
        difficulty: 'intermediate',
        instructions: '',
      });
      loadExercises();
    } catch (err) {
      setFormError(err.message || 'Failed to add exercise.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered view by difficulty in memory if selected
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      if (difficultyFilter && ex.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [exercises, difficultyFilter]);

  const muscleGroupsCount = useMemo(() => {
    return new Set(exercises.map((e) => e.muscle_group).filter(Boolean)).size || 6;
  }, [exercises]);

  const equipmentTypesCount = useMemo(() => {
    return new Set(exercises.map((e) => e.category).filter(Boolean)).size || 5;
  }, [exercises]);

  if (isLoading && exercises.length === 0) {
    return <ExerciseLibrarySkeleton />;
  }

  return (
    <div className="clean-reception-dashboard" style={{ animation: 'trainerHubFadeIn 0.2s ease-out' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 99999,
            background: '#10b981',
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
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Top Header Action Row */}
      <section className="clean-dash-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="clean-dash-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icons.Dumbbell size={24} color="#ff7a00" />
            <span>Exercise Library</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gym-text-muted, #64748b)' }}>
            Comprehensive movement directory and technique catalog for workout programming
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
              onClick={() => onNavigate('progress')}
            >
              <Icons.Activity size={14} color="#3b82f6" />
              <span>Member Progress →</span>
            </button>
          )}
          {canManage && (
            <button
              type="button"
              className="btn-clean-add-member"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Icons.Plus size={15} />
              <span>+ Add Movement</span>
            </button>
          )}
        </div>
      </section>

      {/* 4 Clean KPI Metric Cards */}
      <section className="clean-kpi-grid" style={{ marginBottom: 18 }}>
        {/* Card 1: Total Movements */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Total Movements</span>
            <div className="clean-kpi-icon" title="Total Movements" style={{ color: '#ff7a00', background: 'rgba(255, 122, 0, 0.1)' }}>
              <Icons.Dumbbell size={16} />
            </div>
          </div>
          <div className="kpi-value">{exercises.length}</div>
          <span className="kpi-trend trend-positive">{filteredExercises.length} in current view</span>
        </div>

        {/* Card 2: Target Muscle Groups */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Muscle Target Groups</span>
            <div className="clean-kpi-icon" title="Muscle Groups" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
              <Icons.Activity size={16} />
            </div>
          </div>
          <div className="kpi-value">{muscleGroupsCount}</div>
          <span className="kpi-trend">Chest, Back, Legs & Core</span>
        </div>

        {/* Card 3: Equipment Categories */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Equipment Types</span>
            <div className="clean-kpi-icon" title="Equipment Types" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)' }}>
              <Icons.Award size={16} />
            </div>
          </div>
          <div className="kpi-value">{equipmentTypesCount}</div>
          <span className="kpi-trend">Barbell, Machine, Free-Weight</span>
        </div>

        {/* Card 4: Skill Difficulties */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Movement Levels</span>
            <div className="clean-kpi-icon" title="Movement Levels" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <Icons.Award size={16} />
            </div>
          </div>
          <div className="kpi-value">3 Tiers</div>
          <span className="kpi-trend">Beginner to Advanced</span>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <span>⚠️ {error}</span>
          <button type="button" className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Search & Muscle Group Toolbar */}
      <div className="coach-tab-panel" style={{ padding: '16px 20px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          {/* Muscle Group Chips */}
          <div className="muscle-pills-row" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {MUSCLE_GROUPS.map((m) => {
              const isActive = (m === 'All' && !muscleFilter) || muscleFilter === m;
              return (
                <button
                  key={m}
                  type="button"
                  className={`filter-chip ${isActive ? 'active' : ''}`}
                  onClick={() => setMuscleFilter(m === 'All' ? '' : m)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="search-bar-wrapper" style={{ minWidth: 260, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search exercise, barbell, machine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input search-input-field"
              style={{
                paddingLeft: 36,
                paddingRight: 14,
                width: '100%',
                height: 38,
                fontSize: 13,
                borderRadius: 8,
              }}
            />
            <span
              className="search-bar-icon"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: '#94a3b8',
              }}
            >
              <Icons.Search size={15} />
            </span>
          </div>
        </div>

        {/* Secondary Category & Difficulty Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gym-text-muted, #64748b)' }}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-input-search"
              style={{ height: 32, fontSize: 12, borderRadius: 6 }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gym-text-muted, #64748b)' }}>Difficulty:</span>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="filter-input-search"
              style={{ height: 32, fontSize: 12, borderRadius: 6 }}
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {(muscleFilter || categoryFilter || difficultyFilter || search) && (
            <button
              type="button"
              className="coach-btn-secondary"
              onClick={() => {
                setMuscleFilter('');
                setCategoryFilter('');
                setDifficultyFilter('');
                setSearch('');
              }}
              style={{ height: 30, fontSize: 11.5, padding: '0 10px', marginLeft: 'auto' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Exercises Grid */}
      {isLoading ? (
        <div className="exercises-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="exercise-card" style={{ gap: 12, minHeight: 180 }}>
              <div className="exercise-top">
                <div className="trainer-skeleton-pulse" style={{ width: 60, height: 18, borderRadius: 6 }} />
                <div className="trainer-skeleton-pulse" style={{ width: 75, height: 18, borderRadius: 6 }} />
              </div>
              <div className="trainer-skeleton-pulse" style={{ width: '70%', height: 20, borderRadius: 6 }} />
              <div className="trainer-skeleton-pulse" style={{ width: '50%', height: 14, borderRadius: 4 }} />
              <div className="trainer-skeleton-pulse" style={{ width: '90%', height: 36, borderRadius: 6 }} />
              <div className="exercise-footer" style={{ marginTop: 'auto' }}>
                <div className="trainer-skeleton-pulse" style={{ width: 90, height: 14, borderRadius: 4 }} />
                <div className="trainer-skeleton-pulse" style={{ width: 60, height: 24, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="coach-empty-box" style={{ padding: '60px 20px' }}>
          <div className="coach-empty-icon">
            <Icons.Dumbbell size={28} />
          </div>
          <strong style={{ fontSize: 16, color: 'var(--gym-text-primary, #0f172a)' }}>
            No Exercises Found
          </strong>
          <p style={{ margin: '6px 0 14px', fontSize: 13, color: 'var(--gym-text-muted, #64748b)', maxWidth: 360 }}>
            No movement matching your filter criteria was found. Try clearing filters or add a new exercise.
          </p>
          {canManage && (
            <button
              type="button"
              className="coach-btn-primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ height: 34, fontSize: 12.5 }}
            >
              <Icons.Plus size={14} />
              <span>+ Add Movement Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="exercises-grid">
          {filteredExercises.map((ex) => (
            <div key={ex.id} className="exercise-card">
              <div className="exercise-top">
                <span className="muscle-tag">{ex.muscle_group}</span>
                <span className={`difficulty-badge difficulty-${ex.difficulty}`}>
                  {ex.difficulty}
                </span>
              </div>

              <h4 className="exercise-name">{ex.name}</h4>

              <div className="exercise-equipment">
                ⚙️ <span>{ex.equipment_needed || 'Standard Gear'}</span>
              </div>

              {ex.instructions && (
                <p className="exercise-instructions">
                  {ex.instructions}
                </p>
              )}

              <div className="exercise-footer">
                <span className="category-label">Category: {ex.category}</span>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => onNavigate('progress', { exercise_id: ex.id })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    title="Log sets with this exercise in Member Progress"
                  >
                    <span>Track</span>
                    <Icons.ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL: Add Movement ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div
          className="gym-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16,
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="gym-modal-card"
            style={{
              maxWidth: 520,
              width: '100%',
              background: 'var(--gym-card-bg, #ffffff)',
              color: 'var(--gym-text-primary, #0f172a)',
              borderRadius: 16,
              border: '1px solid var(--gym-card-border, #e2e8f0)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gym-modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Dumbbell size={18} color="#ff7a00" />
                <span>Add Movement to Exercise Library</span>
              </h3>
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => setIsAddModalOpen(false)}
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <Icons.X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateExercise}>
              <div className="gym-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: 12 }}>
                    {formError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Movement Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="filter-input-search"
                    style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                    placeholder="e.g. Romanian Deadlift, Incline Dumbbell Press"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Target Muscle Group *
                    </label>
                    <select
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={exerciseForm.muscle_group}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, muscle_group: e.target.value })}
                    >
                      {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Category / Equipment Type
                    </label>
                    <select
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={exerciseForm.category}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Equipment Needed
                    </label>
                    <input
                      type="text"
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={exerciseForm.equipment_needed}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, equipment_needed: e.target.value })}
                      placeholder="e.g. Barbell, Squat Rack, Dumbbells"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Difficulty Level
                    </label>
                    <select
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={exerciseForm.difficulty}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Execution Technique & Instructions
                  </label>
                  <textarea
                    rows={3}
                    className="filter-input-search"
                    style={{ width: '100%', borderRadius: 8, fontSize: 13, padding: 10 }}
                    value={exerciseForm.instructions}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                    placeholder="Describe setup, grip, breathing, tempo cues..."
                  />
                </div>
              </div>

              <div className="gym-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="coach-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coach-btn-primary"
                  disabled={isSubmitting || !exerciseForm.name.trim()}
                  style={{ height: 36, padding: '0 18px' }}
                >
                  {isSubmitting ? 'Saving...' : '✓ Add Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
