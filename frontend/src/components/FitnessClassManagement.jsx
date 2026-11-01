import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

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
              + Schedule Fitness Class
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

      {/* Classes Grid */}
      {isLoading ? (
        <div className="loading-state">
          <span className="spinner"></span>
          <p>Loading Tigat Gym class schedule...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="empty-state-box">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧘‍♂️</div>
          <h4>No Scheduled Classes Found</h4>
          <p>There are no fitness classes scheduled matching the selected filters.</p>
          {canSchedule && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setIsScheduleOpen(true)}
            >
              + Schedule First Class
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
                    <span className="room-badge">📍 {c.room || 'Studio A'}</span>
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
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => handleCancelBooking(c)}
                      disabled={isSubmitting}
                    >
                      ✓ Reserved (Click to Cancel)
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
                          👤 +
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
