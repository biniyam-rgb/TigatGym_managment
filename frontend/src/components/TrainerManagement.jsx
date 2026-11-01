import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

export default function TrainerManagement() {
  const { hasRole } = useAuth();
  const canManageTrainers = hasRole('owner') || hasRole('admin');
  const canAssignOrBook = hasRole('owner') || hasRole('admin') || hasRole('receptionist');

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'sessions'
  const [trainers, setTrainers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [search, setSearch] = useState('');

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Form states
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Strength & Conditioning',
    hourly_rate: 450,
    certifications: 'ISSA Certified, Red Cross CPR',
    bio: '',
  });

  const [assignForm, setAssignForm] = useState({
    trainer_id: '',
    member_id: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  const [bookForm, setBookForm] = useState({
    trainer_id: '',
    member_id: '',
    scheduled_start: '',
    scheduled_end: '',
    focus_area: 'Technique & Hypertrophy',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Trainers
  const loadTrainers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getTrainers({ search });
      setTrainers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load trainer roster.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    try {
      const res = await apiClient.getTrainingSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to load training sessions:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    apiClient.getTrainers({ search })
      .then((res) => {
        if (!ignore) {
          setTrainers(res.data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load trainer roster.');
          setIsLoading(false);
        }
      });

    apiClient.getTrainingSessions()
      .then((res) => {
        if (!ignore) setSessions(res.data || []);
      })
      .catch((err) => console.error('Failed to load training sessions:', err));

    if (canAssignOrBook) {
      apiClient.getMembers({ per_page: 100 })
        .then((res) => {
          if (!ignore) setMembers(res.data || []);
        })
        .catch((err) => console.error('Failed to load members:', err));
    }

    return () => {
      ignore = true;
    };
  }, [search, canAssignOrBook]);

  // Handle register trainer
  const handleRegisterTrainer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.createTrainer(registerForm);
      setSuccessMessage(res.message || 'Trainer registered successfully.');
      setIsRegisterOpen(false);
      setRegisterForm({
        name: '',
        email: '',
        phone: '',
        specialization: 'Strength & Conditioning',
        hourly_rate: 450,
        certifications: 'ISSA Certified, Red Cross CPR',
        bio: '',
      });
      loadTrainers();
    } catch (err) {
      setError(err.message || 'Failed to register trainer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle assign client
  const handleAssignClient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.assignTrainer(assignForm);
      setSuccessMessage(res.message || 'Member assigned to personal coach.');
      setIsAssignOpen(false);
      loadTrainers();
    } catch (err) {
      setError(err.message || 'Failed to assign member to coach.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle book session
  const handleBookSession = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.scheduleTrainingSession(bookForm);
      setSuccessMessage(res.message || 'Training session booked successfully.');
      setIsBookOpen(false);
      loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to book session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="module-container">
      {/* Top Controls & Navigation Header */}
      <div className="section-header-bar">
        <div className="section-tabs">
          <button
            type="button"
            className={`tab-pill ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            🏋️ Coaches & Trainers ({trainers.length})
          </button>
          <button
            type="button"
            className={`tab-pill ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            ⏱️ 1-on-1 PT Sessions ({sessions.length})
          </button>
        </div>

        <div className="section-actions">
          {activeTab === 'directory' && (
            <input
              type="text"
              placeholder="Search trainer, specialization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input-compact"
            />
          )}

          {canManageTrainers && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsRegisterOpen(true)}
            >
              + Register New Coach
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

      {/* Tab 1: Trainer Directory Grid */}
      {activeTab === 'directory' && (
        <>
          {isLoading ? (
            <div className="loading-state">
              <span className="spinner"></span>
              <p>Loading Tigat Gym coaching staff...</p>
            </div>
          ) : trainers.length === 0 ? (
            <div className="empty-state-box">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️‍♂️</div>
              <h4>No Trainers Found</h4>
              <p>No trainers match your criteria or none have been registered yet.</p>
              {canManageTrainers && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => setIsRegisterOpen(true)}
                >
                  + Add First Coach
                </button>
              )}
            </div>
          ) : (
            <div className="trainers-grid">
              {trainers.map((t) => (
                <div key={t.id} className="trainer-card">
                  <div className="trainer-header">
                    <div className="trainer-avatar">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="trainer-info">
                      <h4 className="trainer-name">{t.name}</h4>
                      <span className="trainer-code-badge">
                        {t.profile?.trainer_code || `TR-${String(t.id).padStart(3, '0')}`}
                      </span>
                    </div>
                    <span className={`status-pill status-${t.status}`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="trainer-body">
                    <div className="specialization-tag">
                      🎯 {t.profile?.specialization || 'Personal Fitness'}
                    </div>

                    {t.profile?.certifications && (
                      <p className="trainer-cert">
                        📜 {t.profile.certifications}
                      </p>
                    )}

                    {t.profile?.bio && (
                      <p className="trainer-bio">
                        &quot;{t.profile.bio}&quot;
                      </p>
                    )}

                    <div className="trainer-meta-row">
                      <div className="meta-item">
                        <span className="meta-label">Hourly Rate</span>
                        <span className="meta-val price-text">
                          {(t.profile?.hourly_rate || 400).toLocaleString()} ETB/hr
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Active Clients</span>
                        <span className="meta-val clients-count">
                          {t.active_clients_count || 0} Members
                        </span>
                      </div>
                    </div>
                  </div>

                  {canAssignOrBook && (
                    <div className="trainer-footer">
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setSelectedTrainer(t);
                          setAssignForm((prev) => ({ ...prev, trainer_id: t.id }));
                          setIsAssignOpen(true);
                        }}
                      >
                        👥 Assign Athlete
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => {
                          setSelectedTrainer(t);
                          setBookForm((prev) => ({ ...prev, trainer_id: t.id }));
                          setIsBookOpen(true);
                        }}
                      >
                        ⏱️ Book PT
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab 2: 1-on-1 PT Sessions Table */}
      {activeTab === 'sessions' && (
        <div className="table-responsive">
          <table className="gym-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Coach</th>
                <th>Athlete / Member</th>
                <th>Scheduled Window</th>
                <th>Focus Area</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: '#94a3b8' }}>
                    No personal training sessions scheduled yet.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="font-mono text-orange">{s.session_code}</span>
                    </td>
                    <td>
                      <strong>{s.trainer?.name}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{s.member?.name}</strong>
                        {s.member?.member_profile?.member_code && (
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>
                            {s.member.member_profile.member_code}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {new Date(s.scheduled_start).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(s.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.scheduled_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {s.focus_area || 'Strength Training'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${s.status}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Register Trainer */}
      {isRegisterOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register New Coach & Trainer</h3>
              <button type="button" className="close-btn" onClick={() => setIsRegisterOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRegisterTrainer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="Coach Dawit Bekele"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="dawit@tigatgym.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      placeholder="+251 911 234 567"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Primary Specialization *</label>
                    <select
                      value={registerForm.specialization}
                      onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })}
                    >
                      <option value="Strength & Conditioning">Strength & Conditioning</option>
                      <option value="Bodybuilding & Hypertrophy">Bodybuilding & Hypertrophy</option>
                      <option value="Fat Loss & High Intensity">Fat Loss & High Intensity (HIIT)</option>
                      <option value="Powerlifting & Mechanics">Powerlifting & Mechanics</option>
                      <option value="Boxing & Combat Conditioning">Boxing & Combat Conditioning</option>
                      <option value="Physiotherapy & Mobility">Physiotherapy & Mobility</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Hourly Rate (ETB) *</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={registerForm.hourly_rate}
                      onChange={(e) => setRegisterForm({ ...registerForm, hourly_rate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Certifications & Qualifications</label>
                  <input
                    type="text"
                    value={registerForm.certifications}
                    onChange={(e) => setRegisterForm({ ...registerForm, certifications: e.target.value })}
                    placeholder="ISSA, NASM, Ethiopian Athletics Fed."
                  />
                </div>
                <div className="form-group">
                  <label>Coach Bio & Philosophy</label>
                  <textarea
                    rows="2"
                    value={registerForm.bio}
                    onChange={(e) => setRegisterForm({ ...registerForm, bio: e.target.value })}
                    placeholder="10+ years competitive powerlifting coach focusing on progressive overload and form mastery."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Save & Register Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Client */}
      {isAssignOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Assign Athlete to Coach {selectedTrainer?.name}</h3>
              <button type="button" className="close-btn" onClick={() => setIsAssignOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAssignClient}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Gym Member *</label>
                  <select
                    required
                    value={assignForm.member_id}
                    onChange={(e) => setAssignForm({ ...assignForm, member_id: e.target.value })}
                  >
                    <option value="">-- Choose Member --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.member_profile?.member_code || `ID-${m.id}`}) - {m.phone || m.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={assignForm.start_date}
                      onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={assignForm.end_date}
                      onChange={(e) => setAssignForm({ ...assignForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Coaching Notes / Targets</label>
                  <textarea
                    rows="2"
                    value={assignForm.notes}
                    onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                    placeholder="Preparation for 12-week body transformation / Hypertrophy block."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !assignForm.member_id}>
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Book PT Session */}
      {isBookOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Schedule 1-on-1 PT Session ({selectedTrainer?.name})</h3>
              <button type="button" className="close-btn" onClick={() => setIsBookOpen(false)}>×</button>
            </div>
            <form onSubmit={handleBookSession}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Gym Member *</label>
                  <select
                    required
                    value={bookForm.member_id}
                    onChange={(e) => setBookForm({ ...bookForm, member_id: e.target.value })}
                  >
                    <option value="">-- Choose Member --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.member_profile?.member_code || `ID-${m.id}`})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Session Start Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={bookForm.scheduled_start}
                      onChange={(e) => {
                        const start = e.target.value;
                        setBookForm((prev) => ({
                          ...prev,
                          scheduled_start: start,
                          // Default 1 hour later
                          scheduled_end: start ? new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : '',
                        }));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Session End Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={bookForm.scheduled_end}
                      onChange={(e) => setBookForm({ ...bookForm, scheduled_end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Focus Area</label>
                  <input
                    type="text"
                    value={bookForm.focus_area}
                    onChange={(e) => setBookForm({ ...bookForm, focus_area: e.target.value })}
                    placeholder="Squat & Deadlift Technique, Core stability"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsBookOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !bookForm.member_id || !bookForm.scheduled_start}>
                  {isSubmitting ? 'Booking...' : 'Confirm PT Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
