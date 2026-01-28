import React from 'react';
import { Clock } from 'lucide-react';

const AvgHoursCard = ({ stats }) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 flex flex-col justify-between relative min-h-[140px]">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-[#1e293b]">Avg. Working Hours</h3>
                <Clock size={16} className="text-[#48327d]" />
            </div>
            <div className="flex flex-col gap-0.5">
                <div className="text-3xl font-black text-[#48327d]">
                    {stats?.avg_working_hours || '0h 0m'}
                </div>
                <div className={`text-[10px] font-bold ${stats?.diff_status === 'up' ? 'text-[#00b894]' : 'text-[#ff7675]'}`}>
                    {stats?.diff_label || '0m vs last week'}
                </div>
            </div>
        </div>
    );
};

export default AvgHoursCard;
