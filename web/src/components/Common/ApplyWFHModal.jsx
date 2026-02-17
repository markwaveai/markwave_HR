import React, { useState, useEffect } from 'react';
import { Plane, X, Calendar, Clock, XCircle } from 'lucide-react';
import { wfhApi, authApi } from '../../services/api';
import LoadingSpinner from './LoadingSpinner';

const ApplyWFHModal = ({ isOpen, onClose, user, setToast }) => {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [reason, setReason] = useState('');
    const [notifyTo, setNotifyTo] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            authApi.getProfile(user.id).then(setProfile).catch(console.error);
        }
    }, [isOpen, user?.id]);

    if (!isOpen && !isClosing) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            // Reset form
            setFromDate('');
            setToDate('');
            setReason('');
            setNotifyTo([]);
        }, 200);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fromDate) {
            setToast({ message: "From Date is required", type: 'error' });
            return;
        }
        if (!toDate) {
            setToast({ message: "To Date is required", type: 'error' });
            return;
        }
        if (!reason) {
            setToast({ message: "Reason is required", type: 'error' });
            return;
        }
        if (notifyTo.length === 0) {
            setToast({ message: "Please select at least one recipient in 'Notify To'", type: 'error' });
            return;
        }

        // Client-side validation: Check for Sundays in the date range
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            // Check if it's a Sunday (getDay() returns 0 for Sunday)
            if (currentDate.getDay() === 0) {
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                const formattedDate = currentDate.toLocaleDateString('en-US', options);
                setToast({
                    message: `WFH requests are not allowed on Sundays. ${formattedDate} is a Sunday.`,
                    type: 'error'
                });
                return;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setIsSubmitting(true);
        try {
            await wfhApi.apply({
                employeeId: user.id,
                fromDate,
                toDate,
                reason,
                notifyTo: notifyTo.join(', ')
            });
            setToast({ message: "WFH Request submitted successfully", type: 'success' });
            handleClose();
        } catch (error) {
            setToast({ message: error.message || "Failed to submit request", type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e293b]/60 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
            <div className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#fbfcff]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-[#48327d] rounded-xl">
                            <Plane size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Work From Home Request</h3>
                            <p className="text-xs text-gray-500">Quickly submit your WFH request</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">From Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={fromDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-[#48327d] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">To Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={toDate}
                                    min={fromDate || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-[#48327d] outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide a valid reason for working from home..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-[#48327d] outline-none transition-all text-sm font-medium h-24 resize-none"
                        />
                    </div>

                    {/* Notify To Section */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Notify To *</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[45px]">
                            {notifyTo.length === 0 && <span className="text-gray-400 text-sm">Select recipients...</span>}
                            {notifyTo.map(person => (
                                <span key={person} className="bg-[#48327d] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                                    {person}
                                    <button
                                        type="button"
                                        onClick={() => setNotifyTo(notifyTo.filter(p => p !== person))}
                                        className="hover:text-red-200 transition-colors"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {(() => {
                                const teamLeads = profile?.team_leads || user?.team_leads || [];
                                let teamLeadName = profile?.team_lead_name || user?.team_lead_name;

                                if (!teamLeadName && teamLeads.length === 0) {
                                    teamLeadName = "Team Lead";
                                }

                                const suggestions = [];
                                if (teamLeads.length > 0) {
                                    teamLeads.forEach(lead => lead && suggestions.push(lead));
                                } else if (teamLeadName) {
                                    if (teamLeadName.includes(',')) {
                                        teamLeadName.split(',').forEach(s => suggestions.push(s.trim()));
                                    } else {
                                        suggestions.push(teamLeadName);
                                    }
                                }

                                if (profile?.project_manager_name) {
                                    const managers = profile.project_manager_name.split(',').map(m => m.trim()).filter(Boolean);
                                    suggestions.push(...managers);
                                }

                                return [...new Set(suggestions)]
                                    .filter(name => name && !notifyTo.includes(name))
                                    .map(name => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setNotifyTo([...notifyTo, name])}
                                            className="text-[10px] font-bold text-[#48327d] bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-all active:scale-95"
                                        >
                                            + {name}
                                        </button>
                                    ));
                            })()}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-8 py-2.5 bg-[#48327d] text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-[#3d2a6a] transition-all flex items-center gap-2 active:scale-95 ${isSubmitting ? 'opacity-70 cursor-not-allowed active:scale-100' : ''}`}
                        >
                            {isSubmitting ? (
                                <>
                                    <LoadingSpinner size={16} color="border-white" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <Plane size={18} />
                                    <span>Submit Request</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyWFHModal;
