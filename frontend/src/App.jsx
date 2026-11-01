import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MemberDirectory from './components/MemberDirectory';
import RoleDashboard from './components/RoleDashboard';
import UserManagement from './components/UserManagement';
import AuditLogViewer from './components/AuditLogViewer';
import SubscriptionManagement from './components/SubscriptionManagement';
import PaymentLedger from './components/PaymentLedger';
import AttendanceScanner from './components/AttendanceScanner';
import TrainerManagement from './components/TrainerManagement';
import FitnessClassManagement from './components/FitnessClassManagement';
import WorkoutManagement from './components/WorkoutManagement';
import EquipmentManagement from './components/EquipmentManagement';
import ChangePasswordModal from './components/ChangePasswordModal';
import BrandLogo from './components/BrandLogo';
import './App.css';

function GymCoreApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // Default to Overview Dashboard matching Image 1
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // White theme as default, with persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gymcore_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = `theme-${theme}`;
    localStorage.setItem('gymcore_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (isLoading) {
    return (
      <div className="gymcore-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <BrandLogo variant="login" size={120} showSubtext={false} />
          </div>
          <h3 style={{ color: theme === 'light' ? '#0f172a' : '#fff' }}>Connecting to GymCore Security Engine...</h3>
          <span className="spinner" style={{ width: 28, height: 28, marginTop: 12 }}></span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm theme={theme} onToggleTheme={toggleTheme} />;
  }

  // Titles mapping based on active view
  const viewTitles = {
    dashboard: { title: 'Operational Analytics & Overview', subtitle: 'Real-time TIGAT GYM performance indicators' },
    members: { title: 'Member Directory & Profiles', subtitle: 'Module A — Membership records and digital QR pass generation' },
    memberships: { title: 'Membership Plans & Subscriptions', subtitle: 'Module C — Package duration, pricing in ETB, and lifecycle management' },
    payments: { title: 'Payments & Financial Ledger', subtitle: 'Module D — Cash, Bank Slip, POS & Chapa transactions (ETB)' },
    attendance: { title: 'QR Code Attendance & Reception', subtitle: 'Module E — Front-desk check-in, anti-passback and visit logs' },
    trainers: { title: 'Trainer Coaching & Rosters', subtitle: 'Module B — Staff specializations, rates, and 1-on-1 PT sessions' },
    workouts: { title: 'Workout Plans & Exercise Library', subtitle: 'Module F — Movements directory, routine templates, and member logs' },
    classes: { title: 'Fitness Classes & Reservations', subtitle: 'Module G — Class schedule, trainer assignment, and anti-duplicate booking' },
    equipment: { title: 'Equipment & Maintenance Records', subtitle: 'Module H — Inventory conditions, maintenance logs, and asset tracking' },
    expenses: { title: 'Operating Expenditures', subtitle: 'Module D — Rent, utilities, maintenance, and net operating income' },
    users: { title: 'User & Staff Identity Management', subtitle: 'Role-based access control, account status, and credentials' },
    audit: { title: 'System Security & Audit Trail', subtitle: 'Owner-exclusive immutable ledger and compliance history' },
  };

  const currentMeta = viewTitles[activeView] || { title: 'GymCore Management', subtitle: 'TIGAT GYM Management System' };

  return (
    <div className="gymcore-app-shell">
      {/* Fixed Left Sidebar matching reference image */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="gymcore-main-wrapper">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="gymcore-content-body">
          {activeView === 'members' && <MemberDirectory />}
          {activeView === 'memberships' && <SubscriptionManagement />}
          {(activeView === 'payments' || activeView === 'expenses') && <PaymentLedger />}
          {activeView === 'attendance' && (
            <AttendanceScanner
              onNavigateToMemberships={() => setActiveView('memberships')}
            />
          )}
          {activeView === 'dashboard' && <RoleDashboard onNavigate={setActiveView} />}
          {activeView === 'trainers' && <TrainerManagement />}
          {activeView === 'classes' && <FitnessClassManagement />}
          {activeView === 'workouts' && <WorkoutManagement />}
          {activeView === 'equipment' && <EquipmentManagement />}
          {activeView === 'users' && <UserManagement />}
          {activeView === 'audit' && <AuditLogViewer />}
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GymCoreApp />
    </AuthProvider>
  );
}
