import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BrandLogo from './components/BrandLogo';
import './App.css';

// Code-split route/view components with React.lazy for instant initial page loads
const MemberDirectory = lazy(() => import('./components/MemberDirectory'));
const RoleDashboard = lazy(() => import('./components/RoleDashboard'));
const ReceptionDashboard = lazy(() => import('./components/ReceptionDashboard'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const AuditLogViewer = lazy(() => import('./components/AuditLogViewer'));
const SubscriptionManagement = lazy(() => import('./components/SubscriptionManagement'));
const PaymentLedger = lazy(() => import('./components/PaymentLedger'));
const AttendanceScanner = lazy(() => import('./components/AttendanceScanner'));
const TrainerManagement = lazy(() => import('./components/TrainerManagement'));
const FitnessClassManagement = lazy(() => import('./components/FitnessClassManagement'));
const WorkoutManagement = lazy(() => import('./components/WorkoutManagement'));
const ExerciseLibrary = lazy(() => import('./components/ExerciseLibrary'));
const MemberProgress = lazy(() => import('./components/MemberProgress'));
const EquipmentManagement = lazy(() => import('./components/EquipmentManagement'));
const ReceptionNotificationsView = lazy(() => import('./components/ReceptionNotificationsView'));
const ReceptionProfileView = lazy(() => import('./components/ReceptionProfileView'));
const ChangePasswordModal = lazy(() => import('./components/ChangePasswordModal'));
const ChapaVerificationModal = lazy(() => import('./components/ChapaVerificationModal'));

function ViewLoadingSkeleton() {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '220px', height: '32px', borderRadius: '8px', background: 'var(--border, #2a2a2a)', opacity: 0.6 }} />
        <div style={{ width: '120px', height: '36px', borderRadius: '8px', background: 'var(--border, #2a2a2a)', opacity: 0.6 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '90px', borderRadius: '12px', background: 'var(--card-bg, #1a1a1a)', border: '1px solid var(--border, #2a2a2a)', opacity: 0.7 }} />
        ))}
      </div>
      <div style={{ height: '350px', borderRadius: '12px', background: 'var(--card-bg, #1a1a1a)', border: '1px solid var(--border, #2a2a2a)', opacity: 0.7 }} />
    </div>
  );
}

function GymCoreApp() {
  const { isAuthenticated, isLoading, primaryRole, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard'); // Default to Overview Dashboard matching Image 1
  const [navParams, setNavParams] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [chapaVerificationRef, setChapaVerificationRef] = useState(null);

  // Reset view to overview dashboard whenever active user switches (e.g. login/logout)
  useEffect(() => {
    setTimeout(() => {
      setActiveView('dashboard');
    }, 0);
  }, [user?.id]);

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

  // Global Refresh Key to instantly reload any active view on demand
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

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
    classes: { title: primaryRole === 'trainer' ? 'My Classes' : 'Classes', subtitle: '' },
    notifications: { title: 'Notifications', subtitle: '' },
    profile: { title: 'Profile', subtitle: '' },
    trainers: { title: 'Trainers', subtitle: '' },
    exercises: { title: 'Exercise Library', subtitle: '' },
    progress: { title: 'Member Progress', subtitle: '' },
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
          onRefresh={handleRefresh}
        />

        <main className="gymcore-content-body" key={refreshKey}>
          <Suspense fallback={<ViewLoadingSkeleton />}>
            {activeView === 'members' && (
              <MemberDirectory
                initialOpenRegister={Boolean(navParams?.openRegister)}
                initialSearch={navParams?.search || ''}
              />
            )}
            {activeView === 'memberships' && <SubscriptionManagement />}
            {(activeView === 'payments' || activeView === 'expenses') && (
              <PaymentLedger
                initialTab={activeView === 'expenses' ? 'expenses' : 'payments'}
              />
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
            {activeView === 'classes' && (
              <FitnessClassManagement
                initialOpenSchedule={Boolean(navParams?.openSchedule)}
              />
            )}
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
            {activeView === 'exercises' && <ExerciseLibrary onNavigate={handleNavigate} />}
            {activeView === 'progress' && (
              <MemberProgress
                onNavigate={handleNavigate}
                initialMemberId={navParams?.member_id}
                initialExerciseId={navParams?.exercise_id}
              />
            )}
            {activeView === 'equipment' && <EquipmentManagement />}
            {activeView === 'users' && <UserManagement />}
            {activeView === 'audit' && <AuditLogViewer />}

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
              <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
              />
            )}

            {/* Chapa Return Redirect Verification Modal */}
            {Boolean(chapaVerificationRef) && (
              <ChapaVerificationModal
                isOpen={Boolean(chapaVerificationRef)}
                merchantReference={chapaVerificationRef}
                onClose={() => setChapaVerificationRef(null)}
                onVerified={() => {
                  setActiveView('memberships');
                }}
              />
            )}
          </Suspense>
        </main>
      </div>
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
