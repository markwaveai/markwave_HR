import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  Alert,
  Modal,
  LogBox,
  ActivityIndicator
} from 'react-native';
import { storage } from './src/utils/storage';

// LogBox.ignoreAllLogs(); // Hide all warnings from the UI
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import MyTeamScreen from './src/screens/MyTeamScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MeScreen from './src/screens/MeScreen';
import LeaveScreen from './src/screens/LeaveScreen';
import { LayoutGridIcon, UserIcon, UserPlusIcon, UsersIcon, CalendarIcon, CheckCircleIcon, BuildingIcon, SettingsIcon, MenuIcon, ClockIcon, LogOutIcon } from './src/components/Icons';

import AdminLeaveScreen from './src/screens/AdminLeaveScreen';
import LoginScreen from './src/screens/LoginScreen';
import TeamManagementScreen from './src/screens/TeamManagementScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ProfileModal from './src/components/ProfileModal';
import { authApi, attendanceApi, leaveApi, adminApi } from './src/services/api';

/* ... existing interfaces ... */

/* ... existing interfaces ... */

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress, icon }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
  >
    <View style={[styles.tabIconContainer]}>
      {icon}
    </View>
    <Text style={[styles.tabLabel, isActive && styles.tabTextActive]}>{title}</Text>
  </TouchableOpacity>
);
/* ... existing interfaces ... */



const DrawerItem = ({ title, icon, isActive, onPress }: { title: string, icon: any, isActive: boolean, onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.drawerItem, isActive && styles.drawerItemActive]}
    onPress={onPress}
  >
    <View style={{ flexShrink: 0 }}>
      {icon}
    </View>
    <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
  </TouchableOpacity>
);

