import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Modal, Alert, FlatList, Platform, PermissionsAndroid, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from 'react-native-geolocation-service';
import { attendanceApi, teamApi } from '../services/api';
import { ChevronDownIcon, MoreVerticalIcon, UserIcon, UsersIcon, CoffeeIcon, UmbrellaIcon, PartyPopperIcon, HomeIcon } from '../components/Icons';
import { normalize, wp, hp } from '../utils/responsive';
import RegularizeModal from '../components/RegularizeModal';

const { width } = Dimensions.get('window');

const COL_WIDTHS = {
    date: wp(32),
    visual: wp(40),
    inOut: wp(24),
    breaks: wp(19),
    hrs: wp(24),
    status: wp(27)
};

interface MeScreenProps {
    user: any;
}

const LiveDateTime: React.FC<{ user: any, clockStatus: any, debugInfo: any }> = ({ user, clockStatus, debugInfo }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <View style={styles.actionTimeSide}>
            <Text style={styles.actionClockText}>
                {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
            <Text style={styles.actionDateText}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <View style={styles.debugInfoBox}>
                <View style={styles.statusDotRow}>
                    <View style={[styles.statusDot, { backgroundColor: clockStatus === 'IN' ? '#10b981' : '#94a3b8' }]} />
                    <Text style={styles.debugInfoText}>{user.employee_id || user.id}</Text>
                </View>
                <Text style={styles.debugInfoSubText}>Last: {debugInfo?.last_punch ? debugInfo.last_punch.split(' ')[0] + ' ' + debugInfo.last_punch.split(' ')[1] : '--:--'}</Text>
            </View>
        </View>
    );
};

