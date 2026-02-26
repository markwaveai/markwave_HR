import React, { useState, useEffect } from 'react';
import { Plus, XCircle, Calendar, Clock } from 'lucide-react';
import { leaveApi, authApi, attendanceApi } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const SessionSelector = ({ label, value, onChange }) => {
    const sessions = [
        { id: 'Full Day', label: 'Full Day' },
        { id: 'Session 1', label: 'First Half' },
        { id: 'Session 2', label: 'Second Half' }
    ];

    return (
        <div className="mb-2">
            <label className="block text-[11px] font-bold text-[#636e72] uppercase tracking-wide mb-1">
                {label} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
                {sessions.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => onChange(s.id)}
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

const ApplyLeaveModal = ({ isOpen, onClose, user, onSubmitSuccess, setToast }) => {
    const [leaveType, setLeaveType] = useState('cl');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [fromSession, setFromSession] = useState('Full Day');
    const [toSession, setToSession] = useState('Full Day');
    const [notifyTo, setNotifyTo] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [balances, setBalances] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [history, setHistory] = useState([]);

    const ADMIN_ROLES = ['admin', 'administrator', 'advisor-technology & operations', 'project manager', 'founder'];
    const userRole = (user?.role || '').toLowerCase().trim();
    const isAdmin = user?.is_admin === true || ADMIN_ROLES.includes(userRole);

    useEffect(() => {
        if (isOpen && user?.id) {
            const fetchData = async () => {
                try {
                    const [prof, bals, hols, hist] = await Promise.all([
                        authApi.getProfile(user.id).catch(() => null),
                        leaveApi.getBalance(user.id).catch(() => []), // Fixed: getBalance instead of getBalances
                        leaveApi.getLeaves(user.id).catch(() => []),  // History
                        attendanceApi.getHolidays().catch(() => [])   // Holidays
                    ]);

                    setProfile(prof);
                    setBalances(Array.isArray(bals) ? bals : []);
                    setHolidays(Array.isArray(hols) ? hols : []);
                    setHistory(Array.isArray(hist) ? hist : []);

                    if (Array.isArray(bals) && bals.length > 0) {
                        setLeaveType(bals[0].code || 'cl');
                    }
                } catch (err) {
                    console.error("Modal data fetch error:", err);
                }
            };
            fetchData();
        }
    }, [isOpen, user?.id]);

    // Auto-populate Notify To field removed as per user request

    const hasRestrictedDaysInRange = () => {
        if (!fromDate) return false;
        const start = new Date(fromDate);
        const end = toDate ? new Date(toDate) : new Date(fromDate);
        let curr = new Date(start);

        while (curr <= end) {
            // Check Sunday (getDay() returns 0 for Sunday)
            if (curr.getDay() === 0) return true;

            // Check Holiday
            const yyyy = curr.getFullYear();
            const mm = String(curr.getMonth() + 1).padStart(2, '0');
            const dd = String(curr.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            if (holidays.some(h => (h.raw_date || h.date) === dateStr)) return true;

            curr.setDate(curr.getDate() + 1);
        }
        return false;
    };

    if (!isOpen && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setFromDate('');
            setToDate('');
            setReason('');
            setNotifyTo([]);
            setFromSession('Full Day');
            setToSession('Full Day');
        }, 200);
    };

    const handleLeaveSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!fromDate || !reason.trim()) {
            if (setToast) setToast({ message: "From Date and Reason are required.", type: 'error' });
            return;
        }

        const effectiveToDate = toDate || fromDate;

        // Sunday & Holiday Validation
        const startDate = new Date(fromDate);
        const endDate = new Date(effectiveToDate);
        let curr = new Date(startDate);

        while (curr <= endDate) {
            // Check Sunday (getDay() returns 0 for Sunday)
            if (curr.getDay() === 0) {
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = curr.toLocaleDateString('en-US', options);
                if (setToast) setToast({
                    message: `Leave requests are not allowed on Sundays. ${formattedDate} is a Sunday.`,
                    type: 'error'
                });
                return;
            }

            // Check Holiday
            const yyyy = curr.getFullYear();
            const mm = String(curr.getMonth() + 1).padStart(2, '0');
            const dd = String(curr.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const holiday = holidays.find(h => (h.raw_date || h.date) === dateStr);
            if (holiday) {
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = curr.toLocaleDateString('en-US', options);
                if (setToast) setToast({
                    message: `Leave requests are not allowed on public holidays. ${formattedDate} is ${holiday.name}.`,
                    type: 'error'
                });
                return;
            }

            curr.setDate(curr.getDate() + 1);
        }

        setIsSubmitting(true);
        try {
            const start = new Date(fromDate);
            const end = new Date(effectiveToDate);
            let diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (fromDate === effectiveToDate) {
                if (fromSession !== 'Full Day') diffDays = 0.5;
            } else {
                if (fromSession !== 'Full Day') diffDays -= 0.5;
                if (toSession !== 'Full Day') diffDays -= 0.5;
            }

            await leaveApi.apply({
                employeeId: user.id || user.employee_id,
                type: leaveType,
                fromDate,
                toDate: effectiveToDate,
                days: diffDays,
                reason: reason.trim(),
                from_session: fromSession,
                to_session: toSession,
                notifyTo: isAdmin ? '' : notifyTo.join(', ')
            });

            if (setToast) setToast({ message: "Leave applied successfully!", type: 'success' });
            if (onSubmitSuccess) onSubmitSuccess();
            handleClose();
        } catch (error) {
            console.error("Submit error:", error);
            if (setToast) setToast({ message: error.response?.data?.error || "Failed to submit request", type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitButtonDisabled = isSubmitting || !fromDate || !reason.trim() || (!isAdmin && notifyTo.length === 0) || hasRestrictedDaysInRange();

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 transform ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Plus size={18} className="text-[#48327d]" />
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Apply for Leave</h3>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
                </div>

                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Leave Type *</label>
                        <select
                            className="w-full p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48327d] text-sm mm:text-base font-medium"
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                        >
                            {balances.length > 0 ? (
                                balances
                                    .filter(b => ['cl', 'sl', 'bl', 'lwp'].includes(b.code))
                                    .map(b => (
                                        <option key={b.code} value={b.code}>
                                            {b.name.toUpperCase()} ({b.code === 'lwp' ? 'Unlimited' : `${b.available} Available`})
                                        </option>
                                    ))
                            ) : (
                                <>
                                    <option value="cl">CASUAL LEAVE</option>
                                    <option value="lwp">LEAVE WITHOUT PAY</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">From Date *</label>
                            <input type="date" className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">To Date</label>
                            <input type="date" className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                    </div>

                    {(!toDate || fromDate === toDate) ? (
                        <SessionSelector label="Session" value={fromSession} onChange={v => { setFromSession(v); setToSession(v); }} />
                    ) : (
                        <div className="space-y-3">
                            <SessionSelector label="Start Date Session" value={fromSession} onChange={setFromSession} />
                            <SessionSelector label="End Date Session" value={toSession} onChange={setToSession} />
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Reason *</label>
                        <textarea
                            rows="2"
                            className="w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm resize-none"
                            placeholder="Reason for leave..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>

                    {!isAdmin && (
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Notify To *</label>
                            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border rounded-lg min-h-[40px]">
                                {notifyTo.length === 0 && <span className="text-gray-400 text-xs text-center w-full">Select recipients...</span>}
                                {notifyTo.map(p => (
                                    <span key={p} className="bg-[#48327d] text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                                        {p}
                                        <button onClick={() => setNotifyTo(notifyTo.filter(x => x !== p))} className="hover:text-red-200"><XCircle size={12} /></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(() => {
                                    const teamLeads = profile?.team_leads || user?.team_leads || [];
                                    const teamLeadName = profile?.team_lead_name || user?.team_lead_name;
                                    const pmName = profile?.project_manager_name;
                                    const advisorName = profile?.advisor_name;

                                    const suggestions = [];
                                    const addSuggestion = (val) => {
                                        if (!val) return;
                                        if (Array.isArray(val)) {
                                            val.forEach(v => {
                                                if (typeof v === 'string') suggestions.push(v.trim());
                                                else if (v?.name) suggestions.push(String(v.name).trim());
                                                else if (v?.first_name) suggestions.push(`${v.first_name} ${v.last_name || ''}`.trim());
                                            });
                                        } else if (typeof val === 'string' && val.includes(',')) {
                                            val.split(',').forEach(s => {
                                                const trimmed = s.trim();
                                                if (trimmed) suggestions.push(trimmed);
                                            });
                                        } else {
                                            const trimmed = typeof val === 'string' ? val.trim() : val;
                                            if (trimmed) suggestions.push(trimmed);
                                        }
                                    };

                                    addSuggestion(teamLeads);
                                    if (teamLeadName) addSuggestion(teamLeadName);
                                    addSuggestion(pmName);
                                    addSuggestion(advisorName);

                                    return [...new Set(suggestions)]
                                        .filter(name => name && !notifyTo.includes(name) && name !== `${user?.first_name || ''} ${user?.last_name || ''}`.trim())
                                        .map(name => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => setNotifyTo([...notifyTo, name])}
                                                className="text-[9px] font-bold text-[#48327d] bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-lg hover:bg-purple-100 transition-all active:scale-95"
                                            >
                                                + {name}
                                            </button>
                                        ));
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t">
                        <button onClick={handleClose} className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancel</button>
                        <button
                            onClick={handleLeaveSubmit}
                            disabled={isSubmitButtonDisabled}
                            className={`flex-[2] py-2 rounded-xl font-bold text-sm transition-all ${isSubmitButtonDisabled ? 'bg-gray-200 text-gray-400' : 'bg-[#48327d] text-white shadow-lg'}`}
                        >
                            {isSubmitting ? <div className="flex items-center gap-2 justify-center"><LoadingSpinner size={14} color="border-white" /> Submitting...</div> : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
