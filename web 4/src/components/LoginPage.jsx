import { useState } from 'react';
import { Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.user);
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Connection failed. Please check backend.');
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

            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-[#dfe6e9] overflow-hidden z-10 animate-in fade-in zoom-in duration-300 mx-auto">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-[#48327d] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#48327d]/20">
                            <Lock className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-[#2d3436]">Welcome Back</h1>
                        {/* Updated Text */}
                        <p className="text-[#636e72] text-sm mt-2">Please sign in to MarkwaveHR</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#636e72] uppercase tracking-wider block">Mobile Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-[#b2bec3] group-focus-within:text-[#48327d] transition-colors" />
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-[#dfe6e9] rounded-xl text-sm placeholder-[#b2bec3] focus:outline-none focus:border-[#48327d] focus:ring-1 focus:ring-[#48327d] transition-all bg-[#fbfcff]"
                                    placeholder="Enter your mobile number"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#636e72] uppercase tracking-wider block">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-[#b2bec3] group-focus-within:text-[#48327d] transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-[#dfe6e9] rounded-xl text-sm placeholder-[#b2bec3] focus:outline-none focus:border-[#48327d] focus:ring-1 focus:ring-[#48327d] transition-all bg-[#fbfcff]"
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 p-3 rounded-lg animate-in slide-in-from-top-1">
                                <AlertCircle size={14} />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-[#48327d] hover:bg-[#3a2865] text-white py-3 px-4 rounded-xl font-bold text-sm transition-all transform active:scale-[0.98] shadow-md shadow-[#48327d]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                <div className="bg-[#fbfcff] p-4 text-center border-t border-[#dfe6e9]">
                    <p className="text-xs text-[#636e72]">
                        Don't have an account? <span className="text-[#48327d] font-bold cursor-pointer hover:underline">Contact Admin</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
