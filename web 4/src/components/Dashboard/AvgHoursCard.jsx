import React from 'react';
import { Clock } from 'lucide-react';

const AvgHoursCard = ({ stats }) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-lg flex flex-col gap-2 relative">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold text-[#2d3436]">Avg. Working Hours</h3>
                <Clock size={18} className="text-[#48327d]" />
            </div>
            <div>
                <div className="text-3xl font-bold text-[#48327d] py-1">
                    {stats?.avg_working_hours || '0h 00m'}
                </div>
                <div className={`text-[11px] mt-1 font-medium ${stats?.diff_status === 'up' ? 'text-[#00b894]' : 'text-[#ff7675]'}`}>
                    {stats?.diff_label || '0m vs last week'}
                </div>
            </div>
        </div>
    );
};

export default AvgHoursCard;
