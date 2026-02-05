import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Home, MapPin, Loader2 } from 'lucide-react';
import { attendanceApi } from '../../services/api';

const ActionCard = ({ currentTime, formatTime, formatDate, onClockAction, employeeId, displayId }) => {
    const [location, setLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState(null);
    const [clockStatus, setClockStatus] = useState(null); // Start as null to show loading
    const [debugInfo, setDebugInfo] = useState(null);
    const [canClock, setCanClock] = useState(true);
    const [disabledReason, setDisabledReason] = useState(null);
    const [loading, setLoading] = useState(false);

    const EMPLOYEE_ID = employeeId;

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await attendanceApi.getStatus(EMPLOYEE_ID);
            setClockStatus(data.status);
            setCanClock(data.can_clock !== false);
            setDisabledReason(data.disabled_reason);
            setDebugInfo(data.debug);
        } catch (err) {
            console.error("Failed to fetch status:", err);
            setError(`Status Fetch Failed: ${err.message}`);
        }
    };

    const performClockAction = async (locationAddr) => {
        setLoading(true);
        try {
            const nextType = clockStatus === 'IN' ? 'OUT' : 'IN';
            const data = await attendanceApi.clock({
                employee_id: EMPLOYEE_ID,
                location: locationAddr || "Location Unavailable",
                type: nextType
            });
            setClockStatus(nextType);
            if (onClockAction) onClockAction(data);
        } catch (apiErr) {
            const msg = apiErr.response?.data?.error || "Failed to clock action";
            setError(msg);
            console.error(apiErr);
        } finally {
            setLoading(false);
            setIsLocating(false);
            setLocation(locationAddr);
            setTimeout(() => setLocation(null), 5000);
        }
    };

    const handleClockAction = () => {
        setIsLocating(true);
        setError(null);

        const fallback = (reason) => {
            performClockAction(`Location Unavailable: ${reason}`);
        };

        if (!navigator.geolocation) {
            fallback("Geolocation Not Supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                let displayAddr = coordsStr;
                try {
                    const data = await attendanceApi.resolveLocation(latitude, longitude);
                    if (data && data.address) {
                        displayAddr = `${data.address} (${coordsStr})`;
                    }
                } catch (e) {
                    console.warn("Reverse Geocoding Failed:", e);
                }
                performClockAction(displayAddr);
            },
            (err) => {
                console.error("Geo Error:", err);
                fallback("Permission Denied / Error");
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-2.5 mm:p-4 border border-[#e2e8f0] flex flex-col justify-between h-full">
            {/* ... (lines 90-120 unchanged) ... */}
            <h3 className="text-[10px] font-bold text-[#636e72] mb-3 uppercase tracking-wider">Actions</h3>

            <div className="flex flex-col items-center justify-center mb-4">
                <div className="text-lg mm:text-2xl font-bold text-[#2d3436] tabular-nums mb-1">
                    {formatTime(currentTime)}
                </div>
                <div className="text-xs text-[#8e78b0] font-medium mb-2">
                    {formatDate(currentTime)}
                </div>
                {/* Debug Info: Remove before production */}
                <div className="text-[9px] text-gray-400 mb-1 leading-tight text-center">
                    ID: {displayId || EMPLOYEE_ID} | St: {clockStatus}
                </div>
                {isLocating && (
                    <div className="flex items-center justify-center gap-1 text-[11px] text-[#48327d] font-bold animate-pulse">
                        <Loader2 size={12} className="animate-spin" /> Locating...
                    </div>
                )}
                {location && (
                    <div className="text-[11px] text-[#22c55e] font-bold flex items-start gap-1 justify-center mt-1 max-w-[200px] text-center leading-tight">
                        <MapPin size={12} className="shrink-0 mt-0.5" />
                        <span>{location}</span>
                    </div>
                )}
                {error && (
                    <div className="text-[11px] text-[#ef4444] font-medium mt-1">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-1 mm:gap-3 border-t border-gray-100 pt-3">
                {clockStatus === null ? (
                    <div className="h-10 flex items-center justify-center px-4 bg-gray-50 rounded-lg border border-gray-100 min-w-[100px]">
                        <Loader2 size={16} className="animate-spin text-[#48327d]" />
                    </div>
                ) : (
                    <button
                        onClick={handleClockAction}
                        disabled={!canClock || isLocating || loading}
                        className={`flex flex-col items-center gap-1 text-[#48327d] hover:bg-purple-50 p-1 rounded-xl transition-all min-w-[75px] mm:min-w-[90px] ${(!canClock || isLocating || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {clockStatus === 'IN' ? (
                            <LogOut size={16} className="shrink-0" />
                        ) : (
                            <LogIn size={16} className="shrink-0" />
                        )}
                        <span className="text-[9px] mm:text-[11px] font-black uppercase tracking-tight">
                            {clockStatus === 'IN' ? 'OUT' : 'IN'}
                            {disabledReason && <span className="ml-1 opacity-70">({disabledReason})</span>}
                        </span>
                        {loading && <Loader2 size={10} className="animate-spin absolute top-1 right-1" />}
                    </button>
                )}

                <button className="flex flex-col items-center gap-1 text-[#48327d] hover:bg-purple-50 p-1 rounded-xl transition-all min-w-[75px] mm:min-w-[90px]">
                    <Home size={16} className="shrink-0" />
                    <span className="text-[9px] mm:text-[11px] font-black uppercase tracking-tight text-center">WFH</span>
                </button>
            </div>
        </div>
    );
};

export default ActionCard;
