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
// Safety check for AsyncStorage native module
const storage = {
  getItem: async (key: string) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('AsyncStorage native module not found, using memory fallback');
      return (globalThis as any)[`fallback_${key}`] || null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      (globalThis as any)[`fallback_${key}`] = value;
    }
  },
  removeItem: async (key: string) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(key);
    } catch (e) {
      delete (globalThis as any)[`fallback_${key}`];
    }
  }
};

LogBox.ignoreAllLogs(); // Hide all warnings from the UI
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import MyTeamScreen from './src/screens/MyTeamScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MeScreen from './src/screens/MeScreen';
import LeaveScreen from './src/screens/LeaveScreen';
import { HomeIcon, UserIcon, UsersIcon, CalendarIcon, CheckCircleIcon, BuildingIcon, SettingsIcon, MenuIcon, ClockIcon, LogOutIcon } from './src/components/Icons';

import AdminLeaveScreen from './src/screens/AdminLeaveScreen';
import LoginScreen from './src/screens/LoginScreen';
import TeamManagementScreen from './src/screens/TeamManagementScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ProfileModal from './src/components/ProfileModal';

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
    {icon}
    <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>{title}</Text>
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

  // Load user session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await storage.getItem('user_session');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadSession();
  }, []);

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

  const handleLogoutPress = () => {
    setModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await storage.removeItem('user_session');
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
                    title="Home"
                    icon={<HomeIcon color={activeTab === 'Home' ? '#48327d' : '#64748b'} size={24} />}
                    isActive={activeTab === 'Home'}
                    onPress={() => { setActiveTab('Home'); setIsDrawerVisible(false); }}
                  />
                  <DrawerItem
                    title="Me"
                    icon={<UserIcon color={activeTab === 'Me' ? '#48327d' : '#64748b'} size={24} />}
                    isActive={activeTab === 'Me'}
                    onPress={() => { setActiveTab('Me'); setIsDrawerVisible(false); }}
                  />
                  {isAdmin && (
                    <DrawerItem
                      title="Employees"
                      icon={<UsersIcon color={activeTab === 'Employees' ? '#48327d' : '#64748b'} size={24} />}
                      isActive={activeTab === 'Employees'}
                      onPress={() => { setActiveTab('Employees'); setIsDrawerVisible(false); }}
                    />
                  )}
                  {isAdmin ? (
                    <DrawerItem
                      title="Team"
                      icon={<BuildingIcon color={activeTab === 'Teams' ? '#48327d' : '#64748b'} size={24} />}
                      isActive={activeTab === 'Teams'}
                      onPress={() => { setActiveTab('Teams'); setIsDrawerVisible(false); }}
                    />
                  ) : (
                    <DrawerItem
                      title="Team"
                      icon={<UsersIcon color={activeTab === 'Team' ? '#48327d' : '#64748b'} size={24} />}
                      isActive={activeTab === 'Team'}
                      onPress={() => { setActiveTab('Team'); setIsDrawerVisible(false); }}
                    />
                  )}
                  <DrawerItem
                    title="Leaves"
                    icon={<CalendarIcon color={activeTab === 'Menu' || activeTab === 'AdminLeave' ? '#48327d' : '#64748b'} size={24} />}
                    isActive={activeTab === 'Menu' || activeTab === 'AdminLeave'}
                    onPress={() => { setActiveTab(isAdmin ? 'AdminLeave' : 'Menu'); setIsDrawerVisible(false); }}
                  />
                  <DrawerItem
                    title="Settings"
                    icon={<SettingsIcon color={activeTab === 'Settings' ? '#48327d' : '#64748b'} size={24} />}
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

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setIsDrawerVisible(true)}
              style={{ padding: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <MenuIcon color="#48327d" size={26} />
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: '800', color: '#48327d', letterSpacing: 0.5 }}>MARKWAVE HR</Text>

            <View>
              <TouchableOpacity onPress={() => setIsProfileModalVisible(true)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
              </TouchableOpacity>
            </View>
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

          <View style={{ flex: 1 }}>
            {activeTab === 'Home' && <HomeScreen user={appUser} setActiveTabToSettings={() => setActiveTab('Settings')} />}
            {activeTab === 'Team' && <MyTeamScreen user={appUser} />}
            {activeTab === 'Me' && <MeScreen user={appUser} setActiveTabToSettings={() => setActiveTab('Settings')} />}
            {activeTab === 'Menu' && <LeaveScreen user={appUser} />}
            {activeTab === 'Employees' && <EmployeeListScreen />}
            {activeTab === 'AdminLeave' && <AdminLeaveScreen />}
            {activeTab === 'Teams' && <TeamManagementScreen />}
            {activeTab === 'Profile' && <ProfileScreen user={appUser} onBack={() => setActiveTab('Home')} />}
            {activeTab === 'Settings' && <SettingsScreen user={appUser} onBack={() => setActiveTab('Home')} />}
          </View>


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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 15, // Increased for visibility
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 2, // Thicker
    borderBottomColor: '#48327d', // Purple border instead of light gray
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8, // Higher elevation
    zIndex: 100,
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
    backgroundColor: 'white',
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
    borderBottomColor: '#f1f5f9',
  },
  drawerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#48327d',
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
    color: '#0f172a',
  },
  drawerUserRole: {
    fontSize: 14,
    color: '#64748b',
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
    backgroundColor: '#f3e8ff',
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 15,
  },
  drawerItemTextActive: {
    color: '#48327d',
  },
  logoutBtn: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
