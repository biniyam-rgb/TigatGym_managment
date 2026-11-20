import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

const Icons = {
  CheckCircle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  AlertTriangle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Dumbbell: ({ size = 20, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.17 1.17a2 2 0 0 1-2.83 0L3 11a2 2 0 0 1 0-2.83L4.17 7a2 2 0 0 0 0-2.83L3.17 3.17a2 2 0 0 1 2.83 0L7 4.17a2 2 0 0 0 2.83 0L21 15.34a2 2 0 0 1 0 2.83L19.83 19.34a2 2 0 0 0 0 2.83l1.17 1.17a2 2 0 0 0 2.83-2.83l-1.17-1.17a2 2 0 0 1 0-2.83" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
    </svg>
  ),
  MapPin: ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  UserPlus: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="11" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Users: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Calendar: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Activity: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  TrendingUp: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Search: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Edit: ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash2: ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Grid: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  List: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Check: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  X: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronDown: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  MoreVertical: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1.3" fill="currentColor" />
      <circle cx="12" cy="5" r="1.3" fill="currentColor" />
      <circle cx="12" cy="19" r="1.3" fill="currentColor" />
    </svg>
  ),
  ArrowLeft: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  RefreshCw: ({ size = 15, color = 'currentColor', className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  ),
  Flame: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Zap: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  CreditCard: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  Info: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  User: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Bike: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h4" />
    </svg>
  ),
  Heart: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
};

const renderCategoryIcon = (iconType, size = 13, color = 'currentColor') => {
  switch (iconType) {
    case 'spin':
      return <Icons.Bike size={size} color={color} />;
    case 'yoga':
      return <Icons.Heart size={size} color={color} />;
    case 'olympic':
    case 'strength':
      return <Icons.Dumbbell size={size} color={color} />;
    case 'core':
      return <Icons.Flame size={size} color={color} />;
    case 'hiit':
    default:
      return <Icons.Zap size={size} color={color} />;
  }
};

// Dynamic visual matcher for classes to give luxury photo headers
const getClassVisual = (className = '', room = '') => {
  const n = (className + ' ' + room).toLowerCase();
  if (n.includes('spin') || n.includes('cycl') || n.includes('bike') || n.includes('cadence')) {
    return {
      image: '/classes/spin.jpg',
      category: 'Cardio Cycling',
      intensity: 'High Cadence',
      badgeColor: '#06b6d4',
      duration: '45-60 min',
      iconType: 'spin',
      icon: renderCategoryIcon('spin', 13),
    };
  }
  if (n.includes('yoga') || n.includes('mobility') || n.includes('zen') || n.includes('stretch') || n.includes('pilates')) {
    return {
      image: '/classes/yoga.jpg',
      category: 'Mind & Body',
      intensity: 'All Levels',
      badgeColor: '#10b981',
      duration: '60 min',
      iconType: 'yoga',
      icon: renderCategoryIcon('yoga', 13),
    };
  }
  if (n.includes('olympic') || n.includes('lifting') || n.includes('snatch') || n.includes('barbell')) {
    return {
      image: '/classes/olympic.jpg',
      category: 'Weightlifting',
      intensity: 'Advanced Clinic',
      badgeColor: '#f59e0b',
      duration: '90 min',
      iconType: 'olympic',
      icon: renderCategoryIcon('olympic', 13),
    };
  }
  if (n.includes('strength') || n.includes('circuit') || n.includes('kettlebell') || n.includes('turf')) {
    return {
      image: '/classes/strength.jpg',
      category: 'Functional Strength',
      intensity: 'Compound Intervals',
      badgeColor: '#ea580c',
      duration: '60 min',
      iconType: 'strength',
      icon: renderCategoryIcon('strength', 13),
    };
  }
  if (n.includes('core') || n.includes('ab') || n.includes('abs') || n.includes('blast')) {
    return {
      image: '/classes/core.jpg',
      category: 'Core & Stability',
      intensity: 'Direct Hypertrophy',
      badgeColor: '#8b5cf6',
      duration: '45 min',
      iconType: 'core',
      icon: renderCategoryIcon('core', 13),
    };
  }
  // Default to HIIT
  return {
    image: '/classes/hiit.jpg',
    category: 'HIIT Conditioning',
    intensity: 'High Caloric Burn',
    badgeColor: '#ff7a00',
    duration: '50-60 min',
    iconType: 'hiit',
    icon: renderCategoryIcon('hiit', 13),
  };
};

