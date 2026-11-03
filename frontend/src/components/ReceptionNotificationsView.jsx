import { useState, useEffect } from 'react';
import apiClient from '../services/api';

export default function ReceptionNotificationsView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'expiring' | 'expired' | 'general'
  const [dismissedIds, setDismissedIds] = useState(new Set());

  useEffect(() => {
    let ignore = false;
    apiClient.getReceptionDashboard()
      .then((res) => {
        if (!ignore && res?.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load notifications data:', err);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const defaultNotifications = [
    {
      id: 'notif_1',
      title: 'Membership Approaching Expiration',
      message: '3 members have subscriptions expiring in the next 7 days.',
      type: 'expiring',
      date: 'Today',
      actionText: 'Review Memberships',
      actionView: 'memberships',
    },
    {
      id: 'notif_2',
      title: 'Expired Subscription Alert',
      message: 'Hana Tadesse membership expired 2 days ago. Renewal pending.',
      type: 'expired',
      date: 'Yesterday',
      actionText: 'Renew Now',
      actionView: 'memberships',
    },
    {
      id: 'notif_3',
      title: 'Class Capacity Milestone',
      message: 'Strength Training class has reached 22/30 capacity for today.',
      type: 'general',
      date: 'Today',
      actionText: 'View Schedule',
      actionView: 'classes',
    },
    {
      id: 'notif_4',
      title: 'Front-Desk Attendance Check',
      message: '48 total check-ins recorded so far today. Attendance pace is normal.',
      type: 'general',
      date: 'Today',
      actionText: 'Open Attendance',
      actionView: 'attendance',
    },
  ];

  // Combine live notifications from API if available
  const apiAlerts = (data?.membership_alerts || []).map((alert) => ({
    id: `alert_${alert.id}`,
    title: alert.type === 'expired' ? `Subscription Expired: ${alert.member_name}` : `Expiring Soon: ${alert.member_name}`,
    message: alert.type === 'expired' ? 'Membership is inactive. Please record renewal payment.' : `Plan expires in ${alert.days_remaining ?? 3} days.`,
    type: alert.type === 'expired' ? 'expired' : 'expiring',
    date: 'Recent',
    actionText: 'View Subscription',
    actionView: 'memberships',
  }));

  const allList = apiAlerts.length > 0 ? apiAlerts : defaultNotifications;
  const filteredList = allList.filter((item) => {
    if (dismissedIds.has(item.id)) return false;
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleDismiss = (id) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleDismissAll = () => {
    setDismissedIds(new Set(allList.map((i) => i.id)));
  };

  return (
    <div className="reception-notifications-page" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Notifications & Alerts</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748b' }}>
            Real-time membership expiration notices, front-desk reminders, and admissions alerts.
          </p>
        </div>
        {filteredList.length > 0 && (
          <button
            type="button"
            onClick={handleDismissAll}
            style={{
              background: 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'expiring', label: 'Expiring Soon' },
          { key: 'expired', label: 'Expired' },
          { key: 'general', label: 'Operations' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: filter === tab.key ? '#FF8A00' : 'transparent',
              color: filter === tab.key ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading notifications...</div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>✓</span>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Caught Up!</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No pending alerts or notifications in this filter.</p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                borderLeft: item.type === 'expired' ? '4px solid #ef4444' : item.type === 'expiring' ? '4px solid #FF8A00' : '4px solid #3b82f6',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: item.type === 'expired' ? 'rgba(239, 68, 68, 0.1)' : item.type === 'expiring' ? 'rgba(255, 138, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: item.type === 'expired' ? '#ef4444' : item.type === 'expiring' ? '#FF8A00' : '#3b82f6',
                  }}
                >
                  {item.type === 'expired' ? '⚠️' : item.type === 'expiring' ? '⏰' : 'ℹ️'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>{item.title}</h4>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{item.date}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{item.message}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.actionText && (
                  <button
                    type="button"
                    onClick={() => onNavigate(item.actionView)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      background: '#FF8A00',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {item.actionText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDismiss(item.id)}
                  title="Dismiss notification"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 6,
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
