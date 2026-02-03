import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface EmployeeOverviewCardProps {
    stats: any;
    onShowAbsentees: () => void;
}

const EmployeeOverviewCard: React.FC<EmployeeOverviewCardProps> = ({ stats, onShowAbsentees }) => {
    // Default values if stats is null/undefined
    const total = stats?.total_employees || 0;
    const absent = stats?.absentees_count || 0;

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Employee Overview</Text>
                <Text style={{ fontSize: 20 }}>👥</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>TOTAL EMPLOYEES</Text>
                    <Text style={styles.totalValue}>{total}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>ABSENTEES TODAY</Text>
                    <Text style={styles.absentValue}>{absent}</Text>
                </View>

                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={onShowAbsentees}
                    >
                        <Text style={styles.arrowText}>→</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
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
        marginBottom: 24,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statBlock: {
        marginRight: 24,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#f1f2f6',
        marginRight: 24,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#636e72',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    absentValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ff7675',
    },
    arrowButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        fontSize: 24,
        color: '#48327d',
        fontWeight: 'bold',
    },
});

export default EmployeeOverviewCard;
