import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Modal, TextInput, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { leaveApi, authApi, attendanceApi } from '../services/api';
import { normalize, wp, hp } from '../utils/responsive';
import CustomDatePicker from '../components/CustomDatePicker';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import WorkFromHomeScreen from './WorkFromHomeScreen';
import { CalendarIcon, PlaneIcon, ThermometerIcon, PalmTreeIcon, StarIcon, FlameIcon, BabyIcon, HomeIcon, HourglassIcon, BanIcon } from '../components/Icons';

const LeaveScreen = ({ user }: { user: any }) => {
    const [activeTab, setActiveTab] = useState<'leave' | 'wfh'>('leave');
    const [history, setHistory] = useState<any[]>([]);
    // balances state removed
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [wfhModalVisible, setWfhModalVisible] = useState(false);

    // Dropdown State
    const [isTypePickerVisible, setIsTypePickerVisible] = useState(false);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchLeaves();
        setRefreshing(false);
    }, []);

    // Form State
    const [leaveType, setLeaveType] = useState('cl');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [fromSession, setFromSession] = useState('Full Day');
    const [toSession, setToSession] = useState('Full Day');
    const [notifyTo, setNotifyTo] = useState<string[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [apiBalance, setApiBalance] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);


    const EMPLOYEE_ID = user?.id; // Dynamic ID from prop

    const LEAVE_CONFIG: any = {
        'cl': { name: 'Casual Leave', code: 'cl', icon: <PlaneIcon size={normalize(18)} color="#3498db" />, color: '#3498db', bg: '#e0f2fe' },
        'sl': { name: 'Sick Leave', code: 'sl', icon: <ThermometerIcon size={normalize(18)} color="#e74c3c" />, color: '#e74c3c', bg: '#fee2e2' },
        'el': { name: 'Earned Leave', code: 'el', icon: <PalmTreeIcon size={normalize(18)} color="#2ecc71" />, color: '#2ecc71', bg: '#dcfce7' },
        'scl': { name: 'Special Casual Leave', code: 'scl', icon: <StarIcon size={normalize(18)} color="#9b59b6" />, color: '#9b59b6', bg: '#f3e5f5' },
        'bl': { name: 'Bereavement Leave', code: 'bl', icon: <FlameIcon size={normalize(18)} color="#e67e22" />, color: '#e67e22', bg: '#fff3e0' },
        'pl': { name: 'Paternity Leave', code: 'pl', icon: <BabyIcon size={normalize(18)} color="#1abc9c" />, color: '#1abc9c', bg: '#e0f2f1' },
        'll': { name: 'Long Leave', code: 'll', icon: <HomeIcon size={normalize(18)} color="#34495e" />, color: '#34495e', bg: '#eceff1' },
        'co': { name: 'Comp Off', code: 'co', icon: <HourglassIcon size={normalize(18)} color="#f1c40f" />, color: '#f1c40f', bg: '#fffde7' },
        'lwp': { name: 'Leave Without Pay', code: 'lwp', icon: <BanIcon size={normalize(18)} color="#95a5a6" />, color: '#95a5a6', bg: '#f1f2f6' }
    };

    const fetchLeaves = async () => {
        try {
            const data = await leaveApi.getLeaves(EMPLOYEE_ID);
            setHistory(data);
        } catch (error) {
            console.log("Failed to fetch leaves:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const data = await leaveApi.getBalance(EMPLOYEE_ID);
            setApiBalance(data);
        } catch (error) {
            console.log("Failed to fetch balance:", error);
        }
    };

    // Restored holidays state
    const [holidays, setHolidays] = useState<any[]>([]);

    useEffect(() => {
        fetchLeaves();
        fetchBalance();
        if (EMPLOYEE_ID) {
            authApi.getProfile(EMPLOYEE_ID).then(p => setProfile(p)).catch(console.log);
        }
        // Fetch holidays for button validation
        attendanceApi.getHolidays().then(h => setHolidays(h)).catch(() => setHolidays([]));
    }, [EMPLOYEE_ID]);

    // Auto-populate Notify To field
    useEffect(() => {
        if (!profile && !user) return;

        const leadStr = profile?.team_lead_name || user?.team_lead_name || '';
        const pmStr = profile?.project_manager_name || '';
        const advisorStr = profile?.advisor_name || '';

        const names = new Set<string>();

        const addNames = (val: string) => {
            if (!val) return;
            val.split(',').forEach(s => {
                const trimmed = s.trim();
                if (trimmed && trimmed !== 'Team Lead') names.add(trimmed);
            });
        };

        addNames(leadStr);
        addNames(pmStr);
        addNames(advisorStr);

        // Filter out own name
        const currentUserName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
        if (currentUserName) {
            names.delete(currentUserName);
        }

        const autoList = Array.from(names);
        if (autoList.length > 0) {
            setNotifyTo(autoList);
        }
    }, [profile, user]);

    // Helper to check if date is Sunday or Holiday
    const isDateDisabled = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        // Check Sunday (0)
        if (d.getDay() === 0) return true;
        // Check Holidays (Compare with raw_date or date from API)
        return holidays.some(h => (h.raw_date || h.date) === dateStr);
    };

    const isTimeRestricted = () => {
        if (!fromDate) return false;

        // Only apply time restrictions for TODAY
        const now = new Date();
        const selectedDate = new Date(fromDate);
        const isToday = selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear();

        if (!isToday) return false;

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour + (currentMinute / 60);

        // Rule 1: Enable requests only after 9:30 AM
        if (currentTime < 9.5) return true; // Before 9:30 AM (9.5)

        // Rule 2: Morning Session (First Half) - valid between 9:30 AM and 12:30 PM
        // Also applies to Full Day (since it includes morning)
        if (fromSession === 'First Half' || fromSession === 'Full Day') {
            if (currentTime > 12.5) return true; // After 12:30 PM
        }

        // Rule 3: Afternoon Session (Second Half) - valid before 2:00 PM
        if (fromSession === 'Second Half') {
            if (currentTime >= 14) return true; // After 2:00 PM
        }

        return false;
    };

    const isDuplicateLeave = () => {
        if (!fromDate) return false;

        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = toDate ? new Date(toDate) : new Date(start);
        end.setHours(0, 0, 0, 0);

        return history.some(item => {
            if (item.status === 'Rejected' || item.status === 'Cancelled') return false;

            const hStart = new Date(item.fromDate);
            hStart.setHours(0, 0, 0, 0);
            const hEnd = new Date(item.toDate || item.fromDate);
            hEnd.setHours(0, 0, 0, 0);

            return start <= hEnd && end >= hStart;
        });
    };

    const hasRestrictedDaysInRange = () => {
        if (!fromDate || !toDate || fromDate === toDate) return false;

        const start = new Date(fromDate);
        const end = new Date(toDate);

        let current = new Date(start);
        while (current <= end) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            if (isDateDisabled(dateStr)) return true;
            current.setDate(current.getDate() + 1);
        }
        return false;
    };

    const isSubmitDisabled = () => {
        if (isSubmitting) return true;
        if (!fromDate || !reason.trim()) return true;

        // Check From Date
        if (isDateDisabled(fromDate)) return true;

        // Check To Date (if exists)
        if (toDate && isDateDisabled(toDate)) return true;

        // Check Time Restrictions
        if (isTimeRestricted()) return true;

        // Check Duplicate Leave
        if (isDuplicateLeave()) return true;

        // We allow restricted days in range here, to show specific alert on Submit
        return false;
    };

    const handleApply = async () => {
        if (!fromDate || !reason || notifyTo.length === 0) {
            Alert.alert("Validation", "Please fill all required fields (Dates, Reason, Notify To)");
            return;
        }

        // Validate Range for Sundays and Holidays
        if (fromDate) {
            const start = new Date(fromDate);
            const end = toDate ? new Date(toDate) : new Date(fromDate);
            let current = new Date(start);

            while (current <= end) {
                const yyyy = current.getFullYear();
                const mm = String(current.getMonth() + 1).padStart(2, '0');
                const dd = String(current.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                if (isDateDisabled(dateStr)) {
                    // Determine reason
                    const isSun = current.getDay() === 0;
                    const holiday = holidays.find(h => (h.raw_date || h.date) === dateStr);

                    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                    const formattedDate = current.toLocaleDateString('en-US', options);

                    const reasonMsg = isSun ? "is a Sunday" : `is a Holiday (${holiday?.name || 'Public Holiday'})`;
                    Alert.alert(
                        "Restricted",
                        `Cannot apply leave on Sundays or Public Holidays. ${formattedDate} ${reasonMsg}.`
                    );
                    return;
                }
                current.setDate(current.getDate() + 1);
            }
        }

        if (!EMPLOYEE_ID) {
            Alert.alert("Error", "User session invalid. Please relogin.");
            return;
        }

        const effectiveToDate = toDate || fromDate;
        const start = new Date(fromDate);
        const end = new Date(effectiveToDate);

        if (end < start) {
            Alert.alert("Error", "To Date cannot be earlier than From Date.");
            return;
        }







        setIsSubmitting(true);
        try {
            const diff = end.getTime() - start.getTime();
            let days = Math.ceil(diff / (1000 * 3600 * 24)) + 1;

            if (fromDate === effectiveToDate) {
                // Single day logic
                if (fromSession !== 'Full Day') {
                    days = 0.5;
                }
            } else {
                // Multi-day logic
                if (fromSession !== 'Full Day') days -= 0.5;
                if (toSession !== 'Full Day') days -= 0.5;
            }

            await leaveApi.apply({
                employeeId: EMPLOYEE_ID,
                type: leaveType,
                fromDate,
                toDate: effectiveToDate,
                days: days > 0 ? days : 0.5,
                reason: reason.trim(),
                notifyTo: notifyTo.join(', '),
                created_at: new Date().toISOString()
            });
            Alert.alert("Success", "Leave applied successfully");
            setIsModalVisible(false);
            setReason('');
            setFromDate('');
            setToDate('');
            setFromSession('Full Day');
            setToSession('Full Day');
            setNotifyTo([]);
            fetchLeaves();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to apply leave";
            console.log("Submit Error:", msg);
            Alert.alert("API Error", msg + "\n(This error is coming from the server)");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return '#2ecc71';
            case 'Pending': return '#f39c12';
            case 'Rejected': return '#e74c3c';
            default: return '#95a5a6';
        }
    };

    const getLeaveLabel = (code: string) => {
        return LEAVE_CONFIG[code]?.name || code.toUpperCase();
    };

    // Helper to format dropdown label
    const getLeaveDropdownLabel = (code: string) => {
        const config = LEAVE_CONFIG[code];
        if (!config) return code.toUpperCase();

        // LWP doesn't have a balance
        if (code === 'lwp') return config.name.toUpperCase();

        const balance = apiBalance[code] !== undefined ? apiBalance[code] : 0;
        return `${config.name.toUpperCase()} (${balance} Remaining)`;
    };

    const formatDateWithDay = (dateStr: string) => {
        if (!dateStr) return '';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const date = new Date(dateStr);
        return `${days[date.getDay()]}, ${dateStr}`;
    };

    // Date Picker State
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [activeDateInput, setActiveDateInput] = useState<'from' | 'to' | null>(null);

    const openDatePicker = (field: 'from' | 'to') => {
        setActiveDateInput(field);
        setDatePickerVisible(true);
    };

    const handleDateSelect = (date: string) => {
        if (activeDateInput === 'from') setFromDate(date);
        if (activeDateInput === 'to') setToDate(date);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Leave & Attendance</Text>
                    <Text style={styles.headerSubtitle}>{!user?.is_admin ? 'View your leave balance' : 'Manage your time off'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: wp(1.5) }}>
                    <Pressable
                        onPress={() => {

                            setActiveTab('leave');
                            setIsModalVisible(true);
                        }}
                        style={({ pressed }) => [
                            styles.addButton,
                            pressed && { opacity: 0.7 },
                            { paddingHorizontal: wp(3) }
                        ]}
                    >
                        <Text style={styles.addButtonText}>+ LEAVE</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            setActiveTab('wfh');
                            setWfhModalVisible(true);
                        }}
                        style={({ pressed }) => [
                            styles.addButton,
                            pressed && { opacity: 0.7 },
                            { paddingHorizontal: wp(3), backgroundColor: '#636e72' }
                        ]}
                    >
                        <Text style={styles.addButtonText}>+ WFH</Text>
                    </Pressable>
                </View>
            </View>


            <View style={{ flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <TouchableOpacity
                    onPress={() => setActiveTab('leave')}
                    style={{ flex: 1, paddingVertical: hp(1.5), alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'leave' ? '#48327d' : 'transparent' }}
                >
                    <Text style={{ color: activeTab === 'leave' ? '#48327d' : '#636e72', fontWeight: 'bold', fontSize: normalize(14) }}>LEAVES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('wfh')}
                    style={{ flex: 1, paddingVertical: hp(1.5), alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'wfh' ? '#48327d' : 'transparent' }}
                >
                    <Text style={{ color: activeTab === 'wfh' ? '#48327d' : '#636e72', fontWeight: 'bold', fontSize: normalize(14) }}>WFH</Text>
                </TouchableOpacity>
            </View>

            {
                activeTab === 'wfh' ? (
                    <WorkFromHomeScreen
                        user={user}
                        isModalVisible={wfhModalVisible}
                        setIsModalVisible={setWfhModalVisible}
                    />
                ) : (
                    <>
                        <ScrollView
                            contentContainerStyle={{ paddingBottom: hp(12) }}
                            style={styles.scrollContainer}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#48327d']} />
                            }
                        >
                            {!user?.is_admin && (
                                <LeaveBalanceCard apiBalance={apiBalance} history={history} />
                            )}

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Leave History</Text>
                            </View>

                            {loading ? (
                                <ActivityIndicator size="large" color="#48327d" />
                            ) : (
                                <View style={styles.historyList}>
                                    {history.length === 0 ? <Text style={styles.emptyText}>No leave history found.</Text> :
                                        history.map((item, index) => (
                                            <View key={index} style={styles.historyItem}>
                                                <View style={styles.historyLeft}>
                                                    <Text style={styles.leaveType}>{getLeaveLabel(item.type)}</Text>
                                                    <Text style={styles.leaveDates}>{formatDateWithDay(item.fromDate)} - {formatDateWithDay(item.toDate)}</Text>
                                                </View>
                                                <View style={styles.historyRight}>
                                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                                                    </View>
                                                    <Text style={styles.daysCount}>{item.days} Days</Text>
                                                </View>
                                            </View>
                                        ))}
                                </View>
                            )}
                        </ScrollView>

                        {/* Apply Modal */}
                        <Modal
                            visible={isModalVisible}
                            animationType="slide"
                            transparent={true}
                            onRequestClose={() => setIsModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Apply for Leave</Text>
                                        <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                            <Text style={styles.closeText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView
                                        style={styles.formContainer}
                                        contentContainerStyle={{ paddingBottom: hp(5) }}
                                    >
                                        {/* Leave Type Dropdown */}
                                        <Text style={styles.inputLabel}>LEAVE TYPE *</Text>
                                        <TouchableOpacity
                                            style={styles.dropdownButton}
                                            onPress={() => setIsTypePickerVisible(true)}
                                        >
                                            <Text style={styles.dropdownText}>
                                                {getLeaveDropdownLabel(leaveType)}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Dates */}
                                        <View style={{ flexDirection: 'row', gap: wp(2.5) }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.inputLabel}>FROM DATE *</Text>
                                                <TouchableOpacity
                                                    style={styles.dateInput}
                                                    onPress={() => openDatePicker('from')}
                                                >
                                                    <Text style={[styles.dateText, !fromDate && { color: '#b2bec3' }]}>
                                                        {fromDate || 'Select Date'}
                                                    </Text>
                                                    <CalendarIcon color="#64748b" size={normalize(18)} />
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.inputLabel}>TO DATE *</Text>
                                                <TouchableOpacity
                                                    style={styles.dateInput}
                                                    onPress={() => openDatePicker('to')}
                                                >
                                                    <Text style={[styles.dateText, !toDate && { color: '#b2bec3' }]}>
                                                        {toDate || 'Select Date'}
                                                    </Text>
                                                    <CalendarIcon color="#64748b" size={normalize(18)} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Session Buttons */}
                                        {(fromDate && (!toDate || fromDate === toDate)) ? (
                                            <>
                                                <Text style={styles.inputLabel}>SESSION *</Text>
                                                <View style={styles.sessionRow}>
                                                    {['Full Day', 'First Half', 'Second Half'].map(s => (
                                                        <TouchableOpacity
                                                            key={s}
                                                            style={[styles.sessionBtn, fromSession === s && styles.sessionBtnActive]}
                                                            onPress={() => { setFromSession(s); setToSession(s); }}
                                                        >
                                                            <Text style={[styles.sessionBtnText, fromSession === s && styles.sessionBtnTextActive]}>{s}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <Text style={styles.inputLabel}>START DATE SESSION *</Text>
                                                <View style={styles.sessionRow}>
                                                    {['Full Day', 'First Half', 'Second Half'].map(s => (
                                                        <TouchableOpacity
                                                            key={s}
                                                            style={[styles.sessionBtn, fromSession === s && styles.sessionBtnActive]}
                                                            onPress={() => setFromSession(s)}
                                                        >
                                                            <Text style={[styles.sessionBtnText, fromSession === s && styles.sessionBtnTextActive]}>{s}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                                <Text style={styles.inputLabel}>END DATE SESSION *</Text>
                                                <View style={styles.sessionRow}>
                                                    {['Full Day', 'First Half', 'Second Half'].map(s => (
                                                        <TouchableOpacity
                                                            key={s}
                                                            style={[styles.sessionBtn, toSession === s && styles.sessionBtnActive]}
                                                            onPress={() => setToSession(s)}
                                                        >
                                                            <Text style={[styles.sessionBtnText, toSession === s && styles.sessionBtnTextActive]}>{s}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </>
                                        )}

                                        {/* Reason */}
                                        <Text style={styles.inputLabel}>REASON FOR LEAVE *</Text>
                                        <TextInput
                                            style={[styles.input, { height: hp(10), textAlignVertical: 'top' }]}
                                            value={reason}
                                            onChangeText={setReason}
                                            placeholder="Briefly describe the reason..."
                                            multiline
                                        />

                                        {/* Notify To */}
                                        <Text style={styles.inputLabel}>NOTIFY TO *</Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: wp(1.5), marginBottom: hp(1), padding: wp(2), backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8) }}>
                                            {notifyTo.length === 0 && <Text style={{ color: '#b2bec3', fontSize: normalize(12) }}>Select notification recipients...</Text>}
                                            {notifyTo.map(p => (
                                                <TouchableOpacity key={p} onPress={() => setNotifyTo(notifyTo.filter(x => x !== p))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#48327d', borderRadius: normalize(4), paddingHorizontal: wp(1.5), paddingVertical: hp(0.5) }}>
                                                    <Text style={{ color: 'white', fontSize: normalize(10), fontWeight: 'bold', marginRight: wp(1) }}>{p}</Text>
                                                    <Text style={{ color: 'white', fontSize: normalize(10) }}>✕</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: wp(1.5) }}>
                                            {(() => {
                                                // Reverse priority: profile is fresh from getProfile, user might be stale from session
                                                const leadStr = profile?.team_lead_name || user?.team_lead_name || '';
                                                const leads = leadStr.split(',').map((s: string) => s.trim()).filter((name: string) => name && name !== 'Team Lead');

                                                const managers = profile?.project_manager_name ?
                                                    profile.project_manager_name.split(',').map((m: string) => m.trim()).filter(Boolean) :
                                                    [];

                                                const advisors = profile?.advisor_name ?
                                                    profile.advisor_name.split(',').map((a: string) => a.trim()).filter(Boolean) :
                                                    [];

                                                const allSuggestions = [
                                                    ...leads,
                                                    ...managers,
                                                    ...advisors
                                                ];

                                                // Deduplicate and filter out "Team Lead" specifically
                                                const uniqueSuggestions = Array.from(new Set(allSuggestions))
                                                    .filter((name: any) => name && name !== 'Team Lead');

                                                return uniqueSuggestions
                                                    .filter(name => !notifyTo.includes(name))
                                                    .map(name => (
                                                        <TouchableOpacity
                                                            key={name}
                                                            onPress={() => {
                                                                setNotifyTo([...notifyTo, name]);
                                                            }}
                                                            style={{ backgroundColor: '#f1f2f6', paddingHorizontal: wp(2), paddingVertical: hp(0.5), borderRadius: normalize(4) }}
                                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                        >
                                                            <Text style={{ fontSize: normalize(10), fontWeight: 'bold', color: '#48327d' }}>+ {name}</Text>
                                                        </TouchableOpacity>
                                                    ));
                                            })()}
                                        </View>

                                        <TouchableOpacity
                                            onPress={handleApply}
                                            style={[styles.submitBtn, isSubmitDisabled() && { opacity: 0.5 }]}
                                            disabled={isSubmitDisabled()}
                                        >
                                            <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
                                        </TouchableOpacity>
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>

                        {/* Type Picker Modal */}
                        <Modal
                            visible={isTypePickerVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setIsTypePickerVisible(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setIsTypePickerVisible(false)}
                            >
                                <View style={styles.pickerContent}>
                                    {Object.values(LEAVE_CONFIG)
                                        .filter((item: any) => apiBalance?.hasOwnProperty(item.code) || ['cl', 'sl', 'lwp'].includes(item.code))
                                        .map((item: any) => {
                                            const isSelected = item.code === leaveType;
                                            return (
                                                <TouchableOpacity
                                                    key={item.code}
                                                    style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
                                                    onPress={() => {
                                                        setLeaveType(item.code);
                                                        setIsTypePickerVisible(false);
                                                    }}
                                                >
                                                    <Text style={[styles.pickerItemText, isSelected && styles.selectedPickerItemText]}>
                                                        {getLeaveDropdownLabel(item.code)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        <CustomDatePicker
                            visible={datePickerVisible}
                            onClose={() => setDatePickerVisible(false)}
                            onSelect={handleDateSelect}
                            value={activeDateInput === 'from' ? fromDate : toDate}
                            disabledDates={holidays.map((h: any) => h.raw_date || h.date).filter(Boolean)}
                        />
                    </>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { padding: wp(5), paddingTop: Platform.OS === 'android' ? hp(5) : hp(2.5), backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: normalize(20), fontWeight: 'bold', color: '#2d3436' },
    headerSubtitle: { fontSize: normalize(12), color: '#636e72', marginTop: hp(0.2) },
    addButton: { backgroundColor: '#48327d', paddingHorizontal: wp(4), paddingVertical: hp(1.2), borderRadius: normalize(8), shadowColor: '#48327d', shadowOpacity: 0.2, shadowOffset: { height: 2, width: 0 }, elevation: 5, zIndex: 999 },
    addButtonText: { color: 'white', fontWeight: 'bold', fontSize: normalize(12) },

    scrollContainer: { padding: wp(5) },

    // Balance Grid
    balanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: wp(3),
        marginBottom: hp(3),
        justifyContent: 'space-between'
    },
    balanceCard: {
        backgroundColor: 'white',
        borderRadius: normalize(16),
        padding: wp(4),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginBottom: hp(1.5) },
    iconBox: { width: normalize(28), height: normalize(28), borderRadius: normalize(8), justifyContent: 'center', alignItems: 'center' },
    balanceTitle: { fontSize: normalize(11), fontWeight: '800', color: '#2d3436', textTransform: 'uppercase', flex: 1 },
    balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: wp(1.5), marginBottom: hp(1.8) },
    bigNumber: { fontSize: normalize(24), fontWeight: 'bold', color: '#48327d' },
    daysLabel: { fontSize: normalize(12), color: '#636e72', paddingBottom: hp(0.5), fontWeight: '500' },
    progressSection: { gap: hp(0.8) },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
    progressText: { fontSize: normalize(11), color: '#636e72', fontWeight: '500' },
    track: { height: hp(0.8), backgroundColor: '#f1f2f6', borderRadius: normalize(3), overflow: 'hidden' },
    fill: { height: '100%', borderRadius: normalize(3) },

    sectionHeader: { marginBottom: hp(1.2) },
    sectionTitle: { fontSize: normalize(16), fontWeight: 'bold', color: '#2d3436' },

    // History
    historyList: { gap: hp(1.2) },
    historyItem: { backgroundColor: 'white', padding: wp(4), borderRadius: normalize(10), flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f2f6' },
    historyLeft: { gap: hp(0.5) },
    leaveType: { fontWeight: 'bold', color: '#2d3436', fontSize: normalize(14) },
    leaveDates: { fontSize: normalize(12), color: '#636e72' },
    historyRight: { alignItems: 'flex-end', gap: hp(0.5) },
    statusBadge: { paddingHorizontal: wp(2), paddingVertical: hp(0.2), borderRadius: normalize(4) },
    statusText: { fontSize: normalize(11), fontWeight: 'bold' },
    daysCount: { fontSize: normalize(11), color: '#b2bec3', fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#636e72', marginTop: hp(2.5) },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: wp(5) },
    modalContent: { backgroundColor: 'white', borderRadius: normalize(12), padding: 0, overflow: 'hidden', maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: wp(5), borderBottomWidth: 1, borderBottomColor: '#f1f2f6', backgroundColor: '#f8fafc' },
    modalTitle: { fontSize: normalize(16), fontWeight: 'bold', color: '#2d3436', textTransform: 'uppercase' },
    closeText: { fontSize: normalize(20), color: '#636e72' },

    formContainer: { padding: wp(5) },
    inputLabel: { fontSize: normalize(11), fontWeight: 'bold', color: '#636e72', marginBottom: hp(0.8), marginTop: hp(1.8), textTransform: 'uppercase' },
    input: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8), padding: wp(2.5), color: '#2d3436', backgroundColor: '#fdfdfd' },

    // Session Buttons
    sessionRow: { flexDirection: 'row', gap: wp(2.5) },
    sessionBtn: { flex: 1, paddingVertical: hp(1), borderRadius: normalize(6), borderWidth: 1, borderColor: '#dfe6e9', alignItems: 'center' },
    sessionBtnActive: { backgroundColor: '#48327d', borderColor: '#48327d' },
    sessionBtnText: { fontSize: normalize(11), fontWeight: 'bold', color: '#636e72' },
    sessionBtnTextActive: { color: 'white' },

    // Dropdown
    dropdownButton: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8), padding: wp(3), backgroundColor: '#fdfdfd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: { fontSize: normalize(14), color: '#2d3436' },

    dateInput: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8), padding: wp(2.5), backgroundColor: '#fdfdfd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: normalize(14), color: '#2d3436' },

    pickerContent: { backgroundColor: 'white', borderRadius: normalize(12), marginHorizontal: wp(10), marginTop: hp(25), elevation: 20, padding: wp(2.5) },
    pickerItem: { paddingVertical: hp(1.5), paddingHorizontal: wp(4), borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    selectedPickerItem: { backgroundColor: '#636e72' },
    pickerItemText: { fontSize: normalize(16), color: '#2d3436' },
    selectedPickerItemText: { color: 'white', fontWeight: 'bold' },

    submitBtn: { backgroundColor: '#48327d', paddingVertical: hp(1.8), borderRadius: normalize(10), marginTop: hp(3), alignItems: 'center', shadowColor: '#48327d', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 } },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: normalize(16) },

    cancelBtn: { padding: wp(2.5) },
    cancelBtnText: { color: '#636e72' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: hp(2.5), gap: wp(2.5) },
});

export default LeaveScreen;
