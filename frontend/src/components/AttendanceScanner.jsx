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

  // Camera & Simulator State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanMode, setScanMode] = useState('check_in'); // 'check_in' | 'check_out'
  const [membersQuickList, setMembersQuickList] = useState([]);
  const [selectedSimMember, setSelectedSimMember] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

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

    apiClient.getMembers({ per_page: 50 })
      .then(res => {
        if (!ignore && res?.data) {
          setMembersQuickList(res.data);
        }
      })
      .catch(err => console.error('Failed to load members for scanner:', err));

    // Auto-refresh summary every 30 seconds
    const interval = setInterval(() => {
      fetchSummary();
    }, 30000);

    return () => {
      ignore = true;
      clearInterval(interval);
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [page, activeFilter, searchQuery, fetchSummary]);

  // Start Camera QR Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or requires HTTPS.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      setIsCameraActive(true);

      // Timeout to allow video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);

          // BarcodeDetector loop if supported
          if ('BarcodeDetector' in window) {
            const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
            scanIntervalRef.current = setInterval(async () => {
              if (!videoRef.current || videoRef.current.readyState < 2) return;
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const detectedVal = barcodes[0].rawValue;
                  if (detectedVal) {
                    if (scanMode === 'check_out') {
                      handleProcessCheckOut(null, null, detectedVal);
                    } else {
                      handleProcessCheckIn({ token: detectedVal });
                    }
                    stopCamera();
                  }
                }
              } catch {
                // Ignore detection frame tick errors
              }
            }, 300);
          }
        }
      }, 100);
    } catch (err) {
      console.error('Camera startup error:', err);
      setCameraError(err.message || 'Unable to start camera.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Upload and decode QR Code from image file
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const imageBitmap = await createImageBitmap(file);
        const barcodes = await barcodeDetector.detect(imageBitmap);
        if (barcodes && barcodes.length > 0) {
          const raw = barcodes[0].rawValue;
          if (scanMode === 'check_out') {
            handleProcessCheckOut(null, null, raw);
          } else {
            handleProcessCheckIn({ token: raw });
          }
        } else {
          alert('No QR code detected in the uploaded image. Please try a clearer image.');
        }
      } catch (err) {
        alert('QR Image Scan Error: ' + err.message);
      }
    } else {
      alert('Your browser does not support image barcode detection. Please use camera or member simulator.');
    }
  };

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
  const handleProcessCheckOut = async (memberId = null, attendanceId = null, overrideToken = null) => {
    setIsProcessingScan(true);
    setScanResult(null);

    const payload = {};
    if (attendanceId) payload.attendance_id = attendanceId;
    else if (memberId) payload.member_id = memberId;
    else if (overrideToken) payload.qr_token = overrideToken;
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
      {/* Top Level Real-Time KPI Cards (Matching Tigat SaaS Clean Theme) */}
      <div className="financial-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Total Today */}
        <div className="dashboard-card" style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Scans
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(230, 124, 0, 0.1)', color: '#E67C00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⚡
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
            {summary.today_total}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Total check-in attempts today
          </div>
        </div>

        {/* Admitted */}
        <div className="dashboard-card" style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Admitted Entry
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✓
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>
            {summary.today_admitted}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
            Active verified gym entries
          </div>
        </div>

        {/* Currently Inside Gym */}
        <div className="dashboard-card" style={{
          padding: 20,
          background: '#ffffff',
          border: '1.5px solid #E67C00',
          borderRadius: 16,
          boxShadow: '0 4px 14px rgba(230, 124, 0, 0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#E67C00', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Currently Inside
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(230, 124, 0, 0.15)', color: '#E67C00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🏋️
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#E67C00', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{summary.currently_inside}</span>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 10px #16a34a' }}></span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Active workout sessions right now
          </div>
        </div>

        {/* Denied Entries */}
        <div className="dashboard-card" style={{ padding: 20, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Denied / Alerts
            </span>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>
            {summary.today_denied}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Expired, frozen or passback alerts
          </div>
        </div>
      </div>

      {/* Main Front-Desk Scanner Console */}
      {isStaff && (
        <div className="dashboard-card" style={{
          padding: 24,
          marginBottom: 24,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}>
          {/* Header Row with Camera & Action Tools */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📷</span> Front-Desk QR Code Check-in Station
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
                Scan member digital QR pass using live camera, barcode gun, or fast member simulator.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Scan Mode Switcher (Check-in vs Check-out) */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setScanMode('check_in')}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: scanMode === 'check_in' ? '#E67C00' : 'transparent',
                    color: scanMode === 'check_in' ? '#ffffff' : '#64748b',
                  }}
                >
                  ✓ Check In
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('check_out')}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: scanMode === 'check_out' ? '#0f172a' : 'transparent',
                    color: scanMode === 'check_out' ? '#ffffff' : '#64748b',
                  }}
                >
                  👋 Check Out
                </button>
              </div>

              {/* Camera Scanner Toggle Button */}
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isCameraActive ? '1px solid #ef4444' : 'none',
                  background: isCameraActive ? '#fef2f2' : '#E67C00',
                  color: isCameraActive ? '#ef4444' : '#ffffff',
                  boxShadow: isCameraActive ? 'none' : '0 2px 10px rgba(230, 124, 0, 0.25)',
                }}
              >
                <span>{isCameraActive ? '⏹' : '📷'}</span>
                <span>{isCameraActive ? 'Stop Camera' : 'Start Camera Scanner'}</span>
              </button>

              {/* Image Upload Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload QR Code Photo or Screenshot"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                }}
              >
                <span>📁</span>
                <span>Upload QR Image</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Camera Viewfinder */}
          {isCameraActive && (
            <div style={{
              position: 'relative',
              maxWidth: 440,
              margin: '0 auto 20px',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#0a0d14',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
              border: '2px solid #E67C00',
              textAlign: 'center',
            }}>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }}
              />
              {/* Reticle Overlay */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 200,
                height: 200,
                border: '2px dashed rgba(230, 124, 0, 0.8)',
                borderRadius: 14,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: '#E67C00',
                  boxShadow: '0 0 10px #E67C00',
                }}></div>
              </div>
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 0,
                right: 0,
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 600,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                Align Member QR code inside the orange frame
              </div>
            </div>
          )}

          {cameraError && (
            <div style={{ padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              ⚠️ {cameraError}
            </div>
          )}

          {/* Fast Member Pass Test Simulator Bar */}
          <div style={{
            background: '#fffaf5',
            border: '1.5px solid #fed7aa',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>1-Click Member Pass Test Simulator</span>
                <span style={{ display: 'block', fontSize: 11.5, color: '#64748b' }}>
                  Simulate instant QR admission without external scanner hardware
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className="form-control"
                value={selectedSimMember}
                onChange={(e) => setSelectedSimMember(e.target.value)}
                style={{ minWidth: 240, fontSize: 13, padding: '8px 12px', background: '#ffffff', borderColor: '#fed7aa', fontWeight: 600 }}
              >
                <option value="">-- Choose registered member --</option>
                {membersQuickList.map((m) => (
                  <option key={m.id} value={m.qr_token || m.member_code}>
                    {m.name} ({m.member_code}) — {m.phone || 'No phone'}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn btn-sm"
                disabled={!selectedSimMember}
                onClick={() => {
                  if (scanMode === 'check_out') {
                    handleProcessCheckOut(null, null, selectedSimMember);
                  } else {
                    handleProcessCheckIn({ token: selectedSimMember });
                  }
                }}
                style={{
                  background: '#E67C00',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 12.5,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: !selectedSimMember ? 'not-allowed' : 'pointer',
                  opacity: !selectedSimMember ? 0.6 : 1,
                }}
              >
                {scanMode === 'check_out' ? 'Simulate Check-Out' : 'Simulate Scan Pass'}
              </button>
            </div>
          </div>

          {/* Manual Input & Barcode Gun Field */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={scanInputRef}
                type="text"
                className="form-control"
                placeholder="Scan QR pass with laser scanner, swipe card, or type TG-0001..."
                value={scanInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (scanMode === 'check_out') {
                      handleProcessCheckOut();
                    } else {
                      handleProcessCheckIn();
                    }
                  }
                }}
                style={{
                  fontSize: 14.5,
                  padding: '12px 18px',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 12,
                  color: '#0f172a',
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
              onClick={() => {
                if (scanMode === 'check_out') {
                  handleProcessCheckOut();
                } else {
                  handleProcessCheckIn();
                }
              }}
              disabled={isProcessingScan || !scanInput.trim()}
              style={{
                padding: '0 24px',
                fontSize: 14.5,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: scanMode === 'check_out' ? '#0f172a' : '#E67C00',
                borderColor: scanMode === 'check_out' ? '#0f172a' : '#E67C00',
              }}
            >
              {isProcessingScan ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }}></span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>{scanMode === 'check_out' ? '👋' : '✓'}</span>
                  <span>{scanMode === 'check_out' ? 'Check Out' : 'Check In'}</span>
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