function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // Global Attendance/Dashboard State
  const [isClockedIn, setIsClockedIn] = useState<boolean | null>(null);
  const [isPendingOverride, setIsPendingOverride] = useState(false);
  const [canClock, setCanClock] = useState(true);
  const [disabledReason, setDisabledReason] = useState<string | null>(null);
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [apiErrors, setApiErrors] = useState<{ [key: string]: string }>({});

  // Refresh lock to prevent concurrent fetches
  const isRefreshingData = React.useRef(false);

  // Load user session and cached dashboard stats on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await storage.getItem('user_session');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsLoggedIn(true);

          // After setting user, try to load cached dashboard data
          const cachedStatus = await storage.getItem(`attendance_status_${userData.id}`);
          const cachedBalance = await storage.getItem(`leave_balance_${userData.id}`);
          const cachedStats = await storage.getItem(`personal_stats_${userData.id}`);

          if (cachedStatus) {
            const statusData = JSON.parse(cachedStatus);
            setIsClockedIn(statusData.status === 'IN');
            setIsPendingOverride(statusData.is_pending_override === true);
            setCanClock(statusData.can_clock !== false);
            setDisabledReason(statusData.disabled_reason || null);
          }
          if (cachedBalance) setLeaveBalance(JSON.parse(cachedBalance));
          if (cachedStats) setPersonalStats(JSON.parse(cachedStats));
        }

        // Restore last active tab if user is logged in
        const savedTab = await storage.getItem('active_tab');
        if (savedTab && savedUser) {
          setActiveTab(savedTab);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadSession();
  }, []);

  const fetchGlobalData = async (userId: string, isAdminUser: boolean) => {
    if (isRefreshingData.current) return;
    isRefreshingData.current = true;

    try {
      console.log('Fetching global data for user:', userId);
      // 1. Status (Critical)
      const statusData = await attendanceApi.getStatus(userId, { retries: 2, timeout: 15000 });
      setIsClockedIn(statusData.status === 'IN');
      setIsPendingOverride(statusData.is_pending_override === true);
      setCanClock(statusData.can_clock !== false);
      setDisabledReason(statusData.disabled_reason || null);
      storage.setItem(`attendance_status_${userId}`, JSON.stringify(statusData));

      // 2. Parallel Secondary Data
      const loadStats = attendanceApi.getPersonalStats(userId)
        .then(data => {
          setPersonalStats(data);
          storage.setItem(`personal_stats_${userId}`, JSON.stringify(data));
        })
        .catch(err => setApiErrors(prev => ({ ...prev, stats: err.message || 'Failed' })));

      const loadBalance = leaveApi.getBalance(userId)
        .then(data => {
          setLeaveBalance(data);
          storage.setItem(`leave_balance_${userId}`, JSON.stringify(data));
        })
        .catch(err => setApiErrors(prev => ({ ...prev, balance: err.message || 'Failed' })));

      const loadAdminStats = isAdminUser ? adminApi.getDashboardStats()
        .then(data => setDashboardStats(data))
        .catch(err => setApiErrors(prev => ({ ...prev, adminStats: err.message || 'Failed' })))
        : Promise.resolve();

      const loadHolidays = attendanceApi.getHolidays()
        .then(data => setHolidays(data || []))
        .catch(err => setApiErrors(prev => ({ ...prev, holidays: err.message || 'Failed' })));

      const loadLeaves = !isAdminUser ? leaveApi.getLeaves(userId)
        .then(data => setLeaveHistory(data || []))
        .catch(err => setApiErrors(prev => ({ ...prev, leaves: err.message || 'Failed' })))
        : Promise.resolve();

      await Promise.allSettled([loadStats, loadBalance, loadAdminStats, loadHolidays, loadLeaves]);
    } catch (e) {
      console.log('Global data fetch failed:', e);
    } finally {
      isRefreshingData.current = false;
    }
  };

  // Save activeTab to storage whenever it changes
  useEffect(() => {
    if (isLoggedIn) {
      storage.setItem('active_tab', activeTab).catch(e => {
        console.error('Failed to save active tab:', e);
      });
    }
  }, [activeTab, isLoggedIn]);

  const handleLogin = async (userData: any) => {
    try {
      await storage.setItem('user_session', JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
    } catch (e) {
      console.error('Failed to save session:', e);
      Alert.alert('Error', 'Failed to save login session');
    }
  };

  // Refresh user profile and global data in background when logged in
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      const refreshAll = async () => {
        try {
          // Skip profile refresh for offline admin
          if (user.employee_id !== 'MW-ADMIN') {
            console.log('Refreshing user profile...', user.employee_id || user.id);
            const profileData = await authApi.getProfile(user.employee_id || user.id);
            if (profileData && (profileData.employee_id || profileData.id)) {
              const updatedUser = { ...user, ...profileData };
              if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
                setUser(updatedUser);
                await storage.setItem('user_session', JSON.stringify(updatedUser));
              }
            }
          }

          // Fetch dashboard data
          await fetchGlobalData(user.id, isAdmin);
        } catch (e) {
          console.log('Background refresh failed:', e);
        }
      };

      refreshAll();

      // Poll every 5 minutes in background
      const interval = setInterval(refreshAll, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, user?.id]); // Run when login status or user ID changes

  const handleLogoutPress = () => {
    setModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await storage.removeItem('user_session');
      await storage.removeItem('active_tab');
      setIsLoggedIn(false);
      setUser(null);
      setActiveTab('Home');
      setModalVisible(false);
    } catch (e) {
      console.error('Failed to remove session:', e);
      Alert.alert('Error', 'Failed to clear login session');
    }
  };

  // Check is_admin flag primarily, with role fallbacks for robustness
  const isAdmin = user?.is_admin === true ||
    user?.role === 'Admin' ||
    user?.role === 'Administrator' ||
    user?.role === 'Project Manager' ||
    user?.role === 'Advisor-Technology & Operations';

  const getInitials = () => {
    if (!user) return 'HM';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  const appUser = user ? { ...user, is_admin: isAdmin } : null;

  if (isAppLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#48327d" />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <SafeAreaView style={styles.container}>
          <Modal
            animationType="fade"
            transparent={true}
            visible={isDrawerVisible}
            onRequestClose={() => setIsDrawerVisible(false)}
          >
            <TouchableOpacity
              style={styles.drawerOverlay}
              activeOpacity={1}
              onPress={() => setIsDrawerVisible(false)}
            >
              <View style={styles.drawerContent} onStartShouldSetResponder={() => true}>
                <View style={styles.drawerHeader}>
                  <View style={styles.drawerAvatar}>
                    <Text style={styles.drawerAvatarText}>{getInitials()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerUserName} numberOfLines={2}>{appUser?.first_name} {appUser?.last_name}</Text>
                    <Text style={styles.drawerUserRole} numberOfLines={1}>{appUser?.role || appUser?.designation}</Text>
                  </View>
                </View>

                <ScrollView style={styles.drawerNav}>
                  <DrawerItem
                    title="Dashboard"
                    icon={<LayoutGridIcon color={activeTab === 'Home' ? '#ffffff' : '#cbd5e1'} size={24} />}
                    isActive={activeTab === 'Home'}
                    onPress={() => { setActiveTab('Home'); setIsDrawerVisible(false); }}
                  />
                  <DrawerItem
                    title="Me"
                    icon={<UserIcon color={activeTab === 'Me' ? '#ffffff' : '#cbd5e1'} size={24} />}
                    isActive={activeTab === 'Me'}
                    onPress={() => { setActiveTab('Me'); setIsDrawerVisible(false); }}
                  />
                  {isAdmin && (
                    <DrawerItem
                      title="Employee Management"
                      icon={<UserPlusIcon color={activeTab === 'Employees' ? '#ffffff' : '#cbd5e1'} size={24} />}
                      isActive={activeTab === 'Employees'}
                      onPress={() => { setActiveTab('Employees'); setIsDrawerVisible(false); }}
                    />
                  )}
                  {isAdmin ? (
                    <DrawerItem
                      title="Team Management"
                      icon={<UsersIcon color={activeTab === 'Teams' ? '#ffffff' : '#cbd5e1'} size={24} />}
                      isActive={activeTab === 'Teams'}
                      onPress={() => { setActiveTab('Teams'); setIsDrawerVisible(false); }}
                    />
                  ) : (
                    <DrawerItem
                      title="My Team"
                      icon={<UsersIcon color={activeTab === 'Team' ? '#ffffff' : '#cbd5e1'} size={24} />}
                      isActive={activeTab === 'Team'}
                      onPress={() => { setActiveTab('Team'); setIsDrawerVisible(false); }}
                    />
                  )}
                  {isAdmin ? (
                    <DrawerItem
                      title="Leave Management"
                      icon={<CalendarIcon color={activeTab === 'AdminLeave' ? '#ffffff' : '#cbd5e1'} size={24} />}
                      isActive={activeTab === 'AdminLeave'}
                      onPress={() => { setActiveTab('AdminLeave'); setIsDrawerVisible(false); }}
                    />
                  ) : (
                    <DrawerItem
                      title="Leave & Attendance"
                      icon={<CalendarIcon color={activeTab === 'Menu' ? '#ffffff' : '#cbd5e1'} size={24} />}
                      isActive={activeTab === 'Menu'}
                      onPress={() => { setActiveTab('Menu'); setIsDrawerVisible(false); }}
                    />
                  )}
                  <DrawerItem
                    title="Settings"
                    icon={<SettingsIcon color={activeTab === 'Settings' ? '#ffffff' : '#cbd5e1'} size={24} />}
                    isActive={activeTab === 'Settings'}
                    onPress={() => { setActiveTab('Settings'); setIsDrawerVisible(false); }}
                  />
                </ScrollView>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
                  <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Header in natural flow (not absolute) */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                console.log('Hamburger clicked');
                setIsDrawerVisible(true);
              }}
              style={styles.menuButton}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <MenuIcon color="#48327d" size={28} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>MARKWAVE HR</Text>

            <TouchableOpacity onPress={() => setIsProfileModalVisible(true)} style={styles.profileButton}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.mainContent}>
            {activeTab === 'Home' && (
              <View style={{ flex: 1 }}>
                <HomeScreen
                  user={appUser}
                  setActiveTabToSettings={() => setActiveTab('Settings')}
                  attendanceState={{
                    isClockedIn,
                    isPendingOverride,
                    canClock,
                    disabledReason,
                    personalStats,
                    leaveBalance,
                    dashboardStats,
                    holidays,
                    leaveHistory,
                    apiErrors
                  }}
                  onRefresh={() => fetchGlobalData(user.id, isAdmin)}
                />
              </View>
            )}
            {activeTab === 'Team' && <MyTeamScreen user={appUser} />}
            {activeTab === 'Me' && <MeScreen user={appUser} setActiveTabToSettings={() => setActiveTab('Settings')} />}
            {activeTab === 'Menu' && <LeaveScreen user={appUser} />}
            {activeTab === 'Employees' && <EmployeeListScreen user={appUser} />}
            {activeTab === 'AdminLeave' && <AdminLeaveScreen user={appUser} />}
            {activeTab === 'Teams' && <TeamManagementScreen />}
            {activeTab === 'Profile' && <ProfileScreen user={appUser} onBack={() => setActiveTab('Home')} />}
            {activeTab === 'Settings' && <SettingsScreen user={appUser} onBack={() => setActiveTab('Home')} />}
          </View>

          <ProfileModal
            visible={isProfileModalVisible}
            onClose={() => setIsProfileModalVisible(false)}
            onLogout={confirmLogout}
            user={appUser}
          />

          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalIcon}>
                  <LogOutIcon color="#48327d" size={32} />
                </View>
                <Text style={styles.modalTitle}>Log Out?</Text>
                <Text style={styles.modalMessage}>Are you sure you want to exit?</Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.confirmBtn]}
                    onPress={confirmLogout}
                  >
                    <Text style={styles.confirmBtnText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      )}
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#48327d',
    letterSpacing: 0.5
  },
  menuButton: {
    padding: 15,
    marginLeft: -15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
  },
  profileButton: {
    padding: 10,
    marginRight: -10,
    zIndex: 100000,
  },
  mainContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#636e72',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3436',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Cards
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attendanceCard: {
    backgroundColor: '#ffffff',
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c5ce7',
  },
  dateText: {
    color: '#636e72',
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d3436',
  },
  shiftText: {
    color: '#636e72',
    fontSize: 12,
    marginTop: 4,
  },
  clockBtn: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  clockInBtn: {
    backgroundColor: '#6c5ce7',
  },
  clockOutBtn: {
    backgroundColor: '#d63031',
  },
  clockBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationTag: {
    alignSelf: 'center',
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#636e72',
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
    padding: 12,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
  },
  statLabel: {
    fontSize: 12,
    color: '#636e72',
  },
  // Quick Actions
  sectionContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#2d3436',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconButtonContainer: {
    alignItems: 'center',
    gap: 8,
  },
  iconButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonLabel: {
    fontSize: 12,
    color: '#636e72',
    fontWeight: '500',
  },
  // Holidays
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginHorizontal: 0,
  },
  holidayDate: {
    backgroundColor: '#feeaa7',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 50,
  },
  holidayMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d35400',
  },
  holidayDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d35400',
  },
  holidayInfo: {
    justifyContent: 'center',
  },
  holidayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  holidayWeekday: {
    fontSize: 13,
    color: '#636e72',
  },
  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10, // Adjust for iOS safe area if inside wrapper
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabButtonActive: {
    // Could add active background
  },
  tabIconContainer: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 20,
    color: '#b2bec3',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b2bec3',
  },
  tabTextActive: {
    color: '#6c5ce7',
  },
  /* ... existing styles ... */
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3e5f5', // Light purple bg
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f2f6',
  },
  confirmBtn: {
    backgroundColor: '#48327d', // Header color
  },
  cancelBtnText: {
    color: '#636e72',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Drawer Styles
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContent: {
    width: '75%',
    height: '100%',
    backgroundColor: '#48327d',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  drawerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  drawerUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  drawerUserRole: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  drawerNav: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  drawerItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
    marginLeft: 15,
  },
  drawerItemTextActive: {
    color: 'white',
  },
  logoutBtn: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  logoutText: {
    color: '#ff9999',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
