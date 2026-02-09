import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const LEAVE_CONFIG: any = {
    'cl': { name: 'Casual Leave', code: 'cl', icon: '✈️', color: '#3498db', bg: '#e0f2fe' },
    'sl': { name: 'Sick Leave', code: 'sl', icon: '🌡️', color: '#e74c3c', bg: '#fee2e2' },
    'el': { name: 'Earned Leave', code: 'el', icon: '🌴', color: '#2ecc71', bg: '#dcfce7' },
    'scl': { name: 'Special Casual Leave', code: 'scl', icon: '🌟', color: '#9b59b6', bg: '#f3e5f5' },
    'bl': { name: 'Bereavement Leave', code: 'bl', icon: '🕯️', color: '#e67e22', bg: '#fff3e0' },
    'pl': { name: 'Paternity Leave', code: 'pl', icon: '👶', color: '#1abc9c', bg: '#e0f2f1' },
    'll': { name: 'Long Leave', code: 'll', icon: '🏠', color: '#34495e', bg: '#eceff1' },
    'co': { name: 'Comp Off', code: 'co', icon: '⏳', color: '#f1c40f', bg: '#fffde7' }
};

interface LeaveBalanceCardProps {
    apiBalance: any;
    history: any[];
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ apiBalance, history }) => {

    const balances = useMemo(() => {
        const result: any[] = [];
        if (!apiBalance) return result;

        Object.keys(LEAVE_CONFIG).forEach(code => {
            if (code === 'lwp') return;

            const config = LEAVE_CONFIG[code];

            // Show if allocated OR if it's a standard leave type (CL, SL)
            // Note: EL removed from default list per user request
            if (apiBalance.hasOwnProperty(code) || ['cl', 'sl'].includes(code)) {
                const consumed = history
                    .filter(log => log.type === code && (log.status === 'Approved' || log.status === 'Pending'))
                    .reduce((sum, log) => sum + (log.days || 0), 0);

                const available = apiBalance[code] || 0;
                const total = available + consumed;

                result.push({
                    ...config,
                    consumed,
                    available,
                    total
                });
            }
        });
        return result;
    }, [apiBalance, history]);

    if (balances.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {balances.map((item, index) => (
                    <View key={index} style={styles.card}>
                        <View style={styles.header}>
                            <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                                <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                            </View>
                            <Text style={styles.title} numberOfLines={1}>{item.name}</Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.bigNumber}>{item.available}</Text>
                            <Text style={styles.label}>days available</Text>
                        </View>

                        <View style={styles.progressSection}>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressText}>Consumed: {item.consumed}</Text>
                                <Text style={styles.progressText}>Total: {item.total}</Text>
                            </View>
                            <View style={styles.track}>
                                <View style={[styles.fill, { width: `${item.total > 0 ? (item.consumed / item.total) * 100 : 0}%`, backgroundColor: '#48327d' }]} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    card: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
        flex: 1
    },
    row: {
        alignItems: 'center',
        marginBottom: 12
    },
    bigNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#48327d',
        marginBottom: 2
    },
    label: {
        fontSize: 12,
        color: '#64748b'
    },
    progressSection: {
        gap: 6
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    progressText: {
        fontSize: 10,
        color: '#94a3b8'
    },
    track: {
        height: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
        overflow: 'hidden'
    },
    fill: {
        height: '100%',
        borderRadius: 2
    }
});

export default LeaveBalanceCard;
