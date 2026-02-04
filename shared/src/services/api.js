import { Platform } from 'react-native';
import { createApi } from './createApi';

let API_BASE_URL = 'https://hr.markwave.ai/api';

if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        API_BASE_URL = isLocalhost ? 'http://localhost:8000/api' : 'https://hr.markwave.ai/api';
    }
} else {
    // For mobile development
    // If we are in __DEV__, we might want to use localhost (10.0.2.2 for Android emulator)
    // But since we don't have easy access to __DEV__ here without React Native context, 
    // we'll default to the production URL or a known dev URL.
    // Ideally, pass this via an environment variable or config context.

    // Using the IP from mobile/src/config.js as default for dev
    API_BASE_URL = 'http://10.0.2.2:8000/api';
}

const api = createApi(API_BASE_URL);

export const authApi = api.auth;
export const leaveApi = api.leave;
export const teamApi = api.team;
export const attendanceApi = api.attendance;
export const feedApi = api.feed;
export const adminApi = api.admin;
export { API_BASE_URL };