const formatIsoDate = (isoString) => {
  if (!isoString) return 'TBD';
  try {
    const s = String(isoString).includes('T') ? isoString : `${isoString}T12:00:00`;
    const d = new Date(s);
    if (isNaN(d.getTime())) return 'TBD';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return 'TBD';
  }
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export default function FitnessClassManagement({ initialOpenSchedule = false }) {
  const { user, hasRole, primaryRole } = useAuth();
  const userId = user?.id;
  const canSchedule = hasRole('owner') || hasRole('admin');
  const canBookForOthers = hasRole('owner') || hasRole('admin') || hasRole('receptionist');
  const canViewRoster = hasRole('owner') || hasRole('admin') || hasRole('trainer') || hasRole('receptionist');
  const isTrainer = (primaryRole === 'trainer' || hasRole('trainer')) && !hasRole('owner') && !hasRole('admin');
  const isStaff = canSchedule || canBookForOthers || hasRole('trainer');

  // Core Data
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({
    total_classes: 0,
    today_classes: 0,
    total_bookings: 0,
    attended_count: 0,
    occupancy_rate: 0,
    active_trainers: 0,
  });
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Date and Time Helpers
  const pad = (n) => String(n).padStart(2, '0');
  const toLocalDatetimeString = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const toDatetimeLocal = (val) => {
    if (!val) return '';
    return val.replace(' ', 'T').slice(0, 16);
  };
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Evaluates live class status based on current time & session timestamps
  const getComputedClassStatus = (c) => {
    if (!c) return { status: 'scheduled', label: 'Scheduled', tagClass: 'scheduled', isOngoing: false, isCompleted: false, isCancelled: false, isStarted: false };
    if (c.status === 'cancelled') {
      return { status: 'cancelled', label: 'Cancelled', tagClass: 'cancelled', isOngoing: false, isCompleted: false, isCancelled: true, isStarted: true };
    }
    const nowTime = currentTimestamp;
    const st = c.start_time ? new Date(c.start_time).getTime() : 0;
    const et = c.end_time ? new Date(c.end_time).getTime() : (st + 3600000);

    if (et > 0 && nowTime >= et) {
      return { status: 'completed', label: 'Completed', tagClass: 'completed', isOngoing: false, isCompleted: true, isCancelled: false, isStarted: true };
    }
    if (st > 0 && nowTime >= st && (et === 0 || nowTime < et)) {
      return { status: 'ongoing', label: 'Happening Now', tagClass: 'ongoing', isOngoing: true, isCompleted: false, isCancelled: false, isStarted: true };
    }
    return { status: 'scheduled', label: 'Scheduled', tagClass: 'scheduled', isOngoing: false, isCompleted: false, isCancelled: false, isStarted: false };
  };

  // Calculates remaining time to start if the session is scheduled today
  const getTimeUntilStart = (startIso) => {
    if (!startIso) return null;
    try {
      const now = new Date();
      const st = new Date(startIso);
      const diffMs = st.getTime() - now.getTime();
      if (diffMs <= 0) return null;

      const isToday =
        now.getFullYear() === st.getFullYear() &&
        now.getMonth() === st.getMonth() &&
        now.getDate() === st.getDate();

      if (!isToday) return null;

      const totalMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;

      if (hours === 0) {
        return `${mins}m`;
      }
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } catch {
      return null;
    }
  };

  const isClassPast = (isoTime) => {
    if (!isoTime) return false;
    try {
      return new Date(isoTime).getTime() <= currentTimestamp;
    } catch {
      return false;
    }
  };

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [quickDate, setQuickDate] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // In-Page Views & Panels State
  const [isScheduleOpen, setIsScheduleOpen] = useState(initialOpenSchedule);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [targetEditClass, setTargetEditClass] = useState(null);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const [rosterClass, setRosterClass] = useState(null);
  const [rosterBookings, setRosterBookings] = useState([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterFilter, setRosterFilter] = useState('all'); // 'all' | 'reserved' | 'attended' | 'no_show'
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [targetClass, setTargetClass] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState('cash'); // 'cash' | 'chapa' | 'complimentary' | 'membership_pass'
  const [paymentReference, setPaymentReference] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [cancelTargetClass, setCancelTargetClass] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingBookingId, setActionLoadingBookingId] = useState(null);
  const [confirmDeleteBookingId, setConfirmDeleteBookingId] = useState(null);

  // Forms
  const [scheduleForm, setScheduleForm] = useState({
    name: 'Tigat Morning HIIT',
    description: 'High-intensity interval circuit targeting explosive power, athletic conditioning, and rapid caloric burn.',
    trainer_id: '',
    room: 'Studio A (Main Hall)',
    capacity: 20,
    start_time: '',
    end_time: '',
    recurrence: 'weekly',
    fee_type: 'free',
    price: 0,
    image: null,
    image_url: '/classes/hiit.jpg',
    image_preview: '/classes/hiit.jpg',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    trainer_id: '',
    room: '',
    capacity: 20,
    start_time: '',
    end_time: '',
    recurrence: 'none',
    fee_type: 'free',
    price: 0,
    status: 'scheduled',
    image: null,
    image_url: '/classes/hiit.jpg',
    image_preview: '/classes/hiit.jpg',
  });

  // Handle Cover Photo Upload & Preset Selection
  const handleImageFileSelect = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (isEdit) {
        setEditForm((prev) => ({
          ...prev,
          image: base64,
          image_url: null,
          image_preview: base64,
        }));
      } else {
        setScheduleForm((prev) => ({
          ...prev,
          image: base64,
          image_url: null,
          image_preview: base64,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetImage = (url, isEdit = false) => {
    if (isEdit) {
      setEditForm((prev) => ({
        ...prev,
        image: null,
        image_url: url,
        image_preview: url,
      }));
    } else {
      setScheduleForm((prev) => ({
        ...prev,
        image: null,
        image_url: url,
        image_preview: url,
      }));
    }
  };

  // Action Dropdown Menu State
  const [openMenuClassId, setOpenMenuClassId] = useState(null);

  // Close Action Dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuClassId(null);
    };
    if (openMenuClassId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuClassId]);



  // Load Classes & Stats
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (isTrainer && userId) params.trainer_id = userId;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [classesRes, statsRes] = await Promise.allSettled([
        apiClient.getFitnessClasses(params),
        apiClient.getFitnessClassStats(),
      ]);

      if (classesRes.status === 'fulfilled') {
        setClasses(classesRes.value?.data || []);
      } else {
        throw new Error(classesRes.reason?.message || 'Failed to fetch classes.');
      }

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value?.data || {});
      }
    } catch (err) {
      setError(err.message || 'Failed to load class schedule.');
    } finally {
      setIsLoading(false);
    }
  }, [isTrainer, userId, statusFilter, dateFilter, searchQuery]);

  // Initial Load of Trainers & Members
  useEffect(() => {
    let ignore = false;

    Promise.allSettled([
      canSchedule ? apiClient.getTrainers() : Promise.resolve({ data: [] }),
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
          const mData = mResult.value?.data;
          const mList = Array.isArray(mData) ? mData : (mData?.data || []);
          setMembers(mList);
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [canSchedule, canBookForOthers]);

  // Ensure members list is populated if book modal opens
  useEffect(() => {
    if (isBookModalOpen && members.length === 0 && canBookForOthers) {
      apiClient.getMembers({ per_page: 100 })
        .then((res) => {
          const mData = res?.data;
          const mList = Array.isArray(mData) ? mData : (mData?.data || []);
          setMembers(mList);
        })
        .catch(console.error);
    }
  }, [isBookModalOpen, members.length, canBookForOthers]);

  // Trigger data load on filter changes
  useEffect(() => {
    setTimeout(() => {
      loadData();
    }, 0);
  }, [loadData]);

  // Quick Date Helpers
  const handleQuickDateSelect = (type) => {
    setQuickDate(type);
    if (type === 'all') {
      setDateFilter('');
    } else if (type === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      setDateFilter(todayStr);
    } else if (type === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDateFilter(tomorrow.toISOString().split('T')[0]);
    }
  };

  // Schedule New Class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    const cap = parseInt(scheduleForm.capacity, 10);
    if (isNaN(cap) || cap < 10 || cap > 40) {
      setError('Max capacity must be between 10 and 40 spots.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: scheduleForm.name,
        description: scheduleForm.description,
        trainer_id: scheduleForm.trainer_id,
        room: scheduleForm.room,
        capacity: cap,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        recurrence: scheduleForm.recurrence,
        price: scheduleForm.fee_type === 'free' ? 0 : (parseFloat(scheduleForm.price) || 0),
        image: scheduleForm.image || undefined,
        image_url: scheduleForm.image ? undefined : (scheduleForm.image_url || undefined),
      };
      const res = await apiClient.createFitnessClass(payload);
      setSuccessMessage(res.message || 'Fitness class scheduled successfully.');
      setIsScheduleOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to schedule class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal (Cannot edit if session has already started or completed)
  const handleOpenEdit = (c) => {
    const cs = getComputedClassStatus(c);
    if (cs.isStarted) {
      setError(`Cannot edit class "${c.name}": session has already started or completed.`);
      return;
    }
    const visual = getClassVisual(c.name, c.room);
    const isPaid = (c.price || 0) > 0;
    const currentImg = c.image_url || visual.image;
    setTargetEditClass(c);
    setEditForm({
      name: c.name || '',
      description: c.description || '',
      trainer_id: c.trainer_id || (c.trainer?.id ?? ''),
      room: c.room || 'Studio A (Main Hall)',
      capacity: c.capacity || 20,
      start_time: toDatetimeLocal(c.start_time),
      end_time: toDatetimeLocal(c.end_time),
      recurrence: c.recurrence || 'none',
      fee_type: isPaid ? 'paid' : 'free',
      price: c.price || 0,
      status: c.status || 'scheduled',
      image: null,
      image_url: currentImg,
      image_preview: currentImg,
    });
    setIsEditOpen(true);
    setTimeout(() => {
      const panel = document.getElementById('class-inpage-edit-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  // Submit Edit Class (Enforces class not started & capacity 10 - 40)
  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!targetEditClass) return;
    const cs = getComputedClassStatus(targetEditClass);
    if (cs.isStarted) {
      setError(`Cannot edit class "${targetEditClass.name}": session has already started or completed.`);
      setIsEditOpen(false);
      return;
    }
    const cap = parseInt(editForm.capacity, 10);
    if (isNaN(cap) || cap < 10 || cap > 40) {
      setError('Max capacity must be between 10 and 40 spots.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: editForm.name,
        description: editForm.description,
        trainer_id: editForm.trainer_id,
        room: editForm.room,
        capacity: cap,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        recurrence: editForm.recurrence || 'none',
        price: editForm.fee_type === 'free' ? 0 : (parseFloat(editForm.price) || 0),
        status: editForm.status === 'cancelled' ? 'cancelled' : undefined,
        image: editForm.image || undefined,
        image_url: editForm.image ? undefined : (editForm.image_url || undefined),
      };
      const res = await apiClient.updateFitnessClass(targetEditClass.id, payload);
      setSuccessMessage(res.message || `Class "${editForm.name}" updated successfully.`);
      setIsEditOpen(false);
      setTargetEditClass(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update class details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel / Delete Class (Cannot cancel if session has already started or completed)
  const handleCancelClassSubmit = async (e) => {
    e.preventDefault();
    if (!cancelTargetClass) return;
    const cs = getComputedClassStatus(cancelTargetClass);
    if (cs.isStarted) {
      setError(`Cannot cancel class "${cancelTargetClass.name}": session has already started or completed.`);
      setCancelTargetClass(null);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.deleteFitnessClass(cancelTargetClass.id, cancelReason);
      setSuccessMessage(res.message || `Class "${cancelTargetClass.name}" cancelled.`);
      setCancelTargetClass(null);
      setCancelReason('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel class.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Attendee Roster
  const handleOpenRoster = async (c) => {
    setRosterClass(c);
    setRosterSearch('');
    setRosterFilter('all');
    setConfirmDeleteBookingId(null);
    setIsRosterOpen(true);
    setIsRosterLoading(true);
    setError(null);
    try {
      const res = await apiClient.getFitnessClassRoster(c.id);
      setRosterBookings(res.data?.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to load attendee roster.');
    } finally {
      setIsRosterLoading(false);
    }
  };

  // Attendee Check-In Toggle
  const handleCheckInToggle = async (bookingId, currentStatus) => {
    if (!rosterClass || actionLoadingBookingId) return;
    const nextStatus = currentStatus === 'attended' ? 'reserved' : 'attended';
    setActionLoadingBookingId(bookingId);
    setError(null);
    // Optimistic local state update for instant UI feedback
    setRosterBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );
    try {
      await apiClient.checkInClassBooking(rosterClass.id, bookingId, nextStatus);
      setSuccessMessage(nextStatus === 'attended' ? 'Attendee marked as Attended' : 'Attendee status reverted to Reserved');
      loadData();
    } catch (err) {
      // Revert optimistic update on failure
      setRosterBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: currentStatus } : b))
      );
      setError(err.message || 'Failed to update attendance status.');
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  // Attendee Mark No-Show
  const handleMarkNoShow = async (bookingId) => {
    if (!rosterClass || actionLoadingBookingId) return;
    setActionLoadingBookingId(bookingId);
    setError(null);
    const prevStatus = rosterBookings.find((b) => b.id === bookingId)?.status || 'reserved';
    // Optimistic local state update
    setRosterBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'no_show' } : b))
    );
    try {
      await apiClient.checkInClassBooking(rosterClass.id, bookingId, 'no_show');
      setSuccessMessage('Attendee marked as No-Show.');
      loadData();
    } catch (err) {
      // Revert optimistic update on failure
      setRosterBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: prevStatus } : b))
      );
      setError(err.message || 'Failed to mark as no-show.');
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  // Trigger Inline Delete Confirmation (Zero Popups)
  const handlePromptRemoveBooking = (bookingId) => {
    setConfirmDeleteBookingId(bookingId);
  };

  // Cancel Inline Delete Confirmation
  const handleCancelRemoveBooking = () => {
    setConfirmDeleteBookingId(null);
  };

  // Execute Remove Booking from Roster
  const executeRemoveBooking = async (bookingId) => {
    if (!rosterClass || actionLoadingBookingId) return;
    setActionLoadingBookingId(bookingId);
    setError(null);
    try {
      await apiClient.removeClassBooking(rosterClass.id, bookingId);
      setRosterBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setConfirmDeleteBookingId(null);
      setSuccessMessage('Member reservation removed from class roster.');
      window.dispatchEvent(new Event('gymcore:refresh'));
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to remove booking.');
    } finally {
      setActionLoadingBookingId(null);
    }
  };

  // Open Book Member In-Page Panel (Scrolls directly into view)
  const handleOpenBook = (c) => {
    const cs = getComputedClassStatus(c);
    if (cs.isStarted) {
      setError(`Booking closed: Class "${c.name}" has already started or completed.`);
      return;
    }
    setTargetClass(c);
    setSelectedMemberId(canBookForOthers ? '' : String(user?.id || ''));
    setBookingPaymentMethod(c.price > 0 ? 'cash' : 'membership_pass');
    setCustomAmount(c.price > 0 ? String(c.price) : '');
    setPaymentReference('');
    setIsBookModalOpen(true);
    setTimeout(() => {
      const panel = document.getElementById('class-inpage-book-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  // Close Roster View
  const handleCloseRoster = () => {
    setIsRosterOpen(false);
    setRosterClass(null);
    setIsBookModalOpen(false);
    setConfirmDeleteBookingId(null);
    setActionLoadingBookingId(null);
  };

  // Direct Booking Self (Enforces class not yet started)
  const handleBookSelf = async (c) => {
    const cs = getComputedClassStatus(c);
    if (cs.isStarted) {
      setError(`Booking closed: Class "${c.name}" has already started.`);
      return;
    }
    // If paid class, open book modal to select Cash or Chapa payment
    if (c.price > 0) {
      handleOpenBook(c);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        member_id: user.id,
        payment_method: 'membership_pass',
      };
      const res = await apiClient.bookFitnessClass(c.id, payload);
      setSuccessMessage(res.message || `Spot confirmed in ${c.name}!`);
      window.dispatchEvent(new Event('gymcore:refresh'));
      loadData();
    } catch (err) {
      setError(err.message || 'Booking failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Staff Booking for Member or Self (Enforces class not yet started + Cash / Chapa / Pass)
  const handleBookForMember = async (e) => {
    e.preventDefault();
    if (!targetClass) return;
    const effectiveMemberId = selectedMemberId || (!canBookForOthers ? user?.id : null);
    if (!effectiveMemberId) {
      setError('Please select a gym member to book.');
      return;
    }

    const cs = getComputedClassStatus(targetClass);
    if (cs.isStarted) {
      setError(`Booking closed: Class "${targetClass.name}" has already started or completed.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        member_id: Number(effectiveMemberId),
        payment_method: targetClass.price > 0 ? bookingPaymentMethod : 'membership_pass',
      };
      if (targetClass.price > 0 && (bookingPaymentMethod === 'cash' || bookingPaymentMethod === 'chapa')) {
        const amt = parseFloat(customAmount) || targetClass.price || 0;
        if (amt > 0) {
          payload.amount = amt;
        }
      }
      if (paymentReference.trim()) {
        payload.payment_reference = paymentReference.trim();
      }

      const res = await apiClient.bookFitnessClass(targetClass.id, payload);
      setSuccessMessage(res.message || 'Spot booked successfully.');
      window.dispatchEvent(new Event('gymcore:refresh'));
      setIsBookModalOpen(false);
      setSelectedMemberId('');
      setPaymentReference('');
      setCustomAmount('');
      loadData();
      if (isRosterOpen && rosterClass?.id === targetClass.id) {
        handleOpenRoster(targetClass);
      }
    } catch (err) {
      setError(err.message || 'Booking failed. Verify member has an active pass or valid payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Direct Member Cancel Own Booking (Zero native popups)
  const handleCancelOwnBooking = async (c) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.cancelFitnessClassBooking(c.id, { member_id: user.id });
      setSuccessMessage(res.message || `Spot reservation for "${c.name}" cancelled.`);
      window.dispatchEvent(new Event('gymcore:refresh'));
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered in-memory search for real-time responsiveness
  const filteredClasses = useMemo(() => {
    let list = classes;
    // Trainer role scoping: in My Classes, only show classes assigned to this trainer (applies to both cards and table)
    if (isTrainer && userId) {
      list = list.filter((c) => {
        const cTrainerId = c.trainer_id || c.trainer?.id;
        return String(cTrainerId) === String(userId);
      });
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.room?.toLowerCase().includes(q) ||
        c.trainer?.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [classes, isTrainer, userId, searchQuery]);

  // Filtered attendees inside Roster View
  const filteredRosterBookings = useMemo(() => {
    let list = rosterBookings;
    if (rosterFilter !== 'all') {
      list = list.filter((b) => b.status === rosterFilter);
    }
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(
        (b) =>
          b.member?.name?.toLowerCase().includes(q) ||
          b.member?.member_profile?.member_code?.toLowerCase().includes(q) ||
          b.member?.member_code?.toLowerCase().includes(q) ||
          b.member?.phone?.toLowerCase().includes(q) ||
          b.member?.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rosterBookings, rosterFilter, rosterSearch]);

  return (
    <div className="classes-module-wrapper" style={{ width: '100%', maxWidth: '100%', margin: 0, padding: 0 }}>
      {/* Top System Notifications */}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.CheckCircle size={16} />
          <span style={{ flex: 1 }}>{successMessage}</span>
          <button type="button" className="close-btn" onClick={() => setSuccessMessage(null)}>
            <Icons.X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.AlertTriangle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" className="close-btn" onClick={() => setError(null)}>
            <Icons.X size={15} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONDITIONAL RENDER: FULL-PAGE ROSTER VIEW OR TIMETABLE VIEW              */}
      {/* ========================================================================= */}
      {isRosterOpen && rosterClass ? (
        /* ========================================================================= */
        /* 1. FULL-PAGE ATTENDEE ROSTER VIEW (100% IN-PAGE, ZERO POPUP BACKDROP)     */
        /* ========================================================================= */
        <div className="roster-page-view" style={{ animation: 'inpageSlideDown 0.2s ease-out' }}>
          {(() => {
            const visual = getClassVisual(rosterClass.name, rosterClass.room);
            const isPast = isClassPast(rosterClass.start_time);
            const reservedCount = rosterBookings.filter((b) => b.status === 'reserved').length;
            const attendedCount = rosterBookings.filter((b) => b.status === 'attended').length;
            const totalEnrolled = reservedCount + attendedCount;
            const capacity = rosterClass.capacity || 20;

            return (
              <>
                {/* 1. Executive Top Navigation Bar */}
                <div className="roster-page-nav-bar">
                  <button
                    type="button"
                    className="btn-back-to-classes"
                    onClick={handleCloseRoster}
                    title="Return to Group Class Timetable"
                  >
                    <div className="back-icon-circle">
                      <Icons.ArrowLeft size={16} />
                    </div>
                    <div className="back-text-group">
                      <span className="back-title">Back to Schedule</span>
                      <span className="back-subtitle">Group Class Timetable</span>
                    </div>
                  </button>

                  <div className="roster-header-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenRoster(rosterClass)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12.5, fontWeight: 700 }}
                      title="Refresh Attendee Roster"
                      disabled={isRosterLoading}
                    >
                      <Icons.RefreshCw size={14} className={isRosterLoading ? 'spin' : ''} />
                      <span>{isRosterLoading ? 'Refreshing...' : 'Refresh Roster'}</span>
                    </button>

                    {canBookForOthers && !isPast && (
                      <button
                        type="button"
                        className={`btn btn-sm ${isBookModalOpen ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => {
                          if (isBookModalOpen) {
                            setIsBookModalOpen(false);
                          } else {
                            handleOpenBook(rosterClass);
                          }
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12.5, fontWeight: 700 }}
                      >
                        <Icons.UserPlus size={15} />
                        <span>{isBookModalOpen ? 'Close Form' : '+ Book Member'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Class Session Hero Banner */}
                <div className="roster-session-hero-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 280 }}>
                    <div className="roster-hero-visual-thumb">
                      <img
                        src={rosterClass.image_url || visual.image}
                        alt={rosterClass.name}
                        onError={(e) => { e.currentTarget.src = visual.image; }}
                      />
                      <div className="roster-hero-cat-tag">
                        {visual.category}
                      </div>
                    </div>
                    <div className="roster-hero-details">
                      <div className="roster-hero-badge-row">
                        <h3 className="roster-hero-title">{rosterClass.name}</h3>
                        <span className={`roster-hero-pill ${isPast ? 'badge-cancelled' : 'badge-scheduled'}`} style={{ fontWeight: 800 }}>
                          {isPast ? '● Started (Booking Closed)' : '● Scheduled'}
                        </span>
                      </div>
                      <div className="roster-hero-meta-line">
                        <span className="roster-hero-pill" style={{ color: '#ff7a00', background: 'rgba(255, 122, 0, 0.1)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {visual.icon} {visual.category}
                        </span>
                        <span className="roster-hero-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icons.MapPin size={12} color="#ff7a00" />
                          <span>{rosterClass.room || 'Studio A (Main Hall)'}</span>
                        </span>
                        <span className="roster-hero-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icons.User size={12} color="#64748b" />
                          <span>Coach: <strong>{rosterClass.trainer?.name || 'Dawit Trainer'}</strong></span>
                        </span>
                        <span className="roster-hero-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icons.Calendar size={12} color="#64748b" />
                          <span>{formatIsoDate(rosterClass.start_time)} • {formatTime(rosterClass.start_time)}</span>
                        </span>
                        <span className="roster-hero-pill" style={{ color: rosterClass.price > 0 ? '#ff7a00' : '#10b981', fontWeight: 800 }}>
                          {rosterClass.price > 0 ? `${Number(rosterClass.price).toLocaleString()} ETB` : 'FREE / Pass'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="roster-kpi-summary">
                    <div className="roster-kpi-box">
                      <span className="roster-kpi-num">{totalEnrolled} / {capacity}</span>
                      <span className="roster-kpi-txt">Total Enrolled</span>
                    </div>
                    <div className="roster-kpi-box attended">
                      <span className="roster-kpi-num">{attendedCount}</span>
                      <span className="roster-kpi-txt">Attended</span>
                    </div>
                    <div className="roster-kpi-box remaining">
                      <span className="roster-kpi-num">{Math.max(0, capacity - totalEnrolled)}</span>
                      <span className="roster-kpi-txt">Spots Left</span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* In-Page Book Member Panel (if opened inside Roster view) */}
          {isBookModalOpen && targetClass && (
            <div className="inpage-form-panel book-mode" style={{ marginBottom: 20 }}>
              <div className="inpage-form-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="equip-modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', color: '#10b981' }}>
                    <Icons.UserPlus size={18} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)' }}>
                      Book Spot for Member — {targetClass.name}
                    </h4>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {formatIsoDate(targetClass.start_time)} at {formatTime(targetClass.start_time)} • Room: {targetClass.room || 'Studio A'} • Capacity: {targetClass.capacity}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="equip-modal-close-btn"
                  onClick={() => setIsBookModalOpen(false)}
                  aria-label="Close"
                >
                  <Icons.X size={15} />
                </button>
              </div>

              <form onSubmit={handleBookForMember}>
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {isClassPast(targetClass.start_time) ? (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', color: '#b91c1c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.AlertTriangle size={16} color="#b91c1c" />
                      <span><strong>Booking Closed:</strong> This class already started at {formatTime(targetClass.start_time)}. New bookings can only be made before the session begins.</span>
                    </div>
                  ) : null}

                  {canBookForOthers ? (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                        Select Gym Member *
                      </label>
                      <select
                        required
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '9px 12px' }}
                        disabled={isClassPast(targetClass.start_time)}
                      >
                        <option value="">-- Choose Member --</option>
                        {members.map((m) => {
                          const uId = m.user_id || m.id;
                          const code = m.member_code || m.member_profile?.member_code || `ID-${uId}`;
                          const plan = m.active_subscription?.plan_name ? ` • [${m.active_subscription.plan_name}]` : '';
                          return (
                            <option key={m.id || uId} value={uId}>
                              {m.name || m.user?.name || 'Member'} ({code}){plan} — {m.phone || m.user?.phone || 'No phone'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Reserving Spot For:</span>
                        <strong style={{ fontSize: 13, color: '#0f172a' }}>{user?.name || 'Member'}</strong>
                        <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 8 }}>({user?.email})</span>
                      </div>
                      <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        Active Member
                      </span>
                    </div>
                  )}

                  {/* Payment Collection: Cash & Chapa */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 800, margin: 0, color: 'var(--gym-text-primary, #0f172a)' }}>
                        Class Fee & Payment Method
                      </label>
                      <span style={{ fontSize: 13, fontWeight: 800, color: targetClass.price > 0 ? '#ff7a00' : '#10b981' }}>
                        {targetClass.price > 0 ? `${Number(targetClass.price).toLocaleString()} ETB` : 'FREE / Membership Pass'}
                      </span>
                    </div>

                    {targetClass.price > 0 ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          {/* Cash Option */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: bookingPaymentMethod === 'cash' ? '2px solid #ff7a00' : '1px solid #cbd5e1',
                              background: bookingPaymentMethod === 'cash' ? '#fff7ed' : '#ffffff',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: 13,
                              color: bookingPaymentMethod === 'cash' ? '#ff7a00' : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="radio"
                              name="booking_payment_roster"
                              value="cash"
                              checked={bookingPaymentMethod === 'cash'}
                              onChange={() => setBookingPaymentMethod('cash')}
                              style={{ accentColor: '#ff7a00' }}
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Icons.CreditCard size={15} color="#ea580c" />
                              <span>Cash (Front Desk)</span>
                            </span>
                          </label>

                          {/* Chapa Option */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: bookingPaymentMethod === 'chapa' ? '2px solid #00a651' : '1px solid #cbd5e1',
                              background: bookingPaymentMethod === 'chapa' ? '#f0fdf4' : '#ffffff',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: 13,
                              color: bookingPaymentMethod === 'chapa' ? '#00a651' : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="radio"
                              name="booking_payment_roster"
                              value="chapa"
                              checked={bookingPaymentMethod === 'chapa'}
                              onChange={() => setBookingPaymentMethod('chapa')}
                              style={{ accentColor: '#00a651' }}
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Icons.Zap size={15} color="#00a651" />
                              <span>Chapa (Digital / Online)</span>
                            </span>
                          </label>
                        </div>

                        {bookingPaymentMethod === 'chapa' && (
                          <div style={{ marginTop: 6 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                              Chapa Gateway / Telebirr / CBE Transaction Reference (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. TX-CHAPA-10023 or Payer Phone"
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                              className="classes-search-input"
                              style={{ width: '100%', padding: '7px 10px', fontSize: 12 }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Icons.Check size={14} color="#10b981" />
                        <span>Standard class is included under the member's active gym subscription pass.</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="inpage-form-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsBookModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isSubmitting || !selectedMemberId || isClassPast(targetClass.start_time)}
                  >
                    {isSubmitting ? 'Confirming...' : targetClass.price > 0 ? `Pay & Confirm (${targetClass.price} ETB)` : 'Confirm Spot'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Compact Roster Toolbar (Search & Filter Pills - Full Width) */}
          <div className="roster-page-toolbar" style={{ padding: '8px 14px', marginBottom: 10 }}>
            <div style={{ position: 'relative', width: 340, maxWidth: '100%' }}>
              <span style={{ position: 'absolute', left: 10, top: 8, color: '#94a3b8' }}>
                <Icons.Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search attendee by name, code, phone..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="classes-search-input"
                style={{ width: '100%', padding: '6px 10px 6px 30px', fontSize: 12 }}
              />
            </div>

            <div className="roster-filter-pills-wrap">
              <button
                type="button"
                className={`roster-filter-pill ${rosterFilter === 'all' ? 'active' : ''}`}
                onClick={() => setRosterFilter('all')}
              >
                All ({rosterBookings.length})
              </button>
              <button
                type="button"
                className={`roster-filter-pill ${rosterFilter === 'reserved' ? 'active' : ''}`}
                onClick={() => setRosterFilter('reserved')}
              >
                Reserved ({rosterBookings.filter((b) => b.status === 'reserved').length})
              </button>
              <button
                type="button"
                className={`roster-filter-pill ${rosterFilter === 'attended' ? 'active' : ''}`}
                onClick={() => setRosterFilter('attended')}
              >
                Attended ({rosterBookings.filter((b) => b.status === 'attended').length})
              </button>
              <button
                type="button"
                className={`roster-filter-pill ${rosterFilter === 'no_show' ? 'active' : ''}`}
                onClick={() => setRosterFilter('no_show')}
              >
                No-Show ({rosterBookings.filter((b) => b.status === 'no_show').length})
              </button>
            </div>
          </div>

          {/* Attendee Executive Table */}
          {isRosterLoading ? (
            <div style={{ padding: '50px 0', textAlign: 'center', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <span className="spinner"></span>
              <p style={{ marginTop: 10, fontSize: 13, color: '#94a3b8' }}>Loading member reservations...</p>
            </div>
          ) : filteredRosterBookings.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', color: '#94a3b8' }}>
              <Icons.Users size={40} color="#cbd5e1" />
              <p style={{ margin: '12px 0 14px', fontSize: 14, fontWeight: 700, color: '#475569' }}>
                {rosterSearch ? 'No booked attendees match your search query.' : 'No members have reserved a spot in this class yet.'}
              </p>
              {!rosterSearch && canBookForOthers && !isClassPast(rosterClass.start_time) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenBook(rosterClass)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icons.UserPlus size={14} />
                  <span>Book First Member</span>
                </button>
              )}
            </div>
          ) : (
            <div className="roster-table-container">
              <table className="roster-executive-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Member Attendee</th>
                    <th>Code / ID</th>
                    <th>Contact Info</th>
                    <th>Membership Plan</th>
                    <th>Booked At</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRosterBookings.map((b, idx) => {
                    const member = b.member;
                    const isAttended = b.status === 'attended';
                    const isNoShow = b.status === 'no_show';

                    return (
                      <tr key={b.id}>
                        <td style={{ color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: isAttended ? '#10b981' : isNoShow ? '#ef4444' : '#ff7a00',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                            >
                              {member?.name ? member.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div>
                              <strong style={{ fontSize: 13, color: 'var(--gym-text-primary, #0f172a)', display: 'block' }}>
                                {member?.name || 'Member'}
                              </strong>
                              <span style={{ fontSize: 11, color: '#64748b' }}>
                                {member?.email || 'No email'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11.5, color: '#ff7a00' }}>
                            {member?.member_profile?.member_code || member?.member_code || `ID-${member?.id || 'N/A'}`}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: '#475569' }}>
                            {member?.phone || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                            {member?.plan_name || 'Standard Pass'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 11.5, color: '#64748b' }}>
                            {formatIsoDate(b.booking_time)} {formatTime(b.booking_time)}
                          </span>
                        </td>
                        <td>
                          <span className={`roster-status-badge roster-status-${b.status}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {confirmDeleteBookingId === b.id ? (
                            <div className="roster-inline-delete-box">
                              <span className="roster-inline-delete-text">Remove attendee?</span>
                              <button
                                type="button"
                                className="btn-confirm-delete-yes"
                                onClick={() => executeRemoveBooking(b.id)}
                                disabled={actionLoadingBookingId === b.id}
                              >
                                {actionLoadingBookingId === b.id ? '...' : 'Yes, Remove'}
                              </button>
                              <button
                                type="button"
                                className="btn-confirm-delete-no"
                                onClick={handleCancelRemoveBooking}
                                disabled={actionLoadingBookingId === b.id}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className={isAttended ? 'btn-roster-action-attended' : 'btn-roster-action-checkin'}
                                onClick={() => handleCheckInToggle(b.id, b.status)}
                                disabled={actionLoadingBookingId === b.id}
                                title={isAttended ? 'Click to revert to Reserved' : 'Confirm attendee check-in'}
                              >
                                {actionLoadingBookingId === b.id ? (
                                  <span className="btn-spinner-tiny" />
                                ) : (
                                  <Icons.Check size={12} />
                                )}
                                <span>{isAttended ? 'Attended' : 'Check In'}</span>
                              </button>

                              <button
                                type="button"
                                className={`btn-roster-action-noshow ${isNoShow ? 'active' : ''}`}
                                onClick={() => handleMarkNoShow(b.id)}
                                disabled={actionLoadingBookingId === b.id}
                                title="Mark member as No-Show"
                              >
                                No-Show
                              </button>

                              {canBookForOthers && (
                                <button
                                  type="button"
                                  className="btn-roster-action-remove"
                                  onClick={() => handlePromptRemoveBooking(b.id)}
                                  disabled={actionLoadingBookingId === b.id}
                                  title="Remove member reservation from roster"
                                >
                                  <Icons.Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. MAIN TIMETABLE & CLASS MANAGEMENT VIEW (100% IN-PAGE)                 */
        /* ========================================================================= */
        <>
          {/* Top KPI Stat Cards */}
          <div className="clean-kpi-grid" style={{ marginBottom: 20 }}>
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">{isTrainer ? 'My Classes' : 'Scheduled Classes'}</span>
                <div className="clean-kpi-icon" title={isTrainer ? 'My Classes' : 'Scheduled Classes'} style={{ background: 'rgba(255, 122, 0, 0.12)', color: '#ff7a00' }}>
                  <Icons.Calendar size={16} color="#ff7a00" />
                </div>
              </div>
              <div className="kpi-value">{stats.total_classes ?? classes.length ?? 0}</div>
              <span className="kpi-trend trend-positive">+{stats.today_classes ?? 0} sessions today</span>
            </div>

            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">{isTrainer ? 'Enrolled Members' : 'Active Bookings'}</span>
                <div className="clean-kpi-icon" title={isTrainer ? 'Enrolled Members' : 'Active Bookings'} style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                  <Icons.Users size={16} color="#3b82f6" />
                </div>
              </div>
              <div className="kpi-value">{stats.total_bookings ?? 0}</div>
              <span className="kpi-trend" style={{ color: '#64748b' }}>{isTrainer ? 'Enrolled in your classes' : 'Enrolled participants'}</span>
            </div>

            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">{isTrainer ? 'Class Occupancy' : 'Occupancy Rate'}</span>
                <div className="clean-kpi-icon" title={isTrainer ? 'Class Occupancy' : 'Occupancy Rate'} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <Icons.TrendingUp size={16} color="#10b981" />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#10b981' }}>{stats.occupancy_rate ?? 0}%</div>
              <span className="kpi-trend trend-positive">{isTrainer ? 'Avg capacity in your sessions' : 'Average capacity filled'}</span>
            </div>

            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">{isTrainer ? 'Attended Members' : 'Active Coaches'}</span>
                <div className="clean-kpi-icon" title={isTrainer ? 'Attended Members' : 'Active Coaches'} style={{ background: isTrainer ? 'rgba(16, 185, 129, 0.12)' : 'rgba(168, 85, 247, 0.12)', color: isTrainer ? '#10b981' : '#a855f7' }}>
                  {isTrainer ? <Icons.CheckCircle size={16} color="#10b981" /> : <Icons.Activity size={16} color="#a855f7" />}
                </div>
              </div>
              <div className="kpi-value">{isTrainer ? (stats.attended_count ?? 0) : (stats.active_trainers ?? trainers.length ?? 0)}</div>
              <span className="kpi-trend" style={{ color: '#64748b' }}>{isTrainer ? 'Checked in to your classes' : 'Assigned instructors'}</span>
            </div>
          </div>

          {/* Modern 2-Tier Controls & Timetable Panel */}
          <div className="classes-modern-controls-panel">
            {/* Row 1: Header Context, View Switch & Action CTA */}
            <div className="classes-controls-header-row">
              <div className="classes-controls-title-wrap">
                <div className="classes-controls-title-icon">
                  <Icons.Calendar size={18} color="#ff7a00" />
                </div>
                <div>
                  <h3 className="classes-controls-title">{isTrainer ? 'My Assigned Classes' : 'Group Class Timetable'}</h3>
                  <span className="classes-controls-subtitle">
                    {filteredClasses.length} session{filteredClasses.length !== 1 ? 's' : ''} {isTrainer ? 'assigned to you' : 'available'}
                  </span>
                </div>
              </div>

              <div className="classes-controls-actions-wrap">
                {/* View Mode Toggle: Table first, then Cards */}
                <div className="classes-modern-view-switch">
                  <button
                    type="button"
                    className={`classes-modern-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                    title="Executive Timetable View"
                  >
                    <Icons.List size={14} />
                    <span>Table</span>
                  </button>
                  <button
                    type="button"
                    className={`classes-modern-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Visual Card Grid View"
                  >
                    <Icons.Grid size={14} />
                    <span>Cards</span>
                  </button>
                </div>

                {/* Primary Action Button */}
                {canSchedule && (
                  <button
                    type="button"
                    className="btn-modern-schedule-cta"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(7, 0, 0, 0);
                      const end = new Date(tomorrow);
                      end.setHours(8, 0, 0, 0);

                      setScheduleForm((prev) => ({
                        ...prev,
                        start_time: toLocalDatetimeString(tomorrow),
                        end_time: toLocalDatetimeString(end),
                        trainer_id: prev.trainer_id || (trainers[0]?.id ?? ''),
                      }));
                      setIsScheduleOpen(true);
                      setIsEditOpen(false);
                      setIsBookModalOpen(false);
                      setCancelTargetClass(null);
                    }}
                  >
                    <Icons.Plus size={15} />
                    <span>Schedule Class</span>
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Search & Filter Toolbar */}
            <div className="classes-controls-filter-row">
              <div className="classes-modern-search-box">
                <span className="classes-modern-search-icon">
                  <Icons.Search size={15} color="#94a3b8" />
                </span>
                <input
                  type="text"
                  className="classes-modern-search-input"
                  placeholder={isTrainer ? "Search my classes by name or studio room..." : "Search by class name, coach, or studio room..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="classes-modern-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <Icons.X size={14} />
                  </button>
                )}
              </div>

              <div className="classes-modern-filters-group">
                {/* Unified Date Filter Button (All Dates, Today, Tomorrow & Custom Date in one) */}
                <div className="classes-status-select-wrap">
                  <select
                    value={quickDate === 'custom' && dateFilter ? 'custom' : quickDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        const customInput = document.getElementById('classes-custom-date-native-input');
                        if (customInput) {
                          if (customInput.showPicker) {
                            customInput.showPicker();
                          } else {
                            customInput.focus();
                          }
                        }
                      } else {
                        handleQuickDateSelect(val);
                      }
                    }}
                    className="classes-modern-status-select"
                    title="Filter classes by date"
                    style={{ minWidth: 145 }}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="custom">
                      {dateFilter && quickDate === 'custom' ? formatIsoDate(dateFilter) : 'Pick Custom Date...'}
                    </option>
                  </select>
                  <span className="classes-status-select-icon">
                    <Icons.ChevronDown size={13} />
                  </span>
                  <input
                    id="classes-custom-date-native-input"
                    type="date"
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setQuickDate(e.target.value ? 'custom' : 'all');
                    }}
                  />
                </div>

                <div className="classes-status-select-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="classes-modern-status-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Happening Now</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <span className="classes-status-select-icon">
                    <Icons.ChevronDown size={13} />
                  </span>
                </div>

                {(searchQuery || statusFilter !== 'all' || dateFilter) && (
                  <button
                    type="button"
                    className="classes-clear-filters-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setDateFilter('');
                      setQuickDate('all');
                    }}
                    title="Reset all search & filters"
                  >
                    <Icons.X size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* IN-PAGE COLLAPSIBLE PANELS (100% IN-PLACE, ZERO POPUP MODAL BACKDROP)     */}
          {/* ========================================================================= */}

          {/* IN-PAGE PANEL 1: SCHEDULE NEW FITNESS CLASS */}
          {isScheduleOpen && (
            <div className="inpage-form-panel" style={{ marginBottom: 20 }}>
              <div className="inpage-form-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="equip-modal-icon-badge">
                    <Icons.Calendar size={18} color="#ff7a00" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)' }}>
                      Schedule Group Fitness Class
                    </h4>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Publish a session on the Tigat Gym timetable
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="equip-modal-close-btn"
                  onClick={() => setIsScheduleOpen(false)}
                  aria-label="Close"
                >
                  <Icons.X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreateClass}>
                <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 18 }}>
                  {/* Left Column: Basic Info & Cover Photo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Class Title *</label>
                      <input
                        type="text"
                        required
                        value={scheduleForm.name}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                        placeholder="e.g. Tigat Morning HIIT, Power Spin"
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Lead Instructor *</label>
                      <select
                        required
                        value={scheduleForm.trainer_id}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, trainer_id: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      >
                        <option value="">-- Assign Instructor --</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.profile?.specialization || 'Certified Coach'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Studio / Gym Room</label>
                      <input
                        type="text"
                        value={scheduleForm.room}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                        placeholder="Studio A (Main Hall)"
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Description & Focus</label>
                      <textarea
                        rows="2"
                        value={scheduleForm.description}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                        placeholder="Cardio endurance, strength intervals, required gear..."
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px', resize: 'none' }}
                      />
                    </div>

                    {/* Class Cover Image Uploader & Luxury Presets */}
                    <div className="class-cover-uploader-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)', display: 'block', margin: 0 }}>
                            Class Cover Photo *
                          </label>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            Upload image or pick high-res gym preset
                          </span>
                        </div>
                        <label className="btn-custom-upload-label">
                          <Icons.Plus size={13} color="#ff7a00" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageFileSelect(e, false)}
                          />
                        </label>
                      </div>

                      {/* Presets Chips */}
                      <div className="class-preset-buttons-row">
                        {[
                          { label: 'HIIT', url: '/classes/hiit.jpg', icon: <Icons.Zap size={12} /> },
                          { label: 'Spin', url: '/classes/spin.jpg', icon: <Icons.Bike size={12} /> },
                          { label: 'Strength', url: '/classes/strength.jpg', icon: <Icons.Dumbbell size={12} /> },
                          { label: 'Yoga', url: '/classes/yoga.jpg', icon: <Icons.Heart size={12} /> },
                          { label: 'Olympic', url: '/classes/olympic.jpg', icon: <Icons.Dumbbell size={12} /> },
                          { label: 'Core', url: '/classes/core.jpg', icon: <Icons.Flame size={12} /> },
                        ].map((p) => (
                          <button
                            key={p.url}
                            type="button"
                            className={`btn-class-preset-chip ${scheduleForm.image_url === p.url ? 'active' : ''}`}
                            onClick={() => handleSelectPresetImage(p.url, false)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            {p.icon}
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Live Card-Style Visual Preview */}
                      <div className="class-cover-preview-card">
                        <img
                          src={scheduleForm.image_preview || scheduleForm.image_url || '/classes/hiit.jpg'}
                          alt="Cover Preview"
                          onError={(e) => { e.currentTarget.src = '/classes/hiit.jpg'; }}
                        />
                        <div className="preview-overlay">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ background: 'rgba(0,0,0,0.65)', color: '#ffffff', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                              {scheduleForm.name || 'Class Title Preview'}
                            </span>
                            <span style={{ background: scheduleForm.fee_type === 'paid' ? 'rgba(255,122,0,0.85)' : 'rgba(16,185,129,0.85)', color: '#ffffff', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              {scheduleForm.fee_type === 'paid' ? `${scheduleForm.price || 0} ETB` : 'FREE / Pass'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9.5, color: '#f1f5f9', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Icons.MapPin size={10} color="#ff7a00" />
                              <span>{scheduleForm.room || 'Studio A (Main Hall)'}</span>
                            </span>
                            <span style={{ fontSize: 9, color: '#cbd5e1' }}>
                              Cover Visual Preview
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Capacity, Timing & Fee Structure */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Max Capacity (10 - 40) *</label>
                        <input
                          type="number"
                          min="10"
                          max="40"
                          required
                          value={scheduleForm.capacity}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, capacity: e.target.value })}
                          className="classes-search-input"
                          style={{ width: '100%', padding: '8px 12px' }}
                          placeholder="10 - 40"
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Recurrence</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>48h auto-cleanup rule</span>
                        </label>
                        <select
                          value={scheduleForm.recurrence}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, recurrence: e.target.value })}
                          className="classes-search-input"
                          style={{ width: '100%', padding: '8px 12px' }}
                        >
                          <option value="none">One-off Session (Auto-removes 48h after completion)</option>
                          <option value="daily">Daily (Kept permanently)</option>
                          <option value="weekly">Weekly (Kept permanently)</option>
                          <option value="biweekly">Bi-weekly (Kept permanently)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Start Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleForm.start_time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>End Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleForm.end_time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    {/* Class Fee Structure (Free vs Paid) */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)', display: 'block', marginBottom: 2 }}>
                          Class Fee Structure *
                        </label>
                        <span style={{ fontSize: 11.5, color: '#64748b' }}>
                          Is this session free for members or does it require a booking fee?
                        </span>
                      </div>

                      <div className="fee-type-toggle-grid">
                        <div
                          className={`fee-type-card ${scheduleForm.fee_type === 'free' ? 'active-free' : ''}`}
                          onClick={() => setScheduleForm((prev) => ({ ...prev, fee_type: 'free', price: 0 }))}
                        >
                          <input
                            type="radio"
                            name="schedule_fee_type"
                            checked={scheduleForm.fee_type === 'free'}
                            onChange={() => setScheduleForm((prev) => ({ ...prev, fee_type: 'free', price: 0 }))}
                            style={{ accentColor: '#10b981' }}
                          />
                          <div>
                            <strong style={{ fontSize: 13, color: scheduleForm.fee_type === 'free' ? '#059669' : '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Icons.Check size={13} color="#10b981" />
                              <span>Free Class (Pass)</span>
                            </strong>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              0 ETB — Included in pass
                            </span>
                          </div>
                        </div>

                        <div
                          className={`fee-type-card ${scheduleForm.fee_type === 'paid' ? 'active-paid' : ''}`}
                          onClick={() => setScheduleForm((prev) => ({ ...prev, fee_type: 'paid', price: prev.price > 0 ? prev.price : 150 }))}
                        >
                          <input
                            type="radio"
                            name="schedule_fee_type"
                            checked={scheduleForm.fee_type === 'paid'}
                            onChange={() => setScheduleForm((prev) => ({ ...prev, fee_type: 'paid', price: prev.price > 0 ? prev.price : 150 }))}
                            style={{ accentColor: '#ff7a00' }}
                          />
                          <div>
                            <strong style={{ fontSize: 13, color: scheduleForm.fee_type === 'paid' ? '#ea580c' : '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Icons.CreditCard size={13} color="#ea580c" />
                              <span>Paid Session</span>
                            </strong>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              Requires fee to book
                            </span>
                          </div>
                        </div>
                      </div>

                      {scheduleForm.fee_type === 'paid' ? (
                        <div style={{ marginTop: 6, padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 800, color: '#9a3412', display: 'block', marginBottom: 6 }}>
                            How many Birr (ETB) does a member need to pay to book this class? *
                          </label>

                          {/* Quick Birr Preset Chips */}
                          <div className="fee-amount-presets">
                            {[3, 50, 100, 150, 200, 250, 300, 500].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                className={`btn-fee-chip ${Number(scheduleForm.price) === amt ? 'active' : ''}`}
                                onClick={() => setScheduleForm((prev) => ({ ...prev, price: amt }))}
                              >
                                {amt} ETB
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={scheduleForm.price}
                              onChange={(e) => setScheduleForm((prev) => ({ ...prev, price: e.target.value }))}
                              className="classes-search-input"
                              style={{ width: 140, padding: '7px 10px', fontWeight: 800, fontSize: 14 }}
                              placeholder="e.g. 3, 50, 150..."
                            />
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#ea580c' }}>ETB per attendee (any amount)</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, fontSize: 12, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icons.Check size={14} color="#059669" />
                          <span>Active Tigat Gym members can book this session for <strong>0 ETB</strong> using their membership pass.</span>
                        </div>
                      )}
                    </div>

                    <div style={{ background: 'rgba(255, 122, 0, 0.08)', border: '1px solid rgba(255, 122, 0, 0.2)', padding: '10px 12px', borderRadius: 8, fontSize: 12, color: '#ff7a00', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icons.Info size={14} color="#ff7a00" />
                      <span><strong>Notice:</strong> Members can book spots anytime before the scheduled start time.</span>
                    </div>
                  </div>
                </div>

                <div className="inpage-form-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsScheduleOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting || !scheduleForm.trainer_id}>
                    {isSubmitting ? 'Publishing...' : 'Publish Class'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* IN-PAGE PANEL 2: EDIT FITNESS CLASS */}
          {isEditOpen && targetEditClass && (
            <div id="class-inpage-edit-panel" className="inpage-form-panel edit-mode" style={{ marginBottom: 20 }}>
              <div className="inpage-form-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="equip-modal-icon-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.25)', color: '#3b82f6' }}>
                    <Icons.Edit size={18} color="#3b82f6" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)' }}>
                      Edit Fitness Class — {targetEditClass.name}
                    </h4>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Update timetable schedule, room, capacity or fee
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="equip-modal-close-btn"
                  onClick={() => setIsEditOpen(false)}
                  aria-label="Close"
                >
                  <Icons.X size={15} />
                </button>
              </div>

              <form onSubmit={handleUpdateClass}>
                <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 18 }}>
                  {/* Left Column: Details & Cover Photo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Class Title *</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Instructor *</label>
                      <select
                        required
                        value={editForm.trainer_id}
                        onChange={(e) => setEditForm({ ...editForm, trainer_id: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      >
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.profile?.specialization || 'Certified Coach'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Studio / Room</label>
                      <input
                        type="text"
                        value={editForm.room}
                        onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Session Notes</label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                        placeholder="Notes or focus areas..."
                      />
                    </div>

                    {/* Class Cover Image Uploader & Luxury Presets */}
                    <div className="class-cover-uploader-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)', display: 'block', margin: 0 }}>
                            Class Cover Photo *
                          </label>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            Update photo or pick high-res gym preset
                          </span>
                        </div>
                        <label className="btn-custom-upload-label">
                          <Icons.Plus size={13} color="#ff7a00" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageFileSelect(e, true)}
                          />
                        </label>
                      </div>

                      {/* Presets Chips */}
                      <div className="class-preset-buttons-row">
                        {[
                          { label: 'HIIT', url: '/classes/hiit.jpg', icon: <Icons.Zap size={12} /> },
                          { label: 'Spin', url: '/classes/spin.jpg', icon: <Icons.Bike size={12} /> },
                          { label: 'Strength', url: '/classes/strength.jpg', icon: <Icons.Dumbbell size={12} /> },
                          { label: 'Yoga', url: '/classes/yoga.jpg', icon: <Icons.Heart size={12} /> },
                          { label: 'Olympic', url: '/classes/olympic.jpg', icon: <Icons.Dumbbell size={12} /> },
                          { label: 'Core', url: '/classes/core.jpg', icon: <Icons.Flame size={12} /> },
                        ].map((p) => (
                          <button
                            key={p.url}
                            type="button"
                            className={`btn-class-preset-chip ${editForm.image_url === p.url ? 'active' : ''}`}
                            onClick={() => handleSelectPresetImage(p.url, true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          >
                            {p.icon}
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Live Card-Style Visual Preview */}
                      <div className="class-cover-preview-card">
                        <img
                          src={editForm.image_preview || editForm.image_url || '/classes/hiit.jpg'}
                          alt="Cover Preview"
                          onError={(e) => { e.currentTarget.src = '/classes/hiit.jpg'; }}
                        />
                        <div className="preview-overlay">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ background: 'rgba(0,0,0,0.65)', color: '#ffffff', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                              {editForm.name || 'Class Title Preview'}
                            </span>
                            <span style={{ background: editForm.fee_type === 'paid' ? 'rgba(255,122,0,0.85)' : 'rgba(16,185,129,0.85)', color: '#ffffff', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                              {editForm.fee_type === 'paid' ? `${editForm.price || 0} ETB` : 'FREE / Pass'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9.5, color: '#f1f5f9', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Icons.MapPin size={10} color="#ff7a00" />
                              <span>{editForm.room || 'Studio A (Main Hall)'}</span>
                            </span>
                            <span style={{ fontSize: 9, color: '#cbd5e1' }}>
                              Cover Visual Preview
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status, Capacity, Timing & Fee Structure */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Class Status</span>
                          <span style={{ fontSize: 10.5, color: '#64748b' }}>Time-managed</span>
                        </label>
                        <select
                          value={editForm.status === 'cancelled' ? 'cancelled' : 'active'}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="classes-search-input"
                          style={{ width: '100%', padding: '8px 12px', fontWeight: 700 }}
                        >
                          <option value="active">
                            Active (Auto: {
                              (() => {
                                const now = new Date();
                                const st = editForm.start_time ? new Date(editForm.start_time) : null;
                                const et = editForm.end_time ? new Date(editForm.end_time) : null;
                                if (et && now >= et) return 'Completed';
                                if (st && now >= st) return 'Happening Now';
                                return 'Scheduled';
                              })()
                            })
                          </option>
                          <option value="cancelled">Cancelled (Admin Cancel)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                          <span>Max Capacity *</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>10 - 40 spots</span>
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="40"
                          required
                          value={editForm.capacity}
                          onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                          className="classes-search-input"
                          style={{ width: '100%', padding: '8px 12px' }}
                          placeholder="10 - 40"
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Recurrence</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>48h auto-cleanup rule</span>
                      </label>
                      <select
                        value={editForm.recurrence || 'none'}
                        onChange={(e) => setEditForm({ ...editForm, recurrence: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      >
                        <option value="none">One-off Session (Auto-removes 48h after completion)</option>
                        <option value="daily">Daily (Kept permanently)</option>
                        <option value="weekly">Weekly (Kept permanently)</option>
                        <option value="biweekly">Bi-weekly (Kept permanently)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Start Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={editForm.start_time}
                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>End Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={editForm.end_time}
                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '8px 12px' }}
                      />
                    </div>

                    {/* Class Fee Structure (Free vs Paid) */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)', display: 'block', marginBottom: 2 }}>
                          Class Fee Structure *
                        </label>
                        <span style={{ fontSize: 11.5, color: '#64748b' }}>
                          Is this session free for members or does it require a booking fee?
                        </span>
                      </div>

                      <div className="fee-type-toggle-grid">
                        <div
                          className={`fee-type-card ${editForm.fee_type === 'free' ? 'active-free' : ''}`}
                          onClick={() => setEditForm((prev) => ({ ...prev, fee_type: 'free', price: 0 }))}
                        >
                          <input
                            type="radio"
                            name="edit_fee_type"
                            checked={editForm.fee_type === 'free'}
                            onChange={() => setEditForm((prev) => ({ ...prev, fee_type: 'free', price: 0 }))}
                            style={{ accentColor: '#10b981' }}
                          />
                          <div>
                            <strong style={{ fontSize: 13, color: editForm.fee_type === 'free' ? '#059669' : '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Icons.Check size={13} color="#10b981" />
                              <span>Free Class (Pass)</span>
                            </strong>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              0 ETB — Included in pass
                            </span>
                          </div>
                        </div>

                        <div
                          className={`fee-type-card ${editForm.fee_type === 'paid' ? 'active-paid' : ''}`}
                          onClick={() => setEditForm((prev) => ({ ...prev, fee_type: 'paid', price: prev.price > 0 ? prev.price : 150 }))}
                        >
                          <input
                            type="radio"
                            name="edit_fee_type"
                            checked={editForm.fee_type === 'paid'}
                            onChange={() => setEditForm((prev) => ({ ...prev, fee_type: 'paid', price: prev.price > 0 ? prev.price : 150 }))}
                            style={{ accentColor: '#ff7a00' }}
                          />
                          <div>
                            <strong style={{ fontSize: 13, color: editForm.fee_type === 'paid' ? '#ea580c' : '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Icons.CreditCard size={13} color="#ea580c" />
                              <span>Paid Session</span>
                            </strong>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              Requires fee to book
                            </span>
                          </div>
                        </div>
                      </div>

                      {editForm.fee_type === 'paid' ? (
                        <div style={{ marginTop: 6, padding: '12px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 800, color: '#9a3412', display: 'block', marginBottom: 6 }}>
                            How many Birr (ETB) does a member need to pay to book this class? *
                          </label>

                          {/* Quick Birr Preset Chips */}
                          <div className="fee-amount-presets">
                            {[3, 50, 100, 150, 200, 250, 300, 500].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                className={`btn-fee-chip ${Number(editForm.price) === amt ? 'active' : ''}`}
                                onClick={() => setEditForm((prev) => ({ ...prev, price: amt }))}
                              >
                                {amt} ETB
                              </button>
                            ))}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={editForm.price}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                              className="classes-search-input"
                              style={{ width: 140, padding: '7px 10px', fontWeight: 800, fontSize: 14 }}
                              placeholder="e.g. 3, 50, 150..."
                            />
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#ea580c' }}>ETB per attendee (any amount)</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '8px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, fontSize: 12, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icons.Check size={14} color="#059669" />
                          <span>Active Tigat Gym members can book this session for <strong>0 ETB</strong> using their membership pass.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="inpage-form-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* IN-PAGE PANEL 3: STAFF BOOK FOR MEMBER */}
          {isBookModalOpen && targetClass && (
            <div id="class-inpage-book-panel" className="inpage-form-panel book-mode" style={{ marginBottom: 20 }}>
              <div className="inpage-form-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="equip-modal-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)', color: '#10b981' }}>
                    <Icons.UserPlus size={18} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)' }}>
                      Book Spot for Member — {targetClass.name}
                    </h4>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {formatIsoDate(targetClass.start_time)} at {formatTime(targetClass.start_time)} • Room: {targetClass.room || 'Studio A'} • Capacity: {targetClass.capacity}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="equip-modal-close-btn"
                  onClick={() => setIsBookModalOpen(false)}
                  aria-label="Close"
                >
                  <Icons.X size={15} />
                </button>
              </div>

              <form onSubmit={handleBookForMember}>
                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {isClassPast(targetClass.start_time) ? (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', color: '#b91c1c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.AlertTriangle size={16} color="#b91c1c" />
                      <span><strong>Booking Closed:</strong> This class already started at {formatTime(targetClass.start_time)}. New bookings cannot be made after class start.</span>
                    </div>
                  ) : null}

                  {canBookForOthers ? (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                        Select Gym Member *
                      </label>
                      <select
                        required
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="classes-search-input"
                        style={{ width: '100%', padding: '9px 12px' }}
                        disabled={isClassPast(targetClass.start_time)}
                      >
                        <option value="">-- Choose Member --</option>
                        {members.map((m) => {
                          const uId = m.user_id || m.id;
                          const code = m.member_code || m.member_profile?.member_code || `ID-${uId}`;
                          const plan = m.active_subscription?.plan_name ? ` • [${m.active_subscription.plan_name}]` : '';
                          return (
                            <option key={m.id || uId} value={uId}>
                              {m.name || m.user?.name || 'Member'} ({code}){plan} — {m.phone || m.user?.phone || 'No phone'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Reserving Spot For:</span>
                        <strong style={{ fontSize: 13, color: '#0f172a' }}>{user?.name || 'Member'}</strong>
                        <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 8 }}>({user?.email})</span>
                      </div>
                      <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        Active Member
                      </span>
                    </div>
                  )}

                  {/* Payment Collection: Cash & Chapa */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 800, margin: 0, color: 'var(--gym-text-primary, #0f172a)' }}>
                        Class Fee & Payment Method
                      </label>
                      <span style={{ fontSize: 13, fontWeight: 800, color: targetClass.price > 0 ? '#ff7a00' : '#10b981' }}>
                        {targetClass.price > 0 ? `${Number(targetClass.price).toLocaleString()} ETB` : 'FREE / Membership Pass'}
                      </span>
                    </div>

                    {targetClass.price > 0 ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          {/* Cash Option */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: bookingPaymentMethod === 'cash' ? '2px solid #ff7a00' : '1px solid #cbd5e1',
                              background: bookingPaymentMethod === 'cash' ? '#fff7ed' : '#ffffff',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: 13,
                              color: bookingPaymentMethod === 'cash' ? '#ff7a00' : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="radio"
                              name="booking_payment_timetable"
                              value="cash"
                              checked={bookingPaymentMethod === 'cash'}
                              onChange={() => setBookingPaymentMethod('cash')}
                              style={{ accentColor: '#ff7a00' }}
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Icons.CreditCard size={15} color="#ea580c" />
                              <span>Cash (Front Desk)</span>
                            </span>
                          </label>

                          {/* Chapa Option */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: bookingPaymentMethod === 'chapa' ? '2px solid #00a651' : '1px solid #cbd5e1',
                              background: bookingPaymentMethod === 'chapa' ? '#f0fdf4' : '#ffffff',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: 13,
                              color: bookingPaymentMethod === 'chapa' ? '#00a651' : '#475569',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <input
                              type="radio"
                              name="booking_payment_timetable"
                              value="chapa"
                              checked={bookingPaymentMethod === 'chapa'}
                              onChange={() => setBookingPaymentMethod('chapa')}
                              style={{ accentColor: '#00a651' }}
                            />
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <Icons.Zap size={15} color="#00a651" />
                              <span>Chapa (Digital / Online)</span>
                            </span>
                          </label>
                        </div>

                        {bookingPaymentMethod === 'chapa' && (
                          <div style={{ marginTop: 6 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                              Chapa Gateway / Telebirr / CBE Transaction Reference (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. TX-CHAPA-10023 or Payer Phone"
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                              className="classes-search-input"
                              style={{ width: '100%', padding: '7px 10px', fontSize: 12 }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Icons.Check size={14} color="#10b981" />
                        <span>Standard class is included under the member's active gym subscription pass.</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="inpage-form-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsBookModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isSubmitting || !selectedMemberId || isClassPast(targetClass.start_time)}
                  >
                    {isSubmitting ? 'Confirming...' : targetClass.price > 0 ? `Pay & Confirm (${targetClass.price} ETB)` : 'Confirm Spot'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* IN-PAGE PANEL 4: CANCEL FITNESS CLASS CONFIRMATION */}
          {cancelTargetClass && (
            <div className="inpage-cancel-panel" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icons.AlertTriangle size={20} color="#ef4444" />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
                    Cancel Fitness Class — "{cancelTargetClass.name}"
                  </h4>
                </div>
                <button
                  type="button"
                  className="equip-modal-close-btn"
                  onClick={() => setCancelTargetClass(null)}
                  aria-label="Close"
                >
                  <Icons.X size={15} />
                </button>
              </div>

              <form onSubmit={handleCancelClassSubmit}>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                  Are you sure you want to cancel this session?
                  {cancelTargetClass.booked_count > 0 && (
                    <strong style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ea580c', marginTop: 6 }}>
                      <Icons.AlertTriangle size={15} color="#ea580c" />
                      <span>{cancelTargetClass.booked_count} member(s) currently hold reservations for this class.</span>
                    </strong>
                  )}
                </p>

                <div className="form-group" style={{ margin: '0 0 14px' }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Cancellation Reason (Optional)</label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Instructor emergency, Studio maintenance"
                    className="classes-search-input"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCancelTargetClass(null)}>
                    Keep Class
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm" disabled={isSubmitting}>
                    {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MAIN TIMETABLE DISPLAY (GRID OR TABLE)                                    */}
          {/* ========================================================================= */}
          {isLoading ? (
            <div className="loading-state" style={{ padding: '70px 0', textAlign: 'center' }}>
              <span className="spinner"></span>
              <p style={{ marginTop: 12, color: '#94a3b8' }}>Loading Tigat Gym timetable & classes...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="empty-state-box" style={{ padding: '70px 20px', textAlign: 'center' }}>
              <div className="empty-state-icon-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: '#ff7a00' }}>
                <Icons.Dumbbell size={52} />
              </div>
              <h4 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px' }}>
                {isTrainer ? 'No Classes Assigned' : 'No Fitness Classes Found'}
              </h4>
              <p style={{ color: '#64748b', fontSize: 13, maxWidth: 460, margin: '0 auto 18px' }}>
                {isTrainer
                  ? 'You do not have any assigned classes scheduled at this time. Classes assigned to you by management will appear here.'
                  : 'There are no classes matching your current filter criteria. You can clear the search or publish a new session.'}
              </p>
              {canSchedule && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setIsScheduleOpen(true)}
                >
                  <Icons.Plus size={14} />
                  <span>Schedule First Class</span>
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Visual Card Grid View */
            <div className="classes-grid">
              {filteredClasses.map((c) => {
                const cs = getComputedClassStatus(c);
                const visual = getClassVisual(c.name, c.room);
                const bookedCount = c.booked_count ?? 0;
                const capacity = c.capacity || 20;
                const pctBooked = Math.min(100, Math.round((bookedCount / capacity) * 100));
                const spotsLeft = Math.max(0, capacity - bookedCount);
                const isFull = spotsLeft === 0;
                const isStarted = cs.isStarted;
                const isOngoing = cs.isOngoing;
                const isCompleted = cs.isCompleted;
                const isCancelled = cs.isCancelled;
                const timeUntilStart = cs.status === 'scheduled' ? getTimeUntilStart(c.start_time) : null;

                return (
                  <div
                    key={c.id}
                    className={`class-card ${isOngoing ? 'is-ongoing' : isCompleted ? 'is-completed' : isCancelled ? 'is-cancelled' : ''}`}
                  >
                    {/* Differentiated Top Banner for Starting / Ongoing Class */}
                    {isOngoing && (
                      <div className="starting-class-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span className="live-pulse-dot" />
                          <Icons.Flame size={14} color="#ffffff" />
                          <span>HAPPENING NOW • SESSION IN PROGRESS</span>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.95 }}>
                          Ends {formatTime(c.end_time)}
                        </span>
                      </div>
                    )}

                    {/* Hero Visual Cover */}
                    <div className="class-card-hero" style={isOngoing ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : {}}>
                      <img
                        src={c.image_url || visual.image}
                        alt={c.name}
                        loading="lazy"
                        decoding="async"
                        className="class-card-hero-img"
                        onError={(e) => { e.currentTarget.src = visual.image; }}
                      />
                      <div className="class-card-hero-overlay">
                        <div className="class-hero-top-row">
                          <div className="class-category-tag">
                            <span>{visual.icon}</span>
                            <span>{visual.category}</span>
                          </div>
                          <div className={`class-status-tag ${cs.tagClass}`}>
                            {isOngoing ? (
                              <span className="live-pulse-dot-sm" />
                            ) : (
                              <span style={{ fontSize: 9 }}>●</span>
                            )}
                            <span>{cs.label}</span>
                          </div>
                        </div>

                        <div className="class-hero-bottom-row">
                          <div className="class-room-pill">
                            <Icons.MapPin size={11} color="#ff7a00" />
                            <span>{c.room || 'Studio A'}</span>
                          </div>
                          <div className={`class-fee-pill ${c.price > 0 ? 'paid' : 'free'}`}>
                            {c.price > 0 ? `${Number(c.price).toLocaleString()} ETB` : 'Free with Pass'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="class-card-body">
                      <div>
                        <h3 className="class-card-title">{c.name}</h3>
                        <p className="class-card-desc">
                          {c.description || 'High-energy studio session designed for functional athletic performance.'}
                        </p>
                      </div>

                      {/* Coach & Schedule Strip */}
                      <div className="class-info-strip">
                        <div className="class-coach-info">
                          <div className="class-coach-avatar">
                            {c.trainer?.name?.charAt(0).toUpperCase() || 'T'}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Lead Instructor</div>
                            <strong style={{ fontSize: 13, color: 'var(--gym-text-primary, #0f172a)' }}>
                              {c.trainer?.name || 'Tigat Coach'}
                            </strong>
                          </div>
                        </div>

                        <div className="class-schedule-box">
                          <div className="class-schedule-date">
                            <Icons.Calendar size={11} color="#ff7a00" />
                            <span>{formatIsoDate(c.start_time)}</span>
                          </div>
                          <div className="class-schedule-time">
                            <span>{formatTime(c.start_time)}</span>
                            {timeUntilStart && (
                              <span
                                className="class-time-until-badge"
                                title="Time remaining until session starts today"
                              >
                                ⏱ in {timeUntilStart}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Capacity Bar */}
                      <div className="class-capacity-box">
                        <div className="class-capacity-header">
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Roster Occupancy</span>
                          <strong style={{ color: isFull ? '#ef4444' : pctBooked > 75 ? '#ff7a00' : '#10b981' }}>
                            {bookedCount} / {capacity} spots ({isFull ? 'Class Full' : `${spotsLeft} left`})
                          </strong>
                        </div>
                        <div className="class-capacity-bar-track">
                          <div
                            className="class-capacity-bar-fill"
                            style={{
                              width: `${pctBooked}%`,
                              background: isFull
                                ? '#ef4444'
                                : pctBooked > 75
                                ? 'linear-gradient(90deg, #ff7a00, #ea580c)'
                                : 'linear-gradient(90deg, #10b981, #059669)',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="class-card-footer" style={{ padding: '8px 10px' }}>
                      {isStaff ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                          {canBookForOthers && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm btn-card-book-member"
                              onClick={() => handleOpenBook(c)}
                              disabled={isStarted || isFull}
                              title={isStarted ? 'Session already started or completed (booking closed)' : isFull ? 'Class is at max capacity' : 'Book a Member into this class'}
                              style={{
                                flex: 1.15,
                                background: isStarted ? '#94a3b8' : isFull ? '#cbd5e1' : undefined,
                                borderColor: isStarted ? '#94a3b8' : undefined,
                                cursor: isStarted || isFull ? 'not-allowed' : 'pointer',
                                opacity: isStarted ? 0.65 : 1,
                                fontSize: 11,
                                padding: '6px 8px',
                              }}
                            >
                              <Icons.UserPlus size={13} />
                              <span>{isStarted ? 'Closed (Started)' : isFull ? 'Full' : 'Book Member'}</span>
                            </button>
                          )}

                          {canViewRoster && (
                            <button
                              type="button"
                              className="btn-manage-roster"
                              onClick={() => handleOpenRoster(c)}
                              title="Open attendee roster and take attendance"
                              style={{ flex: 1, padding: '6px 8px', fontSize: 11 }}
                            >
                              <Icons.Users size={13} />
                              <span>Roster ({bookedCount}/{capacity})</span>
                            </button>
                          )}

                          {canSchedule && (
                            <div className="class-card-action-icons" style={{ display: 'flex', gap: 3 }}>
                              <button
                                type="button"
                                className="btn-card-icon-action edit"
                                onClick={() => handleOpenEdit(c)}
                                disabled={isStarted}
                                title={isStarted ? 'Cannot edit: class has already started or completed' : 'Edit Session Details'}
                                style={isStarted ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                              >
                                <Icons.Edit size={13} />
                              </button>

                              <button
                                type="button"
                                className="btn-card-icon-action cancel"
                                onClick={() => {
                                  if (!isStarted) {
                                    setCancelTargetClass(c);
                                    setCancelReason('');
                                  }
                                }}
                                disabled={isStarted}
                                title={isStarted ? 'Cannot cancel: class has already started or completed' : 'Cancel Session'}
                                style={isStarted ? { opacity: 0.35, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                              >
                                <Icons.Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Member Self-Reservation */
                        <div style={{ width: '100%' }}>
                          {c.is_booked_by_current_user ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                              onClick={() => handleCancelOwnBooking(c)}
                              disabled={isSubmitting}
                            >
                              <Icons.Check size={14} />
                              <span>Spot Confirmed (Cancel Booking)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{
                                width: '100%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                background: isStarted ? '#94a3b8' : undefined,
                                borderColor: isStarted ? '#94a3b8' : undefined,
                                cursor: isStarted || isFull ? 'not-allowed' : 'pointer',
                                opacity: isStarted ? 0.65 : 1,
                              }}
                              onClick={() => {
                                if (c.price > 0) {
                                  handleOpenBook(c);
                                } else {
                                  handleBookSelf(c);
                                }
                              }}
                              disabled={isSubmitting || isFull || isStarted}
                            >
                              <span>{isStarted ? 'Class Started (Closed)' : isFull ? 'Class Full' : c.price > 0 ? `Book Spot (${c.price} ETB)` : 'Reserve Spot'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Executive Timetable View */
            <div className="classes-table-container">
              <table className="classes-admin-table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Category</th>
                    <th>Instructor</th>
                    <th>Schedule</th>
                    <th>Studio</th>
                    <th>Occupancy</th>
                    <th>Access</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((c) => {
                    const cs = getComputedClassStatus(c);
                    const visual = getClassVisual(c.name, c.room);
                    const bookedCount = c.booked_count ?? 0;
                    const capacity = c.capacity || 20;
                    const pct = Math.min(100, Math.round((bookedCount / capacity) * 100));
                    const isFull = bookedCount >= capacity;
                    const isStarted = cs.isStarted;
                    const timeUntilStart = cs.status === 'scheduled' ? getTimeUntilStart(c.start_time) : null;

                    return (
                      <tr
                        key={c.id}
                        className={cs.isOngoing ? 'row-ongoing' : cs.isCompleted ? 'row-completed' : cs.isCancelled ? 'row-cancelled' : ''}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <img
                              src={c.image_url || visual.image}
                              alt={c.name}
                              loading="lazy"
                              decoding="async"
                              className="table-class-thumb"
                              onError={(e) => { e.currentTarget.src = visual.image; }}
                            />
                            <div>
                              <strong style={{ fontSize: 12.5, color: 'var(--gym-text-primary, #0f172a)', display: 'block', lineHeight: 1.25 }}>
                                {c.name}
                              </strong>
                              <span style={{ fontSize: 10.5, color: '#64748b' }}>
                                {visual.duration} • {visual.intensity}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="class-category-tag" style={{ background: 'rgba(255, 122, 0, 0.1)', color: '#ff7a00', border: '1px solid rgba(255, 122, 0, 0.25)', fontSize: 10, padding: '2px 7px' }}>
                            {visual.icon} {visual.category}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="class-coach-avatar" style={{ width: 24, height: 24, fontSize: 10.5, borderRadius: 5 }}>
                              {c.trainer?.name?.charAt(0).toUpperCase() || 'T'}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 12 }}>
                              {isTrainer ? 'You (Lead Coach)' : (c.trainer?.name || 'Tigat Coach')}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icons.Calendar size={11} color="#ff7a00" />
                            <span>{formatIsoDate(c.start_time)}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: '#ea580c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            <span>{formatTime(c.start_time)}</span>
                            {timeUntilStart && (
                              <span className="class-time-until-badge" style={{ fontSize: 9.5 }}>
                                ⏱ in {timeUntilStart}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Icons.MapPin size={10} color="#ff7a00" />
                            {c.room || 'Studio A'}
                          </span>
                        </td>
                        <td style={{ minWidth: 110 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 2 }}>
                            <strong style={{ color: isFull ? '#ef4444' : '#ff7a00' }}>
                              {bookedCount}/{capacity}
                            </strong>
                            <span style={{ color: '#64748b' }}>{pct}%</span>
                          </div>
                          <div className="class-capacity-bar-track" style={{ height: 4 }}>
                            <div
                              className="class-capacity-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: isFull ? '#ef4444' : pct > 75 ? '#ff7a00' : '#10b981',
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: c.price > 0 ? '#ff7a00' : '#10b981', fontSize: 11.5 }}>
                            {c.price > 0 ? `${Number(c.price).toLocaleString()} ETB` : 'Pass'}
                          </strong>
                        </td>
                        <td>
                          <span className={`class-status-tag ${cs.tagClass}`} style={{ fontSize: 10, padding: '3px 8px' }}>
                            {cs.isOngoing ? <span className="live-pulse-dot-sm" /> : <span style={{ fontSize: 8 }}>●</span>}
                            <span>{cs.label}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                            {isStaff ? (
                              <>
                                {canViewRoster && (
                                  <button
                                    type="button"
                                    className="btn-manage-roster"
                                    style={{ padding: '4px 9px', fontSize: 11, borderRadius: 6 }}
                                    onClick={() => handleOpenRoster(c)}
                                    title={`Open attendee roster (${bookedCount}/${capacity})`}
                                  >
                                    <Icons.Users size={12} />
                                    <span>Roster ({bookedCount})</span>
                                  </button>
                                )}

                                {(canBookForOthers || canSchedule) && (
                                  <div className="gymflow-dropdown-wrap">
                                    <button
                                      type="button"
                                      className={`btn-tbl-more ${openMenuClassId === `table-${c.id}` ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuClassId(openMenuClassId === `table-${c.id}` ? null : `table-${c.id}`);
                                      }}
                                      title="More Management Actions"
                                      aria-label="Actions menu"
                                      style={{ width: 26, height: 26, borderRadius: 6 }}
                                    >
                                      <Icons.MoreVertical size={13} />
                                    </button>

                                    {openMenuClassId === `table-${c.id}` && (
                                      <div
                                        className="gymflow-dropdown-menu"
                                        style={{ right: 0, top: 'calc(100% + 4px)', zIndex: 120, minWidth: 190 }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {canBookForOthers && (
                                          <button
                                            type="button"
                                            className="dropdown-item"
                                            onClick={() => {
                                              setOpenMenuClassId(null);
                                              handleOpenBook(c);
                                            }}
                                            disabled={isFull || isStarted}
                                            style={isStarted || isFull ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                          >
                                            <Icons.UserPlus size={14} color={isStarted ? '#94a3b8' : '#ff7a00'} />
                                            <span>{isStarted ? 'Booking Closed (Started)' : isFull ? 'Class Full (No Spots)' : 'Book Member Spot'}</span>
                                          </button>
                                        )}

                                        {canSchedule && (
                                          <>
                                            <button
                                              type="button"
                                              className="dropdown-item"
                                              onClick={() => {
                                                if (!isStarted) {
                                                  setOpenMenuClassId(null);
                                                  handleOpenEdit(c);
                                                }
                                              }}
                                              disabled={isStarted}
                                              style={isStarted ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                                            >
                                              <Icons.Edit size={14} color={isStarted ? '#94a3b8' : '#3b82f6'} />
                                              <span>{isStarted ? 'Edit Session (Closed — Started)' : 'Edit Session Details'}</span>
                                            </button>

                                            <div className="dropdown-divider" />

                                            <button
                                              type="button"
                                              className="dropdown-item text-danger"
                                              onClick={() => {
                                                if (!isStarted) {
                                                  setOpenMenuClassId(null);
                                                  setCancelTargetClass(c);
                                                  setCancelReason('');
                                                }
                                              }}
                                              disabled={isStarted}
                                              style={isStarted ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
                                            >
                                              <Icons.Trash2 size={14} color={isStarted ? '#94a3b8' : '#ef4444'} />
                                              <span>{isStarted ? 'Cancel Session (Closed — Started)' : 'Cancel Session'}</span>
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              /* Regular Member Actions in Table */
                              c.is_booked_by_current_user ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '4px 8px', fontSize: 11 }}
                                  onClick={() => handleCancelOwnBooking(c)}
                                  disabled={isSubmitting}
                                  title="Cancel your reservation for this class"
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Icons.X size={12} />
                                    <span>Cancel Spot</span>
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-xs"
                                  style={{
                                    padding: '4px 9px',
                                    fontSize: 11,
                                    background: isStarted ? '#94a3b8' : undefined,
                                    borderColor: isStarted ? '#94a3b8' : undefined,
                                    cursor: isStarted || isFull ? 'not-allowed' : 'pointer',
                                    opacity: isStarted ? 0.65 : 1,
                                  }}
                                  onClick={() => {
                                    if (c.price > 0) {
                                      handleOpenBook(c);
                                    } else {
                                      handleBookSelf(c);
                                    }
                                  }}
                                  disabled={isSubmitting || isFull || isStarted}
                                  title={isStarted ? 'Class already started or completed' : isFull ? 'Class is at max capacity' : 'Reserve spot in this class'}
                                >
                                  {isStarted ? 'Started' : isFull ? 'Full' : c.price > 0 ? `Book (${c.price} ETB)` : 'Reserve Spot'}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
