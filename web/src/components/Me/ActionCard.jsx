import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Home, MapPin, Loader2 } from 'lucide-react';
import { attendanceApi } from '../../services/api';

const ActionCard = ({ currentTime, formatTime, formatDate, onClockAction, employeeId, displayId }) => {
    const [location, setLocation] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState(null);
    const [clockStatus, setClockStatus] = useState(null); // Start as null to show loading
    const [debugInfo, setDebugInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const EMPLOYEE_ID = employeeId;

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await attendanceApi.getStatus(EMPLOYEE_ID);
            setClockStatus(data.status);
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
            await attendanceApi.clock({
                employee_id: EMPLOYEE_ID,
                location: locationAddr || "Location Unavailable",
                type: nextType
            });
            setClockStatus(nextType);
            if (onClockAction) onClockAction();
        } catch (apiErr) {
            setError("Failed to clock action");
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

        if (!navigator.geolocation) {
            performClockAction("Geolocation Not Supported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                let displayAddr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        displayAddr = data.display_name.split(',').slice(0, 3).join(',') || displayAddr;
                    }
                } catch (e) {
                    console.warn(e);
                }
                performClockAction(displayAddr);
            },
            (err) => {
                console.error("Geo Error:", err);
                // Fallback to clock in anyway!
                performClockAction("Location Permission Denied");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 border border-[#e2e8f0]">
            <h3 className="text-sm font-medium text-[#636e72] mb-3">Actions</h3>

            <div className="flex flex-col items-center justify-center mb-4">
                <div className="text-3xl font-bold text-[#2d3436] tabular-nums mb-1">
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

            <div className="flex items-center justify-center gap-4 border-t border-gray-100 pt-3">
                {clockStatus === null ? (
                    <div className="h-10 flex items-center justify-center px-4 bg-gray-50 rounded-lg border border-gray-100 min-w-[130px]">
                        <Loader2 size={16} className="animate-spin text-[#48327d]" />
                    </div>
                ) : (
                    <button
                        onClick={handleClockAction}
                        disabled={isLocating || loading}
                        className="flex flex-col items-center gap-2 text-[#48327d] hover:bg-purple-50 p-2 rounded-xl transition-all disabled:opacity-50 min-w-[100px]"
                    >
                        {clockStatus === 'IN' ? (
                            <LogOut size={20} className="shrink-0" />
                        ) : (
                            <LogIn size={20} className="shrink-0" />
                        )}
                        <span className="text-xs font-semibold">
                            {clockStatus === 'IN' ? 'Web Clock-Out' : 'Web Clock-In'}
                        </span>
                        {loading && <Loader2 size={10} className="animate-spin absolute top-2 right-2" />}
                    </button>
                )}

                <button className="flex flex-col items-center gap-2 text-[#48327d] hover:bg-purple-50 p-2 rounded-xl transition-all min-w-[100px]">
                    <Home size={20} className="shrink-0" />
                    <span className="text-xs font-semibold">Work From Home</span>
                </button>
            </div>
        </div>
    );
};

export default ActionCard;
