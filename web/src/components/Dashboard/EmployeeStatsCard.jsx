import React from 'react';
import { Users, UserMinus, ArrowRight } from 'lucide-react';

const EmployeeStatsCard = ({ stats, onShowAbsentees, onShowAllLogins }) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 flex flex-col gap-3 relative overflow-hidden group min-h-[140px] justify-between">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold text-[#1e293b]">Employee Overview</h3>
                <Users size={18} className="text-[#48327d]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div
                    className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={onShowAllLogins}
                >
                    <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-tight mb-1">Total Employees</span>
                    <div className="text-3xl font-black text-[#1e293b]">
                        {stats?.total_employees || 0}
                    </div>
                </div>

                <div className="flex flex-col border-l border-slate-100 pl-4">
                    <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-tight mb-1">Absentees Today</span>
                    <div className="text-3xl font-black text-[#f43f5e] mt-0.5">
                        {stats?.absentees_count || 0}
                    </div>
                </div>
            </div>

            <button
                onClick={onShowAbsentees}
                className="absolute right-3 bottom-3 p-2 text-[#48327d] hover:text-[#3b2a65] transition-all active:scale-90 z-20"
                title="View Absentees"
            >
                <ArrowRight size={24} strokeWidth={2.5} />
            </button>

            {/* Subtle background element */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-slate-50 rounded-full pointer-events-none"></div>
        </div>
    );
};

export default EmployeeStatsCard;
