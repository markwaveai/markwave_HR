import React from 'react';

const HolidayModal = ({ setShowCalendar }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-4 relative overflow-hidden animate-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-[#2d3436]">January 2026</h2>
                        <p className="text-[10px] text-slate-500 font-medium">Holiday Calendar</p>
                    </div>
                    <button
                        onClick={() => setShowCalendar(false)}
                        className="p-1 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="mb-4">
                    <div className="grid grid-cols-7 gap-0.5 mb-1.5">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                            <div key={day} className="text-[8px] font-bold text-slate-400 text-center">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                        {[...Array(4)].map((_, i) => <div key={`empty-${i}`} />)}
                        {[...Array(31)].map((_, i) => {
                            const day = i + 1;
                            const isSpecial = [14, 15, 26].includes(day);
                            const bgColor = isSpecial ? 'bg-[#48327d]' : 'bg-transparent';
                            const textColor = isSpecial ? 'text-white font-bold' : 'text-[#2d3436]';

                            return (
                                <div
                                    key={day}
                                    className={`h-7 w-7 flex items-center justify-center rounded-lg text-[11px] font-medium transition-all
                                        ${bgColor} ${textColor}`}
                                >
                                    {day}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#48327d]"></div>
                        <span className="text-[9px] font-medium text-[#2d3436]">Jan 14 - Bhogi</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#48327d]"></div>
                        <span className="text-[9px] font-medium text-[#2d3436]">Jan 15 - Pongal</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#48327d]"></div>
                        <span className="text-[9px] font-medium text-[#2d3436]">Jan 26 - Rep. Day</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidayModal;
