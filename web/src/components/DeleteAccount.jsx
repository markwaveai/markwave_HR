import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

const DeleteAccount = ({ user }) => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [action, setAction] = useState('deactivate'); // 'activate' or 'deactivate'
    const [isSending, setIsSending] = useState(false);

    const [showOtpField, setShowOtpField] = useState(false);
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);


    const handleSendOTP = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const response = await authApi.sendOTP(mobile, action, user.id);
            setShowOtpField(true);
            alert(response.message || `OTP Sent successfully!`);
        } catch (error) {
            console.error('Failed to send OTP:', error);
            alert(error.response?.data?.error || error.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        try {
            await authApi.updateAccountStatus(mobile, otp, action, user.id);
            alert(`Account ${action === 'deactivate' ? 'disabled' : 'activated'} successfully!`);
            navigate(-1);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert(error.response?.data?.error || error.message || 'Failed to verify OTP. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Pre-fill if navigated from Employee Management
    const location = useLocation();
    useEffect(() => {
        if (location.state?.mobile) {
            setMobile(location.state.mobile);
        }
        if (location.state?.action) {
            setAction(location.state.action);
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col lg:flex-row">

            {/* Form section centered */}
            <div className="w-full flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-[500px] bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">

                    <div className="text-center mb-10">
                        <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 mb-2 font-serif">
                            Account Management
                        </h1>
                        <p className="text-slate-900 font-bold text-[15px]">
                            Admin Portal: Manage User Account Status
                        </p>
                    </div>

                    {!showOtpField && (
                        <div className="flex bg-slate-100 p-1 rounded-2xl mb-8">
                            <button
                                onClick={() => setAction('deactivate')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${action === 'deactivate' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Deactivate
                            </button>
                            <button
                                onClick={() => setAction('activate')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${action === 'activate' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Activate
                            </button>
                        </div>
                    )}

                    <form onSubmit={showOtpField ? handleVerifyOTP : handleSendOTP} className="space-y-5">

                        {/* Mobile Input Group */}
                        <div className="relative flex items-center">
                            <div className="absolute left-5 text-slate-500 text-[15px] z-10 pointer-events-none">
                                +91
                            </div>
                            <input
                                type="tel"
                                placeholder="Target user mobile number *"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                required
                                disabled={showOtpField}
                                maxLength={10}
                                className="w-full pl-14 pr-5 py-4 bg-white border border-slate-200 rounded-[24px] text-slate-700 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all font-serif disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>

                        {showOtpField && (
                            <div className="space-y-4">
                                <p className="text-center text-sm text-slate-500 text-pretty">Enter authorization OTP sent to <b>target user</b> mobile number</p>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit OTP *"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    maxLength={6}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[24px] text-slate-700 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all font-serif text-center tracking-[0.5em]"
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSending || isVerifying || (!showOtpField && !mobile) || (showOtpField && otp.length !== 6)}
                            className={`w-full mt-4 py-4 rounded-[24px] font-bold text-[15px] transition-all tracking-wider font-serif ${isSending || isVerifying || (!showOtpField && !mobile) || (showOtpField && otp.length !== 6)
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : action === 'deactivate'
                                    ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-xl shadow-red-500/20 active:scale-[0.98]'
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 active:scale-[0.98]'
                                }`}
                        >
                            {isSending || isVerifying ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{isSending ? 'SENDING...' : 'VERIFYING...'}</span>
                                </div>
                            ) : showOtpField ? (
                                `VERIFY & ${action.toUpperCase()}`
                            ) : (
                                `SEND OTP TO ${action.toUpperCase()}`
                            )}
                        </button>

                        {/* Back Button */}
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-full py-2 text-slate-400 text-[13px] hover:text-slate-600 transition-colors underline font-serif underline-offset-4"
                        >
                            Cancel and return
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => navigate('/privacy-policy')}
                            className="text-slate-800 text-[13px] hover:text-slate-600 transition-colors font-serif underline underline-offset-4 decoration-slate-400"
                        >
                            Terms and Policy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccount;
