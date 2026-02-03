import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EmployeeOverviewCardProps {
    stats: any;
    onShowAbsentees: () => void;
}

const EmployeeOverviewCard: React.FC<EmployeeOverviewCardProps> = ({ stats, onShowAbsentees }) => {
    // Default values if stats is null/undefined
    const total = stats?.total_employees || 0;
    const present = stats?.present_count || 0;
    const absent = stats?.absent_count || 0;
    const late = stats?.late_count || 0;
    const onTime = stats?.on_time_count || 0;

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Today's Overview</Text>
                <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
            </View>

            <View style={styles.mainStats}>
                <View style={styles.totalBlock}>
                    <Text style={styles.totalLabel}>Total Employees</Text>
                    <Text style={styles.totalValue}>{total}</Text>
                </View>
                <View style={styles.attendanceBar}>
                    {/* Handle potential division by zero if total is 0 */}
                    <View style={[styles.barSegment, { flex: present || 1, backgroundColor: '#00b894' }]} />
                    <View style={[styles.barSegment, { flex: absent || 1, backgroundColor: '#ff7675' }]} />
                </View>
            </View>

            <View style={styles.grid}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{present}</Text>
                    <Text style={[styles.statLabel, { color: '#00b894' }]}>Present</Text>
                </View>

                <TouchableOpacity style={styles.statItem} onPress={onShowAbsentees}>
                    <Text style={styles.statValue}>{absent}</Text>
                    <Text style={[styles.statLabel, { color: '#ff7675', textDecorationLine: 'underline' }]}>Absent</Text>
                </TouchableOpacity>

                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{late}</Text>
                    <Text style={[styles.statLabel, { color: '#fdcb6e' }]}>Late</Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{onTime}</Text>
                    <Text style={[styles.statLabel, { color: '#6c5ce7' }]}>On Time</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderColor: '#e2e8f0',
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    dateText: {
        fontSize: 12,
        color: '#636e72',
    },
    mainStats: {
        marginBottom: 20,
    },
    totalBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 10,
    },
    totalLabel: {
        fontSize: 14,
        color: '#636e72',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    attendanceBar: {
        height: 6,
        backgroundColor: '#f1f2f6',
        borderRadius: 3,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    barSegment: {
        height: '100%',
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3436',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default EmployeeOverviewCard;
