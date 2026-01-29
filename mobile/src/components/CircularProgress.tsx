import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
    value: number;
    total: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    label?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    total,
    size = 50,
    strokeWidth = 4,
    color = '#48327d',
    bgColor = '#f1f2f6',
    label
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(Math.max(value / total, 0), 1);
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <Svg width={size} height={size}>
                    {/* Background Circle */}
                    <Circle
                        stroke={bgColor}
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress Circle */}
                    <Circle
                        stroke={color}
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round" // Optional: makes the ends rounded
                    />
                </Svg>
            </View>
            <View style={StyleSheet.absoluteFillObject}>
                <View style={styles.labelContainer}>
                    <Text style={styles.valueText}>{value}</Text>
                </View>
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

export default CircularProgress;
