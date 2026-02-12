import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HolidayCard = ({ holidays, holidayIndex, setHolidayIndex, setShowCalendar }) => {
    return (
        <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 text-[#8e78b0] relative overflow-hidden min-h-[140px] flex flex-col justify-between">
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
                <div className="flex-1 min-w-0">
                    <div className="min-h-[60px] mm:min-h-[80px] flex items-center mb-2">
                        <h2 className="text-xl mm:text-2xl font-bold tracking-tight text-[#48327d] line-clamp-2 leading-tight">
                            {holidays[holidayIndex].name}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs mm:text-sm font-medium text-[#8e78b0]/80 whitespace-nowrap">{holidays[holidayIndex].date}</span>
                        <span className="bg-[#48327d] text-white text-[7px] mm:text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                            {holidays[holidayIndex].is_optional ? 'OPTIONAL' : holidays[holidayIndex].type}
                        </span>
                    </div>
                </div>

                <div className="relative w-24 h-24 flex items-center justify-center group">
                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 -mb-2">
                        <button
                            onClick={() => setHolidayIndex(prev => Math.max(0, prev - 1))}
                            disabled={holidayIndex === 0}
                            className={`p-1 rounded-full transition-colors ${holidayIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                        >
                            <ChevronLeft size={24} className="text-[#48327d]" />
                        </button>
                        <button
                            onClick={() => setHolidayIndex(prev => Math.min(holidays.length - 1, prev + 1))}
                            disabled={holidayIndex === holidays.length - 1}
                            className={`p-1 rounded-full transition-colors ${holidayIndex === holidays.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50'}`}
                        >
                            <ChevronRight size={24} className="text-[#48327d]" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#8e78b0]/5 rounded-full pointer-events-none"></div>
        </div>
    );
};

export default HolidayCard;
