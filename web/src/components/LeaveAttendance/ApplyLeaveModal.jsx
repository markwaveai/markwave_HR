import React from 'react';
import { Plus, XCircle } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

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
    handleLeaveSubmit,
    isSubmitting,
    balances = [],
    holidays = [],
    history = []
}) => {
    const [isClosing, setIsClosing] = React.useState(false);

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 200);
    };

    const isSingleDay = !toDate || (fromDate && toDate && fromDate === toDate);

    // Helper to check if date is Restricted
    const isDateDisabled = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        // Check Sunday (0)
        if (d.getDay() === 0) return true;
        // Check Holidays (Compare with raw_date from API)
        return holidays.some(h => h.raw_date === dateStr);
    };

    const isTimeRestricted = () => {
        if (!fromDate) return false;

        // Match specific logic from Mobile (LeaveScreen.tsx)
        const now = new Date();
        const selectedDate = new Date(fromDate);
        const isToday = selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear();

        if (!isToday) return false;

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour + (currentMinute / 60);

        // Rule 1: Enable requests only after 9:30 AM
        if (currentTime < 9.5) return true; // Before 9:30 AM (9.5)

        // Rule 2: Morning Session (Session 1) - valid between 9:30 AM and 12:30 PM
        // Also applies to Full Day (since it includes morning)
        if (fromSession === 'Session 1' || fromSession === 'Full Day') {
            if (currentTime > 12.5) return true; // After 12:30 PM
        }

        // Rule 3: Afternoon Session (Session 2) - valid before 2:00 PM
        if (fromSession === 'Session 2') {
            if (currentTime >= 14) return true; // After or at 2:00 PM
        }

        return false;
    };

    const isDuplicateLeave = () => {
        if (!fromDate) return false;

        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = toDate ? new Date(toDate) : new Date(start);
        end.setHours(0, 0, 0, 0);

        return history.some(item => {
            if (item.status === 'Rejected' || item.status === 'Cancelled') return false;

            // Web history might have different date format or keys compared to mobile
            // Based on LeaveAttendance.jsx, item has fromDate/toDate
            const hStart = new Date(item.fromDate);
            hStart.setHours(0, 0, 0, 0);
            const hEnd = new Date(item.toDate || item.fromDate);
            hEnd.setHours(0, 0, 0, 0);

            return start <= hEnd && end >= hStart;
        });
    };

    const hasRestrictedDaysInRange = () => {
        if (!fromDate || !toDate || fromDate === toDate) return false;

        const start = new Date(fromDate);
        const end = new Date(toDate);

        let current = new Date(start);
        while (current <= end) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            if (isDateDisabled(dateStr)) return true;
            current.setDate(current.getDate() + 1);
        }
        return false;
    };

    const isSubmitButtonDisabled = !fromDate || !reason.trim() || notifyTo.length === 0 || isSubmitting || isDateDisabled(fromDate) || (toDate && isDateDisabled(toDate)) || isTimeRestricted() || isDuplicateLeave() || hasRestrictedDaysInRange();

    const SessionSelector = ({ label, value, onChange }) => {
        const sessions = [
            { id: 'Full Day', label: 'Full Day' },
            { id: 'Session 1', label: 'First Half' },
            { id: 'Session 2', label: 'Second Half' }
        ];

        return (
            <div className="mb-2 last:mb-0">
                <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1 flex items-center gap-1">
                    {label} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                    {sessions.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(s.id);
                            }}
                            className={`flex-1 py-1 text-[10px] font-bold rounded-md border transition-all ${value === s.id
                                ? 'bg-[#48327d] border-[#48327d] text-white'
                                : 'bg-white border-[#e2e8f0] text-[#636e72] hover:bg-[#f8fafc]'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div
                className={`fixed inset-0 bg-[#1e293b]/60 backdrop-blur-md ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
                onClick={closeModal}
            />
            <div
                className={`relative bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden w-full max-w-md my-8 ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Plus size={18} className="text-[#48327d]" />
                        <h3 className="text-sm font-bold text-[#2d3436] uppercase tracking-wider">Apply for Leave</h3>
                    </div>
                    <button
                        onClick={closeModal}
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
                            {/* Show only allocated leave types */}
                            {balances.map((balance) => (
                                <option key={balance.code} value={balance.code}>
                                    {balance.name} ({balance.available} Remaining)
                                </option>
                            ))}
                            {/* LWP is always available */}
                            <option value="lwp">LEAVE WITHOUT PAY</option>
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
                                min={new Date().toISOString().split('T')[0]}
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
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNotifyTo(notifyTo.filter(p => p !== person));
                                        }}
                                    >
                                        <XCircle size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(() => {
                                // Get names from user or profile
                                // Prefer profile as it has the latest fetched data including dynamic managers
                                // Update: Support multiple team leads (array)
                                const teamLeads = profile?.team_leads || user?.team_leads || [];
                                let teamLeadName = profile?.team_lead_name || user?.team_lead_name;

                                // Fallback to "Team Lead" only if we really have no name from backend
                                if (!teamLeadName && teamLeads.length === 0) {
                                    teamLeadName = "Team Lead";
                                }

                                const pmName = profile?.project_manager_name;
                                const advisorName = profile?.advisor_name;

                                const suggestions = [];

                                // Add all Team Leads
                                if (teamLeads.length > 0) {
                                    teamLeads.forEach(lead => {
                                        if (lead) suggestions.push(lead);
                                    });
                                } else if (teamLeadName) {
                                    // Fallback for single legacy string (could be comma separated now too)
                                    if (teamLeadName.includes(',')) {
                                        teamLeadName.split(',').forEach(s => suggestions.push(s.trim()));
                                    } else {
                                        suggestions.push(teamLeadName);
                                    }
                                }

                                if (pmName) suggestions.push(pmName);
                                if (advisorName) suggestions.push(advisorName);

                                return suggestions.filter(name => {
                                    if (!name) return false;
                                    // Filter out already selected
                                    if (notifyTo.includes(name)) return false;

                                    // Filter out own name (Self-Notification prevention)
                                    const normalize = (str) => (str || '').toLowerCase().trim();
                                    const currentUserName = user ? normalize(`${user.first_name || ''} ${user.last_name || ''}`) : '';
                                    if (normalize(name) === currentUserName) return false;

                                    // Also filter out generic "Team Lead" string if the user IS a manager, 
                                    // presumably they know who to report to (PM/Advisor) or the backend provided a real name.
                                    // Showing "Notify: Team Lead" to a Team Lead is confusing.
                                    const isManager = user?.is_manager || profile?.is_manager;
                                    if (isManager && name === "Team Lead") return false;

                                    return true;
                                }).map(name => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNotifyTo([...notifyTo, name]);
                                        }}
                                        className="text-[10px] font-bold text-[#48327d] bg-[#48327d]/10 px-2 py-0.5 rounded-md hover:bg-[#48327d]/20 transition-colors"
                                    >
                                        + {name}
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>

                    <button
                        onClick={handleLeaveSubmit}
                        disabled={isSubmitButtonDisabled}
                        className={`w-full font-bold py-2 rounded-lg text-sm transition-all transform active:scale-95 mt-2 flex justify-center items-center gap-2 ${isSubmitButtonDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-[#48327d] text-white shadow-lg shadow-[#48327d]/20 hover:bg-[#34245c]'
                            }`}
                    >
                        {isSubmitting ? <LoadingSpinner size={16} color="border-white" /> : 'Submit Request'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
