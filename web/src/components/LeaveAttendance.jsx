import React, { useState, useEffect } from 'react';
import {
    Plus,
    Thermometer,
    TentTree,
    Plane
} from 'lucide-react';
import { leaveApi, authApi, attendanceApi } from '../services/api';
import LeaveBalanceGrid from './LeaveAttendance/LeaveBalanceGrid';
import LeaveHistoryTable from './LeaveAttendance/LeaveHistoryTable';
import ApplyLeaveModal from './LeaveAttendance/ApplyLeaveModal';
import Toast from './Common/Toast';
import LoadingSpinner from './Common/LoadingSpinner';
import AttendanceHistoryTable from './LeaveAttendance/AttendanceHistoryTable';
import WorkFromHome from './LeaveAttendance/WorkFromHome';
import ApplyWFHModal from './Common/ApplyWFHModal';

function LeaveAttendance({ user }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWFHModalOpen, setIsWFHModalOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' or 'attendance'
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [toast, setToast] = useState(null);
    const [apiBalance, setApiBalance] = useState({});
    const [holidays, setHolidays] = useState([]);

    const EMPLOYEE_ID = user?.id;
    const LEAVE_TYPES = {
        'cl': { name: 'CASUAL LEAVE', code: 'CL', icon: <Plane size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        'sl': { name: 'SICK LEAVE', code: 'SL', icon: <Thermometer size={20} />, color: 'text-red-600', bg: 'bg-red-50' },
        'el': { name: 'EARNED LEAVE', code: 'EL', icon: <TentTree size={20} />, color: 'text-green-600', bg: 'bg-green-50' },
        'scl': { name: 'SPECIAL CASUAL LEAVE', code: 'SCL', icon: <Plane size={20} />, color: 'text-purple-600', bg: 'bg-purple-50' },
        'pl': { name: 'PATERNITY LEAVE', code: 'PL', icon: <Plane size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        'bl': { name: 'BEREAVEMENT LEAVE', code: 'BL', icon: <Plane size={20} />, color: 'text-gray-600', bg: 'bg-gray-50' },
        'll': { name: 'LONG LEAVE', code: 'LL', icon: <Plane size={20} />, color: 'text-orange-600', bg: 'bg-orange-50' },
        'co': { name: 'COMPENSATORY OFF', code: 'CO', icon: <Plane size={20} />, color: 'text-teal-600', bg: 'bg-teal-50' },
        'lwp': { name: 'LEAVE WITHOUT PAY', code: 'LWP', icon: <Plane size={20} />, color: 'text-rose-600', bg: 'bg-rose-50' }
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
        }
    };

    const fetchBalance = async () => {
        try {
            const data = await leaveApi.getBalance(EMPLOYEE_ID);
            setApiBalance(data);
        } catch (error) {
            console.error("Failed to fetch balance:", error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const data = await attendanceApi.getHistory(EMPLOYEE_ID);
            setAttendanceHistory(data);
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([
                fetchLeaves(),
                fetchBalance(),
                fetchAttendance()
            ]);
            setLoading(false);
        };
        loadInitialData();

        attendanceApi.getHolidays().then(h => setHolidays(h)).catch(() => setHolidays([]));

        const pollInterval = setInterval(() => {
            fetchLeaves();
            fetchBalance();
            fetchAttendance();
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [EMPLOYEE_ID]);

    const calculateBalances = () => {
        const balances = [];
        ['cl', 'sl', 'bl'].forEach(code => {
            if (code === 'lwp') return;
            const config = LEAVE_TYPES[code];
            const consumed = history
                .filter(log => log.typeCode === code && (log.status === 'Approved' || log.status === 'Pending'))
                .reduce((sum, log) => sum + log.days, 0);

            if (apiBalance.hasOwnProperty(code)) {
                const available = apiBalance[code] || 0;
                const total = available + consumed;
                balances.push({ ...config, code, consumed, available, total });
            }
        });
        return balances;
    };

    const balances = calculateBalances();


    const calculateStats = (log) => {
        const hasCheckIn = log.checkIn && log.checkIn !== '-';
        if (!hasCheckIn) {
            return { gross: '-', effective: '-', arrivalStatus: '-', arrivalColor: '' };
        }

        const parseTime = (timeStr) => {
            if (!timeStr || timeStr === '-') return null;
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (hours === 12) hours = 0;
            if (modifier === 'PM') hours += 12;
            const d = new Date();
            d.setHours(hours, minutes, 0, 0);
            return d;
        };

        const checkIn = parseTime(log.checkIn);
        const checkOut = parseTime(log.checkOut);

        let grossStr = '-';
        let effStr = '-';

        if (checkOut && checkIn) {
            let grossDiff = (checkOut - checkIn) / (1000 * 60);
            if (grossDiff < 0) grossDiff += 24 * 60;
            const grossH = Math.floor(grossDiff / 60);
            const grossM = Math.floor(grossDiff % 60);
            grossStr = `${grossH}h ${grossM}m`;

            const effectiveDiff = Math.max(0, grossDiff - (log.breakMinutes || 0));
            const effH = Math.floor(effectiveDiff / 60);
            const effM = Math.floor(effectiveDiff % 60);
            effStr = `${effH}h ${String(effM).padStart(2, '0')}m`;
        }

        const shiftStart = parseTime('09:30 AM');
        let arrivalStatus = 'On Time';
        let arrivalColor = 'text-green-600';

        if (shiftStart && checkIn) {
            const diffMinutes = (checkIn - shiftStart) / (1000 * 60);
            if (diffMinutes > 1) {
                arrivalStatus = 'Late';
                arrivalColor = 'text-red-600';
            }
        }

        return { gross: grossStr, effective: effStr, arrivalStatus, arrivalColor };
    };

    if (loading) {
        return <LoadingSpinner size={40} className="p-10" />;
    }

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 tab:p-8 bg-[#f5f7fa]">
            <div className="max-w-6xl mx-auto space-y-6 mm:space-y-10">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mm:mb-10">
                    <div className="text-left">
                        <h1 className="text-2xl mm:text-3xl font-black text-[#1e293b] tracking-tight">Leave & Attendance</h1>
                        <p className="text-[12px] mm:text-sm text-[#64748b] font-medium mt-1 italic">Manage your time off and track attendance records</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsWFHModalOpen(true)}
                            className="bg-white text-[#48327d] border border-[#48327d] font-bold py-2 px-4 mm:px-6 rounded-lg text-xs mm:text-sm shadow-sm hover:bg-purple-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap w-fit"
                        >
                            <Plus size={18} /> Request for WFH
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#48327d] text-white font-bold py-2 px-4 mm:px-6 rounded-lg text-xs mm:text-sm shadow-lg shadow-[#48327d]/20 hover:bg-[#34245c] transition-all flex items-center justify-center gap-2 whitespace-nowrap w-fit"
                        >
                            <Plus size={18} /> Request for Leave
                        </button>
                    </div>
                </header>

                <LeaveBalanceGrid balances={balances} />

                {/* History Section with Tabs */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 border-b border-[#e2e8f0]">
                        <button
                            onClick={() => setActiveTab('leaves')}
                            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'leaves' ? 'border-[#48327d] text-[#48327d]' : 'border-transparent text-[#64748b] hover:text-[#48327d]'}`}
                        >
                            Leave Logs
                        </button>
                        {/* Attendance Logs tab removed */}
                        <button
                            onClick={() => setActiveTab('wfh')}
                            className={`pb-2 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'wfh' ? 'border-[#48327d] text-[#48327d]' : 'border-transparent text-[#64748b] hover:text-[#48327d]'}`}
                        >
                            Work From Home
                        </button>
                    </div>

                    {activeTab === 'leaves' ? (
                        <LeaveHistoryTable
                            history={history}
                        // onViewFullHistory removed as Attendance Logs tab is gone
                        />
                    ) : activeTab === 'attendance' ? (
                        <AttendanceHistoryTable
                            attendanceHistory={attendanceHistory}
                            calculateStats={calculateStats}
                        />
                    ) : (
                        <WorkFromHome user={user} setToast={setToast} />
                    )}
                </div>

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
                {isModalOpen && (
                    <ApplyLeaveModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        user={user}
                        onSubmitSuccess={() => fetchLeaves()}
                        setToast={setToast}
                    />
                )}
                <ApplyWFHModal
                    isOpen={isWFHModalOpen}
                    onClose={() => {
                        setIsWFHModalOpen(false);
                        fetchLeaves(); // Refresh list if on WFH tab
                    }}
                    user={user}
                    setToast={setToast}
                />
            </div>
        </div>
    );
}

export default LeaveAttendance;
