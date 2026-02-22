import { API_BASE_URL } from '../config';

const apiFetch = async (endpoint: string, options: RequestInit & { retries?: number; timeout?: number } = {}) => {
    const { retries = 2, timeout = 20000, ...fetchOptions } = options; // Default 20s timeout

    const attemptFetch = async (attempt: number): Promise<any> => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const url = `${API_BASE_URL}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...fetchOptions.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // If 5xx error, we might want to retry. If 4xx, probably not (except 408 or 429).
                // For now, let's retry strictly on network errors or 5xx if we wanted, 
                // but standard catch block handles network errors.
                // Let's treat non-2xx as usual error, but if it's 5xx we could technically retry.
                // For safety, we'll return error here and let the catch block handle retries if we throw custom.

                const errorText = await response.text();
                // console.log(`API Error (${response.status}) [${url}]:`, errorText);

                let errorData: any = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not JSON
                }

                // @ts-ignore
                const msg = errorData.error || errorData.detail || `API Error: ${response.status} ${response.statusText}`;
                const error: any = new Error(msg);
                error.response = { data: errorData, status: response.status };

                // If 500+, throw to trigger catch for potential retry? 
                // Currently original logic throws here.
                throw error;
            }

            return response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);

            const isAbort = error.name === 'AbortError';
            const isNetworkError = error.message === 'Network request failed';

            // Log the attempt failure
            if (attempt < retries) {
                const delay = 2000 * (attempt + 1); // Linear backoff: 2s, 4s...
                console.log(`Retrying [${url}] (Attempt ${attempt + 1}/${retries})... Error: ${error.message}`);
                await new Promise(resolve => setTimeout(() => resolve(true), delay));
                return attemptFetch(attempt + 1);
            }

            if (isAbort) {
                console.log(`Request timed out [${url}] after ${timeout}ms`);
                throw new Error('Request timed out. Please check your connection.');
            }
            console.log(`Fetch error [${url}]:`, error instanceof Error ? error.message : JSON.stringify(error));
            throw error;
        }
    };

    return attemptFetch(0);
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
    getProfile: (employeeId: string) => apiFetch(`/auth/profile/${employeeId}/`),
    updateProfile: (employeeId: string, data: any) => apiFetch(`/team/members/${employeeId}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    updateProfilePicture: (employeeId: string, imageUri: string, mimeType: string, fileName: string) => {
        const formData = new FormData();
        formData.append('profile_picture', {
            uri: imageUri,
            type: mimeType,
            name: fileName,
        } as any);

        return fetch(`${API_BASE_URL}/team/members/${employeeId}/`, {
            method: 'PATCH',
            body: formData,
            headers: {
                // Do not set Content-Type here; fetch will automatically 
                // set it to multipart/form-data with the correct boundary
            }
        }).then(async res => {
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Image upload failed');
            }
            return res.json();
        });
    }
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
    getStatus: (employeeId: string, options?: any) => apiFetch(`/attendance/status/${employeeId}/?_t=${new Date().getTime()}`, options),
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
    getRequests: (employeeId: string, role: 'employee' | 'manager' = 'employee') => apiFetch(`/attendance/regularization-requests/${employeeId}/?role=${role}&_t=${new Date().getTime()}`),
    updateRequestStatus: (id: number, action: 'Approved' | 'Rejected') => apiFetch(`/attendance/regularization/${id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    }),
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
    deleteComment: (postId: number, commentId: number, employeeId: any) =>
        apiFetch(`/posts/${postId}/comment/${commentId}/?employee_id=${employeeId}`, {
            method: 'DELETE'
        }),
    deletePost: (postId: number) => apiFetch(`/posts/${postId}/`, {
        method: 'DELETE'
    })
};

export const wfhApi = {
    apply: (data: any) => apiFetch('/wfh/apply/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getRequests: (employeeId: string) => apiFetch(`/wfh/requests/${employeeId}/`),
    getPending: () => apiFetch('/wfh/pending/'),
    action: (id: number, action: 'Approve' | 'Reject') => apiFetch(`/wfh/${id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    })
};

export const adminApi = {
    getDashboardStats: () => apiFetch(`/admin/dashboard-stats/?_t=${new Date().getTime()}`)
};
