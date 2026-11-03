import { useAuth } from '../context/useAuth';

export default function ReceptionProfileView({ onOpenPasswordModal, onNavigate }) {
  const { user, primaryRole, logout } = useAuth();

  const receptionistName = user?.name || 'Sara Ahmed';
  const receptionistEmail = user?.email || 'reception@tigatgym.com';
  const initials = receptionistName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase() || 'SA';

  return (
    <div className="reception-profile-page" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Overview Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid #e2e8f0',
          padding: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF8A00, #ea580c)',
              color: '#ffffff',
              fontSize: 26,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255, 138, 0, 0.35)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{receptionistName}</h2>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                ● Active Receptionist
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748b' }}>{receptionistEmail}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
              Tigat Gym Front-Desk Operations & Member Admissions
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onOpenPasswordModal}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: '#FF8A00',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 138, 0, 0.3)',
            }}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Account Details & Front-Desk Scope */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Account Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Assigned Facility</span>
              <strong style={{ color: '#0f172a' }}>TIGAT GYM</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
              <span style={{ color: '#64748b' }}>System Role</span>
              <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{primaryRole || 'Receptionist'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
              <span style={{ color: '#64748b' }}>Status</span>
              <strong style={{ color: '#059669' }}>Active & Authorized</strong>
            </div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Front-Desk Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Scan QR / Record Attendance</span>
              <span style={{ color: '#FF8A00' }}>→</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('members', { openRegister: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Register New Member</span>
              <span style={{ color: '#FF8A00' }}>→</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('payments', { openRecordPayment: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>Record Member Payment</span>
              <span style={{ color: '#FF8A00' }}>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Logout Banner */}
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Session Security</h4>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#b91c1c' }}>
            Remember to log out at the end of your reception shift to protect gym member privacy.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Logout of GymCore
        </button>
      </div>
    </div>
  );
}
