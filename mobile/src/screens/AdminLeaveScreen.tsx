
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { leaveApi } from '../services/api';

const AdminLeaveScreen = () => {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchPendingLeaves();
    }, []);

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
                <Text style={styles.headerTitle}>Leave Management</Text>
                <Text style={styles.headerSubtitle}>Review pending requests</Text>
            </View>

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
                                <View style={[styles.typeBadge, { backgroundColor: getStatusColor(leave.type) + '20' }]}>
                                    <Text style={[styles.typeText, { color: getStatusColor(leave.type) }]}>
                                        {leave.type.toUpperCase()}
                                    </Text>
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
    header: { padding: 20, paddingTop: 40, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
    headerSubtitle: { fontSize: 12, color: '#636e72', marginTop: 2 },

    listContainer: { padding: 15, gap: 15 },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#b2bec3', fontSize: 16 },

    card: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    employeeName: { fontSize: 16, fontWeight: 'bold', color: '#2d3436' },
    employeeId: { fontSize: 12, color: '#636e72', fontFamily: 'monospace' },

    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeText: { fontSize: 10, fontWeight: 'bold' },

    datesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dateText: { fontSize: 13, color: '#2d3436', fontWeight: '500' },
    daysText: { fontSize: 13, color: '#48327d', fontWeight: 'bold' },

    reasonText: { fontSize: 12, color: '#636e72', marginBottom: 16, fontStyle: 'italic' },

    actionsRow: { flexDirection: 'row', gap: 10 },
    actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    rejectButton: { backgroundColor: '#fee2e2' },
    rejectButtonText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 13 },
    approveButton: { backgroundColor: '#dcfce7' },
    approveButtonText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 13 },
});

export default AdminLeaveScreen;
