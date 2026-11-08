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
import ChapaVerificationModal from './components/ChapaVerificationModal';
import BrandLogo from './components/BrandLogo';
import './App.css';

function GymCoreApp() {
  const { isAuthenticated, isLoading, primaryRole, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // Default to Overview Dashboard matching Image 1
  const [navParams, setNavParams] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [chapaVerificationRef, setChapaVerificationRef] = useState(null);

  // Intercept Chapa return redirect from hosted checkout
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const paymentProvider = params.get('payment');
      const merchantRef = params.get('merchant_reference') || params.get('reference') || params.get('trx_ref') || params.get('tx_ref');

      if ((paymentProvider === 'chapa' || merchantRef) && merchantRef) {
        // Clean query parameters from URL bar immediately to prevent repeated verification on refresh
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // Open verification modal with the merchant reference asynchronously
        setTimeout(() => setChapaVerificationRef(merchantRef), 0);
      }
    } catch (e) {
      console.error('Error parsing return redirect parameters:', e);
    }
  }, []);

  // Seamless navigation with parameters (e.g. { openRegister: true })
  const handleNavigate = (view, params = null) => {
    setNavParams(params);
    setActiveView(view);
  };

  // White theme as default, with persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gymcore_theme') || 'light';
  });

  // Collapsible sidebar state with persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('gymcore_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gymcore_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      {/* Fixed Left Sidebar with Collapsible State */}
      <Sidebar
        activeView={activeView}
        onViewChange={(v) => handleNavigate(v, null)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area (Automatically adjusts width when sidebar collapses) */}
      <div className={`gymcore-main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
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

      {/* Chapa Return Redirect Verification Modal */}
      <ChapaVerificationModal
        isOpen={Boolean(chapaVerificationRef)}
        merchantReference={chapaVerificationRef}
        onClose={() => setChapaVerificationRef(null)}
        onVerified={() => {
          setActiveView('memberships');
        }}
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
