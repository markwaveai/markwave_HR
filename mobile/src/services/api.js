import { createApi } from '@markwave/shared';
import { API_BASE_URL } from '../config';

const api = createApi(API_BASE_URL);

export const authApi = api.auth;
export const leaveApi = api.leave;
export const teamApi = api.team;
export const attendanceApi = api.attendance;
export const feedApi = api.feed;
export const adminApi = api.admin;
