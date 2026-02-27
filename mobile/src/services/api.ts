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
            if (isNetworkError) {
                console.log(`Network failure [${url}]: Possible causes: Server down, invalid IP, or same-network restriction.`);
            }
            console.log(`Fetch error [${url}]:`, error instanceof Error ? error.message : JSON.stringify(error));
            throw error;
        }
    };

    return attemptFetch(0);
};

export const authApi = {
    sendOTP: (phone: string, action?: string) => apiFetch('/auth/send-otp/', {
        method: 'POST',
        body: JSON.stringify({ phone, action })
    }),
    updateAccountStatus: (phone: string, otp: string, action: string) => apiFetch('/auth/update-status/', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, action })
    }),
    verifyOTP: (phone: string, otp: string) => apiFetch('/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ phone, otp })
    }),
    sendEmailOTP: (email: string) => {
        if (email.trim().toLowerCase() === 'demo@gmail.com') {
            return Promise.resolve({ success: true, message: 'OTP sent successfully' });
        }
        return apiFetch('/auth/send-email-otp/', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },
    verifyEmailOTP: (email: string, otp: string) => {
        if (email.trim().toLowerCase() === 'demo@gmail.com' && otp === '123456') {
            return Promise.resolve({
                success: true,
                user: {
                    id: 9999,
                    employee_id: "EMP-DEMO",
                    first_name: "Demo",
                    last_name: "User",
                    email: "demo@gmail.com",
                    role: "Employee",
                    designation: "Guest User",
                    department: "Product",
                    location: "Remote",
                    is_admin: false,
                    team_id: 99,
                    teams: [{ id: 99, name: 'Frontend Team', manager_name: 'Tech Lead' }]
                }
            });
        }
        return apiFetch('/auth/verify-email-otp/', {
            method: 'POST',
            body: JSON.stringify({ email, otp })
        });
    },
    login: (phone: string, pin: string) => apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ phone, password: pin })
    }),
    getProfile: (employeeId: string | number) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            return Promise.resolve({
                id: 9999,
                employee_id: "EMP-DEMO",
                first_name: "Demo",
                last_name: "User",
                email: "demo@gmail.com",
                role: "Employee",
                designation: "Guest User",
                department: "Product",
                location: "Remote",
                is_admin: false,
                phone: "9876543210",
                team_id: 99,
                teams: [{ id: 99, name: 'Frontend Team', manager_name: 'Tech Lead' }]
            });
        }
        return apiFetch(`/auth/profile/${employeeId}/`);
    },
    updateProfile: (employeeId: string | number, data: any) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            return Promise.resolve({ success: true, message: 'Settings saved locally.' });
        }
        return apiFetch(`/team/members/${employeeId}/`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    updateProfilePicture: (employeeId: string | number, imageUri: string, mimeType: string, fileName: string) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            return Promise.resolve({ success: true });
        }
        const formData = new FormData();
        formData.append('profile_picture', {
            uri: imageUri,
            type: mimeType,
            name: fileName,
        } as any);

        return fetch(`${API_BASE_URL}/team/members/${employeeId}/`, {
            method: 'PATCH',
            body: formData,
            headers: {}
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
    getLeaves: (employeeId: string | number) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            const today = new Date();
            const from1 = new Date(today); from1.setDate(today.getDate() - 10);
            const to1 = new Date(today); to1.setDate(today.getDate() - 9);
            const from2 = new Date(today); from2.setDate(today.getDate() - 25);
            return Promise.resolve([
                { id: 1, type: 'cl', fromDate: from1.toISOString().split('T')[0], toDate: to1.toISOString().split('T')[0], status: 'Approved', days: 2, reason: 'Personal work' },
                { id: 2, type: 'sl', fromDate: from2.toISOString().split('T')[0], toDate: from2.toISOString().split('T')[0], status: 'Approved', days: 1, reason: 'Fever' }
            ]);
        }
        return apiFetch(`/leaves/${employeeId}/`);
    },
    apply: (data: any) => {
        if (String(data?.employee_id) === 'EMP-DEMO' || String(data?.employee_id) === '9999') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch('/leaves/apply/', {
            method: 'POST',
            body: JSON.stringify({ ...data, created_at: new Date().toISOString() })
        });
    },
    getPending: () => apiFetch('/leaves/pending/'),
    getBalance: (employeeId: string | number) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            return Promise.resolve({ cl: 12, sl: 12, el: 15, scl: 3, bl: 5, pl: 3, ll: 21, co: 2 });
        }
        return apiFetch(`/leaves/balance/${employeeId}/`);
    },
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
    getMembers: (teamId?: number) => {
        // Since we don't have the employeeId explicitly here, we check if teamId matches a demo team ID (e.g. 99), or just return dummy data if it's the demo team
        if (teamId === 99 || teamId === 9999) {
            return Promise.resolve([
                { id: '1', name: 'Alice Smith', first_name: 'Alice', last_name: 'Smith', role: 'Frontend Engineer', email: 'alice@example.com', status: 'Active', location: 'New York' },
                { id: '2', name: 'Bob Jones', first_name: 'Bob', last_name: 'Jones', role: 'Backend Engineer', email: 'bob@example.com', status: 'On Leave', location: 'London' },
                { id: '3', name: 'Charlie Brown', first_name: 'Charlie', last_name: 'Brown', role: 'Designer', email: 'charlie@example.com', status: 'Active', location: 'Remote' }
            ]);
        }
        return apiFetch(`/team/members/${teamId ? `?team_id=${teamId}` : ''}`);
    },
    getAttendanceRegistry: () => {
        return apiFetch('/team/registry/').catch(() => []);
    },
    getStats: (teamId?: number, duration?: string) => {
        if (teamId === 99 || teamId === 9999) {
            return Promise.resolve({
                total: 3,
                active: 2,
                onLeave: 1,
                remote: 1,
                avg_working_hours: '8h 15m',
                on_time_arrival: '95%'
            });
        }
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
    getHistory: (employeeId: string | number) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            const logs = [];
            const today = new Date();
            for (let i = 1; i <= 5; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                if (d.getDay() !== 0 && d.getDay() !== 6) {
                    logs.push({
                        date: d.toISOString().split('T')[0],
                        checkIn: '09:30 AM',
                        checkOut: '06:30 PM',
                        breakMinutes: 45,
                        status: 'Present',
                        logs: [{ in: '09:30 AM', out: '06:30 PM' }]
                    });
                }
            }
            return Promise.resolve(logs);
        }
        return apiFetch(`/attendance/history/${employeeId}/?_t=${new Date().getTime()}`);
    },
    getStatus: (employeeId: string | number, options?: any) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            return Promise.resolve({ status: 'OUT', can_clock: false, disabled_reason: "View-only mode" });
        }
        return apiFetch(`/attendance/status/${employeeId}/?_t=${new Date().getTime()}`, options);
    },
    clock: (data: any) => {
        if (String(data?.employee_id) === 'EMP-DEMO' || String(data?.employee_id) === '9999') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch('/attendance/clock/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getPersonalStats: (employeeId: string | number) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            return Promise.resolve({
                week: { me: { avg: '0h 00m' }, team: { avg: '0h 00m' } },
                month: { me: { avg: '0h 00m' }, team: { avg: '0h 00m' } },
                lastWeekDiff: '+0h 00m vs last week'
            });
        }
        return apiFetch(`/attendance/stats/${employeeId}/?_t=${new Date().getTime()}`);
    },
    getHolidays: () => {
        return apiFetch('/holidays/').catch(() => []);
    },
    submitRegularization: (data: any) => {
        if (String(data?.employee_id) === 'EMP-DEMO' || String(data?.employee_id) === '9999') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch('/attendance/regularize/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getRequests: (employeeId: string | number, role: 'employee' | 'manager' = 'employee') => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            const today = new Date();
            const reqDate = new Date(today); reqDate.setDate(today.getDate() - 3);
            return Promise.resolve([
                { id: 1, date: reqDate.toISOString().split('T')[0], reason: 'Forgot to clock in', status: 'Approved' }
            ]);
        }
        return apiFetch(`/attendance/regularization-requests/${employeeId}/?role=${role}&_t=${new Date().getTime()}`);
    },
    updateRequestStatus: (id: number, action: 'Approved' | 'Rejected') => apiFetch(`/attendance/regularization/${id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    }),
    resolveLocation: (lat: number, lon: number) => apiFetch(`/attendance/resolve-location/?lat=${lat}&lon=${lon}`),
};

export const feedApi = {
    getPosts: () => apiFetch(`/posts/?_t=${new Date().getTime()}`),
    createPost: (data: any) => {
        if (String(data?.author_id) === 'EMP-DEMO' || String(data?.author_id) === '9999') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch('/posts/', {
            method: 'POST',
            body: JSON.stringify({ ...data, created_at: new Date().toISOString() })
        });
    },
    toggleLike: (postId: number, employeeId: number | string) => {
        if (String(employeeId) === '9999' || String(employeeId) === 'EMP-DEMO') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch(`/posts/${postId}/like/`, {
            method: 'POST',
            body: JSON.stringify({ employee_id: employeeId })
        });
    },
    addComment: (postId: number, employeeId: number | string, content: string) => {
        if (String(employeeId) === '9999' || String(employeeId) === 'EMP-DEMO') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch(`/posts/${postId}/comment/`, {
            method: 'POST',
            body: JSON.stringify({ employee_id: employeeId, content })
        });
    },
    deleteComment: (postId: number, commentId: number, employeeId: any) =>
        apiFetch(`/posts/${postId}/comment/${commentId}/?employee_id=${employeeId}`, {
            method: 'DELETE'
        }),
    deletePost: (postId: number) => apiFetch(`/posts/${postId}/`, {
        method: 'DELETE'
    })
};

export const wfhApi = {
    apply: (data: any) => {
        if (String(data?.employee_id) === 'EMP-DEMO' || String(data?.employee_id) === '9999') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch('/wfh/apply/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getRequests: (employeeId: string | number) => {
        if (String(employeeId) === 'EMP-DEMO' || String(employeeId) === '9999') {
            const today = new Date();
            const reqDate = new Date(today); reqDate.setDate(today.getDate() - 2);
            return Promise.resolve([
                { id: 1, status: 'Approved', from_date: reqDate.toISOString().split('T')[0], to_date: reqDate.toISOString().split('T')[0], reason: 'Remote work', applied_on: reqDate.toISOString().split('T')[0] }
            ]);
        }
        return apiFetch(`/wfh/requests/${employeeId}/`);
    },
    getPending: () => apiFetch('/wfh/pending/'),
    action: (id: number, action: 'Approve' | 'Reject') => apiFetch(`/wfh/${id}/action/`, {
        method: 'POST',
        body: JSON.stringify({ action })
    })
};

export const adminApi = {
    getDashboardStats: () => apiFetch(`/admin/dashboard-stats/?_t=${new Date().getTime()}`)
};

export const supportApi = {
    submitQuery: (data: any) => {
        if (String(data?.employee_id) === 'EMP-DEMO' || String(data?.employee_id) === '9999') {
            return Promise.reject(new Error("View-only mode: Actions are disabled for demo users."));
        }
        return apiFetch('/support/submit/', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};
