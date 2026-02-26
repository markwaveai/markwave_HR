import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import LoginPage from './components/LoginPage';
import { authApi } from './services/api';
import './index.css';

// Lazy load page components
const Dashboard = lazy(() => import('./components/Dashboard'));
const Me = lazy(() => import('./components/Me'));
const MyTeam = lazy(() => import('./components/MyTeam'));
const LeaveAttendance = lazy(() => import('./components/LeaveAttendance'));
const Settings = lazy(() => import('./components/Layout/Settings'));
const EmployeeManagement = lazy(() => import('./components/EmployeeManagement'));
const AdminLeaveManagement = lazy(() => import('./components/AdminLeaveManagement'));
const TeamManagement = lazy(() => import('./components/TeamManagement'));
const Support = lazy(() => import('./components/Support'));
const AccountManagement = lazy(() => import('./components/AccountManagement'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));

// Privacy Policy Route Component (Context-Aware)
const PrivacyPolicyRoute = ({ isAuthenticated, user, handleLogout }) => {
  const location = useLocation();
  const isFromPortal = location.state?.fromPortal === true;

  if (isAuthenticated && isFromPortal) {
    return (
      <Layout user={user} handleLogout={handleLogout}>
        <PrivacyPolicy user={user} />
      </Layout>
    );
  }

  return <PrivacyPolicy user={user} />;
};

// Support Route Component (Context-Aware)
const SupportRoute = ({ isAuthenticated, user, handleLogout }) => {
  const location = useLocation();
  const isFromPortal = location.state?.fromPortal === true;

  if (isAuthenticated && isFromPortal) {
    return (
      <Layout user={user} handleLogout={handleLogout}>
        <Support user={user} />
      </Layout>
    );
  }

  return <Support user={user} />;
};

// Account Management Route Component (Context-Aware)
const AccountManagementRoute = ({ isAuthenticated, user, handleLogout }) => {
  const location = useLocation();
  const isFromPortal = location.state?.fromPortal === true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isFromPortal) {
    return (
      <Layout user={user} handleLogout={handleLogout}>
        <AccountManagement user={user} />
      </Layout>
    );
  }

  return <AccountManagement user={user} />;
};


// Protected Route Component
const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children ? children : <Outlet />;
};

// Main Layout Component
const Layout = ({ user, handleLogout, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Persist current route to localStorage whenever it changes
  useEffect(() => {
    if (location.pathname !== '/login') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F5F7FA]">
      {/* Overlay for mobile only */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 tab:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ${isSidebarOpen ? 'tab:ml-[240px] lg:ml-0' : ''}`}>
        <Header user={user} isSidebarOpen={isSidebarOpen} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} />
        <main className="flex-1 relative overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

function App() {
  const navigate = useNavigate();

  // Initialize state from localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  // Restore last route on mount if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const lastRoute = localStorage.getItem('lastRoute');
      if (lastRoute && lastRoute !== '/login' && window.location.pathname === '/') {
        navigate(lastRoute, { replace: true });
      }
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Sync profile on mount
  useEffect(() => {
    const syncProfile = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const profileData = await authApi.getProfile(user.id);
          // Update state and localStorage with fresh server data
          const updatedUser = { ...user, ...profileData };

          // Check if we actually need to update to avoid infinite loops or unnecessary renders
          // We specifically check for is_admin to ensure permissions are up to date
          if (user.is_admin !== profileData.is_admin ||
            user.role !== profileData.role ||
            JSON.stringify(updatedUser) !== JSON.stringify(user)) {

            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Profile sync failed. The backend server might be down or unreachable:", error);
        }
      }
    };
    syncProfile();
  }, [isAuthenticated, user?.id]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('lastRoute');
  };

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#F5F7FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#48327d]/20 border-t-[#48327d] rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-[#636e72]">Loading Markwave...</span>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? (
            <LoginPage onLogin={handleLogin} />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        } />

        {/* Privacy Policy - Context Aware (Integrated vs Standalone) */}
        <Route path="/privacy-policy" element={
          <PrivacyPolicyRoute
            isAuthenticated={isAuthenticated}
            user={user}
            handleLogout={handleLogout}
          />
        } />

        {/* Support - Context Aware (Integrated vs Standalone) */}
        <Route path="/support" element={
          <SupportRoute
            isAuthenticated={isAuthenticated}
            user={user}
            handleLogout={handleLogout}
          />
        } />

        {/* Account Management - Context Aware (Integrated vs Standalone) */}
        <Route path="/account-management" element={
          <AccountManagementRoute
            isAuthenticated={isAuthenticated}
            user={user}
            handleLogout={handleLogout}
          />
        } />



        {/* Protected Routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout user={user} handleLogout={handleLogout} /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/me" element={<Me user={user} />} />
          <Route path="/team" element={<MyTeam user={user} />} />
          <Route path="/leaves" element={<LeaveAttendance user={user} />} />
          <Route path="/employee-management" element={<EmployeeManagement user={user} />} />
          <Route path="/settings" element={<Settings user={user} onUserUpdate={setUser} />} />
          <Route path="/admin-leaves" element={<AdminLeaveManagement user={user} />} />
          <Route path="/team-management" element={<TeamManagement user={user} />} />
        </Route>

        {/* Catch all - redirect to dashboard if logged in, else login */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
