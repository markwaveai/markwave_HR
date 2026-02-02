import React, { useState, useEffect } from 'react';
import {
    Plus,
    Thermometer,
    TentTree,
    Plane
} from 'lucide-react';
import { leaveApi, authApi } from '../services/api';
import LeaveBalanceGrid from './LeaveAttendance/LeaveBalanceGrid';
import LeaveHistoryTable from './LeaveAttendance/LeaveHistoryTable';
import ApplyLeaveModal from './LeaveAttendance/ApplyLeaveModal';
import Toast from './Common/Toast';

function LeaveAttendance({ user }) {
    const [leaveType, setLeaveType] = useState('cl');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [fromSession, setFromSession] = useState('Full Day');
    const [toSession, setToSession] = useState('Full Day');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifyTo, setNotifyTo] = useState([]);
    const [profile, setProfile] = useState(null);
    const [toast, setToast] = useState(null);
    const EMPLOYEE_ID = user?.id;

    const LEAVE_TYPES = {
        'cl': { name: 'CASUAL LEAVE', code: 'CL', total: 6, icon: <Plane size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        'sl': { name: 'SICK LEAVE', code: 'SL', total: 6, icon: <Thermometer size={20} />, color: 'text-red-600', bg: 'bg-red-50' },
        'el': { name: 'EARNED LEAVE', code: 'EL', total: 17, icon: <TentTree size={20} />, color: 'text-green-600', bg: 'bg-green-50' }
    };

    const fetchLeaves = async () => {
        try {
            const data = await leaveApi.getLeaves(EMPLOYEE_ID);
            const formatDateWithDay = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const yyyy = date.getFullYear();
                return `${day}, ${dd}-${mm}-${yyyy}`;
            };

            const formattedData = data.map(item => {
                const fromWithDay = formatDateWithDay(item.fromDate);
                const toWithDay = formatDateWithDay(item.toDate);

                return {
                    ...item,
                    typeCode: item.type,
                    type: LEAVE_TYPES[item.typeCode]?.name || item.type,
                    dates: item.fromDate === item.toDate ? fromWithDay : `${fromWithDay} to ${toWithDay}`,
                    statusColor: item.status === 'Approved'
                        ? 'text-green-600 bg-green-50'
                        : item.status === 'Rejected'
                            ? 'text-red-600 bg-red-50'
                            : 'text-amber-600 bg-amber-50'
                };
            });
            setHistory(formattedData);
        } catch (error) {
            console.error("Failed to fetch leaves:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();

        if (EMPLOYEE_ID) {
            authApi.getProfile(EMPLOYEE_ID).then(p => {
                setProfile(p);
            }).catch(console.error);
        }

        // Add Polling for real-time updates (every 5 seconds)
        const pollInterval = setInterval(() => {
            fetchLeaves();
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [EMPLOYEE_ID]);

    const calculateBalances = () => {
        return Object.keys(LEAVE_TYPES).map(code => {
            const config = LEAVE_TYPES[code];
            const consumed = history
                .filter(log => log.typeCode === code && (log.status === 'Approved' || log.status === 'Pending'))
                .reduce((sum, log) => sum + log.days, 0);

            return {
                ...config,
                consumed,
                available: config.total - consumed
            };
        });
    };

    const balances = calculateBalances();

    const handleLeaveSubmit = async () => {
        if (!fromDate || !reason.trim()) {
            setToast({ message: "From Date and Reason are required.", type: 'error' });
            return;
        }

        const effectiveToDate = toDate || fromDate;
        const start = new Date(fromDate);
        const end = new Date(effectiveToDate);

        if (end < start) {
            setToast({ message: "To Date cannot be earlier than From Date.", type: 'error' });
            return;
        }

        const diffTime = Math.abs(end - start);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (fromDate === toDate) {
            // Single day logic
            if (fromSession !== 'Full Day') {
                diffDays = 0.5;
            }
        } else {
            // Multi-day logic
            if (fromSession !== 'Full Day') diffDays -= 0.5;
            if (toSession !== 'Full Day') diffDays -= 0.5;
        }

        try {
            await leaveApi.apply({
                employeeId: EMPLOYEE_ID,
                type: leaveType,
                fromDate,
                toDate: effectiveToDate,
                days: diffDays,
                reason: reason.trim(),
                notifyTo: notifyTo.join(', ')
            });

            await fetchLeaves();

            setFromDate('');
            setToDate('');
            setReason('');
            setLeaveType('cl');
            setNotifyTo([]);
            setFromSession('Full Day');
            setToSession('Full Day');
            setIsModalOpen(false);
            setToast({ message: "Leave applied successfully!", type: 'success' });
        } catch (error) {
            console.error("Failed to submit leave:", error);
            const errorMessage = error.response?.data?.error || "Failed to submit leave request.";
            if (errorMessage === 'Leave already applied for this date range') {
                setToast({ message: "You have already applied leave for this date. Duplicate leave requests are not allowed.", type: 'error' });
            } else {
                setToast({ message: errorMessage, type: 'error' });
            }
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-[#636e72]">Loading leave data...</div>;
    }

    return (
        <div className="flex-1 p-8 bg-[#f5f7fa]">
            <div className="max-w-6xl mx-auto space-y-10">
                <header className="flex justify-between items-center mb-10">
                    <div className="text-left">
                        <h1 className="text-3xl font-black text-[#1e293b] tracking-tight">Leave & Attendance</h1>
                        <p className="text-sm text-[#64748b] font-medium mt-1 italic">Manage your time off and track attendance records</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#48327d] text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-lg shadow-[#48327d]/20 hover:bg-[#34245c] transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={18} /> Request for Leave
                    </button>
                </header>

                <LeaveBalanceGrid balances={balances} />

                <LeaveHistoryTable history={history} />

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
                {isModalOpen && (
                    <ApplyLeaveModal
                        setIsModalOpen={setIsModalOpen}
                        leaveType={leaveType}
                        setLeaveType={setLeaveType}
                        fromDate={fromDate}
                        setFromDate={setFromDate}
                        toDate={toDate}
                        setToDate={setToDate}
                        reason={reason}
                        setReason={setReason}
                        fromSession={fromSession}
                        setFromSession={setFromSession}
                        toSession={toSession}
                        setToSession={setToSession}
                        notifyTo={notifyTo}
                        setNotifyTo={setNotifyTo}
                        user={user}
                        profile={profile}
                        handleLeaveSubmit={handleLeaveSubmit}
                    />
                )}
            </div>
        </div>
    );
}

export default LeaveAttendance;