const ArrivalFilterDropdown: React.FC<{
    currentFilter: string;
    onSelect: (filter: string) => void;
}> = ({ currentFilter, onSelect }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={{ width: COL_WIDTHS.status, alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: wp(1),
                    backgroundColor: currentFilter !== 'All' ? '#f3e8ff' : 'transparent',
                    paddingVertical: hp(0.8),
                    paddingHorizontal: wp(2),
                    borderRadius: normalize(6),
                    borderWidth: 1,
                    borderColor: currentFilter !== 'All' ? '#48327d20' : 'rgba(0,0,0,0.05)'
                }}
            >
                <Text style={{
                    color: currentFilter !== 'All' ? '#48327d' : '#334155',
                    fontWeight: '900',
                    fontSize: normalize(9),
                    letterSpacing: 0.5
                }}>
                    {currentFilter === 'All' ? 'ARRIVAL' : currentFilter.toUpperCase()}
                </Text>
                <ChevronDownIcon size={normalize(10)} color={currentFilter !== 'All' ? '#48327d' : '#334155'} />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={{
                        width: wp(53),
                        backgroundColor: 'white',
                        borderRadius: normalize(16),
                        padding: wp(3),
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.2,
                        shadowRadius: 20,
                        elevation: 15,
                        borderWidth: 1,
                        borderColor: '#f1f5f9'
                    }}>
                        <Text style={{ fontSize: normalize(11), fontWeight: '900', color: '#94a3b8', textAlign: 'center', marginBottom: hp(1.5), marginTop: hp(0.5), textTransform: 'uppercase', letterSpacing: 1 }}>Filter by Arrival</Text>
                        {['All', 'Early', 'On Time', 'Late'].map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                onPress={() => {
                                    onSelect(opt);
                                    setVisible(false);
                                }}
                                style={{
                                    paddingVertical: hp(1.8),
                                    paddingHorizontal: wp(4),
                                    borderRadius: normalize(10),
                                    backgroundColor: currentFilter === opt ? '#f3e8ff' : 'transparent',
                                    marginBottom: hp(0.5),
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                <Text style={{
                                    fontSize: normalize(14),
                                    fontWeight: currentFilter === opt ? '800' : '600',
                                    color: currentFilter === opt ? '#48327d' : '#475569'
                                }}>
                                    {opt === 'All' ? 'All Records' : opt}
                                </Text>
                                {currentFilter === opt && <View style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: '#48327d' }} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const MeScreen: React.FC<MeScreenProps & { setActiveTabToSettings: (u: any) => void }> = ({ user, setActiveTabToSettings }) => {
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [teamStats, setTeamStats] = useState<any>(null);
    const [clockStatus, setClockStatus] = useState<any>(null);
    const [canClock, setCanClock] = useState(true);
    const [disabledReason, setDisabledReason] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [filterType, setFilterType] = useState('Month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [activeBreakLog, setActiveBreakLog] = useState<any>(null);
    const [clockLoading, setClockLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'Log' | 'Requests'>('Log');
    const [requests, setRequests] = useState<any[]>([]);
    const [statsDuration, setStatsDuration] = useState('This Week');
    const [showDurationDropdown, setShowDurationDropdown] = useState(false);
    const [regularizeModalVisible, setRegularizeModalVisible] = useState(false);
    const [activeRegularizeLog, setActiveRegularizeLog] = useState<any>(null);
    const [activeMenuLogDate, setActiveMenuLogDate] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [requestType, setRequestType] = useState<'employee' | 'manager'>(user?.is_manager ? 'manager' : 'employee');

    const [arrivalFilter, setArrivalFilter] = useState('All'); // 'All', 'On Time', 'Late'
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const tableScrollRef = useRef<ScrollView>(null);
    const scrollPositionRef = useRef(0);

    const DAYS_ABBR = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const toLocalDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id, statsDuration]);

    useEffect(() => {
        if (user?.id && activeTab === 'Requests') {
            fetchRequests();
        }
    }, [user, requestType, activeTab]);

    const fetchData = async () => {
        try {
            if (!refreshing) setLoading(true);
            const [history, status, stats] = await Promise.all([
                attendanceApi.getHistory(user.employee_id || user.id),
                attendanceApi.getStatus(user.employee_id || user.id),
                teamApi.getStats(user.team_ids || user.team_id, statsDuration)
            ]);
            setLogs(history);
            setClockStatus(status.status);
            setCanClock(status.can_clock !== undefined ? status.can_clock : true);
            setDisabledReason(status.disabled_reason);
            setDebugInfo(status); // Store entire status object to access last_punch
            setTeamStats(stats);

            // Set today as selected day in timing card
            if (initialLoad) {
                const todayStr = toLocalDateString(new Date());
                const day = new Date().getDay();
                const diff = (day === 0 ? 6 : day - 1); // 0-indexed Mon-Sun
                setSelectedDayIndex(diff);
            }

        } catch (error) {
            console.log("Error fetching data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setInitialLoad(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [user?.id, statsDuration]);

    const fetchRequests = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await attendanceApi.getRequests(user.employee_id || user.id, requestType);
            setRequests(data || []);
        } catch (error) {
            console.log("Error fetching requests:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'This app needs access to your location for clock-in/out.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true; // iOS handles permissions differently
    };

    const handleClockAction = async () => {
        setClockLoading(true);
        const nextType = clockStatus === 'IN' ? 'OUT' : 'IN';

        try {
            // Request location permission
            const hasPermission = await requestLocationPermission();

            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Location permission is required for attendance.');
                setClockLoading(false);
                return;
            }

            // Get current position for both IN and OUT
            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const coordsStr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    let finalLocation = coordsStr;

                    try {
                        // Attempt to resolve address (reverse geocode)
                        const geoData = await attendanceApi.resolveLocation(latitude, longitude);
                        if (geoData && geoData.address) {
                            finalLocation = `${geoData.address} (${coordsStr})`;
                        }
                    } catch (e) {
                        console.log("Could not resolve location address, using coordinates:", e);
                        // Fallback to coordinates only, already set
                    }

                    try {
                        await attendanceApi.clock({
                            employee_id: user.employee_id || user.id,
                            location: finalLocation,
                            type: nextType
                        });
                        await fetchData();
                    } catch (err: any) {
                        console.log("Clock action failed:", err);
                        Alert.alert('Error', err.message || 'Failed to update attendance');
                    } finally {
                        setClockLoading(false);
                    }
                },
                (error) => {
                    console.log('Location error:', error);
                    // Fallback if GPS fails
                    const fallbackLocation = `Location unavailable (Error: ${error.message})`;

                    attendanceApi.clock({
                        employee_id: user.employee_id || user.id,
                        location: fallbackLocation,
                        type: nextType
                    }).then(() => {
                        fetchData();
                    }).catch((err) => {
                        console.log("Clock action failed:", err);
                        Alert.alert('Error', 'Failed to update attendance');
                    }).finally(() => {
                        setClockLoading(false);
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000
                }
            );
        } catch (err) {
            console.log("Clock action failed:", err);
            Alert.alert('Error', 'Failed to update attendance');
            setClockLoading(false);
        }
    };

    const getLeaveCode = (leaveType: string) => {
        const map: Record<string, string> = {
            'Sick Leave': 'SL', 'Casual Leave': 'CL', 'Earned Leave': 'EL',
            'Privilege Leave': 'PL', 'Loss of Pay': 'LOP',
            'sl': 'SL', 'cl': 'CL', 'el': 'EL'
        };
        const isFirst = leaveType?.startsWith('First Half ');
        const isSecond = leaveType?.startsWith('Second Half ');
        const isHalf = leaveType?.startsWith('Half Day ');

        const type = isFirst ? leaveType.replace('First Half ', '') :
            isSecond ? leaveType.replace('Second Half ', '') :
                isHalf ? leaveType.replace('Half Day ', '') : leaveType || '';

        const code = map[type] || map[type.toLowerCase()] || type.substring(0, 2).toUpperCase();

        if (isFirst) return `FH-${code}`;
        if (isSecond) return `SH-${code}`;
        return isHalf ? `HD-${code}` : code;
    };

    const getLeaveLabel = (leaveType: string) => {
        const map: Record<string, string> = {
            'SL': 'Sick Leave', 'CL': 'Casual Leave', 'EL': 'Earned Leave',
            'PL': 'Privilege Leave', 'LOP': 'Loss of Pay',
            'sl': 'Sick Leave', 'cl': 'Casual Leave', 'el': 'Earned Leave'
        };
        if (leaveType?.startsWith('First Half ')) {
            const type = leaveType.replace('First Half ', '');
            return `First Half ${map[type] || map[type.toLowerCase()] || type}`;
        }
        if (leaveType?.startsWith('Second Half ')) {
            const type = leaveType.replace('Second Half ', '');
            return `Second Half ${map[type] || map[type.toLowerCase()] || type}`;
        }
        if (leaveType?.startsWith('Half Day ')) {
            const type = leaveType.replace('Half Day ', '');
            return `Half Day ${map[type] || map[type.toLowerCase()] || type}`;
        }
        return map[leaveType] || map[leaveType?.toLowerCase()] || leaveType || 'Leave';
    };

    const parseTime = (timeStr: string) => {
        if (!timeStr || timeStr === '-' || !timeStr.includes(' ')) return null;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        let h = parseInt(hours, 10);
        if (h === 12) h = 0;
        if (modifier === 'PM') h += 12;
        return { h, m: parseInt(minutes, 10) };
    };

    const parseTimeToMinutes = (timeStr: string) => {
        const t = parseTime(timeStr);
        return t ? t.h * 60 + t.m : 0;
    };

    const getVisualSegments = (log: any) => {
        if (!log || log.checkIn === '-' || !log.checkIn) return [];
        if (!log.logs || log.logs.length === 0) {
            const s = calculateStats(log);
            return [{ type: 'work', width: s.effectiveProgress }];
        }
        const startMins = parseTimeToMinutes(log.logs[0].in);
        let endMins = 0;
        const lastLog = log.logs[log.logs.length - 1];
        if (lastLog.out && lastLog.out !== '-') {
            endMins = parseTimeToMinutes(lastLog.out);
        } else {
            const now = new Date();
            endMins = now.getHours() * 60 + now.getMinutes();
            if (endMins <= startMins) endMins = startMins + 1;
        }
        let totalSpan = endMins - startMins;
        if (totalSpan <= 0) totalSpan = 1;
        const segments: { type: 'work' | 'break', width: number }[] = [];
        log.logs.forEach((session: any, idx: number) => {
            const sIn = parseTimeToMinutes(session.in);
            const sOut = (session.out && session.out !== '-') ? parseTimeToMinutes(session.out) : endMins;
            if (idx > 0) {
                const prevOut = parseTimeToMinutes(log.logs[idx - 1].out);
                const gap = sIn - prevOut;
                if (gap > 0) segments.push({ type: 'break', width: (gap / totalSpan) * 100 });
            }
            const duration = sOut - sIn;
            if (duration > 0) segments.push({ type: 'work', width: (duration / totalSpan) * 100 });
        });
        return segments;
    };

    const calculateStats = (log: any) => {
        const isWeekend = [0, 6].includes(new Date(log.date).getDay());
        const isHoliday = log.isHoliday || log.status === 'Holiday';
        const isLeave = !!log.leaveType;

        const defaultRange = isHoliday ? 'Holiday' : isWeekend ? 'Week Off' : isLeave ? 'On Leave' : '09:30 AM - 06:30 PM';

        if (!log || log.checkIn === '-' || !log.checkIn) {
            return {
                gross: '-',
                effective: '-',
                status: log?.status || 'Not Marked',
                effectiveProgress: 0,
                arrivalStatus: '-',
                arrivalColor: '#94a3b8',
                totalBreakMins: 0,
                range: defaultRange
            };
        }
        const sIn = parseTimeToMinutes(log.logs?.[0]?.in || log.checkIn);
        let sOut = 0;
        const lastLog = log.logs?.[log.logs.length - 1];
        if (lastLog?.out && lastLog.out !== '-') sOut = parseTimeToMinutes(lastLog.out);
        else if (log.checkOut && log.checkOut !== '-') sOut = parseTimeToMinutes(log.checkOut);
        else if (log.date === toLocalDateString(new Date())) {
            const now = new Date();
            sOut = now.getHours() * 60 + now.getMinutes();
        }
        let grossMins = sOut > 0 ? sOut - sIn : 0;
        let totalBreakMins = 0;
        if (log.logs && log.logs.length >= 1) {
            for (let i = 1; i < log.logs.length; i++) {
                const prevOut = parseTimeToMinutes(log.logs[i - 1].out);
                const currIn = parseTimeToMinutes(log.logs[i].in);
                if (currIn > prevOut) totalBreakMins += (currIn - prevOut);
            }
        } else totalBreakMins = log.breakMinutes || 0;
        const effectiveMins = Math.max(0, grossMins - totalBreakMins);
        const formatDuration = (totalMins: number) => {
            if (totalMins < 0) return '0h 00m';
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            return `${h}h ${String(m).padStart(2, '0')}m`;
        };
        let arrivalStatus = 'On Time';
        let arrivalColor = '#10b981';
        const checkInT = parseTime(log.checkIn);
        if (checkInT) {
            const inMins = checkInT.h * 60 + checkInT.m;
            const shiftStartMins = 9 * 60 + 30; // 09:30 AM
            if (inMins > shiftStartMins) {
                arrivalStatus = 'Late';
                arrivalColor = '#ef4444';
            } else if (inMins < shiftStartMins - 15) {
                arrivalStatus = 'Early';
                arrivalColor = '#f59e0b';
            }
        }

        const range = `${log.checkIn} - ${log.checkOut && log.checkOut !== '-' ? log.checkOut : '--'}`;

        return {
            gross: formatDuration(grossMins),
            effective: formatDuration(effectiveMins),
            status: log.status,
            effectiveProgress: Math.min(100, (effectiveMins / (9 * 60)) * 100),
            arrivalStatus,
            arrivalColor,
            totalBreakMins,
            range
        };
    };

    const meStats = useMemo(() => {
        if (!logs.length) return { avg: '0h 00m', onTime: '0%' };
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let startDate = new Date(now);
        if (statsDuration === 'Today') startDate = new Date(now);
        else if (statsDuration === 'This Month') startDate.setDate(1);
        else { const day = now.getDay(); const diff = now.getDate() - (day === 0 ? 6 : day - 1); startDate.setDate(diff); }
        let totalMins = 0; let presentDays = 0; let onTimeDays = 0;
        logs.forEach(log => {
            const logDate = new Date(log.date); const logDateOnly = new Date(logDate); logDateOnly.setHours(0, 0, 0, 0);
            let include = false;
            if (statsDuration === 'Today') include = logDateOnly.getTime() === now.getTime();
            else if (statsDuration === 'This Month') include = logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear() && logDate <= now;
            else include = logDateOnly >= startDate && logDateOnly <= now;
            if (include && log.checkIn && log.checkIn !== '-') {
                const stats = calculateStats(log);
                if (stats.effective !== '-') {
                    const match = stats.effective.match(/(\d+)h\s+(\d+)m/);
                    if (match) { presentDays++; totalMins += parseInt(match[1]) * 60 + parseInt(match[2]); if (stats.arrivalStatus === 'On Time') onTimeDays++; }
                }
            }
        });
        if (presentDays === 0) return { avg: '0h 00m', onTime: '0%' };
        const avgMins = Math.floor(totalMins / presentDays);
        return { avg: `${Math.floor(avgMins / 60)}h ${String(avgMins % 60).padStart(2, '0')}m`, onTime: `${Math.round((onTimeDays / presentDays) * 100)}%` };
    }, [logs, statsDuration]);

    const displayedLogs = useMemo(() => {
        let dates: string[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (filterType === '30Days') {
            for (let i = 0; i < 30; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                dates.push(toLocalDateString(d));
            }
        } else {
            const currentYear = today.getFullYear();
            const lastDay = new Date(currentYear, selectedMonth + 1, 0).getDate();
            const limit = (selectedMonth === today.getMonth()) ? today.getDate() : lastDay;
            for (let i = 1; i <= limit; i++) {
                const dayDate = new Date(currentYear, selectedMonth, i);
                dates.push(toLocalDateString(dayDate));
            }
            dates.reverse();
        }
        return dates.map(dateStr => {
            const existingLog = logs.find(l => l.date === dateStr);
            if (existingLog) return { ...existingLog };
            const [y, m, d] = dateStr.split('-').map(Number);
            const dObj = new Date(y, m - 1, d);
            return { date: dateStr, checkIn: '-', checkOut: '-', breakMinutes: 0, status: 'Not Marked', isWeekend: dObj.getDay() === 0 || dObj.getDay() === 6, isHoliday: false, logs: [] };
        });
    }, [logs, filterType, selectedMonth]);

    const weekLogs = useMemo(() => {
        const today = new Date();
        const monday = new Date(today);
        const day = today.getDay();
        monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
        monday.setHours(0, 0, 0, 0);
        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday); d.setDate(monday.getDate() + i);
            const dateStr = toLocalDateString(d);
            week.push(logs.find(l => l.date === dateStr) || { date: dateStr, status: 'Not Marked' });
        }
        return week;
    }, [logs]);

    const activeDayLog = weekLogs[selectedDayIndex];
    const activeTiming = calculateStats(activeDayLog);
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    const renderBreakModal = () => {
        if (!activeBreakLog) return null;
        const breaks: any[] = [];
        if (activeBreakLog.logs && activeBreakLog.logs.length > 1) {
            for (let i = 1; i < activeBreakLog.logs.length; i++) {
                const start = activeBreakLog.logs[i - 1].out;
                const end = activeBreakLog.logs[i].in;
                breaks.push({ start, end, duration: parseTimeToMinutes(end) - parseTimeToMinutes(start) });
            }
        }
        return (
            <Modal transparent visible={!!activeBreakLog} animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveBreakLog(null)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Break Timings</Text>
                            <TouchableOpacity onPress={() => setActiveBreakLog(null)}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            {breaks.length > 0 ? (breaks.map((b, i) => (
                                <View key={i} style={styles.modalRow}>
                                    <Text style={styles.modalRowLabel}>Break {i + 1}</Text>
                                    <View style={styles.modalRowInfo}>
                                        <Text style={styles.modalRowTime}>{b.start} - {b.end}</Text>
                                        <Text style={styles.modalRowDuration}>({b.duration}m)</Text>
                                    </View>
                                </View>
                            ))) : <Text style={styles.noBreakText}>No detailed break logs available.</Text>}
                            <View style={styles.modalFooter}>
                                <Text style={styles.modalTotalLabel}>TOTAL</Text>
                                <Text style={styles.modalTotalValue}>{calculateStats(activeBreakLog).totalBreakMins}m</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    const renderHeader = () => (
        <>
            <View style={styles.welcomeSection}>
                <View>
                    <Text style={styles.greetingTitle}>Attendance Stats</Text>
                    <Text style={styles.greetingSubtitle}>Detailed tracking and productivity logs</Text>
                </View>
            </View>

            <View style={[styles.card, { marginBottom: hp(2), zIndex: 10 }]}>
                <View style={styles.cardHeaderFlex}>
                    <View style={{ position: 'relative', zIndex: 20 }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: wp(1), paddingVertical: hp(0.5) }} onPress={() => setShowDurationDropdown(!showDurationDropdown)}>
                            <Text style={styles.cardHeaderTitle}>{statsDuration}</Text>
                            <ChevronDownIcon size={normalize(16)} color="#48327d" />
                        </TouchableOpacity>
                        {showDurationDropdown && (
                            <View style={styles.dropdownMenu}>
                                {['Today', 'This Week', 'This Month'].map((opt) => (
                                    <TouchableOpacity key={opt} style={[styles.dropdownItem, statsDuration === opt && { backgroundColor: '#f8fafc' }]} onPress={() => { setStatsDuration(opt); setShowDurationDropdown(false); }}>
                                        <Text style={[styles.dropdownItemText, statsDuration === opt && { fontWeight: '700', color: '#48327d' }]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.statsRow}>
                    <View style={styles.statsRowIdentity}>
                        <View style={styles.statsIconCircle}><UserIcon color="#48327d" size={normalize(18)} /></View>
                        <Text style={styles.statsRowLabel}>Me</Text>
                    </View>
                    <View style={styles.statsRowMetric}>
                        <Text style={styles.smallMetricLabel}>AVG HRS /{"\n"}DAY</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.statsRowValue}>{meStats.avg.split(' ')[0]}</Text>
                            <Text style={[styles.statsRowValue, { fontSize: normalize(13), marginLeft: wp(0.5), opacity: 0.7 }]}>{meStats.avg.split(' ')[1]}</Text>
                        </View>
                    </View>
                    <View style={styles.statsRowMetric}>
                        <Text style={styles.smallMetricLabel}>ON TIME{"\n"}ARRIVAL</Text>
                        <Text style={[styles.statsRowValue, { fontSize: normalize(24), marginTop: hp(0.5) }]}>{meStats.onTime}</Text>
                    </View>
                </View>
                {teamStats && (teamStats.avg_working_hours || teamStats.on_time_arrival) && (
                    <View style={[styles.statsRow, { marginTop: hp(2), borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: hp(2) }]}>
                        <View style={styles.statsRowIdentity}>
                            <View style={[styles.statsIconCircle, { backgroundColor: '#fcfaff' }]}><UsersIcon color="#48327d" size={normalize(18)} /></View>
                            <Text style={styles.statsRowLabel}>My Team</Text>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>AVG HRS /{"\n"}DAY</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={styles.statsRowValue}>{(teamStats?.avg_working_hours || '0h 00m').split(' ')[0]}</Text>
                                <Text style={[styles.statsRowValue, { fontSize: normalize(13), marginLeft: wp(0.5), opacity: 0.7 }]}>{(teamStats?.avg_working_hours || '0h 00m').split(' ')[1] || '00m'}</Text>
                            </View>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>ON TIME{"\n"}ARRIVAL</Text>
                            <Text style={[styles.statsRowValue, { fontSize: normalize(24), marginTop: hp(0.5) }]}>{teamStats?.on_time_arrival || '0%'}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={[styles.card, { marginBottom: hp(2) }]}>
                <Text style={styles.cardHeaderSectionTitle}>Timings</Text>
                <View style={styles.daySelector}>
                    {DAYS_ABBR.map((label, i) => {
                        const isTodayVal = weekLogs[i]?.date === todayStr;
                        return (
                            <View key={i} style={styles.dayItem}>
                                <TouchableOpacity onPress={() => setSelectedDayIndex(i)} style={[styles.dayCircle, selectedDayIndex === i ? styles.dayCircleActive : isTodayVal ? styles.dayCircleToday : styles.dayCircleInactive]}>
                                    <Text style={[styles.dayTextAbbr, selectedDayIndex === i ? styles.dayTextActive : isTodayVal ? styles.dayTextToday : styles.dayTextInactive]}>{label}</Text>
                                    {isTodayVal && <View style={styles.todayOuterDot}><View style={styles.todayInnerDot} /></View>}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
                <View style={styles.timingDetails}>
                    <View style={styles.timingHeaderRow}>
                        <Text style={styles.timingDayFull}>{new Date(activeDayLog.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                        <View style={styles.shiftBadge}>
                            <Text style={styles.shiftBadgeText}>{activeTiming.range}</Text>
                        </View>
                    </View>
                    {(() => {
                        const isWeekend = [0, 6].includes(new Date(activeDayLog.date).getDay());
                        const isApprovedLeave = !!activeDayLog.leaveType;
                        const isHoliday = activeDayLog.isHoliday;
                        if (isWeekend || isApprovedLeave || isHoliday) {
                            return <View style={styles.progressSection}><Text style={{ fontSize: normalize(14), color: '#94a3b8', textAlign: 'center', paddingVertical: hp(2.5) }}>{isHoliday ? `Holiday: ${activeDayLog.holidayName}` : isWeekend ? 'Weekend' : getLeaveLabel(activeDayLog.leaveType)}</Text></View>;
                        }
                        return (
                            <View style={styles.progressSection}>
                                <View style={styles.visualBar}>
                                    {getVisualSegments(activeDayLog).map((seg, i) => (
                                        <View key={i} style={[styles.visualSeg, { width: `${seg.width}%`, backgroundColor: seg.type === 'work' ? '#48327d' : 'transparent' }]} />
                                    ))}
                                </View>
                                <View style={styles.timingFooterRow}>
                                    <Text style={styles.timingFooterText}>Duration: {activeTiming.effective}</Text>
                                    <View style={styles.timingFooterBreak}><CoffeeIcon color="#64748b" size={normalize(14)} style={{ marginRight: wp(1) }} /><Text style={styles.timingFooterText}>{activeTiming.totalBreakMins} min</Text></View>
                                </View>
                            </View>
                        );
                    })()}
                </View>
            </View>

            <View style={[styles.card, { marginBottom: hp(3), paddingVertical: hp(3) }]}>
                {/* <Text style={styles.cardHeaderSectionTitle}>Actions</Text> - Removing as per clean UI request */}
                <View style={styles.actionGrid}>
                    <LiveDateTime user={user} clockStatus={clockStatus} debugInfo={debugInfo} />

                    <View style={styles.verticalDivider} />

                    <View style={styles.actionLinksSide}>
                        <TouchableOpacity
                            style={[
                                styles.checkInButton,
                                clockStatus === 'IN' ? styles.checkOutButton : styles.checkInButton,
                                (clockLoading || !canClock) && { opacity: 0.6 }
                            ]}
                            onPress={handleClockAction}
                            disabled={clockLoading || !canClock}
                            activeOpacity={0.8}
                        >
                            {clockLoading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <View style={styles.btnIconCircle}>
                                        {disabledReason === 'On Leave' ? <UmbrellaIcon color={clockStatus === 'IN' ? "#ef4444" : "#48327d"} size={normalize(14)} /> :
                                            disabledReason === 'Holiday' ? <PartyPopperIcon color={clockStatus === 'IN' ? "#ef4444" : "#48327d"} size={normalize(14)} /> :
                                                <Text style={[styles.btnIconArrow, { color: clockStatus === 'IN' ? "#ef4444" : "#48327d" }]}>{clockStatus === 'IN' ? '✕' : '➜'}</Text>}
                                    </View>
                                    <Text style={[styles.checkInButtonText, clockStatus === 'IN' && { color: '#ef4444' }]}>
                                        {disabledReason ? disabledReason : clockStatus === 'IN' ? 'Web Check-Out' : 'Web Check-In'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.tableHeader}>
                <Text style={styles.sectionTitle}>Attendance Logs</Text>
                <View style={styles.filterTabs}>
                    <TouchableOpacity onPress={() => setFilterType('30Days')} style={[styles.filterTab, filterType === '30Days' && styles.filterTabActive]}><Text style={[styles.filterTabText, filterType === '30Days' && styles.filterTabTextActive]}>LAST 30 DAYS</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setFilterType('Month')} style={[styles.filterTab, filterType === 'Month' && styles.filterTabActive]}><Text style={[styles.filterTabText, filterType === 'Month' && styles.filterTabTextActive]}>SELECT MONTH</Text></TouchableOpacity>
                </View>
            </View>



            <View style={styles.mainTabsContainer}>
                <TouchableOpacity style={[styles.mainTab, activeTab === 'Log' && styles.mainTabActive]} onPress={() => setActiveTab('Log')}><Text style={[styles.mainTabText, activeTab === 'Log' && styles.mainTabTextActive]}>ATTENDANCE LOG</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.mainTab, activeTab === 'Requests' && styles.mainTabActive]} onPress={() => setActiveTab('Requests')}><Text style={[styles.mainTabText, activeTab === 'Requests' && styles.mainTabTextActive]}>REQUESTS</Text></TouchableOpacity>
            </View>

            {activeTab === 'Log' && filterType === 'Month' && (
                <View style={[styles.monthSelectorContainer, { zIndex: 20 }]}>
                    <TouchableOpacity
                        style={styles.monthDropdownButton}
                        onPress={() => setShowMonthDropdown(!showMonthDropdown)}
                    >
                        <Text style={styles.monthDropdownText}>{MONTHS[selectedMonth]}</Text>
                        <ChevronDownIcon size={normalize(16)} color="#48327d" />
                    </TouchableOpacity>
                    {showMonthDropdown && (
                        <View style={styles.monthDropdownMenu}>
                            {MONTHS.map((m, idx) => {
                                const currentMonth = new Date().getMonth();
                                if (idx > currentMonth) return null;
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.monthDropdownItem, selectedMonth === idx && { backgroundColor: '#f8fafc' }]}
                                        onPress={() => {
                                            setSelectedMonth(idx);
                                            setShowMonthDropdown(false);
                                        }}
                                    >
                                        <Text style={[styles.monthDropdownItemText, selectedMonth === idx && { fontWeight: '700', color: '#48327d' }]}>{m}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>
            )}

            {activeTab === 'Log' && (
                <View style={styles.tableCard}>
                    <ScrollView
                        ref={tableScrollRef}
                        horizontal
                        persistentScrollbar={true}
                        scrollEventThrottle={16}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        onScroll={(event) => {
                            scrollPositionRef.current = event.nativeEvent.contentOffset.x;
                        }}
                    >
                        <View>
                            <View style={styles.tableHead}>
                                {['DATE', 'ATTENDANCE VISUAL', 'CHECK-IN', 'BREAKS', 'CHECK-OUT', 'GROSS HRS', 'EFFECTIVE HRS', 'ARRIVAL STATUS'].map((h, i) => {
                                    const w = i === 0 ? COL_WIDTHS.date :
                                        i === 1 ? COL_WIDTHS.visual :
                                            (i === 2 || i === 4) ? COL_WIDTHS.inOut :
                                                i === 3 ? COL_WIDTHS.breaks :
                                                    (i === 5 || i === 6) ? COL_WIDTHS.hrs :
                                                        COL_WIDTHS.status;
                                    if (i === 7) {
                                        return (
                                            <ArrivalFilterDropdown
                                                key={h}
                                                currentFilter={arrivalFilter}
                                                onSelect={setArrivalFilter}
                                            />
                                        );
                                    }
                                    return (
                                        <Text key={h} style={[styles.headCell, { width: w }, i === 6 && { color: '#48327d' }]}>{h}</Text>
                                    );
                                })}
                            </View>
                            {displayedLogs.filter(log => {
                                if (arrivalFilter === 'All') return true;
                                const s = calculateStats(log);
                                return s.arrivalStatus === arrivalFilter;
                            }).map((log, index) => {
                                const s = calculateStats(log);
                                const isWeekend = new Date(log.date).getDay() === 0 || new Date(log.date).getDay() === 6;
                                const isTodayVal = log.date === todayStr;
                                const hasActivity = (log.checkIn && log.checkIn !== '-') || (log.logs && log.logs.length > 0);
                                const showAsOff = (isWeekend || log.isHoliday || !!log.leaveType || (!isTodayVal && !hasActivity)) && !hasActivity;
                                return (
                                    <View key={index} style={[styles.tableRow, showAsOff && styles.rowOff]}>
                                        <View style={[styles.cell, { width: COL_WIDTHS.date }]}>
                                            <Text style={styles.dateText}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                                            {showAsOff && <Text style={[styles.offBadge, { maxWidth: wp(16) }]} numberOfLines={1}>{log.isHoliday ? 'HOLIDAY' : isWeekend ? 'W-OFF' : !!log.leaveType ? getLeaveCode(log.leaveType) : 'ABSENT'}</Text>}
                                        </View>
                                        {showAsOff ? <View style={{ flex: 1, paddingLeft: wp(3) }}><Text style={styles.offFullText}>{log.isHoliday ? (log.holidayName || 'Holiday') : isWeekend ? 'Weekly-off' : !!log.leaveType ? getLeaveLabel(log.leaveType) : 'Absent'}</Text></View> : (
                                            <>
                                                <View style={[styles.cell, { width: COL_WIDTHS.visual }]}><View style={styles.visualBarTable}>{getVisualSegments(log).map((seg, i) => <View key={i} style={[styles.visualSeg, { width: `${seg.width}%`, backgroundColor: seg.type === 'work' ? '#48327d' : 'transparent' }]} />)}</View></View>
                                                <Text style={[styles.cell, styles.timeText, { width: COL_WIDTHS.inOut }]}>{log.checkIn || '-'}</Text>
                                                <TouchableOpacity style={[styles.cell, { width: COL_WIDTHS.breaks, alignItems: 'center' }]} disabled={s.totalBreakMins === 0} onPress={() => setActiveBreakLog(log)}>
                                                    {s.totalBreakMins > 0 ? <View style={styles.breakItemContainer}><View style={styles.infoSquare}><Text style={styles.infoIconText}>i</Text></View><Text style={styles.breakDurationText}>{s.totalBreakMins}m</Text></View> : <Text style={styles.dashText}>-</Text>}
                                                </TouchableOpacity>
                                                <View style={[styles.cell, { width: COL_WIDTHS.inOut }]}>
                                                    {(log.is_active === false && log.checkOut === '-' && log.checkIn !== '-' && !isTodayVal) ? (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(2) }}>
                                                            <View style={styles.missedCheckOutBadge}><Text style={styles.missedCheckOutText}>MISSED</Text></View>
                                                            <TouchableOpacity onPress={() => { setActiveRegularizeLog(log); setRegularizeModalVisible(true); }}><MoreVerticalIcon size={normalize(16)} color="#1e293b" /></TouchableOpacity>
                                                        </View>
                                                    ) : <Text style={styles.timeText}>{log.checkOut || '-'}</Text>}
                                                </View>
                                                <Text style={[styles.cell, styles.durationText, { width: COL_WIDTHS.hrs }]}>{s.gross}</Text>
                                                <Text style={[styles.cell, styles.effText, { width: COL_WIDTHS.hrs }]}>{s.effective}</Text>
                                                <View style={[styles.cell, { width: COL_WIDTHS.status }]}><Text style={[styles.statusTabText, { color: s.arrivalColor }]}>{s.arrivalStatus}</Text></View>
                                            </>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            )}



            {activeTab === 'Requests' && user.is_manager && (
                <View style={styles.requestFilterContainer}>
                    <TouchableOpacity style={[styles.requestFilterBtn, requestType === 'manager' && styles.requestFilterBtnActive]} onPress={() => setRequestType('manager')}><Text style={[styles.requestFilterText, requestType === 'manager' && styles.requestFilterTextActive]}>TEAM REQUESTS</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.requestFilterBtn, requestType === 'employee' && styles.requestFilterBtnActive]} onPress={() => setRequestType('employee')}><Text style={[styles.requestFilterText, requestType === 'employee' && styles.requestFilterTextActive]}>MY REQUESTS</Text></TouchableOpacity>
                </View>
            )}
        </>
    );

    if (initialLoad) {
        return <View style={styles.centered}><ActivityIndicator size="large" color="#6366f1" /><Text style={styles.loadingText}>Syncing records...</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            {renderBreakModal()}
            <RegularizeModal visible={regularizeModalVisible} onClose={() => setRegularizeModalVisible(false)} date={activeRegularizeLog?.date} employeeId={user.id} onSuccess={() => { fetchData(); setRegularizeModalVisible(false); }} teamLeadName={user.team_lead_name} />
            <FlatList
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#48327d']} />}
                data={activeTab === 'Requests' ? requests : []}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: hp(12) }]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={renderHeader}
                renderItem={({ item: req }) => (
                    <View style={styles.requestCard}>
                        <View style={styles.requestCardHeader}>
                            <View style={{ flex: 1, marginRight: wp(3) }}>
                                <Text style={styles.requestEmpName} numberOfLines={1} ellipsizeMode="tail">{req.employee_name}</Text>
                                <View style={styles.requestBadgeRow}>
                                    <View style={styles.requestEmpIdBadge}><Text style={styles.requestEmpIdText}>{req.employee_id}</Text></View>
                                    <View style={[styles.requestStatusBadge, { borderColor: (req.status || 'Pending') === 'Approved' ? '#10b98120' : (req.status || 'Pending') === 'Rejected' ? '#ef444420' : '#f59e0b20' }]}>
                                        <Text style={[styles.requestStatusText, { color: (req.status || 'Pending') === 'Approved' ? '#10b981' : (req.status || 'Pending') === 'Rejected' ? '#ef4444' : '#f59e0b' }]}>{(req.status || 'Pending').toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end', minWidth: wp(16) }}>
                                <Text style={styles.requestDate}>{req.attendance?.date || '-'}</Text>
                                <Text style={styles.requestCreated}>{req.created_at ? new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.requestReasonBox}>
                            <Text style={styles.requestReasonText}><Text style={styles.requestLabel}>Reason: </Text>{req.reason || '-'}</Text>
                            <View style={styles.requestTimingRow}>
                                <View><Text style={styles.requestSubLabel}>CHECK IN</Text><Text style={styles.requestTimingValue}>{req.attendance?.check_in || '-'}</Text></View>
                                <View><Text style={styles.requestSubLabel}>REQ OUT</Text><Text style={styles.requestTimingValue}>{req.requested_checkout || '-'}</Text></View>
                            </View>
                        </View>
                        {requestType === 'manager' && req.status === 'Pending' && (
                            <View style={styles.requestActions}>
                                <TouchableOpacity style={styles.approveBtn} onPress={() => Alert.alert('Approve', 'Approve this request?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Approve', onPress: () => attendanceApi.updateRequestStatus(req.id, 'Approved').then(() => { fetchData(); fetchRequests(true); Alert.alert('Success', 'Approved'); }) }])}><Text style={styles.approveBtnText}>APPROVE</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.rejectBtn} onPress={() => Alert.alert('Reject', 'Reject this request?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reject', onPress: () => attendanceApi.updateRequestStatus(req.id, 'Rejected').then(() => { fetchData(); fetchRequests(true); Alert.alert('Rejected', 'Rejected'); }) }])}><Text style={styles.rejectBtnText}>REJECT</Text></TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={() => activeTab === 'Requests' ? <View style={styles.emptyRequests}><Text style={styles.emptyRequestsText}>No requests found.</Text></View> : null}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: wp(4), paddingBottom: hp(8) },
    welcomeSection: { marginBottom: hp(3), paddingHorizontal: wp(1) },
    greetingTitle: { fontSize: normalize(24), fontWeight: '900', color: '#1e293b', letterSpacing: -0.8 },
    greetingSubtitle: { fontSize: normalize(14), color: '#64748b', marginTop: hp(0.5), fontWeight: '500' },
    loadingText: { marginTop: hp(1.5), color: '#64748b', fontWeight: '700' },
    card: { backgroundColor: 'white', borderRadius: normalize(16), padding: wp(5), borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
    cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(2.5) },
    cardHeaderTitle: { fontSize: normalize(14), fontWeight: '800', color: '#1e293b', letterSpacing: -0.2 },
    cardHeaderSectionTitle: { fontSize: normalize(11), fontWeight: '800', color: '#94a3b8', marginBottom: hp(2), textTransform: 'uppercase', letterSpacing: 1 },
    dropdownMenu: { position: 'absolute', top: hp(3.8), left: 0, backgroundColor: 'white', borderRadius: normalize(8), padding: wp(1), elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, minWidth: wp(30), borderWidth: 1, borderColor: '#f1f5f9', zIndex: 50 },
    dropdownItem: { paddingVertical: hp(1), paddingHorizontal: wp(3), borderRadius: normalize(6) },
    dropdownItemText: { fontSize: normalize(13), fontWeight: '500', color: '#64748b' },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statsRowIdentity: { flex: 0.8, flexDirection: 'row', alignItems: 'center', gap: wp(3) },
    statsIconCircle: { width: normalize(36), height: normalize(36), borderRadius: normalize(12), backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    statsRowLabel: { fontSize: normalize(14), fontWeight: '800', color: '#1e293b' },
    statsRowMetric: { flex: 1, alignItems: 'center', paddingHorizontal: wp(1) },
    smallMetricLabel: { fontSize: normalize(8), fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5, marginBottom: hp(0.5), textTransform: 'uppercase', textAlign: 'center', lineHeight: normalize(10) },
    statsRowValue: { fontSize: normalize(20), fontWeight: '900', color: '#48327d', letterSpacing: -0.5 },
    daySelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(3), width: '100%' },
    dayItem: { flex: 1, alignItems: 'center' },
    dayCircle: { width: normalize(36), height: normalize(36), borderRadius: normalize(18), justifyContent: 'center', alignItems: 'center' },
    dayCircleActive: { backgroundColor: '#48327d', elevation: 4 },
    dayCircleToday: { backgroundColor: 'rgba(72, 50, 125, 0.06)', borderWidth: 1.5, borderColor: 'rgba(72, 50, 125, 0.15)' },
    dayCircleInactive: { backgroundColor: '#f8fafc' },
    dayTextAbbr: { fontSize: normalize(11), fontWeight: '900' },
    dayTextActive: { color: 'white' },
    dayTextToday: { color: '#48327d' },
    dayTextInactive: { color: '#94a3b8' },
    todayOuterDot: { position: 'absolute', top: -2, right: -2, width: normalize(10), height: normalize(10), backgroundColor: 'white', borderRadius: normalize(5), justifyContent: 'center', alignItems: 'center' },
    todayInnerDot: { width: normalize(6), height: normalize(6), backgroundColor: '#ef4444', borderRadius: normalize(3) },
    timingDetails: { paddingTop: 0 },
    timingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(2.5) },
    timingDayFull: { fontSize: normalize(16), fontWeight: '900', color: '#1e293b' },
    shiftBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: wp(2.5), paddingVertical: hp(0.6), borderRadius: normalize(8) },
    shiftBadgeText: { fontSize: normalize(10), color: '#48327d', fontWeight: '800' },
    progressSection: { marginTop: 0 },
    visualBar: { height: hp(1.2), backgroundColor: '#f1f5f9', borderRadius: normalize(5), width: '100%', overflow: 'hidden', flexDirection: 'row', marginBottom: hp(2) },
    visualBarTable: { height: hp(0.8), backgroundColor: '#f1f5f9', borderRadius: normalize(3), width: '100%', overflow: 'hidden', flexDirection: 'row' },
    visualSeg: { height: '100%' },
    timingFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timingFooterText: { fontSize: normalize(13), fontWeight: '800', color: '#48327d' },
    timingFooterBreak: { flexDirection: 'row', alignItems: 'center' },
    actionGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    actionTimeSide: { flex: 1 },
    actionClockText: { fontSize: normalize(28), fontWeight: '900', color: '#1e293b', letterSpacing: -1 },
    actionDateText: { fontSize: normalize(13), color: '#64748b', fontWeight: '600', marginTop: hp(0.2), marginBottom: hp(1) },
    debugInfoBox: { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
    statusDotRow: { flexDirection: 'row', alignItems: 'center', gap: wp(1.5), backgroundColor: '#f1f5f9', paddingHorizontal: wp(2), paddingVertical: hp(0.5), borderRadius: 100 },
    statusDot: { width: normalize(8), height: normalize(8), borderRadius: normalize(4) },
    debugInfoText: { fontSize: normalize(11), color: '#475569', fontWeight: '700' },
    debugInfoSubText: { fontSize: normalize(11), color: '#94a3b8', fontWeight: '600' },

    verticalDivider: { width: 1, height: '80%', backgroundColor: '#f1f5f9', marginHorizontal: wp(4) },

    actionLinksSide: { flex: 0.8 },
    checkInButton: { backgroundColor: '#f3e8ff', paddingVertical: hp(1.5), paddingHorizontal: wp(4), borderRadius: normalize(12), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2.5) },
    checkOutButton: { backgroundColor: '#fef2f2', paddingVertical: hp(1.5), paddingHorizontal: wp(4), borderRadius: normalize(12), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: wp(2.5), borderWidth: 1, borderColor: '#ef444420' },
    checkInButtonText: { color: '#48327d', fontWeight: '800', fontSize: normalize(13) },

    // Updated button text for check-out state to be red
    // We can conditionally style the text in the component, but here we define base
    btnIconCircle: { width: normalize(20), height: normalize(20), borderRadius: normalize(10), backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
    btnIconArrow: { fontSize: normalize(10), fontWeight: '900', lineHeight: normalize(14) },
    sectionTitle: { fontSize: normalize(18), fontWeight: '900', color: '#1e293b', marginBottom: hp(0.5) },
    tableHeader: { flexDirection: 'column', gap: hp(1.5), marginBottom: hp(2.5), marginTop: hp(1.2), paddingHorizontal: wp(5) },
    filterTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: normalize(12), padding: wp(1), alignSelf: 'flex-start' },
    filterTab: { paddingHorizontal: wp(3.5), paddingVertical: hp(0.9), borderRadius: normalize(8) },
    filterTabActive: { backgroundColor: 'white', elevation: 1 },
    filterTabText: { fontSize: normalize(10), fontWeight: '900', color: '#64748b', letterSpacing: 0.3 },
    filterTabTextActive: { color: '#48327d', fontWeight: '900' },
    mainTabsContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: normalize(8), padding: wp(1), marginHorizontal: wp(5), marginBottom: hp(2) },
    mainTab: { flex: 1, paddingVertical: hp(1), alignItems: 'center', borderRadius: normalize(6) },
    mainTabActive: { backgroundColor: 'white', elevation: 1 },
    mainTabText: { fontSize: normalize(13), fontWeight: '800', color: '#64748b' },
    mainTabTextActive: { color: '#48327d', fontWeight: '900' },
    monthSelectorContainer: { marginBottom: hp(2), marginHorizontal: wp(5), position: 'relative' },
    monthDropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: normalize(12),
        gap: wp(2)
    },
    monthDropdownText: { fontSize: normalize(13), fontWeight: '900', color: '#48327d' },
    monthDropdownMenu: {
        position: 'absolute',
        top: hp(6),
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: normalize(12),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 999,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        maxHeight: hp(30)
    },
    monthDropdownItem: {
        padding: wp(3.5),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    monthDropdownItemText: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center'
    },
    tableCard: { backgroundColor: 'white', borderRadius: normalize(20), borderWidth: 1, borderColor: '#f1f5f9', elevation: 1, overflow: 'visible' },
    tableHead: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingVertical: hp(2), zIndex: 1000, elevation: 2, overflow: 'visible' },
    headCell: { fontSize: normalize(10), fontWeight: '900', color: '#334155', textAlign: 'center', letterSpacing: 0.8 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: hp(2), alignItems: 'center' },
    rowOff: { backgroundColor: '#fcfcfd' },
    cell: { paddingHorizontal: wp(4), justifyContent: 'center' },
    dateText: { fontSize: normalize(13), fontWeight: '800', color: '#1e293b', textAlign: 'center' },
    offBadge: { fontSize: normalize(8), fontWeight: '900', color: '#48327d', backgroundColor: '#f3e8ff', alignSelf: 'center', paddingHorizontal: wp(1.8), paddingVertical: hp(0.4), borderRadius: normalize(6), marginTop: hp(0.6) },
    offFullText: { fontSize: normalize(13), color: '#64748b', fontWeight: '600' },
    timeText: { fontSize: normalize(12), fontWeight: '700', color: '#334155', textAlign: 'center' },
    breakItemContainer: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },
    infoSquare: { width: normalize(20), height: normalize(20), backgroundColor: '#cbd5e1', borderRadius: normalize(6), justifyContent: 'center', alignItems: 'center' },
    infoIconText: { color: 'white', fontSize: normalize(11), fontWeight: '900' },
    breakDurationText: { fontSize: normalize(14), fontWeight: '800', color: '#48327d' },
    durationText: { fontSize: normalize(12), fontWeight: '700', color: '#334155', textAlign: 'center' },
    effText: { fontSize: normalize(12), fontWeight: '900', color: '#48327d', textAlign: 'center' },
    statusTabText: { fontSize: normalize(10), fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
    dashText: { fontSize: normalize(12), color: '#e2e8f0', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: wp(5) },
    modalContent: { backgroundColor: 'white', borderRadius: normalize(24), width: '100%', maxWidth: wp(85), padding: wp(6), elevation: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(2.5), paddingBottom: hp(1.5), borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: normalize(16), fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' },
    closeBtn: { fontSize: normalize(18), color: '#94a3b8', fontWeight: 'bold' },
    modalBody: { gap: hp(2) },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalRowLabel: { fontSize: normalize(13), color: '#64748b', fontWeight: '700' },
    modalRowInfo: { flexDirection: 'row', alignItems: 'center', gap: wp(2.5) },
    modalRowTime: { fontSize: normalize(12), fontWeight: '800', color: '#1e293b' },
    modalRowDuration: { fontSize: normalize(12), fontWeight: '900', color: '#48327d' },
    noBreakText: { textAlign: 'center', color: '#94a3b8', fontSize: normalize(13), padding: wp(5) },
    modalFooter: { marginTop: hp(1.5), paddingTop: hp(2), borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
    modalTotalLabel: { fontSize: normalize(12), fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
    modalTotalValue: { fontSize: normalize(14), fontWeight: '900', color: '#48327d' },
    missedCheckOutBadge: { backgroundColor: '#fef2f2', paddingHorizontal: wp(2.5), paddingVertical: hp(0.6), borderRadius: normalize(6), borderWidth: 1, borderColor: '#ef444410' },
    missedCheckOutText: { fontSize: normalize(9), fontWeight: '900', color: '#ef4444', textTransform: 'uppercase' },

    requestCard: { backgroundColor: 'white', padding: wp(5), borderRadius: normalize(20), marginBottom: hp(2), marginHorizontal: wp(5), borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
    requestCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1.5) },
    requestEmpName: { fontSize: normalize(16), fontWeight: '800', color: '#1e293b' },
    requestBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: wp(2), marginTop: hp(0.5) },
    requestEmpIdBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: wp(1.8), paddingVertical: hp(0.4), borderRadius: normalize(6) },
    requestEmpIdText: { fontSize: normalize(10), fontWeight: '800', color: '#64748b' },
    requestStatusBadge: { paddingHorizontal: wp(2), paddingVertical: hp(0.4), borderRadius: normalize(6), borderWidth: 1 },
    requestStatusText: { fontSize: normalize(9), fontWeight: '900' },
    requestDate: { fontSize: normalize(13), fontWeight: '700', color: '#1e293b' },
    requestCreated: { fontSize: normalize(11), color: '#94a3b8', marginTop: hp(0.2) },
    requestReasonBox: { backgroundColor: '#f8fafc', padding: wp(3.5), borderRadius: normalize(12), marginBottom: hp(1.8), borderWidth: 1, borderColor: '#f1f5f9' },
    requestReasonText: { fontSize: normalize(13), color: '#334155', lineHeight: normalize(20) },
    requestLabel: { fontWeight: '700', color: '#64748b', fontSize: normalize(11), textTransform: 'uppercase' },
    requestTimingRow: { flexDirection: 'row', marginTop: hp(1.5), gap: wp(6) },
    requestSubLabel: { fontSize: normalize(9), color: '#94a3b8', fontWeight: '800', marginBottom: hp(0.2) },
    requestTimingValue: { fontSize: normalize(14), color: '#1e293b', fontWeight: '700' },
    requestActions: { flexDirection: 'row', gap: wp(3) },
    approveBtn: { flex: 1, backgroundColor: '#ecfdf5', paddingVertical: hp(1.5), borderRadius: normalize(12), alignItems: 'center', borderWidth: 1, borderColor: '#10b98120' },
    approveBtnText: { color: '#10b981', fontWeight: '900', fontSize: normalize(12) },
    rejectBtn: { flex: 1, backgroundColor: '#fef2f2', paddingVertical: hp(1.5), borderRadius: normalize(12), alignItems: 'center', borderWidth: 1, borderColor: '#ef444420' },
    rejectBtnText: { color: '#ef4444', fontWeight: '900', fontSize: normalize(12) },
    requestFilterContainer: { paddingHorizontal: wp(5), marginBottom: hp(1.5), flexDirection: 'row', gap: wp(3) },
    requestFilterBtn: { backgroundColor: '#e2e8f0', paddingHorizontal: wp(4), paddingVertical: hp(1), borderRadius: normalize(20) },
    requestFilterBtnActive: { backgroundColor: '#48327d' },
    requestFilterText: { color: '#64748b', fontWeight: '700', fontSize: normalize(12) },
    requestFilterTextActive: { color: 'white' },
    emptyRequests: { padding: wp(15), alignItems: 'center' },
    emptyRequestsText: { color: '#94a3b8', fontSize: normalize(14), fontWeight: '600' }
});

export default MeScreen;
