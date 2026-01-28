import { useState } from 'react';
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
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'me':
        return <Me user={user} />;
      case 'team':
        return <MyTeam user={user} />;
      case 'leaves':
        return <LeaveAttendance user={user} />;
      case 'employee-management':
        return <EmployeeManagement />;
      case 'settings':
        return <Settings />;
      case 'admin-leaves':
        return <AdminLeaveManagement />;
      case 'team-management':
        return <TeamManagement />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F5F7FA]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
