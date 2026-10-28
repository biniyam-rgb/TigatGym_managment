import { useState, useEffect } from 'react'
import apiClient from './services/api'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState({
    state: 'loading', // loading, online, offline
    data: null,
    error: null,
    lastChecked: null,
  })

  const checkConnection = async () => {
    setApiStatus((prev) => ({ ...prev, state: 'loading' }))
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
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const modules = [
    { title: 'Identity & Access (RBAC)', count: '3 Tables', desc: 'users, roles, role_user (5 system roles ready)', icon: '🛡️' },
    { title: 'Profiles & Staff', count: '3 Tables', desc: 'member_profiles, trainer_profiles, assignments', icon: '👤' },
    { title: 'Membership & Plans', count: '2 Tables', desc: 'membership_plans, subscriptions (lifecycle ready)', icon: '💳' },
    { title: 'Finances & Chapa', count: '3 Tables', desc: 'payments, payment_transactions, expenses (ETB)', icon: '📊' },
    { title: 'QR Attendance', count: '1 Table', desc: 'attendance_records (tamper-proof QR & check-in)', icon: '⏱️' },
    { title: 'Workouts & Exercises', count: '6 Tables', desc: 'exercises, workout_plans, logs, 1-on-1 PT sessions', icon: '🏋️‍♂️' },
    { title: 'Classes & Bookings', count: '2 Tables', desc: 'fitness_classes, class_bookings (anti-duplicate)', icon: '📅' },
    { title: 'Inventory & Auditing', count: '3 Tables', desc: 'equipment, notifications, audit_logs', icon: '⚙️' },
  ]

  return (
    <div className="gymcore-container">
      {/* Top Banner */}
      <header className="header-glass">
        <div className="brand-group">
          <div className="brand-icon">TG</div>
          <div>
            <h1 className="brand-title">GymCore</h1>
            <span className="brand-subtitle">TIGAT GYM • Enterprise Management System</span>
          </div>
        </div>
        <div className="header-actions">
          <span className="badge scope-badge">Version 1 — Single-Gym Mode</span>
          <div className={`status-pill ${apiStatus.state}`}>
            <span className="status-dot"></span>
            {apiStatus.state === 'loading' && 'Testing Connection...'}
            {apiStatus.state === 'online' && `Backend Online (${apiStatus.data?.brand || 'Connected'})`}
            {apiStatus.state === 'offline' && 'Backend Offline'}
          </div>
          <button className="btn-ping" onClick={checkConnection} title="Refresh connection test">
            ↻ Test API
          </button>
        </div>
      </header>

      {/* Hero Overview */}
      <main className="main-content">
        <section className="hero-banner">
          <div className="hero-text">
            <h2>Foundation & Database Architecture Ready</h2>
            <p>
              Environment and database foundation configured for <strong>TIGAT GYM</strong>.
              All 23 core domain tables, foreign key constraints, indexes, and Laravel Sanctum API security are initialized and verified.
            </p>
          </div>
          <div className="env-meta-card">
            <div className="meta-row">
              <span className="meta-label">Gym Brand:</span>
              <span className="meta-val">TIGAT GYM</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">API Base URL:</span>
              <code className="meta-val">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}</code>
            </div>
            <div className="meta-row">
              <span className="meta-label">MySQL Database:</span>
              <span className="meta-val highlight">TigatGym (32 Tables Ready)</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Auth Engine:</span>
              <span className="meta-val">Laravel Sanctum + RBAC</span>
            </div>
            {apiStatus.lastChecked && (
              <div className="meta-row timestamp-row">
                <span className="meta-label">Last Ping:</span>
                <span className="meta-val">{apiStatus.lastChecked}</span>
              </div>
            )}
          </div>
        </section>

        {/* Database Modules Grid */}
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
        </section>

        {/* Security & Multi-Branch Roadmap Notice */}
        <section className="info-cards">
          <div className="info-card v2-card">
            <h4>🏢 Future Version 2 Multi-Branch Migration Strategy</h4>
            <p>
              Version 1 strictly manages single-location operations for TIGAT GYM without unnecessary multi-tenant complexity.
              The database schema is cleanly normalized with integer foreign keys, enabling an isolated transition to multi-branch operations in Version 2
              via a dedicated migration creating a <code>branches</code> table and safely backfilling existing records with Branch #1.
            </p>
          </div>
          <div className="info-card security-card">
            <h4>🔐 Financial & Security Enforcement</h4>
            <p>
              Auditable financial ledger with decimal arithmetic, Ethiopian Birr (ETB) default currency, Chapa webhook idempotency protection,
              and strict server-side validation. Deletion rules protect financial records (<code>restrictOnDelete</code>).
            </p>
          </div>
        </section>
      </main>

      <footer className="footer-glass">
        <span>GymCore v1.0.0 • Built for TIGAT GYM • Powered by Laravel & React + Vite</span>
      </footer>
    </div>
  )
}

export default App
