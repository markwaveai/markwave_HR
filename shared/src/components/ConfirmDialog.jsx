import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary' }) => {
    const isDanger = type === 'danger';

    return (
        <Modal
            visible={isOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={[styles.iconContainer, isDanger ? styles.iconDanger : styles.iconPrimary]}>
                                <Icon
                                    name={isDanger ? "alert-triangle" : "info"}
                                    size={20}
                                    color={isDanger ? "#ef4444" : "#3b82f6"}
                                />
                            </View>
                            <Text style={styles.title}>{title}</Text>
                        </View>

                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                onPress={onCancel}
                                style={[styles.button, styles.cancelButton]}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={onConfirm}
                                style={[styles.button, isDanger ? styles.confirmButtonDanger : styles.confirmButtonPrimary]}
                            >
                                <Text style={styles.confirmButtonText}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
    },
    content: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconPrimary: {
        backgroundColor: '#eff6ff',
    },
    iconDanger: {
        backgroundColor: '#fef2f2',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    message: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 24,
        marginLeft: 52,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginLeft: 52,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#4b5563',
        fontWeight: '600',
        fontSize: 14,
    },
    confirmButtonPrimary: {
        backgroundColor: '#48327d',
    },
    confirmButtonDanger: {
        backgroundColor: '#ef4444',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});

export { ConfirmDialog };
