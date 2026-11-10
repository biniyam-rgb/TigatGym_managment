import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';

// Crisp SVG Icons (Crisp White Dumbbell Emblem)
const DumbbellBadgeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 5v14M18 5v14M3 8v8M21 8v8M6 12h12" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CrownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M5 20h14" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const DumbbellIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
  </svg>
);

const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ZapIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const MailCheckIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#bfc3cc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('receptionist@tigatgym.com');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Guarantee black backdrop & pure white text on body during Login screen
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#ffffff';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  // Quick Demo fill accounts - Organized into 3 top (staff/gym) + 2 bottom (management)
  const demoAccounts = [
    { role: 'Member', email: 'member@tigatgym.com', pass: 'Password123!', icon: <UserIcon />, span: 'col-span-2' },
    { role: 'Trainer', email: 'trainer@tigatgym.com', pass: 'Password123!', icon: <DumbbellIcon />, span: 'col-span-2' },
    { role: 'Receptionist', email: 'receptionist@tigatgym.com', pass: 'Password123!', icon: <ClipboardIcon />, span: 'col-span-2' },
    { role: 'Admin', email: 'admin@tigatgym.com', pass: 'Password123!', icon: <ShieldIcon />, span: 'col-span-3' },
    { role: 'Owner', email: 'owner@tigatgym.com', pass: 'Password123!', icon: <CrownIcon />, span: 'col-span-3' },
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
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSent(true);
  };

  return (
    <div className="gymcore-split-page">
      {/* Background Gym Photography */}
      <div className="gymcore-split-bg-photo" aria-hidden="true" />

      {/* Left Brand Column */}
      <div className="gymcore-split-left">
        <div className="gymcore-split-left-glow" aria-hidden="true" />

        

        {/* Top-Left Brand Logo & Name */}
        <div className="gymcore-split-brand-header">
          <div className="gymcore-split-brand-badge">
            <DumbbellBadgeIcon />
          </div>
          <div className="gymcore-split-brand-text">
            <span className="brand-white">TIGAT</span>
            <span className="brand-orange">GYM</span>
          </div>
        </div>

        {/* Hero Motivational Headline & Description */}
        <div className="gymcore-split-hero">
          <div className="gymcore-split-accent-bar" />
          <div className="gymcore-split-headline" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', textShadow: '0 4px 24px #000000, 0 2px 8px #000000, 0 0 30px #000000' }}>
            STRONGER EVERY<br />
            DAY.<br />
            BETTER EVERY<br />
            SESSION.
          </div>
          <p className="gymcore-split-description" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
            Welcome to TIGAT GYM. Your fitness journey, membership, and training experience are powered by GymCore.
          </p>
        </div>

        {/* Bottom spacer for balanced alignment */}
        <div style={{ height: 16 }} />
      </div>

      {/* Right Form Column */}
      <div className="gymcore-split-right">
        <div className="gymcore-split-card">
          {/* GymCore App Heading */}
          <div className="gymcore-split-app-header">
            <div className="gymcore-split-app-name"><span style={{ color: "#ffffff" }}>Gym</span><span style={{ color: "#ff7a00" }}>Core</span></div>
            <div className="gymcore-split-app-sub">TIGAT GYM Management</div>
          </div>

          <div className="gymcore-split-welcome" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', textShadow: '0 2px 12px rgba(0, 0, 0, 0.95)' }}>WELCOME BACK</div>
          <p className="gymcore-split-subtitle" style={{ color: '#cbd5e1', WebkitTextFillColor: '#cbd5e1' }}>Sign in to access your GymCore account.</p>

          {/* Error Message */}
          {errorMessage && (
            <div className="gymcore-split-error">
              <AlertCircleIcon />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="gymcore-split-form" autoComplete="off">
            {/* Email Address */}
            <div className="gymcore-field-group">
              <label htmlFor="gymcore-email" className="gymcore-field-label" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>
                Email address
              </label>
              <div className="gymcore-input-box">
                <span className="gymcore-input-icon">
                  <MailIcon />
                </span>
                <input
                  id="gymcore-email"
                  type="email"
                  name="tigat_auth_usr"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="gymcore-split-input"
                  style={{ color: "#ffffff", backgroundColor: "#0d0f14" }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="gymcore-field-group">
              <label htmlFor="gymcore-pwd" className="gymcore-field-label" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>
                Password
              </label>
              <div className="gymcore-input-box">
                <span className="gymcore-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="gymcore-pwd"
                  type={showPassword ? 'text' : 'password'}
                  name="tigat_auth_pwd"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="gymcore-split-input"
                  style={{ color: "#ffffff", backgroundColor: "#0d0f14" }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="gymcore-pass-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="gymcore-options-row">
              <label className="gymcore-remember-label" style={{ color: '#cbd5e1', WebkitTextFillColor: '#cbd5e1' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Solid Orange Sign In Button */}
            <button
              type="submit"
              className="gymcore-btn-submit"
              style={{ color: "#000000", backgroundColor: "#ff7a00", WebkitTextFillColor: "#000000" }}
              disabled={isLoading}
            >
              {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          {/* Quick Demo Role Dock */}
          <div className="gymcore-split-demo-dock">
            <div className="gymcore-demo-header">
              <span className="gymcore-demo-title">
                <ZapIcon />
                <span>Quick Demo Sign-In</span>
              </span>
            </div>
            <div className="gymcore-demo-grid">
              {demoAccounts.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    className={`gymcore-demo-btn ${acc.span} ${isSelected ? 'btn-active' : ''}`}
                    onClick={() => fillDemo(acc)}
                    title={`Autofill ${acc.role} credentials (${acc.email})`}
                  >
                    <span className="demo-btn-icon">{acc.icon}</span>
                    <span className="demo-btn-name">{acc.role}</span>
                  </button>
                );
              })}
            </div>
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
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                  <MailCheckIcon />
                </div>
                <h4 style={{ color: '#ffffff', marginBottom: 8 }}>Password Reset Requested</h4>
                <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>
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
                  <p style={{ color: '#ffff', fontSize: 13, marginBottom: 16 }}>
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
    </div>
  );
}
