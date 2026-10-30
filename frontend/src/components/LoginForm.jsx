import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import BrandLogo from './BrandLogo';

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Demo accounts for quick testing
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
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage('');
  };

  return (
    <div className="login-card-container">
      <div className="login-card">
        <div className="login-header">
          <BrandLogo variant="login" />
          <h2 style={{ marginTop: 6, fontSize: 20 }}>Sign In</h2>
        </div>

        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            <span className="alert-icon">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              className="form-control"
              placeholder="e.g. staff@tigatgym.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="username"
            />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-wrapper">
                <span className="spinner"></span> Signing in...
              </span>
            ) : (
              'Sign In to GymCore'
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Autofill */}
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
      </div>
    </div>
  );
}
