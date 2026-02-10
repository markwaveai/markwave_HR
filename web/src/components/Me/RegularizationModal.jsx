import React, { useState } from 'react';
import { X, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { attendanceApi } from '../../services/api';

const RegularizationModal = ({ isOpen, onClose, log, user, onSuccess }) => {
    const [hours, setHours] = useState('06');
    const [minutes, setMinutes] = useState('00');
    const [period, setPeriod] = useState('PM');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !log) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const formattedTime = `${hours}:${minutes} ${period}`;

            await attendanceApi.submitRegularization({
                employee_id: user.employee_id || user.id,
                date: log.date,
                check_out_time: formattedTime,
                reason: reason
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const dateObj = new Date(log.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <h2 className="text-[#2d3436] font-bold text-lg">Regularize Attendance</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Date Display */}
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            Missed Check-Out Date
                        </label>
                        <p className="text-sm font-medium text-[#2d3436]">{formattedDate}</p>
                    </div>

                    {/* Time Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                            Correct Check-Out Time
                        </label>
                        <div className="flex gap-2 items-center">
                            <div className="flex-1">
                                <select
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="w-full h-11 px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-sm font-medium text-[#2d3436] focus:outline-none focus:border-[#48327d] transition-colors cursor-pointer"
                                >
                                    {hoursOptions.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-gray-400">:</span>
                            <div className="flex-1">
                                <select
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className="w-full h-11 px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-sm font-medium text-[#2d3436] focus:outline-none focus:border-[#48327d] transition-colors cursor-pointer"
                                >
                                    {minutesOptions.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="w-full h-11 px-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-sm font-medium text-[#2d3436] focus:outline-none focus:border-[#48327d] transition-colors cursor-pointer"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Reason Field */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                            Reason for Missing
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="State the reason briefly..."
                            className="w-full px-4 py-3 bg-[#f8fafc] border border-gray-200 rounded-lg text-sm font-medium text-[#2d3436] focus:outline-none focus:border-[#48327d] transition-all placeholder:text-gray-300 min-h-[100px] resize-none"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#48327d] hover:bg-[#3b2a66] text-white font-bold py-3.5 rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Submit Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegularizationModal;
