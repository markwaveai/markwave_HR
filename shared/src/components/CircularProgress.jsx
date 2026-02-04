import React from 'react';
import { View, Text, StyleSheet } from 'react-native';




const CircularProgress = ({
    value,
    total,
    size = 50,
    strokeWidth = 4,
    color = '#48327d',
    bgColor = '#f1f2f6',
    label
}) => {
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', borderColor: color, borderWidth: 2, borderRadius: size / 2 }}>
            <View style={styles.labelContainer}>
                <Text style={styles.valueText}>{value}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    labelContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2d3436',
    },
});

export { CircularProgress };


