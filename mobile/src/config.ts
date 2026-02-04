import { Platform } from 'react-native';

export const API_BASE_URL =
    Platform.OS === 'android' && __DEV__
        ? 'http://192.168.1.191:8000/api'
        : 'http://34.14.209.166:8000/api';