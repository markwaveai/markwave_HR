import React from 'react';
import { View, StyleSheet } from 'react-native';



export const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
});

