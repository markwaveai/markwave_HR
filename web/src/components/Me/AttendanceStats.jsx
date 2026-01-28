import React from 'react';
import { User, Users, ChevronDown, Info } from 'lucide-react';

const MeStatsRow = ({ label, avgHrs, onTime, icon: Icon }) => {
    const avgParts = avgHrs.split(' ');

    return (
        <div className="grid grid-cols-[120px_1fr_1fr] items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f8fafc] text-[#48327d] flex items-center justify-center shrink-0 border border-[#f1f5f9]">
                    <Icon size={18} />
                </div>
                <span className="text-sm font-bold text-[#334155]">{label}</span>
            </div>
            <div className="text-center group">
                <div className="text-[9px] font-bold text-[#8e78b0] leading-tight mb-2 uppercase tracking-wider">
                    Avg Hrs /<br />Day
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-xl font-black text-[#1e293b] leading-tight">{avgParts[0]}</div>
                    <div className="text-xl font-black text-[#1e293b] leading-tight">{avgParts[1] || '00m'}</div>
                </div>
            </div>
            <div className="text-center">
                <div className="text-[9px] font-bold text-[#8e78b0] leading-tight mb-2 uppercase tracking-wider">
                    On Time<br />Arrival
                </div>
                <div className="text-3xl font-black text-[#1e293b] mt-1">{onTime}</div>
            </div>
        </div>
    );
};

const AttendanceStats = ({ meStats, teamStats }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-4 border border-[#e2e8f0]">
            <div className="flex justify-between items-start mb-6">
                <button className="flex items-center text-sm text-[#636e72] font-medium hover:bg-gray-50 px-2 py-1 rounded">
                    This Week <ChevronDown size={14} className="ml-1" />
                </button>
                <Info size={16} className="text-[#b2bec3] cursor-help" title="Weekly attendance overview" />
            </div>

            <div className="space-y-6">
                <MeStatsRow
                    label="Me"
                    avgHrs={meStats?.avg || "0h 00m"}
                    onTime={meStats?.onTime || "0%"}
                    icon={User}
                />
                <MeStatsRow
                    label="My Team"
                    avgHrs={teamStats?.avg_working_hours || "0h 00m"}
                    onTime={teamStats?.on_time_arrival || "0%"}
                    icon={Users}
                />
            </div>
        </div>
    );
};

export default AttendanceStats;
