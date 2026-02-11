import { API_BASE_URL } from '../config';

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    const url = `${API_BASE_URL}${endpoint}`;



    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        clearTimeout(timeoutId);


        if (!response.ok) {
            const errorText = await response.text();
            console.log(`API Error (${response.status}) body:`, errorText);

            let errorData = {};
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                // Not JSON
            }

            // @ts-ignore
            throw new Error(errorData.error || errorData.detail || `API Error: ${response.status} ${response.statusText}\n${errorText.substring(0, 100)}`);
        }

        return response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.log(`Request timed out: ${endpoint}`);
            throw new Error('Request timed out. Please check your connection.');
        }
        console.log(`Fetch error for ${API_BASE_URL}${endpoint}:`, error instanceof Error ? error.message : JSON.stringify(error));
        throw error;
    }
};

export const authApi = {
    sendOTP: (phone: string) => apiFetch('/auth/send-otp/', {
        method: 'POST',
        body: JSON.stringify({ phone })
    }),
    verifyOTP: (phone: string, otp: string) => apiFetch('/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
    }),
    sendEmailOTP: (email: string) => apiFetch('/auth/send-email-otp/', {
        method: 'POST',
        body: JSON.stringify({ email })
    }),
    verifyEmailOTP: (email: string, otp: string) => apiFetch('/auth/verify-email-otp/', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
    }),
    login: (phone: string, pin: string) => apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ phone, password: pin })
    }),
    getProfile: (employeeId: string) => apiFetch(`/auth/profile/${employeeId}/`)
};

export const leaveApi = {
    getLeaves: (employeeId: string) => apiFetch(`/leaves/${employeeId}/`),
    apply: (data: any) => apiFetch('/leaves/apply/', {
        method: 'POST',
        body: JSON.stringify({ ...data, created_at: new Date().toISOString() })
    }),
    getPending: () => apiFetch('/leaves/pending/'),
    getBalance: (employeeId: string) => apiFetch(`/leaves/balance/${employeeId}/`),
    action: (id: number, action: string) => apiFetch(`/leaves/${id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    })
};

export const teamApi = {
    getTeams: () => apiFetch('/team/'),
    createTeam: (data: any) => apiFetch('/team/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateTeam: (id: number, data: any) => apiFetch(`/team/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteTeam: (id: number) => apiFetch(`/team/${id}/`, {
        method: 'DELETE'
    }),
    getMembers: (teamId?: number) => apiFetch(`/team/members/${teamId ? `?team_id=${teamId}` : ''}`),
    getAttendanceRegistry: () => apiFetch('/team/registry/'),
    getStats: (teamId?: number, duration?: string) => {
        let qs = '';
        if (teamId) qs += `team_id=${teamId}`;
        if (duration) qs += `${qs ? '&' : ''}duration=${duration}`;
        return apiFetch(`/team/stats/${qs ? `?${qs}` : ''}`);
    },
    addEmployee: (data: any) => apiFetch('/team/members/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateMember: (id: string, data: any) => apiFetch(`/team/members/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteMember: (id: number) => apiFetch(`/team/members/${id}/`, {
        method: 'DELETE'
    }),
    getDesignations: () => apiFetch('/team/designations/')
};

export const attendanceApi = {
    getHistory: (employeeId: string) => apiFetch(`/attendance/history/${employeeId}/?_t=${new Date().getTime()}`),
    getStatus: (employeeId: string) => apiFetch(`/attendance/status/${employeeId}/?_t=${new Date().getTime()}`),
    clock: (data: any) => apiFetch('/attendance/clock/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getPersonalStats: (employeeId: string) => apiFetch(`/attendance/stats/${employeeId}/?_t=${new Date().getTime()}`),
    getHolidays: () => apiFetch('/holidays/'),
    submitRegularization: (data: any) => apiFetch('/attendance/regularize/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getRequests: (employeeId: string) => apiFetch(`/attendance/regularization-requests/${employeeId}/?role=employee&_t=${new Date().getTime()}`),
    resolveLocation: (lat: number, lon: number) => apiFetch(`/attendance/resolve-location/?lat=${lat}&lon=${lon}`),
};

export const feedApi = {
    getPosts: () => apiFetch(`/posts/?_t=${new Date().getTime()}`),
    createPost: (data: any) => apiFetch('/posts/', {
        method: 'POST',
        body: JSON.stringify({ ...data, created_at: new Date().toISOString() })
    }),
    toggleLike: (postId: number, employeeId: number) => apiFetch(`/posts/${postId}/like/`, {
        method: 'POST',
        body: JSON.stringify({ employee_id: employeeId })
    }),
    addComment: (postId: number, employeeId: number, content: string) => apiFetch(`/posts/${postId}/comment/`, {
        method: 'POST',
        body: JSON.stringify({ employee_id: employeeId, content })
    }),
    deletePost: (postId: number) => apiFetch(`/posts/${postId}/`, {
        method: 'DELETE'
    })
};

export const adminApi = {
    getDashboardStats: () => apiFetch(`/admin/dashboard-stats/?_t=${new Date().getTime()}`)
};
