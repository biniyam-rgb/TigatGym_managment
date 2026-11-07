import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MemberDirectory from './components/MemberDirectory';
import RoleDashboard from './components/RoleDashboard';
import ReceptionDashboard from './components/ReceptionDashboard';
import UserManagement from './components/UserManagement';
import AuditLogViewer from './components/AuditLogViewer';
import SubscriptionManagement from './components/SubscriptionManagement';
import PaymentLedger from './components/PaymentLedger';
import AttendanceScanner from './components/AttendanceScanner';
import TrainerManagement from './components/TrainerManagement';
import FitnessClassManagement from './components/FitnessClassManagement';
import WorkoutManagement from './components/WorkoutManagement';
import EquipmentManagement from './components/EquipmentManagement';
import ReceptionNotificationsView from './components/ReceptionNotificationsView';
import ReceptionProfileView from './components/ReceptionProfileView';
import ChangePasswordModal from './components/ChangePasswordModal';
import BrandLogo from './components/BrandLogo';
import './App.css';

function GymCoreApp() {
  const { isAuthenticated, isLoading, primaryRole, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // Default to Overview Dashboard matching Image 1
  const [navParams, setNavParams] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Seamless navigation with parameters (e.g. { openRegister: true })
  const handleNavigate = (view, params = null) => {
    setNavParams(params);
    setActiveView(view);
  };

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

  // Titles mapping based on active view (clean SaaS header titles with no dense text)
  const firstName = user?.name ? user.name.split(' ')[0] : 'Selam';
  const viewTitles = {
    dashboard: {
      title: `Welcome back, ${firstName}!`,
      subtitle: '',
    },
    members: { title: 'Members', subtitle: '' },
    memberships: { title: 'Membership Plans', subtitle: '' },
    payments: { title: 'Payments', subtitle: '' },
    attendance: { title: 'Attendance', subtitle: '' },
    classes: { title: 'Classes', subtitle: '' },
    notifications: { title: 'Notifications', subtitle: '' },
    profile: { title: 'Profile', subtitle: '' },
    trainers: { title: 'Trainers', subtitle: '' },
    workouts: { title: 'Workouts', subtitle: '' },
    equipment: { title: 'Equipment', subtitle: '' },
    expenses: { title: 'Expenses', subtitle: '' },
    users: { title: 'Staff & Users', subtitle: '' },
    audit: { title: 'Audit Trail', subtitle: '' },
  };

  const currentMeta = viewTitles[activeView] || { title: 'Dashboard', subtitle: '' };

  return (
    <div className="gymcore-app-shell">
      {/* Fixed Left Sidebar matching reference image */}
      <Sidebar
        activeView={activeView}
        onViewChange={(v) => handleNavigate(v, null)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="gymcore-main-wrapper">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={handleNavigate}
        />

        <main className="gymcore-content-body">
          {activeView === 'members' && (
            <MemberDirectory initialOpenRegister={Boolean(navParams?.openRegister)} />
          )}
          {activeView === 'memberships' && <SubscriptionManagement />}
          {(activeView === 'payments' || activeView === 'expenses') && (
            <PaymentLedger initialOpenRecordPayment={Boolean(navParams?.openRecordPayment)} />
          )}
          {activeView === 'attendance' && (
            <AttendanceScanner
              onNavigateToMemberships={() => handleNavigate('memberships')}
            />
          )}
          {activeView === 'dashboard' && (
            primaryRole === 'receptionist' ? (
              <ReceptionDashboard onNavigate={handleNavigate} />
            ) : (
              <RoleDashboard onNavigate={handleNavigate} />
            )
          )}
          {activeView === 'trainers' && <TrainerManagement />}
          {activeView === 'classes' && <FitnessClassManagement />}
          {activeView === 'notifications' && (
            <ReceptionNotificationsView onNavigate={handleNavigate} />
          )}
          {activeView === 'profile' && (
            <ReceptionProfileView
              onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
              onNavigate={handleNavigate}
            />
          )}
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
