import React from 'react';
import { Clock } from 'lucide-react';

const ClockCard = ({ currentTime, isClockedIn, isLoadingLocation, locationState, handleClockAction, canClock = true, disabledReason }) => {
    return (
        <div className="bg-[#8e78b0] rounded-xl p-4 shadow-lg text-white min-h-[140px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4 opacity-90">
                <span className="text-sm font-medium">Time Today - {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                {disabledReason && <span className="text-xs bg-white text-[#8e78b0] px-2 py-0.5 rounded-full font-bold">{disabledReason.toUpperCase()}</span>}
            </div>

            <div className="flex justify-between items-end gap-2">
                <div>
                    <div className="text-[10px] font-bold tracking-widest mb-1 opacity-80 uppercase">CURRENT TIME</div>
                    <div className="flex items-baseline font-light whitespace-nowrap">
                        <span className="text-3xl ms:text-4xl mm:text-5xl">
                            {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                        </span>
                        <span className="text-lg mm:text-xl mx-0.5 opacity-80">:{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                        <span className="text-xl mm:text-2xl ml-1 font-normal">{currentTime.getHours() >= 12 ? 'PM' : 'AM'}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        className={`bg-white text-[#8e78b0] px-4 py-2 rounded-md font-semibold text-sm transition-all shadow-sm ${(!canClock || isLoadingLocation) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90 active:scale-95'}`}
                        onClick={handleClockAction}
                        disabled={!canClock || isLoadingLocation}
                    >
                        {isLoadingLocation || isClockedIn === null ? (
                            isClockedIn === null ? 'Loading...' : 'Locating...'
                        ) : (isClockedIn ? 'Web Clock-Out' : 'Web Clock-In')}
                    </button>
                </div>
            </div>

            {locationState && <div className="text-[10px] mt-2 opacity-80 font-medium">📍 {locationState}</div>}
        </div>
    );
};

export default ClockCard;
