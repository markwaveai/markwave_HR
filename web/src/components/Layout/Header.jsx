import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, LogOut, User, Mail, Briefcase, Shield, X } from 'lucide-react';

function Header({ user, isSidebarOpen, onMenuClick, onLogout }) {
    const [showProfile, setShowProfile] = useState(false);
    const dropdownRef = useRef(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getInitials = () => {
        if (!user) return 'HM';
        return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    };

    return (
        <header className="bg-[#48327d] h-[44px] flex items-center justify-between px-3 mm:px-8 text-white shrink-0 z-40 relative">
            <div className="flex items-center gap-1.5 mm:gap-4 flex-1">
                {!isSidebarOpen && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu size={18} />
                    </button>
                )}
                <div className="flex items-center bg-white rounded-full px-3 mm:px-4 py-1 max-w-[160px] mm:max-w-[200px] w-full gap-2 relative">
                    <Search size={12} mm:size={14} className="text-[#636e72]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="border-none bg-transparent w-full outline-none text-[10px] mm:text-xs text-[#2d3436]"
                    />
                    <span className="hidden ml:block bg-[#f1f2f6] text-[#636e72] px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">Alt + K</span>
                </div>
            </div>

            <div className="flex items-center gap-3 mm:gap-6 ml-2 relative" ref={dropdownRef}>
                <div
                    onClick={() => setShowProfile(!showProfile)}
                    className="w-7 h-7 mm:w-8 mm:h-8 bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-full flex items-center justify-center text-white font-bold text-xs mm:text-sm border-2 border-white/50 cursor-pointer shrink-0 hover:scale-105 transition-all shadow-lg active:scale-95"
                >
                    {getInitials()}
                </div>

                {/* Profile Dialog Dropdown */}
                {showProfile && (
                    <div className="absolute top-[50px] right-0 w-[300px] bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#e2e8f0] overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50">
                        {/* Decorative Top Bar */}
                        <div className="h-1.5 bg-gradient-to-r from-[#48327d] via-[#6c5ce7] to-[#3498db]" />

                        {/* Close Button & Header */}
                        <div className="relative p-6 pb-4">
                            <button
                                onClick={() => setShowProfile(false)}
                                className="absolute top-4 right-4 p-1.5 text-[#94a3b8] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-full transition-all"
                            >
                                <X size={16} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#48327d] to-[#6c5ce7] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg mb-3 ring-4 ring-purple-50">
                                    {getInitials()}
                                </div>
                                <h3 className="font-black text-[#1e293b] text-lg leading-tight truncate w-full px-2">
                                    {user?.first_name} {user?.last_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-black text-[#48327d] bg-[#f0edff] px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#48327d]/10">
                                        {user?.employee_id || 'MARKWAVE'}
                                    </span>
                                    {user?.is_admin && (
                                        <span className="flex items-center gap-1 text-[10px] font-black text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#10b981]/10">
                                            <Shield size={10} /> Admin
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info List */}
                        <div className="px-3 pb-2">
                            <div className="bg-[#f8fafc] rounded-xl p-2 space-y-1">
                                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all group cursor-default">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#64748b] group-hover:text-[#48327d] shadow-sm ring-1 ring-[#e2e8f0]">
                                        <Briefcase size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.1em] leading-none mb-1">Designation</p>
                                        <p className="text-xs font-bold text-[#475569] truncate">{user?.role || 'Team Member'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all group cursor-default">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#64748b] group-hover:text-[#48327d] shadow-sm ring-1 ring-[#e2e8f0]">
                                        <Mail size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-[0.1em] leading-none mb-1">Email Address</p>
                                        <p className="text-xs font-bold text-[#475569] truncate underline-offset-2 decoration-[#48327d]/20 group-hover:underline">{user?.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Logout */}
                        <div className="p-4 bg-[#f8fafc] border-t border-[#f1f5f9]">
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-[#fff1f0] text-[#64748b] hover:text-[#cf1322] rounded-xl transition-all font-black text-sm border border-[#e2e8f0] hover:border-[#ffa39e] group active:scale-[0.98]"
                            >
                                <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                                <span>Sign Out</span>
                            </button>
                            <p className="text-center text-[9px] font-bold text-[#cbd5e1] mt-3 uppercase tracking-[0.2em]">Markwave HR v1.0.02</p>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
