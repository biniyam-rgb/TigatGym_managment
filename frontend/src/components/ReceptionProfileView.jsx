import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/useAuth';

const Icons = {
  User: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Camera: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Key: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  ),
  Shield: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  QrCode: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
  UserPlus: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="11" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  Users: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  CreditCard: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" x2="10" />
    </svg>
  ),
  Award: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  ArrowRight: ({ size = 15, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  ),
  LogOut: ({ size = 15, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  CheckCircle: ({ size = 13, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Edit3: ({ size = 15, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Trash2: ({ size = 14, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Phone: ({ size = 14, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  Mail: ({ size = 14, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  Calendar: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  Dumbbell: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </svg>
  ),
};

export default function ReceptionProfileView({ onOpenPasswordModal, onNavigate }) {
  const { user, primaryRole, logout, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const isAdminOrOwner = primaryRole === 'admin' || primaryRole === 'owner';
  const isTrainer = primaryRole === 'trainer';
  const isMember = primaryRole === 'member';

  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    // Member fields
    date_of_birth: user?.member_profile?.date_of_birth || '',
    gender: user?.member_profile?.gender || 'male',
    blood_type: user?.member_profile?.blood_type || '',
    address: user?.member_profile?.address || '',
    emergency_contact_name: user?.member_profile?.emergency_contact_name || '',
    emergency_contact_phone: user?.member_profile?.emergency_contact_phone || '',
    emergency_contact_relationship: user?.member_profile?.emergency_contact_relationship || '',
    // Trainer fields
    specialization: user?.trainer_profile?.specialization || '',
    bio: user?.trainer_profile?.bio || '',
    certifications: user?.trainer_profile?.certifications || '',
  });

  // Keep state synced when user changes
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          date_of_birth: user.member_profile?.date_of_birth || '',
          gender: user.member_profile?.gender || 'male',
          blood_type: user.member_profile?.blood_type || '',
          address: user.member_profile?.address || '',
          emergency_contact_name: user.member_profile?.emergency_contact_name || '',
          emergency_contact_phone: user.member_profile?.emergency_contact_phone || '',
          emergency_contact_relationship: user.member_profile?.emergency_contact_relationship || '',
          specialization: user.trainer_profile?.specialization || '',
          bio: user.trainer_profile?.bio || '',
          certifications: user.trainer_profile?.certifications || '',
        });
        setPreviewAvatar(user.avatar || null);
      }, 0);
    }
  }, [user]);

  const profileName = user?.name || (isAdminOrOwner ? 'Abebe Admin' : 'Selamawit Kebede');
  const profileEmail = user?.email || (isAdminOrOwner ? 'admin@tigatgym.com' : 'reception@tigatgym.com');
  const profilePhone = user?.phone || 'Not recorded';
  const initials = profileName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || (isAdminOrOwner ? 'AA' : 'SK');

  const roleTitle = primaryRole === 'owner'
    ? 'Gym Owner'
    : primaryRole === 'admin'
    ? 'Administrator'
    : isTrainer
    ? 'Certified Trainer'
    : isMember
    ? 'Gym Member'
    : 'Receptionist';

  const roleBadgeText = primaryRole === 'owner'
    ? 'Active Owner'
    : primaryRole === 'admin'
    ? 'Active Administrator'
    : isTrainer
    ? 'Active Coach'
    : isMember
    ? 'Active Member'
    : 'Active Receptionist';

  const roleDescription = isAdminOrOwner
    ? 'Tigat Gym Executive Operations & System Administration'
    : isTrainer
    ? 'Tigat Gym Fitness Coaching & Member Training Programs'
    : isMember
    ? 'Tigat Gym Registered Facility Member'
    : 'Tigat Gym Front-Desk Operations & Member Admissions';

  const memberOrStaffId = user?.member_profile?.member_code
    || (isAdminOrOwner ? `#ADM-${String(user?.id || 1).padStart(3, '0')}`
    : isTrainer ? (user?.trainer_profile?.trainer_code || `#TRN-${String(user?.id || 1).padStart(3, '0')}`)
    : `#USR-${String(user?.id || 1).padStart(4, '0')}`);

  // Handle Photo Picker Selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormErrors({ avatar: 'Please select a valid image file (JPG, PNG, WEBP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormErrors({ avatar: 'Photo size must be under 5MB.' });
      return;
    }

    setSelectedFile(file);
    setIsRemovingAvatar(false);
    setFormErrors((prev) => ({ ...prev, avatar: null }));

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewAvatar(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewAvatar(null);
    setIsRemovingAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setIsRemovingAvatar(false);
    setPreviewAvatar(user?.avatar || null);
    setFormErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setStatusMessage(null);

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      if (formData.phone) payload.append('phone', formData.phone);
      else payload.append('phone', '');

      if (isRemovingAvatar) {
        payload.append('remove_avatar', '1');
      } else if (selectedFile) {
        payload.append('avatar', selectedFile);
      }

      // Append role specific fields
      if (isMember) {
        if (formData.date_of_birth) payload.append('date_of_birth', formData.date_of_birth);
        if (formData.gender) payload.append('gender', formData.gender);
        if (formData.blood_type) payload.append('blood_type', formData.blood_type);
        if (formData.address) payload.append('address', formData.address);
        if (formData.emergency_contact_name) payload.append('emergency_contact_name', formData.emergency_contact_name);
        if (formData.emergency_contact_phone) payload.append('emergency_contact_phone', formData.emergency_contact_phone);
        if (formData.emergency_contact_relationship) payload.append('emergency_contact_relationship', formData.emergency_contact_relationship);
      }

      if (isTrainer) {
        if (formData.specialization) payload.append('specialization', formData.specialization);
        if (formData.bio) payload.append('bio', formData.bio);
        if (formData.certifications) payload.append('certifications', formData.certifications);
      }

      const res = await updateProfile(payload);
      setStatusMessage({ type: 'success', text: res.message || 'Profile updated successfully!' });
      setIsEditing(false);
      setSelectedFile(null);
      setIsRemovingAvatar(false);
    } catch (err) {
      if (err.errors) {
        setFormErrors(err.errors);
      } else {
        setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reception-profile-page">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        style={{ display: 'none' }}
      />

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className={`profile-alert-banner ${statusMessage.type}`}>
          {statusMessage.type === 'success' ? (
            <Icons.CheckCircle size={18} />
          ) : (
            <Icons.Shield size={18} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Profile Overview Card with Photo Upload */}
      <div className="reception-profile-overview-card">
        <div className="reception-profile-identity">
          <div
            className="profile-avatar-wrapper"
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload profile photo"
          >
            {previewAvatar ? (
              <img
                src={previewAvatar}
                alt={profileName}
                className="profile-avatar-img"
              />
            ) : (
              <div className="reception-profile-avatar">
                {initials}
              </div>
            )}
            <div className="profile-avatar-upload-overlay" title="Upload new photo">
              <Icons.Camera size={14} />
            </div>
          </div>

          <div className="reception-profile-meta">
            <div className="reception-profile-title-row">
              <h2 className="reception-profile-name">{profileName}</h2>
              <span className="reception-profile-badge">
                {isAdminOrOwner ? <Icons.Shield size={13} /> : <Icons.CheckCircle size={13} />} {roleBadgeText}
              </span>
            </div>
            <p className="reception-profile-email">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icons.Mail size={13} /> {profileEmail}
              </span>
              {profilePhone !== 'Not recorded' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 14 }}>
                  <Icons.Phone size={13} /> {profilePhone}
                </span>
              )}
            </p>
            <p className="reception-profile-role-desc">
              {roleDescription}
            </p>

            {/* Avatar Quick Action Pill */}
            <div className="profile-avatar-actions">
              <button
                type="button"
                className="profile-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icons.Camera size={12} />
                <span>{previewAvatar ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
              {previewAvatar && (
                <button
                  type="button"
                  className="profile-photo-btn remove-btn"
                  onClick={handleRemovePhoto}
                  title="Remove current photo"
                >
                  <Icons.Trash2 size={12} />
                  <span>Remove</span>
                </button>
              )}
            </div>
            {formErrors.avatar && (
              <div className="profile-field-error" style={{ marginTop: 4 }}>
                {formErrors.avatar}
              </div>
            )}
          </div>
        </div>

        <div className="reception-profile-header-actions" style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`profile-edit-btn ${isEditing ? 'cancel-btn' : ''}`}
          >
            <Icons.Edit3 size={15} />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenPasswordModal}
            className="reception-profile-password-btn"
          >
            <Icons.Key size={15} />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Inline Edit Form when isEditing is true */}
      {isEditing && (
        <form onSubmit={handleProfileSubmit} className="reception-profile-card" style={{ border: '2px solid #ff7a00' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
            <div>
              <h3 className="reception-profile-card-title" style={{ fontSize: 16 }}>Edit Personal Profile</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                Update your identity, contact information, and role credentials.
              </p>
            </div>
            <button
              type="button"
              className="profile-photo-btn remove-btn"
              onClick={handleCancelEdit}
            >
              ✕ Close
            </button>
          </div>

          <div className="profile-form-grid" style={{ marginTop: 10 }}>
            <div className="profile-input-group">
              <label className="profile-input-label">
                <Icons.User size={13} /> Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className={`profile-input-field ${formErrors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="e.g. Abebe Bikila"
                required
              />
              {formErrors.name && (
                <span className="profile-field-error">{Array.isArray(formErrors.name) ? formErrors.name[0] : formErrors.name}</span>
              )}
            </div>

            <div className="profile-input-group">
              <label className="profile-input-label">
                <Icons.Mail size={13} /> Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                className={`profile-input-field ${formErrors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="name@tigatgym.com"
                required
              />
              {formErrors.email && (
                <span className="profile-field-error">{Array.isArray(formErrors.email) ? formErrors.email[0] : formErrors.email}</span>
              )}
            </div>

            <div className="profile-input-group">
              <label className="profile-input-label">
                <Icons.Phone size={13} /> Contact Phone Number
              </label>
              <input
                type="tel"
                className={`profile-input-field ${formErrors.phone ? 'error' : ''}`}
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="0911234567 or +251 911 234567"
              />
              {formErrors.phone && (
                <span className="profile-field-error">{Array.isArray(formErrors.phone) ? formErrors.phone[0] : formErrors.phone}</span>
              )}
            </div>

            {/* Member-specific edit fields */}
            {isMember && (
              <>
                <div className="profile-input-group">
                  <label className="profile-input-label">Date of Birth</label>
                  <input
                    type="date"
                    className="profile-input-field"
                    value={formData.date_of_birth}
                    onChange={(e) => handleFormChange('date_of_birth', e.target.value)}
                  />
                </div>

                <div className="profile-input-group">
                  <label className="profile-input-label">Gender</label>
                  <select
                    className="profile-input-field"
                    value={formData.gender}
                    onChange={(e) => handleFormChange('gender', e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="profile-input-group">
                  <label className="profile-input-label">Blood Type</label>
                  <input
                    type="text"
                    className="profile-input-field"
                    placeholder="e.g. A+, O+, B-"
                    value={formData.blood_type}
                    onChange={(e) => handleFormChange('blood_type', e.target.value)}
                  />
                </div>

                <div className="profile-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="profile-input-label">Residential Address</label>
                  <input
                    type="text"
                    className="profile-input-field"
                    placeholder="Bole, Addis Ababa"
                    value={formData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                  />
                </div>

                <div className="profile-input-group">
                  <label className="profile-input-label">Emergency Contact Name</label>
                  <input
                    type="text"
                    className="profile-input-field"
                    placeholder="e.g. Almaz Bekele"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleFormChange('emergency_contact_name', e.target.value)}
                  />
                </div>

                <div className="profile-input-group">
                  <label className="profile-input-label">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    className="profile-input-field"
                    placeholder="0911..."
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleFormChange('emergency_contact_phone', e.target.value)}
                  />
                </div>

                <div className="profile-input-group">
                  <label className="profile-input-label">Relationship</label>
                  <input
                    type="text"
                    className="profile-input-field"
                    placeholder="e.g. Spouse, Parent, Sibling"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleFormChange('emergency_contact_relationship', e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Trainer-specific edit fields */}
            {isTrainer && (
              <>
                <div className="profile-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="profile-input-label">Fitness Specialization</label>
                  <input
                    type="text"
                    className="profile-input-field"
                    placeholder="e.g. Bodybuilding, Strength & Conditioning, HIIT, Functional Training"
                    value={formData.specialization}
                    onChange={(e) => handleFormChange('specialization', e.target.value)}
                  />
                </div>

                <div className="profile-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="profile-input-label">Certifications & Credentials</label>
                  <input
                    type="text"
                    className="profile-input-field"
                    placeholder="e.g. ACE Certified Personal Trainer, CPR/AED Certified"
                    value={formData.certifications}
                    onChange={(e) => handleFormChange('certifications', e.target.value)}
                  />
                </div>

                <div className="profile-input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="profile-input-label">Coach Bio / Background</label>
                  <textarea
                    rows={3}
                    className="profile-input-field"
                    placeholder="Share your coaching philosophy, background, and member training experience..."
                    value={formData.bio}
                    onChange={(e) => handleFormChange('bio', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className="profile-edit-btn cancel-btn"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="reception-profile-password-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Icons.CheckCircle size={15} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Account Details & Role Scope */}
      <div className="reception-profile-grid">
        <div className="reception-profile-card">
          <h3 className="reception-profile-card-title">Account Information</h3>
          <div className="reception-profile-info-list">
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">Assigned Facility</span>
              <strong className="reception-profile-info-val">TIGAT GYM — Bole Road, Addis Ababa</strong>
            </div>
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">System Role</span>
              <strong className="reception-profile-info-val role-capitalized">{roleTitle}</strong>
            </div>
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">Account Code</span>
              <strong className="reception-profile-info-val" style={{ fontFamily: 'monospace', fontWeight: 800, color: '#ff7a00' }}>
                {memberOrStaffId}
              </strong>
            </div>
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">Contact Phone</span>
              <strong className="reception-profile-info-val">{profilePhone}</strong>
            </div>
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">Status</span>
              <strong className="reception-profile-info-val status-active-text">Active &amp; Authorized</strong>
            </div>
          </div>
        </div>

        {/* Role Quick Actions */}
        <div className="reception-profile-card">
          <h3 className="reception-profile-card-title">
            {isAdminOrOwner
              ? 'Executive Quick Actions'
              : isTrainer
              ? 'Coaching Quick Actions'
              : isMember
              ? 'Member Quick Actions'
              : 'Front-Desk Quick Actions'}
          </h3>
          <div className="reception-profile-actions-list">
            {isAdminOrOwner && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('users')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Users size={16} />
                    <span>Staff Accounts &amp; Permissions</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('memberships')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Award size={16} />
                    <span>Membership Packages &amp; Pricing</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('payments')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.CreditCard size={16} />
                    <span>Payment Ledger &amp; Revenue</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('trainers')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.UserPlus size={16} />
                    <span>Coach &amp; Trainer Management</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
              </>
            )}

            {primaryRole === 'receptionist' && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('attendance')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.QrCode size={16} />
                    <span>Scan QR / Record Attendance</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('members', { openRegister: true })}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.UserPlus size={16} />
                    <span>Register New Member</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('payments')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.CreditCard size={16} />
                    <span>View Payment Ledger</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
              </>
            )}

            {isTrainer && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('classes')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Calendar size={16} />
                    <span>Fitness Classes &amp; Schedules</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('workouts')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Dumbbell size={16} />
                    <span>Workout Plans &amp; Exercises</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('members')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Users size={16} />
                    <span>Assigned Trainees</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
              </>
            )}

            {isMember && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('memberships')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Award size={16} />
                    <span>My Membership Pass &amp; Status</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('classes')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Calendar size={16} />
                    <span>Upcoming Fitness Classes</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('workouts')}
                  className="reception-profile-action-btn"
                >
                  <div className="reception-action-left">
                    <Icons.Dumbbell size={16} />
                    <span>Workout Log &amp; Plans</span>
                  </div>
                  <Icons.ArrowRight size={14} className="reception-action-arrow" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Security & Logout Banner */}
      <div className="reception-profile-security-card">
        <div className="reception-security-text">
          <div className="reception-security-title-row">
            <Icons.Shield size={16} />
            <h4 className="reception-security-title">Session Security</h4>
          </div>
          <p className="reception-security-desc">
            {isAdminOrOwner
              ? 'Remember to log out at the end of your administrative session to protect gym operational data.'
              : isTrainer
              ? 'Remember to log out at the end of your training sessions to protect athlete records.'
              : isMember
              ? 'Keep your login credentials secure. Never share your turnstile pass or account access.'
              : 'Remember to log out at the end of your reception shift to protect gym member privacy.'}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="reception-profile-logout-btn"
        >
          <Icons.LogOut size={15} />
          <span>Logout of GymCore</span>
        </button>
      </div>
    </div>
  );
}
