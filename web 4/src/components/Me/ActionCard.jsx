import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Home, Briefcase, FileText, Shield, MapPin, Loader2 } from 'lucide-react';
import { attendanceApi } from '../../services/api';

const ActionCard = ({ currentTime, formatTime, formatDate, onClockAction, employeeId }) => {
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
            <h3 className="text-sm font-medium text-[#636e72] mb-4">Actions</h3>
            <div className="flex gap-4">
                <div className="text-center border-r border-[#e2e8f0] pr-4 flex flex-col justify-center min-w-[120px]">
                    <div className="text-2xl font-bold text-[#2d3436] tabular-nums mb-1">
                        {formatTime(currentTime)}
                    </div>
                    <div className="text-xs text-[#8e78b0] font-medium mb-2">
                        {formatDate(currentTime)}
                    </div>
                    {/* Debug Info: Remove before production */}
                    <div className="text-[9px] text-gray-400 mb-1 leading-tight">
                        ID: {EMPLOYEE_ID} | St: {clockStatus} <br />
                        LastLog: {debugInfo ? `${debugInfo.last_log_type} (${debugInfo.last_log_id})` : 'Loading...'}
                    </div>
                    {isLocating && (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-[#48327d] font-bold animate-pulse">
                            <Loader2 size={10} className="animate-spin" /> Locating...
                        </div>
                    )}
                    {location && (
                        <div className="text-[10px] text-[#22c55e] font-bold flex items-start gap-1 justify-center mt-1 max-w-[110px] mx-auto leading-tight">
                            <MapPin size={10} className="shrink-0 mt-0.5" />
                            <span className="text-center">{location}</span>
                        </div>
                    )}
                    {error && (
                        <div className="text-[10px] text-[#ef4444] font-medium mt-1">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-2">
                    {clockStatus === null ? (
                        <div className="h-10 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                            <Loader2 size={16} className="animate-spin text-[#48327d]" />
                        </div>
                    ) : (
                        <button
                            onClick={handleClockAction}
                            disabled={isLocating || loading}
                            className="flex items-center gap-2 text-xs text-[#48327d] hover:underline font-medium w-full text-left disabled:opacity-50"
                        >
                            {clockStatus === 'IN' ? (
                                <>
                                    <LogOut size={14} className="shrink-0" /> Web Clock-Out
                                </>
                            ) : (
                                <>
                                    <LogIn size={14} className="shrink-0" /> Web Clock-In
                                </>
                            )}
                            {loading && <Loader2 size={10} className="animate-spin ml-2" />}
                        </button>
                    )}
                    <button className="flex items-center gap-2 text-xs text-[#48327d] hover:underline font-medium w-full text-left">
                        <Home size={14} className="shrink-0" /> Work From Home
                    </button>
                    <button className="flex items-center gap-2 text-xs text-[#48327d] hover:underline font-medium w-full text-left">
                        <Briefcase size={14} className="shrink-0" /> On Duty
                    </button>
                    <button className="flex items-center gap-2 text-xs text-[#48327d] hover:underline font-medium w-full text-left">
                        <FileText size={14} className="shrink-0" /> Partial Day Request
                    </button>
                    <button className="flex items-center gap-2 text-xs text-[#48327d] hover:underline font-medium w-full text-left">
                        <Shield size={14} className="shrink-0" /> Attendance Policy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionCard;
