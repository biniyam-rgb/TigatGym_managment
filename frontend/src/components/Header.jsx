import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

// Crisp, lightweight SVG Icons (15px)
const RefreshIcon = ({ isSpinning }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isSpinning ? 'header-svg-spin' : ''}
    style={{ flexShrink: 0 }}
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
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
);

const MoonIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.1"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function Header({ title, subtitle, onRefresh, theme = 'light', onToggleTheme }) {
  const { user, primaryRole } = useAuth();
  const [apiStatus, setApiStatus] = useState({
    state: 'loading',
    data: null,
    lastChecked: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkConnection = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await apiClient.checkStatus();
      setApiStatus({
        state: 'online',
        data,
        lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch {
      setApiStatus({
        state: 'offline',
        data: null,
        lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient.checkStatus()
      .then((data) => {
        if (!ignore) {
          setApiStatus({
            state: 'online',
            data,
            lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setApiStatus({
            state: 'offline',
            data: null,
            lastChecked: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleManualRefresh = () => {
    checkConnection();
    if (onRefresh) onRefresh();
  };

  const roleName = primaryRole ? primaryRole.toUpperCase() : 'STAFF';
  const displayName = user?.name || 'Staff Member';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="gymcore-header">
      {/* Title & View Context */}
      <div className="header-title-block">
        <h2 className="view-title">{title}</h2>
        {subtitle && <p className="view-subtitle">{subtitle}</p>}
      </div>

      {/* Right Controls Bar */}
      <div className="header-right-tools">
        {/* Prominent Tigat Gym Brand Emblem Badge (Single Gym - No Branch) */}
        <div className="header-brand-badge" title="TIGAT GYM • Official Fitness Management">
          <div className="header-brand-crest-box">
            <img
              src="/tigat-tiger-logo.png"
              alt="TIGAT GYM"
              className="header-brand-crest-img"
            />
          </div>
          <div className="header-brand-text-col">
            <span className="header-brand-title">TIGAT GYM</span>
            <span className="header-brand-subtag">FITNESS CENTER</span>
          </div>
        </div>

        {/* Live system status */}
        <div
          className={`header-status-pill ${apiStatus.state}`}
          title={`System status: ${apiStatus.state} • Last ping: ${apiStatus.lastChecked || 'just now'}`}
        >
          <span className="header-status-dot"></span>
          <span className="header-status-text">
            {apiStatus.state === 'loading' && 'Syncing'}
            {apiStatus.state === 'online' && 'Live'}
            {apiStatus.state === 'offline' && 'Offline'}
          </span>
        </div>

        <div className="header-divider" aria-hidden="true" />

        {/* Compact Icon Refresh Button */}
        <button
          type="button"
          className="header-tool-btn"
          onClick={handleManualRefresh}
          title="Refresh data & ping server"
          aria-label="Refresh data"
        >
          <RefreshIcon isSpinning={isRefreshing || apiStatus.state === 'loading'} />
        </button>

        {/* Compact Icon Theme Toggle Button */}
        {onToggleTheme && (
          <button
            type="button"
            className="header-tool-btn"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        )}

        <div className="header-divider" aria-hidden="true" />

        {/* Executive Staff Profile Chip */}
        <div className="header-staff-chip" title={`${displayName} (${roleName})`}>
          <div className="header-staff-avatar">{initial}</div>
          <div className="header-staff-meta">
            <span className="header-staff-name">{displayName}</span>
            <span className="header-staff-role">{roleName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
