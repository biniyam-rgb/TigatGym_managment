import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

export default function Header({ title, subtitle, onRefresh }) {
  const [apiStatus, setApiStatus] = useState({
    state: 'loading',
    data: null,
    lastChecked: null,
  });

  const checkConnection = useCallback(async () => {
    try {
      const data = await apiClient.checkStatus();
      setApiStatus({
        state: 'online',
        data,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } catch {
      setApiStatus({
        state: 'offline',
        data: null,
        lastChecked: new Date().toLocaleTimeString(),
      });
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
            lastChecked: new Date().toLocaleTimeString(),
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setApiStatus({
            state: 'offline',
            data: null,
            lastChecked: new Date().toLocaleTimeString(),
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleManualRefresh = () => {
    setApiStatus((prev) => ({ ...prev, state: 'loading' }));
    checkConnection();
    if (onRefresh) onRefresh();
  };

  return (
    <header className="gymcore-header">
      <div className="header-title-block">
        <h2 className="view-title">{title}</h2>
        {subtitle && <p className="view-subtitle">{subtitle}</p>}
      </div>

      <div className="header-right-tools">
        {/* Scope badge */}
        <span className="badge-scope">TIGAT GYM • Bole Branch</span>

        {/* Status pill */}
        <div className={`status-pill ${apiStatus.state}`}>
          <span className="status-dot"></span>
          {apiStatus.state === 'loading' && 'Syncing...'}
          {apiStatus.state === 'online' && 'System Live'}
          {apiStatus.state === 'offline' && 'Offline'}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          className="btn-header-refresh"
          onClick={handleManualRefresh}
          title="Refresh connection and data"
        >
          ↻ Refresh
        </button>
      </div>
    </header>
  );
}
