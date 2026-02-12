import React from 'react';
import { Clock, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react';

const AttendanceHistoryTable = ({ attendanceHistory, calculateStats }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-[#48327d]" />
                    <h3 className="text-sm font-bold text-[#2d3436] uppercase tracking-wider">Attendance Logs</h3>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <th className="px-5 py-3 text-left text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Date</th>
                            <th className="px-5 py-3 text-center text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Check-In</th>
                            <th className="px-5 py-3 text-center text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Check-Out</th>
                            <th className="px-5 py-3 text-center text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Effective Hrs</th>
                            <th className="px-5 py-3 text-center text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f2f6]">
                        {attendanceHistory.map((log, index) => {
                            const stats = calculateStats(log);
                            const isAbsent = log.checkIn === '-' && !log.isWeekend && !log.isHoliday;

                            return (
                                <tr key={index} className="hover:bg-[#f9fafb] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#2d3436]">
                                                {new Date(log.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-[#636e72]">
                                                {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center text-xs font-medium text-[#2d3436]">
                                        {log.checkIn}
                                    </td>
                                    <td className="px-5 py-4 text-center text-xs font-medium text-[#2d3436]">
                                        {log.checkOut}
                                    </td>
                                    <td className="px-5 py-4 text-center text-xs font-bold text-[#48327d]">
                                        {stats.effective}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 
                                                ${isAbsent ? 'text-red-600 bg-red-50' :
                                                    log.isWeekend || log.isHoliday ? 'text-gray-600 bg-gray-50' :
                                                        'text-green-600 bg-green-50'}`}>
                                                {isAbsent ? <XCircle size={12} /> :
                                                    log.isWeekend || log.isHoliday ? <Calendar size={12} /> :
                                                        <CheckCircle2 size={12} />}
                                                {isAbsent ? 'Absent' :
                                                    log.isHoliday ? (log.holidayName || 'Holiday') :
                                                        log.isWeekend ? 'Weekend' : 'Present'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {attendanceHistory.length === 0 && (
                    <div className="py-12 text-center">
                        <Info size={32} className="mx-auto text-[#e2e8f0] mb-2" />
                        <p className="text-sm text-[#636e72]">No attendance records found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceHistoryTable;
