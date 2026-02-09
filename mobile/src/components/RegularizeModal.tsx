import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { attendanceApi } from '../services/api';
import { ClockIcon, CloseIcon } from './Icons';

interface RegularizeModalProps {
    visible: boolean;
    onClose: () => void;
    date: string; // YYYY-MM-DD
    employeeId: string;
    onSuccess: () => void;
}

const RegularizeModal: React.FC<RegularizeModalProps> = ({ visible, onClose, date, employeeId, onSuccess }) => {
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!time || !reason) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Basic Time Validation (HH:MM AM/PM or HH:MM)
        // We'll trust the user or add simple regex.
        // Let's force a format or just send it as string and let backend parse (backend expects %I:%M %p)
        // User should input "06:00 PM"

        setIsLoading(true);
        try {
            await attendanceApi.submitRegularization({
                employee_id: employeeId,
                date: date,
                check_out_time: time,
                reason: reason
            });
            Alert.alert('Success', 'Regularization request submitted successfully');
            onSuccess();
            onClose();
            // Reset fields
            setTime('');
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
        const options: any = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
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
                        <Text style={styles.title}>Regularize Attendance</Text>
                        <TouchableOpacity onPress={onClose}>
                            <CloseIcon color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>Request check-out correction</Text>

                    <View style={styles.section}>
                        <Text style={styles.label}>MISSED CHECK-OUT DATE</Text>
                        <View style={styles.readOnlyField}>
                            <ClockIcon size={16} color="#64748b" style={{ marginRight: 8 }} />
                            <Text style={styles.valueText}>{formatDate(date)}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>CORRECT CHECK-OUT TIME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 06:00 PM"
                            placeholderTextColor="#cbd5e1"
                            value={time}
                            onChangeText={setTime}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.label}>REASON FOR MISSING</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Why did you miss the check-out?"
                            placeholderTextColor="#cbd5e1"
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
                            <Text style={styles.submitBtnText}>Submit Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 24,
        marginTop: 4
    },
    section: {
        marginBottom: 20
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase'
    },
    readOnlyField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 8
    },
    valueText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500'
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1e293b'
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top'
    },
    submitBtn: {
        backgroundColor: '#48327d',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10
    },
    submitBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});

export default RegularizeModal;
