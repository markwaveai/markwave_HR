import React, { useState, useEffect } from 'react';
import { ChevronDown, Info, MoreVertical, UserCheck } from 'lucide-react';
import BreakInfo from './BreakInfo';
import RegularizationModal from './RegularizationModal';
import RegularizationRequests from './RegularizationRequests';
import { attendanceApi } from '../../services/api';

const AttendanceLog = ({
    filterType, setFilterType,
    selectedMonth, setSelectedMonth,
    monthOptions, displayedLogs,
    calculateStats, activeBreakIndex, setActiveBreakIndex,
    currentTime, user, onRefresh
}) => {
    const [activeTab, setActiveTab] = useState('log'); // 'log' or 'requests'
    const [requestMode, setRequestMode] = useState(user?.is_manager ? 'team' : 'me');
    const [regModalOpen, setRegModalOpen] = useState(false);
    const [selectedLogForReg, setSelectedLogForReg] = useState(null);
    const [activeMenuIndex, setActiveMenuIndex] = useState(null);
    const [requestsCount, setRequestsCount] = useState(0);

    // Fetch requests count for badge
    const fetchCount = async () => {
        if (!user || (!user.employee_id && !user.id)) return;

        try {
            const uid = user.employee_id || user.id;
            let totalPending = 0;

            // 1. Always check for personal pending requests
            const myRequests = await attendanceApi.getRegularizationRequests(uid, 'employee');
            if (Array.isArray(myRequests)) {
                totalPending += myRequests.filter(r => r.status === 'Pending').length;
            }

            // 2. If manager, also check for team pending requests
            if (user.is_manager || user.role === 'Administrator') {
                const teamRequests = await attendanceApi.getRegularizationRequests(uid, 'manager');
                if (Array.isArray(teamRequests)) {
                    totalPending += teamRequests.filter(r => r.status === 'Pending').length;
                }
            }

            setRequestsCount(totalPending);
        } catch (e) {
            console.error("Failed to fetch requests count:", e);
        }
    };

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, [user]);

    const handleRequestProcessed = () => {
        // Decrement local count immediately for better UX
        setRequestsCount(prev => Math.max(0, prev - 1));
        // Also trigger a refresh to be sure
        fetchCount();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeBreakIndex !== null && !event.target.closest('.break-container')) {
                setActiveBreakIndex(null);
            }
            if (activeMenuIndex !== null && !event.target.closest('.menu-container')) {
                setActiveMenuIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeBreakIndex, setActiveBreakIndex, activeMenuIndex]);

    const handleRegularizeClick = (log) => {
        setSelectedLogForReg(log);
        setRegModalOpen(true);
        setActiveMenuIndex(null);
    };

    const parseTimeToMinutes = (timeStr) => {
        if (!timeStr || timeStr === '-') return null;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (hours === 12) hours = 0;
        if (modifier === 'PM') hours += 12;
        return hours * 60 + minutes;
    };

    const getVisualSegments = (log) => {
        // Fallback for missing logs or basic data
        if (!log.logs || log.logs.length === 0) {
            // Use effective progress from stats if no detailed logs
            const { effectiveProgress } = calculateStats(log);
            return [{ type: 'work', width: effectiveProgress }];
        }

        const startMins = parseTimeToMinutes(log.logs[0].in);
        let endMins = 0;

        // Find end time
        const lastLog = log.logs[log.logs.length - 1];
        if (lastLog.out && lastLog.out !== '-') {
            endMins = parseTimeToMinutes(lastLog.out);
        } else if (log.checkOut && log.checkOut !== '-') {
            // Use regularized checkout time if available
            endMins = parseTimeToMinutes(log.checkOut);
        } else {
            // Active session, use current time
            endMins = currentTime.getHours() * 60 + currentTime.getMinutes();
        }

        let totalSpan = endMins - startMins;
        if (totalSpan <= 0) totalSpan = 1; // Prevent div by zero

        const segments = [];

        log.logs.forEach((session, idx) => {
            const sIn = parseTimeToMinutes(session.in);
            let sOut = 0;

            if (session.out && session.out !== '-') {
                sOut = parseTimeToMinutes(session.out);
            } else if (idx === log.logs.length - 1) {
                sOut = endMins;
            } else {
                // If middle session is missing an OUT, use the next IN or endMins
                sOut = parseTimeToMinutes(log.logs[idx + 1]?.in) || endMins;
            }

            // Gap before this session (Break)
            if (idx > 0) {
                const prevOut = parseTimeToMinutes(log.logs[idx - 1].out);
                if (prevOut !== null && sIn !== null) {
                    const gap = sIn - prevOut;
                    if (gap > 0) {
                        segments.push({ type: 'break', width: (gap / totalSpan) * 100 });
                    }
                }
            }

            // Work Session
            if (sIn !== null && sOut !== null) {
                const duration = sOut - sIn;
                if (duration > 0) {
                    segments.push({ type: 'work', width: (duration / totalSpan) * 100 });
                }
            }
        });

        return segments;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-[#e2e8f0] overflow-hidden w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 mm:p-4 border-b border-[#e2e8f0] gap-4">
                <div className="flex gap-1 bg-[#f1f2f6] p-1 rounded-lg w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('log')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === 'log' ? 'bg-white text-[#2d3436] shadow-sm' : 'text-[#636e72] hover:text-[#2d3436]'}`}
                    >
                        Attendance Log
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider whitespace-nowrap transition-all flex items-center justify-center gap-1.5 ${activeTab === 'requests' ? 'bg-white text-[#2d3436] shadow-sm' : 'text-[#636e72] hover:text-[#2d3436]'}`}
                    >
                        Requests
                        {requestsCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] px-1 rounded-full min-w-[15px] h-[15px] flex items-center justify-center leading-none">
                                {requestsCount}
                            </span>
                        )}
                    </button>
                    <button className="flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold text-[#636e72] hover:text-[#2d3436] uppercase tracking-wider whitespace-nowrap opacity-50 cursor-not-allowed">Calendar</button>
                </div>
                <div className="flex items-center justify-end w-full sm:w-auto">
                    <div className="flex bg-white border border-[#e2e8f0] rounded-md overflow-hidden p-1 gap-1 w-full sm:w-auto">
                        <button
                            onClick={() => setFilterType('30Days')}
                            className={`flex-1 sm:flex-none px-2 mm:px-3 py-1 text-[10px] mm:text-xs font-bold rounded transition-colors whitespace-nowrap ${filterType === '30Days'
                                ? 'bg-[#48327d] text-white'
                                : 'text-[#636e72] hover:bg-[#f1f2f6]'
                                }`}
                        >
                            30 DAYS
                        </button>
                        <div className="relative flex-1 sm:flex-none">
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    setFilterType('Month');
                                }}
                                className={`appearance-none w-full pl-2 mm:pl-3 pr-6 mm:pr-8 py-1 text-[10px] mm:text-xs font-bold rounded outline-none cursor-pointer transition-colors ${filterType === 'Month'
                                    ? 'bg-[#48327d] text-white'
                                    : 'text-[#636e72] hover:bg-[#f1f2f6]'
                                    }`}
                            >
                                {monthOptions.map(opt => (
                                    <option key={opt.value} value={opt.value} className="text-[#2d3436] bg-white text-[10px] mm:text-xs">{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={10} className={`absolute right-1.5 mm:right-2 top-1/2 -translate-y-1/2 pointer-events-none ${filterType === 'Month' ? 'text-white' : 'text-[#636e72]'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'requests' && user?.is_manager && (
                <div className="px-4 py-2 bg-[#f8fafc] border-b border-[#e2e8f0] flex gap-4">
                    <button
                        onClick={() => setRequestMode('team')}
                        className={`text-[10px] font-bold uppercase tracking-tight px-3 py-1 rounded-full transition-all ${requestMode === 'team' ? 'bg-[#48327d] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        Team Requests
                    </button>
                    <button
                        onClick={() => setRequestMode('me')}
                        className={`text-[10px] font-bold uppercase tracking-tight px-3 py-1 rounded-full transition-all ${requestMode === 'me' ? 'bg-[#48327d] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        My Requests
                    </button>
                </div>
            )}

            {activeTab === 'log' ? (
                <div className="overflow-x-auto pb-4">
                    <table className="w-full min-w-[1500px]">
                        <thead>
                            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider w-[120px]">Date</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider w-[180px]">Attendance Visual</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider">Check-In</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider">Breaks</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider">Check-Out</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider">Gross Hrs</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider">Effective Hrs</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider">Arrival Time</th>
                                <th className="p-4 text-center text-xs font-bold text-[#636e72] uppercase tracking-wider">Arrival Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedLogs.map((log, index) => {
                                const { gross, effective, arrivalStatus, arrivalColor, effectiveProgress } = calculateStats(log);
                                const [y, m, d] = log.date.split('-').map(Number);
                                const logDate = new Date(y, m - 1, d);
                                const isWeekend = logDate.getDay() === 0 || logDate.getDay() === 6;
                                const isHoliday = log.isHoliday;
                                const currentDay = new Date(currentTime);
                                const isToday = y === currentDay.getFullYear() && (m - 1) === currentDay.getMonth() && d === currentDay.getDate();
                                const hasActualActivity = (log.checkIn && log.checkIn !== '-') || (log.logs && log.logs.length > 0);
                                const isApprovedLeave = !!log.leaveType;
                                const isAbsent = !isWeekend && !isHoliday && !isToday && !hasActualActivity && !isApprovedLeave;
                                const isHalfDayLeave = isApprovedLeave && (log.leaveType.toLowerCase().includes('half') || log.leaveType.toLowerCase().includes('session'));
                                const isFullDayLeave = isApprovedLeave && !isHalfDayLeave;

                                // Collapse row for Weekend, Holiday, Absent, or Full Day Leave (if no activity)
                                const showAsOffDay = (isWeekend || isHoliday || isAbsent || isFullDayLeave) && !hasActualActivity;

                                const isMissedCheckout = log.checkOut === '-' && log.checkIn !== '-' && new Date(log.date).setHours(0, 0, 0, 0) < new Date(currentTime).setHours(0, 0, 0, 0);
                                const isMissedCheckin = log.checkIn === '-' && (log.checkOut && log.checkOut !== '-') && new Date(log.date).setHours(0, 0, 0, 0) < new Date(currentTime).setHours(0, 0, 0, 0);

                                const getLeaveBadge = (type) => {
                                    if (!type) return null;
                                    let label = type.toUpperCase();
                                    // Shorten common half day strings for badges
                                    label = label.replace('FIRST HALF ', '1ST HALF ');
                                    label = label.replace('SECOND HALF ', '2ND HALF ');
                                    return (
                                        <span className="px-1.5 py-0.5 text-[7px] mm:text-[8px] rounded-full uppercase font-bold whitespace-nowrap bg-indigo-50 text-indigo-600 border border-indigo-100">
                                            {label}
                                        </span>
                                    );
                                };

                                return (
                                    <tr key={index} className={`border-b border-[#e2e8f0] last:border-none hover:bg-[#f9fafb] transition-colors ${showAsOffDay ? 'bg-[#f5f5f5]' : 'bg-white'}`}>
                                        <td className="p-2 mm:p-4 text-xs mm:text-sm font-medium text-[#2d3436] text-center">
                                            <div className="flex flex-col mm:flex-row items-center justify-center gap-1 mm:gap-2">
                                                <span className="whitespace-nowrap">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}</span>

                                                {/* Status Badges */}
                                                <div className="flex items-center gap-1">
                                                    {(isHoliday || isWeekend || isAbsent) && (
                                                        <span className={`px-1.5 py-0.5 text-[7px] mm:text-[8px] rounded-full uppercase font-bold whitespace-nowrap ${isAbsent ? 'bg-[#fff1f2] text-[#f43f5e] border border-[#ffe4e6]' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                                            {isHoliday ? (log.isOptionalHoliday ? 'OPTIONAL HOLIDAY' : 'HOLIDAY') : isWeekend ? 'W-OFF' : 'ABSENT'}
                                                        </span>
                                                    )}
                                                    {isApprovedLeave && getLeaveBadge(log.leaveType)}
                                                </div>
                                            </div>
                                        </td>

                                        {showAsOffDay ? (
                                            <td colSpan="8" className="p-4 text-sm text-[#2d3436] font-medium text-center">
                                                {(() => {
                                                    const getLeaveLabel = (code) => {
                                                        const map = {
                                                            'SL': 'Sick Leave',
                                                            'CL': 'Casual Leave',
                                                            'EL': 'Earned Leave',
                                                            'PL': 'Privilege Leave',
                                                            'LOP': 'Loss of Pay'
                                                        };
                                                        if (code?.includes('Half Day')) {
                                                            const type = code.replace('Half Day ', '');
                                                            return `Half Day ${map[type.toUpperCase()] || type}`;
                                                        }
                                                        if (code?.includes('First Half')) {
                                                            const type = code.replace('First Half ', '');
                                                            return `First Half ${map[type.toUpperCase()] || type}`;
                                                        }
                                                        if (code?.includes('Second Half')) {
                                                            const type = code.replace('Second Half ', '');
                                                            return `Second Half ${map[type.toUpperCase()] || type}`;
                                                        }
                                                        return map[code?.toUpperCase()] || code?.toUpperCase() || 'Leave';
                                                    };

                                                    if (isHoliday) {
                                                        if (log.holidayName) return log.holidayName;
                                                        return log.isOptionalHoliday ? 'Full day Optional Holiday' : 'Full day Holiday';
                                                    }
                                                    if (isWeekend) return 'Full day Weekly-off';
                                                    if (isApprovedLeave) return `Full Day ${getLeaveLabel(log.leaveType)}`;
                                                    return 'Absent';
                                                })()}
                                            </td>
                                        ) : (
                                            <>
                                                <td className="p-4">
                                                    <div className="h-2 w-full bg-[#f1f2f6] rounded-full overflow-hidden flex">
                                                        {getVisualSegments(log).map((seg, i) => (
                                                            <div
                                                                key={i}
                                                                className={`h-full ${seg.type === 'work' ? 'bg-[#48327d]' : 'bg-transparent'}`}
                                                                style={{ width: `${seg.width}%` }}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-xs text-[#2d3436] font-medium">
                                                    {isMissedCheckin ? (
                                                        <span className="text-[#ef4444] font-semibold text-[10px] uppercase bg-red-50 px-2 py-0.5 rounded">Missed Check-In</span>
                                                    ) : (
                                                        log.checkIn
                                                    )}
                                                </td>
                                                <td className="p-4 text-center text-xs text-[#636e72] relative">
                                                    {log.breakMinutes > 0 ? (
                                                        <div className="break-container">
                                                            <button
                                                                onClick={() => setActiveBreakIndex(activeBreakIndex === index ? null : index)}
                                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors inline-flex items-center justify-center text-[#48327d]"
                                                                title="View break timings"
                                                            >
                                                                <Info size={16} />
                                                            </button>
                                                            <BreakInfo log={log} activeBreakIndex={activeBreakIndex} index={index} />
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="p-4 text-center text-xs text-[#2d3436] font-medium flex items-center justify-center gap-2 relative">
                                                    {isMissedCheckout ? (
                                                        <span className="text-[#ef4444] font-semibold text-[10px] uppercase bg-red-50 px-2 py-0.5 rounded">Missed Check-Out</span>
                                                    ) : (
                                                        log.checkOut
                                                    )}

                                                    {isMissedCheckout && (
                                                        <div className="menu-container relative">
                                                            <button
                                                                onClick={() => setActiveMenuIndex(activeMenuIndex === index ? null : index)}
                                                                className="p-1 text-gray-400 hover:text-[#48327d] hover:bg-gray-100 rounded-full transition-colors"
                                                            >
                                                                <MoreVertical size={14} />
                                                            </button>
                                                            {activeMenuIndex === index && (
                                                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 overflow-hidden animate-modal-in">
                                                                    <button
                                                                        onClick={() => handleRegularizeClick(log)}
                                                                        className="w-full text-left px-3 py-2 text-xs font-bold text-[#2d3436] hover:bg-[#f8fafc] flex items-center gap-2"
                                                                    >
                                                                        <UserCheck size={12} className="text-[#48327d]" />
                                                                        Regularize
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center text-xs text-[#2d3436] font-medium">{gross}</td>
                                                <td className="p-4 text-center text-sm text-[#48327d] font-bold">{effective}</td>
                                                <td className="p-4 text-center text-xs text-[#2d3436]">{log.checkIn}</td>
                                                <td className="p-4 text-center text-xs font-medium">
                                                    {arrivalStatus !== '-' && (
                                                        <div className={`flex items-center justify-center gap-1.5 ${arrivalColor}`}>
                                                            <span className="capitalize">{arrivalStatus}</span>
                                                        </div>
                                                    )}
                                                    {arrivalStatus === '-' && <span className="text-[#b2bec3]">-</span>}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <RegularizationRequests user={user} onAction={handleRequestProcessed} role={requestMode === 'team' ? 'manager' : 'employee'} />
            )}

            <RegularizationModal
                isOpen={regModalOpen}
                onClose={() => setRegModalOpen(false)}
                log={selectedLogForReg}
                user={user}
                onSuccess={() => {
                    fetchCount();
                    if (onRefresh) onRefresh();
                }}
            />
        </div>
    );
};

export default AttendanceLog;
