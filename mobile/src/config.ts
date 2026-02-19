import { Platform } from 'react-native';

// API Configuration
const ENV = __DEV__ ? 'local' : 'production';

const URLS = {
    local: 'https://hr.markwave.ai/api',
    production: 'https://hr.markwave.ai/api'
};

export const API_BASE_URL = URLS[ENV];

