import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BriefcaseIcon, MailIcon, CloseIcon, LogOutIcon } from './Icons';

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onLogout: () => void;
    user: any;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose, onLogout, user }) => {
    if (!user) return null;

    const getInitials = () => {
        return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    };

    const getFormattedID = (id: any) => {
        if (!id) return '----';
        // Check if it's already formatted
        if (typeof id === 'string' && id.startsWith('MW')) return id;

        const numId = parseInt(id);
        if (isNaN(numId)) return id;
        if (numId < 1000) {
            return `MWI${numId.toString().padStart(3, '0')}`;
        }
        return `MW${numId}`;
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
                <View style={styles.content}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <CloseIcon color="#94a3b8" size={24} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        </View>
                        <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                        <View style={styles.idBadge}>
                            <Text style={styles.idText}>{user.employee_id || getFormattedID(user.id)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <BriefcaseIcon color="#64748b" size={20} />
                            </View>
                            <View>
                                <Text style={styles.label}>DESIGNATION</Text>
                                <Text style={styles.value}>{user.role || user.designation}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.infoRow}>
                            <View style={styles.iconBox}>
                                <MailIcon color="#64748b" size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <Text style={styles.value}>{user.email}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                        <View style={{ marginRight: 8 }}>
                            <LogOutIcon color="#64748b" size={20} />
                        </View>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>MARKWAVE HR V1.0.02</Text>
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
        zIndex: 1000,
    },
    overlayTouch: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    content: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 24, // Squircle-ish
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    idBadge: {
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    idText: {
        color: '#48327d',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    label: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0', // Slightly darker for visibility in loose card
        marginVertical: 16,
        marginLeft: 56, // Align with text start
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: 'white',
        marginBottom: 16,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    versionText: {
        fontSize: 10,
        color: '#cbd5e1',
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default ProfileModal;
