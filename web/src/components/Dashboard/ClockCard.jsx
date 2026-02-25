import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

const ClockCard = ({ currentTime, isClockedIn, isLoadingLocation, locationState, handleClockAction, canClock = true, disabledReason }) => {
    const isOnLeave = disabledReason?.toLowerCase() === 'on leave' || disabledReason?.toLowerCase() === 'leave';
    const isAbsent = disabledReason?.toLowerCase() === 'absent';

    // Button is disabled if:
    // 1. Location is currently loading
    // 2. User cannot clock AND is not on Leave
    //    (Being on Leave acts as an override to allow clocking even if canClock is false)
    const isButtonDisabled = isLoadingLocation || (!canClock && !isOnLeave);

    return (
        <div className={`rounded-xl p-3 mm:p-4 shadow-lg text-white min-h-[140px] flex flex-col justify-between transition-all duration-300 ${isAbsent ? 'bg-[#48327d]' : 'bg-[#48327d]'}`}>
            <div className="flex justify-between items-center mb-4 opacity-90">
                <span className="text-xs mm:text-sm font-medium">Time Today - {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                {disabledReason && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isAbsent ? 'bg-white/20 text-white border-white/30' : 'bg-white/20 backdrop-blur-sm text-white border-white/30'}`}>
                        {disabledReason.toUpperCase()}
                    </span>
                )}
            </div>

            <div className="flex justify-between items-end gap-1 mm:gap-2">
                <div>
                    <div className="text-[10px] font-bold tracking-widest mb-1 opacity-80 uppercase">
                        {isOnLeave ? 'LEAVE STATUS' : (isAbsent && !isClockedIn) ? 'ATTENDANCE PENDING' : 'CURRENT TIME'}
                    </div>
                    {isOnLeave ? (
                        <div className="text-2xl mm:text-3xl font-bold tracking-tight">
                            On Approved Leave
                        </div>
                    ) : (
                        <div className="flex items-baseline font-light whitespace-nowrap">
                            <span className="text-2xl ms:text-3xl mm:text-4xl ml:text-5xl">
                                {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                            </span>
                            <span className="text-sm mm:text-base ml:text-xl mx-0.5 opacity-80">:{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                            <span className="text-base mm:text-lg ml:text-2xl ml-1 font-normal">{currentTime.getHours() >= 12 ? 'PM' : 'AM'}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        className={`bg-white text-[#48327d] px-3 mm:px-4 py-2 rounded-md font-semibold text-xs mm:text-sm transition-all shadow-sm ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90 active:scale-95'}`}
                        onClick={handleClockAction}
                        disabled={isButtonDisabled}
                    >
                        {isLoadingLocation || (isClockedIn === null && !isOnLeave) ? (
                            <LoadingSpinner size={16} color="border-[#48327d]" />
                        ) : (
                            <span className="whitespace-nowrap">
                                {window.innerWidth < 350 ? (isClockedIn ? 'Out' : 'In') : (isClockedIn ? 'Check-Out' : 'Check-In')}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {locationState && (
                <div className="text-[10px] mt-2 opacity-80 font-medium flex items-center gap-1">
                    <MapPin size={10} strokeWidth={2.5} />
                    <span>{locationState}</span>
                </div>
            )}
        </div>
    );
};

export default ClockCard;
