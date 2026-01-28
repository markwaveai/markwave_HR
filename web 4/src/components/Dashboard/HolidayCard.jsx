import React from 'react';

const HolidayCard = ({ holidays, holidayIndex, setHolidayIndex, setShowCalendar }) => {
    return (
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 text-[#8e78b0] relative overflow-hidden min-h-[160px]">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold text-[#2d3436]">Holidays</h3>
                <button
                    onClick={() => setShowCalendar(true)}
                    className="text-sm font-medium underline text-[#48327d]"
                >
                    View All
                </button>
            </div>

            <div className="flex justify-between items-center relative z-10">
                <div className="flex-1">
                    <h2 className="text-4xl font-bold mb-3 tracking-wide text-[#48327d]">{holidays[holidayIndex].name}</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#8e78b0]/80">{holidays[holidayIndex].date}</span>
                        <span className="bg-[#48327d] text-white text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider">
                            {holidays[holidayIndex].type}
                        </span>
                    </div>
                </div>

                <div className="relative w-24 h-24 flex items-center justify-center group">
                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 -mb-2">
                        <button
                            onClick={() => setHolidayIndex(prev => Math.max(0, prev - 1))}
                            disabled={holidayIndex === 0}
                            className={`p-1 rounded-full transition-colors ${holidayIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            <span className="text-2xl text-[#48327d]">‹</span>
                        </button>
                        <button
                            onClick={() => setHolidayIndex(prev => Math.min(holidays.length - 1, prev + 1))}
                            disabled={holidayIndex === holidays.length - 1}
                            className={`p-1 rounded-full transition-colors ${holidayIndex === holidays.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                            <span className="text-2xl text-[#48327d]">›</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#8e78b0]/5 rounded-full pointer-events-none"></div>
        </div>
    );
};

export default HolidayCard;
