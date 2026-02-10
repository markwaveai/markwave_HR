import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ProfileScreen = ({ user, onBack }: { user: any, onBack?: () => void }) => {
    if (!user) return null;

    const getInitials = () => {
        return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {onBack && (
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Text style={styles.backButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{getInitials()}</Text>
                </View>
                <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                <Text style={styles.role}>{user.role || user.designation}</Text>
                <Text style={styles.instruction}>Full details are available in the Settings tab.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        flex: 1,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarTextLarge: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    role: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 20,
    },
    instruction: {
        fontSize: 14,
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: 20,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backButtonText: {
        fontSize: 18,
        color: '#64748b',
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
