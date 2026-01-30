import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard';
import Me from './components/Me';
import MyTeam from './components/MyTeam';
import LeaveAttendance from './components/LeaveAttendance';
import Settings from './components/Layout/Settings';
import EmployeeManagement from './components/EmployeeManagement';
import AdminLeaveManagement from './components/AdminLeaveManagement';
import TeamManagement from './components/TeamManagement';
import LoginPage from './components/LoginPage';
import { authApi } from './services/api';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children ? children : <Outlet />;
};

// Main Layout Component
const Layout = ({ user, handleLogout }) => {
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F5F7FA]">
      <Sidebar
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
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
          // Only update if something changed
          if (JSON.stringify(profileData) !== JSON.stringify(user)) {
            const updatedUser = { ...user, ...profileData };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Profile sync failed:", error);
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
  };

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated}><Layout user={user} handleLogout={handleLogout} /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/me" element={<Me user={user} />} />
        <Route path="/team" element={<MyTeam user={user} />} />
        <Route path="/leaves" element={<LeaveAttendance user={user} />} />
        <Route path="/employee-management" element={<EmployeeManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin-leaves" element={<AdminLeaveManagement />} />
        <Route path="/team-management" element={<TeamManagement />} />
      </Route>

      {/* Catch all - redirect to dashboard if logged in, else login */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
