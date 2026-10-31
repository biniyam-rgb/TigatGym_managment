import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import BrandLogo from './BrandLogo';

export default function LoginForm({ onSuccess }) {
  const { login, register } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    gender: 'male',
    date_of_birth: '',
    fitness_goals: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Demo accounts for quick testing
  const demoAccounts = [
    { role: 'Owner', email: 'owner@tigatgym.com', pass: 'Password123!', icon: '👑' },
    { role: 'Admin', email: 'admin@tigatgym.com', pass: 'Password123!', icon: '🛡️' },
    { role: 'Receptionist', email: 'receptionist@tigatgym.com', pass: 'Password123!', icon: '📋' },
    { role: 'Trainer', email: 'trainer@tigatgym.com', pass: 'Password123!', icon: '🏋️' },
    { role: 'Member', email: 'member@tigatgym.com', pass: 'Password123!', icon: '👤' },
  ];

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      } else {
        setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    if (regData.password !== regData.password_confirmation) {
      setFieldErrors({ password_confirmation: ['Password confirmation does not match.'] });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        password_confirmation: regData.password_confirmation,
        gender: regData.gender || undefined,
        date_of_birth: regData.date_of_birth || undefined,
        fitness_goals: regData.fitness_goals || undefined,
      };

      await register(payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      } else {
        setErrorMessage(err.message || 'Registration failed. Please review your details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setAuthMode('login');
    setLoginEmail(acc.email);
    setLoginPassword(acc.pass);
    setErrorMessage('');
    setFieldErrors({});
  };

  return (
    <div className="login-card-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-header">
          <BrandLogo variant="login" />
          <h2 style={{ marginTop: 6, fontSize: 20 }}>
            {authMode === 'login' ? 'GymCore Sign In' : 'Create Member Account'}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 2 }}>
            {authMode === 'login'
              ? 'Enter your credentials to access TIGAT GYM'
              : 'Join TIGAT GYM and begin your fitness journey'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('login');
              setErrorMessage('');
              setFieldErrors({});
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('register');
              setErrorMessage('');
              setFieldErrors({});
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Register / Sign Up
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: Login Form */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                required
                className="form-control"
                placeholder="e.g. member@tigatgym.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
              {fieldErrors.email && (
                <span className="auth-field-error">{fieldErrors.email[0]}</span>
              )}
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="btn-toggle-pass"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="form-control"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {fieldErrors.password && (
                <span className="auth-field-error">{fieldErrors.password[0]}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isLoading}
              style={{ marginTop: 8 }}
            >
              {isLoading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span> Signing in...
                </span>
              ) : (
                'Sign In to GymCore'
              )}
            </button>

            <div className="auth-switch-link">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage('');
                  setFieldErrors({});
                }}
              >
                Sign Up as Member
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: Registration Form */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="login-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                required
                className="form-control"
                placeholder="e.g. Dawit Tsige"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                disabled={isLoading}
              />
              {fieldErrors.name && (
                <span className="auth-field-error">{fieldErrors.name[0]}</span>
              )}
            </div>

            {/* Email & Phone in 2 Columns */}
            <div className="auth-form-row-2">
              <div className="form-group">
                <label htmlFor="reg-email">Email Address *</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  className="form-control"
                  placeholder="name@example.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  disabled={isLoading}
                />
                {fieldErrors.email && (
                  <span className="auth-field-error">{fieldErrors.email[0]}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone">Phone Number *</label>
                <input
                  id="reg-phone"
                  type="text"
                  required
                  className="form-control"
                  placeholder="+251 91 123 4567"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  disabled={isLoading}
                />
                {fieldErrors.phone && (
                  <span className="auth-field-error">{fieldErrors.phone[0]}</span>
                )}
              </div>
            </div>

            {/* Gender & Date of Birth */}
            <div className="auth-form-row-2">
              <div className="form-group">
                <label htmlFor="reg-gender">Gender</label>
                <select
                  id="reg-gender"
                  className="form-control"
                  value={regData.gender}
                  onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                  disabled={isLoading}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reg-dob">Date of Birth</label>
                <input
                  id="reg-dob"
                  type="date"
                  className="form-control"
                  value={regData.date_of_birth}
                  onChange={(e) => setRegData({ ...regData, date_of_birth: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="auth-form-row-2">
              <div className="form-group">
                <label htmlFor="reg-password">Password (Min 8) *</label>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="form-control"
                  placeholder="••••••••"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  disabled={isLoading}
                />
                {fieldErrors.password && (
                  <span className="auth-field-error">{fieldErrors.password[0]}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm">Confirm Password *</label>
                <input
                  id="reg-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="form-control"
                  placeholder="••••••••"
                  value={regData.password_confirmation}
                  onChange={(e) => setRegData({ ...regData, password_confirmation: e.target.value })}
                  disabled={isLoading}
                />
                {fieldErrors.password_confirmation && (
                  <span className="auth-field-error">{fieldErrors.password_confirmation[0]}</span>
                )}
              </div>
            </div>

            {/* Fitness Goals (Optional) */}
            <div className="form-group">
              <label htmlFor="reg-goals">Fitness Goals (Optional)</label>
              <input
                id="reg-goals"
                type="text"
                className="form-control"
                placeholder="e.g. Muscle gain, cardio, weight loss"
                value={regData.fitness_goals}
                onChange={(e) => setRegData({ ...regData, fitness_goals: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isLoading}
              style={{ marginTop: 8 }}
            >
              {isLoading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span> Creating Account...
                </span>
              ) : (
                'Create Account & Join TIGAT GYM'
              )}
            </button>

            <div className="auth-switch-link">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setFieldErrors({});
                }}
              >
                Sign In to Your Account
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Credentials Autofill (Available in login mode) */}
        {authMode === 'login' && (
          <div className="demo-accounts-section">
            <span className="demo-header-label">Quick Sign-in (Verified Test Accounts):</span>
            <div className="demo-buttons-grid">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  className="btn-demo-pill"
                  onClick={() => fillDemo(acc)}
                  title={`Autofill as ${acc.role}`}
                >
                  <span className="demo-icon">{acc.icon}</span>
                  <span className="demo-role">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
