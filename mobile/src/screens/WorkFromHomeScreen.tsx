import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { wfhApi, authApi } from '../services/api';
import CustomDatePicker from '../components/CustomDatePicker';
import { CalendarIcon, PlaneIcon } from '../components/Icons';
import { normalize, wp, hp } from '../utils/responsive';

const WorkFromHomeScreen = ({ user, isModalVisible, setIsModalVisible }: { user: any, isModalVisible: boolean, setIsModalVisible: (v: boolean) => void }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Form State
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [notifyTo, setNotifyTo] = useState<string[]>([]);

    // Date Picker State
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [activeDateInput, setActiveDateInput] = useState<'from' | 'to' | null>(null);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchRequests();
            authApi.getProfile(user.id).then(setProfile).catch(console.log);
        }
    }, [user?.id]);

    const fetchRequests = async () => {
        try {
            const data = await wfhApi.getRequests(user.id);
            setRequests(data);
        } catch (error) {
            console.log("Failed to fetch WFH requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!fromDate) {
            Alert.alert("Validation", "From Date is required");
            return;
        }
        if (!toDate) {
            Alert.alert("Validation", "To Date is required");
            return;
        }
        if (!reason.trim()) {
            Alert.alert("Validation", "Reason is required");
            return;
        }
        if (notifyTo.length === 0) {
            Alert.alert("Validation", "Please select at least one recipient in Notify To");
            return;
        }

        // Client-side validation: Check for Sundays in the date range
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // Check if it's a Sunday (getDay() returns 0 for Sunday)
            if (currentDate.getDay() === 0) {
                const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = currentDate.toLocaleDateString('en-US', options);
                Alert.alert(
                    "Invalid Date",
                    `WFH requests are not allowed on Sundays. ${formattedDate} is a Sunday.`
                );
                return;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setIsSubmitting(true);
        try {
            await wfhApi.apply({
                employeeId: user.id,
                fromDate,
                toDate,
                reason: reason.trim(),
                notifyTo: notifyTo.join(', ')
            });
            Alert.alert("Success", "WFH Request submitted successfully");
            setIsModalVisible(false);
            setFromDate('');
            setToDate('');
            setReason('');
            setNotifyTo([]);
            fetchRequests();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDatePicker = (field: 'from' | 'to') => {
        setActiveDateInput(field);
        setDatePickerVisible(true);
    };

    const handleDateSelect = (date: string) => {
        if (activeDateInput === 'from') setFromDate(date);
        if (activeDateInput === 'to') setToDate(date);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return '#2ecc71';
            case 'Rejected': return '#e74c3c';
            default: return '#f39c12';
        }
    };

    return (
        <View style={styles.container}>

            {loading ? (
                <ActivityIndicator size="large" color="#48327d" style={{ marginTop: 20 }} />
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#48327d']} />}
                >
                    {requests.length === 0 ? (
                        <Text style={styles.emptyText}>No WFH requests found.</Text>
                    ) : (
                        <View style={styles.list}>
                            {requests.map((req) => (
                                <View key={req.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.dateRange}>{formatDate(req.from_date)} - {formatDate(req.to_date)}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) + '20' }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.reason} numberOfLines={2}>{req.reason}</Text>
                                    <Text style={styles.appliedOn}>Applied on: {formatDate(req.applied_on)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Apply for Work From Home</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.formContainer}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        >
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>FROM DATE *</Text>
                                    <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('from')}>
                                        <Text style={[styles.dateText, !fromDate && { color: '#b2bec3' }]}>{fromDate || 'Select'}</Text>
                                        <CalendarIcon color="#64748b" size={18} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>TO DATE *</Text>
                                    <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('to')}>
                                        <Text style={[styles.dateText, !toDate && { color: '#b2bec3' }]}>{toDate || 'Select'}</Text>
                                        <CalendarIcon color="#64748b" size={18} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>REASON *</Text>
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Why do you need to work from home?"
                                multiline
                            />

                            {/* Notify To */}
                            <Text style={styles.inputLabel}>NOTIFY TO *</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8, padding: 8, backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#dfe6e9', borderRadius: 8, minHeight: 40 }}>
                                {notifyTo.length === 0 && <Text style={{ color: '#b2bec3', fontSize: 12 }}>Select recipients...</Text>}
                                {notifyTo.map(p => (
                                    <TouchableOpacity key={p} onPress={() => setNotifyTo(notifyTo.filter(x => x !== p))} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#48327d', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 4 }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', marginRight: 4 }}>{p}</Text>
                                        <Text style={{ color: 'white', fontSize: 10 }}>✕</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                                {(() => {
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
                                                style={{ backgroundColor: '#f1f2f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                                            >
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#48327d' }}>+ {name}</Text>
                                            </TouchableOpacity>
                                        ));
                                })()}
                            </View>

                            <TouchableOpacity
                                onPress={handleApply}
                                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
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
    actionHeader: { padding: wp(4), alignItems: 'flex-end' },
    addButton: { backgroundColor: '#48327d', paddingHorizontal: wp(4), paddingVertical: hp(1.2), borderRadius: normalize(8) },
    addButtonText: { color: 'white', fontWeight: 'bold', fontSize: normalize(12) },
    emptyText: { textAlign: 'center', color: '#636e72', marginTop: hp(5) },
    list: { padding: wp(4), gap: hp(1.5) },
    card: { backgroundColor: 'white', padding: wp(4), borderRadius: normalize(12), borderWidth: 1, borderColor: '#e2e8f0' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1) },
    dateRange: { fontWeight: 'bold', color: '#2d3436', fontSize: normalize(14) },
    statusBadge: { paddingHorizontal: wp(2), paddingVertical: hp(0.3), borderRadius: normalize(4) },
    statusText: { fontSize: normalize(10), fontWeight: 'bold' },
    reason: { color: '#636e72', fontSize: normalize(13), marginBottom: hp(1) },
    appliedOn: { color: '#b2bec3', fontSize: normalize(11) },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: wp(5) },
    modalContent: { backgroundColor: 'white', borderRadius: normalize(12), overflow: 'hidden', maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: wp(5), borderBottomWidth: 1, borderBottomColor: '#f1f2f6', backgroundColor: '#f8fafc' },
    modalTitle: { fontSize: normalize(16), fontWeight: 'bold', color: '#2d3436' },
    closeText: { fontSize: normalize(20), color: '#636e72' },
    formContainer: { padding: wp(5) },
    inputLabel: { fontSize: normalize(11), fontWeight: 'bold', color: '#636e72', marginBottom: hp(0.8), marginTop: hp(1.8) },
    input: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8), padding: wp(2.5), color: '#2d3436', backgroundColor: '#fdfdfd' },
    dateInput: { borderWidth: 1, borderColor: '#dfe6e9', borderRadius: normalize(8), padding: wp(2.5), backgroundColor: '#fdfdfd', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateText: { fontSize: normalize(14), color: '#2d3436' },
    submitBtn: { backgroundColor: '#48327d', paddingVertical: hp(1.8), borderRadius: normalize(10), marginTop: hp(3), alignItems: 'center' },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: normalize(16) },
});

export default WorkFromHomeScreen;
