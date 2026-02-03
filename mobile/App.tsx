import React, { useState } from 'react';
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
  LogBox
} from 'react-native';

LogBox.ignoreAllLogs(); // Hide all warnings from the UI
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import MyTeamScreen from './src/screens/MyTeamScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MeScreen from './src/screens/MeScreen';

import LeaveScreen from './src/screens/LeaveScreen';
import AdminLeaveScreen from './src/screens/AdminLeaveScreen';
import LoginScreen from './src/screens/LoginScreen';
import TeamManagementScreen from './src/screens/TeamManagementScreen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

/* ... existing interfaces ... */

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
  icon: string;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress, icon }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{icon}</Text>
    <Text style={[styles.tabLabel, isActive && styles.tabTextActive]}>{title}</Text>
  </TouchableOpacity>
);

function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogoutPress = () => {
    setModalVisible(true);
  };

  const confirmLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab('Home');
    setModalVisible(false);
  };

  if (user) {
    console.log('Current User:', JSON.stringify(user, null, 2));
    console.log('Role Check:', user.role, 'Is Admin?', user?.role === 'Admin');
    console.log('is_admin field:', user.is_admin, 'Type:', typeof user.is_admin);
  }

  const isAdmin = user?.is_admin === true ||
    user?.role === 'Admin' ||
    user?.role === 'Administrator' ||
    user?.role === 'Project Manager' ||
    user?.role === 'Advisor-Technology & Operations';

  const getInitials = () => {
    if (!user) return 'HM';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {!isLoggedIn ? (
        <LoginScreen onLogin={(userData) => { setIsLoggedIn(true); setUser(userData); }} />
      ) : (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          {/* Header with Avatar and Logout */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <TouchableOpacity onPress={handleLogoutPress} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalIcon}>
                  <Text style={{ fontSize: 24 }}>👋</Text>
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

          {/* Content */}
          <View style={{ flex: 1 }}>
            {activeTab === 'Home' && <HomeScreen user={user} />}
            {activeTab === 'Team' && <MyTeamScreen user={user} />}
            {activeTab === 'Me' && <MeScreen user={user} />}
            {activeTab === 'Menu' && <LeaveScreen user={user} />}
            {activeTab === 'Employees' && <EmployeeListScreen />}
            {activeTab === 'AdminLeave' && <AdminLeaveScreen />}
            {activeTab === 'Teams' && <TeamManagementScreen />}
          </View>

          {/* Bottom Tab Bar */}
          <View style={styles.tabBar}>
            <TabButton
              title="Home"
              icon="🏠"
              isActive={activeTab === 'Home'}
              onPress={() => setActiveTab('Home')}
            />
            {/* Common Tabs for Employee & Admin */}
            <TabButton
              title="Me"
              icon="👤"
              isActive={activeTab === 'Me'}
              onPress={() => setActiveTab('Me')}
            />

            {/* Employee Specific Tabs */}
            {!isAdmin && (
              <TabButton
                title="My Team"
                icon="👥"
                isActive={activeTab === 'Team'}
                onPress={() => setActiveTab('Team')}
              />
            )}

            {/* Admin Only Tabs */}
            {isAdmin && (
              <TabButton
                title="Employees"
                icon="👥"
                isActive={activeTab === 'Employees'}
                onPress={() => setActiveTab('Employees')}
              />
            )}

            {!isAdmin && (
              <TabButton
                title="Leave"
                icon="📅"
                isActive={activeTab === 'Menu'}
                onPress={() => setActiveTab('Menu')}
              />
            )}
            {isAdmin && (
              <TabButton
                title="Requests"
                icon="✓"
                isActive={activeTab === 'AdminLeave'}
                onPress={() => setActiveTab('AdminLeave')}
              />
            )}
            {isAdmin && (
              <TabButton
                title="Teams"
                icon="🏢"
                isActive={activeTab === 'Teams'}
                onPress={() => setActiveTab('Teams')}
              />
            )}
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
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  logoutBtn: {
    padding: 8,
  },
  logoutText: {
    color: '#ff6b6b',
    fontWeight: '600',
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
});

export default App;
