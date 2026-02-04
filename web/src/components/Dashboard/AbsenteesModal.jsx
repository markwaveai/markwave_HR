import React, { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';

const AbsenteesModal = ({ absentees, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 200);
    };

    const filteredAbsentees = (absentees || []).filter(emp => {
        const matchesSearch =
            emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1e293b]/60 ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
            <div className={`bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
                    <div>
                        <h2 className="text-xl font-black text-[#1e293b]">Today's Absentees</h2>
                        <p className="text-[11px] text-[#64748b] font-medium mt-0.5 uppercase tracking-wider">Sync Status: {new Date().toLocaleDateString()}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-[#f1f5f9] rounded-xl transition-all text-[#94a3b8] hover:text-[#1e293b]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-[#f1f5f9] bg-white flex gap-3">
                    <div className="relative group flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#48327d] transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search name/role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold text-[#1e293b] focus:border-[#48327d]/30 focus:ring-4 focus:ring-[#48327d]/5 outline-none transition-all placeholder:text-[#94a3b8]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs font-black px-3 py-2 outline-none focus:ring-4 focus:ring-[#48327d]/5 text-[#475569] cursor-pointer"
                    >
                        <option value="All">All Status</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                    </select>
                </div>

                <div className="max-h-[50vh] overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar">
                    {filteredAbsentees.length > 0 ? (
                        filteredAbsentees.map((emp) => (
                            <div key={emp.id} className="flex items-center gap-4 p-3.5 hover:bg-[#f8fafc] rounded-2xl transition-all border border-transparent hover:border-[#e2e8f0] group">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#48327d] to-[#6c5ce7] flex items-center justify-center text-white font-black text-sm shadow-lg ring-4 ring-[#48327d]/5 group-hover:scale-105 transition-transform">
                                    {(emp.name || 'E').split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-[#1e293b] truncate text-sm">{emp.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] font-bold text-[#64748b]">{emp.role}</p>
                                        {emp.location && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-[#94a3b8] font-medium truncate">
                                                <MapPin size={10} />
                                                {emp.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${emp.status === 'On Leave'
                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                    : 'bg-[#fff1f2] text-[#f43f5e] border-[#ffe4e6]'
                                    }`}>
                                    {emp.status}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-16 text-center">
                            <div className="w-20 h-20 bg-[#f8fafc] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e2e8f0] border-dashed">
                                <Search size={28} className="text-[#cbd5e1]" />
                            </div>
                            <p className="text-[#94a3b8] font-bold text-sm">
                                {!searchTerm && statusFilter === 'All'
                                    ? "Everyone is present today! 🎉"
                                    : `No ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} employees found`}
                            </p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-[#f8fafc] border-t border-[#f1f5f9]">
                    <button
                        onClick={handleClose}
                        className="w-full py-3.5 bg-[#48327d] hover:bg-[#3d2a6a] text-white font-black rounded-xl transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98] text-sm"
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AbsenteesModal;
