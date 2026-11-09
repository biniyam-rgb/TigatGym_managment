import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

const Icons = {
  CheckCircle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  AlertTriangle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Dumbbell: ({ size = 38 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.17 1.17a2 2 0 0 1-2.83 0L8.83 16.83a2 2 0 0 1 0-2.83l1.17-1.17a2 2 0 0 0 0-2.83L9 9" />
      <path d="m3 3 1 1a2 2 0 0 0 2.83 0l1.17-1.17a2 2 0 0 1 2.83 0l4.34 4.34a2 2 0 0 1 0 2.83l-1.17 1.17a2 2 0 0 0 0 2.83L15 15" />
    </svg>
  ),
  MapPin: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  UserPlus: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="11" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  X: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

export default function FitnessClassManagement() {
  const { user, hasRole } = useAuth();
  const canSchedule = hasRole('owner') || hasRole('admin');
  const canBookForOthers = hasRole('owner') || hasRole('admin') || hasRole('receptionist');

  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [targetClass, setTargetClass] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Schedule class form state
  const [scheduleForm, setScheduleForm] = useState({
    name: 'Tigat Morning HIIT',
    description: 'High-intensity interval training focusing on cardio conditioning and agility.',
    trainer_id: '',
    room: 'Studio A (Main Hall)',
    capacity: 20,
    start_time: '',
    end_time: '',
    recurrence: 'weekly',
    price: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Classes
  const loadClasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getFitnessClasses({
        status: statusFilter,
        date: dateFilter,
      });
      setClasses(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load class schedule.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateFilter]);

  // Load Trainers & Members for modals
  useEffect(() => {
    let ignore = false;

    apiClient.getFitnessClasses({ status: statusFilter, date: dateFilter })
      .then((res) => {
        if (!ignore) {
          setClasses(res.data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load class schedule.');
          setIsLoading(false);
        }
      });

    Promise.allSettled([
      apiClient.getTrainers(),
      canBookForOthers ? apiClient.getMembers({ per_page: 100 }) : Promise.resolve({ data: [] }),
    ]).then(([tResult, mResult]) => {
      if (!ignore) {
        if (tResult.status === 'fulfilled') {
          const tData = tResult.value?.data || [];
          setTrainers(tData);
          if (tData.length > 0) {
            setScheduleForm((prev) => ({ ...prev, trainer_id: tData[0].id }));
          }
        }
        if (mResult.status === 'fulfilled') {
          setMembers(mResult.value?.data || []);
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [statusFilter, dateFilter, canBookForOthers]);

  // Handle create class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.createFitnessClass(scheduleForm);
      setSuccessMessage(res.message || 'Class scheduled successfully.');
      setIsScheduleOpen(false);
      loadClasses();
    } catch (err) {
      setError(err.message || 'Failed to schedule class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle direct booking (for current member)
  const handleBookSelf = async (c) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.bookFitnessClass(c.id, { member_id: user.id });
      setSuccessMessage(res.message || `Spot confirmed in ${c.name}!`);
      loadClasses();
    } catch (err) {
      setError(err.message || 'Booking failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle staff booking for member
  const handleBookForMember = async (e) => {
    e.preventDefault();
    if (!targetClass || !selectedMemberId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.bookFitnessClass(targetClass.id, { member_id: selectedMemberId });
      setSuccessMessage(res.message || 'Member booked successfully.');
      setIsBookModalOpen(false);
      setSelectedMemberId('');
      loadClasses();
    } catch (err) {
      setError(err.message || 'Booking failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async (c) => {
    if (!window.confirm(`Are you sure you want to cancel your reservation for ${c.name}?`)) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.cancelFitnessClassBooking(c.id, { member_id: user.id });
      setSuccessMessage(res.message || 'Booking cancelled.');
      loadClasses();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="module-container">
      {/* Top Header Controls */}
      <div className="section-header-bar">
        <div className="filter-group-inline">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="scheduled">Scheduled Classes</option>
            <option value="ongoing">Happening Now</option>
            <option value="completed">Past / Completed</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          />

          {dateFilter && (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => setDateFilter('')}
            >
              Clear Date
            </button>
          )}
        </div>

        <div className="section-actions">
          {canSchedule && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(7, 0, 0, 0);
                const end = new Date(tomorrow);
                end.setHours(8, 0, 0, 0);

                setScheduleForm((prev) => ({
                  ...prev,
                  start_time: tomorrow.toISOString().slice(0, 16),
                  end_time: end.toISOString().slice(0, 16),
                }));
                setIsScheduleOpen(true);
              }}
            >
              <Icons.Plus size={15} />
              <span>Schedule Fitness Class</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.CheckCircle size={16} />
          <span style={{ flex: 1 }}>{successMessage}</span>
          <button type="button" className="close-btn" onClick={() => setSuccessMessage(null)}>
            <Icons.X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.AlertTriangle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" className="close-btn" onClick={() => setError(null)}>
            <Icons.X size={15} />
          </button>
        </div>
      )}

      {/* Classes Grid */}
      {isLoading ? (
        <div className="loading-state">
          <span className="spinner"></span>
          <p>Loading Tigat Gym class schedule...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="empty-state-box">
          <div className="empty-state-icon-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#ff8a00' }}>
            <Icons.Dumbbell size={42} />
          </div>
          <h4>No Scheduled Classes Found</h4>
          <p>There are no fitness classes scheduled matching the selected filters.</p>
          {canSchedule && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setIsScheduleOpen(true)}
            >
              <Icons.Plus size={14} />
              <span>Schedule First Class</span>
            </button>
          )}
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((c) => {
            const pctBooked = Math.min(100, Math.round((c.booked_count / c.capacity) * 100));
            const spotsLeft = Math.max(0, c.capacity - c.booked_count);
            const isFull = spotsLeft === 0;

            return (
              <div key={c.id} className="class-card">
                <div className="class-card-top">
                  <div className="class-badge-row">
                    <span className="room-badge">
                      <Icons.MapPin size={12} />
                      <span>{c.room || 'Studio A'}</span>
                    </span>
                    <span className={`status-pill status-${c.status}`}>
                      {c.status}
                    </span>
                  </div>
                  <h3 className="class-title">{c.name}</h3>
                  <p className="class-desc">{c.description || 'Professional group training session.'}</p>
                </div>

                <div className="class-card-middle">
                  <div className="class-coach-row">
                    <div className="coach-avatar">
                      {c.trainer?.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div>
                      <span className="coach-label">Instructor</span>
                      <strong className="coach-name">{c.trainer?.name || 'Assigned Coach'}</strong>
                    </div>
                  </div>

                  <div className="class-timing-box">
                    <div className="timing-item">
                      <span className="timing-label">Date & Time</span>
                      <span className="timing-val">
                        {c.start_time ? new Date(c.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
                        {' • '}
                        {c.start_time ? new Date(c.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="timing-item">
                      <span className="timing-label">Fee</span>
                      <span className="timing-val price-text">
                        {c.price > 0 ? `${c.price} ETB` : 'Included with Pass'}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div className="capacity-container">
                    <div className="capacity-label-row">
                      <span>Occupancy</span>
                      <strong className={isFull ? 'text-danger' : 'text-orange'}>
                        {c.booked_count} / {c.capacity} spots ({spotsLeft} left)
                      </strong>
                    </div>
                    <div className="capacity-bar-track">
                      <div
                        className="capacity-bar-fill"
                        style={{
                          width: `${pctBooked}%`,
                          backgroundColor: isFull ? '#ef4444' : pctBooked > 75 ? '#ff7a00' : '#10b981',
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="class-card-bottom">
                  {c.is_booked_by_current_user ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm btn-block"
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onClick={() => handleCancelBooking(c)}
                      disabled={isSubmitting}
                    >
                      <Icons.Check size={14} />
                      <span>Reserved (Click to Cancel)</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-block"
                        onClick={() => handleBookSelf(c)}
                        disabled={isSubmitting || isFull}
                      >
                        {isFull ? 'Class Full' : 'Reserve Spot'}
                      </button>

                      {canBookForOthers && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Book for gym member"
                          onClick={() => {
                            setTargetClass(c);
                            setIsBookModalOpen(true);
                          }}
                          disabled={isFull}
                        >
                          <Icons.UserPlus size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Schedule Class */}
      {isScheduleOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Schedule Group Fitness Class</h3>
              <button type="button" className="close-btn" onClick={() => setIsScheduleOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Class Name *</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                    placeholder="e.g. Tigat Power Spin, Core Blast"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Lead Instructor *</label>
                    <select
                      required
                      value={scheduleForm.trainer_id}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, trainer_id: e.target.value })}
                    >
                      <option value="">-- Choose Coach --</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.profile?.specialization || 'Trainer'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Studio / Room</label>
                    <input
                      type="text"
                      value={scheduleForm.room}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                      placeholder="Studio A, Aerobics Deck"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Max Capacity (Participants) *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={scheduleForm.capacity}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, capacity: parseInt(e.target.value, 10) || 20 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Class Fee (ETB, 0 = included)</label>
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={scheduleForm.price}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="2"
                    value={scheduleForm.description}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                    placeholder="Focus areas, equipment requirements, recommended fitness level..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsScheduleOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !scheduleForm.trainer_id}>
                  {isSubmitting ? 'Scheduling...' : 'Publish Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Book for Member (Staff Mode) */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Book Spot in {targetClass?.name}</h3>
              <button type="button" className="close-btn" onClick={() => setIsBookModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleBookForMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Member *</label>
                  <select
                    required
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                    <option value="">-- Choose Gym Member --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.member_profile?.member_code || `ID-${m.id}`}) - {m.phone}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                    Note: The member must hold an active gym membership pass to reserve class spots.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsBookModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !selectedMemberId}>
                  {isSubmitting ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
