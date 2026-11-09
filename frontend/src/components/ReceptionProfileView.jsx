import { useAuth } from '../context/useAuth';

const Icons = {
  User: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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
  CreditCard: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
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
};

export default function ReceptionProfileView({ onOpenPasswordModal, onNavigate }) {
  const { user, primaryRole, logout } = useAuth();

  const receptionistName = user?.name || 'Selamawit Kebede';
  const receptionistEmail = user?.email || 'reception@tigatgym.com';
  const initials = receptionistName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'SK';

  return (
    <div className="reception-profile-page">
      {/* Profile Overview Card */}
      <div className="reception-profile-overview-card">
        <div className="reception-profile-identity">
          <div className="reception-profile-avatar">
            {initials}
          </div>
          <div className="reception-profile-meta">
            <div className="reception-profile-title-row">
              <h2 className="reception-profile-name">{receptionistName}</h2>
              <span className="reception-profile-badge">
                <Icons.CheckCircle size={13} /> Active Receptionist
              </span>
            </div>
            <p className="reception-profile-email">{receptionistEmail}</p>
            <p className="reception-profile-role-desc">
              Tigat Gym Front-Desk Operations & Member Admissions
            </p>
          </div>
        </div>

        <div className="reception-profile-header-actions">
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

      {/* Account Details & Front-Desk Scope */}
      <div className="reception-profile-grid">
        <div className="reception-profile-card">
          <h3 className="reception-profile-card-title">Account Information</h3>
          <div className="reception-profile-info-list">
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">Assigned Facility</span>
              <strong className="reception-profile-info-val">TIGAT GYM</strong>
            </div>
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">System Role</span>
              <strong className="reception-profile-info-val role-capitalized">{primaryRole || 'Receptionist'}</strong>
            </div>
            <div className="reception-profile-info-row">
              <span className="reception-profile-info-label">Status</span>
              <strong className="reception-profile-info-val status-active-text">Active & Authorized</strong>
            </div>
          </div>
        </div>

        <div className="reception-profile-card">
          <h3 className="reception-profile-card-title">Front-Desk Quick Actions</h3>
          <div className="reception-profile-actions-list">
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
              onClick={() => onNavigate('payments', { openRecordPayment: true })}
              className="reception-profile-action-btn"
            >
              <div className="reception-action-left">
                <Icons.CreditCard size={16} />
                <span>Record Member Payment</span>
              </div>
              <Icons.ArrowRight size={14} className="reception-action-arrow" />
            </button>
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
            Remember to log out at the end of your reception shift to protect gym member privacy.
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
