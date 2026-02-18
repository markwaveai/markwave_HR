import React, { useState } from 'react';
import { X, Search, User, MapPin, Phone } from 'lucide-react';

const AllLoginsModal = ({ employees, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 200);
    };

    const filteredEmployees = (employees || []).filter(emp => {
        const matchesSearch =
            emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-700';
            case 'On Leave': return 'bg-amber-100 text-amber-700';
            case 'Absent': return 'bg-rose-100 text-rose-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1e293b]/60 ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
            <div className={`bg-white rounded-[1.5rem] shadow-2xl w-full max-w-lg overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc]">
                    <div>
                        <h2 className="text-xl font-black text-[#1e293b]">All Employees</h2>
                        <p className="text-[11px] text-[#64748b] font-medium mt-0.5 uppercase tracking-wider">Total Strength: {employees?.length || 0}</p>
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
                            placeholder="Search by name, role, ID..."
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
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="On Leave">On Leave</option>
                    </select>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar">
                    {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                            <div key={emp.id} className="flex items-center gap-4 p-3.5 hover:bg-[#f8fafc] rounded-2xl transition-all border border-transparent hover:border-[#e2e8f0] group">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center text-[#64748b] font-bold text-sm shrink-0 border border-white shadow-sm">
                                    {emp.name?.[0]}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-[#1e293b] truncate text-sm">{emp.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded-md">
                                            {emp.employee_id}
                                        </span>
                                        <p className="text-[10px] font-bold text-[#94a3b8] truncate">{emp.role}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {emp.location && (
                                            <div className="flex items-center gap-1 text-[10px] text-[#94a3b8] font-medium">
                                                <MapPin size={10} /> {emp.location}
                                            </div>
                                        )}
                                        {emp.check_in && (
                                            <div className="flex items-center gap-1 text-[10px] text-[#22c55e] font-bold">
                                                In: {emp.check_in}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm ${getStatusColor(emp.status)}`}>
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
                                No employees found matching your criteria.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllLoginsModal;
