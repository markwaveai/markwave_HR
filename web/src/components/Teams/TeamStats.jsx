import React from 'react';

const TeamStats = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#e2e8f0] hover:border-[#6366f1]/30 transition-all group">
                <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-widest mb-2">Total Members</p>
                <p className="text-3xl font-black text-[#1e293b] group-hover:text-[#6366f1] transition-colors">{stats?.total || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#e2e8f0] hover:border-[#10b981]/30 transition-all group">
                <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-widest mb-2">Active Now</p>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-[#10b981]">{stats?.active || 0}</p>
                    <span className="text-[10px] font-bold text-[#10b981] pb-1 uppercase">Online</span>
                </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#e2e8f0] hover:border-[#f59e0b]/30 transition-all group">
                <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-widest mb-2">On Leave</p>
                <p className="text-3xl font-black text-[#f59e0b]">{stats?.onLeave || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#e2e8f0] hover:border-[#3b82f6]/30 transition-all group">
                <p className="text-[10px] text-[#94a3b8] uppercase font-bold tracking-widest mb-2">Remote</p>
                <p className="text-3xl font-black text-[#3b82f6]">{stats?.remote || 0}</p>
            </div>
        </div>
    );
};

export default TeamStats;
