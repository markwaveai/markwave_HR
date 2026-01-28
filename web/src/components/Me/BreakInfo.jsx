import React from 'react';

const BreakInfo = ({ log, activeBreakIndex, index }) => {
    if (activeBreakIndex !== index) return null;

    // Calculate individual break timings and durations
    const breaks = [];
    if (log.logs && log.logs.length > 1) {
        for (let sIdx = 1; sIdx < log.logs.length; sIdx++) {
            const prevSession = log.logs[sIdx - 1];
            const currentSession = log.logs[sIdx];

            const parseTimeToMinutes = (timeStr) => {
                const [time, modifier] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (hours === 12) hours = 0;
                if (modifier === 'PM') hours += 12;
                return hours * 60 + minutes;
            };

            const breakStart = parseTimeToMinutes(prevSession.out);
            const breakEnd = parseTimeToMinutes(currentSession.in);
            const breakDuration = breakEnd - breakStart;

            breaks.push({
                start: prevSession.out,
                end: currentSession.in,
                duration: breakDuration
            });
        }
    }

    const totalCalculatedBreak = breaks.reduce((sum, b) => sum + b.duration, 0);
    const displayTotal = (log.logs && log.logs.length >= 1) ? totalCalculatedBreak : log.breakMinutes;

    return (
        <div className="absolute z-50 left-full top-1/2 -translate-y-1/2 ml-3 w-56 bg-white rounded-lg shadow-xl border border-[#e2e8f0] p-3 text-left animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="text-[10px] font-bold text-[#636e72] uppercase tracking-wider mb-2 pb-1 border-b border-[#e2e8f0]">Break Timings</div>
            <div className="space-y-1.5">
                {breaks.length > 0 ? (
                    breaks.map((breakInfo, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] gap-2">
                            <span className="text-[#636e72] whitespace-nowrap">Break {idx + 1}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#2d3436] text-[10px]">{breakInfo.start} - {breakInfo.end}</span>
                                <span className="text-[#48327d] font-bold text-[10px]">({breakInfo.duration}m)</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-[11px] text-[#636e72] text-center py-1">No break data</div>
                )}
            </div>
            <div className="mt-3 pt-2 border-t border-[#f1f2f6] flex justify-between items-center text-[10px] font-bold">
                <span className="text-[#636e72]">TOTAL</span>
                <span className="text-[#48327d]">{displayTotal}m</span>
            </div>
        </div>
    );
};

export default BreakInfo;
