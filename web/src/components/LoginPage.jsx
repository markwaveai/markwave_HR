import { useState } from 'react';
import { Lock, Phone, ArrowRight, AlertCircle, Mail } from 'lucide-react';
import { authApi } from '../services/api';

const LoginPage = ({ onLogin }) => {
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('input'); // 'input' or 'otp'
    const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (loginMethod === 'phone') {
                await authApi.sendOTP(phone);
                setStep('otp');
            } else {
                await authApi.sendEmailOTP(email);
                setStep('otp');
            }
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let data;
            if (loginMethod === 'phone') {
                data = await authApi.verifyOTP(phone, otp);
                if (data.success) {
                    onLogin(data.user);
                } else {
                    setError(data.error || 'Invalid OTP');
                }
            } else {
                data = await authApi.verifyEmailOTP(email, otp);
                if (data.success) {
                    onLogin(data.user);
                } else {
                    setError('Invalid OTP');
                }
            }
        } catch (err) {
            setError(err.message || 'Connection failed. Please check backend.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Changed to h-screen w-screen and added fixed positioning to ensure it's always centered in the viewport
        <div className="h-screen w-screen bg-[#f5f7fa] flex items-center justify-center p-4 fixed top-0 left-0 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#48327d]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#48327d]/5 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white w-full max-w-[300px] mm:max-w-md rounded-2xl shadow-xl border border-[#dfe6e9] overflow-hidden z-10 animate-in fade-in zoom-in duration-300 mx-auto">
                <div className="px-6 py-12">
                    <div className="text-center mb-6">
                        <div className="w-52 h-auto bg-transparent flex items-center justify-center mx-auto mb-8">
                            <img src="/images/logo.png" alt="Logo" className="w-[87%] object-contain" />
                        </div>
                        <h1 className="text-xl mm:text-xl ml:text-2xl font-bold text-[#2d3436]">
                            {step === 'input' ? 'Welcome to Markwave HR' : 'Verify Identity'}
                        </h1>
                        <p className="text-[#636e72] text-[12px] mm:text-[12px] ml:text-sm mt-1.5 mm:mt-2">
                            {step === 'input'
                                ? `Please enter your ${loginMethod === 'phone' ? 'mobile number' : 'email'} to receive an OTP`
                                : `Enter the 6-digit code sent to ${loginMethod === 'phone' ? phone : email}`}
                        </p>
                    </div>

                    {step === 'input' && (
                        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('phone'); setError(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'phone'
                                    ? 'bg-white text-[#48327d] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Phone
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('email'); setError(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'email'
                                    ? 'bg-white text-[#48327d] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Email
                            </button>
                        </div>
                    )}

                    <form onSubmit={step === 'input' ? handleSendOTP : handleVerifyOTP} className="space-y-4" autoComplete="off">
                        {step === 'input' ? (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#636e72] uppercase tracking-wider block">
                                    {loginMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        {loginMethod === 'phone' ? (
                                            <Phone className="h-5 w-5 text-[#b2bec3] group-focus-within:text-[#48327d] transition-colors" />
                                        ) : (
                                            <Mail className="h-5 w-5 text-[#b2bec3] group-focus-within:text-[#48327d] transition-colors" />
                                        )}
                                    </div>
                                    <input
                                        type={loginMethod === 'phone' ? 'tel' : 'email'}
                                        value={loginMethod === 'phone' ? phone : email}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (loginMethod === 'phone') {
                                                if (/^\d*$/.test(val) && val.length <= 10) setPhone(val);
                                            } else {
                                                setEmail(val);
                                            }
                                        }}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-[#dfe6e9] rounded-xl text-sm placeholder-[#b2bec3] focus:outline-none focus:border-[#48327d] focus:ring-1 focus:ring-[#48327d] transition-all bg-[#fbfcff]"
                                        placeholder={loginMethod === 'phone' ? "Enter your mobile number" : "Enter your email address"}
                                        required
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#636e72] uppercase tracking-wider block">One-Time Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-[#b2bec3] group-focus-within:text-[#48327d] transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-[#dfe6e9] rounded-xl text-sm placeholder-[#b2bec3] tracking-[0.5em] font-mono text-center focus:outline-none focus:border-[#48327d] focus:ring-1 focus:ring-[#48327d] transition-all bg-[#fbfcff]"
                                        placeholder="000000"
                                        required
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep('input')}
                                    className="text-xs text-[#48327d] hover:underline font-medium"
                                >
                                    Change {loginMethod === 'phone' ? 'mobile number' : 'email'}?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-lg animate-in slide-in-from-top-1">
                                <AlertCircle size={14} />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || (step === 'input' && (loginMethod === 'phone' ? phone.length !== 10 : !email))}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] shadow-md 
                                ${isLoading || (step === 'input' && (loginMethod === 'phone' ? phone.length !== 10 : !email))
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                    : 'bg-[#48327d] hover:bg-[#3a2865] text-white shadow-[#48327d]/20'
                                }`}
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{step === 'input' ? 'Get OTP' : 'Verify & Sign In'}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
