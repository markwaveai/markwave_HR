import { useState, useEffect } from 'react';
import ClockCard from './Dashboard/ClockCard';
import HolidayCard from './Dashboard/HolidayCard';
import LeaveBalanceCard from './Dashboard/LeaveBalanceCard';
import AvgHoursCard from './Dashboard/AvgHoursCard';
import HolidayModal from './Dashboard/HolidayModal';
import FeedSection from './Dashboard/FeedSection';
import { attendanceApi } from '../services/api';

function Dashboard({ user }) {
    const [isClockedIn, setIsClockedIn] = useState(null); // Null for loading state
    const [personalStats, setPersonalStats] = useState(null);
    const [locationState, setLocationState] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [holidayIndex, setHolidayIndex] = useState(0);
    const [showCalendar, setShowCalendar] = useState(false);

    const holidays = [
        { name: 'BHOGI', date: 'Wed, 14 January, 2026', type: 'Floater Leave' },
        { name: 'PONGAL', date: 'Thu, 15 January, 2026', type: 'Public Holiday' }
    ];

    // Use dynamic user ID
    const EMPLOYEE_ID = user?.id;

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Initial Status and Stats Fetch
    const fetchData = async () => {
        try {
            const statusData = await attendanceApi.getStatus(EMPLOYEE_ID);
            setIsClockedIn(statusData.status === 'IN');

            const statsData = await attendanceApi.getPersonalStats(EMPLOYEE_ID);
            setPersonalStats(statsData);
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
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                const data = await response.json();

                const addr = data.address;
                const buildingTags = [
                    addr.building, addr.commercial, addr.office, addr.amenity,
                    addr.house_name, addr.office, addr.landmark, addr.tourism,
                    addr.shop, addr.retail, addr.university, addr.hospital,
                    addr.hotel, addr.industrial, addr.theatre, addr.place_of_worship
                ];

                let buildingName = buildingTags.find(Boolean) || '';
                if (!buildingName && data.display_name) {
                    const primaryName = data.display_name.split(',')[0].trim();
                    const road = addr.road || addr.pedestrian || '';
                    if (primaryName && road && !road.includes(primaryName) && !primaryName.includes(road)) {
                        buildingName = primaryName;
                    }
                }

                const mainLocation = addr.house_number || '';
                const roadDetail = addr.road || addr.pedestrian || '';
                const areaDetail = addr.neighbourhood || addr.suburb || addr.city_district || '';
                const cityDetail = addr.city || addr.town || addr.village || '';

                const displayAddr = [
                    buildingName,
                    [mainLocation, roadDetail].filter(Boolean).join(' '),
                    areaDetail,
                    cityDetail
                ].filter(Boolean).join(', ');

                const finalLocation = displayAddr || data.display_name.split(',').slice(0, 3).join(',') || "Location Found";

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
                    alert("Failed to update clock status. Please try again.");
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
                    alert("Failed to clock action.");
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
        <main className="flex-1 p-6 overflow-y-auto bg-[#f5f7fa]">
            {/* Welcome Section */}
            <div className="mb-8 text-center lg:text-left">
                <h1 className="text-3xl font-black text-[#1e293b] tracking-tight">
                    {getGreeting()}, {user?.first_name || 'Markwave'} {user?.last_name || ''}!
                </h1>
                <p className="text-sm text-[#64748b] font-medium mt-1 italic">
                    You're doing great today. Here's a quick look at your workspace.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto">
                {/* Left Column - Essential Metrics */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <ClockCard
                        currentTime={currentTime}
                        isClockedIn={isClockedIn}
                        isLoadingLocation={isLoadingLocation}
                        locationState={locationState}
                        handleClockAction={handleClockAction}
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
        </main>
    );
}

export default Dashboard;
