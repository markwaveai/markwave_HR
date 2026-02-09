import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Pressable, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { leaveApi, authApi } from '../services/api';
import CustomDatePicker from '../components/CustomDatePicker';
import LeaveBalanceCard from '../components/LeaveBalanceCard';

const LeaveScreen = ({ user }: { user: any }) => {
    const [history, setHistory] = useState<any[]>([]);
    // balances state removed
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);

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
        'cl': { name: 'Casual Leave', code: 'cl', icon: '✈️', color: '#3498db', bg: '#e0f2fe' },
        'sl': { name: 'Sick Leave', code: 'sl', icon: '🌡️', color: '#e74c3c', bg: '#fee2e2' },
        'el': { name: 'Earned Leave', code: 'el', icon: '🌴', color: '#2ecc71', bg: '#dcfce7' },
        'scl': { name: 'Special Casual Leave', code: 'scl', icon: '🌟', color: '#9b59b6', bg: '#f3e5f5' },
        'bl': { name: 'Bereavement Leave', code: 'bl', icon: '🕯️', color: '#e67e22', bg: '#fff3e0' },
        'pl': { name: 'Paternity Leave', code: 'pl', icon: '👶', color: '#1abc9c', bg: '#e0f2f1' },
        'll': { name: 'Long Leave', code: 'll', icon: '🏠', color: '#34495e', bg: '#eceff1' },
        'co': { name: 'Comp Off', code: 'co', icon: '⏳', color: '#f1c40f', bg: '#fffde7' }
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

    useEffect(() => {
        fetchLeaves();
        fetchBalance();
        if (EMPLOYEE_ID) {
            authApi.getProfile(EMPLOYEE_ID).then(p => setProfile(p)).catch(console.log);
        }
    }, [EMPLOYEE_ID]);

    // calculateBalances removed as it is handled in LeaveBalanceCard

    const handleApply = async () => {
        if (!fromDate || !reason || notifyTo.length === 0) {
            Alert.alert("Validation", "Please fill all required fields (Dates, Reason, Notify To)");
            return;
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
            Alert.alert("Error", msg);
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
                <Pressable
                    onPress={() => {
                        console.log('Request Leave button pressed!');
                        setIsModalVisible(true);
                    }}
                    style={({ pressed }) => [
                        styles.addButton,
                        pressed && { opacity: 0.7 }
                    ]}
                >
                    <Text style={styles.addButtonText}>+ Request Leave</Text>
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }}
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

                        <ScrollView style={styles.formContainer}>
                            {/* Leave Type Dropdown */}
                            <Text style={styles.inputLabel}>LEAVE TYPE *</Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setIsTypePickerVisible(true)}
                            >
                                <Text style={styles.dropdownText}>
                                    {getLeaveLabel(leaveType)}
                                </Text>
                                <Text style={{ fontSize: 12, color: '#636e72' }}>▼</Text>
                            </TouchableOpacity>

                            {/* Dates */}
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>FROM DATE *</Text>
                                    <TouchableOpacity
                                        style={styles.dateInput}
                                        onPress={() => openDatePicker('from')}
                                    >
                                        <Text style={[styles.dateText, !fromDate && { color: '#b2bec3' }]}>
                                            {fromDate || 'Select Date'}
                                        </Text>
                                        <Text style={{ fontSize: 16 }}>📅</Text>
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
                                        <Text style={{ fontSize: 16 }}>📅</Text>
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
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Briefly describe the reason..."
                                multiline
                            />

                            {/* Notify To */}
                            <Text style={styles.inputLabel}>NOTIFY TO *</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8, padding: 8, backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#dfe6e9', borderRadius: 8 }}>
                                {notifyTo.length === 0 && <Text style={{ color: '#b2bec3', fontSize: 12 }}>Select notification recipients...</Text>}
                                {notifyTo.map(p => (
                                    <TouchableOpacity key={p} onPress={() => setNotifyTo(notifyTo.filter(x => x !== p))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#48327d', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginRight: 4 }}>{p}</Text>
                                        <Text style={{ color: 'white', fontSize: 10 }}>✕</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {[
                                    user?.team_lead_name || profile?.team_lead_name || 'Team Lead',
                                    profile?.project_manager_name,
                                    profile?.advisor_name
                                ].filter(name => name && !notifyTo.includes(name)).map(name => (
                                    <TouchableOpacity
                                        key={name}
                                        onPress={() => setNotifyTo([...notifyTo, name])}
                                        style={{ backgroundColor: '#f1f2f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                                    >
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#48327d' }}>+ {name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                onPress={handleApply}
                                style={[styles.submitBtn, (!(fromDate && toDate && reason.trim()) || isSubmitting) && { opacity: 0.5 }]}
                                disabled={!(fromDate && toDate && reason.trim()) || isSubmitting}
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
                            .filter((item: any) => apiBalance?.hasOwnProperty(item.code) || ['cl', 'sl'].includes(item.code))
                            .map((item: any) => (
                                <TouchableOpacity
                                    key={item.code}
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setLeaveType(item.code);
                                        setIsTypePickerVisible(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemText}>{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <CustomDatePicker
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={handleDateSelect}
                value={activeDateInput === 'from' ? fromDate : toDate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    header: { padding: 20, paddingTop: 40, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
    headerSubtitle: { fontSize: 12, color: '#636e72', marginTop: 2 },
    addButton: { backgroundColor: '#48327d', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, shadowColor: '#48327d', shadowOpacity: 0.2, shadowOffset: { height: 2, width: 0 }, elevation: 5, zIndex: 999 },
    addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    scrollContainer: { padding: 20 },

    // Balance Grid
    balanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 25,
        justifyContent: 'space-between'
    },
    balanceCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    iconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    balanceTitle: { fontSize: 11, fontWeight: '800', color: '#2d3436', textTransform: 'uppercase', flex: 1 },
    balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: 15 },
    bigNumber: { fontSize: 24, fontWeight: 'bold', color: '#48327d' },
    daysLabel: { fontSize: 12, color: '#636e72', paddingBottom: 4, fontWeight: '500' },
    progressSection: { gap: 6 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
    progressText: { fontSize: 11, color: '#636e72', fontWeight: '500' },
    track: { height: 6, backgroundColor: '#f1f2f6', borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3 },

    sectionHeader: { marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3436' },

    // History
    historyList: { gap: 10 },
    historyItem: { backgroundColor: 'white', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#f1f2f6' },
    historyLeft: { gap: 4 },
    leaveType: { fontWeight: 'bold', color: '#2d3436', fontSize: 14 },
    leaveDates: { fontSize: 12, color: '#636e72' },
    historyRight: { alignItems: 'flex-end', gap: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    daysCount: { fontSize: 11, color: '#b2bec3', fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#636e72', marginTop: 20 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 0, overflow: 'hidden', maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f2f6', backgroundColor: '#f8fafc' },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#2d3436', textTransform: 'uppercase' },
    closeText: { fontSize: 20, color: '#636e72' },

    formContainer: { padding: 20 },
    inputLabel: { fontSize: 11, fontWeight: 'bold', color: '#636e72', marginBottom: 6, marginTop: 15, textTransform: 'uppercase' },
    input: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: 8, padding: 10, color: '#2d3436', backgroundColor: '#fdfdfd' },

    // Session Buttons
    sessionRow: { flexDirection: 'row', gap: 10 },
    sessionBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#dfe6e9', alignItems: 'center' },
    sessionBtnActive: { backgroundColor: '#48327d', borderColor: '#48327d' },
    sessionBtnText: { fontSize: 11, fontWeight: 'bold', color: '#636e72' },
    sessionBtnTextActive: { color: 'white' },

    // Dropdown
    dropdownButton: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: 8, padding: 12, backgroundColor: '#fdfdfd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: { fontSize: 14, color: '#2d3436' },

    dateInput: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: 8, padding: 10, backgroundColor: '#fdfdfd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: 14, color: '#2d3436' },

    pickerContent: { backgroundColor: 'white', borderRadius: 12, marginHorizontal: 40, marginTop: 200, elevation: 20, padding: 10 },
    pickerItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    pickerItemText: { fontSize: 16, color: '#2d3436' },

    submitBtn: { backgroundColor: '#48327d', paddingVertical: 14, borderRadius: 10, marginTop: 24, alignItems: 'center', shadowColor: '#48327d', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 } },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    cancelBtn: { padding: 10 },
    cancelBtnText: { color: '#636e72' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
});

export default LeaveScreen;
