import { useState } from 'react';
import { useAuth } from '../context/useAuth';

// Crisp SVG Icons (Replacing all emojis)
const AlertCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M5 20h14" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const DumbbellIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailCheckIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Quick Demo fill accounts with SVG icons — Member listed first
  const demoAccounts = [
    { role: 'Member', email: 'member@tigatgym.com', pass: 'Password123!', icon: <UserIcon /> },
    { role: 'Trainer', email: 'trainer@tigatgym.com', pass: 'Password123!', icon: <DumbbellIcon /> },
    { role: 'Admin', email: 'admin@tigatgym.com', pass: 'Password123!', icon: <ShieldIcon /> },
    { role: 'Owner', email: 'owner@tigatgym.com', pass: 'Password123!', icon: <CrownIcon /> },
    { role: 'Receptionist', email: 'receptionist@tigatgym.com', pass: 'Password123!', icon: <ClipboardIcon /> },
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
    <div className="tigat-login-page">
      {/* Background Athlete Photograph */}
      <div className="tigat-login-bg-photo" aria-hidden="true"></div>
      <div className="tigat-login-vignette" aria-hidden="true"></div>

      {/* Dynamic Angular Red & Charcoal Geometric Slashes */}
      <div className="tigat-slash-left-charcoal" aria-hidden="true"></div>
      <div className="tigat-slash-left-red" aria-hidden="true"></div>
      <div className="tigat-slash-left-accent-line" aria-hidden="true"></div>
      <div className="tigat-slash-left-bottom-red" aria-hidden="true"></div>

      <div className="tigat-slash-right-charcoal" aria-hidden="true"></div>
      <div className="tigat-slash-right-red" aria-hidden="true"></div>
      <div className="tigat-slash-right-accent-line" aria-hidden="true"></div>

      {/* Main Single Full-Screen Center Column */}
      <div className="tigat-login-center-column">
        {/* Tigat Gym Tiger Logo with Glowing Aura */}
        <div className="tigat-logo-wrapper">
          <div className="tigat-logo-glow-aura" aria-hidden="true"></div>
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
            <AlertCircleIcon />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Unified Glassmorphism Form Card with Smooth Curved Borders */}
        <form onSubmit={handleSubmit} className="tigat-form-card" autoComplete="off">
          <div className="tigat-inputs-container">
            {/* Email Address Underline Field */}
            <div className={`tigat-floating-field ${email ? 'has-value' : ''}`}>
              <input
                id="tigat-login-usr"
                type="text"
                name="tigat_auth_usr"
                required
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                data-lpignore="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="tigat-floating-input"
                placeholder=" "
              />
              <label htmlFor="tigat-login-usr" className="tigat-floating-label">
                Email Address
              </label>
            </div>

            {/* Password Underline Field */}
            <div className={`tigat-floating-field ${password ? 'has-value' : ''}`}>
              <input
                id="tigat-login-pwd"
                type={showPassword ? 'text' : 'password'}
                name="tigat_auth_pwd"
                required
                autoComplete="new-password"
                data-lpignore="true"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tigat-floating-input tigat-password-input"
                placeholder=" "
              />
              <label htmlFor="tigat-login-pwd" className="tigat-floating-label">
                Password
              </label>
              <button
                type="button"
                className="tigat-pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Forgot your password? Link */}
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
        </form>

        {/* Prominently Visible Quick Demo Sign-In Dock */}
        <div className="tigat-demo-dock">
          <span className="tigat-demo-label">Quick Demo Sign-In:</span>
          <div className="tigat-demo-pills">
            {demoAccounts.map((acc) => {
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  className={`tigat-demo-pill ${isSelected ? 'pill-active' : ''}`}
                  onClick={() => fillDemo(acc)}
                  title={`Click to autofill ${acc.role} credentials (${acc.email})`}
                >
                  <span className="demo-pill-icon">{acc.icon}</span>
                  <span className="demo-pill-name">{acc.role}</span>
                </button>
              );
            })}
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
    </div>
  );
}
