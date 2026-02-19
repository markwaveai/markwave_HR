import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UsersIcon, ChevronRightIcon } from './Icons';

interface EmployeeOverviewCardProps {
    stats: any;
    onShowAbsentees: () => void;
    onShowAllLogins: () => void;
}

const EmployeeOverviewCard: React.FC<EmployeeOverviewCardProps> = ({ stats, onShowAbsentees, onShowAllLogins }) => {
    // Default values if stats is null/undefined
    const total = stats?.total_employees || 0;
    const absent = stats?.absentees_count || 0;

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Employee Overview</Text>
                <UsersIcon color="#3b82f6" size={24} />
            </View>

            <View style={styles.statsRow}>
                <TouchableOpacity
                    style={styles.statBlock}
                    onPress={onShowAllLogins}
                    activeOpacity={0.7}
                >
                    <Text style={styles.statLabel}>TOTAL EMPLOYEES</Text>
                    <Text style={styles.totalValue}>{total}</Text>

                </TouchableOpacity>

                <View style={styles.statDivider} />

                <View style={styles.statBlock}>
                    <Text style={styles.statLabel}>ABSENTEES TODAY</Text>
                    <Text style={styles.absentValue}>{absent}</Text>
                </View>

                <View style={styles.arrowButtonContainer}>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={onShowAbsentees}
                    >
                        <ChevronRightIcon color="#48327d" size={24} />
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
        justifyContent: 'space-between',
    },
    statBlock: {
        flex: 1.2,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: '#f1f2f6',
        marginHorizontal: 12,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#636e72',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2d3436',
    },
    hintText: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: '600',
        marginTop: 2,
    },
    absentValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ff7675',
    },
    arrowButtonContainer: {
        flex: 0.7,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    arrowButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
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
