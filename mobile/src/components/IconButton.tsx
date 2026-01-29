import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IconButtonProps {
    icon: string;
    label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, label }) => (
    <View style={styles.iconButtonContainer}>
        <View style={styles.iconButtonCircle}>
            <Text style={{ fontSize: 24 }}>{icon}</Text>
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
