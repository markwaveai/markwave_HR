import { useState, useRef, useEffect } from 'react';
import {
    Bell, Search, Menu, LogOut, User, Mail, Briefcase,
    Shield, X, LayoutDashboard, Users, Calendar,
    Settings, UserPlus, Fingerprint, Clock, HelpCircle,
    ChevronRight, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Header({ user, isSidebarOpen, onMenuClick, onLogout }) {
    const [showProfile, setShowProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const navigate = useNavigate();

    // Features / Command Center Data
    const FEATURES = [
        { id: 'dashboard', label: 'Dashboard', desc: 'Overview of your stats and company feed', path: '/dashboard', icon: LayoutDashboard, tags: ['home', 'main', 'overview', 'stats'] },
        { id: 'me', label: 'My Profile', desc: 'View your personal and work information', path: '/me', icon: User, tags: ['profile', 'self', 'identity', 'my info'] },
        { id: 'team', label: 'My Team', desc: 'View your colleagues and team status', path: '/team', icon: Users, tags: ['members', 'colleagues', 'coworkers'] },
        { id: 'leaves', label: 'Leave & Attendance', desc: 'Apply for leave or view attendance history', path: '/leaves', icon: Calendar, tags: ['holiday', 'vacations', 'sick', 'present'] },
        { id: 'regularize', label: 'Regularize Attendance', desc: 'Request correction for attendance logs', path: '/me', icon: Fingerprint, tags: ['correction', 'missed clock', 'late'] },
        { id: 'settings', label: 'Settings', desc: 'Application preferences and account info', path: '/settings', icon: Settings, tags: ['config', 'theme', 'password'] },
        { id: 'clock', label: 'Clock In / Out', desc: 'Mark your attendance for the day', path: '/dashboard', icon: Clock, tags: ['login', 'logout', 'attendance', 'checkin'] },
    ];

    // Admin Specific Features
    const ADMIN_FEATURES = [
        { id: 'emp-mgmt', label: 'Employee Management', desc: 'Add or manage employee records', path: '/employee-management', icon: UserPlus, tags: ['admin', 'hire', 'staff'] },
        { id: 'team-mgmt', label: 'Team Management', desc: 'Create and organize company teams', path: '/team-management', icon: Users, tags: ['admin', 'structure', 'units'] },
        { id: 'admin-leaves', label: 'Leave Approvals', desc: 'Review and act on pending leave requests', path: '/admin-leaves', icon: Shield, tags: ['manager', 'approvals', 'pending'] },
    ];

    const ALL_FEATURES = user?.is_admin ? [...FEATURES, ...ADMIN_FEATURES] : FEATURES;

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfile(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Alt + K shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setShowSearchResults(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Client-side search logic
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const query = searchQuery.toLowerCase();
        const results = ALL_FEATURES.filter(f =>
            f.label.toLowerCase().includes(query) ||
            f.desc.toLowerCase().includes(query) ||
            f.tags.some(t => t.includes(query))
        );

        setSearchResults(results);
        setShowSearchResults(true);
    }, [searchQuery, user?.is_admin]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const getUserInitials = () => {
        if (!user) return 'HM';
        return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    };

    return (
        <header className="bg-[#48327d] h-[48px] flex items-center justify-between px-3 mm:px-8 text-white shrink-0 z-40 relative">
            <div className="flex items-center gap-1.5 mm:gap-4 flex-1">
                {!isSidebarOpen && (
                    <button
                        onClick={onMenuClick}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
                    >
                        <Menu size={18} />
                    </button>
                )}

                <div className="relative flex-1 max-w-[280px]" ref={searchRef}>
                    <div className="flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white rounded-xl px-3 py-1.5 w-full gap-2 transition-all border border-white/10 focus-within:border-white shadow-sm group">
                        <Search size={14} className="text-white/60 group-focus-within:text-[#48327d]" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                            placeholder="Search features..."
                            className="border-none bg-transparent w-full outline-none text-xs text-white placeholder:text-white/50 focus:text-[#1e293b] focus:placeholder:text-[#94a3b8]"
                        />
                        <div className="hidden ml:flex items-center gap-1 px-1.5 py-0.5 bg-white/10 group-focus-within:bg-gray-100 rounded text-[9px] font-bold text-white/60 group-focus-within:text-[#64748b] whitespace-nowrap border border-white/5 border-t-white/10">
                            <span className="text-[7px] leading-none opacity-60">ALT</span>
                            <span>K</span>
                        </div>
                    </div>

                    {/* Feature Search Results Dropdown */}
                    {showSearchResults && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50 min-w-[320px]">
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    Quick Search
                                </span>
                                <span className="text-[9px] font-bold text-slate-300">
                                    {searchResults.length} Results
                                </span>
                            </div>

                            <div className="max-h-[360px] overflow-y-auto p-1">
                                {searchResults.length > 0 ? (
                                    searchResults.map((feature) => {
                                        const Icon = feature.icon;
                                        return (
                                            <div
                                                key={feature.id}
                                                onClick={() => {
                                                    setShowSearchResults(false);
                                                    setSearchQuery('');
                                                    navigate(feature.path);
                                                }}
                                                className="flex items-center gap-3 p-2.5 hover:bg-[#f0edff] cursor-pointer transition-colors group rounded-xl"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-[#48327d] transition-colors shrink-0">
                                                    <Icon size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#48327d]">
                                                        {feature.label}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{feature.desc}</p>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-200 group-hover:text-[#48327d]" />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-10 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <HelpCircle size={20} className="text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">Feature not found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 mm:gap-4 ml-2 relative" ref={dropdownRef}>
                {/* User Identity - Hidden on small mobile */}
                <div className="hidden mm:flex flex-col items-end leading-tight mr-1">
                    <span className="text-xs font-semibold text-white">
                        {user?.first_name} {user?.last_name}
                    </span>
                    <span className="text-[10px] text-white/60 font-medium">
                        {user?.role}
                    </span>
                </div>

                <div
                    onClick={() => setShowProfile(!showProfile)}
                    className="w-8 h-8 mm:w-9 mm:h-9 bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-full flex items-center justify-center text-white font-bold text-xs mm:text-sm border-2 border-white/50 cursor-pointer shrink-0 hover:scale-105 transition-all shadow-lg active:scale-95"
                >
                    {getUserInitials()}
                </div>

                {/* Profile Dialog Dropdown */}
                {showProfile && (
                    <div className="absolute top-[55px] right-0 w-[300px] bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#e2e8f0] overflow-hidden animate-in slide-in-from-top-2 duration-300 z-50">
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
                                    {getUserInitials()}
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
