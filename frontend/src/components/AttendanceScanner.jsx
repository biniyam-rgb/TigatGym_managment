import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/api';
import { useAuth } from '../context/useAuth';
import { decodeQRFromImageData } from '../utils/qrCodeDecoder';
import PermanentMemberCard from './PermanentMemberCard';

// Crisp, theme-aware Lucide-style SVG Icons (replacing all emojis)
const AttendanceIcons = {
  Zap: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Check: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: ({ size = 26, color = '#22c55e' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  XCircle: ({ size = 26, color = '#ef4444' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  AlertTriangle: ({ size = 24, color = '#f59e0b' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  X: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Dumbbell: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14" />
      <path d="M18 5v14" />
      <path d="M2 9v6" />
      <path d="M22 9v6" />
      <path d="M6 12h12" />
      <rect x="4" y="7" width="2" height="10" rx="1" />
      <rect x="18" y="7" width="2" height="10" rx="1" />
    </svg>
  ),
  Camera: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Square: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  Search: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ClipboardList: ({ size = 36, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  ),
  QrCode: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  ),
  ScanViewfinder: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.8" />
    </svg>
  ),
  CheckBold: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Users: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  TrendingUp: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  ArrowUp: ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ),
  ArrowRight: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  CreditCard: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Calendar: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  Clock: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

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
  const [membersQuickList, setMembersQuickList] = useState([]);
  const [selectedSimMember, setSelectedSimMember] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Stats summary
  const [summary, setSummary] = useState({
    today_total: 0,
    today_admitted: 0,
    currently_inside: 0,
  });

  // Table filters & list state
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'inside'
  const [records, setRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Member Detail Modal State
  const [isMemberDetailModalOpen, setIsMemberDetailModalOpen] = useState(false);
  const [detailMember, setDetailMember] = useState(null);
  const [detailActiveTab, setDetailActiveTab] = useState('pass'); // 'pass' | 'payments' | 'attendance' | 'profile'
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [memberPayments, setMemberPayments] = useState([]);
  const [memberAttendance, setMemberAttendance] = useState([]);

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
  const handleProcessCheckInRef = useRef(null);

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

  // Start Camera QR Scanner (Supports native BarcodeDetector + Pure JS Canvas fallback for all PC browsers)
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

      // Offscreen canvas for frame capture
      let offscreenCanvas = null;
      let offscreenCtx = null;
      let barcodeDetector = null;
      if ('BarcodeDetector' in window) {
        try {
          barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        } catch {
          barcodeDetector = null;
        }
      }

      // Timeout to allow video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);

          let isScanningFrame = false;

          scanIntervalRef.current = setInterval(async () => {
            const video = videoRef.current;
            if (!video || video.readyState < 2 || !video.videoWidth || isScanningFrame) return;

            isScanningFrame = true;
            let detectedVal = null;

            // 1. Try native BarcodeDetector if available
            if (barcodeDetector) {
              try {
                const barcodes = await barcodeDetector.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  detectedVal = barcodes[0].rawValue;
                }
              } catch {
                // Ignore frame exception, proceed to canvas fallback
              }
            }

            // 2. Pure JS In-Browser Canvas Decoder (Desktop Chrome, Edge, Firefox)
            if (!detectedVal) {
              try {
                if (!offscreenCanvas) {
                  offscreenCanvas = document.createElement('canvas');
                  offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
                }
                const srcW = video.videoWidth;
                const srcH = video.videoHeight;
                const scale = Math.min(1, 800 / srcW);
                const targetW = Math.round(srcW * scale);
                const targetH = Math.round(srcH * scale);

                offscreenCanvas.width = targetW;
                offscreenCanvas.height = targetH;
                offscreenCtx.drawImage(video, 0, 0, targetW, targetH);
                const imgData = offscreenCtx.getImageData(0, 0, targetW, targetH);
                detectedVal = decodeQRFromImageData(imgData);
              } catch {
                // Ignore transient frame draw error
              }
            }

            if (detectedVal) {
              handleProcessCheckInRef.current?.({ token: detectedVal });
              stopCamera();
            }

            isScanningFrame = false;
          }, 250);
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
    const rawVal = (overridePayload?.token || scanInput || '').trim();
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
    const effectiveToken = (overrideToken || scanInput || '').trim();
    if (attendanceId) payload.attendance_id = attendanceId;
    else if (memberId) payload.member_id = memberId;
    else if (effectiveToken) {
      if (effectiveToken.toUpperCase().startsWith('TG-')) {
        payload.member_code = effectiveToken.toUpperCase();
      } else {
        payload.qr_token = effectiveToken;
      }
    }

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

  useEffect(() => {
    handleProcessCheckInRef.current = handleProcessCheckIn;
  });

  // Global hardware listener for USB Barcode / QR Scanner guns
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = 0;

    const handleGlobalScanKey = (e) => {
      // Do not intercept if user is typing in a modal textarea or form input (other than scan input)
      if (
        e.target &&
        (e.target.tagName === 'TEXTAREA' ||
          (e.target.tagName === 'INPUT' && e.target !== scanInputRef.current))
      ) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        const trimmed = keyBuffer.trim();
        // Hardware barcode gun burst: >= 3 chars typed in rapid succession
        if (trimmed.length >= 3 && timeDiff < 120) {
          e.preventDefault();
          keyBuffer = '';
          handleProcessCheckInRef.current?.({ token: trimmed });
        } else {
          keyBuffer = '';
        }
        return;
      }

      if (e.key.length === 1) {
        // If keystrokes arrive faster than 75ms apart, it's a hardware scanner burst
        if (timeDiff < 75) {
          keyBuffer += e.key;
        } else {
          keyBuffer = e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalScanKey);
    return () => window.removeEventListener('keydown', handleGlobalScanKey);
  }, []);

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

  // Open Member Details Modal (Pass, Payments, Visits, Profile)
  const handleOpenMemberDetails = async (memberOrId) => {
    const memberId = typeof memberOrId === 'object' ? (memberOrId.id || memberOrId.user_id) : memberOrId;
    if (!memberId) return;

    setIsMemberDetailModalOpen(true);
    setIsLoadingDetail(true);
    setDetailActiveTab('pass');
    setMemberPayments([]);
    setMemberAttendance([]);

    if (typeof memberOrId === 'object') {
      setDetailMember(memberOrId);
    }

    try {
      // 1. Fetch full member profile
      const res = await apiClient.getMember(memberId);
      const mData = res?.member || res?.data?.member || res?.data || memberOrId;
      setDetailMember(mData);

      // Determine the user_id (for payments and attendance queries)
      const targetUserId = mData.user_id || mData.id || memberId;

      // 2. Fetch payments for this member
      try {
        const payRes = await apiClient.getPayments({ member_id: targetUserId, per_page: 20 });
        setMemberPayments(payRes?.data || []);
      } catch (payErr) {
        console.warn('Could not fetch member payments:', payErr);
      }

      // 3. Fetch attendance history for this member
      try {
        const attRes = await apiClient.getAttendance({ member_id: targetUserId, per_page: 20 });
        setMemberAttendance(attRes?.data || []);
      } catch (attErr) {
        console.warn('Could not fetch member attendance history:', attErr);
      }
    } catch (err) {
      console.error('Failed to load member profile details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="attendance-scanner-container">
      {/* Top Level Real-Time KPI Cards (Unified Clean TigatGym Design) */}
      <div className="clean-kpi-grid att-kpi-grid" style={{ marginBottom: 20 }}>
        {/* Card 1: Today's Scans */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Today's Scans</span>
            <div className="clean-kpi-icon" title="Today's Scans">
              <AttendanceIcons.ScanViewfinder size={16} />
            </div>
          </div>
          <div className="kpi-value">{summary.today_total}</div>
          <span className="kpi-trend trend-positive" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AttendanceIcons.TrendingUp size={13} color="#16a34a" /> +12% this week
          </span>
        </div>

        {/* Card 2: Successful Entries */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Successful Entries</span>
            <div className="clean-kpi-icon" title="Successful Entries">
              <AttendanceIcons.CheckBold size={16} />
            </div>
          </div>
          <div className="kpi-value">{summary.today_admitted}</div>
          <span className="kpi-trend trend-positive" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AttendanceIcons.TrendingUp size={13} color="#16a34a" /> +8% vs yesterday
          </span>
        </div>

        {/* Card 3: Currently Inside */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Currently Inside</span>
            <div className="clean-kpi-icon" title="Currently Inside">
              <AttendanceIcons.Users size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span>{summary.currently_inside}</span>
            <span className="att-kpi-live-dot" title="Live Active Workout Sessions" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#ff8a00' }}></span>
          </div>
          <span className="kpi-trend" style={{ color: '#ff8a00', fontWeight: 600 }}>
            Active workout sessions
          </span>
        </div>
      </div>

      {/* Main Front-Desk Scanner Console */}
      {isStaff && (
        <div className="att-console-card">
          {/* Header Row with Camera & Action Tools */}
          <div className="att-console-header">
            <div>
              <h3 className="att-console-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AttendanceIcons.QrCode size={18} color="#ff8a00" /> Front-Desk QR Code Check-in Station
              </h3>
              <p className="att-console-desc">
                Scan member digital QR pass using live camera, barcode gun, or fast member simulator.
              </p>
            </div>

            <div className="att-console-actions">
              {/* Camera Scanner Toggle Button */}
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`att-camera-toggle-btn ${isCameraActive ? 'camera-active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
              >
                <span>{isCameraActive ? <AttendanceIcons.Square size={14} /> : <AttendanceIcons.Camera size={14} />}</span>
                <span>{isCameraActive ? 'Stop Camera' : 'Start Camera Scanner'}</span>
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
            <div style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 10, color: '#ef4444', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AttendanceIcons.AlertTriangle size={16} color="#ef4444" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Fast Member Pass Test Simulator Bar */}
          <div className="att-sim-bar">
            <div className="att-sim-info">
              <span style={{ display: 'flex', alignItems: 'center' }}><AttendanceIcons.Zap size={16} color="#ff8a00" /></span>
              <div>
                <span className="att-sim-title">1-Click Member Pass Test Simulator</span>
                <span className="att-sim-desc">
                  Simulate instant QR admission without external scanner hardware
                </span>
              </div>
            </div>

            <div className="att-sim-controls">
              <select
                className="att-sim-select"
                value={selectedSimMember}
                onChange={(e) => setSelectedSimMember(e.target.value)}
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
                className="att-sim-btn"
                disabled={!selectedSimMember}
                onClick={() => {
                  handleProcessCheckIn({ token: selectedSimMember });
                }}
              >
                Simulate Scan Pass
              </button>
            </div>
          </div>

          {/* Manual Input & Barcode Gun Field */}
          <div className="att-input-row">
            <div className="att-input-wrap">
              <input
                ref={scanInputRef}
                type="text"
                className="att-scan-input"
                placeholder="Scan QR pass with laser scanner, swipe card, or type TG-0001..."
                value={scanInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleProcessCheckIn();
                  }
                }}
                style={{
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
              className="att-submit-btn btn-in"
              onClick={() => handleProcessCheckIn()}
              disabled={isProcessingScan || !scanInput.trim()}
            >
              {isProcessingScan ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }}></span>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <AttendanceIcons.Check size={16} color="#ffffff" />
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
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {scanResult.type === 'success' ? <AttendanceIcons.CheckCircle size={30} color="#22c55e" /> :
                   scanResult.type === 'alert' ? <AttendanceIcons.AlertTriangle size={30} color="#f59e0b" /> :
                   <AttendanceIcons.XCircle size={30} color="#ef4444" />}
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
                  style={{ fontWeight: 700, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Renew Membership</span>
                  <AttendanceIcons.ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Member Preview Card (when typing or searching) */}
          {lookupPreview && (
            <div
              className="att-lookup-preview-card"
              style={{
                border: `1px solid ${lookupPreview.is_eligible ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => handleOpenMemberDetails(lookupPreview.member)}
                title="Click to view full member details, pass & payments"
              >
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
                  <div className="att-lookup-name" style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: '#ff7a00' }}>
                    <span>{lookupPreview.member.name}</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>🔍</span>
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                    }}>
                      <AttendanceIcons.Check size={12} color="#22c55e" /> Eligible for Entry ({lookupPreview.active_subscription?.plan_name})
                    </span>
                    <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>
                      Expires on {lookupPreview.active_subscription?.end_date} ({lookupPreview.active_subscription?.days_remaining} days left)
                    </div>
                  </div>
                ) : (
                  <div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#ef4444',
                    }}>
                      <AttendanceIcons.X size={12} color="#ef4444" /> Ineligible: {lookupPreview.ineligibility_reason}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {lookupPreview.is_currently_inside && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                    <AttendanceIcons.Check size={12} color="#16a34a" /> Admitted Today
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleProcessCheckIn({ member_id: lookupPreview.member.id })}
                  disabled={!lookupPreview.is_eligible}
                  style={{ fontWeight: 700, padding: '8px 16px' }}
                >
                  Grant Admittance
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Attendance Feed & Records Table Card */}
      <div className="att-records-card">
        {/* Header and Filter Tabs */}
        <div className="att-records-header">
          <div>
            <h3 className="att-records-title">
              Live Attendance Register & Visit History
            </h3>
            <p className="att-records-desc">
              Audited front-desk log of check-in methods, workout durations, and security scans.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="att-filter-pills-row">
            {[
              { id: 'all', label: 'All Today' },
              { id: 'inside', label: `Inside Gym (${summary.currently_inside})` },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`att-filter-pill ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter(f.id);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar - Matching Membership & Member side bar style */}
        <div className="search-bar-wrapper" style={{ maxWidth: 440, position: 'relative', marginBottom: 16 }}>
          <input
            type="text"
            className="form-input search-input-field"
            placeholder="Search attendance by member name, phone, or TG-XXXX code..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{
              paddingLeft: 36,
              paddingRight: 14,
              width: '100%',
              height: 42,
              minHeight: 42,
              boxSizing: 'border-box',
              fontSize: 13.5,
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
            }}
          >
            <AttendanceIcons.Search size={15} />
          </span>
        </div>

        {/* Attendance Records Table */}
        {isLoadingRecords ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#a1a1aa' }}>
            <span className="spinner" style={{ width: 28, height: 28, display: 'inline-block', marginBottom: 12 }}></span>
            <p>Loading attendance registers...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="att-empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <AttendanceIcons.ClipboardList size={38} color="#94a3b8" />
            </div>
            <p className="att-empty-title">No attendance records found for this filter</p>
            <p style={{ fontSize: 13 }}>Scan members at the reception station to register visits.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan & Pass</th>
                  <th>Check-In</th>
                  <th>Check-Out / Duration</th>
                  <th>Method</th>
                  <th>Status</th>
                  {isOwnerOrAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
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
                        <button
                          type="button"
                          onClick={() => handleOpenMemberDetails(r.member || r.member_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'block',
                            width: '100%',
                          }}
                          title="Click to view full membership pass, payment history & details"
                        >
                          <div className="att-cell-name" style={{
                            color: '#ff7a00',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'opacity 0.2s',
                          }}>
                            <span>{r.member?.name || `Member #${r.member_id}`}</span>
                            <span style={{ fontSize: 11, opacity: 0.8 }} title="View details">🔍</span>
                          </div>
                          <div className="att-cell-code">
                            {r.member?.member_code || ''}
                          </div>
                        </button>
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
                            background: 'rgba(255, 138, 0, 0.12)',
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
                        <div className="att-cell-time">
                          {r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                        <div className="att-cell-subtime">
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
                            <button
                              type="button"
                              onClick={() => handleProcessCheckOut(null, r.id)}
                              style={{
                                marginLeft: 4,
                                background: 'transparent',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                color: '#22c55e',
                                borderRadius: 4,
                                padding: '1px 5px',
                                fontSize: 10,
                                cursor: 'pointer',
                              }}
                              title="Check out member"
                            >
                              Exit
                            </button>
                          </span>
                        ) : r.check_out_time ? (
                          <div>
                            <div className="att-cell-time">
                              {new Date(r.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="att-cell-subtime">
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
                          background: 'rgba(255, 255, 255, 0.08)',
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

                      {/* Actions */}
                      {isOwnerOrAdmin && (
                        <td style={{ textAlign: 'right' }}>
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
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}
                aria-label="Close"
              >
                <AttendanceIcons.X size={15} />
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

      {/* ==================== COMPREHENSIVE MEMBER DETAILS MODAL ==================== */}
      {isMemberDetailModalOpen && detailMember && (
        <div className="modal-backdrop" onClick={() => setIsMemberDetailModalOpen(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 680,
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 0,
              borderRadius: 16,
              background: 'var(--gym-card-bg, #141822)',
              border: '1px solid var(--gym-card-border, #1e293b)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--gym-card-border, #1e293b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.08) 0%, rgba(0,0,0,0) 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ff7a00, #ea580c)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 900,
                  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
                }}>
                  {detailMember.name ? detailMember.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--gym-text-main, #ffffff)' }}>
                      {detailMember.name}
                    </h3>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#ff7a00',
                      background: 'rgba(255, 122, 0, 0.12)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}>
                      {detailMember.member_code || `TG-${String(detailMember.id || detailMember.user_id).padStart(4, '0')}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gym-text-muted, #94a3b8)', marginTop: 3 }}>
                    {detailMember.phone || 'No phone'} • {detailMember.email || 'No email'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsMemberDetailModalOpen(false)}
                style={{ padding: '6px 10px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--gym-card-border, #1e293b)',
              padding: '0 16px',
              background: 'rgba(0,0,0,0.1)',
            }}>
              {[
                { id: 'pass', label: '💳 Pass & Card' },
                { id: 'payments', label: `💰 Payments (${memberPayments.length})` },
                { id: 'attendance', label: `📋 Visits (${memberAttendance.length})` },
                { id: 'profile', label: '👤 Profile & Emergency' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailActiveTab(tab.id)}
                  style={{
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: detailActiveTab === tab.id ? '2px solid #ff7a00' : '2px solid transparent',
                    color: detailActiveTab === tab.id ? '#ff7a00' : 'var(--gym-text-muted, #94a3b8)',
                    fontWeight: detailActiveTab === tab.id ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ padding: 24 }}>
              {isLoadingDetail ? (
                <div style={{ textAlign: 'center', padding: 36, color: 'var(--gym-text-muted, #94a3b8)' }}>
                  <span className="spinner" style={{ width: 26, height: 26, display: 'inline-block', marginBottom: 10 }}></span>
                  <p>Loading member data & records...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: PASS & CARD */}
                  {detailActiveTab === 'pass' && (
                    <div>
                      {/* Subscription Status Card */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--gym-card-border, #1e293b)',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gym-text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                            Current Gym Membership Pass
                          </span>
                          {detailMember.active_subscription ? (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#22c55e',
                              background: 'rgba(34, 197, 94, 0.15)',
                              padding: '2px 8px',
                              borderRadius: 12,
                              textTransform: 'uppercase'
                            }}>
                              ● Active Pass
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.15)',
                              padding: '2px 8px',
                              borderRadius: 12,
                              textTransform: 'uppercase'
                            }}>
                              No Active Pass
                            </span>
                          )}
                        </div>

                        {detailMember.active_subscription ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)' }}>Package / Plan</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#ff7a00', marginTop: 2 }}>
                                {detailMember.active_subscription.plan_name || 'Standard Plan'}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--gym-text-muted, #94a3b8)', fontFamily: 'monospace' }}>
                                Ref: {detailMember.active_subscription.subscription_number}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)' }}>Start Date</div>
                              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                                {detailMember.active_subscription.start_date || '—'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)' }}>Expiry Date</div>
                              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                                {detailMember.active_subscription.end_date || '—'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)' }}>Days Left</div>
                              <div style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: (detailMember.active_subscription.days_remaining || 0) <= 5 ? '#f59e0b' : '#22c55e',
                                marginTop: 2
                              }}>
                                {detailMember.active_subscription.days_remaining ?? '—'} days remaining
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, color: '#f59e0b' }}>
                              ⚠️ No active subscription found. Member requires pass renewal or package assignment before entry.
                            </div>
                            {onNavigateToMemberships && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setIsMemberDetailModalOpen(false);
                                  onNavigateToMemberships();
                                }}
                                style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
                              >
                                Renew Pass →
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Official Permanent Member Card */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gym-text-muted, #94a3b8)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Permanent Member Credential & Digital Turnstile Card
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <PermanentMemberCard
                            member={{
                              id: detailMember.id,
                              user_id: detailMember.user_id,
                              name: detailMember.name,
                              member_code: detailMember.member_code,
                              phone: detailMember.phone,
                              email: detailMember.email,
                              joined_at: detailMember.joined_at,
                              card_expires_at: detailMember.card_expires_at,
                              qr_code_token: detailMember.qr_code_token,
                            }}
                            membershipTitle={detailMember.active_subscription?.plan_name ? detailMember.active_subscription.plan_name.toUpperCase() : 'PREMIUM MEMBER'}
                            showActions={true}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PAYMENTS */}
                  {detailActiveTab === 'payments' && (
                    <div>
                      {memberPayments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--gym-text-muted, #94a3b8)' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>No payments recorded for this member</p>
                          <p style={{ fontSize: 12, marginTop: 4 }}>Front-desk fees or renewals will show up here.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="gym-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Receipt #</th>
                                <th>Item / Plan</th>
                                <th>Amount (ETB)</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {memberPayments.map(p => (
                                <tr key={p.id}>
                                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ff7a00', fontSize: 12 }}>
                                    {p.receipt_number || p.payment_number}
                                  </td>
                                  <td style={{ fontSize: 12.5 }}>
                                    {p.payable?.plan_name || p.payment_type?.replace('_', ' ') || 'Subscription'}
                                  </td>
                                  <td style={{ fontWeight: 800, color: '#22c55e', fontSize: 13 }}>
                                    {Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB
                                  </td>
                                  <td>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#60a5fa' }}>
                                      {p.payment_method?.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td>
                                    <span style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      color: p.status === 'completed' ? '#22c55e' : '#f59e0b',
                                    }}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: 12, color: 'var(--gym-text-muted, #94a3b8)' }}>
                                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ATTENDANCE HISTORY */}
                  {detailActiveTab === 'attendance' && (
                    <div>
                      {memberAttendance.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 32, color: 'var(--gym-text-muted, #94a3b8)' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>No check-in history found</p>
                          <p style={{ fontSize: 12, marginTop: 4 }}>Turnstile scans and desk entries will appear here.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="gym-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Check-In</th>
                                <th>Check-Out</th>
                                <th>Duration</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {memberAttendance.map(a => (
                                <tr key={a.id}>
                                  <td style={{ fontSize: 12.5, fontWeight: 600 }}>
                                    {a.check_in_time ? new Date(a.check_in_time).toLocaleDateString() : '—'}
                                  </td>
                                  <td style={{ fontSize: 12 }}>
                                    {a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </td>
                                  <td style={{ fontSize: 12 }}>
                                    {a.check_out_time ? (
                                      new Date(a.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    ) : (
                                      <span style={{ color: '#22c55e', fontWeight: 700 }}>In Gym</span>
                                    )}
                                  </td>
                                  <td style={{ fontSize: 12, color: 'var(--gym-text-muted, #94a3b8)' }}>
                                    {a.duration_minutes ? `${Math.floor(a.duration_minutes / 60)}h ${a.duration_minutes % 60}m` : (a.check_out_time ? '—' : 'Active')}
                                  </td>
                                  <td>
                                    <span style={{
                                      fontSize: 11,
                                      fontWeight: 700,
                                      textTransform: 'uppercase',
                                      color: a.status === 'admitted' ? '#22c55e' : '#ef4444',
                                    }}>
                                      {a.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: PROFILE & EMERGENCY */}
                  {detailActiveTab === 'profile' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 10, border: '1px solid var(--gym-card-border, #1e293b)' }}>
                        <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>Personal Info</div>
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <div><strong>Full Name:</strong> {detailMember.name || '—'}</div>
                          <div style={{ marginTop: 4 }}><strong>Gender:</strong> {detailMember.gender || 'Not specified'}</div>
                          <div style={{ marginTop: 4 }}><strong>Date of Birth:</strong> {detailMember.date_of_birth || 'Not specified'}</div>
                          <div style={{ marginTop: 4 }}><strong>Blood Type:</strong> {detailMember.blood_type || '—'}</div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 10, border: '1px solid var(--gym-card-border, #1e293b)' }}>
                        <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>Emergency Contact</div>
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          <div><strong>Contact Name:</strong> {detailMember.emergency_contact_name || 'Not provided'}</div>
                          <div style={{ marginTop: 4 }}>
                            <strong>Contact Phone:</strong> {detailMember.emergency_contact_phone ? (
                              <a href={`tel:${detailMember.emergency_contact_phone}`} style={{ color: '#ff7a00', textDecoration: 'none' }}>
                                {detailMember.emergency_contact_phone}
                              </a>
                            ) : 'Not provided'}
                          </div>
                          <div style={{ marginTop: 4 }}><strong>Relationship:</strong> {detailMember.emergency_contact_relationship || '—'}</div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 10, border: '1px solid var(--gym-card-border, #1e293b)', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: 11, color: 'var(--gym-text-muted, #94a3b8)', textTransform: 'uppercase', fontWeight: 700 }}>Registration & Credential</div>
                        <div style={{ marginTop: 8, fontSize: 13, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                          <div><strong>Permanent Member Code:</strong> <span style={{ fontFamily: 'monospace', color: '#ff7a00' }}>{detailMember.member_code}</span></div>
                          <div><strong>Registration Date:</strong> {detailMember.joined_at || '—'}</div>
                          <div><strong>Annual Card Expiry:</strong> {detailMember.card_expires_at || '—'}</div>
                          <div><strong>Account Status:</strong> <span style={{ textTransform: 'uppercase', color: '#22c55e', fontWeight: 700 }}>{detailMember.status || 'Active'}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
