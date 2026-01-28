export const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `API Error: ${response.statusText}`);
        error.response = { data: errorData };
        throw error;
    }

    return response.json();
};

export const authApi = {
    getProfile: (employeeId) => apiFetch(`/auth/profile/${employeeId}/`)
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
    addEmployee: (data) => apiFetch('/team/members/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateMember: (id, data) => apiFetch(`/team/members/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    getAttendanceRegistry: () => apiFetch('/team/registry/'),
    getStats: (teamId) => apiFetch(`/team/stats/${teamId ? `?team_id=${teamId}` : ''}`),
    getRoles: () => apiFetch('/team/roles/'),
};

export const attendanceApi = {
    clock: (data) => apiFetch('/attendance/clock/', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getStatus: (employeeId) => apiFetch(`/attendance/status/${employeeId}/?_t=${new Date().getTime()}`),
    getHistory: (employeeId) => apiFetch(`/attendance/history/${employeeId}/?_t=${new Date().getTime()}`),
    getPersonalStats: (employeeId) => apiFetch(`/attendance/stats/${employeeId}/?_t=${new Date().getTime()}`)
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
    deletePost: (postId) => apiFetch(`/posts/${postId}/`, {
        method: 'DELETE'
    })
};

export const adminApi = {
    getDashboardStats: () => apiFetch(`/admin/dashboard-stats/?_t=${new Date().getTime()}`)
};
