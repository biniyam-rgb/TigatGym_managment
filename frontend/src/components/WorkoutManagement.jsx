import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

export default function WorkoutManagement() {
  const { user, hasRole } = useAuth();
  const canManagePlans = hasRole('owner') || hasRole('admin') || hasRole('trainer');

  const [activeTab, setActiveTab] = useState('exercises'); // 'exercises' | 'plans' | 'logs'
  const [exercises, setExercises] = useState([]);
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Exercise filters
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);

  // Forms
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    category: 'Barbell',
    muscle_group: 'Chest',
    equipment_needed: 'Olympic Barbell & Bench',
    difficulty: 'intermediate',
    instructions: '',
  });

  const [planForm, setPlanForm] = useState({
    title: '5-Day Upper / Lower Hypertrophy',
    goal: 'Hypertrophy & Muscle Gain',
    difficulty_level: 'intermediate',
    duration_weeks: 8,
    days_per_week: 5,
    description: 'Periodized progressive overload program focusing on compound lifts followed by high volume isolation.',
  });

  const [logForm, setLogForm] = useState({
    exercise_id: '',
    set_number: 1,
    reps_completed: 10,
    weight_used: 60,
    weight_unit: 'kg',
    rpe: 8,
    notes: 'Solid tempo, clean form',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Exercises
  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getExercises({
        muscle_group: muscleFilter,
        search,
      });
      setExercises(res.data || []);
      if (res.data?.length > 0 && !logForm.exercise_id) {
        setLogForm((prev) => ({ ...prev, exercise_id: res.data[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load exercises.');
    } finally {
      setIsLoading(false);
    }
  }, [muscleFilter, search, logForm.exercise_id]);

  // Load Plans
  const loadPlans = useCallback(async () => {
    try {
      const res = await apiClient.getWorkoutPlans();
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to load workout plans:', err);
    }
  }, []);

  // Load Logs
  const loadLogs = useCallback(async () => {
    try {
      const res = await apiClient.getWorkoutLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load workout logs:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    apiClient.getExercises({ muscle_group: muscleFilter, search })
      .then((res) => {
        if (!ignore) {
          setExercises(res.data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load exercises.');
          setIsLoading(false);
        }
      });

    apiClient.getWorkoutPlans()
      .then((res) => {
        if (!ignore) setPlans(res.data || []);
      })
      .catch((err) => console.error('Failed to load workout plans:', err));

    apiClient.getWorkoutLogs()
      .then((res) => {
        if (!ignore) setLogs(res.data || []);
      })
      .catch((err) => console.error('Failed to load workout logs:', err));

    return () => {
      ignore = true;
    };
  }, [muscleFilter, search]);

  // Handle Add Exercise
  const handleAddExercise = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.createExercise(exerciseForm);
      setSuccessMessage(res.message || 'Exercise added to directory.');
      setIsAddExerciseOpen(false);
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
      setError(err.message || 'Failed to add exercise.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.createWorkoutPlan(planForm);
      setSuccessMessage(res.message || 'Workout plan published.');
      setIsAddPlanOpen(false);
      loadPlans();
    } catch (err) {
      setError(err.message || 'Failed to create plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Log Set
  const handleLogSet = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.logWorkoutSet(logForm);
      setSuccessMessage(res.message || 'Set logged successfully!');
      setLogForm((prev) => ({
        ...prev,
        set_number: prev.set_number + 1,
      }));
      loadLogs();
    } catch (err) {
      setError(err.message || 'Failed to record workout set.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  return (
    <div className="module-container">
      {/* Top Navigation Bar */}
      <div className="section-header-bar">
        <div className="section-tabs">
          <button
            type="button"
            className={`tab-pill ${activeTab === 'exercises' ? 'active' : ''}`}
            onClick={() => setActiveTab('exercises')}
          >
            🏋️ Exercises ({exercises.length})
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'plans' ? 'active' : ''}`}
            onClick={() => setActiveTab('plans')}
          >
            📋 Routine Templates ({plans.length})
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            ⏱️ Workout Tracker ({logs.length})
          </button>
        </div>

        <div className="section-actions">
          {activeTab === 'exercises' && canManagePlans && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddExerciseOpen(true)}
            >
              + Add Movement
            </button>
          )}

          {activeTab === 'plans' && canManagePlans && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsAddPlanOpen(true)}
            >
              + Create Routine
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span>✓ {successMessage}</span>
          <button type="button" className="close-btn" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <span>⚠️ {error}</span>
          <button type="button" className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Tab 1: Exercise Directory */}
      {activeTab === 'exercises' && (
        <>
          <div className="filters-toolbar" style={{ marginBottom: 20 }}>
            <div className="muscle-pills-row">
              {muscleGroups.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`filter-chip ${((m === 'All' && !muscleFilter) || muscleFilter === m) ? 'active' : ''}`}
                  onClick={() => setMuscleFilter(m === 'All' ? '' : m)}
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search movement, barbell, machine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-compact"
              style={{ minWidth: 260 }}
            />
          </div>

          {isLoading ? (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading exercise movements...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="empty-state-box">
              <div style={{ fontSize: 40, marginBottom: 12 }}>💪</div>
              <h4>No Exercises Match Your Filter</h4>
              <p>Try searching for a different muscle group or add a new exercise.</p>
              {canManagePlans && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => setIsAddExerciseOpen(true)}
                >
                  + Add First Movement
                </button>
              )}
            </div>
          ) : (
            <div className="exercises-grid">
              {exercises.map((ex) => (
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
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        setLogForm((prev) => ({ ...prev, exercise_id: ex.id }));
                        setActiveTab('logs');
                      }}
                    >
                      + Log Set
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Routine Templates */}
      {activeTab === 'plans' && (
        <div className="plans-grid">
          {plans.length === 0 ? (
            <div className="empty-state-box" style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <h4>No Workout Routines Created Yet</h4>
              <p>Create professional split routines and training templates for athletes.</p>
              {canManagePlans && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => setIsAddPlanOpen(true)}
                >
                  + Create First Routine
                </button>
              )}
            </div>
          ) : (
            plans.map((p) => (
              <div key={p.id} className="plan-card">
                <div className="plan-header">
                  <span className="goal-badge">🎯 {p.goal}</span>
                  <span className={`difficulty-badge difficulty-${p.difficulty_level}`}>
                    {p.difficulty_level}
                  </span>
                </div>
                <h3 className="plan-title">{p.title}</h3>
                <p className="plan-desc">{p.description}</p>
                <div className="plan-meta-grid">
                  <div className="plan-meta-item">
                    <span className="meta-k">Program Length</span>
                    <strong className="meta-v">{p.duration_weeks} Weeks</strong>
                  </div>
                  <div className="plan-meta-item">
                    <span className="meta-k">Frequency</span>
                    <strong className="meta-v">{p.days_per_week} Days / Week</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Member Workout Tracker & Log Form */}
      {activeTab === 'logs' && (
        <div className="logs-layout-grid">
          {/* Left Column: Quick Set Logger */}
          <div className="dashboard-card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h4>Log Exercise Set</h4>
              <span className="badge" style={{ background: 'rgba(255, 138, 0, 0.15)', color: '#ff8a00' }}>
                Live Tracking
              </span>
            </div>
            <form onSubmit={handleLogSet}>
              <div className="form-group">
                <label>Target Exercise *</label>
                <select
                  required
                  value={logForm.exercise_id}
                  onChange={(e) => setLogForm({ ...logForm, exercise_id: e.target.value })}
                >
                  <option value="">-- Choose Exercise --</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.muscle_group})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Set Number *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={logForm.set_number}
                    onChange={(e) => setLogForm({ ...logForm, set_number: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label>Reps Completed *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={logForm.reps_completed}
                    onChange={(e) => setLogForm({ ...logForm, reps_completed: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weight Used (kg) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={logForm.weight_used}
                    onChange={(e) => setLogForm({ ...logForm, weight_used: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>RPE (Exertion 1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={logForm.rpe}
                    onChange={(e) => setLogForm({ ...logForm, rpe: parseFloat(e.target.value) || 8 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Set Notes</label>
                <input
                  type="text"
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  placeholder="Drop set, pause rep, new PR..."
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting || !logForm.exercise_id}
                style={{ marginTop: 8 }}
              >
                {isSubmitting ? 'Recording Set...' : '+ Record Set to Log'}
              </button>
            </form>
          </div>

          {/* Right Column: Historical Logs Table */}
          <div className="dashboard-card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h4>Recent Session Performance</h4>
              <span className="badge">Athlete: {user?.name}</span>
            </div>
            <div className="table-responsive">
              <table className="gym-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Exercise</th>
                    <th>Set</th>
                    <th>Reps x Weight</th>
                    <th>RPE</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                        No workout sets recorded yet today. Log your first set!
                      </td>
                    </tr>
                  ) : (
                    logs.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>
                          {l.logged_date}
                        </td>
                        <td>
                          <strong>{l.exercise?.name || 'Exercise'}</strong>
                        </td>
                        <td>
                          <span className="badge">Set #{l.set_number}</span>
                        </td>
                        <td>
                          <span className="font-mono text-orange" style={{ fontWeight: 600 }}>
                            {l.reps_completed} reps × {l.weight_used} kg
                          </span>
                        </td>
                        <td>
                          {l.rpe ? <span className="rpe-badge">RPE {l.rpe}</span> : '—'}
                        </td>
                        <td style={{ fontSize: 12, color: '#cbd5e1' }}>
                          {l.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Movement */}
      {isAddExerciseOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Add Movement to Exercise Directory</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddExerciseOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddExercise}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Movement / Exercise Name *</label>
                  <input
                    type="text"
                    required
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                    placeholder="e.g. Incline Dumbbell Press, Romanian Deadlift"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Target Muscle Group *</label>
                    <select
                      value={exerciseForm.muscle_group}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, muscle_group: e.target.value })}
                    >
                      <option value="Chest">Chest</option>
                      <option value="Back">Back</option>
                      <option value="Legs">Legs</option>
                      <option value="Shoulders">Shoulders</option>
                      <option value="Arms">Arms</option>
                      <option value="Core">Core</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={exerciseForm.category}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value })}
                    >
                      <option value="Barbell">Barbell</option>
                      <option value="Dumbbell">Dumbbell</option>
                      <option value="Machine">Machine</option>
                      <option value="Cable">Cable</option>
                      <option value="Bodyweight">Bodyweight</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Equipment Needed</label>
                    <input
                      type="text"
                      value={exerciseForm.equipment_needed}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, equipment_needed: e.target.value })}
                      placeholder="Bench, Olympic Bar, Pull-up bar"
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty Level</label>
                    <select
                      value={exerciseForm.difficulty}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Execution Instructions & Cues</label>
                  <textarea
                    rows="3"
                    value={exerciseForm.instructions}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                    placeholder="Keep elbows at 45 degrees, retract scapula, slow eccentric tempo..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddExerciseOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Routine Template */}
      {isAddPlanOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create Routine Template</h3>
              <button type="button" className="close-btn" onClick={() => setIsAddPlanOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddPlan}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Routine Title *</label>
                  <input
                    type="text"
                    required
                    value={planForm.title}
                    onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                    placeholder="e.g. 12-Week Powerlifting Peak"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Primary Goal *</label>
                    <input
                      type="text"
                      required
                      value={planForm.goal}
                      onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                      placeholder="Strength, Hypertrophy, Conditioning"
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      value={planForm.difficulty_level}
                      onChange={(e) => setPlanForm({ ...planForm, difficulty_level: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (Weeks) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={planForm.duration_weeks}
                      onChange={(e) => setPlanForm({ ...planForm, duration_weeks: parseInt(e.target.value, 10) || 8 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Days Per Week *</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      required
                      value={planForm.days_per_week}
                      onChange={(e) => setPlanForm({ ...planForm, days_per_week: parseInt(e.target.value, 10) || 4 })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Routine Overview & Guidance</label>
                  <textarea
                    rows="3"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="Weekly split outline, RPE targets, and deload protocol."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddPlanOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing...' : 'Publish Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
