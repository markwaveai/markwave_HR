import React from 'react';
import { Clock } from 'lucide-react';

const AvgHoursCard = ({ stats }) => {
    // legacy support for avg_working_hours
    const avgHrs = stats?.avg_working_hours || (stats?.week?.me?.avg) || '0h 00m';
    const lastWeekDiff = stats?.lastWeekDiff || '+0h 00m';
    const isIncrease = lastWeekDiff.startsWith('+');
    const displayDiff = lastWeekDiff.replace('+', '').replace('-', '');

    return (
        <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 flex flex-col justify-between min-h-[140px]">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold text-[#1e293b]">Avg. Working Hours</h3>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#48327d] shrink-0">
                    <Clock size={16} />
                </div>
            </div>

            <div className="mt-1">
                <div className="text-3xl font-black text-[#48327d] tracking-tight">
                    {avgHrs}
                </div>
                <div className="mt-1">
                    <span className={`${isIncrease ? 'text-[#00b894]' : 'text-[#f43f5e]'} text-[10px] mm:text-xs font-bold tracking-tight`}>
                        {isIncrease ? '+' : '-'}{displayDiff} vs last week
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AvgHoursCard;
