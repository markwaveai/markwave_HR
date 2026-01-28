import { Bell, Search } from 'lucide-react';

function Header({ user }) {
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
        <header className="bg-[#48327d] h-[44px] flex items-center justify-between px-5 text-white shrink-0 z-10">
            <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-full px-4 py-1 max-w-[200px] w-full gap-2 relative">
                    <Search size={14} className="text-[#636e72]" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="border-none bg-transparent w-full outline-none text-xs text-[#2d3436]"
                    />
                    <span className="bg-[#f1f2f6] text-[#636e72] px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">Alt + K</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative cursor-pointer">
                    <Bell size={20} className="text-white" />
                    <span className="absolute -top-1.5 -right-1.5 bg-[#d63031] text-white text-[10px] px-1 rounded-full min-w-[14px] text-center border-2 border-[#48327d]">1</span>
                </div>
                <div className="w-8 h-8 bg-[#3498db] rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-white cursor-pointer">
                    {getInitials()}
                </div>
            </div>
        </header>
    );
}

export default Header;
