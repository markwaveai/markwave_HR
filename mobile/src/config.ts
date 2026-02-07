import { Platform } from 'react-native';

export const API_BASE_URL =
    Platform.OS === 'android' && __DEV__
        ? 'http://10.0.2.2:8000/api'
        : 'http://34.14.209.166:8000/api';