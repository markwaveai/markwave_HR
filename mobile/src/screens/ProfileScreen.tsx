import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { normalize, wp, hp } from '../utils/responsive';

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
                    {user.profile_picture ? (
                        <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarTextLarge}>{getInitials()}</Text>
                    )}
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
        paddingVertical: hp(8),
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        flex: 1,
    },
    avatarLarge: {
        width: wp(25),
        height: wp(25),
        borderRadius: wp(12.5),
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(2.5),
    },
    avatarTextLarge: {
        fontSize: normalize(36),
        fontWeight: 'bold',
        color: 'white',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: wp(12.5),
    },
    name: {
        fontSize: normalize(24),
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: hp(0.5),
    },
    role: {
        fontSize: normalize(16),
        color: '#64748b',
        marginBottom: hp(2.5),
    },
    instruction: {
        fontSize: normalize(14),
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: hp(2.5),
    },
    backButton: {
        position: 'absolute',
        top: hp(2.5),
        right: wp(5),
        width: wp(9),
        height: wp(9),
        borderRadius: normalize(12),
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backButtonText: {
        fontSize: normalize(18),
        color: '#64748b',
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
