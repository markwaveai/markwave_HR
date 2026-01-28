import React from 'react';
import { Clock } from 'lucide-react';

const ClockCard = ({ currentTime, isClockedIn, isLoadingLocation, locationState, handleClockAction }) => {
    return (
        <div className="bg-[#8e78b0] rounded-lg p-5 shadow-lg text-white">
            <div className="flex justify-between items-center mb-4 opacity-90">
                <span className="text-sm font-medium">Time Today - {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="flex justify-between items-end">
                <div>
                    <div className="text-[10px] font-bold tracking-widest mb-1 opacity-80">CURRENT TIME</div>
                    <div className="flex items-baseline font-light">
                        <span className="text-5xl">
                            {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                        </span>
                        <span className="text-xl mx-0.5 opacity-80">:{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                        <span className="text-2xl ml-1 font-normal">{currentTime.getHours() >= 12 ? 'PM' : 'AM'}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        className="bg-white text-[#8e78b0] px-4 py-2 rounded-md font-semibold text-sm transition-all hover:bg-opacity-90 active:scale-95 shadow-sm"
                        onClick={handleClockAction}
                        disabled={isLoadingLocation}
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
