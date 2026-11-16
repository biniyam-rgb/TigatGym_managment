import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import './TrainerManagement.css';
import {
  validateHumanName,
  validatePhoneNumber,
  validateEmailAddress,
  validateMoneyAmount,
  validatePassword,
  extractApiErrors,
  FieldError,
} from '../utils/validation';

const Icons = {
  ArrowLeft: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Search: ({ size = 15, className = '', style = {} }) => (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  UserPlus: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  Edit: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Switch: ({ size = 13, className = '', style = {} }) => (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  ),
  Plus: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Sun: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Moon: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  RotateCcw: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  Users: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Camera: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Clock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Phone: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Mail: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Calendar: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  RefreshCw: ({ size = 14, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  TrendingUp: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Dumbbell: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.17 1.17a2 2 0 0 1-2.83 0L3 11a2 2 0 0 1 0-2.83L4.17 7a2 2 0 0 0 0-2.83L3.17 3.17a2 2 0 0 1 2.83 0L7 4.17a2 2 0 0 0 2.83 0L21 15.34a2 2 0 0 1 0 2.83L19.83 19.34a2 2 0 0 0 0 2.83l1.17 1.17a2 2 0 0 0 2.83-2.83l-1.17-1.17a2 2 0 0 1 0-2.83" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
    </svg>
  ),
  Award: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  AlertCircle: ({ size = 15, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Eye: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  CheckCircle: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

const PRESET_COACH_AVATARS = [
  { label: 'Coach Abel (Strength)', url: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80' },
  { label: 'Coach Sara (HIIT / Rehab)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80' },
  { label: 'Coach Dawit (Bodybuilding)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
  { label: 'Coach Bethlehem (Mobility)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80' },
];

const SPECIALIZATIONS = [
  'Strength & Conditioning',
  'Bodybuilding & Hypertrophy',
  'Fat Loss & High Intensity (HIIT)',
  'Powerlifting & Technique',
  'Physiotherapy & Mobility',
  'Boxing & Combat Conditioning',
  'General Fitness & Calisthenics',
];

export default function TrainerManagement() {
  const { user, hasRole, updateUser } = useAuth();
  const canManageTrainers = hasRole('owner') || hasRole('admin');
  const canAssignOrBook = hasRole('owner') || hasRole('admin') || hasRole('receptionist');

  // Subtabs: 'directory' | 'roster' | 'sessions'
  const [activeTab, setActiveTab] = useState('directory');

  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedShift, setSelectedShift] = useState('all'); // all, morning, evening, full_day
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('name_asc'); // name_asc, fee_desc, fee_asc, clients_desc

  // Roster Tab Filters
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterTrainerFilter, setRosterTrainerFilter] = useState('all');
  const [rosterShiftFilter, setRosterShiftFilter] = useState('all');
  const [rosterStatusFilter, setRosterStatusFilter] = useState('all');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [isClientsDrawerOpen, setIsClientsDrawerOpen] = useState(false);
  const [isScheduleSessionOpen, setIsScheduleSessionOpen] = useState(false);

  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [selectedTrainerClients, setSelectedTrainerClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);

  // Dedicated Trainer Detail View State
  const [selectedTrainerDetail, setSelectedTrainerDetail] = useState(null);
  const [detailTrainerClients, setDetailTrainerClients] = useState([]);
  const [loadingDetailClients, setLoadingDetailClients] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState('athletes'); // 'athletes' | 'bio' | 'sessions'

  // Forms
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'Strength & Conditioning',
    shift: 'full_day',
    monthly_fee: 1500,
    hourly_rate: 350,
    certifications: 'ISSA Certified Personal Trainer',
    bio: '',
    status: 'active',
    avatar: PRESET_COACH_AVATARS[0].url,
    avatar_preview: PRESET_COACH_AVATARS[0].url,
  });

  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    specialization: '',
    shift: 'full_day',
    monthly_fee: 1500,
    hourly_rate: 350,
    certifications: '',
    bio: '',
    status: 'active',
    avatar: '',
    avatar_preview: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const [assignForm, setAssignForm] = useState({
    trainer_id: '',
    member_id: '',
    duration_type: '30_days',
    payment_method: 'cash',
    payment_reference: '',
    notes: '',
  });

  const [changeForm, setChangeForm] = useState({
    member_id: '',
    new_trainer_id: '',
    reason: 'Member requested coach reassignment',
  });

  const [sessionForm, setSessionForm] = useState({
    trainer_id: '',
    member_id: '',
    scheduled_start: '',
    scheduled_end: '',
    focus_area: 'Strength & Form Check',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scrolling when any modal is open
  const isAnyModalOpen = isRegisterOpen || isEditOpen || isAssignOpen || isChangeOpen || isScheduleSessionOpen || isClientsDrawerOpen;
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  // Load Trainer Roster
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

  // Load Members
  const loadMembers = useCallback(async () => {
    if (!canAssignOrBook) return;
    try {
      const res = await apiClient.getMembers({ per_page: 500 });
      setMembers(res.data || []);
    } catch (err) {
      console.warn('Failed to load members for trainer assignment:', err);
    }
  }, [canAssignOrBook]);

  // Load Sessions
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await apiClient.getTrainingSessions();
      setSessions(res.data || []);
    } catch (err) {
      console.warn('Failed to load training sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      loadTrainers();
      loadMembers();
      loadSessions();
    }, 0);
  }, [loadTrainers, loadMembers, loadSessions]);

  // Listen for real-time coach/trainer photo updates across the system
  useEffect(() => {
    const handleTrainerUpdated = (e) => {
      const updated = e.detail?.trainer;
      if (!updated?.id) return;
      const newAvatar = updated.avatar;
      setTrainers((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated, avatar: newAvatar || t.avatar } : t))
      );
      setSelectedTrainerDetail((prev) =>
        prev && prev.id === updated.id ? { ...prev, ...updated, avatar: newAvatar || prev.avatar } : prev
      );
    };
    window.addEventListener('gymcore:trainer-updated', handleTrainerUpdated);
    return () => window.removeEventListener('gymcore:trainer-updated', handleTrainerUpdated);
  }, []);

  // Photo Select
  const handleImageFileSelect = (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (isEdit) {
        setEditForm((prev) => ({ ...prev, avatar: base64, avatar_preview: base64 }));
      } else {
        setRegisterForm((prev) => ({ ...prev, avatar: base64, avatar_preview: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Instant direct photo upload and save from Coach Detail hero banner
  const handleDirectTrainerPhotoUpload = (e, trainerId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await apiClient.updateTrainer(trainerId, { avatar: base64 });
        const finalAvatar = res.data?.avatar || base64;
        setTrainers((prev) => prev.map((t) => (t.id === trainerId ? { ...t, avatar: finalAvatar } : t)));
        setSelectedTrainerDetail((prev) => (prev && prev.id === trainerId ? { ...prev, avatar: finalAvatar } : prev));
        if (user?.id === trainerId && updateUser) {
          updateUser({ avatar: finalAvatar });
        }
        window.dispatchEvent(new CustomEvent('gymcore:trainer-updated', {
          detail: { trainer: { id: trainerId, avatar: finalAvatar } }
        }));
        setSuccessMessage('✓ Coach photo updated and automatically saved!');
      } catch (err) {
        setError(err.message || 'Failed to update coach photo.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Save Photo button inside Edit Coach modal
  const handleQuickSaveCoachPhoto = async () => {
    if (!editForm.id || !editForm.avatar) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.updateTrainer(editForm.id, { avatar: editForm.avatar });
      const finalAvatar = res.data?.avatar || editForm.avatar;
      setTrainers((prev) => prev.map((t) => (t.id === editForm.id ? { ...t, avatar: finalAvatar } : t)));
      setSelectedTrainerDetail((prev) => (prev && prev.id === editForm.id ? { ...prev, avatar: finalAvatar } : prev));
      if (user?.id === editForm.id && updateUser) {
        updateUser({ avatar: finalAvatar });
      }
      window.dispatchEvent(new CustomEvent('gymcore:trainer-updated', {
        detail: { trainer: { id: editForm.id, avatar: finalAvatar } }
      }));
      setSuccessMessage('✓ Coach photo saved and updated successfully!');
      setIsEditOpen(false);
      loadTrainers();
    } catch (err) {
      setError(err.message || 'Failed to save photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Register Coach
  const handleOpenRegister = () => {
    setFormErrors({});
    setError(null);
    setShowPassword(false);
    setIsRegisterOpen(true);
  };

  // Register New Coach
  const handleRegisterTrainer = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setError(null);

    // Client-side domain validation
    const errors = {};
    const nameErr = validateHumanName(registerForm.name, 'Coach full name');
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmailAddress(registerForm.email, { required: true, label: 'Email address' });
    if (emailErr) errors.email = emailErr;

    if (registerForm.phone && String(registerForm.phone).trim()) {
      const phoneErr = validatePhoneNumber(registerForm.phone, { required: false, label: 'Phone number' });
      if (phoneErr) errors.phone = phoneErr;
    }

    if (registerForm.password && String(registerForm.password).trim()) {
      const passErr = validatePassword(registerForm.password, { required: false, minLength: 8, label: 'Password' });
      if (passErr) errors.password = passErr;
    }

    const feeErr = validateMoneyAmount(registerForm.monthly_fee, { required: true, label: 'Monthly coaching fee', allowZero: true });
    if (feeErr) errors.monthly_fee = feeErr;

    if (registerForm.hourly_rate !== undefined && String(registerForm.hourly_rate).trim() !== '') {
      const rateErr = validateMoneyAmount(registerForm.hourly_rate, { required: false, label: 'Hourly rate', allowZero: true });
      if (rateErr) errors.hourly_rate = rateErr;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError('Please resolve the highlighted validation errors before saving.');
      return;
    }

    const feeNum = parseFloat(registerForm.monthly_fee);

    setIsSubmitting(true);
    try {
      const payload = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone && String(registerForm.phone).trim() ? String(registerForm.phone).trim() : undefined,
        password: registerForm.password && String(registerForm.password).trim() ? String(registerForm.password).trim() : undefined,
        specialization: registerForm.specialization,
        shift: registerForm.shift,
        monthly_fee: feeNum,
        hourly_rate: parseFloat(registerForm.hourly_rate) || 0,
        certifications: registerForm.certifications ? registerForm.certifications.trim() : undefined,
        bio: registerForm.bio ? registerForm.bio.trim() : undefined,
        status: registerForm.status,
        avatar: registerForm.avatar || undefined,
      };

      const res = await apiClient.createTrainer(payload);
      setSuccessMessage(res.message || `Coach "${registerForm.name}" registered successfully.`);
      setIsRegisterOpen(false);
      setFormErrors({});
      setRegisterForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialization: 'Strength & Conditioning',
        shift: 'full_day',
        monthly_fee: 1500,
        hourly_rate: 350,
        certifications: 'ISSA Certified Personal Trainer',
        bio: '',
        status: 'active',
        avatar: PRESET_COACH_AVATARS[0].url,
        avatar_preview: PRESET_COACH_AVATARS[0].url,
      });
      loadTrainers();
    } catch (err) {
      const apiErrors = extractApiErrors(err);
      if (Object.keys(apiErrors).length > 0) {
        setFormErrors(apiErrors);
      }
      setError(err.message || 'Failed to register trainer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Coach
  const handleOpenEdit = (t) => {
    setFormErrors({});
    setError(null);
    const prof = t.profile || {};
    setSelectedTrainer(t);
    setEditForm({
      id: t.id,
      name: t.name || '',
      email: t.email || '',
      phone: t.phone || '',
      specialization: prof.specialization || 'Strength & Conditioning',
      shift: prof.shift || 'full_day',
      monthly_fee: prof.monthly_fee || 1500,
      hourly_rate: prof.hourly_rate || 350,
      certifications: prof.certifications || '',
      bio: prof.bio || '',
      status: t.status || 'active',
      avatar: t.avatar || PRESET_COACH_AVATARS[0].url,
      avatar_preview: t.avatar || PRESET_COACH_AVATARS[0].url,
    });
    setIsEditOpen(true);
  };

  // Update Coach
  const handleUpdateTrainer = async (e) => {
    e.preventDefault();
    if (!editForm.id) return;
    setFormErrors({});
    setError(null);

    // Client-side domain validation
    const errors = {};
    const nameErr = validateHumanName(editForm.name, 'Coach full name');
    if (nameErr) errors.name = nameErr;

    const emailErr = validateEmailAddress(editForm.email, { required: true, label: 'Email address' });
    if (emailErr) errors.email = emailErr;

    if (editForm.phone && String(editForm.phone).trim()) {
      const phoneErr = validatePhoneNumber(editForm.phone, { required: false, label: 'Phone number' });
      if (phoneErr) errors.phone = phoneErr;
    }

    const feeErr = validateMoneyAmount(editForm.monthly_fee, { required: true, label: 'Monthly coaching fee', allowZero: true });
    if (feeErr) errors.monthly_fee = feeErr;

    if (editForm.hourly_rate !== undefined && String(editForm.hourly_rate).trim() !== '') {
      const rateErr = validateMoneyAmount(editForm.hourly_rate, { required: false, label: 'Hourly rate', allowZero: true });
      if (rateErr) errors.hourly_rate = rateErr;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError('Please resolve the highlighted validation errors before saving.');
      return;
    }

    const feeNum = parseFloat(editForm.monthly_fee);

    setIsSubmitting(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone && String(editForm.phone).trim() ? String(editForm.phone).trim() : undefined,
        specialization: editForm.specialization,
        shift: editForm.shift,
        monthly_fee: feeNum,
        hourly_rate: parseFloat(editForm.hourly_rate) || 0,
        certifications: editForm.certifications ? editForm.certifications.trim() : undefined,
        bio: editForm.bio ? editForm.bio.trim() : undefined,
        status: editForm.status,
        avatar: editForm.avatar || undefined,
      };

      const res = await apiClient.updateTrainer(editForm.id, payload);
      const updatedData = res.data;
      const finalAvatar = updatedData?.avatar || payload.avatar || editForm.avatar;

      // 1. Instantly update trainers list state
      setTrainers((prev) =>
        prev.map((t) => (t.id === editForm.id ? { ...t, ...(updatedData || {}), avatar: finalAvatar } : t))
      );

      // 2. Instantly update selectedTrainerDetail view if open
      setSelectedTrainerDetail((prev) =>
        prev && prev.id === editForm.id ? { ...prev, ...(updatedData || {}), avatar: finalAvatar } : prev
      );

      // 3. If currently logged in user is this coach, update auth state immediately
      if (user?.id === editForm.id && updateUser) {
        updateUser({ avatar: finalAvatar, name: editForm.name.trim() });
      }

      // 4. Dispatch global event so all dashboards & components sync instantly
      window.dispatchEvent(
        new CustomEvent('gymcore:trainer-updated', {
          detail: {
            trainer: { id: editForm.id, ...(updatedData || {}), avatar: finalAvatar },
          },
        })
      );

      setSuccessMessage(res.message || `Coach "${editForm.name}" updated successfully.`);
      setIsEditOpen(false);
      setFormErrors({});
      loadTrainers();
    } catch (err) {
      const apiErrors = extractApiErrors(err);
      if (Object.keys(apiErrors).length > 0) {
        setFormErrors(apiErrors);
      }
      setError(err.message || 'Failed to update coach profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Turn Off / Deactivate Coach (No alert popup, safe deactivation)
  const handleDeactivateTrainer = async (t) => {
    setConfirmDeactivateId(null);
    try {
      await apiClient.toggleTrainerStatus(t.id);
      setSuccessMessage({
        text: `Coach "${t.name}" turned off (Inactive).`,
        undoTrainerId: t.id,
      });
      loadTrainers();
    } catch (err) {
      setError(err.message || 'Failed to deactivate coach.');
    }
  };

  // Turn Back On / Activate Coach
  const handleTurnOnTrainer = async (t) => {
    try {
      await apiClient.toggleTrainerStatus(t.id);
      setSuccessMessage(`Coach "${t.name}" is now turned ON (Active)!`);
      loadTrainers();
    } catch (err) {
      setError(err.message || 'Failed to activate coach.');
    }
  };

  // Open Clients Drawer
  const handleOpenClientsDrawer = async (t) => {
    setSelectedTrainer(t);
    setIsClientsDrawerOpen(true);
    setLoadingClients(true);
    try {
      const res = await apiClient.getTrainerMembers(t.id);
      setSelectedTrainerClients(res.data || []);
    } catch (err) {
      console.error('Failed to load coach clients:', err);
      setSelectedTrainerClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // Open Comprehensive Trainer Detail View
  const handleOpenTrainerDetail = async (t) => {
    setSelectedTrainerDetail(t);
    setDetailActiveTab('athletes');
    setLoadingDetailClients(true);
    try {
      const res = await apiClient.getTrainerMembers(t.id);
      setDetailTrainerClients(res.data || []);
    } catch (err) {
      console.error('Failed to load coach clients for detail view:', err);
      setDetailTrainerClients([]);
    } finally {
      setLoadingDetailClients(false);
    }
  };

  // Assign Member to Coach
  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!assignForm.trainer_id || !assignForm.member_id) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        member_id: Number(assignForm.member_id),
        trainer_id: Number(assignForm.trainer_id),
        payment_method: assignForm.payment_method,
        payment_reference: assignForm.payment_reference || undefined,
        align_with_subscription: assignForm.duration_type === 'match_gym',
        notes: assignForm.notes || undefined,
      };

      const res = await apiClient.assignTrainerWithPayment(payload);
      setSuccessMessage(res.message || 'Member successfully assigned to personal coach!');
      setIsAssignOpen(false);
      setAssignForm({
        trainer_id: '',
        member_id: '',
        duration_type: '30_days',
        payment_method: 'cash',
        payment_reference: '',
        notes: '',
      });
      loadTrainers();
      loadMembers();
    } catch (err) {
      setError(err.message || 'Failed to assign member to coach.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch Coach
  const handleSwitchTrainer = async (e) => {
    e.preventDefault();
    if (!changeForm.member_id || !changeForm.new_trainer_id) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.changeTrainer({
        member_id: Number(changeForm.member_id),
        new_trainer_id: Number(changeForm.new_trainer_id),
        reason: changeForm.reason || undefined,
      });

      setSuccessMessage(res.message || 'Member successfully reassigned to new coach.');
      setIsChangeOpen(false);
      setChangeForm({
        member_id: '',
        new_trainer_id: '',
        reason: 'Member requested coach reassignment',
      });
      loadTrainers();
      loadMembers();

      if (selectedTrainer && isClientsDrawerOpen) {
        handleOpenClientsDrawer(selectedTrainer);
      }
    } catch (err) {
      setError(err.message || 'Failed to reassign coach.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Schedule Session
  const handleScheduleSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.trainer_id || !sessionForm.member_id || !sessionForm.scheduled_start || !sessionForm.scheduled_end) {
      setError('Please fill in all session scheduling details.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.scheduleTrainingSession({
        trainer_id: Number(sessionForm.trainer_id),
        member_id: Number(sessionForm.member_id),
        scheduled_start: sessionForm.scheduled_start,
        scheduled_end: sessionForm.scheduled_end,
        focus_area: sessionForm.focus_area || undefined,
      });

      setSuccessMessage(res.message || '1-on-1 PT Session scheduled successfully.');
      setIsScheduleSessionOpen(false);
      setSessionForm({
        trainer_id: '',
        member_id: '',
        scheduled_start: '',
        scheduled_end: '',
        focus_area: 'Strength & Form Check',
      });
      loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to schedule session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered & Sorted Trainers
  const filteredTrainers = useMemo(() => {
    let list = trainers.filter((t) => {
      const matchesShift = selectedShift === 'all' || (t.profile?.shift || 'full_day') === selectedShift;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesShift && matchesStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'fee_desc') return Number(b.profile?.monthly_fee || 0) - Number(a.profile?.monthly_fee || 0);
      if (sortBy === 'fee_asc') return Number(a.profile?.monthly_fee || 0) - Number(b.profile?.monthly_fee || 0);
      if (sortBy === 'clients_desc') return Number(b.active_clients_count || 0) - Number(a.active_clients_count || 0);
      return 0;
    });
  }, [trainers, selectedShift, statusFilter, sortBy]);

  // Aggregate Metrics
  const totalCoaches = trainers.length;
  const activeCoaches = trainers.filter((t) => t.status === 'active').length;
  const totalActiveClients = trainers.reduce((sum, t) => sum + (t.active_clients_count || 0), 0);
  const totalMonthlyPotential = trainers.reduce((sum, t) => {
    const fee = t.profile?.monthly_fee || 0;
    const clients = t.active_clients_count || 0;
    return sum + (fee * clients);
  }, 0);

  const morningCount = trainers.filter((t) => t.profile?.shift === 'morning').length;
  const eveningCount = trainers.filter((t) => t.profile?.shift === 'evening').length;
  const fullDayCount = trainers.filter((t) => !t.profile?.shift || t.profile?.shift === 'full_day').length;

  // Members currently assigned to coaches
  const membersWithCoach = useMemo(() => {
    return members.filter((m) => m.assigned_trainer);
  }, [members]);

  // Filtered roster for Tab 2
  const filteredRosterMembers = useMemo(() => {
    return membersWithCoach.filter((m) => {
      const at = m.assigned_trainer;
      const matchesCoach = rosterTrainerFilter === 'all' || String(at?.trainer_id) === String(rosterTrainerFilter);

      const coachUser = trainers.find((t) => String(t.id) === String(at?.trainer_id));
      const shiftKey = coachUser?.profile?.shift || 'full_day';
      const matchesShift = rosterShiftFilter === 'all' || shiftKey === rosterShiftFilter;

      const days = at?.days_remaining ?? null;
      let matchesStatus = true;
      if (rosterStatusFilter === 'active') {
        matchesStatus = days === null || days > 10;
      } else if (rosterStatusFilter === 'expiring') {
        matchesStatus = days !== null && days <= 10 && days > 5;
      } else if (rosterStatusFilter === 'urgent') {
        matchesStatus = days !== null && days <= 5;
      }

      if (!matchesCoach || !matchesShift || !matchesStatus) return false;
      if (!rosterSearch.trim()) return true;

      const q = rosterSearch.toLowerCase();
      const matchName = m.name?.toLowerCase().includes(q);
      const matchCode = m.member_code?.toLowerCase().includes(q);
      const matchPhone = m.phone?.toLowerCase().includes(q);
      const matchTrainer = (at?.name || coachUser?.name)?.toLowerCase().includes(q);

      return matchName || matchCode || matchPhone || matchTrainer;
    });
  }, [membersWithCoach, rosterTrainerFilter, rosterShiftFilter, rosterStatusFilter, rosterSearch, trainers]);

  const isRosterFiltered = rosterSearch.trim() !== '' || rosterTrainerFilter !== 'all' || rosterShiftFilter !== 'all' || rosterStatusFilter !== 'all';
  const rosterActiveCount = useMemo(() => {
    return membersWithCoach.filter((m) => (m.assigned_trainer?.days_remaining ?? 99) > 10).length;
  }, [membersWithCoach]);
  const rosterExpiringCount = useMemo(() => {
    return membersWithCoach.filter((m) => {
      const d = m.assigned_trainer?.days_remaining;
      return d !== null && d !== undefined && d <= 10;
    }).length;
  }, [membersWithCoach]);

  return (
    <div className="trainer-management-view">
      {/* ── Toast Notifications ── */}
      {successMessage && (
        <div className="gymflow-floating-toast toast-success" style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: 8,
          background: '#10b981',
          color: '#fff',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span>✓ {typeof successMessage === 'object' ? successMessage.text : successMessage}</span>
          {typeof successMessage === 'object' && successMessage.undoTrainerId && (
            <button
              type="button"
              onClick={async () => {
                const id = successMessage.undoTrainerId;
                setSuccessMessage(null);
                try {
                  await apiClient.toggleTrainerStatus(id);
                  setSuccessMessage('Coach turned back on!');
                  loadTrainers();
                } catch {
                  setError('Failed to undo coach status');
                }
              }}
              style={{
                background: '#ffffff',
                border: 'none',
                color: '#047857',
                fontWeight: 800,
                fontSize: 12,
                padding: '3px 10px',
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              Turn Back On
            </button>
          )}
          <button type="button" onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {error && (
        <div className="gymflow-floating-toast toast-danger" style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: 8,
          background: '#ef4444',
          color: '#fff',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN VIEW SWITCHER: RELAXED TRAINER DETAIL vs MAIN DIRECTORY
         ══════════════════════════════════════════════════════════════════════ */}
      {selectedTrainerDetail ? (
        <div className="trainer-relaxed-container">
          {/* 1. Single Relaxed Navigation Bar (NO redundant buttons) */}
          <div className="trainer-relaxed-topbar">
            <div className="trainer-relaxed-breadcrumb-group">
              <button
                type="button"
                className="btn-relaxed-back"
                onClick={() => setSelectedTrainerDetail(null)}
                title="Return to Coaches Directory"
              >
                <Icons.ArrowLeft size={16} />
                <span>Back to Coaches Directory</span>
              </button>
              <span className="breadcrumb-divider">/</span>
              <span className="breadcrumb-current">Coach {selectedTrainerDetail.name}</span>
            </div>

            <div className="trainer-relaxed-actions">
              {canAssignOrBook && (
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => {
                    setSelectedTrainer(selectedTrainerDetail);
                    setAssignForm((prev) => ({ ...prev, trainer_id: selectedTrainerDetail.id }));
                    setIsAssignOpen(true);
                  }}
                  style={{ height: 36, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icons.UserPlus size={14} />
                  <span>Assign Athlete</span>
                </button>
              )}

              {canAssignOrBook && (
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => {
                    setSessionForm((prev) => ({
                      ...prev,
                      trainer_id: selectedTrainerDetail.id,
                      scheduled_start: '',
                      scheduled_end: '',
                      focus_area: '',
                    }));
                    setIsScheduleSessionOpen(true);
                  }}
                  style={{ height: 36, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icons.Calendar size={14} />
                  <span>Schedule Session</span>
                </button>
              )}

              {canManageTrainers && (
                <button
                  type="button"
                  className="btn-clean-add-member"
                  onClick={() => handleOpenEdit(selectedTrainerDetail)}
                  style={{ height: 36, padding: '0 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icons.Edit size={14} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Spacious Relaxed Hero Card */}
          {(() => {
            const prof = selectedTrainerDetail.profile || {};
            const monthlyFee = Number(prof.monthly_fee || 0);
            const hourlyRate = Number(prof.hourly_rate || 350);
            const shiftKey = prof.shift || 'full_day';
            const shiftLabel = shiftKey === 'morning' ? 'Morning Shift' : shiftKey === 'evening' ? 'Evening Shift' : 'Full Day Shift';
            const shiftHours = shiftKey === 'morning' ? '6:00 AM – 2:00 PM' : shiftKey === 'evening' ? '2:00 PM – 10:00 PM' : '6:00 AM – 10:00 PM';
            const formattedPhone = (selectedTrainerDetail.phone && selectedTrainerDetail.phone.startsWith('+251') && selectedTrainerDetail.phone.length === 13)
              ? `+251 ${selectedTrainerDetail.phone.slice(4, 6)} ${selectedTrainerDetail.phone.slice(6, 9)} ${selectedTrainerDetail.phone.slice(9)}`
              : (selectedTrainerDetail.phone || 'No phone set');
            const trainerSessions = sessions.filter(
              (s) => s.trainer_id === selectedTrainerDetail.id || s.trainer?.id === selectedTrainerDetail.id
            );

            return (
              <>
                <div className="trainer-relaxed-hero">
                  <div className="hero-identity-row">
                    <div className="hero-avatar-wrapper" style={{ position: 'relative' }}>
                      <img
                        src={selectedTrainerDetail.avatar || PRESET_COACH_AVATARS[0].url}
                        alt={selectedTrainerDetail.name}
                        className="hero-avatar-img"
                        onError={(e) => {
                          e.currentTarget.src = PRESET_COACH_AVATARS[0].url;
                        }}
                      />
                      <span className={`hero-online-status ${selectedTrainerDetail.status === 'active' ? 'online' : 'offline'}`} />

                      {canManageTrainers && (
                        <label
                          className="hero-avatar-change-btn"
                          title="Click to change and automatically save coach photo"
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            background: '#ff7a00',
                            color: '#fff',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            border: '2px solid #fff',
                          }}
                        >
                          <Icons.Camera size={13} />
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleDirectTrainerPhotoUpload(e, selectedTrainerDetail.id)}
                          />
                        </label>
                      )}
                    </div>

                    <div className="hero-details">
                      <div className="hero-name-row">
                        <h1 className="hero-coach-name">{selectedTrainerDetail.name}</h1>
                        <span className="trainer-code-pill-lg">
                          {prof.trainer_code || `TR-${String(selectedTrainerDetail.id).padStart(3, '0')}`}
                        </span>
                        <span className={`status-pill ${selectedTrainerDetail.status === 'active' ? 'active' : 'inactive'}`}>
                          <span className="dot" />
                          {selectedTrainerDetail.status === 'active' ? 'Active Coach' : 'Inactive'}
                        </span>
                      </div>

                      <div className="hero-pills-row">
                        <span className="hero-spec-pill">
                          🎯 {prof.specialization || 'Personal Trainer'}
                        </span>
                        <span className="hero-shift-pill">
                          <Icons.Clock size={13} color="#ff7a00" />
                          <span>{shiftLabel} ({shiftHours})</span>
                        </span>
                        <span className="hero-salaried-pill">
                          💼 100% Salaried Tigat Gym Staff
                        </span>
                      </div>

                      <div className="hero-contact-row">
                        <a href={`tel:${selectedTrainerDetail.phone || ''}`} className="hero-contact-link">
                          <Icons.Phone size={14} color="#ff7a00" />
                          <span>{formattedPhone}</span>
                        </a>
                        <span className="contact-bullet">•</span>
                        <a href={`mailto:${selectedTrainerDetail.email || ''}`} className="hero-contact-link">
                          <Icons.Mail size={14} color="#ff7a00" />
                          <span>{selectedTrainerDetail.email}</span>
                        </a>
                      </div>
                    </div>

                    <div className="hero-rates-box">
                      <div className="rate-item">
                        <span className="rate-sub">Monthly 1-on-1 PT</span>
                        <div className="rate-main">
                          <strong>{monthlyFee > 0 ? `${monthlyFee.toLocaleString()} ETB` : 'Included'}</strong>
                          <span className="rate-period">/ month</span>
                        </div>
                      </div>
                      <div className="rate-divider-vertical" />
                      <div className="rate-item">
                        <span className="rate-sub">Hourly Session Rate</span>
                        <div className="rate-main">
                          <strong>{hourlyRate > 0 ? `${hourlyRate.toLocaleString()} ETB` : '350 ETB'}</strong>
                          <span className="rate-period">/ hour</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Relaxed Stats Strip */}
                  <div className="hero-stats-strip">
                    <div className="stats-strip-item">
                      <Icons.Users size={16} color="#ff7a00" />
                      <span className="stats-strip-label">Active Coached Athletes:</span>
                      <strong className="stats-strip-value">{detailTrainerClients.length} Members</strong>
                    </div>
                    <div className="stats-strip-dot">•</div>
                    <div className="stats-strip-item">
                      <Icons.Calendar size={16} color="#10b981" />
                      <span className="stats-strip-label">1-on-1 Appointments:</span>
                      <strong className="stats-strip-value">{trainerSessions.length} Scheduled</strong>
                    </div>
                    <div className="stats-strip-dot">•</div>
                    <div className="stats-strip-item">
                      <Icons.Clock size={16} color="#3b82f6" />
                      <span className="stats-strip-label">Facility Hours:</span>
                      <strong className="stats-strip-value">{shiftHours}</strong>
                    </div>
                    <div className="stats-strip-dot">•</div>
                    <div className="stats-strip-item">
                      <Icons.Award size={16} color="#f59e0b" />
                      <span className="stats-strip-label">Compensation:</span>
                      <strong className="stats-strip-value">100% Salaried Staff</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Relaxed Tabs Bar */}
                <div className="trainer-relaxed-tabs">
                  <button
                    type="button"
                    className={`relaxed-tab-btn ${detailActiveTab === 'athletes' ? 'active' : ''}`}
                    onClick={() => setDetailActiveTab('athletes')}
                  >
                    <Icons.Users size={15} />
                    <span>Coached Athletes ({detailTrainerClients.length})</span>
                  </button>

                  <button
                    type="button"
                    className={`relaxed-tab-btn ${detailActiveTab === 'bio' ? 'active' : ''}`}
                    onClick={() => setDetailActiveTab('bio')}
                  >
                    <Icons.Award size={15} />
                    <span>Biography & Facility Schedule</span>
                  </button>

                  <button
                    type="button"
                    className={`relaxed-tab-btn ${detailActiveTab === 'sessions' ? 'active' : ''}`}
                    onClick={() => setDetailActiveTab('sessions')}
                  >
                    <Icons.Calendar size={15} />
                    <span>1-on-1 Sessions ({trainerSessions.length})</span>
                  </button>
                </div>

                {/* Tab 1: Coached Athletes Table (Spacious Full-Width Table) */}
                {detailActiveTab === 'athletes' && (
                  <div className="trainer-tab-content-card">
                    <div className="content-card-header">
                      <div>
                        <h3 className="content-card-title">Athletes Under 1-on-1 Mentorship</h3>
                        <p className="content-card-subtitle">
                          Active gym members receiving personal training coaching from Coach {selectedTrainerDetail.name}.
                        </p>
                      </div>
                    </div>

                    {loadingDetailClients ? (
                      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                        <div className="spinner" style={{ margin: '0 auto 12px' }} />
                        <div>Loading athlete roster...</div>
                      </div>
                    ) : detailTrainerClients.length === 0 ? (
                      <div className="relaxed-empty-state">
                        <div style={{ fontSize: 38, marginBottom: 10 }}>👥</div>
                        <h4>No Coached Athletes Assigned Yet</h4>
                        <p>Assign members to this coach to begin personalized 1-on-1 personal training guidance.</p>
                        {canAssignOrBook && (
                          <button
                            type="button"
                            className="btn-clean-add-member"
                            onClick={() => {
                              setSelectedTrainer(selectedTrainerDetail);
                              setAssignForm((prev) => ({ ...prev, trainer_id: selectedTrainerDetail.id }));
                              setIsAssignOpen(true);
                            }}
                            style={{ height: 34, padding: '0 16px', fontSize: 13, marginTop: 12 }}
                          >
                            + Assign Athlete Now
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="relaxed-roster-table">
                          <thead>
                            <tr>
                              <th>Athlete</th>
                              <th>Gym Membership Pass</th>
                              <th>Coaching Period</th>
                              <th>Cycle Status</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailTrainerClients.map((c) => (
                              <tr key={c.assignment_id}>
                                <td>
                                  <div className="relaxed-member-cell">
                                    <div className="relaxed-member-avatar">
                                      {c.name?.charAt(0).toUpperCase() || 'M'}
                                    </div>
                                    <div>
                                      <span className="relaxed-member-name">{c.name}</span>
                                      <div className="relaxed-member-meta">
                                        <span className="code-pill">{c.member_code}</span>
                                        {c.phone && <span className="phone-text">• {c.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="roster-plan-pill">{c.plan_name}</span>
                                </td>
                                <td>
                                  <span className="roster-cycle-date">{c.start_date} → {c.end_date}</span>
                                </td>
                                <td>
                                  <span className={`roster-status-pill ${(c.days_remaining ?? 0) <= 5 ? 'status-danger' : 'status-active'}`}>
                                    <span className="status-dot" />
                                    <span>{c.days_remaining !== null ? `${c.days_remaining}d remaining` : 'Active'}</span>
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setChangeForm({
                                        member_id: c.member_id,
                                        new_trainer_id: '',
                                        reason: `Transferred from Coach ${selectedTrainerDetail.name}`,
                                      });
                                      setIsChangeOpen(true);
                                    }}
                                    className="roster-btn-action"
                                    title="Reassign to another coach"
                                  >
                                    <Icons.Switch size={12} />
                                    <span>Switch Coach</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Biography & Facility Schedule (Spacious Grid) */}
                {detailActiveTab === 'bio' && (
                  <div className="trainer-tab-content-grid">
                    <div className="relaxed-section-box">
                      <h3 className="section-box-title">Biography & Background</h3>
                      <p className="relaxed-bio-quote">
                        {prof.bio || 'Salaried Tigat Gym personal coach specialized in strength conditioning, athlete hypertrophy, and personal fitness training.'}
                      </p>

                      <h3 className="section-box-title" style={{ marginTop: 24 }}>Certifications & Qualifications</h3>
                      <div className="relaxed-certs-row">
                        {(prof.certifications ? prof.certifications.split(',').map((c) => c.trim()).filter(Boolean) : ['ISSA Certified Personal Trainer']).map((cert, idx) => (
                          <span key={idx} className="relaxed-cert-chip">
                            ✓ {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="relaxed-section-box">
                      <h3 className="section-box-title">Facility Schedule & Operating Specs</h3>
                      <div className="relaxed-specs-list">
                        <div className="spec-row">
                          <span className="spec-label">Assigned Shift</span>
                          <strong className="spec-value">{shiftLabel}</strong>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">Facility Working Hours</span>
                          <strong className="spec-value">{shiftHours}</strong>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">Compensation Model</span>
                          <strong className="spec-value" style={{ color: '#10b981' }}>100% Salaried Staff (Tigat Gym)</strong>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">Staff Work Email</span>
                          <strong className="spec-value">{selectedTrainerDetail.email}</strong>
                        </div>
                        <div className="spec-row">
                          <span className="spec-label">Direct Phone</span>
                          <strong className="spec-value">{formattedPhone}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: 1-on-1 Sessions Table (Spacious Full-Width Table) */}
                {detailActiveTab === 'sessions' && (
                  <div className="trainer-tab-content-card">
                    <div className="content-card-header">
                      <div>
                        <h3 className="content-card-title">Scheduled 1-on-1 Appointments</h3>
                        <p className="content-card-subtitle">
                          Personal training and consultation appointments booked with Coach {selectedTrainerDetail.name}.
                        </p>
                      </div>
                    </div>

                    {trainerSessions.length === 0 ? (
                      <div className="relaxed-empty-state">
                        <div style={{ fontSize: 38, marginBottom: 10 }}>⏱️</div>
                        <h4>No Scheduled PT Appointments</h4>
                        <p>There are currently no 1-on-1 training sessions scheduled for Coach {selectedTrainerDetail.name}.</p>
                        {canAssignOrBook && (
                          <button
                            type="button"
                            className="btn-clean-schedule"
                            onClick={() => {
                              setSessionForm((prev) => ({
                                ...prev,
                                trainer_id: selectedTrainerDetail.id,
                                scheduled_start: '',
                                scheduled_end: '',
                                focus_area: '',
                              }));
                              setIsScheduleSessionOpen(true);
                            }}
                            style={{ height: 34, padding: '0 16px', fontSize: 13, marginTop: 12 }}
                          >
                            + Schedule Session Now
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="relaxed-roster-table">
                          <thead>
                            <tr>
                              <th>Session Code</th>
                              <th>Member / Athlete</th>
                              <th>Appointment Date & Time</th>
                              <th>Focus Area</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trainerSessions.map((s) => (
                              <tr key={s.id}>
                                <td>
                                  <span className="code-pill" style={{ color: '#ff7a00', fontWeight: 800 }}>
                                    {s.session_code || `PTS-${s.id}`}
                                  </span>
                                </td>
                                <td><strong>{s.member?.name || 'Member'}</strong></td>
                                <td style={{ fontSize: 13 }}>
                                  {s.scheduled_start ? new Date(s.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                                </td>
                                <td>{s.focus_area || '1-on-1 Personal Training'}</td>
                                <td>
                                  <span className={`status-pill ${s.status === 'completed' ? 'active' : 'pending'}`}>
                                    <span className="dot" />
                                    <span>{s.status || 'scheduled'}</span>
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
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════════════
              1. HEADER ACTION ROW (Standard Tigat Gym Clean Layout)
             ══════════════════════════════════════════════════════════════════════ */}
          <section className="clean-dash-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h1 className="clean-dash-title" style={{ fontSize: 20 }}>Coaching Staff & Personal Trainers</h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>
                Manage salaried coaches, 1-on-1 member assignments, shifts, and personal training revenue.
              </p>
            </div>

            <div className="clean-dash-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
              {canManageTrainers && (
                <button
                  type="button"
                  className="btn-clean-add-member"
                  onClick={handleOpenRegister}
                  title="Register new gym trainer"
                  style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px' }}
                >
                  <Icons.UserPlus size={14} />
                  <span>+ Add New Coach</span>
                </button>
              )}

              {canAssignOrBook && (
                <>
                  <button
                    type="button"
                    className="btn-clean-schedule"
                    onClick={() => setIsChangeOpen(true)}
                    title="Switch a member from their current coach to another"
                    style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icons.Switch size={14} />
                    <span>Switch Coach</span>
                  </button>

                  <button
                    type="button"
                    className="btn-clean-schedule"
                    onClick={() => setIsAssignOpen(true)}
                    title="Assign member to personal coach"
                    style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Icons.UserPlus size={14} />
                    <span>Assign Member</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════════
              2. TOP 4 KPI CARDS (Unified Clean Tigat Gym Design: .clean-kpi-grid)
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="clean-kpi-grid" style={{ marginBottom: 20 }}>
            {/* Card 1: Total Coaches */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Coaching Staff</span>
                <div className="clean-kpi-icon" title="Coaching Staff">
                  <Icons.Users size={16} />
                </div>
              </div>
              <div className="kpi-value">
                {activeCoaches} <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>/ {totalCoaches} Active</span>
              </div>
              <span className="kpi-trend trend-positive">100% Salaried Staff (Owner Paid)</span>
            </div>

            {/* Card 2: Coached Athletes */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Coached Athletes</span>
                <div className="clean-kpi-icon" title="Coached Athletes">
                  <Icons.UserPlus size={16} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#ff7a00' }}>
                {totalActiveClients}
              </div>
              <span className="kpi-trend trend-positive">Under 1-on-1 mentorship</span>
            </div>

            {/* Card 3: Monthly Coaching Revenue */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Monthly Coaching Revenue</span>
                <div className="clean-kpi-icon" title="Coaching Revenue">
                  <Icons.TrendingUp size={16} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: '#10b981' }}>
                {totalMonthlyPotential.toLocaleString()} ETB
              </div>
              <span className="kpi-trend trend-positive">Direct Tigat Gym Revenue</span>
            </div>

            {/* Card 4: Shift Coverage */}
            <div className="clean-kpi-card">
              <div className="clean-kpi-top">
                <span className="kpi-label">Active Shifts</span>
                <div className="clean-kpi-icon" title="Shift Coverage">
                  <Icons.Clock size={16} />
                </div>
              </div>
              <div className="kpi-value">
                {morningCount + eveningCount + fullDayCount} Active
              </div>
              <span className="kpi-trend" style={{ color: '#64748b' }}>
                Morning {morningCount} • Evening {eveningCount} • Full {fullDayCount}
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              3. SUBTABS (Standard .iron-dashboard-subtabs / .subtab-pill)
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="iron-dashboard-subtabs" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`subtab-pill ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('directory')}
            >
              <Icons.Users size={15} />
              <span>Coaches Directory ({filteredTrainers.length})</span>
            </button>

            <button
              type="button"
              className={`subtab-pill ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => setActiveTab('roster')}
            >
              <Icons.UserPlus size={15} />
              <span>Coached Members Roster ({membersWithCoach.length})</span>
            </button>

            <button
              type="button"
              className={`subtab-pill ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              <Icons.Calendar size={15} />
              <span>1-on-1 PT Sessions ({sessions.length})</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              4. MAIN CONTENT CONTAINER (Standard Tigat Gym: .dashboard-card)
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="dashboard-card" style={{ padding: 22 }}>
            {/* ========================================================================= */}
            {/* TAB 1: COACHING STAFF DIRECTORY (CARDS VIEW)                              */}
            {/* ========================================================================= */}
            {activeTab === 'directory' && (
          <>
            {/* Well-Organized Search & Filter Toolbar */}
            <div className="trainer-controls-bar">
              {/* Search Bar with Search Icon Inside */}
              <div className="trainer-search-wrapper" style={{ position: 'relative' }}>
                <span
                  className="trainer-search-icon"
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    color: '#94a3b8',
                    zIndex: 2,
                  }}
                >
                  <Icons.Search size={15} />
                </span>
                <input
                  type="text"
                  className="trainer-search-input"
                  placeholder="Search coach, specialization, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: 38,
                    paddingRight: search ? 32 : 12,
                    boxSizing: 'border-box',
                  }}
                />
                {search && (
                  <button
                    type="button"
                    className="trainer-search-clear-btn"
                    onClick={() => setSearch('')}
                    title="Clear search"
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 2,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Shift Filter Dropdown (Organized like Status and Sort) */}
              <div className="trainer-filter-item">
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="trainer-filter-select"
                  title="Filter by shift"
                >
                  <option value="all">All Shifts ({totalCoaches})</option>
                  <option value="morning">🌅 Morning Shift ({morningCount})</option>
                  <option value="evening">🌆 Evening Shift ({eveningCount})</option>
                  <option value="full_day">☀️ Full Day ({fullDayCount})</option>
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div className="trainer-filter-item">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="trainer-filter-select"
                  title="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only ({activeCoaches})</option>
                  <option value="inactive">Inactive Only ({totalCoaches - activeCoaches})</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="trainer-filter-item">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="trainer-filter-select"
                  title="Sort coaches"
                >
                  <option value="name_asc">Sort: Name (A-Z)</option>
                  <option value="fee_desc">Sort: Fee (High to Low)</option>
                  <option value="fee_asc">Sort: Fee (Low to High)</option>
                  <option value="clients_desc">Sort: Most Active Clients</option>
                </select>
              </div>

              {/* Quick Reset Button if any filter active */}
              {(search || selectedShift !== 'all' || statusFilter !== 'all' || sortBy !== 'name_asc') && (
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => {
                    setSearch('');
                    setSelectedShift('all');
                    setStatusFilter('all');
                    setSortBy('name_asc');
                  }}
                  title="Reset all filters"
                  style={{ height: 38, fontSize: 12, padding: '0 12px', whiteSpace: 'nowrap' }}
                >
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Coach Cards Grid */}
            {isLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <div>Loading coaching roster...</div>
              </div>
            ) : filteredTrainers.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--gym-bg-subtle, #f8fafc)', border: '1px dashed var(--gym-card-border, #cbd5e1)', borderRadius: 14 }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🏋️‍♂️</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>No Coaches Found</h3>
                <p style={{ color: '#64748b', fontSize: 13, maxWidth: 440, margin: '0 auto 14px' }}>
                  {search ? `No coach matched "${search}". Try clearing search filters.` : 'No coaches registered yet. Add gym trainers with their specialization and monthly fee in Birr.'}
                </p>
                {canManageTrainers && (
                  <button
                    type="button"
                    className="btn-clean-add-member"
                    onClick={handleOpenRegister}
                  >
                    + Register First Coach
                  </button>
                )}
              </div>
            ) : (
              <div className="classes-grid trainers-cards-grid">
                {filteredTrainers.map((t) => {
                  const prof = t.profile || {};
                  const monthlyFee = Number(prof.monthly_fee || 0);
                  const clientsCount = Number(t.active_clients_count || 0);
                  const shiftKey = prof.shift || 'full_day';
                  const shiftLabel = shiftKey === 'morning' ? '🌅 Morning' : shiftKey === 'evening' ? '🌆 Evening' : '☀️ Full Day';
                  const shiftHours = shiftKey === 'morning' ? '6:00 AM – 2:00 PM' : shiftKey === 'evening' ? '2:00 PM – 10:00 PM' : '6:00 AM – 10:00 PM';
                  const rawContact = t.phone || t.email || 'Staff Desk';
                  const formattedContact = (t.phone && t.phone.startsWith('+251') && t.phone.length === 13)
                    ? `+251 ${t.phone.slice(4, 6)} ${t.phone.slice(6, 9)} ${t.phone.slice(9)}`
                    : rawContact;

                  return (
                    <div
                      key={t.id}
                      className="class-card"
                      onClick={() => handleOpenTrainerDetail(t)}
                      title={`Click to view ${t.name}'s complete profile, athlete roster, and schedule`}
                    >
                      {/* Hero Visual Cover matching Class Dashboard */}
                      <div className="class-card-hero">
                        <img
                          src={t.avatar || PRESET_COACH_AVATARS[0].url}
                          alt={t.name}
                          className="class-card-hero-img"
                          onError={(e) => {
                            e.currentTarget.src = PRESET_COACH_AVATARS[0].url;
                          }}
                        />
                        <div className="class-card-hero-overlay">
                          <div className="class-hero-top-row">
                            <div className="class-category-tag">
                              <span>🎯</span>
                              <span>{prof.specialization || 'Personal Trainer'}</span>
                            </div>
                            <div className={`class-status-tag ${t.status === 'active' ? 'scheduled' : 'completed'}`}>
                              <span style={{ fontSize: 9 }}>●</span>
                              <span>{t.status === 'active' ? 'Active Coach' : 'Inactive'}</span>
                            </div>
                          </div>

                          <div className="class-hero-bottom-row">
                            <div className="class-room-pill">
                              <Icons.Clock size={11} color="#ff7a00" />
                              <span>{shiftLabel}</span>
                            </div>
                            <div className="class-fee-pill paid">
                              {monthlyFee > 0 ? `${monthlyFee.toLocaleString()} ETB / mo` : 'Standard'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="class-card-body">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                            <h3 className="class-card-title">{t.name}</h3>
                            <span className="trainer-code-pill">
                              {prof.trainer_code || `TR-${String(t.id).padStart(3, '0')}`}
                            </span>
                          </div>
                          <p className="class-card-desc">
                            {prof.bio || prof.certifications || 'Salaried Tigat Gym personal coach specialized in strength & athlete conditioning.'}
                          </p>
                        </div>

                        {/* Coach & Shift Schedule Strip */}
                        <div className="class-info-strip">
                          <div className="class-coach-info">
                            <div className="class-coach-avatar">
                              {t.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="class-coach-text-col">
                              <div className="class-coach-sublabel">Contact Coach</div>
                              <strong className="class-coach-contact" title={rawContact}>
                                {formattedContact}
                              </strong>
                            </div>
                          </div>

                          <div className="class-schedule-box">
                            <div className="class-schedule-date">
                              <Icons.Clock size={11} color="#ff7a00" />
                              <span>{shiftHours}</span>
                            </div>
                            <div className="class-schedule-time">
                              <span className="class-time-until-badge">
                                100% Salaried
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Active Athletes Mentorship Load Bar */}
                        <div className="class-capacity-box">
                          <div className="class-capacity-header">
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Active Athletes Mentored</span>
                            <strong style={{ color: clientsCount > 0 ? '#ff7a00' : '#10b981' }}>
                              {clientsCount} Coached Members
                            </strong>
                          </div>
                          <div className="class-capacity-bar-track">
                            <div
                              className="class-capacity-bar-fill"
                              style={{
                                width: `${Math.min(100, Math.max(8, clientsCount * 12))}%`,
                                background: clientsCount >= 10
                                  ? 'linear-gradient(90deg, #ff7a00, #ea580c)'
                                  : 'linear-gradient(90deg, #10b981, #059669)',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="class-card-footer">
                        <button
                          type="button"
                          className="btn-clean-schedule"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenClientsDrawer(t);
                          }}
                          style={{ height: 28, fontSize: 11.5, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                          title="View athlete roster"
                        >
                          <Icons.Users size={12} />
                          <span>Roster ({clientsCount})</span>
                        </button>

                        {confirmDeactivateId === t.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>Turn off?</span>
                            <button
                              type="button"
                              className="btn-clean-add-member"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeactivateTrainer(t);
                              }}
                              style={{ height: 26, fontSize: 11, padding: '0 8px', background: '#ef4444', borderColor: '#ef4444' }}
                            >
                              Yes, Turn Off
                            </button>
                            <button
                              type="button"
                              className="btn-clean-schedule"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeactivateId(null);
                              }}
                              style={{ height: 26, fontSize: 11, padding: '0 8px' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : t.status === 'inactive' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {canManageTrainers && (
                              <button
                                type="button"
                                className="btn-clean-add-member"
                                onClick={(e) => {
                                e.stopPropagation();
                                handleTurnOnTrainer(t);
                              }}
                                style={{ height: 28, fontSize: 11.5, padding: '0 12px', background: '#10b981', borderColor: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                title="Turn this coach back on (Active)"
                              >
                                <span>⚡ Turn On Coach</span>
                              </button>
                            )}
                            {canManageTrainers && (
                              <button
                                type="button"
                                className="btn-clean-schedule"
                                onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(t);
                              }}
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit Coach Details & Fee"
                              >
                                <Icons.Edit size={12} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {canAssignOrBook && (
                              <button
                                type="button"
                                className="btn-clean-schedule"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTrainer(t);
                                  setAssignForm((prev) => ({ ...prev, trainer_id: t.id }));
                                  setIsAssignOpen(true);
                                }}
                                style={{ height: 28, fontSize: 11.5, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                title="Assign an athlete to this coach"
                              >
                                <Icons.UserPlus size={12} />
                                <span>+ Assign</span>
                              </button>
                            )}

                            {canManageTrainers && (
                              <button
                                type="button"
                                className="btn-clean-schedule"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(t);
                                }}
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit Coach Details & Fee"
                              >
                                <Icons.Edit size={12} />
                              </button>
                            )}

                            {canManageTrainers && (
                              <button
                                type="button"
                                className="btn-clean-schedule"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeactivateId(t.id);
                                }}
                                style={{ height: 28, width: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                                title="Turn Off / Deactivate Coach"
                              >
                                <Icons.Trash size={12} />
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
          </>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALL COACHED MEMBERS ROSTER (COMPACT & CLEAN)                       */}
        {/* ========================================================================= */}
        {activeTab === 'roster' && (
          <div className="roster-section-container">
            {/* Top Micro-KPI Status Strip */}
            <div className="roster-summary-strip">
              <div className="roster-summary-chip">
                <span className="chip-dot active" />
                <span>Total Coached: <strong>{membersWithCoach.length}</strong></span>
              </div>
              <div className="roster-summary-chip">
                <span className="chip-dot active" />
                <span>Active Cycles (&gt;10d): <strong>{rosterActiveCount}</strong></span>
              </div>
              <div className="roster-summary-chip">
                <span className="chip-dot warning" />
                <span>Expiring Soon (≤10d): <strong>{rosterExpiringCount}</strong></span>
              </div>
            </div>

            {/* Unified Controls & Filters Bar */}
            <div className="trainer-controls-bar" style={{ marginTop: 0, marginBottom: 4 }}>
              {/* Search Bar with embedded icon as placeholder */}
              <div className="trainer-search-wrapper" style={{ minWidth: 230 }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    color: '#94a3b8',
                    zIndex: 2,
                  }}
                >
                  <Icons.Search size={14} />
                </span>
                <input
                  type="text"
                  className="trainer-search-input"
                  placeholder="Filter athlete, code, or coach..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  style={{ paddingLeft: 36, height: 36, fontSize: 12.5 }}
                />
              </div>

              {/* Filter: Coach */}
              <select
                value={rosterTrainerFilter}
                onChange={(e) => setRosterTrainerFilter(e.target.value)}
                className="trainer-filter-select"
                style={{ height: 36, fontSize: 12.5, minWidth: 150 }}
              >
                <option value="all">All Coaches ({trainers.length})</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.active_clients_count || 0})
                  </option>
                ))}
              </select>

              {/* Filter: Shift */}
              <select
                value={rosterShiftFilter}
                onChange={(e) => setRosterShiftFilter(e.target.value)}
                className="trainer-filter-select"
                style={{ height: 36, fontSize: 12.5 }}
              >
                <option value="all">All Shifts</option>
                <option value="morning">Morning Shift</option>
                <option value="evening">Evening Shift</option>
                <option value="full_day">Full Day</option>
              </select>

              {/* Filter: Cycle Status */}
              <select
                value={rosterStatusFilter}
                onChange={(e) => setRosterStatusFilter(e.target.value)}
                className="trainer-filter-select"
                style={{ height: 36, fontSize: 12.5 }}
              >
                <option value="all">All Cycles</option>
                <option value="active">Active (&gt; 10d left)</option>
                <option value="expiring">Expiring Soon (6–10d)</option>
                <option value="urgent">Urgent Renewal (≤ 5d)</option>
              </select>

              {/* Reset button if filtered */}
              {isRosterFiltered && (
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => {
                    setRosterSearch('');
                    setRosterTrainerFilter('all');
                    setRosterShiftFilter('all');
                    setRosterStatusFilter('all');
                  }}
                  title="Reset all filters"
                  style={{ height: 36, padding: '0 12px', fontSize: 12, gap: 5 }}
                >
                  <Icons.RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}

              {/* Right Side: Counter & Quick Assign */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>
                  Showing <strong style={{ color: 'var(--gym-text-main, #0f172a)' }}>{filteredRosterMembers.length}</strong> of {membersWithCoach.length}
                </span>

                {canAssignOrBook && (
                  <button
                    type="button"
                    className="btn-clean-add-member"
                    onClick={() => setIsAssignOpen(true)}
                    style={{ height: 36, padding: '0 14px', fontSize: 12.5 }}
                  >
                    <Icons.UserPlus size={14} />
                    <span>+ Assign Athlete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Roster Table Card */}
            {filteredRosterMembers.length === 0 ? (
              <div className="roster-table-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8, color: '#94a3b8' }}>
                  <Icons.Users size={32} />
                </div>
                <h4 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 4px', color: 'var(--gym-text-main, #0f172a)' }}>
                  No Coached Members Found
                </h4>
                <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 14px' }}>
                  {isRosterFiltered ? 'No athlete matched your active search or filter criteria.' : 'No gym members are currently assigned to a coach.'}
                </p>
                {isRosterFiltered ? (
                  <button
                    type="button"
                    className="btn-clean-schedule"
                    onClick={() => {
                      setRosterSearch('');
                      setRosterTrainerFilter('all');
                      setRosterShiftFilter('all');
                      setRosterStatusFilter('all');
                    }}
                    style={{ margin: '0 auto' }}
                  >
                    Clear All Filters
                  </button>
                ) : canAssignOrBook ? (
                  <button
                    type="button"
                    className="btn-clean-add-member"
                    onClick={() => setIsAssignOpen(true)}
                    style={{ margin: '0 auto' }}
                  >
                    + Assign Member to Coach
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="roster-table-card">
                <div className="table-responsive">
                  <table className="roster-table">
                    <thead>
                      <tr>
                        <th style={{ width: '28%' }}>Athlete / Member</th>
                        <th style={{ width: '16%' }}>Gym Pass</th>
                        <th style={{ width: '22%' }}>Assigned Coach</th>
                        <th style={{ width: '15%' }}>Shift & Schedule</th>
                        <th style={{ width: '11%' }}>Cycle Status</th>
                        <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRosterMembers.map((m) => {
                        const at = m.assigned_trainer;
                        const daysRemaining = at?.days_remaining ?? null;
                        const isDanger = daysRemaining !== null && daysRemaining <= 5;
                        const isWarning = daysRemaining !== null && daysRemaining > 5 && daysRemaining <= 10;
                        const coachUser = trainers.find((t) => String(t.id) === String(at?.trainer_id));
                        const shiftKey = coachUser?.profile?.shift || 'full_day';

                        return (
                          <tr key={m.id || m.user_id}>
                            {/* 1. Athlete: Compact Avatar + Name + Code + Phone */}
                            <td>
                              <div className="roster-athlete-cell">
                                <div className="roster-athlete-avatar">
                                  {m.name?.charAt(0).toUpperCase() || 'M'}
                                </div>
                                <div className="roster-athlete-info">
                                  <span className="roster-athlete-name">{m.name}</span>
                                  <div className="roster-athlete-meta">
                                    <span className="roster-code-tag">{m.member_code}</span>
                                    {m.phone && <span>• {m.phone}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Gym Pass */}
                            <td>
                              <span className="roster-plan-pill">
                                {m.current_subscription?.plan_name || 'Standard Pass'}
                              </span>
                            </td>

                            {/* 3. Assigned Coach */}
                            <td>
                              <div className="roster-coach-cell">
                                <img
                                  src={at?.avatar || coachUser?.avatar || PRESET_COACH_AVATARS[0].url}
                                  alt={at?.name || coachUser?.name}
                                  className="roster-coach-avatar"
                                />
                                <div className="roster-coach-info">
                                  <span className="roster-coach-name">{at?.name || coachUser?.name}</span>
                                  <span className="roster-coach-spec">
                                    {at?.specialization || coachUser?.profile?.specialization || 'Coach'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 4. Shift & Dates */}
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <span className={`roster-shift-tag ${shiftKey}`}>
                                  {shiftKey === 'morning' ? <Icons.Sun size={10} /> : shiftKey === 'evening' ? <Icons.Moon size={10} /> : <Icons.Sun size={10} />}
                                  <span>{shiftKey === 'morning' ? 'Morning' : shiftKey === 'evening' ? 'Evening' : 'Full Day'}</span>
                                </span>
                                <span className="roster-cycle-date">
                                  {at?.start_date || '—'} → {at?.end_date || 'Active'}
                                </span>
                              </div>
                            </td>

                            {/* 5. Cycle Status */}
                            <td>
                              <span className={`roster-status-pill ${isDanger ? 'status-danger' : isWarning ? 'status-warning' : 'status-active'}`}>
                                <span className="status-dot" />
                                <span>{daysRemaining !== null ? `${daysRemaining}d left` : 'Active'}</span>
                              </span>
                            </td>

                            {/* 6. Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <div className="roster-actions-group">
                                {canAssignOrBook && (
                                  <button
                                    type="button"
                                    className="roster-btn-action"
                                    onClick={() => {
                                      setChangeForm({
                                        member_id: m.user_id || m.id,
                                        new_trainer_id: '',
                                        reason: `Reassignment from Coach ${at?.name || 'current coach'}`,
                                      });
                                      setIsChangeOpen(true);
                                    }}
                                    title="Switch athlete to a different coach"
                                  >
                                    <Icons.Switch size={11} />
                                    <span>Switch</span>
                                  </button>
                                )}

                                {canAssignOrBook && (
                                  <button
                                    type="button"
                                    className="roster-btn-action btn-renew"
                                    onClick={() => {
                                      setAssignForm({
                                        trainer_id: at?.trainer_id || '',
                                        member_id: m.user_id || m.id,
                                        duration_type: '30_days',
                                        payment_method: 'cash',
                                        payment_reference: '',
                                        notes: 'Renewal of coaching month',
                                      });
                                      setIsAssignOpen(true);
                                    }}
                                    title="Extend coaching cycle"
                                  >
                                    <Icons.Plus size={11} />
                                    <span>Renew</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: 1-ON-1 PT SESSIONS & SCHEDULE                                      */}
        {/* ========================================================================= */}
        {activeTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--gym-text-main, #0f172a)' }}>
                  1-on-1 Personal Training Appointments ({sessions.length})
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Scheduled 1-on-1 training and consultation sessions.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {canAssignOrBook && (
                  <button
                    type="button"
                    className="btn-clean-add-member"
                    onClick={() => setIsScheduleSessionOpen(true)}
                  >
                    <Icons.Calendar size={14} />
                    <span>+ Schedule PT Session</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={loadSessions}
                  title="Refresh Sessions"
                >
                  <Icons.RefreshCw size={14} className={isLoadingSessions ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {isLoadingSessions ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                <div className="spinner" style={{ margin: '0 auto 10px' }} />
                <div>Loading PT sessions...</div>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', background: 'var(--gym-bg-subtle, #f8fafc)', borderRadius: 12 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>⏱️</div>
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>No Scheduled Sessions</h4>
                <p style={{ color: '#64748b', fontSize: 12.5, margin: '0 0 14px' }}>
                  No 1-on-1 personal training sessions have been logged yet.
                </p>
                {canAssignOrBook && (
                  <button
                    type="button"
                    className="btn-clean-add-member"
                    onClick={() => setIsScheduleSessionOpen(true)}
                  >
                    + Schedule First Session
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="gym-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Session Code</th>
                      <th>Coach</th>
                      <th>Athlete</th>
                      <th>Date & Time</th>
                      <th>Focus Area</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ff8a00' }}>
                            {s.session_code || `PTS-${s.id}`}
                          </span>
                        </td>
                        <td><strong>{s.trainer?.name || 'Coach'}</strong></td>
                        <td>{s.member?.name || 'Member'}</td>
                        <td style={{ fontSize: 12 }}>
                          {s.scheduled_start ? new Date(s.scheduled_start).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, background: 'rgba(255, 138, 0, 0.1)', color: '#ff8a00', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                            {s.focus_area || 'Strength & Conditioning'}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: s.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                            color: s.status === 'completed' ? '#10b981' : '#3b82f6',
                          }}>
                            ● {s.status?.toUpperCase() || 'SCHEDULED'}
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
      </div>
    </>
  )}

      {/* ========================================================================= */}
      {/* MODAL 1: REGISTER NEW COACH & TRAINER (NON-SCROLLABLE, TOP, BLURRED)       */}
      {/* ========================================================================= */}
      {isRegisterOpen && (
        <div className="trainer-modal-backdrop">
          <div className="trainer-modal-card" style={{ maxWidth: 620 }}>
            {/* Modal Header */}
            <div className="trainer-modal-header">
              <div className="trainer-modal-header-left">
                <div className="trainer-modal-icon-badge">
                  <Icons.UserPlus size={18} />
                </div>
                <div>
                  <h3 className="trainer-modal-title">Register New Coach & Trainer</h3>
                  <span className="trainer-modal-subtitle">
                    Add salaried staff profile, work shift schedule & monthly coaching fee.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setIsRegisterOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegisterTrainer} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="trainer-modal-body">
                {/* Validation Error Banner */}
                {Object.values(formErrors).some(Boolean) && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    color: '#ef4444',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}>
                    <Icons.AlertCircle size={15} color="#ef4444" />
                    <span>Please correct the highlighted validation errors below before saving.</span>
                  </div>
                )}

                {/* Photo Upload Section - Compact Horizontal Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  padding: '9px 12px',
                  background: 'var(--gym-bg-subtle, #f8fafc)',
                  borderRadius: 10,
                  border: '1px solid var(--gym-card-border, #e2e8f0)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={registerForm.avatar_preview || PRESET_COACH_AVATARS[0].url}
                      alt="Preview"
                      style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', border: '2px solid #ff8a00' }}
                    />
                    <div>
                      <label className="btn-clean-schedule" style={{ cursor: 'pointer', height: 26, fontSize: 11, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Icons.Camera size={12} />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFileSelect(e, false)}
                        />
                      </label>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                        Or choose preset:
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {PRESET_COACH_AVATARS.map((p, idx) => (
                      <img
                        key={idx}
                        src={p.url}
                        alt={p.label}
                        title={p.label}
                        onClick={() => setRegisterForm({ ...registerForm, avatar: p.url, avatar_preview: p.url })}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: registerForm.avatar === p.url ? '2px solid #ff8a00' : '1px solid #cbd5e1',
                          opacity: registerForm.avatar === p.url ? 1 : 0.6,
                          transition: 'all 0.12s ease',
                        }}
                      />
                    ))}
                    {editForm.avatar && (
                      <button
                        type="button"
                        onClick={handleQuickSaveCoachPhoto}
                        disabled={isSubmitting}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'rgba(255,138,0,0.1)',
                          border: '1px solid #ff8a00',
                          color: '#ea580c',
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Save Photo Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 1: Coach Name & Phone */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Coach Full Name *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.name}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, name: e.target.value });
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="e.g. Coach Abel Tesfaye"
                      className="trainer-modal-input"
                      style={formErrors.name ? { borderColor: '#ef4444' } : {}}
                    />
                    <FieldError error={formErrors.name} />
                  </div>

                  <div className="trainer-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="trainer-form-label">Phone Number</label>
                      <span style={{ fontSize: 10.5, color: '#64748b' }}>e.g. 0911223344 or +251911223344</span>
                    </div>
                    <input
                      type="text"
                      value={registerForm.phone}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, phone: e.target.value });
                        if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      placeholder="+251 911 234 567"
                      className="trainer-modal-input"
                      style={formErrors.phone ? { borderColor: '#ef4444' } : {}}
                    />
                    <FieldError error={formErrors.phone} />
                  </div>
                </div>

                {/* Row 2: Email & Password */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => {
                        setRegisterForm({ ...registerForm, email: e.target.value });
                        if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                      }}
                      placeholder="coach@tigatgym.com"
                      className="trainer-modal-input"
                      style={formErrors.email ? { borderColor: '#ef4444' } : {}}
                    />
                    <FieldError error={formErrors.email} />
                  </div>

                  <div className="trainer-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="trainer-form-label">Login Password</label>
                      <span style={{ fontSize: 10.5, color: '#64748b' }}>Default: Password123!</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(e) => {
                          setRegisterForm({ ...registerForm, password: e.target.value });
                          if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: null }));
                        }}
                        placeholder="Min 8 chars (or leave blank for default)"
                        className="trainer-modal-input"
                        style={{ paddingRight: 36, ...(formErrors.password ? { borderColor: '#ef4444' } : {}) }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 2,
                        }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                      </button>
                    </div>
                    <FieldError error={formErrors.password} />
                  </div>
                </div>

                {/* Row 3: Specialization & Work Shift Schedule */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Primary Specialization *</label>
                    <select
                      value={registerForm.specialization}
                      onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })}
                      className="trainer-modal-input"
                      style={{ cursor: 'pointer' }}
                    >
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Work Shift Schedule *</label>
                    <select
                      value={registerForm.shift}
                      onChange={(e) => setRegisterForm({ ...registerForm, shift: e.target.value })}
                      className="trainer-modal-input"
                      style={{ cursor: 'pointer', fontWeight: 600 }}
                    >
                      <option value="morning">🌅 Morning Shift (6:00 AM – 2:00 PM)</option>
                      <option value="evening">🌆 Evening Shift (2:00 PM – 10:00 PM)</option>
                      <option value="full_day">☀️ Full Day Shift (Standard Operating Hours)</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Monthly Coaching Fee & Hourly Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* Monthly Coaching Fee in Birr (ETB) */}
                  <div style={{
                    padding: '9px 12px',
                    background: 'rgba(255, 138, 0, 0.08)',
                    border: formErrors.monthly_fee ? '1px solid #ef4444' : '1px solid rgba(255, 138, 0, 0.25)',
                    borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#ea580c' }}>
                        Monthly Fee (Birr) *
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={registerForm.monthly_fee}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, monthly_fee: e.target.value });
                            if (formErrors.monthly_fee) setFormErrors((prev) => ({ ...prev, monthly_fee: null }));
                          }}
                          className="trainer-modal-input"
                          style={{
                            width: 80,
                            height: 28,
                            padding: '0 6px',
                            fontWeight: 800,
                            textAlign: 'right',
                            borderColor: formErrors.monthly_fee ? '#ef4444' : undefined,
                          }}
                          placeholder="1500"
                        />
                        <strong style={{ fontSize: 10.5, color: '#ea580c' }}>ETB</strong>
                      </div>
                    </div>

                    <div className="trainer-modal-fee-chips" style={{ margin: 0, gap: 4 }}>
                      {[1000, 1500, 2000, 2500, 3000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setRegisterForm({ ...registerForm, monthly_fee: amt });
                            if (formErrors.monthly_fee) setFormErrors((prev) => ({ ...prev, monthly_fee: null }));
                          }}
                          className={`trainer-fee-chip-btn ${Number(registerForm.monthly_fee) === amt ? 'selected' : ''}`}
                          style={{ padding: '2px 6px', fontSize: 10.5 }}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <FieldError error={formErrors.monthly_fee} />
                  </div>

                  {/* Hourly Session Rate in Birr (ETB) */}
                  <div style={{
                    padding: '9px 12px',
                    background: 'var(--gym-bg-subtle, #f8fafc)',
                    border: formErrors.hourly_rate ? '1px solid #ef4444' : '1px solid var(--gym-card-border, #e2e8f0)',
                    borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                        Hourly Rate (Birr)
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={registerForm.hourly_rate}
                          onChange={(e) => {
                            setRegisterForm({ ...registerForm, hourly_rate: e.target.value });
                            if (formErrors.hourly_rate) setFormErrors((prev) => ({ ...prev, hourly_rate: null }));
                          }}
                          className="trainer-modal-input"
                          style={{
                            width: 80,
                            height: 28,
                            padding: '0 6px',
                            fontWeight: 700,
                            textAlign: 'right',
                            borderColor: formErrors.hourly_rate ? '#ef4444' : undefined,
                          }}
                          placeholder="350"
                        />
                        <strong style={{ fontSize: 10.5, color: 'var(--gym-text-secondary, #64748b)' }}>ETB</strong>
                      </div>
                    </div>

                    <div className="trainer-modal-fee-chips" style={{ margin: 0, gap: 4 }}>
                      {[250, 350, 500, 750].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setRegisterForm({ ...registerForm, hourly_rate: amt });
                            if (formErrors.hourly_rate) setFormErrors((prev) => ({ ...prev, hourly_rate: null }));
                          }}
                          className={`trainer-fee-chip-btn ${Number(registerForm.hourly_rate) === amt ? 'selected' : ''}`}
                          style={{ padding: '2px 6px', fontSize: 10.5 }}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <FieldError error={formErrors.hourly_rate} />
                  </div>
                </div>

                {/* Row 5: Certifications & Bio */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Certifications</label>
                    <input
                      type="text"
                      value={registerForm.certifications}
                      onChange={(e) => setRegisterForm({ ...registerForm, certifications: e.target.value })}
                      placeholder="e.g. ISSA Certified Trainer"
                      className="trainer-modal-input"
                    />
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Bio / Philosophy</label>
                    <input
                      type="text"
                      value={registerForm.bio}
                      onChange={(e) => setRegisterForm({ ...registerForm, bio: e.target.value })}
                      placeholder="e.g. Specializes in strength & hypertrophy"
                      className="trainer-modal-input"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => setIsRegisterOpen(false)}
                  style={{ height: 34, padding: '0 16px', fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-clean-add-member"
                  disabled={isSubmitting}
                  style={{ height: 34, padding: '0 18px', fontSize: 12.5 }}
                >
                  {isSubmitting ? 'Registering...' : '+ Save & Register Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT COACH PROFILE & FEE (NON-SCROLLABLE, TOP, BLURRED)           */}
      {/* ========================================================================= */}
      {isEditOpen && (
        <div className="trainer-modal-backdrop">
          <div className="trainer-modal-card" style={{ maxWidth: 620 }}>
            <div className="trainer-modal-header">
              <div className="trainer-modal-header-left">
                <div className="trainer-modal-icon-badge">
                  <Icons.Edit size={17} />
                </div>
                <div>
                  <h3 className="trainer-modal-title">Edit Coach Profile</h3>
                  <span className="trainer-modal-subtitle">
                    Update {editForm.name}&apos;s rate, shift, photo, or status.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setIsEditOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateTrainer} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="trainer-modal-body">
                {/* Validation Error Banner */}
                {Object.values(formErrors).some(Boolean) && (
                  <div style={{
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    color: '#ef4444',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}>
                    <Icons.AlertCircle size={15} color="#ef4444" />
                    <span>Please correct the highlighted validation errors below before saving.</span>
                  </div>
                )}

                {/* Photo Update */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                  padding: '9px 12px',
                  background: 'var(--gym-bg-subtle, #f8fafc)',
                  borderRadius: 10,
                  border: '1px solid var(--gym-card-border, #e2e8f0)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={editForm.avatar_preview || PRESET_COACH_AVATARS[0].url}
                      alt="Preview"
                      style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', border: '2px solid #ff8a00' }}
                    />
                    <div>
                      <label className="btn-clean-schedule" style={{ cursor: 'pointer', height: 26, fontSize: 11, padding: '0 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Icons.Camera size={12} />
                        <span>Change Photo File</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFileSelect(e, true)}
                        />
                      </label>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                        Or choose preset:
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {PRESET_COACH_AVATARS.map((p, idx) => (
                      <img
                        key={idx}
                        src={p.url}
                        alt={p.label}
                        title={p.label}
                        onClick={() => setEditForm((prev) => ({ ...prev, avatar: p.url, avatar_preview: p.url }))}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: editForm.avatar === p.url ? '2px solid #ff8a00' : '1px solid #cbd5e1',
                          opacity: editForm.avatar === p.url ? 1 : 0.6,
                          transition: 'all 0.12s ease',
                        }}
                      />
                    ))}
                    {editForm.avatar && (
                      <button
                        type="button"
                        onClick={handleQuickSaveCoachPhoto}
                        disabled={isSubmitting}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'rgba(255,138,0,0.1)',
                          border: '1px solid #ff8a00',
                          color: '#ea580c',
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Save Photo Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Coach Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => {
                        setEditForm({ ...editForm, name: e.target.value });
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                      }}
                      className="trainer-modal-input"
                      style={formErrors.name ? { borderColor: '#ef4444' } : {}}
                    />
                    <FieldError error={formErrors.name} />
                  </div>

                  <div className="trainer-form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="trainer-form-label">Phone Number</label>
                      <span style={{ fontSize: 10.5, color: '#64748b' }}>e.g. 0911223344 or +251911223344</span>
                    </div>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => {
                        setEditForm({ ...editForm, phone: e.target.value });
                        if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      className="trainer-modal-input"
                      style={formErrors.phone ? { borderColor: '#ef4444' } : {}}
                    />
                    <FieldError error={formErrors.phone} />
                  </div>
                </div>

                {/* Email & Status */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => {
                        setEditForm({ ...editForm, email: e.target.value });
                        if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                      }}
                      className="trainer-modal-input"
                      style={formErrors.email ? { borderColor: '#ef4444' } : {}}
                    />
                    <FieldError error={formErrors.email} />
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="trainer-modal-input"
                      style={{ fontWeight: 700, cursor: 'pointer' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Specialization & Work Shift Schedule */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Specialization *</label>
                    <select
                      value={editForm.specialization}
                      onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                      className="trainer-modal-input"
                      style={{ cursor: 'pointer' }}
                    >
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Work Shift Schedule *</label>
                    <select
                      value={editForm.shift}
                      onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                      className="trainer-modal-input"
                      style={{ cursor: 'pointer', fontWeight: 600 }}
                    >
                      <option value="morning">🌅 Morning Shift (6:00 AM – 2:00 PM)</option>
                      <option value="evening">🌆 Evening Shift (2:00 PM – 10:00 PM)</option>
                      <option value="full_day">☀️ Full Day Shift (Standard Operating Hours)</option>
                    </select>
                  </div>
                </div>

                {/* Monthly Coaching Fee & Hourly Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* Monthly Coaching Fee in Birr (ETB) */}
                  <div style={{
                    padding: '9px 12px',
                    background: 'rgba(255, 138, 0, 0.08)',
                    border: formErrors.monthly_fee ? '1px solid #ef4444' : '1px solid rgba(255, 138, 0, 0.25)',
                    borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#ea580c' }}>
                        Monthly Fee (Birr) *
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={editForm.monthly_fee}
                          onChange={(e) => {
                            setEditForm({ ...editForm, monthly_fee: e.target.value });
                            if (formErrors.monthly_fee) setFormErrors((prev) => ({ ...prev, monthly_fee: null }));
                          }}
                          className="trainer-modal-input"
                          style={{
                            width: 80,
                            height: 28,
                            padding: '0 6px',
                            fontWeight: 800,
                            textAlign: 'right',
                            borderColor: formErrors.monthly_fee ? '#ef4444' : undefined,
                          }}
                        />
                        <strong style={{ fontSize: 10.5, color: '#ea580c' }}>ETB</strong>
                      </div>
                    </div>

                    <div className="trainer-modal-fee-chips" style={{ margin: 0, gap: 4 }}>
                      {[1000, 1500, 2000, 2500, 3000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setEditForm({ ...editForm, monthly_fee: amt });
                            if (formErrors.monthly_fee) setFormErrors((prev) => ({ ...prev, monthly_fee: null }));
                          }}
                          className={`trainer-fee-chip-btn ${Number(editForm.monthly_fee) === amt ? 'selected' : ''}`}
                          style={{ padding: '2px 6px', fontSize: 10.5 }}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <FieldError error={formErrors.monthly_fee} />
                  </div>

                  {/* Hourly Session Rate in Birr (ETB) */}
                  <div style={{
                    padding: '9px 12px',
                    background: 'var(--gym-bg-subtle, #f8fafc)',
                    border: formErrors.hourly_rate ? '1px solid #ef4444' : '1px solid var(--gym-card-border, #e2e8f0)',
                    borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gym-text-primary, #0f172a)' }}>
                        Hourly Rate (Birr)
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={editForm.hourly_rate}
                          onChange={(e) => {
                            setEditForm({ ...editForm, hourly_rate: e.target.value });
                            if (formErrors.hourly_rate) setFormErrors((prev) => ({ ...prev, hourly_rate: null }));
                          }}
                          className="trainer-modal-input"
                          style={{
                            width: 80,
                            height: 28,
                            padding: '0 6px',
                            fontWeight: 700,
                            textAlign: 'right',
                            borderColor: formErrors.hourly_rate ? '#ef4444' : undefined,
                          }}
                          placeholder="350"
                        />
                        <strong style={{ fontSize: 10.5, color: 'var(--gym-text-secondary, #64748b)' }}>ETB</strong>
                      </div>
                    </div>

                    <div className="trainer-modal-fee-chips" style={{ margin: 0, gap: 4 }}>
                      {[250, 350, 500, 750].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setEditForm({ ...editForm, hourly_rate: amt });
                            if (formErrors.hourly_rate) setFormErrors((prev) => ({ ...prev, hourly_rate: null }));
                          }}
                          className={`trainer-fee-chip-btn ${Number(editForm.hourly_rate) === amt ? 'selected' : ''}`}
                          style={{ padding: '2px 6px', fontSize: 10.5 }}
                        >
                          {amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <FieldError error={formErrors.hourly_rate} />
                  </div>
                </div>

                {/* Certifications & Bio */}
                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Certifications</label>
                    <input
                      type="text"
                      value={editForm.certifications}
                      onChange={(e) => setEditForm({ ...editForm, certifications: e.target.value })}
                      className="trainer-modal-input"
                    />
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Bio / Philosophy</label>
                    <input
                      type="text"
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="trainer-modal-input"
                    />
                  </div>
                </div>
              </div>

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => setIsEditOpen(false)}
                  style={{ height: 34, padding: '0 16px', fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-clean-add-member"
                  disabled={isSubmitting}
                  style={{ height: 34, padding: '0 18px', fontSize: 12.5 }}
                >
                  {isSubmitting ? 'Saving...' : 'Update Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN MEMBER TO COACH (NON-SCROLLABLE, TOP, BLURRED)            */}
      {/* ========================================================================= */}
      {isAssignOpen && (
        <div className="trainer-modal-backdrop">
          <div className="trainer-modal-card" style={{ maxWidth: 560 }}>
            <div className="trainer-modal-header">
              <div className="trainer-modal-header-left">
                <div className="trainer-modal-icon-badge">
                  <Icons.UserPlus size={17} />
                </div>
                <div>
                  <h3 className="trainer-modal-title">Assign Member to Coach</h3>
                  <span className="trainer-modal-subtitle">
                    Link an athlete for 1-on-1 coaching & record trainer fee.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setIsAssignOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAssignMember} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="trainer-modal-body">
                {/* Select Trainer */}
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Select Coach *</label>
                  <select
                    required
                    value={assignForm.trainer_id}
                    onChange={(e) => setAssignForm({ ...assignForm, trainer_id: e.target.value })}
                    className="trainer-modal-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Choose Coach --</option>
                    {trainers.filter(t => t.status === 'active').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.profile?.specialization || 'Personal Trainer'}) — {Number(t.profile?.monthly_fee || 0).toLocaleString()} ETB/mo
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Member */}
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Select Gym Member *</label>
                  <select
                    required
                    value={assignForm.member_id}
                    onChange={(e) => setAssignForm({ ...assignForm, member_id: e.target.value })}
                    className="trainer-modal-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Choose Member --</option>
                    {members.map((m) => (
                      <option key={m.id || m.user_id} value={m.user_id || m.id}>
                        {m.name} ({m.member_code || `ID-${m.id}`}) — {m.phone || 'No phone'} {m.assigned_trainer ? `[Currently: Coach ${m.assigned_trainer.name}]` : '[Normal Gymer]'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Option */}
                <div style={{ padding: '10px 12px', background: 'var(--gym-bg-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                  <label className="trainer-form-label" style={{ display: 'block', marginBottom: 6 }}>
                    Coaching Duration
                  </label>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="duration_type"
                        checked={assignForm.duration_type === '30_days'}
                        onChange={() => setAssignForm({ ...assignForm, duration_type: '30_days' })}
                        style={{ accentColor: '#ff8a00' }}
                      />
                      <span>1 Month (30 Days - Default)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="duration_type"
                        checked={assignForm.duration_type === 'match_gym'}
                        onChange={() => setAssignForm({ ...assignForm, duration_type: 'match_gym' })}
                        style={{ accentColor: '#ff8a00' }}
                      />
                      <span>Match Gym Pass Expiry</span>
                    </label>
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ padding: '10px 12px', background: 'rgba(255, 138, 0, 0.08)', borderRadius: 10, border: '1px solid rgba(255, 138, 0, 0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#ea580c' }}>
                      Collect Trainer Fee Payment (Gym Revenue)
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#ea580c' }}>
                      {(() => {
                        const tr = trainers.find(t => String(t.id) === String(assignForm.trainer_id));
                        return tr ? `${Number(tr.profile?.monthly_fee || 0).toLocaleString()} ETB` : '';
                      })()}
                    </span>
                  </div>

                  <div className="trainer-form-row-2">
                    <select
                      value={assignForm.payment_method}
                      onChange={(e) => setAssignForm({ ...assignForm, payment_method: e.target.value })}
                      className="trainer-modal-input"
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="cash">💵 Cash at Desk</option>
                      <option value="chapa">💳 Chapa</option>
                      <option value="telebirr">📱 Telebirr</option>
                      <option value="cbe">🏦 CBE Birr</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Receipt / Ref (optional)"
                      value={assignForm.payment_reference}
                      onChange={(e) => setAssignForm({ ...assignForm, payment_reference: e.target.value })}
                      className="trainer-modal-input"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Coaching Notes</label>
                  <input
                    type="text"
                    value={assignForm.notes}
                    onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                    placeholder="Focus: Core strength and post-rehab stability"
                    className="trainer-modal-input"
                  />
                </div>
              </div>

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => setIsAssignOpen(false)}
                  style={{ height: 34, padding: '0 16px', fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-clean-add-member"
                  disabled={isSubmitting || !assignForm.trainer_id || !assignForm.member_id}
                  style={{ height: 34, padding: '0 18px', fontSize: 12.5 }}
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SWITCH / CHANGE MEMBER'S COACH (NON-SCROLLABLE, TOP, BLURRED)     */}
      {/* ========================================================================= */}
      {isChangeOpen && (
        <div className="trainer-modal-backdrop">
          <div className="trainer-modal-card" style={{ maxWidth: 560 }}>
            <div className="trainer-modal-header">
              <div className="trainer-modal-header-left">
                <div className="trainer-modal-icon-badge">
                  <Icons.Switch size={17} />
                </div>
                <div>
                  <h3 className="trainer-modal-title">Switch / Change Member&apos;s Coach</h3>
                  <span className="trainer-modal-subtitle">
                    Reassign an athlete to another coach with automatic day rollover.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setIsChangeOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSwitchTrainer} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="trainer-modal-body">
                {/* Select Member */}
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Select Athlete to Reassign *</label>
                  <select
                    required
                    value={changeForm.member_id}
                    onChange={(e) => setChangeForm({ ...changeForm, member_id: e.target.value })}
                    className="trainer-modal-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Choose Member --</option>
                    {membersWithCoach.map((m) => (
                      <option key={m.id || m.user_id} value={m.user_id || m.id}>
                        {m.name} ({m.member_code}) — Coach: {m.assigned_trainer?.name} ({m.assigned_trainer?.days_remaining ?? 0} days left)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show Current Coach Summary */}
                {(() => {
                  const selectedMember = members.find(m => String(m.user_id || m.id) === String(changeForm.member_id));
                  if (!selectedMember || !selectedMember.assigned_trainer) return null;
                  const cur = selectedMember.assigned_trainer;
                  return (
                    <div style={{ padding: '9px 12px', background: 'var(--gym-bg-subtle, #f8fafc)', border: '1px solid var(--gym-card-border, #e2e8f0)', borderRadius: 8, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>Current Coach: </span>
                      <strong style={{ color: 'var(--gym-text-main, #0f172a)' }}>{cur.name}</strong> ({cur.specialization}) •
                      <span style={{ color: '#ff8a00', fontWeight: 700 }}> {cur.days_remaining ?? 0} days remaining in coaching cycle</span>
                    </div>
                  );
                })()}

                {/* Select New Coach */}
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Select New Coach *</label>
                  <select
                    required
                    value={changeForm.new_trainer_id}
                    onChange={(e) => setChangeForm({ ...changeForm, new_trainer_id: e.target.value })}
                    className="trainer-modal-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Choose New Coach --</option>
                    {trainers.filter(t => t.status === 'active').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.profile?.specialization || 'Coach'}) — {Number(t.profile?.monthly_fee || 0).toLocaleString()} ETB/mo
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Transfer Reason / Note</label>
                  <input
                    type="text"
                    value={changeForm.reason}
                    onChange={(e) => setChangeForm({ ...changeForm, reason: e.target.value })}
                    placeholder="e.g. Schedule clash / Member requested different training style"
                    className="trainer-modal-input"
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, display: 'block' }}>
                    Note: Remaining days on the member&apos;s coaching month will transfer automatically with zero extra charge.
                  </span>
                </div>
              </div>

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => setIsChangeOpen(false)}
                  style={{ height: 34, padding: '0 16px', fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-clean-add-member"
                  disabled={isSubmitting || !changeForm.member_id || !changeForm.new_trainer_id}
                  style={{ height: 34, padding: '0 18px', fontSize: 12.5 }}
                >
                  {isSubmitting ? 'Transferring...' : 'Transfer to New Coach'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / MODAL 5: COACH'S ACTIVE CLIENTS ROSTER                           */}
      {/* ========================================================================= */}
      {isClientsDrawerOpen && selectedTrainer && (
        <div className="trainer-modal-backdrop">
          <div className="trainer-modal-card" style={{ maxWidth: 720 }}>
            <div className="trainer-modal-header">
              <div className="trainer-modal-header-left">
                <img
                  src={selectedTrainer.avatar || PRESET_COACH_AVATARS[0].url}
                  alt={selectedTrainer.name}
                  style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }}
                />
                <div>
                  <h3 className="trainer-modal-title">
                    {selectedTrainer.name}&apos;s Active Clients
                  </h3>
                  <span className="trainer-modal-subtitle">
                    {selectedTrainer.profile?.specialization} • {selectedTrainerClients.length} active athletes
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setIsClientsDrawerOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="trainer-modal-body" style={{ padding: '16px 20px' }}>
              {loadingClients ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>
                  <div className="spinner" style={{ margin: '0 auto 8px' }} />
                  <div>Loading athlete roster...</div>
                </div>
              ) : selectedTrainerClients.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#64748b', background: 'var(--gym-bg-subtle, #f8fafc)', borderRadius: 10 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>👥</div>
                  <strong style={{ display: 'block', marginBottom: 2 }}>No Active Members Assigned</strong>
                  <p style={{ fontSize: 12, margin: '0 0 10px' }}>This coach currently has no members assigned to them.</p>
                  <button
                    type="button"
                    className="btn-clean-add-member"
                    onClick={() => {
                      setIsClientsDrawerOpen(false);
                      setAssignForm((prev) => ({ ...prev, trainer_id: selectedTrainer.id }));
                      setIsAssignOpen(true);
                    }}
                  >
                    + Assign Member Now
                  </button>
                </div>
              ) : (
                <div className="roster-table-card">
                  <div className="table-responsive">
                    <table className="roster-table">
                      <thead>
                        <tr>
                          <th>Athlete / Member</th>
                          <th>Gym Pass</th>
                          <th>Coaching Period</th>
                          <th>Cycle Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrainerClients.map((c) => (
                          <tr key={c.assignment_id}>
                            <td>
                              <div className="roster-athlete-cell">
                                <div className="roster-athlete-avatar">
                                  {c.name?.charAt(0).toUpperCase() || 'M'}
                                </div>
                                <div className="roster-athlete-info">
                                  <span className="roster-athlete-name">{c.name}</span>
                                  <div className="roster-athlete-meta">
                                    <span className="roster-code-tag">{c.member_code}</span>
                                    {c.phone && <span>• {c.phone}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="roster-plan-pill">{c.plan_name}</span>
                            </td>
                            <td>
                              <span className="roster-cycle-date">{c.start_date} → {c.end_date}</span>
                            </td>
                            <td>
                              <span className={`roster-status-pill ${(c.days_remaining ?? 0) <= 5 ? 'status-danger' : 'status-active'}`}>
                                <span className="status-dot" />
                                <span>{c.days_remaining !== null ? `${c.days_remaining}d left` : 'Active'}</span>
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsClientsDrawerOpen(false);
                                  setChangeForm({
                                    member_id: c.member_id,
                                    new_trainer_id: '',
                                    reason: `Transferred from Coach ${selectedTrainer.name}`,
                                  });
                                  setIsChangeOpen(true);
                                }}
                                className="roster-btn-action"
                                title="Reassign to another coach"
                              >
                                <Icons.Switch size={11} />
                                <span>Switch</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="trainer-modal-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11.5, color: '#64748b' }}>
                All assignments are logged in the system audit log.
              </span>
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => setIsClientsDrawerOpen(false)}
                style={{ height: 34, padding: '0 16px', fontSize: 12.5 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: SCHEDULE 1-ON-1 PT SESSION                                       */}
      {/* ========================================================================= */}
      {isScheduleSessionOpen && (
        <div className="trainer-modal-backdrop">
          <div className="trainer-modal-card" style={{ maxWidth: 520 }}>
            <div className="trainer-modal-header">
              <div className="trainer-modal-header-left">
                <div className="trainer-modal-icon-badge">
                  <Icons.Calendar size={17} />
                </div>
                <div>
                  <h3 className="trainer-modal-title">Schedule 1-on-1 PT Session</h3>
                  <span className="trainer-modal-subtitle">
                    Book a dedicated personal training appointment.
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="trainer-modal-close-btn"
                onClick={() => setIsScheduleSessionOpen(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleScheduleSession} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="trainer-modal-body">
                <div className="trainer-form-group">
                  <label className="trainer-form-label">Select Coach *</label>
                  <select
                    required
                    value={sessionForm.trainer_id}
                    onChange={(e) => setSessionForm({ ...sessionForm, trainer_id: e.target.value })}
                    className="trainer-modal-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Choose Coach --</option>
                    {trainers.filter(t => t.status === 'active').map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.profile?.specialization || 'Coach'})</option>
                    ))}
                  </select>
                </div>

                <div className="trainer-form-group">
                  <label className="trainer-form-label">Select Member *</label>
                  <select
                    required
                    value={sessionForm.member_id}
                    onChange={(e) => setSessionForm({ ...sessionForm, member_id: e.target.value })}
                    className="trainer-modal-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Choose Member --</option>
                    {members.map((m) => (
                      <option key={m.id || m.user_id} value={m.user_id || m.id}>
                        {m.name} ({m.member_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="trainer-form-row-2">
                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Session Start *</label>
                    <input
                      type="datetime-local"
                      required
                      value={sessionForm.scheduled_start}
                      onChange={(e) => setSessionForm({ ...sessionForm, scheduled_start: e.target.value })}
                      className="trainer-modal-input"
                    />
                  </div>

                  <div className="trainer-form-group">
                    <label className="trainer-form-label">Session End *</label>
                    <input
                      type="datetime-local"
                      required
                      value={sessionForm.scheduled_end}
                      onChange={(e) => setSessionForm({ ...sessionForm, scheduled_end: e.target.value })}
                      className="trainer-modal-input"
                    />
                  </div>
                </div>

                <div className="trainer-form-group">
                  <label className="trainer-form-label">Focus Area</label>
                  <input
                    type="text"
                    value={sessionForm.focus_area}
                    onChange={(e) => setSessionForm({ ...sessionForm, focus_area: e.target.value })}
                    placeholder="e.g. Squat & Deadlift Form Analysis"
                    className="trainer-modal-input"
                  />
                </div>
              </div>

              <div className="trainer-modal-footer">
                <button
                  type="button"
                  className="btn-clean-schedule"
                  onClick={() => setIsScheduleSessionOpen(false)}
                  style={{ height: 34, padding: '0 16px', fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-clean-add-member"
                  disabled={isSubmitting}
                  style={{ height: 34, padding: '0 18px', fontSize: 12.5 }}
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm PT Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
