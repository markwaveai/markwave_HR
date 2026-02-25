import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const DeleteAccount = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const [showOtpField, setShowOtpField] = useState(false);
    const [otp, setOtp] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await authApi.sendOTP(mobile, 'deactivate');
            setShowOtpField(true);
            alert('OTP Sent successfully to your mobile number!');
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
            await authApi.updateAccountStatus(mobile, otp, 'deactivate');
            alert(`Account deactivated successfully!`);
            navigate(-1);
        } catch (error) {
            console.error('Failed to verify OTP:', error);
            alert(error.response?.data?.error || error.message || 'Failed to verify OTP. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex flex-col lg:flex-row">

            {/* Form section centered */}
            <div className="w-full flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-[500px] bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">

                    <div className="text-center mb-10">
                        <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 mb-2 font-serif">
                            Delete Account
                        </h1>
                        <p className="text-slate-900 font-bold text-[15px]">
                            We're sorry to see you go.
                        </p>
                    </div>

                    <form onSubmit={showOtpField ? handleVerifyOTP : handleSendOTP} className="space-y-5">

                        {/* Mobile Input Group */}
                        <div className="relative flex items-center">
                            <div className="absolute left-5 text-slate-500 text-[15px] z-10 pointer-events-none">
                                +91
                            </div>
                            <input
                                type="tel"
                                placeholder="Enter your registered mobile *"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                                required
                                disabled={showOtpField}
                                maxLength={10}
                                className="w-full pl-14 pr-5 py-4 bg-white border border-slate-200 rounded-[24px] text-slate-700 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all font-serif disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>

                        {/* Name Inputs Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="First Name *"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                disabled={showOtpField}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[24px] text-slate-700 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all font-serif disabled:bg-slate-50 disabled:text-slate-500"
                            />
                            <input
                                type="text"
                                placeholder="Last Name *"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                disabled={showOtpField}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[24px] text-slate-700 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all font-serif disabled:bg-slate-50 disabled:text-slate-500"
                            />
                        </div>

                        {/* Email Input */}
                        <input
                            type="email"
                            placeholder="Email Address (Optional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={showOtpField}
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[24px] text-slate-700 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all font-serif disabled:bg-slate-50 disabled:text-slate-500"
                        />

                        {showOtpField && (
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP *"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                                maxLength={6}
                                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[24px] text-slate-700 text-[15px] placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:ring-4 focus:ring-slate-100 transition-all font-serif text-center tracking-[0.5em]"
                            />
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSending || isVerifying || (!showOtpField && (!mobile || !firstName || !lastName)) || (showOtpField && otp.length !== 6)}
                            className={`w-full mt-4 py-4 rounded-[24px] font-bold text-[15px] transition-all tracking-wider font-serif ${isSending || isVerifying || (!showOtpField && (!mobile || !firstName || !lastName)) || (showOtpField && otp.length !== 6)
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-xl shadow-red-500/20 active:scale-[0.98]'
                                }`}
                        >
                            {isSending || isVerifying ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{isSending ? 'SENDING...' : 'VERIFYING...'}</span>
                                </div>
                            ) : showOtpField ? (
                                `VERIFY & DEACTIVATE`
                            ) : (
                                'SEND OTP'
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
