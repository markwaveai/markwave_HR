import React, { useState, useEffect } from 'react';
import AttendanceStats from './Me/AttendanceStats';
import TimingCard from './Me/TimingCard';
import ActionCard from './Me/ActionCard';
import AttendanceLog from './Me/AttendanceLog';
import { attendanceApi, teamApi } from '../services/api';
import { useMemo } from 'react';

const Me = ({ user }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeOffset, setTimeOffset] = useState(0);
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const EMPLOYEE_ID = user?.id;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date(Date.now() + timeOffset));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    useEffect(() => {
        const syncTime = async () => {
            if (!EMPLOYEE_ID) return;
            try {
                const statusData = await attendanceApi.getStatus(EMPLOYEE_ID);
                if (statusData.server_time) {
                    const serverTime = new Date(statusData.server_time).getTime();
                    const deviceTime = Date.now();
                    setTimeOffset(serverTime - deviceTime);
                    setCurrentTime(new Date(serverTime));
                }
            } catch (err) {
                console.error("Time sync failed:", err);
            }
        };
        syncTime();
    }, [EMPLOYEE_ID]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await attendanceApi.getHistory(EMPLOYEE_ID);
            setAttendanceLogs(data);
        } catch (err) {
            console.error("Failed to fetch attendance history:", err);
            // Fallback to empty or dummy if needed, but for now we expect array
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    };

    const parseTime = (timeStr) => {
        if (!timeStr || timeStr === '-') return null;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = '00';
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const calculateStats = (log) => {
        if (log.isWeekend || log.isHoliday || !log.checkIn || log.checkIn === '-') {
            return { gross: '-', effective: '-', arrivalStatus: '-', arrivalColor: '', scheduledHours: '-', effectiveProgress: 0 };
        }

        const [y, m, d] = log.date.split('-').map(Number);
        const checkInDate = new Date(y, m - 1, d);

        const checkIn = parseTime(log.checkIn);
        let checkOut = parseTime(log.checkOut);

        // If checkout is missing, check if it's today to use current time
        if (!checkOut) {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            if (log.date === todayStr) {
                checkOut = currentTime;
            }
        }

        let grossStr = '-';
        let effStr = '-';
        let effectiveProgress = 0;

        if (checkOut) {
            const grossDiff = (checkOut - checkIn) / (1000 * 60); // minutes
            const grossH = Math.floor(grossDiff / 60);
            const grossM = Math.floor(grossDiff % 60);
            grossStr = `${grossH}h ${grossM}m`;

            // Recalculate break minutes from visual logs for consistency
            let calculatedBreakMinutes = log.breakMinutes;
            if (log.logs && log.logs.length >= 1) {
                let totalBreak = 0;
                const parseTimeVal = (timeStr) => {
                    if (!timeStr || timeStr === '-' || !timeStr.includes(' ')) return 0;
                    const [time, modifier] = timeStr.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    if (hours === 12) hours = 0;
                    if (modifier === 'PM') hours += 12;
                    return hours * 60 + minutes;
                };

                for (let i = 1; i < log.logs.length; i++) {
                    const prevOut = parseTimeVal(log.logs[i - 1].out);
                    const currIn = parseTimeVal(log.logs[i].in);
                    if (prevOut > 0 && currIn > 0) {
                        totalBreak += (currIn - prevOut);
                    }
                }
                calculatedBreakMinutes = totalBreak;
            }

            const effectiveDiff = Math.max(0, grossDiff - calculatedBreakMinutes);
            const effH = Math.floor(effectiveDiff / 60);
            const effM = Math.floor(effectiveDiff % 60);
            effStr = `${effH}h ${String(effM).padStart(2, '0')}m`;

            effectiveProgress = Math.min(100, Math.max(0, (effectiveDiff / (9 * 60)) * 100));
        }

        const startTime = new Date();
        startTime.setHours(9, 30, 0, 0);

        let arrivalStatus = 'On Time';
        let arrivalColor = 'text-[#22c55e]';

        const diffMinutes = (checkIn - startTime) / (1000 * 60);

        if (diffMinutes > 0) {
            arrivalStatus = 'Late';
            arrivalColor = 'text-[#ef4444]';
        } else if (diffMinutes < -15) {
            arrivalStatus = 'Early';
            arrivalColor = 'text-[#f59e0b]';
        }

        const dateObj = checkInDate;
        const dayIndex = (dateObj.getDay() + 6) % 7;
        const scheduledHours = (dayIndex >= 0 && dayIndex <= 4) ? '9h 00m' : '-';

        return { gross: grossStr, effective: effStr, arrivalStatus, arrivalColor, scheduledHours, effectiveProgress };
    };

    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [filterType, setFilterType] = useState('30Days');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() === 0 ? 'JAN' : 'DEC');
    const [activeBreakIndex, setActiveBreakIndex] = useState(null);

    const [currentWeekLogs, setCurrentWeekLogs] = useState([]);
    const [teamStats, setTeamStats] = useState(null);

    useEffect(() => {
        const fetchTeamStats = async () => {
            const teamId = user?.team_id;
            if (teamId) {
                try {
                    const stats = await teamApi.getStats(teamId);
                    setTeamStats(stats);
                } catch (err) {
                    console.error("Failed to fetch team stats:", err);
                }
            }
        };
        fetchTeamStats();
    }, [user?.team_id]);

    const meStats = useMemo(() => {
        if (!attendanceLogs.length) return { avg: '0h 00m', onTime: '0%' };

        const now = new Date();
        const monday = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        let totalMins = 0;
        let presentDays = 0;
        let onTimeDays = 0;

        attendanceLogs.forEach(log => {
            const logDate = new Date(log.date);
            if (logDate >= monday && log.checkIn && log.checkIn !== '-') {
                const stats = calculateStats(log);
                if (stats.effective !== '-') {
                    const match = stats.effective.match(/(\d+)h\s+(\d+)m/);
                    if (match) {
                        presentDays++;
                        totalMins += parseInt(match[1]) * 60 + parseInt(match[2]);
                        if (stats.arrivalStatus === 'On Time') onTimeDays++;
                    }
                }
            }
        });

        if (presentDays === 0) return { avg: '0h 00m', onTime: '0%' };

        const avgMins = Math.floor(totalMins / presentDays);
        return {
            avg: `${Math.floor(avgMins / 60)}h ${String(avgMins % 60).padStart(2, '0')}m`,
            onTime: `${Math.round((onTimeDays / presentDays) * 100)}%`
        };
    }, [attendanceLogs, currentTime]);

    const getLocalSelectedDateStr = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const currentMonday = new Date(today.setDate(diff));

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentMonday);
            date.setDate(currentMonday.getDate() + i);
            weekDates.push(getLocalSelectedDateStr(date));
        }

        const mappedLogs = weekDates.map(dateStr => {
            const log = attendanceLogs.find(l => l.date === dateStr);
            if (log) return { ...log, date: dateStr };

            const [y, m, d] = dateStr.split('-').map(Number);
            const dObj = new Date(y, m - 1, d);
            const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

            return {
                date: dateStr,
                checkIn: '-',
                checkOut: '-',
                breakMinutes: 0,
                status: 'Not Marked',
                isWeekend,
                isHoliday: false
            };
        });

        setCurrentWeekLogs(mappedLogs);

        const todayStr = getLocalSelectedDateStr(new Date());
        const todayIdx = weekDates.findIndex(d => d === todayStr);
        setSelectedDayIndex(todayIdx !== -1 ? todayIdx : 0);
    }, [attendanceLogs]);

    const getActiveTimingData = () => {
        if (currentWeekLogs.length === 0) return { day: '', dateStr: '', range: '', duration: '', break: '', progress: 0 };

        const log = currentWeekLogs[selectedDayIndex];
        const [y, m, d] = log.date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dateObj.getDay()];
        const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

        const { effective, effectiveProgress } = calculateStats(log);

        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

        if (isWeekend || log.status === 'Holiday') {
            return {
                day: dayName,
                dateStr: formattedDate,
                range: log.status === 'Holiday' ? 'Holiday' : 'Weekly Off',
                duration: '-',
                break: '-',
                progress: 0
            };
        }

        return {
            day: dayName,
            dateStr: formattedDate,
            range: (log.checkIn && log.checkIn !== '-') ? `${log.checkIn} - ${log.checkOut || '??'}` : '09:30 AM - 06:30 PM',
            duration: (log.checkIn && log.checkIn !== '-') ? effective : '9h 00m',
            break: (log.checkIn && log.checkIn !== '-') ? `${log.breakMinutes} min` : '60 min',
            progress: (log.checkIn && log.checkIn !== '-') ? (effectiveProgress || 0) : 0
        };
    };

    const activeTiming = getActiveTimingData();
    const monthOptions = [
        { label: 'Jan', value: 'JAN', index: 0 },
        { label: 'Feb', value: 'FEB', index: 1 },
        { label: 'Mar', value: 'MAR', index: 2 },
        { label: 'Apr', value: 'APR', index: 3 },
        { label: 'May', value: 'MAY', index: 4 },
        { label: 'Jun', value: 'JUN', index: 5 },
        { label: 'Jul', value: 'JUL', index: 6 },
        { label: 'Aug', value: 'AUG', index: 7 },
        { label: 'Sep', value: 'SEP', index: 8 },
        { label: 'Oct', value: 'OCT', index: 9 },
        { label: 'Nov', value: 'NOV', index: 10 },
        { label: 'Dec', value: 'DEC', index: 11 },
    ];

    const getFilteredLogs = () => {
        let dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filterType === '30Days') {
            for (let i = 0; i < 30; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dates.push(getLocalSelectedDateStr(d));
            }
        } else {
            const targetMonthIndex = monthOptions.find(m => m.value === selectedMonth)?.index;
            const currentYear = today.getFullYear();
            // Start from the first of the month
            const d = new Date(currentYear, targetMonthIndex, 1);
            // If the month is in the future relative to the year, and it's currently Jan, maybe it's last year? 
            // Actually, usually these apps show current year's months.

            // Populate all days of the month up to today (if current month) or end of month (if past month)
            const lastDay = new Date(currentYear, targetMonthIndex + 1, 0).getDate();
            const limit = (targetMonthIndex === today.getMonth()) ? today.getDate() : lastDay;

            for (let i = 1; i <= limit; i++) {
                const dayDate = new Date(currentYear, targetMonthIndex, i);
                dates.push(getLocalSelectedDateStr(dayDate));
            }
            dates.reverse(); // Show latest first
        }

        return dates.map(dateStr => {
            const existingLog = attendanceLogs.find(l => l.date === dateStr);
            if (existingLog) return { ...existingLog };

            const [y, m, d] = dateStr.split('-').map(Number);
            const dObj = new Date(y, m - 1, d);
            const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

            return {
                date: dateStr,
                checkIn: '-',
                checkOut: '-',
                breakMinutes: 0,
                status: 'Not Marked',
                isWeekend,
                isHoliday: false,
                logs: []
            };
        });
    };

    const displayedLogs = getFilteredLogs();

    const handleClockUpdate = (data) => {
        // Optimistic update
        if (data && data.summary) {
            setAttendanceLogs(prevLogs => {
                const logs = [...prevLogs];
                const todayStr = getLocalSelectedDateStr(new Date());
                const logIndex = logs.findIndex(l => l.date === todayStr);

                if (logIndex !== -1) {
                    const updatedLog = { ...logs[logIndex] };
                    updatedLog.checkIn = data.summary.check_in || updatedLog.checkIn;
                    updatedLog.checkOut = data.summary.check_out || updatedLog.checkOut;
                    updatedLog.breakMinutes = data.summary.break_minutes || updatedLog.breakMinutes;

                    // Update logs array for visual bar
                    if (data.type && data.time) {
                        const newLogs = [...(updatedLog.logs || [])];
                        if (data.type === 'IN') {
                            newLogs.push({ in: data.time, out: null });
                        } else if (data.type === 'OUT' && newLogs.length > 0) {
                            const lastLog = { ...newLogs[newLogs.length - 1] };
                            if (!lastLog.out) {
                                lastLog.out = data.time;
                                newLogs[newLogs.length - 1] = lastLog;
                            }
                        }
                        updatedLog.logs = newLogs;
                    }

                    logs[logIndex] = updatedLog;
                } else {
                    // unexpected: today not found, wait for fetch
                }
                return logs;
            });
        }

        // Fetch source of truth
        fetchHistory();
    };

    return (
        <div className="flex-1 p-8 space-y-10 bg-[#f8fafc]">
            <div>
                <h1 className="text-3xl font-black text-[#1e293b] tracking-tight mb-6">Attendance Stats</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <AttendanceStats meStats={meStats} teamStats={teamStats} />

                    <TimingCard
                        activeTiming={activeTiming}
                        currentWeekLogs={currentWeekLogs}
                        selectedDayIndex={selectedDayIndex}
                        setSelectedDayIndex={setSelectedDayIndex}
                        getLocalSelectedDateStr={getLocalSelectedDateStr}
                    />

                    <ActionCard
                        currentTime={currentTime}
                        formatTime={formatTime}
                        formatDate={formatDate}
                        onClockAction={handleClockUpdate}
                        employeeId={EMPLOYEE_ID}
                        displayId={user?.employee_id}
                    />
                </div>
            </div>

            <div>
                <h1 className="text-3xl font-black text-[#1e293b] tracking-tight mb-6">Logs & Requests</h1>
                <AttendanceLog
                    filterType={filterType}
                    setFilterType={setFilterType}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    monthOptions={monthOptions}
                    displayedLogs={displayedLogs}
                    calculateStats={calculateStats}
                    activeBreakIndex={activeBreakIndex}
                    setActiveBreakIndex={setActiveBreakIndex}
                    currentTime={currentTime}
                />
            </div>
        </div>
    );
};

export default Me;
