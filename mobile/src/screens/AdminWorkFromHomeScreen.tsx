import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { wfhApi } from '../services/api';
import { normalize, wp, hp } from '../utils/responsive';

const AdminWorkFromHomeScreen = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const data = await wfhApi.getPending();
            setRequests(data);
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to fetch WFH requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: 'Approve' | 'Reject') => {
        setActionLoading(id);
        try {
            await wfhApi.action(id, action);
            Alert.alert("Success", `Request ${action}d successfully`);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            Alert.alert("Error", `Failed to ${action} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
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
            <ScrollView
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#48327d']} />}
            >
                {requests.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No pending WFH requests</Text>
                    </View>
                ) : (
                    requests.map((req, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.employeeName}>{req.employee_name}</Text>
                                    <Text style={styles.employeeId}>ID: {req.employee_id}</Text>
                                </View>
                                <Text style={styles.appliedOn}>{formatDate(req.applied_on)}</Text>
                            </View>

                            <View style={styles.datesRow}>
                                <Text style={styles.dateText}>
                                    {formatDate(req.from_date)} - {formatDate(req.to_date)}
                                </Text>
                            </View>

                            <Text style={styles.reasonText} numberOfLines={2}>
                                {req.reason}
                            </Text>

                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => handleAction(req.id, 'Reject')}
                                    disabled={actionLoading === req.id}
                                >
                                    <Text style={styles.rejectButtonText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton]}
                                    onPress={() => handleAction(req.id, 'Approve')}
                                    disabled={actionLoading === req.id}
                                >
                                    <Text style={styles.approveButtonText}>Approve</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: wp(4), gap: hp(2) },
    emptyContainer: { padding: wp(10), alignItems: 'center' },
    emptyText: { color: '#b2bec3', fontSize: normalize(16) },

    card: { backgroundColor: 'white', borderRadius: normalize(12), padding: wp(4), borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, marginBottom: hp(2) },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: hp(1.5) },
    employeeName: { fontSize: normalize(16), fontWeight: 'bold', color: '#2d3436' },
    employeeId: { fontSize: normalize(12), color: '#636e72', fontFamily: 'monospace' },
    appliedOn: { fontSize: normalize(10), color: '#b2bec3' },

    datesRow: { flexDirection: 'row', marginBottom: hp(1) },
    dateText: { fontSize: normalize(13), color: '#2d3436', fontWeight: '500' },

    reasonText: { fontSize: normalize(12), color: '#636e72', marginBottom: hp(2), fontStyle: 'italic' },

    actionsRow: { flexDirection: 'row', gap: wp(2.5) },
    actionButton: { flex: 1, paddingVertical: hp(1.2), borderRadius: normalize(8), alignItems: 'center', backgroundColor: '#f0f0f0' },
    rejectButton: { backgroundColor: '#fee2e2' },
    rejectButtonText: { color: '#e74c3c', fontWeight: 'bold', fontSize: normalize(13) },
    approveButton: { backgroundColor: '#dcfce7' },
    approveButtonText: { color: '#2ecc71', fontWeight: 'bold', fontSize: normalize(13) },
});

export default AdminWorkFromHomeScreen;
