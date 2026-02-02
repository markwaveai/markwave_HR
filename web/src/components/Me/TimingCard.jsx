import React from 'react';
import { Coffee } from 'lucide-react';

const TimingCard = ({ activeTiming, currentWeekLogs, selectedDayIndex, setSelectedDayIndex, getLocalSelectedDateStr }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-5 border border-[#e2e8f0]">
            <h3 className="text-sm font-medium text-[#636e72] mb-5">Timings</h3>

            <div className="flex justify-between mb-6 gap-1 overflow-x-auto pb-2 scrollbar-none">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
                    const log = currentWeekLogs[i];
                    const isToday = log?.date === getLocalSelectedDateStr(new Date());
                    return (
                        <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                            <button
                                onClick={() => setSelectedDayIndex(i)}
                                className={`w-8 h-8 mm:w-9 mm:h-9 tab:w-10 tab:h-10 rounded-full flex items-center justify-center text-xs mm:text-sm font-bold transition-all relative ${selectedDayIndex === i
                                    ? 'bg-[#48327d] text-white shadow-md transform scale-110'
                                    : isToday ? 'bg-[#48327d]/10 text-[#48327d] border border-[#48327d]/30' : 'bg-[#f1f2f6] text-[#636e72] hover:bg-[#e2e8f0]'
                                    }`}
                            >
                                {label}
                                {isToday && <div className="absolute -top-1 -right-1 w-2 h-2 mm:w-2.5 mm:h-2.5 bg-[#ef4444] rounded-full border-2 border-white"></div>}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-5">
                <div className="text-sm font-medium text-[#2d3436] flex justify-between items-center">
                    <span>{activeTiming.day}, {activeTiming.dateStr}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTiming.range === 'Weekly Off' || activeTiming.range === 'Holiday' ? 'bg-[#8e78b0]/10 text-[#8e78b0]' : 'bg-[#48327d]/10 text-[#48327d]'}`}>
                        {activeTiming.range}
                    </span>
                </div>
                <div className="h-2.5 bg-[#f1f2f6] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#48327d] rounded-full transition-all duration-300"
                        style={{ width: `${activeTiming.progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-[#8e78b0] font-medium">
                    <span>Duration: {activeTiming.duration}</span>
                    <div className="flex items-center gap-1.5 pt-1">
                        <Coffee size={15} />
                        <span>{activeTiming.break}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimingCard;
