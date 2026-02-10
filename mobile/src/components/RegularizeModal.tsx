import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { attendanceApi } from '../services/api';
import { ClockIcon, CloseIcon, CheckCircleIcon } from './Icons';

interface RegularizeModalProps {
    visible: boolean;
    onClose: () => void;
    date: string; // YYYY-MM-DD
    employeeId: string;
    onSuccess: () => void;
}

const RegularizeModal: React.FC<RegularizeModalProps> = ({ visible, onClose, date, employeeId, onSuccess }) => {
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [amPm, setAmPm] = useState<'AM' | 'PM'>('PM');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!hour || !minute || !reason) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const h = parseInt(hour, 10);
        const m = parseInt(minute, 10);

        if (isNaN(h) || h < 1 || h > 12 || isNaN(m) || m < 0 || m > 59) {
            Alert.alert('Error', 'Please enter a valid time');
            return;
        }

        const timeString = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${amPm}`;

        setIsLoading(true);
        try {
            await attendanceApi.submitRegularization({
                employee_id: employeeId,
                date: date,
                check_out_time: timeString,
                reason: reason
            });
            Alert.alert('Success', 'Regularization request submitted successfully');
            onSuccess();
            onClose();
            // Reset fields
            setHour('');
            setMinute('');
            setReason('');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit request');
        } finally {
            setIsLoading(false);
        }
    };

    // Format Date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const options: any = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
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
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Regularize Attendance</Text>
                            <Text style={styles.subtitleHeader}>Request check-out correction</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <CloseIcon color="#ffffff" size={20} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <View style={styles.dateCard}>
                            <ClockIcon size={20} color="#2563eb" style={{ marginRight: 12 }} />
                            <View>
                                <Text style={styles.labelSmall}>MISSED CHECK-OUT DATE</Text>
                                <Text style={styles.dateValue}>{formatDate(date)}</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Correct Check-Out Time</Text>
                            <View style={styles.timeInputContainer}>
                                <TextInput
                                    style={styles.timeInput}
                                    placeholder="06"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    value={hour}
                                    onChangeText={setHour}
                                />
                                <Text style={styles.colon}>:</Text>
                                <TextInput
                                    style={styles.timeInput}
                                    placeholder="00"
                                    placeholderTextColor="#cbd5e1"
                                    keyboardType="number-pad"
                                    maxLength={2}
                                    value={minute}
                                    onChangeText={setMinute}
                                />
                                <TouchableOpacity
                                    style={styles.amPmToggle}
                                    onPress={() => setAmPm(amPm === 'AM' ? 'PM' : 'AM')}
                                >
                                    <Text style={styles.amPmText}>{amPm}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Reason for Missing</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Why did you miss the check-out?"
                                placeholderTextColor="#94a3b8"
                                value={reason}
                                onChangeText={setReason}
                                multiline
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <CheckCircleIcon color="white" size={20} style={{ marginRight: 8 }} />
                                    <Text style={styles.submitBtnText}>Submit Request</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        padding: 16
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 20
    },
    header: {
        backgroundColor: '#48327d',
        padding: 24,
        paddingTop: 28,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        letterSpacing: -0.5,
        marginBottom: 4
    },
    subtitleHeader: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500'
    },
    closeButton: {
        padding: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20
    },
    body: {
        padding: 24
    },
    dateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        borderWidth: 1,
        borderColor: '#e0f2fe',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24
    },
    labelSmall: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0369a1',
        letterSpacing: 0.5,
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    dateValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0c4a6e'
    },
    section: {
        marginBottom: 20
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    timeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 18,
        textAlign: 'center',
        color: '#1e293b',
        fontWeight: '600',
        backgroundColor: 'white'
    },
    colon: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#cbd5e1',
        marginHorizontal: 4
    },
    amPmToggle: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
    },
    amPmText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#48327d'
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#1e293b',
        backgroundColor: 'white'
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    submitBtn: {
        backgroundColor: '#48327d',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#48327d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default RegularizeModal;
