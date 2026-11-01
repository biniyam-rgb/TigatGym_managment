import { useState } from 'react';
import { useAuth } from '../context/useAuth';

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [activePortal, setActivePortal] = useState('member'); // 'member' | 'staff'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isRegisterNoticeOpen, setIsRegisterNoticeOpen] = useState(false);

  // Demo accounts for instant one-click testing
  const demoAccounts = [
    { role: 'Owner', email: 'owner@tigatgym.com', pass: 'Password123!', icon: '👑' },
    { role: 'Admin', email: 'admin@tigatgym.com', pass: 'Password123!', icon: '🛡️' },
    { role: 'Receptionist', email: 'receptionist@tigatgym.com', pass: 'Password123!', icon: '📋' },
    { role: 'Trainer', email: 'trainer@tigatgym.com', pass: 'Password123!', icon: '🏋️' },
    { role: 'Member', email: 'member@tigatgym.com', pass: 'Password123!', icon: '👤' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage('');
    if (acc.role === 'Member') {
      setActivePortal('member');
    } else {
      setActivePortal('staff');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSent(true);
  };

  return (
    <div className="tigat-login-page">
      {/* Background Athlete Photograph */}
      <div className="tigat-login-bg-photo" aria-hidden="true"></div>
      <div className="tigat-login-vignette" aria-hidden="true"></div>

      {/* Dynamic Angular Red & Charcoal Geometric Slashes matching exact user image */}
      {/* Left Slashes */}
      <div className="tigat-slash-left-charcoal" aria-hidden="true"></div>
      <div className="tigat-slash-left-red" aria-hidden="true"></div>
      <div className="tigat-slash-left-accent-line" aria-hidden="true"></div>
      <div className="tigat-slash-left-bottom-red" aria-hidden="true"></div>

      {/* Right Slashes */}
      <div className="tigat-slash-right-charcoal" aria-hidden="true"></div>
      <div className="tigat-slash-right-red" aria-hidden="true"></div>
      <div className="tigat-slash-right-accent-line" aria-hidden="true"></div>

      {/* Main Center Login Card Column */}
      <div className="tigat-login-center-column">
        {/* Exact Tigat Gym Tiger Logo with Crossed Barbells from user image */}
        <div className="tigat-logo-wrapper">
          <img
            src="/tigat-tiger-logo.png"
            alt="TIGAT GYM"
            className="tigat-tiger-crest-img"
          />
        </div>

        {/* Title: PLEASE LOG IN */}
        <h1 className="tigat-login-title">PLEASE LOG IN</h1>

        {/* Error notification */}
        {errorMessage && (
          <div className="tigat-login-error">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Dual Tab Switcher: Member Login vs Admin / Staff Portal */}
        <div className="tigat-tabs-header">
          <button
            type="button"
            className={`tigat-tab-btn ${activePortal === 'member' ? 'active' : ''}`}
            onClick={() => {
              setActivePortal('member');
              setEmail('member@tigatgym.com');
              setPassword('Password123!');
            }}
          >
            Member Login
          </button>
          <button
            type="button"
            className={`tigat-tab-btn ${activePortal === 'staff' ? 'active' : ''}`}
            onClick={() => {
              setActivePortal('staff');
              setEmail('admin@tigatgym.com');
              setPassword('Password123!');
            }}
          >
            Admin / Staff Portal
          </button>
        </div>

        {/* Translucent Glassmorphism Form Card */}
        <form onSubmit={handleSubmit} className="tigat-form-card">
          {/* Email Address Underline Field */}
          <div className="tigat-input-group">
            <label htmlFor="tigat-email" className="tigat-input-label">
              Email Address
            </label>
            <input
              id="tigat-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tigat-underline-input"
            />
          </div>

          {/* Password Underline Field */}
          <div className="tigat-input-group">
            <label htmlFor="tigat-password" className="tigat-input-label">
              Password
            </label>
            <input
              id="tigat-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="tigat-underline-input"
            />
            {/* Forgot your password? Link right-aligned */}
            <div className="tigat-forgot-wrap">
              <button
                type="button"
                className="tigat-forgot-btn"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSent(false);
                  setIsForgotModalOpen(true);
                }}
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* Solid White Rectangular LOGIN Button */}
          <button
            type="submit"
            className="tigat-login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          {/* Don't have an account? Link */}
          <div className="tigat-no-account-wrap">
            <button
              type="button"
              className="tigat-no-account-btn"
              onClick={() => setIsRegisterNoticeOpen(true)}
            >
              Don&apos;t have an account?
            </button>
          </div>
        </form>

        {/* Discreet One-Click Role Switcher Pills for Testing */}
        <div className="tigat-demo-dock">
          <span className="tigat-demo-label">Quick Demo Fill:</span>
          <div className="tigat-demo-pills">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="tigat-demo-pill"
                onClick={() => fillDemo(acc)}
                title={`${acc.role} (${acc.email})`}
              >
                <span>{acc.icon}</span>
                <span>{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Reset Your Password</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsForgotModalOpen(false)}
              >
                ×
              </button>
            </div>
            {forgotSent ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
                <h4 style={{ color: '#0f172a', marginBottom: 8 }}>Password Reset Requested</h4>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
                  A reset link has been dispatched to <strong>{forgotEmail}</strong> if an active account exists.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 20 }}
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="modal-body">
                  <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                    Enter your registered email address to receive password reset instructions.
                  </p>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. member@tigatgym.com"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reception Desk Policy Notice Modal */}
      {isRegisterNoticeOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Tigat Gym Membership Policy</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsRegisterNoticeOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>🏛️</div>
                <div>
                  <h4 style={{ color: '#0f172a', margin: '0 0 6px 0' }}>In-Person Desk Registration Only</h4>
                  <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    To ensure secure biometric pass allocation and physical facility onboarding, all gym members are registered in-person at our reception desk.
                  </p>
                </div>
              </div>
              <div style={{ background: 'rgba(255, 122, 0, 0.08)', border: '1px solid rgba(255, 122, 0, 0.25)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 13, color: '#ea580c', fontWeight: 600, marginBottom: 4 }}>
                  📍 Bole Medhanialem Branch, Addis Ababa
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  Reception staff will register your account and issue your official <strong>TG-XXXX Member ID</strong> and <strong>Digital QR Pass</strong> immediately.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => setIsRegisterNoticeOpen(false)}
              >
                Understood, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
