
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface CustomDatePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: string) => void;
    value?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ visible, onClose, onSelect, value }) => {
    const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());

    React.useEffect(() => {
        if (visible && value) {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                setCurrentDate(d);
            }
        }
    }, [visible, value]);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const changeMonth = (increment: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };

    const handleSelect = (day: number) => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onSelect(formattedDate);
        onClose();
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const days = [];

        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateToCheck = new Date(year, month, i);
            dateToCheck.setHours(0, 0, 0, 0);
            const isPast = dateToCheck < today;

            const isSelected = value && new Date(value).getDate() === i && new Date(value).getMonth() === month && new Date(value).getFullYear() === year;
            const isToday = new Date().getDate() === i && new Date().getMonth() === month && new Date().getFullYear() === year;

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayCell,
                        isSelected && styles.selectedDay,
                        !isSelected && isToday && styles.todayCell,
                        isPast && styles.disabledDay
                    ]}
                    onPress={() => !isPast && handleSelect(i)}
                    disabled={isPast}
                >
                    <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        !isSelected && isToday && styles.todayText,
                        isPast && styles.disabledDayText
                    ]}>{i}</Text>
                </TouchableOpacity>
            );
        }

        return days;
    };

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                            <Text style={styles.navText}>{'<'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.monthTitle}>
                            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                            <Text style={styles.navText}>{'>'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Week Days */}
                    <View style={styles.weekRow}>
                        {weekDays.map(day => (
                            <Text key={day} style={styles.weekDayText}>{day}</Text>
                        ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.daysGrid}>
                        {renderCalendar()}
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 340,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2d3436'
    },
    navBtn: {
        padding: 10,
    },
    navText: {
        fontSize: 20,
        color: '#48327d',
        fontWeight: 'bold'
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10
    },
    weekDayText: {
        width: 40,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#b2bec3',
        fontSize: 12
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start' // Changed from space-between to align properly
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginBottom: 5
    },
    selectedDay: {
        backgroundColor: '#48327d'
    },
    todayCell: {
        borderWidth: 1,
        borderColor: '#48327d'
    },
    dayText: {
        fontSize: 14,
        color: '#2d3436'
    },
    selectedDayText: {
        color: 'white',
        fontWeight: 'bold'
    },
    todayText: {
        color: '#48327d',
        fontWeight: 'bold'
    },
    disabledDay: {
        backgroundColor: '#f5f5f5'
    },
    disabledDayText: {
        color: '#cbd5e1',
        textDecorationLine: 'line-through'
    },
    closeButton: {
        marginTop: 15,
        alignItems: 'center',
        padding: 10
    },
    closeButtonText: {
        color: '#636e72',
        fontWeight: 'bold'
    }
});

export default CustomDatePicker;
