import { Bell, Search, Menu } from 'lucide-react';

function Header({ user, isSidebarOpen, onMenuClick }) {
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
        <header className="bg-[#48327d] h-[44px] flex items-center justify-between px-8 text-white shrink-0 z-10">
            <div className="flex items-center gap-2 mm:gap-4">
                {!isSidebarOpen && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors mr-1"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <div className="flex items-center bg-white rounded-full px-4 py-1 max-w-[200px] w-full gap-2 relative">
                    <Search size={14} className="text-[#636e72]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="border-none bg-transparent w-full outline-none text-xs text-[#2d3436]"
                    />
                    <span className="hidden ml:block bg-[#f1f2f6] text-[#636e72] px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">Alt + K</span>
                </div>
            </div>

            <div className="flex items-center gap-6">

                <div className="w-8 h-8 bg-[#3498db] rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white cursor-pointer">
                    {getInitials()}
                </div>
            </div>
        </header>
    );
}

export default Header;
