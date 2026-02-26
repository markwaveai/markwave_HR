import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    Users,
    Calendar,
    Settings,
    LogOut,
    UserPlus,
    Menu,
    X,
    Shield,
    HelpCircle,
    Trash2
} from 'lucide-react';

function Sidebar({ user, onLogout, isOpen, onClose }) {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleCloseModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setShowLogoutConfirm(false);
            setIsClosing(false);
        }, 200);
    };

    const handleLogoutWithClosing = () => {
        setIsClosing(true);
        setTimeout(() => {
            onLogout();
        }, 200);
    };

    // Check is_admin flag primarily, with role fallbacks for robustness
    const isAdmin = user?.is_admin === true ||
        user?.role === 'Admin' ||
        user?.role === 'Administrator' ||
        user?.role === 'Project Manager' ||
        user?.role === 'Founder' ||
        user?.role === 'Acting Admin' ||
        user?.role === 'Advisor-Technology & Operations';

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['All'] },
        { id: 'me', label: 'Me', icon: User, path: '/me', roles: ['Employee', 'Admin'] },
        { id: 'team', label: 'My Team', icon: Users, path: '/team', roles: ['Employee'] },
        { id: 'employee-management', label: 'Employee Management', icon: UserPlus, path: '/employee-management', roles: ['Admin'] },
        { id: 'team-management', label: 'Team Management', icon: Users, path: '/team-management', roles: ['Admin'] },
        { id: 'leaves', label: 'Leave & Attendance', icon: Calendar, path: '/leaves', roles: ['Employee'] },
        { id: 'admin-leaves', label: 'Leave Management', icon: Calendar, path: '/admin-leaves', roles: ['Admin'] },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', roles: ['All'] },
        { id: 'privacy-policy', label: 'Privacy Policy', icon: Shield, path: '/privacy-policy', roles: ['All'] },
        { id: 'support', label: 'Support', icon: HelpCircle, path: '/support', roles: ['All'] },
        { id: 'delete-user', label: 'Delete User', icon: Trash2, path: '/account-management', roles: ['Admin', 'Employee'] }
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (item.roles.includes('All')) return true;
        if (isAdmin && item.roles.includes('Admin')) return true;
        if (!isAdmin && item.roles.includes('Employee')) return true;
        return false;
    });

    return (
        <>
            <aside className={`fixed lg:relative top-0 left-0 bottom-0 w-[240px] bg-[#48327d] flex flex-col h-full shrink-0 z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-[48px] flex items-center justify-center px-4 border-b border-white/10 shrink-0 relative">
                    <button
                        onClick={onClose}
                        className="lg:hidden text-white/90 hover:bg-white/10 p-1.5 rounded-lg transition-colors absolute left-3 top-1/2 -translate-y-1/2"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center">
                        <img src="/images/logo.png" alt="Markwave" className="h-6 w-auto object-contain" />
                    </div>
                </div>

                <nav className="p-4 flex-1">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                state={(item.id === 'privacy-policy' || item.id === 'support' || item.id === 'delete-user') ? { fromPortal: true } : undefined}
                                className={({ isActive }) => `flex items-center gap-3 px-2 py-2 text-white no-underline rounded-lg transition-all font-medium mb-1 hover:bg-white/10 hover:text-white text-sm ${isActive ? 'bg-white/10 text-white' : ''}`}
                            >
                                <Icon size={18} /> {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="flex items-center gap-3 px-2 py-2 text-[#ff6b6b] no-underline rounded-lg hover:bg-white/10 transition-all font-medium text-sm w-full cursor-pointer"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* Custom Logout Modal */}
            {showLogoutConfirm && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e293b]/60 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
                    <div className={`bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl ${isClosing ? 'animate-modal-out' : 'animate-modal-in'} mx-4`}>
                        <div className="w-12 h-12 rounded-full bg-[#f3e5f5] flex items-center justify-center mx-auto mb-4">
                            <LogOut className="text-[#48327d]" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-[#2d3436] text-center mb-2">Log Out?</h3>
                        <p className="text-[#636e72] text-center mb-6 text-sm">
                            Are you sure you want to exit?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#636e72] font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogoutWithClosing}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-[#48327d] text-white font-semibold hover:bg-[#3d2a6a] shadow-lg shadow-purple-500/30 transition-all hover:translate-y-[-1px]"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Sidebar;
