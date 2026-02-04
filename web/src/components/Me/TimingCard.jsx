import React from 'react';
import { Coffee } from 'lucide-react';

const TimingCard = ({ activeTiming, currentWeekLogs, selectedDayIndex, setSelectedDayIndex, getLocalSelectedDateStr }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-2.5 mm:p-4 border border-[#e2e8f0] flex flex-col justify-between h-full">
            <h3 className="text-[10px] font-bold text-[#636e72] mb-3 uppercase tracking-wider">Timings</h3>

            <div className="flex justify-between items-center mb-6 px-0.5 pt-2 gap-0.5">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
                    const log = currentWeekLogs[i];
                    const isToday = log?.date === getLocalSelectedDateStr(new Date());
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            <button
                                onClick={() => setSelectedDayIndex(i)}
                                className={`w-[90%] aspect-square max-w-[40px] rounded-full flex items-center justify-center text-[8px] mm:text-[10px] ml:text-xs font-bold transition-all relative flex-shrink-0 ${selectedDayIndex === i
                                    ? 'bg-[#48327d] text-white shadow-md transform scale-110'
                                    : isToday ? 'bg-[#48327d]/10 text-[#48327d] border border-[#48327d]/30' : 'bg-[#f1f2f6] text-[#636e72] hover:bg-[#e2e8f0]'
                                    }`}
                            >
                                {label}
                                {isToday && <div className="absolute -top-0.5 -right-0.5 w-[30%] h-[30%] bg-[#ef4444] rounded-full border border-white"></div>}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="space-y-5">
                <div className="text-[10px] font-black text-[#2d3436] flex flex-wrap justify-between items-center gap-y-1">
                    <span className="truncate">{activeTiming.day}, {activeTiming.dateStr}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded-full font-black uppercase tracking-tight shrink-0 ${activeTiming.range === 'Weekly Off' || activeTiming.range === 'Holiday' ? 'bg-[#8e78b0]/10 text-[#8e78b0]' : 'bg-[#48327d]/10 text-[#48327d]'}`}>
                        {activeTiming.range}
                    </span>
                </div>
                <div className="h-2.5 bg-[#f1f2f6] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#48327d] rounded-full transition-all duration-300"
                        style={{ width: `${activeTiming.progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] mm:text-[10px] text-[#8e78b0] font-black uppercase tracking-tight">
                    <span>Dur: {activeTiming.duration}</span>
                    <div className="flex items-center gap-1">
                        <Coffee size={12} className="shrink-0" />
                        <span>{activeTiming.break}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimingCard;
