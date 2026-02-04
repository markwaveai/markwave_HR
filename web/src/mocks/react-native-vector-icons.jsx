import React from 'react';
import { Text } from 'react-native';

const Icon = ({ name, size, color, style }) => {
    return <Text style={[{ fontSize: size, color: color }, style]}>□</Text>;
};

export default Icon;
