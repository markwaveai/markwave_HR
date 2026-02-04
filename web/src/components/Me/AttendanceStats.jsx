import React, { useState, useRef, useEffect } from 'react';
import { User, Users, ChevronDown } from 'lucide-react';

const MeStatsRow = ({ label, avgHrs, onTime, icon: Icon }) => {
    const avgParts = (avgHrs || "0h 00m").split(' ');

    return (
        <div className="grid grid-cols-[1.2fr_1fr_1fr] items-center gap-1 mm:gap-4">
            <div className="flex items-center gap-1 mm:gap-3 min-w-0">
                <div className="hidden mm:flex w-8 h-8 rounded-xl bg-[#f8fafc] text-[#48327d] items-center justify-center shrink-0 border border-[#f1f5f9] shadow-sm">
                    <Icon size={14} />
                </div>
                <span className="text-[10px] mm:text-sm font-black text-[#1e293b] truncate uppercase tracking-tight">{label}</span>
            </div>
            <div className="text-center">
                <div className="text-[7px] mm:text-[9px] font-bold text-[#8e78b0] leading-tight mb-1 mm:mb-2 uppercase tracking-wider">
                    Avg Hrs /<br />Day
                </div>
                <div className="flex items-baseline justify-center gap-1">
                    <div className="text-sm mm:text-lg font-black text-[#1e293b] leading-tight">{avgParts[0]}</div>
                    <div className="text-[9px] mm:text-xs font-black text-[#1e293b] opacity-80 leading-tight">{avgParts[1] || '00m'}</div>
                </div>
            </div>
            <div className="text-center">
                <div className="text-[7px] mm:text-[9px] font-bold text-[#8e78b0] leading-tight mb-1 mm:mb-2 uppercase tracking-wider">
                    On Time<br />Arrival
                </div>
                <div className="text-lg mm:text-2xl font-black text-[#48327d] mt-1">{onTime || '0%'}</div>
            </div>
        </div>
    );
};

const AttendanceStats = ({ stats }) => {
    const [timeframe, setTimeframe] = useState('week'); // 'week' or 'month'
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Get stats based on timeframe
    const currentStats = timeframe === 'week' ? stats?.week : stats?.month;

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    const options = [
        { id: 'week', label: 'This Week' },
        { id: 'month', label: 'This Month' }
    ];

    return (
        <div className={`bg-white rounded-xl shadow-lg p-3 mm:p-4 border border-[#e2e8f0] relative ${showDropdown ? 'z-[60]' : 'z-auto'}`}>
            <div className="flex justify-between items-center mb-5">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f8fafc] hover:bg-[#f1f5f9] rounded-lg transition-all border border-[#e2e8f0] text-xs font-bold text-[#64748b] active:scale-95"
                    >
                        <span>{options.find(o => o.id === timeframe)?.label}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                        <div className="absolute top-full left-0 mt-1.5 w-32 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#e2e8f0] z-[70] py-1.5 animate-in fade-in duration-200">
                            {options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setTimeframe(opt.id);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors ${timeframe === opt.id ? 'bg-[#48327d] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <MeStatsRow
                    label="Me"
                    avgHrs={currentStats?.me?.avg}
                    onTime={currentStats?.me?.onTime}
                    icon={User}
                />
                <MeStatsRow
                    label="My Team"
                    avgHrs={currentStats?.team?.avg}
                    onTime={currentStats?.team?.onTime}
                    icon={Users}
                />
            </div>
        </div>
    );
};

export default AttendanceStats;
