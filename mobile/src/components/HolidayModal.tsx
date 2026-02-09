import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Platform
} from 'react-native';

interface HolidayModalProps {
    visible: boolean;
    onClose: () => void;
    holidays: any[];
}

const HolidayModal: React.FC<HolidayModalProps> = ({ visible, onClose, holidays = [] }) => {
    const [viewDate, setViewDate] = useState(new Date());

    // Debug logging
    console.log('HolidayModal render:', { visible, holidaysCount: holidays.length });

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentMonthHolidays = holidays.filter(h => {
        if (!h.raw_date) return false;
        const hDate = new Date(h.raw_date);
        return hDate.getMonth() === viewDate.getMonth() &&
            hDate.getFullYear() === viewDate.getFullYear();
    });

    const getHolidayForDay = (day: number) => {
        return currentMonthHolidays.find(h => {
            const hDate = new Date(h.raw_date);
            return hDate.getDate() === day;
        });
    };

    const daysInMonth = getDaysInMonth(viewDate);
    const startDay = getFirstDayOfMonth(viewDate);

    const renderCalendar = () => {
        const days = [];
        // Empty slots for start of month
        for (let i = 0; i < startDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayBox} />);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const holiday = getHolidayForDay(day);
            const isSpecial = !!holiday;

            days.push(
                <View
                    key={day}
                    style={[
                        styles.dayBox,
                        isSpecial && styles.specialDayBox
                    ]}
                >
                    <Text style={[
                        styles.dayText,
                        isSpecial && styles.specialDayText
                    ]}>
                        {day}
                    </Text>
                </View>
            );
        }
        return days;
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.navRow}>
                            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                                <Text style={styles.navArrow}>‹</Text>
                            </TouchableOpacity>
                            <Text style={styles.monthTitle}>
                                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </Text>
                            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                                <Text style={styles.navArrow}>›</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Weekday Labels */}
                    <View style={styles.weekLabels}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                            <View key={d} style={styles.dayBox}>
                                <Text style={styles.weekLabelText}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                        {renderCalendar()}
                    </View>

                    {/* Holiday List */}
                    <View style={styles.holidayList}>
                        {currentMonthHolidays.length > 0 ? (
                            currentMonthHolidays.map((h, idx) => {
                                const d = new Date(h.raw_date);
                                const monthShort = monthNames[d.getMonth()].substring(0, 3);
                                const day = d.getDate();
                                return (
                                    <View key={idx} style={styles.holidayItem}>
                                        <View style={styles.bullet} />
                                        <View style={styles.holidayInfo}>
                                            <Text style={styles.holidayText}>
                                                {monthShort} {day} - {h.name}
                                            </Text>
                                            {h.is_optional && (
                                                <View style={styles.optionalBadge}>
                                                    <Text style={styles.optionalText}>Optional</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.noHolidays}>No holidays in this month</Text>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
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
        marginBottom: 24,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    monthTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2d3436',
    },
    navBtn: {
        padding: 4,
    },
    navArrow: {
        fontSize: 20,
        color: '#94a3b8',
        fontWeight: '600',
    },
    closeBtn: {
        padding: 4,
    },
    closeIcon: {
        fontSize: 24,
        color: '#cbd5e1',
        fontWeight: '300',
    },
    weekLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    weekLabelText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8', // slate-400
        textAlign: 'center',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    dayBox: {
        width: '14.28%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 14,
        color: '#2d3436',
        fontWeight: '500',
    },
    specialDayBox: {
        backgroundColor: '#48327d',
        borderRadius: 10,
    },
    specialDayText: {
        color: 'white',
        fontWeight: '700',
    },
    holidayList: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 24,
        gap: 12,
    },
    holidayItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#48327d',
    },
    holidayInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    holidayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2d3436',
    },
    optionalBadge: {
        backgroundColor: '#f5f3ff',
        borderColor: '#ddd6fe',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    optionalText: {
        fontSize: 8,
        color: '#7c3aed',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    noHolidays: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94a3b8',
        fontStyle: 'italic',
        paddingVertical: 20,
    },
});

export default HolidayModal;
