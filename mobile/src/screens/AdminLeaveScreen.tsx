
import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
    ActivityIndicator, Modal, TextInput, Pressable
} from 'react-native';
import { leaveApi, authApi, attendanceApi } from '../services/api';
import AdminWorkFromHomeScreen from './AdminWorkFromHomeScreen';
import { normalize, wp, hp } from '../utils/responsive';
import CustomDatePicker from '../components/CustomDatePicker';
import {
    CalendarIcon, PlaneIcon, ThermometerIcon, PalmTreeIcon,
    StarIcon, FlameIcon, BabyIcon, HomeIcon, HourglassIcon, BanIcon
} from '../components/Icons';

interface AdminLeaveScreenProps {
    user?: any;
}

const AdminLeaveScreen: React.FC<AdminLeaveScreenProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'leave' | 'wfh' | 'history'>('leave');
    const [leaves, setLeaves] = useState<any[]>([]);
    const [myHistory, setMyHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    // Apply Leave Modal State
    const [applyModalVisible, setApplyModalVisible] = useState(false);
    console.log('AdminLeaveScreen Render. ApplyModalVisible:', applyModalVisible);

    const [leaveType, setLeaveType] = useState('cl');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [fromSession, setFromSession] = useState('Full Day');
    const [toSession, setToSession] = useState('Full Day');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTypePickerVisible, setIsTypePickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [activeDateInput, setActiveDateInput] = useState<'from' | 'to' | null>(null);
    const [apiBalance, setApiBalance] = useState<any>({});
    const [holidays, setHolidays] = useState<any[]>([]);

    const EMPLOYEE_ID = user?.id || user?.employee_id;

    const LEAVE_CONFIG: any = {
        'cl': { name: 'Casual Leave', code: 'cl', color: '#3498db' },
        'sl': { name: 'Sick Leave', code: 'sl', color: '#e74c3c' },
        'el': { name: 'Earned Leave', code: 'el', color: '#2ecc71' },
        'scl': { name: 'Special Casual Leave', code: 'scl', color: '#9b59b6' },
        'bl': { name: 'Bereavement Leave', code: 'bl', color: '#e67e22' },
        'pl': { name: 'Paternity Leave', code: 'pl', color: '#1abc9c' },
        'll': { name: 'Long Leave', code: 'll', color: '#34495e' },
        'co': { name: 'Comp Off', code: 'co', color: '#f1c40f' },
        'lwp': { name: 'Leave Without Pay', code: 'lwp', color: '#95a5a6' },
    };

    useEffect(() => {
        fetchPendingLeaves();
        if (EMPLOYEE_ID) {
            leaveApi.getBalance(EMPLOYEE_ID).then(setApiBalance).catch(() => { });
            fetchMyHistory();
        }
        attendanceApi.getHolidays().then(setHolidays).catch(() => setHolidays([]));
    }, []);

    const fetchMyHistory = async () => {
        if (!EMPLOYEE_ID) return;
        setHistoryLoading(true);
        try {
            const data = await leaveApi.getLeaves(EMPLOYEE_ID);
            setMyHistory(data);
        } catch (error) {
            console.log('Failed to fetch leave history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchPendingLeaves = async () => {
        try {
            const data = await leaveApi.getPending();
            setLeaves(data);
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to fetch leave requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: string) => {
        setActionLoading(id);
        try {
            await leaveApi.action(id, action);
            Alert.alert("Success", `Leave request ${action}d successfully`);
            setLeaves(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            Alert.alert("Error", `Failed to ${action} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusColor = (type: string) => {
        switch (type) {
            case 'cl': return '#3498db';
            case 'sl': return '#e74c3c';
            case 'el': return '#2ecc71';
            default: return '#95a5a6';
        }
    };

    const isDateDisabled = (dateStr: string) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (d.getDay() === 0) return true;
        return holidays.some(h => (h.raw_date || h.date) === dateStr);
    };

    const openDatePicker = (field: 'from' | 'to') => {
        setActiveDateInput(field);
        setDatePickerVisible(true);
    };

    const handleDateSelect = (date: string) => {
        if (activeDateInput === 'from') setFromDate(date);
        if (activeDateInput === 'to') setToDate(date);
    };

    const getLeaveDropdownLabel = (code: string) => {
        const config = LEAVE_CONFIG[code];
        if (!config) return code.toUpperCase();
        if (code === 'lwp') return config.name.toUpperCase();
        const balance = apiBalance[code] !== undefined ? apiBalance[code] : 0;
        return `${config.name.toUpperCase()} (${balance} Remaining)`;
    };

    const resetApplyForm = () => {
        setLeaveType('cl');
        setFromDate('');
        setToDate('');
        setReason('');
        setFromSession('Full Day');
        setToSession('Full Day');
    };

    const handleApplyLeave = async () => {
        if (!fromDate || !reason.trim()) {
            Alert.alert("Validation", "Please fill all required fields (Dates, Reason)");
            return;
        }
        if (!EMPLOYEE_ID) {
            Alert.alert("Error", "User session invalid. Please re-login.");
            return;
        }

        // Validate Range for Sundays and Holidays
        const start = new Date(fromDate);
        const effectiveToDate = toDate || fromDate;
        const end = new Date(effectiveToDate);

        if (end < start) {
            Alert.alert("Error", "To Date cannot be earlier than From Date.");
            return;
        }

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

        setIsSubmitting(true);
        try {
            const diff = end.getTime() - start.getTime();
            let days = Math.ceil(diff / (1000 * 3600 * 24)) + 1;

            // Adjust for Sunday? No, we already rejected range if it includes Sunday. 
            // But if we allowed spanning (which we don't now), we would calc days excluding Sun.
            // Since we block restricted days, current calc is valid for strictly working days range.

            if (fromDate === effectiveToDate) {
                if (fromSession !== 'Full Day') days = 0.5;
            } else {
                if (fromSession !== 'Full Day') days -= 0.5;
                if (toSession !== 'Full Day') days -= 0.5;
            }

            const response = await leaveApi.apply({
                employeeId: EMPLOYEE_ID,
                type: leaveType,
                fromDate,
                toDate: effectiveToDate,
                days: days > 0 ? days : 0.5,
                reason: reason.trim(),
                notifyTo: '',
                created_at: new Date().toISOString(),
            });

            Alert.alert("Success", response.message || "Leave applied successfully!");
            setApplyModalVisible(false);
            resetApplyForm();
            fetchMyHistory(); // Refresh history tab
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to apply leave";
            Alert.alert("Error", msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#48327d" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.headerTitle}>Leave & WFH Management</Text>
                    <Text style={styles.headerSubtitle}>Review pending requests</Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        console.log('Apply Leave Clicked. Setting Visible to True.');
                        setApplyModalVisible(true);
                    }}
                    style={styles.applyBtn}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    activeOpacity={0.7}
                >
                    <Text style={styles.applyBtnText}>+ Apply Leave</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                <TouchableOpacity
                    onPress={() => setActiveTab('leave')}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'leave' ? '#48327d' : 'transparent' }}
                >
                    <Text style={{ color: activeTab === 'leave' ? '#48327d' : '#636e72', fontWeight: 'bold', fontSize: normalize(11) }}>LEAVES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('wfh')}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'wfh' ? '#48327d' : 'transparent' }}
                >
                    <Text style={{ color: activeTab === 'wfh' ? '#48327d' : '#636e72', fontWeight: 'bold', fontSize: normalize(11) }}>WFH</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('history')}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'history' ? '#48327d' : 'transparent' }}
                >
                    <Text style={{ color: activeTab === 'history' ? '#48327d' : '#636e72', fontWeight: 'bold', fontSize: normalize(11) }}>MY HISTORY</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'wfh' ? (
                <AdminWorkFromHomeScreen />
            ) : activeTab === 'history' ? (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {historyLoading ? (
                        <ActivityIndicator size="large" color="#48327d" style={{ marginTop: hp(5) }} />
                    ) : myHistory.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No leave history found</Text>
                        </View>
                    ) : (
                        myHistory.map((item, index) => {
                            const statusColor = item.status === 'Approved' ? '#2ecc71' : item.status === 'Rejected' ? '#e74c3c' : '#f39c12';
                            const leaveLabel = LEAVE_CONFIG[item.type?.toLowerCase()]?.name || item.type?.toUpperCase() || 'Leave';
                            return (
                                <View key={index} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.employeeName}>{leaveLabel}</Text>
                                            <Text style={styles.employeeId}>
                                                {item.fromDate === item.toDate ? item.fromDate : `${item.fromDate} → ${item.toDate}`}
                                            </Text>
                                        </View>
                                        <View style={[styles.typeBadge, { backgroundColor: statusColor + '20' }]}>
                                            <Text style={[styles.typeText, { color: statusColor }]}>{item.status?.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.datesRow}>
                                        <Text style={styles.reasonText} numberOfLines={2}>{item.reason || 'No reason provided'}</Text>
                                        <Text style={styles.daysText}>{item.days} Day{item.days > 1 ? 's' : ''}</Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {leaves.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No pending requests</Text>
                        </View>
                    ) : (
                        leaves.map((leave, index) => (
                            <View key={index} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={styles.employeeName}>{leave.employee_name}</Text>
                                        <Text style={styles.employeeId}>ID: {leave.employee_id}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <View style={[styles.typeBadge, { backgroundColor: getStatusColor(leave.type) + '20' }]}>
                                            <Text style={[styles.typeText, { color: getStatusColor(leave.type) }]}>
                                                {leave.type.toUpperCase()}
                                            </Text>
                                        </View>
                                        {leave.is_overridden && (
                                            <View style={[styles.typeBadge, { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1 }]}>
                                                <Text style={[styles.typeText, { color: '#d97706' }]}>Checked In</Text>
                                            </View>
                                        )}
                                        {leave.overrides && leave.overrides.some((ov: any) => ov.status === 'Pending') && (
                                            <View style={[styles.typeBadge, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff', borderWidth: 1 }]}>
                                                <Text style={[styles.typeText, { color: '#9333ea' }]}>Pending Override</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.datesRow}>
                                    <Text style={styles.dateText}>
                                        {leave.fromDate === leave.toDate ? leave.fromDate : `${leave.fromDate} to ${leave.toDate}`}
                                    </Text>
                                    <Text style={styles.daysText}>{leave.days} Day{leave.days > 1 ? 's' : ''}</Text>
                                </View>

                                <Text style={styles.reasonText} numberOfLines={2}>
                                    {leave.reason}
                                </Text>

                                {leave.status === 'Pending' && (
                                    <View style={styles.actionsRow}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.rejectButton]}
                                            onPress={() => handleAction(leave.id, 'Reject')}
                                            disabled={actionLoading === leave.id}
                                        >
                                            <Text style={styles.rejectButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.approveButton]}
                                            onPress={() => handleAction(leave.id, 'Approve')}
                                            disabled={actionLoading === leave.id}
                                        >
                                            <Text style={styles.approveButtonText}>Approve</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {(leave.status === 'Approved' || leave.is_overridden) && (
                                    <View style={styles.actionsRow}>
                                        {leave.overrides && leave.overrides.some((ov: any) => ov.status === 'Pending') && (
                                            <>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { backgroundColor: '#f1f5f9' }]}
                                                    onPress={() => handleAction(leave.id, 'RejectOverride')}
                                                    disabled={actionLoading === leave.id}
                                                >
                                                    <Text style={[styles.rejectButtonText, { color: '#475569' }]}>Reject Over...</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, { backgroundColor: '#9333ea' }]}
                                                    onPress={() => handleAction(leave.id, 'ApproveOverride')}
                                                    disabled={actionLoading === leave.id}
                                                >
                                                    <Text style={[styles.approveButtonText, { color: 'white' }]}>Approve Over...</Text>
                                                </TouchableOpacity>
                                            </>
                                        )}
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#fee2e2' }]} // light red background for cancel
                                            onPress={() => handleAction(leave.id, 'Cancel')}
                                            disabled={actionLoading === leave.id}
                                        >
                                            <Text style={[styles.rejectButtonText, { color: '#e74c3c' }]}>Cancel Leave</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Apply Leave Modal */}
            <Modal
                visible={applyModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => { setApplyModalVisible(false); resetApplyForm(); }}
                onShow={() => console.log('Modal onShow triggered')}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Apply for Leave</Text>
                            <TouchableOpacity onPress={() => { setApplyModalVisible(false); resetApplyForm(); }}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 40 }}>
                            {/* Leave Type */}
                            <Text style={styles.inputLabel}>LEAVE TYPE *</Text>
                            <TouchableOpacity
                                style={styles.dropdownButton}
                                onPress={() => setIsTypePickerVisible(true)}
                            >
                                <Text style={styles.dropdownText}>{getLeaveDropdownLabel(leaveType)}</Text>
                            </TouchableOpacity>

                            {/* Dates */}
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>FROM DATE *</Text>
                                    <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('from')}>
                                        <Text style={[styles.dateText, !fromDate && { color: '#b2bec3' }]}>
                                            {fromDate || 'Select Date'}
                                        </Text>
                                        <CalendarIcon color="#64748b" size={normalize(18)} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>TO DATE</Text>
                                    <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('to')}>
                                        <Text style={[styles.dateText, !toDate && { color: '#b2bec3' }]}>
                                            {toDate || 'Select Date'}
                                        </Text>
                                        <CalendarIcon color="#64748b" size={normalize(18)} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Session */}
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
                            ) : toDate && fromDate !== toDate ? (
                                <>
                                    <Text style={styles.inputLabel}>START SESSION *</Text>
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
                                    <Text style={styles.inputLabel}>END SESSION *</Text>
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
                            ) : null}

                            <Text style={styles.inputLabel}>REASON *</Text>
                            <TextInput
                                style={[styles.input, { height: hp(10), textAlignVertical: 'top' }]}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Briefly describe the reason..."
                                multiline
                            />

                            <TouchableOpacity
                                onPress={handleApplyLeave}
                                style={[styles.submitBtn, (!fromDate || !reason.trim() || isSubmitting) && { opacity: 0.5 }]}
                                disabled={!fromDate || !reason.trim() || isSubmitting}
                            >
                                <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Leave Type Picker */}
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
                        {Object.values(LEAVE_CONFIG).map((item: any) => {
                            const isSelected = item.code === leaveType;
                            return (
                                <TouchableOpacity
                                    key={item.code}
                                    style={[styles.pickerItem, isSelected && styles.selectedPickerItem]}
                                    onPress={() => { setLeaveType(item.code); setIsTypePickerVisible(false); }}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: wp(5), paddingTop: hp(5), backgroundColor: 'white',
        borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    headerTitle: { fontSize: normalize(20), fontWeight: 'bold', color: '#2d3436' },
    headerSubtitle: { fontSize: normalize(12), color: '#636e72', marginTop: hp(0.3) },

    applyBtn: {
        backgroundColor: '#48327d', paddingHorizontal: wp(3.5), paddingVertical: hp(1.2),
        borderRadius: normalize(8), elevation: 3, zIndex: 999
    },
    applyBtnText: { color: 'white', fontWeight: 'bold', fontSize: normalize(12) },

    listContainer: { padding: wp(3.8), gap: hp(1.8) },
    emptyContainer: { padding: hp(5), alignItems: 'center' },
    emptyText: { color: '#b2bec3', fontSize: normalize(16) },

    card: {
        backgroundColor: 'white', borderRadius: normalize(12), padding: wp(4),
        borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000',
        shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, marginBottom: hp(1.8)
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hp(1.5) },
    employeeName: { fontSize: normalize(16), fontWeight: 'bold', color: '#2d3436' },
    employeeId: { fontSize: normalize(12), color: '#636e72', fontFamily: 'monospace' },
    typeBadge: { paddingHorizontal: wp(2), paddingVertical: hp(0.5), borderRadius: normalize(6) },
    typeText: { fontSize: normalize(10), fontWeight: 'bold' },
    datesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1) },
    dateText: { fontSize: normalize(13), color: '#2d3436', fontWeight: '500' },
    daysText: { fontSize: normalize(13), color: '#48327d', fontWeight: 'bold' },
    reasonText: { fontSize: normalize(12), color: '#636e72', marginBottom: hp(2), fontStyle: 'italic' },
    actionsRow: { flexDirection: 'row', gap: wp(2.5) },
    actionButton: { flex: 1, paddingVertical: hp(1.2), borderRadius: normalize(8), alignItems: 'center' },
    rejectButton: { backgroundColor: '#fee2e2' },
    rejectButtonText: { color: '#e74c3c', fontWeight: 'bold', fontSize: normalize(13) },
    approveButton: { backgroundColor: '#dcfce7' },
    approveButtonText: { color: '#2ecc71', fontWeight: 'bold', fontSize: normalize(13) },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: wp(5) },
    modalContent: { backgroundColor: 'white', borderRadius: normalize(12), overflow: 'hidden', maxHeight: '90%' },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', padding: wp(5),
        borderBottomWidth: 1, borderBottomColor: '#f1f2f6', backgroundColor: '#f8fafc'
    },
    modalTitle: { fontSize: normalize(16), fontWeight: 'bold', color: '#2d3436', textTransform: 'uppercase' },
    closeText: { fontSize: normalize(20), color: '#636e72' },
    formContainer: { padding: wp(5) },
    inputLabel: {
        fontSize: normalize(11), fontWeight: 'bold', color: '#636e72',
        marginBottom: hp(0.8), marginTop: hp(1.8), textTransform: 'uppercase'
    },
    input: {
        borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8),
        padding: wp(2.5), color: '#2d3436', backgroundColor: '#fdfdfd'
    },
    dropdownButton: {
        borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8),
        padding: wp(3), backgroundColor: '#fdfdfd'
    },
    dropdownText: { fontSize: normalize(14), color: '#2d3436' },
    dateInput: {
        borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8),
        padding: wp(2.5), backgroundColor: '#fdfdfd',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    sessionRow: { flexDirection: 'row', gap: wp(2.5) },
    sessionBtn: {
        flex: 1, paddingVertical: hp(1), borderRadius: normalize(6),
        borderWidth: 1, borderColor: '#dfe6e9', alignItems: 'center'
    },
    sessionBtnActive: { backgroundColor: '#48327d', borderColor: '#48327d' },
    sessionBtnText: { fontSize: normalize(11), fontWeight: 'bold', color: '#636e72' },
    sessionBtnTextActive: { color: 'white' },
    submitBtn: {
        backgroundColor: '#48327d', paddingVertical: hp(1.8), borderRadius: normalize(10),
        marginTop: hp(3), alignItems: 'center'
    },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: normalize(16) },

    pickerContent: {
        backgroundColor: 'white', borderRadius: normalize(12),
        marginHorizontal: wp(5), elevation: 20, padding: wp(2.5)
    },
    pickerItem: { paddingVertical: hp(1.5), paddingHorizontal: wp(4), borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
    selectedPickerItem: { backgroundColor: '#48327d' },
    pickerItemText: { fontSize: normalize(14), color: '#2d3436' },
    selectedPickerItemText: { color: 'white', fontWeight: 'bold' },
});

export default AdminLeaveScreen;
