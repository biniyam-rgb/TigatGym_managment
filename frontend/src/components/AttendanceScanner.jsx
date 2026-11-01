import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';

export default function AttendanceScanner({ onNavigateToMemberships }) {
  const { hasRole } = useAuth();
  const isStaff = hasRole('owner') || hasRole('admin') || hasRole('receptionist');
  const isOwnerOrAdmin = hasRole('owner') || hasRole('admin');

  // Scanner & Search state
  const [scanInput, setScanInput] = useState('');
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'denied' | 'alert', message, data }
  const [lookupPreview, setLookupPreview] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Stats summary
  const [summary, setSummary] = useState({
    today_total: 0,
    today_admitted: 0,
    today_denied: 0,
    currently_inside: 0,
  });

  // Table filters & list state
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'inside' | 'denied'
  const [records, setRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Correction Modal (Admin / Owner)
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    check_in_time: '',
    check_out_time: '',
    notes: '',
  });

  const scanInputRef = useRef(null);
  const lookupDebounceRef = useRef(null);

  // Focus scan input on load
  useEffect(() => {
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(() => {
    apiClient.getAttendanceSummary()
      .then(res => {
        if (res?.data) setSummary(res.data);
      })
      .catch(err => console.error('Failed to load attendance summary:', err));
  }, []);

  // Fetch attendance records
  const fetchRecords = useCallback(() => {
    setIsLoadingRecords(true);
    const params = {
      page,
      per_page: 15,
      date: new Date().toISOString().split('T')[0],
    };

    if (activeFilter === 'inside') {
      params.currently_inside = '1';
    } else if (activeFilter === 'denied') {
      params.status = 'denied';
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    apiClient.getAttendance(params)
      .then(res => {
        if (res?.data) {
          setRecords(res.data);
          if (res.meta) setMeta(res.meta);
        }
      })
      .catch(err => console.error('Failed to load attendance records:', err))
      .finally(() => setIsLoadingRecords(false));
  }, [page, activeFilter, searchQuery]);

  // Initial & periodic loading
  useEffect(() => {
    let ignore = false;

    apiClient.getAttendanceSummary()
      .then(res => {
        if (!ignore && res?.data) setSummary(res.data);
      })
      .catch(err => console.error('Failed to load attendance summary:', err));

    const params = {
      page,
      per_page: 15,
      date: new Date().toISOString().split('T')[0],
    };

    if (activeFilter === 'inside') {
      params.currently_inside = '1';
    } else if (activeFilter === 'denied') {
      params.status = 'denied';
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    apiClient.getAttendance(params)
      .then(res => {
        if (!ignore && res?.data) {
          setRecords(res.data);
          if (res.meta) setMeta(res.meta);
          setIsLoadingRecords(false);
        }
      })
      .catch(err => {
        if (!ignore) {
          console.error('Failed to load attendance records:', err);
          setIsLoadingRecords(false);
        }
      });

    // Auto-refresh summary every 30 seconds
    const interval = setInterval(() => {
      fetchSummary();
    }, 30000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [page, activeFilter, searchQuery, fetchSummary]);

  // Handle instant lookup on typing (debounced)
  const handleInputChange = (val) => {
    setScanInput(val);
    if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);

    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      setIsLookingUp(true);
      lookupDebounceRef.current = setTimeout(() => {
        apiClient.lookupMember(trimmed)
          .then(res => {
            if (res?.data) {
              setLookupPreview(res.data);
            } else {
              setLookupPreview(null);
            }
          })
          .catch(() => {
            setLookupPreview(null);
          })
          .finally(() => setIsLookingUp(false));
      }, 300);
    } else {
      setLookupPreview(null);
      setIsLookingUp(false);
    }
  };

  // Process Check-In
  const handleProcessCheckIn = async (overridePayload = null) => {
    const rawVal = overridePayload?.token || scanInput.trim();
    if (!rawVal && !overridePayload?.member_id) return;

    setIsProcessingScan(true);
    setScanResult(null);

    let payload;
    if (overridePayload?.member_id) {
      payload = { member_id: overridePayload.member_id, method: 'manual_reception' };
    } else if (rawVal.toUpperCase().startsWith('TG-')) {
      payload = { member_code: rawVal.toUpperCase(), method: 'member_code' };
    } else if (rawVal.startsWith('TIGAT-') || rawVal.includes('TIGAT-')) {
      payload = { qr_token: rawVal, method: 'qr_code' };
    } else {
      // Default try by code or token
      payload = { member_code: rawVal.toUpperCase(), method: 'manual_reception' };
    }

    try {
      const res = await apiClient.checkIn(payload);
      setScanResult({
        type: 'success',
        message: res.message || 'Access granted. Welcome to TIGAT GYM!',
        data: res.data,
      });

      // Reset scan input and preview
      setScanInput('');
      setLookupPreview(null);
      fetchSummary();
      fetchRecords();

      // Refocus input
      if (scanInputRef.current) scanInputRef.current.focus();
    } catch (err) {
      const denialMsg = err.data?.message || err.message || 'Check-in denied';
      const isAntiPassback = denialMsg.toLowerCase().includes('anti-passback');

      setScanResult({
        type: isAntiPassback ? 'alert' : 'denied',
        message: denialMsg,
        data: err.data?.data,
      });

      fetchSummary();
      fetchRecords();
      if (scanInputRef.current) scanInputRef.current.select();
    } finally {
      setIsProcessingScan(false);
    }
  };

  // Process Check-Out
  const handleProcessCheckOut = async (memberId = null, attendanceId = null) => {
    setIsProcessingScan(true);
    setScanResult(null);

    const payload = {};
    if (attendanceId) payload.attendance_id = attendanceId;
    else if (memberId) payload.member_id = memberId;
    else if (scanInput.trim()) payload.qr_token = scanInput.trim();

    try {
      const res = await apiClient.checkOut(payload);
      setScanResult({
        type: 'success',
        message: res.message || 'Checked out successfully. Session recorded.',
        data: res.data,
      });
      setScanInput('');
      setLookupPreview(null);
      fetchSummary();
      fetchRecords();
    } catch (err) {
      setScanResult({
        type: 'denied',
        message: err.message || 'Check-out failed',
      });
    } finally {
      setIsProcessingScan(false);
    }
  };

  // Open Correction Modal
  const handleOpenCorrection = (record) => {
    setSelectedRecordForCorrection(record);
    setCorrectionForm({
      check_in_time: record.check_in_time ? record.check_in_time.slice(0, 16) : '',
      check_out_time: record.check_out_time ? record.check_out_time.slice(0, 16) : '',
      notes: '',
    });
    setIsCorrectionModalOpen(true);
  };

  // Submit Correction
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecordForCorrection) return;

    try {
      const payload = {
        check_in_time: correctionForm.check_in_time,
        check_out_time: correctionForm.check_out_time || null,
        notes: correctionForm.notes.trim(),
      };
      await apiClient.updateAttendance(selectedRecordForCorrection.id, payload);
      setIsCorrectionModalOpen(false);
      fetchRecords();
    } catch (err) {
      alert(err.message || 'Failed to correct record');
    }
  };

  return (
    <div className="attendance-scanner-container">
      {/* Top Level Real-Time KPI Cards */}
      <div className="financial-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Total Today */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>
              Today's Scans
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255, 138, 0, 0.15)', color: '#ff8a00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⚡
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f5f5f5' }}>
            {summary.today_total}
          </div>
          <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>
            Total check-in attempts today
          </div>
        </div>

        {/* Admitted */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>
              Admitted Entry
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✓
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>
            {summary.today_admitted}
          </div>
          <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>
            Active verified gym entries
          </div>
        </div>

        {/* Currently Inside Gym */}
        <div className="dashboard-card" style={{
          padding: 20,
          background: 'linear-gradient(135deg, #151a22 0%, #1c232f 100%)',
          border: '1px solid rgba(255, 138, 0, 0.35)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ffb347', textTransform: 'uppercase' }}>
              Currently Inside
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255, 138, 0, 0.25)', color: '#ff8a00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🏋️
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ff8a00', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{summary.currently_inside}</span>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></span>
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>
            Active workout sessions right now
          </div>
        </div>

        {/* Denied Entries */}
        <div className="dashboard-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase' }}>
              Denied / Alerts
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ef4444' }}>
            {summary.today_denied}
          </div>
          <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 4 }}>
            Expired, frozen or passback alerts
          </div>
        </div>
      </div>

      {/* Main Front-Desk Scanner Console */}
      {isStaff && (
        <div className="dashboard-card" style={{
          padding: 24,
          marginBottom: 24,
          background: 'linear-gradient(180deg, #10141d 0%, #151a23 100%)',
          border: '1px solid #292e38',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📷</span> Front-Desk Fast Check-in Station
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: 13 }}>
                Scan member digital QR pass, swipe token, or type sequential member code (TG-XXXX).
              </p>
            </div>
            <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              ● Scanner Engine Ready
            </span>
          </div>

          {/* Scanner Input Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={scanInputRef}
                type="text"
                className="form-control"
                placeholder="Scan QR pass with barcode scanner or type member code (e.g. TG-0001)..."
                value={scanInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleProcessCheckIn();
                  }
                }}
                style={{
                  fontSize: 15,
                  padding: '14px 18px',
                  background: '#07090e',
                  border: '2px solid rgba(255, 138, 0, 0.4)',
                  borderRadius: 10,
                  color: '#fff',
                  fontFamily: scanInput.startsWith('TG-') ? 'monospace' : 'inherit',
                  letterSpacing: '0.02em',
                }}
              />
              {isLookingUp && (
                <span className="spinner" style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 18,
                  height: 18,
                }}></span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleProcessCheckIn()}
              disabled={isProcessingScan || !scanInput.trim()}
              style={{
                padding: '0 24px',
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isProcessingScan ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }}></span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Check In</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Scan Result Banner */}
          {scanResult && (
            <div style={{
              padding: '16px 20px',
              borderRadius: 10,
              marginBottom: 16,
              background: scanResult.type === 'success' ? 'rgba(34, 197, 94, 0.12)' :
                          scanResult.type === 'alert' ? 'rgba(245, 158, 11, 0.15)' :
                          'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${
                scanResult.type === 'success' ? '#22c55e' :
                scanResult.type === 'alert' ? '#f59e0b' :
                '#ef4444'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'fadeIn 0.3s ease-in-out',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 28 }}>
                  {scanResult.type === 'success' ? '🟢' :
                   scanResult.type === 'alert' ? '⚠️' : '🔴'}
                </span>
                <div>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: scanResult.type === 'success' ? '#22c55e' :
                           scanResult.type === 'alert' ? '#f59e0b' : '#ef4444',
                    letterSpacing: '0.02em',
                  }}>
                    {scanResult.type === 'success' ? 'ACCESS ADMITTED' :
                     scanResult.type === 'alert' ? 'SECURITY ALERT' : 'ACCESS DENIED'}
                  </div>
                  <div style={{ fontSize: 13, color: '#f5f5f5', marginTop: 2 }}>
                    {scanResult.message}
                  </div>
                </div>
              </div>

              {/* Renewal shortcut on expired or denied */}
              {scanResult.type === 'denied' && scanResult.message.toLowerCase().includes('expired') && onNavigateToMemberships && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onNavigateToMemberships}
                  style={{ fontWeight: 700, padding: '8px 16px' }}
                >
                  Renew Membership →
                </button>
              )}
            </div>
          )}

          {/* Member Preview Card (when typing or searching) */}
          {lookupPreview && (
            <div style={{
              background: '#090c12',
              border: `1px solid ${lookupPreview.is_eligible ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: 12,
              padding: 18,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #ff8a00, #ff5500)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 800,
                }}>
                  {lookupPreview.member.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    {lookupPreview.member.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#ff8a00', fontFamily: 'monospace', fontWeight: 600 }}>
                    {lookupPreview.member.member_code} • {lookupPreview.member.phone || 'No Phone'}
                  </div>
                </div>
              </div>

              {/* Subscription Status Pill */}
              <div style={{ textAlign: 'right' }}>
                {lookupPreview.is_eligible ? (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                    }}>
                      ✓ Eligible for Entry ({lookupPreview.active_subscription?.plan_name})
                    </span>
                    <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>
                      Expires on {lookupPreview.active_subscription?.end_date} ({lookupPreview.active_subscription?.days_remaining} days left)
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                    }}>
                      ✕ Ineligible: {lookupPreview.ineligibility_reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                {lookupPreview.is_currently_inside ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleProcessCheckOut(lookupPreview.member.id, lookupPreview.open_visit_id)}
                    style={{ fontWeight: 700, padding: '8px 14px' }}
                  >
                    Check Out Member
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleProcessCheckIn({ member_id: lookupPreview.member.id })}
                    disabled={!lookupPreview.is_eligible}
                    style={{ fontWeight: 700, padding: '8px 16px' }}
                  >
                    Grant Admittance
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Attendance Feed & Records Table */}
      <div className="dashboard-card" style={{ padding: 24 }}>
        {/* Header and Filter Tabs */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
              Live Attendance Register & Visit History
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: 13 }}>
              Audited front-desk log of check-in methods, workout durations, and security scans.
            </p>
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'all', label: 'All Today' },
              { id: 'inside', label: `Inside Gym (${summary.currently_inside})` },
              { id: 'denied', label: `Denied (${summary.today_denied})` },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-sm ${activeFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setActiveFilter(f.id);
                  setPage(1);
                }}
                style={{ fontWeight: 600 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search attendance by member name, phone, or TG-XXXX code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{ width: '100%', maxWidth: 420 }}
          />
        </div>

        {/* Attendance Records Table */}
        {isLoadingRecords ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#a1a1aa' }}>
            <span className="spinner" style={{ width: 28, height: 28, display: 'inline-block', marginBottom: 12 }}></span>
            <p>Loading attendance registers...</p>
          </div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#a1a1aa', background: '#0a0d13', borderRadius: 8 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
            <p style={{ fontWeight: 600, color: '#f5f5f5' }}>No attendance records found for this filter</p>
            <p style={{ fontSize: 13 }}>Scan members at the reception station to register visits.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="gymcore-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan & Pass</th>
                  <th>Check-In</th>
                  <th>Check-Out / Duration</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Reception Staff</th>
                  {isStaff && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const isAdmitted = r.status === 'admitted';
                  const isInside = isAdmitted && !r.check_out_time;

                  return (
                    <tr key={r.id}>
                      {/* Member Info */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#f5f5f5' }}>
                          {r.member?.name || `Member #${r.member_id}`}
                        </div>
                        <div style={{ fontSize: 11, color: '#ff8a00', fontFamily: 'monospace' }}>
                          {r.member?.member_code || ''}
                        </div>
                      </td>

                      {/* Plan */}
                      <td>
                        {r.subscription?.plan_name ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            background: 'rgba(255, 138, 0, 0.1)',
                            color: '#ff8a00',
                          }}>
                            {r.subscription.plan_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748b' }}>No Plan Attached</span>
                        )}
                      </td>

                      {/* Check-In */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#f5f5f5', fontSize: 13 }}>
                          {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#a1a1aa' }}>
                          {r.check_in_time ? new Date(r.check_in_time).toLocaleDateString() : ''}
                        </div>
                      </td>

                      {/* Check-Out / Duration */}
                      <td>
                        {isInside ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#22c55e',
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></span>
                            In Gym Now
                          </span>
                        ) : r.check_out_time ? (
                          <div>
                            <div style={{ fontSize: 12, color: '#f5f5f5' }}>
                              {new Date(r.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: 11, color: '#a1a1aa' }}>
                              {r.duration_minutes} mins
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748b' }}>—</span>
                        )}
                      </td>

                      {/* Method */}
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#d4d4d8',
                        }}>
                          {r.method?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Status & Denial Reason */}
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isAdmitted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isAdmitted ? '#22c55e' : '#ef4444',
                        }}>
                          {r.status}
                        </span>
                        {r.denial_reason && (
                          <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 2, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.denial_reason}
                          </div>
                        )}
                      </td>

                      {/* Reception Staff */}
                      <td style={{ fontSize: 12, color: '#a1a1aa' }}>
                        {r.verified_by?.name || 'Reception Staff'}
                      </td>

                      {/* Actions */}
                      {isStaff && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {isInside && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleProcessCheckOut(r.member_id, r.id)}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                              >
                                Check Out
                              </button>
                            )}
                            {isOwnerOrAdmin && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleOpenCorrection(r)}
                                title="Correct Attendance History (Audited)"
                                style={{
                                  padding: '3px 8px',
                                  fontSize: 11,
                                  background: 'rgba(255, 138, 0, 0.12)',
                                  color: '#ff8a00',
                                  border: '1px solid rgba(255, 138, 0, 0.25)',
                                }}
                              >
                                Correct
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 13, color: '#a1a1aa' }}>
              Showing page {meta.current_page} of {meta.last_page} ({meta.total} total visits)
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= meta.last_page}
                onClick={() => setPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== AUDITED CORRECTION MODAL ==================== */}
      {isCorrectionModalOpen && selectedRecordForCorrection && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: '#ff8a00', fontSize: 18, fontWeight: 700 }}>
                  Correct Attendance Entry
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: 12 }}>
                  Member: {selectedRecordForCorrection.member?.name} ({selectedRecordForCorrection.member?.member_code})
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCorrectionModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                  Check-in Time
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={correctionForm.check_in_time}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                  Check-out Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={correctionForm.check_out_time}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ display: 'block', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                  Mandatory Correction Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Explain reason for adjusting the check-in/out timestamp..."
                  value={correctionForm.notes}
                  onChange={(e) => setCorrectionForm(prev => ({ ...prev, notes: e.target.value }))}
                  required
                  minLength={5}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCorrectionModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={correctionForm.notes.trim().length < 5}
                  style={{ fontWeight: 700 }}
                >
                  Save Audited Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
