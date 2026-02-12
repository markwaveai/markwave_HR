import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Platform,
    ScrollView
} from 'react-native';
import { CloseIcon } from './Icons';

interface AllHolidaysModalProps {
    visible: boolean;
    onClose: () => void;
    holidays: any[];
}

const AllHolidaysModal: React.FC<AllHolidaysModalProps> = ({ visible, onClose, holidays = [] }) => {
    // Filter to show only upcoming or recent holidays if needed, but "View All" usually means all relevant ones.
    // Assuming 'holidays' passed are already sorted/filtered by the parent or api.

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Upcoming Holidays</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CloseIcon color="#64748b" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
                        {holidays.length > 0 ? (
                            holidays.map((h, idx) => {
                                const d = new Date(h.raw_date);
                                const day = d.getDate();
                                const month = d.toLocaleString('en-US', { month: 'short' });
                                const year = d.getFullYear();
                                const fullDate = `${d.toLocaleString('en-US', { weekday: 'short' })}, ${day} ${month}, ${year}`;

                                return (
                                    <View key={idx} style={styles.holidayCard}>
                                        <View style={styles.dateBlock}>
                                            <Text style={styles.dateDay}>{day}</Text>
                                            <Text style={styles.dateMonth}>{month}</Text>
                                        </View>
                                        <View style={styles.holidayInfo}>
                                            <Text style={styles.holidayName}>{h.name}</Text>
                                            <View style={styles.metaRow}>
                                                <Text style={styles.holidayDate}>{fullDate}</Text>
                                                <View style={[styles.badge, h.is_optional ? styles.badgeOptional : styles.badgePublic]}>
                                                    <Text style={[styles.badgeText, h.is_optional ? styles.textOptional : styles.textPublic]}>
                                                        {h.is_optional ? 'OPTIONAL' : 'PUBLIC'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.emptyText}>No upcoming holidays.</Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#f8f9fa',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeBtn: {
        padding: 4,
    },
    listContent: {
        paddingBottom: 40,
        gap: 16,
    },
    holidayCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    dateBlock: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateDay: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#475569',
        lineHeight: 24,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    holidayInfo: {
        flex: 1,
    },
    holidayName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    holidayDate: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    badgePublic: {
        backgroundColor: '#f0fdf4', // green-50
        borderColor: '#dcfce7', // green-100
    },
    badgeOptional: {
        backgroundColor: '#f5f3ff', // violet-50
        borderColor: '#ddd6fe', // violet-100
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    textPublic: {
        color: '#16a34a', // green-600
    },
    textOptional: {
        color: '#7c3aed', // violet-600
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        marginTop: 40,
        fontSize: 16,
    },
});

export default AllHolidaysModal;
