import React from 'react';
import { ChevronDown, Info } from 'lucide-react';
import BreakInfo from './BreakInfo';

const AttendanceLog = ({
    filterType, setFilterType,
    selectedMonth, setSelectedMonth,
    monthOptions, displayedLogs,
    calculateStats, activeBreakIndex, setActiveBreakIndex,
    currentTime
}) => {
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
            } else {
                sOut = endMins;
            }

            // Gap before this session (Break)
            if (idx > 0) {
                const prevOut = parseTimeToMinutes(log.logs[idx - 1].out);
                const gap = sIn - prevOut;
                if (gap > 0) {
                    segments.push({ type: 'break', width: (gap / totalSpan) * 100 });
                }
            }

            // Work Session
            const duration = sOut - sIn;
            if (duration > 0) {
                segments.push({ type: 'work', width: (duration / totalSpan) * 100 });
            }
        });

        return segments;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-[#e2e8f0] overflow-hidden w-full">
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
                <div className="flex gap-1 bg-[#f1f2f6] p-1 rounded-lg">
                    <button className="px-4 py-1.5 text-xs font-bold bg-white text-[#2d3436] shadow-sm rounded-md uppercase tracking-wider">Attendance Log</button>
                    <button className="px-4 py-1.5 text-xs font-bold text-[#636e72] hover:text-[#2d3436] uppercase tracking-wider">Calendar</button>
                    <button className="px-4 py-1.5 text-xs font-bold text-[#636e72] hover:text-[#2d3436] uppercase tracking-wider">Attendance Requests</button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white border border-[#e2e8f0] rounded-md overflow-hidden p-1 gap-1">
                        <button
                            onClick={() => setFilterType('30Days')}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${filterType === '30Days'
                                ? 'bg-[#48327d] text-white'
                                : 'text-[#636e72] hover:bg-[#f1f2f6]'
                                }`}
                        >
                            30 DAYS
                        </button>
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    setFilterType('Month');
                                }}
                                className={`appearance-none pl-3 pr-8 py-1 text-xs font-bold rounded outline-none cursor-pointer transition-colors ${filterType === 'Month'
                                    ? 'bg-[#48327d] text-white'
                                    : 'text-[#636e72] hover:bg-[#f1f2f6]'
                                    }`}
                            >
                                {monthOptions.map(opt => (
                                    <option key={opt.value} value={opt.value} className="text-[#2d3436] bg-white">{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${filterType === 'Month' ? 'text-white' : 'text-[#636e72]'}`} />
                        </div>
                    </div>
                </div>
            </div>

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
                            const hasActivity = log.checkIn && log.checkIn !== '-';
                            const isLeave = !isWeekend && !isHoliday && !isToday && !hasActivity;

                            return (
                                <tr key={index} className={`border-b border-[#e2e8f0] last:border-none hover:bg-[#f9fafb] transition-colors ${isWeekend || isHoliday || isLeave ? 'bg-[#f5f5f5]' : 'bg-white'}`}>
                                    <td className="p-4 text-sm font-medium text-[#2d3436] text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="whitespace-nowrap">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                                            {(isWeekend || isHoliday || isLeave) && (
                                                <span className="px-1  bg-[#d1d5db] text-[#48327d] text-[7px] rounded-full uppercase font-semibold whitespace-nowrap">
                                                    {isHoliday ? 'HOLIDAY' : isWeekend ? 'W-OFF' : 'ABSENT'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {(isWeekend || isHoliday || isLeave) ? (
                                        <td colSpan="8" className="p-4 text-sm text-[#2d3436] font-medium text-center">
                                            {isHoliday ? 'Full day Holiday' : isWeekend ? 'Full day Weekly-off' : 'Absent'}
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
                                            <td className="p-4 text-center text-xs text-[#2d3436] font-medium">{log.checkIn}</td>
                                            <td className="p-4 text-center text-xs text-[#636e72] relative">
                                                {log.breakMinutes > 0 ? (
                                                    <>
                                                        <button
                                                            onClick={() => setActiveBreakIndex(activeBreakIndex === index ? null : index)}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors inline-flex items-center justify-center text-[#48327d]"
                                                            title="View break timings"
                                                        >
                                                            <Info size={16} />
                                                        </button>
                                                        <BreakInfo log={log} activeBreakIndex={activeBreakIndex} index={index} />
                                                    </>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="p-4 text-center text-xs text-[#2d3436] font-medium">
                                                {log.checkOut === '-' && log.checkIn !== '-' && new Date(log.date).setHours(0, 0, 0, 0) < new Date(currentTime).setHours(0, 0, 0, 0) ? (
                                                    <span className="text-[#ef4444] font-semibold text-[10px] uppercase bg-red-50 px-2 py-0.5 rounded">Missed Check-Out</span>
                                                ) : (
                                                    log.checkOut
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
        </div>
    );
};

export default AttendanceLog;
