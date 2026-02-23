import { Platform } from 'react-native';

// API Configuration
const ENV = __DEV__ ? 'local' : 'production';

const URLS = {
    local: Platform.OS === 'android' ? 'http://192.168.1.191:8000/api' : 'http://localhost:8000/api',
    production: 'https://hr.markwave.ai/api'
};

export const API_BASE_URL = URLS[ENV];

