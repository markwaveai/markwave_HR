import React, { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';

const AbsenteesModal = ({ absentees, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredAbsentees = (absentees || []).filter(emp => {
        const matchesSearch =
            emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

        return matchesSearch && matchesStatus;
    });
    return (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#f8fafc]">
                    <div>
                        <h2 className="text-xl font-black text-[#1e293b]">Today's Absentees</h2>
                        <p className="text-xs text-[#64748b] font-medium mt-0.5">List of employees who haven't clocked in yet.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-[#64748b]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-3 border-b border-slate-50 bg-white flex gap-2">
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#48327d] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search name/role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#48327d]/20 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-100 border-none rounded-xl text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[#48327d]/20 text-slate-700 font-medium cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                    </select>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-3">
                    {filteredAbsentees.length > 0 ? (
                        filteredAbsentees.map((emp) => (
                            <div key={emp.id} className="flex items-center gap-4 p-3 hover:bg-[#f1f5f9] rounded-xl transition-all border border-transparent hover:border-slate-100">
                                <div className="w-10 h-10 rounded-full bg-[#48327d] flex items-center justify-center text-white font-black text-sm shadow-inner">
                                    {(emp.name || 'E').split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#1e293b] truncate text-sm">{emp.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-[#64748b]">{emp.role}</p>
                                        {emp.location && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-[#94a3b8] truncate">
                                                <MapPin size={10} />
                                                {emp.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${emp.status === 'On Leave'
                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : 'bg-[#fff1f2] text-[#f43f5e] border-[#ffe4e6]'
                                    }`}>
                                    {emp.status}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search size={24} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">
                                {!searchTerm && statusFilter === 'All'
                                    ? 'No absentees reported today! 🎉'
                                    : `No employees ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} found${searchTerm ? ` matching "${searchTerm}"` : ''}`}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-[#f8fafc] border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#48327d] hover:bg-[#3d2a6a] text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AbsenteesModal;
