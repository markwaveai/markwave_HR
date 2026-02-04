import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export const IconButton = ({ icon, label, color = '#48327d' }) => (
    <View style={styles.iconButtonContainer}>
        <View style={styles.iconButtonCircle}>
            {typeof icon === 'string' ? (
                <Icon name={icon} size={24} color={color} />
            ) : (
                icon
            )}
        </View>
        <Text style={styles.iconButtonLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    iconButtonContainer: {
        alignItems: 'center',
        gap: 8,
    },
    iconButtonCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f5f6fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButtonLabel: {
        fontSize: 12,
        color: '#636e72',
        fontWeight: '500',
    },
});
