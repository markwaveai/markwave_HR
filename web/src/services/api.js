const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8000/api' : 'https://hr.markwave.ai/api');

const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...options.headers,
        },
    });

    if (!response.ok) {
        let errorData = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            errorData = await response.json().catch(() => ({}));
        } else {
            const text = await response.text().catch(() => '');
            errorData = { error: text || `API Error: ${response.statusText}` };
        }

        const error = new Error(errorData.error || `API Error: ${response.statusText}`);
        error.response = { data: errorData, status: response.status };
        throw error;
    }

    return response.json();
};

export const authApi = {
    getProfile: (employeeId) => apiFetch(`/auth/profile/${employeeId}/`),
    sendOTP: (phone) => apiFetch('/auth/send-otp/', {
        method: 'POST',
        body: JSON.stringify({ phone })
    }),
    verifyOTP: (phone, otp) => apiFetch('/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
    }),
    sendEmailOTP: (email) => apiFetch('/auth/send-email-otp/', {
        method: 'POST',
        body: JSON.stringify({ email })
    }),
    verifyEmailOTP: (email, otp) => apiFetch('/auth/verify-email-otp/', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
    }),
    updateProfilePicture: (employeeId, file) => {
        const formData = new FormData();
        formData.append('profile_picture', file);

        return fetch(`${API_BASE_URL}/team/members/${employeeId}/`, {
            method: 'POST',
            body: formData,
            // fetch will automatically set Content-Type: multipart/form-data
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
    getLeaves: (employeeId) => apiFetch(`/leaves/${employeeId}/`),
    getBalance: (employeeId) => apiFetch(`/leaves/balance/${employeeId}/`),
    apply: (data) => apiFetch('/leaves/apply/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getPending: () => apiFetch('/leaves/pending/'),
    action: (id, action) => apiFetch(`/leaves/${id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    })
};

export const teamApi = {
    getTeams: () => apiFetch('/team/'),
    createTeam: (data) => apiFetch('/team/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateTeam: (id, data) => apiFetch(`/team/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteTeam: (id) => apiFetch(`/team/${id}/`, {
        method: 'DELETE'
    }),
    getMembers: (teamId) => apiFetch(`/team/members/${teamId ? `?team_id=${teamId}` : ''}`),
    searchMembers: (query) => apiFetch(`/team/members/?search=${encodeURIComponent(query)}`),
    addEmployee: (data) => apiFetch('/team/members/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateMember: (id, data) => apiFetch(`/team/members/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    getAttendanceRegistry: () => apiFetch('/team/registry/'),
    deleteMember: (id) => apiFetch(`/team/members/${id}/`, {
        method: 'DELETE'
    }),
    getStats: (teamId) => apiFetch(`/team/stats/${teamId ? `?team_id=${teamId}` : ''}`),
    getDesignations: () => apiFetch('/team/designations/'),
};

export const attendanceApi = {
    clock: (data) => apiFetch('/attendance/clock/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getStatus: (employeeId) => apiFetch(`/attendance/status/${employeeId}/?_t=${new Date().getTime()}`),
    getHistory: (employeeId) => apiFetch(`/attendance/history/${employeeId}/?_t=${new Date().getTime()}`),
    getPersonalStats: (employeeId) => apiFetch(`/attendance/stats/${employeeId}/?_t=${new Date().getTime()}`),

    // Regularization
    submitRegularization: (data) => apiFetch('/attendance/regularize/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getRegularizationRequests: (userId, role = 'manager') => apiFetch(`/attendance/regularization-requests/${userId}/?role=${role}&_t=${new Date().getTime()}`),
    actionRegularization: (requestId, action) => apiFetch(`/attendance/regularization/${requestId}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    }),
    actionRegularization: (requestId, action) => apiFetch(`/attendance/regularization/${requestId}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    }),
    resolveLocation: (lat, lon) => apiFetch(`/attendance/resolve-location/?lat=${lat}&lon=${lon}`),
    getHolidays: () => apiFetch(`/holidays/?_t=${new Date().getTime()}`)
};

export const feedApi = {
    getPosts: () => apiFetch(`/posts/?_t=${new Date().getTime()}`),
    createPost: (data) => apiFetch('/posts/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    toggleLike: (postId, employeeId) => apiFetch(`/posts/${postId}/like/`, {
        method: 'POST',
        body: JSON.stringify({ employee_id: employeeId })
    }),
    addComment: (postId, employeeId, content) => apiFetch(`/posts/${postId}/comment/`, {
        method: 'POST',
        body: JSON.stringify({ employee_id: employeeId, content })
    }),
    deleteComment: (postId, commentId, employeeId) => apiFetch(`/posts/${postId}/comment/${commentId}/?employee_id=${employeeId}`, {
        method: 'DELETE'
    }),
    deletePost: (postId) => apiFetch(`/posts/${postId}/`, {
        method: 'DELETE'
    })
};

export const wfhApi = {
    apply: (data) => apiFetch('/wfh/apply/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getRequests: (employeeId) => apiFetch(`/wfh/requests/${employeeId}/`),
    getPending: () => apiFetch('/wfh/pending/'),
    action: (id, action) => apiFetch(`/wfh/${id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    })
};

export const adminApi = {
    getDashboardStats: () => apiFetch(`/admin/dashboard-stats/?_t=${new Date().getTime()}`)
};
