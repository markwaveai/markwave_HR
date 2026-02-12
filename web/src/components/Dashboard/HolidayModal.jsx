import React, { useState } from 'react';

const HolidayModal = ({ setShowCalendar, holidays = [] }) => {
    // Initialize with current date or first holiday year if far in future/past? 
    // Standard is usually current month.
    const [viewDate, setViewDate] = useState(new Date());

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentMonthHolidays = holidays.filter(h => {
        if (!h.raw_date) return false;
        const hDate = new Date(h.raw_date);
        return hDate.getMonth() === viewDate.getMonth() &&
            hDate.getFullYear() === viewDate.getFullYear();
    });

    // Helper to check if a specific day is a holiday
    const getHolidayForDay = (day) => {
        return currentMonthHolidays.find(h => {
            const hDate = new Date(h.raw_date);
            return hDate.getDate() === day;
        });
    };

    const daysInMonth = getDaysInMonth(viewDate);
    const startDay = getFirstDayOfMonth(viewDate);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-4 relative overflow-hidden animate-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mr-2">
                            {/* Navigation & Title */}
                            <div className="flex items-center gap-1.5">
                                <button onClick={prevMonth} className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#48327d] transition-colors">
                                    <span className="text-lg leading-none">‹</span>
                                </button>
                                <h2 className="text-lg font-bold text-[#2d3436]">
                                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </h2>
                                <button onClick={nextMonth} className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-[#48327d] transition-colors">
                                    <span className="text-lg leading-none">›</span>
                                </button>
                            </div>
                        </div>

                    </div>
                    <button
                        onClick={() => setShowCalendar(false)}
                        className="p-1 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Holiday List Content */}
                <div className="flex flex-col gap-3 py-1 min-h-[140px]">
                    {currentMonthHolidays.length > 0 ? (
                        currentMonthHolidays.map((h, idx) => {
                            const d = new Date(h.raw_date);
                            const monthShort = d.toLocaleString('default', { month: 'short' });
                            const day = d.getDate();
                            const formatted = `${monthShort} ${day}`;
                            const isOptional = h.is_optional || h.isOptional;

                            return (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                    <div className="w-2 h-2 rounded-full bg-[#48327d] shadow-sm flex-shrink-0"></div>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-bold text-[#2d3436]">
                                                {formatted} - {h.name}
                                            </span>
                                            {isOptional && (
                                                <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">
                                                    Optional
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 py-8 opacity-60">
                            <span className="text-[11px] text-[#64748b] font-medium italic">
                                No holidays in this month
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HolidayModal;
