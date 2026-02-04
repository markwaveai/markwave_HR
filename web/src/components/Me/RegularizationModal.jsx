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
                employee_id: user.employee_id || user.id, // Handle fallback
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

    // Helper to format date nicely
    const dateObj = new Date(log.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const hoursOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-white/20 animate-modal-in overflow-hidden">
                <div className="bg-[#48327d] px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">Regularize Attendance</h2>
                        <p className="text-white/70 text-xs">Request check-out correction</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                        <div className="flex items-start gap-3">
                            <Clock className="text-blue-600 mt-0.5" size={18} />
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Missed Check-Out Date</p>
                                <p className="text-blue-900 font-medium">{formattedDate}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#2d3436] flex items-center gap-2">
                            <Clock size={14} className="text-[#48327d]" />
                            Correct Check-Out Time
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <select
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    className="w-full px-3 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#2d3436] focus:outline-none focus:border-[#48327d] focus:ring-4 focus:ring-[#48327d]/10 transition-all appearance-none cursor-pointer"
                                >
                                    {hoursOptions.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-xl font-bold text-gray-400 self-center">:</div>
                            <div className="flex-1">
                                <select
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className="w-full px-3 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#2d3436] focus:outline-none focus:border-[#48327d] focus:ring-4 focus:ring-[#48327d]/10 transition-all appearance-none cursor-pointer"
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
                                    className="w-full px-3 py-3 bg-[#48327d]/5 border border-[#48327d]/20 rounded-xl text-sm font-bold text-[#48327d] focus:outline-none focus:border-[#48327d] focus:ring-4 focus:ring-[#48327d]/10 transition-all appearance-none cursor-pointer text-center"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-[#2d3436] flex items-center gap-2">
                            <FileText size={14} className="text-[#48327d]" />
                            Reason for Missing
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why did you miss the check-out?"
                            className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#2d3436] focus:outline-none focus:border-[#48327d] focus:ring-4 focus:ring-[#48327d]/10 transition-all placeholder:text-gray-400 min-h-[100px] resize-none"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100 flex items-center gap-2">
                            <X size={14} /> {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#48327d] hover:bg-[#3b2a66] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#48327d]/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
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
