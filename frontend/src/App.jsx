import { useState, useEffect, useCallback } from 'react'
import apiClient from './services/api'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import LoginForm from './components/LoginForm'
import RoleDashboard from './components/RoleDashboard'
import ChangePasswordModal from './components/ChangePasswordModal'
import './App.css'

function GymCoreApp() {
  const { user, isAuthenticated, isLoading, logout, primaryRole } = useAuth()
  const [activeView, setActiveView] = useState('workspace') // 'workspace' or 'architecture'
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState({
    state: 'loading',
    data: null,
    error: null,
    lastChecked: null,
  })

  const performCheck = useCallback(async () => {
    try {
      const data = await apiClient.checkStatus()
      setApiStatus({
        state: 'online',
        data,
        error: null,
        lastChecked: new Date().toLocaleTimeString(),
      })
    } catch (err) {
      setApiStatus({
        state: 'offline',
        data: null,
        error: err.message || 'Could not connect to API server',
        lastChecked: new Date().toLocaleTimeString(),
      })
    }
  }, [])

  const handleManualPing = () => {
    setApiStatus((prev) => ({ ...prev, state: 'loading' }))
    performCheck()
  }

  useEffect(() => {
    let ignore = false
    apiClient.checkStatus()
      .then((data) => {
        if (!ignore) {
          setApiStatus({
            state: 'online',
            data,
            error: null,
            lastChecked: new Date().toLocaleTimeString(),
          })
        }
      })
      .catch((err) => {
        if (!ignore) {
          setApiStatus({
            state: 'offline',
            data: null,
            error: err.message || 'Could not connect to API server',
            lastChecked: new Date().toLocaleTimeString(),
          })
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const modules = [
    { title: 'Identity & Access (RBAC)', count: '3 Tables', desc: 'users, roles, role_user (5 system roles live)', icon: '🛡️' },
    { title: 'Profiles & Staff', count: '3 Tables', desc: 'member_profiles, trainer_profiles, assignments', icon: '👤' },
    { title: 'Membership & Plans', count: '2 Tables', desc: 'membership_plans, subscriptions (lifecycle ready)', icon: '💳' },
    { title: 'Finances & Chapa', count: '3 Tables', desc: 'payments, payment_transactions, expenses (ETB)', icon: '📊' },
    { title: 'QR Attendance', count: '1 Table', desc: 'attendance_records (tamper-proof QR & check-in)', icon: '⏱️' },
    { title: 'Workouts & Exercises', count: '6 Tables', desc: 'exercises, workout_plans, logs, 1-on-1 PT sessions', icon: '🏋️‍♂️' },
    { title: 'Classes & Bookings', count: '2 Tables', desc: 'fitness_classes, class_bookings (anti-duplicate)', icon: '📅' },
    { title: 'Inventory & Auditing', count: '3 Tables', desc: 'equipment, notifications, audit_logs', icon: '⚙️' },
  ]

  if (isLoading) {
    return (
      <div className="gymcore-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-icon" style={{ margin: '0 auto 16px auto' }}>TG</div>
          <h3>Initializing GymCore Security Session...</h3>
          <span className="spinner" style={{ width: 24, height: 24, marginTop: 12 }}></span>
        </div>
      </div>
    )
  }

  return (
    <div className="gymcore-container">
      {/* Top Banner & User Profile */}
      <header className="header-glass">
        <div className="brand-group">
          <div className="brand-icon">TG</div>
          <div>
            <h1 className="brand-title">GymCore</h1>
            <span className="brand-subtitle">TIGAT GYM • Enterprise Management System</span>
          </div>
        </div>

        <div className="header-actions">
          <div className={`status-pill ${apiStatus.state}`}>
            <span className="status-dot"></span>
            {apiStatus.state === 'loading' && 'Testing Connection...'}
            {apiStatus.state === 'online' && `Backend Online (${apiStatus.data?.brand || 'Connected'})`}
            {apiStatus.state === 'offline' && 'Backend Offline'}
          </div>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="user-profile-header-pill">
                <div className="header-user-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="header-user-details">
                  <span className="header-user-name">{user?.name}</span>
                  <span className="header-user-role">{primaryRole}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsPasswordModalOpen(true)}
                title="Change Password"
              >
                🔑 Password
              </button>

              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={logout}
                title="Sign out of GymCore"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <span className="badge">Guest Mode (Sign In Required)</span>
          )}

          <button className="btn-ping" onClick={handleManualPing} title="Refresh connection test">
            ↻
          </button>
        </div>
      </header>

      {/* Navigation Bar when authenticated */}
      {isAuthenticated && (
        <nav style={{ display: 'flex', gap: 10, margin: '8px 0' }}>
          <button
            type="button"
            className={`tab-btn ${activeView === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveView('workspace')}
          >
            🏢 {primaryRole.toUpperCase()} Workspace
          </button>
          <button
            type="button"
            className={`tab-btn ${activeView === 'architecture' ? 'active' : ''}`}
            onClick={() => setActiveView('architecture')}
          >
            📐 System Architecture & Modules
          </button>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {!isAuthenticated ? (
          <div>
            <LoginForm />

            {/* Architecture Overview for Guests */}
            <section className="modules-section" style={{ marginTop: 32 }}>
              <div className="section-header">
                <h3>Version 1 Architectural Schema Matrix</h3>
                <span className="badge">23 Application Tables + 8 Framework Tables</span>
              </div>
              <div className="modules-grid">
                {modules.map((m, idx) => (
                  <div key={idx} className="module-card">
                    <div className="module-card-header">
                      <span className="module-icon">{m.icon}</span>
                      <span className="module-count">{m.count}</span>
                    </div>
                    <h4>{m.title}</h4>
                    <p>{m.desc}</p>
                    <div className="module-footer">
                      <span className="tag-status">InnoDB • Migrated</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : activeView === 'workspace' ? (
          <RoleDashboard />
        ) : (
          <section className="modules-section">
            <div className="section-header">
              <h3>Version 1 Architectural Schema Matrix</h3>
              <span className="badge">23 Application Tables + 8 Framework Tables</span>
            </div>
            <div className="modules-grid">
              {modules.map((m, idx) => (
                <div key={idx} className="module-card">
                  <div className="module-card-header">
                    <span className="module-icon">{m.icon}</span>
                    <span className="module-count">{m.count}</span>
                  </div>
                  <h4>{m.title}</h4>
                  <p>{m.desc}</p>
                  <div className="module-footer">
                    <span className="tag-status">InnoDB • Migrated</span>
                  </div>
                </div>
              ))}
            </div>

            <section className="info-cards" style={{ marginTop: 24 }}>
              <div className="info-card v2-card">
                <h4>🏢 Single-Gym Scope & Future Version 2 Strategy</h4>
                <p>
                  Version 1 strictly manages single-location operations for TIGAT GYM without unnecessary multi-tenant complexity.
                  The schema uses strictly normalized integer foreign keys, enabling an isolated transition in Version 2
                  via a dedicated migration creating a <code>branches</code> table.
                </p>
              </div>
              <div className="info-card security-card">
                <h4>🔐 Sanctum API Security & Role-Based Authorization</h4>
                <p>
                  Protected by Laravel Sanctum personal access tokens, rate-limited login endpoints, generic invalid-credential responses,
                  inactive/suspended session invalidation, and owner-exclusive audit logging.
                </p>
              </div>
            </section>
          </section>
        )}
      </main>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <footer className="footer-glass">
        <span>GymCore v1.0.0 • Built for TIGAT GYM • Powered by Laravel 13 & React 19 + Vite</span>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <GymCoreApp />
    </AuthProvider>
  )
}
