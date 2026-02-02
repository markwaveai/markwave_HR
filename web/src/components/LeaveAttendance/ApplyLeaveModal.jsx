import React from 'react';
import { Plus, XCircle } from 'lucide-react';

const ApplyLeaveModal = ({
    setIsModalOpen,
    leaveType, setLeaveType,
    fromDate, setFromDate,
    toDate, setToDate,
    reason, setReason,
    fromSession, setFromSession,
    toSession, setToSession,
    notifyTo, setNotifyTo,
    user,
    profile,
    handleLeaveSubmit
}) => {
    const isSingleDay = !toDate || (fromDate && toDate && fromDate === toDate);

    const SessionSelector = ({ label, value, onChange }) => (
        <div className="mb-2 last:mb-0">
            <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1 flex items-center gap-1">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
                {['Full Day', 'First Half', 'Second Half'].map((s) => (
                    <button
                        key={s}
                        onClick={() => onChange(s)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-md border transition-all ${value === s
                            ? 'bg-[#48327d] border-[#48327d] text-white'
                            : 'bg-white border-[#e2e8f0] text-[#636e72] hover:bg-[#f8fafc]'
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setIsModalOpen(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden w-full max-w-md my-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Plus size={18} className="text-[#48327d]" />
                        <h3 className="text-sm font-bold text-[#2d3436] uppercase tracking-wider">Apply for Leave</h3>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors text-[#636e72]"
                    >
                        <XCircle size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1 flex items-center gap-1">
                            Leave Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm text-[#2d3436] outline-none focus:border-[#48327d] transition-colors"
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            required
                        >
                            <option value="cl">CASUAL LEAVE</option>
                            <option value="sl">SICK LEAVE</option>
                            <option value="el">EARNED LEAVE</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1 flex items-center gap-1">
                                From Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm text-[#2d3436] outline-none focus:border-[#48327d] transition-colors"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1 flex items-center gap-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm text-[#2d3436] outline-none focus:border-[#48327d] transition-colors"
                                value={toDate}
                                min={fromDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        {isSingleDay ? (
                            <SessionSelector
                                label="Session"
                                value={fromSession}
                                onChange={(val) => { setFromSession(val); setToSession(val); }}
                            />
                        ) : (
                            <div className="space-y-3">
                                <SessionSelector
                                    label="Start Date Session"
                                    value={fromSession}
                                    onChange={setFromSession}
                                />
                                <SessionSelector
                                    label="End Date Session"
                                    value={toSession}
                                    onChange={setToSession}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1 flex items-center gap-1">
                            Reason for leave <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows="2"
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-sm text-[#2d3436] outline-none focus:border-[#48327d] transition-colors resize-none"
                            placeholder="Briefly describe the reason..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="relative">
                        <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1 flex items-center gap-1">
                            Notify To <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2 p-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg min-h-[38px]">
                            {notifyTo.length === 0 && <span className="text-gray-400 text-sm">Select employee(s)...</span>}
                            {notifyTo.map(person => (
                                <span key={person} className="bg-[#48327d] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    {person}
                                    <button onClick={() => setNotifyTo(notifyTo.filter(p => p !== person))}>
                                        <XCircle size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {[
                                user?.team_lead_name || profile?.team_lead_name || "Team Lead",
                                profile?.project_manager_name,
                                profile?.advisor_name
                            ].filter(name => name && !notifyTo.includes(name)).map(name => (
                                <button
                                    key={name}
                                    onClick={() => setNotifyTo([...notifyTo, name])}
                                    className="text-[10px] font-bold text-[#48327d] bg-[#48327d]/10 px-2 py-0.5 rounded-md hover:bg-[#48327d]/20 transition-colors"
                                >
                                    + {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleLeaveSubmit}
                        disabled={!fromDate || !reason.trim() || notifyTo.length === 0}
                        className={`w-full font-bold py-2 rounded-lg text-sm transition-all transform active:scale-95 mt-2 ${!fromDate || !reason.trim() || notifyTo.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-[#48327d] text-white shadow-lg shadow-[#48327d]/20 hover:bg-[#34245c]'
                            }`}
                    >
                        Submit Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
