import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    const opacity = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        if (duration) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const isSuccess = type === 'success';
    const isError = type === 'error';

    let borderColor = '#3b82f6'; // info
    let iconName = 'info';
    let iconColor = '#3b82f6';

    if (isSuccess) {
        borderColor = '#22c55e';
        iconName = 'check-circle';
        iconColor = '#22c55e';
    } else if (isError) {
        borderColor = '#ef4444';
        iconName = 'alert-circle';
        iconColor = '#ef4444';
    }

    return (
        <Animated.View style={[
            styles.container,
            { opacity, borderLeftColor: borderColor }
        ]}>
            <View style={styles.iconContainer}>
                <Icon name={iconName} size={18} color={iconColor} />
            </View>
            <Text style={styles.message}>{message}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="x" size={16} color="#9ca3af" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        right: 20,
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 280,
        maxWidth: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderLeftWidth: 4,
        zIndex: 10000,
    },
    iconContainer: {
        marginRight: 10,
    },
    message: {
        flex: 1,
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
        marginLeft: 10,
    },
});

export { Toast };
