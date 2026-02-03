import { useState, useEffect } from 'react';
import ClockCard from './Dashboard/ClockCard';
import HolidayCard from './Dashboard/HolidayCard';
import LeaveBalanceCard from './Dashboard/LeaveBalanceCard';
import AvgHoursCard from './Dashboard/AvgHoursCard';
import HolidayModal from './Dashboard/HolidayModal';
import FeedSection from './Dashboard/FeedSection';
import EmployeeStatsCard from './Dashboard/EmployeeStatsCard';
import AbsenteesModal from './Dashboard/AbsenteesModal';
import { attendanceApi, adminApi } from '../services/api';

function Dashboard({ user }) {
    const [isClockedIn, setIsClockedIn] = useState(null); // Null for loading state
    const [canClock, setCanClock] = useState(true);
    const [disabledReason, setDisabledReason] = useState(null);
    const [personalStats, setPersonalStats] = useState(null);
    const [locationState, setLocationState] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [holidayIndex, setHolidayIndex] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [showAbsentees, setShowAbsentees] = useState(false);
    const [timeOffset, setTimeOffset] = useState(0);

    const holidays = [
        { name: 'BHOGI', date: 'Wed, 14 January, 2026', type: 'Floater Leave' },
        { name: 'PONGAL', date: 'Thu, 15 January, 2026', type: 'Public Holiday' }
    ];

    // Use dynamic user ID
    const EMPLOYEE_ID = user?.id;

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date(Date.now() + timeOffset));
        }, 1000);
        return () => clearInterval(timer);
    }, [timeOffset]);

    // Initial Status and Stats Fetch
    const fetchData = async () => {
        try {
            const statusData = await attendanceApi.getStatus(EMPLOYEE_ID);
            setIsClockedIn(statusData.status === 'IN');
            setCanClock(statusData.can_clock !== false); // Default true if undefined
            setDisabledReason(statusData.disabled_reason);

            // Sync time with server
            if (statusData.server_time) {
                const serverTime = new Date(statusData.server_time).getTime();
                const deviceTime = Date.now();
                setTimeOffset(serverTime - deviceTime);
                setCurrentTime(new Date(serverTime));
            }

            const statsData = await attendanceApi.getPersonalStats(EMPLOYEE_ID);
            setPersonalStats(statsData);

            // Fetch admin dashboard stats
            const adminStats = await adminApi.getDashboardStats();
            setDashboardStats(adminStats);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setIsClockedIn(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Poll every 30 seconds for cross-platform sync
        const statusTimer = setInterval(fetchData, 30000);
        return () => clearInterval(statusTimer);
    }, [EMPLOYEE_ID]);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handleClockAction = () => {
        setIsLoadingLocation(true);
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            setIsLoadingLocation(false);
            return;
        }

        const processSuccess = async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                let finalLocation = coordsStr;

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                    if (response.ok) {
                        const data = await response.json();
                        const addr = data.address;
                        const parts = [
                            addr.office || addr.amenity || addr.building || addr.shop || addr.industrial,
                            addr.neighbourhood || addr.suburb || addr.road,
                            addr.city || addr.town || addr.village
                        ].filter(Boolean);

                        const name = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(', ');
                        finalLocation = `${name} (${coordsStr})`;
                    }
                } catch (e) {
                    console.error("Error fetching location name:", e);
                }

                // Call Backend API
                try {
                    const nextType = isClockedIn ? 'OUT' : 'IN';
                    await attendanceApi.clock({
                        employee_id: EMPLOYEE_ID,
                        location: finalLocation,
                        type: nextType
                    });

                    // Update Local State ONLY after success
                    setIsClockedIn(nextType === 'IN');
                    setLocationState(finalLocation);

                } catch (apiError) {
                    console.error("API Error:", apiError);
                    const msg = apiError.response?.data?.error || "Failed to update clock status. Please try again.";
                    alert(msg);
                }

                // Clear location after 5 seconds
                setTimeout(() => setLocationState(null), 5000);
            } catch (error) {
                console.error("Error fetching location name:", error);

                // Even if location name fails, try to clock with coords
                try {
                    const fallbackLoc = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
                    const nextType = isClockedIn ? 'OUT' : 'IN';
                    await attendanceApi.clock({
                        employee_id: EMPLOYEE_ID,
                        location: fallbackLoc,
                        type: nextType
                    });
                    setIsClockedIn(nextType === 'IN');
                    setLocationState(fallbackLoc);
                } catch (e) {
                    const msg = e.response?.data?.error || "Failed to clock action.";
                    alert(msg);
                }
                setTimeout(() => setLocationState(null), 5000);
            } finally {
                setIsLoadingLocation(false);
            }
        };

        const processError = (error, isRetry = false) => {
            console.error(`Geolocation error (${isRetry ? 'Fallback' : 'Primary'}):`, error);

            if (!isRetry && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
                navigator.geolocation.getCurrentPosition(
                    processSuccess,
                    (err) => processError(err, true),
                    { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
                );
                return;
            }

            let message = "Please enable location access to clock in.";
            if (error.code === error.PERMISSION_DENIED) {
                message = "Location access was denied. Please enable it in your browser settings to clock in.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = "Location information is unavailable. Please check your device settings.";
            } else if (error.code === error.TIMEOUT) {
                message = "Location request timed out. Please try refreshing or checking your signal.";
            }
            alert(message);
            setIsLoadingLocation(false);
        };

        navigator.geolocation.getCurrentPosition(
            processSuccess,
            (err) => processError(err, false),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 lg:p-8 bg-[#f5f7fa]">
            {/* Welcome Section */}
            <div className="mb-4 mm:mb-6 ml:mb-8 lg:mb-10 text-left">
                <h1 className="text-xl mm:text-2xl ml:text-3xl font-black text-[#1e293b] tracking-tight">
                    {getGreeting()}, {user?.first_name || 'Markwave'} {user?.last_name || ''}!
                </h1>
                <p className="text-[11px] mm:text-[12px] ml:text-sm text-[#64748b] font-medium mt-1 italic">
                    You're doing great today. Here's a quick look at your workspace.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mm:gap-6 ml:gap-8 lg:gap-10 max-w-[1400px] mx-auto">
                {/* Left Column - Essential Metrics */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <ClockCard
                        currentTime={currentTime}
                        isClockedIn={isClockedIn}
                        isLoadingLocation={isLoadingLocation}
                        locationState={locationState}
                        handleClockAction={handleClockAction}
                        canClock={canClock}
                        disabledReason={disabledReason}
                    />

                    <EmployeeStatsCard
                        stats={dashboardStats}
                        onShowAbsentees={() => setShowAbsentees(true)}
                    />

                    <AvgHoursCard stats={personalStats} />

                    <LeaveBalanceCard user={user} />

                    <HolidayCard
                        holidays={holidays}
                        holidayIndex={holidayIndex}
                        setHolidayIndex={setHolidayIndex}
                        setShowCalendar={setShowCalendar}
                    />
                </div>

                {/* Right Column - Social Feed */}
                <div className="lg:col-span-7">
                    <FeedSection user={user} />
                </div>
            </div>

            {showCalendar && <HolidayModal setShowCalendar={setShowCalendar} />}
            {showAbsentees && (
                <AbsenteesModal
                    absentees={dashboardStats?.absentees}
                    onClose={() => setShowAbsentees(false)}
                />
            )}
        </div>
    );
}

export default Dashboard;
