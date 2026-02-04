import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Modal,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Geolocation from '@react-native-community/geolocation';
import { attendanceApi, teamApi } from '../services/api';

const { width } = Dimensions.get('window');

interface MeScreenProps {
    user: any;
}

const MeScreen: React.FC<MeScreenProps> = ({ user }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [logs, setLogs] = useState<any[]>([]);
    const [teamStats, setTeamStats] = useState<any>(null);
    const [clockStatus, setClockStatus] = useState<any>(null);
    const [canClock, setCanClock] = useState(true);
    const [disabledReason, setDisabledReason] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('30Days');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [activeBreakLog, setActiveBreakLog] = useState<any>(null);
    const [clockLoading, setClockLoading] = useState(false);

    const DAYS_ABBR = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Column widths for table
    const COL_WIDTHS = {
        date: 120,
        visual: 150,
        inOut: 90,
        breaks: 70,
        hrs: 90,
        status: 100
    };

    const toLocalDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [history, status, stats] = await Promise.all([
                attendanceApi.getHistory(user.id),
                attendanceApi.getStatus(user.id),
                teamApi.getStats(user.team_id)
            ]);
            setLogs(history);
            setClockStatus(status.status);
            setCanClock(status.can_clock !== undefined ? status.can_clock : true);
            setDisabledReason(status.disabled_reason);
            setDebugInfo(status.debug);
            setTeamStats(stats);

            // Set today as selected day in timing card
            const todayStr = toLocalDateString(new Date());
            const todayIdxInHistory = history.findIndex((l: any) => l.date === todayStr);

            // For the timing selector (Mon-Sun), find today's day of week
            const day = new Date().getDay();
            const diff = (day === 0 ? 6 : day - 1); // 0-indexed Mon-Sun
            setSelectedDayIndex(diff);

        } catch (error) {
            console.log("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };


    const handleClockAction = async () => {
        setClockLoading(true);
        // Geolocation Logic Removed for Cloud Build Compatibility

        const finalLocation = "Cloud Server (Preview)";
        const nextType = clockStatus === 'IN' ? 'OUT' : 'IN';

        try {
            await attendanceApi.clock({
                employee_id: user.id,
                location: finalLocation,
                type: nextType
            });
            await fetchData();
        } catch (err) {
            console.log("Clock action failed:", err);
            Alert.alert('Error', 'Failed to update attendance');
        } finally {
            setClockLoading(false);
        }
    };

    const getLeaveCode = (leaveType: string) => {
        const map: Record<string, string> = {
            'Sick Leave': 'SL',
            'Casual Leave': 'CL',
            'Earned Leave': 'EL',
            'Privilege Leave': 'PL',
            'Loss of Pay': 'LOP'
        };
        return map[leaveType] || leaveType?.substring(0, 2).toUpperCase();
    };

    const getLeaveLabel = (leaveType: string) => {
        return leaveType || 'Leave';
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
            // If checkout is missing (active or missed), use current time for visualization scaling
            const now = new Date();
            endMins = now.getHours() * 60 + now.getMinutes();

            // Safeguard: If current time is earlier than start time (e.g., viewing a past late-night shift in the morning)
            if (endMins <= startMins) {
                endMins = startMins + 1;
            }
        }

        let totalSpan = endMins - startMins;
        if (totalSpan <= 0) totalSpan = 1;

        const segments: { type: 'work' | 'break', width: number }[] = [];

        log.logs.forEach((session: any, idx: number) => {
            const sIn = parseTimeToMinutes(session.in);
            const sOut = (session.out && session.out !== '-') ? parseTimeToMinutes(session.out) : endMins;

            // Gap (Break)
            if (idx > 0) {
                const prevOut = parseTimeToMinutes(log.logs[idx - 1].out);
                const gap = sIn - prevOut;
                if (gap > 0) {
                    segments.push({ type: 'break', width: (gap / totalSpan) * 100 });
                }
            }

            // Work
            const duration = sOut - sIn;
            if (duration > 0) {
                segments.push({ type: 'work', width: (duration / totalSpan) * 100 });
            }
        });

        return segments;
    };

    const calculateStats = (log: any) => {
        if (!log || log.checkIn === '-' || !log.checkIn) {
            return {
                gross: '-',
                effective: '-',
                status: log?.status || 'Not Marked',
                effectiveProgress: 0,
                arrivalStatus: '-',
                arrivalColor: '#94a3b8',
                totalBreakMins: 0
            };
        }

        const sIn = parseTimeToMinutes(log.logs?.[0]?.in || log.checkIn);
        let sOut = 0;
        const lastLog = log.logs?.[log.logs.length - 1];

        if (lastLog?.out && lastLog.out !== '-') {
            sOut = parseTimeToMinutes(lastLog.out);
        } else if (log.checkOut && log.checkOut !== '-') {
            sOut = parseTimeToMinutes(log.checkOut);
        } else {
            const now = new Date();
            const todayStr = toLocalDateString(now);
            if (log.date === todayStr) {
                sOut = now.getHours() * 60 + now.getMinutes();
            }
        }

        let grossMins = sOut > 0 ? sOut - sIn : 0;

        // Calculate breaks from logs if array exists
        let totalBreakMins = 0;
        if (log.logs && log.logs.length >= 1) {
            for (let i = 1; i < log.logs.length; i++) {
                const prevOut = parseTimeToMinutes(log.logs[i - 1].out);
                const currIn = parseTimeToMinutes(log.logs[i].in);
                if (currIn > prevOut) totalBreakMins += (currIn - prevOut);
            }
        } else {
            totalBreakMins = log.breakMinutes || 0;
        }

        const effectiveMins = Math.max(0, grossMins - totalBreakMins);

        const formatDuration = (totalMins: number) => {
            if (totalMins < 0) return '0h 00m';
            const h = Math.floor(totalMins / 60);
            const m = totalMins % 60;
            return `${h}h ${String(m).padStart(2, '0')}m`;
        };

        // Arrival Status
        let arrivalStatus = 'On Time';
        let arrivalColor = '#10b981';
        const checkInT = parseTime(log.checkIn);
        if (checkInT) {
            const totalInMins = checkInT.h * 60 + checkInT.m;
            if (totalInMins > 9 * 60 + 30) {
                arrivalStatus = 'Late';
                arrivalColor = '#ef4444';
            }
        }

        return {
            gross: formatDuration(grossMins),
            effective: formatDuration(effectiveMins),
            status: log.status,
            effectiveProgress: Math.min(100, (effectiveMins / (9 * 60)) * 100),
            arrivalStatus,
            arrivalColor,
            totalBreakMins
        };
    };

    const meStats = useMemo(() => {
        if (!logs.length) return { avg: '0h 00m', onTime: '0%' };

        // Current week Monday
        const now = new Date();
        const monday = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        let totalMins = 0;
        let presentDays = 0;
        let onTimeDays = 0;

        logs.forEach(log => {
            const logDate = new Date(log.date);
            if (logDate >= monday && log.checkIn && log.checkIn !== '-') {
                const stats = calculateStats(log);
                if (stats.effective !== '-') {
                    const match = stats.effective.match(/(\d+)h\s+(\d+)m/);
                    if (match) {
                        presentDays++;
                        totalMins += parseInt(match[1]) * 60 + parseInt(match[2]);
                        if (stats.arrivalStatus === 'On Time') onTimeDays++;
                    }
                }
            }
        });

        if (presentDays === 0) return { avg: '0h 00m', onTime: '0%' };

        const avgMins = Math.floor(totalMins / presentDays);
        return {
            avg: `${Math.floor(avgMins / 60)}h ${String(avgMins % 60).padStart(2, '0')}m`,
            onTime: `${Math.round((onTimeDays / presentDays) * 100)}%`
        };
    }, [logs, currentTime]);

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
            const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

            return {
                date: dateStr,
                checkIn: '-',
                checkOut: '-',
                breakMinutes: 0,
                status: 'Not Marked',
                isWeekend,
                isHoliday: false,
                logs: []
            };
        });
    }, [logs, filterType, selectedMonth]);

    const weekLogs = useMemo(() => {
        const today = new Date();
        const monday = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - (day === 0 ? 6 : day - 1);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const week = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = toLocalDateString(d);
            const log = logs.find(l => l.date === dateStr) || { date: dateStr, status: 'Not Marked' };
            week.push(log);
        }
        return week;
    }, [logs]);

    const activeDayLog = weekLogs[selectedDayIndex];
    const activeTiming = calculateStats(activeDayLog);

    const renderBreakModal = () => {
        if (!activeBreakLog) return null;

        const breaks: any[] = [];
        if (activeBreakLog.logs && activeBreakLog.logs.length > 1) {
            for (let i = 1; i < activeBreakLog.logs.length; i++) {
                const start = activeBreakLog.logs[i - 1].out;
                const end = activeBreakLog.logs[i].in;
                const duration = parseTimeToMinutes(end) - parseTimeToMinutes(start);
                breaks.push({ start, end, duration });
            }
        }

        return (
            <Modal transparent visible={!!activeBreakLog} animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setActiveBreakLog(null)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Break Timings</Text>
                            <TouchableOpacity onPress={() => setActiveBreakLog(null)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            {breaks.length > 0 ? (
                                breaks.map((b, i) => (
                                    <View key={i} style={styles.modalRow}>
                                        <Text style={styles.modalRowLabel}>Break {i + 1}</Text>
                                        <View style={styles.modalRowInfo}>
                                            <Text style={styles.modalRowTime}>{b.start} - {b.end}</Text>
                                            <Text style={styles.modalRowDuration}>({b.duration}m)</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noBreakText}>No detailed break logs available.</Text>
                            )}
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

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.loadingText}>Syncing your records...</Text>
            </View>
        );
    }

    const todayStr = toLocalDateString(new Date());

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {renderBreakModal()}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.welcomeSection}>
                    <Text style={styles.greetingTitle}>My Attendance</Text>
                    <Text style={styles.greetingSubtitle}>Detailed tracking and productivity logs</Text>
                </View>

                {/* Web Style Attendance Stats */}
                <View style={[styles.card, { marginBottom: 16 }]}>
                    <View style={styles.cardHeaderFlex}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.cardHeaderTitle}>This Week</Text>
                            <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>▼</Text>
                        </View>
                        <Text style={{ color: '#b2bec3', fontSize: 13 }}>ⓘ</Text>
                    </View>

                    {/* Me Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statsRowIdentity}>
                            <View style={styles.statsIconCircle}>
                                <Text style={{ fontSize: 15, color: '#48327d', opacity: 0.8 }}>👤</Text>
                            </View>
                            <Text style={styles.statsRowLabel}>Me</Text>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>AVG HRS /{"\n"}DAY</Text>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.statsRowValue}>{meStats.avg.split(' ')[0]}</Text>
                                <Text style={styles.statsRowValue}>{meStats.avg.split(' ')[1]}</Text>
                            </View>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>ON TIME{"\n"}ARRIVAL</Text>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={[styles.statsRowValue, { fontSize: 28, marginTop: 4 }]}>{meStats.onTime}</Text>
                            </View>
                        </View>
                    </View>

                    {/* My Team Stats Row */}
                    <View style={[styles.statsRow, { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 }]}>
                        <View style={styles.statsRowIdentity}>
                            <View style={[styles.statsIconCircle, { backgroundColor: '#fcfaff' }]}>
                                <Text style={{ fontSize: 14, color: '#48327d' }}>👥</Text>
                            </View>
                            <Text style={styles.statsRowLabel}>My Team</Text>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>AVG HRS /{"\n"}DAY</Text>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.statsRowValue}>{(teamStats?.avg_working_hours || '0h 00m').split(' ')[0]}</Text>
                                <Text style={styles.statsRowValue}>{(teamStats?.avg_working_hours || '0h 00m').split(' ')[1] || '00m'}</Text>
                            </View>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>ON TIME{"\n"}ARRIVAL</Text>
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={[styles.statsRowValue, { fontSize: 28, marginTop: 4 }]}>{teamStats?.on_time_arrival || '0%'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Timings Card */}
                <View style={[styles.card, { marginBottom: 16 }]}>
                    <Text style={styles.cardHeaderSectionTitle}>Timings</Text>
                    <View style={styles.daySelector}>
                        {DAYS_ABBR.map((label, i) => {
                            const isToday = weekLogs[i]?.date === todayStr;
                            return (
                                <View key={i} style={styles.dayItem}>
                                    <TouchableOpacity
                                        onPress={() => setSelectedDayIndex(i)}
                                        style={[
                                            styles.dayCircle,
                                            selectedDayIndex === i ? styles.dayCircleActive : isToday ? styles.dayCircleToday : styles.dayCircleInactive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.dayTextAbbr,
                                            selectedDayIndex === i ? styles.dayTextActive : isToday ? styles.dayTextToday : styles.dayTextInactive
                                        ]}>{label}</Text>
                                        {isToday && <View style={styles.todayOuterDot}><View style={styles.todayInnerDot} /></View>}
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.timingDetails}>
                        <View style={styles.timingHeaderRow}>
                            <Text style={styles.timingDayFull}>
                                {new Date(activeDayLog.date).toLocaleDateString('en-US', { weekday: 'long' })}, {new Date(activeDayLog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                            <View style={styles.shiftBadge}>
                                <Text style={styles.shiftBadgeText}>09:30 AM - 06:30 PM</Text>
                            </View>
                        </View>
                        <View style={styles.progressSection}>
                            <View style={styles.visualBar}>
                                {getVisualSegments(activeDayLog).map((seg, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.visualSeg,
                                            {
                                                width: `${seg.width}%`,
                                                backgroundColor: seg.type === 'work' ? '#48327d' : 'transparent'
                                            }
                                        ]}
                                    />
                                ))}
                            </View>
                            <View style={styles.timingFooterRow}>
                                <Text style={styles.timingFooterText}>Duration: {activeTiming.effective === '-' ? '9h 00m' : activeTiming.effective}</Text>
                                <View style={styles.timingFooterBreak}>
                                    <Text style={{ fontSize: 13, marginRight: 4 }}>☕</Text>
                                    <Text style={styles.timingFooterText}>{activeTiming.totalBreakMins || 60} min</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Actions Section */}
                <View style={[styles.card, { marginBottom: 24 }]}>
                    <Text style={styles.cardHeaderSectionTitle}>Actions</Text>
                    <View style={styles.actionGrid}>
                        <View style={styles.actionTimeSide}>
                            <Text style={styles.actionClockText}>
                                {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Text>
                            <Text style={styles.actionDateText}>
                                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                            <View style={styles.debugInfoBox}>
                                <Text style={styles.debugInfoText}>ID: {user.id} | St: {clockStatus || 'UNKNOWN'}</Text>
                                <Text style={styles.debugInfoText}>LastLog: {debugInfo ? `${debugInfo.last_log_type} (${debugInfo.last_log_id})` : 'None'}</Text>
                            </View>
                        </View>
                        <View style={styles.actionLinksSide}>
                            <TouchableOpacity
                                style={[styles.actionLinkItem, (clockLoading || !canClock) && { opacity: 0.6 }]}
                                onPress={handleClockAction}
                                disabled={clockLoading || !canClock}
                            >
                                <Text style={styles.actionLinkIcon}>
                                    {!canClock && disabledReason === 'On Leave' ? '🏖️' :
                                        !canClock && disabledReason === 'Holiday' ? '🎉' :
                                            clockStatus === 'IN' ? '⇠' : '➔'}
                                </Text>
                                <Text style={styles.actionLabel}>
                                    {!canClock ? (disabledReason || 'Disabled') :
                                        clockStatus === 'IN' ? 'Web Clock-Out' : 'Web Clock-In'}
                                </Text>
                                {clockLoading && <ActivityIndicator size="small" color="#48327d" style={{ marginLeft: 8 }} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionLinkItem}>
                                <Text style={styles.actionLinkIcon}>🏠</Text>
                                <Text style={styles.actionLabel}>Work From Home</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Table Section */}
                <View style={styles.tableHeader}>
                    <Text style={styles.sectionTitle}>Attendance Logs</Text>
                    <View style={styles.filterTabs}>
                        <TouchableOpacity onPress={() => setFilterType('30Days')} style={[styles.filterTab, filterType === '30Days' && styles.filterTabActive]}>
                            <Text style={[styles.filterTabText, filterType === '30Days' && styles.filterTabTextActive]}>30 DAYS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setFilterType('Month')} style={[styles.filterTab, filterType === 'Month' && styles.filterTabActive]}>
                            <Text style={[styles.filterTabText, filterType === 'Month' && styles.filterTabTextActive]}>SELECT MONTH</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {filterType === 'Month' && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroller}>
                        {MONTHS.map((m, idx) => (
                            <TouchableOpacity key={m} style={[styles.monthItem, selectedMonth === idx && styles.monthItemActive]} onPress={() => setSelectedMonth(idx)}>
                                <Text style={[styles.monthText, selectedMonth === idx && styles.monthTextActive]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.tableCard}>
                    <ScrollView horizontal persistentScrollbar={true}>
                        <View>
                            <View style={styles.tableHead}>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.date }]}>DATE</Text>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.visual }]}>ATTENDANCE VISUAL</Text>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.inOut }]}>CHECK-IN</Text>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.breaks }]}>BREAKS</Text>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.inOut }]}>CHECK-OUT</Text>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.hrs }]}>GROSS HRS</Text>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.hrs, color: '#48327d' }]}>EFFECTIVE HRS</Text>
                                <Text style={[styles.headCell, { width: COL_WIDTHS.status }]}>ARRIVAL STATUS</Text>
                            </View>

                            {displayedLogs.map((log, index) => {
                                const s = calculateStats(log);
                                const [y, m, d] = log.date.split('-').map(Number);
                                const logDate = new Date(y, m - 1, d);
                                const isWeekend = logDate.getDay() === 0 || logDate.getDay() === 6;
                                const isHoliday = log.isHoliday;
                                const isToday = log.date === toLocalDateString(new Date());
                                const hasActivity = log.checkIn && log.checkIn !== '-';
                                const isApprovedLeave = !!log.leaveType;
                                const isAbsent = !isWeekend && !isHoliday && !isToday && !hasActivity && !isApprovedLeave;
                                const isOffRow = isWeekend || isHoliday || isAbsent || isApprovedLeave;

                                return (
                                    <View key={index} style={[styles.tableRow, isOffRow && styles.rowOff]}>
                                        <View style={[styles.cell, { width: COL_WIDTHS.date }]}>
                                            <Text style={styles.dateText}>
                                                {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}
                                            </Text>
                                            {isOffRow && (
                                                <Text style={[styles.offBadge, isAbsent && { backgroundColor: '#fef2f2', color: '#ef4444' }]}>
                                                    {isHoliday ? 'HOLIDAY' : isWeekend ? 'W-OFF' : isApprovedLeave ? (getLeaveCode(log.leaveType) || 'LEAVE') : 'ABSENT'}
                                                </Text>
                                            )}
                                        </View>

                                        {isOffRow ? (
                                            <>
                                                <View style={{ width: COL_WIDTHS.visual }} />
                                                <View style={{ width: COL_WIDTHS.inOut }} />
                                                <View style={{ width: COL_WIDTHS.breaks }} />
                                                <View style={{ width: COL_WIDTHS.inOut }} />
                                                <View style={[styles.cell, { flex: 1, paddingLeft: 12 }]}>
                                                    <Text style={[styles.offFullText, { textAlign: 'left' }]}>
                                                        {isHoliday ? 'Full day Holiday' : isWeekend ? 'Full day Weekly-off' : isApprovedLeave ? `Full Day ${getLeaveLabel(log.leaveType)}` : 'Absent'}
                                                    </Text>
                                                </View>
                                            </>
                                        ) : (
                                            <>
                                                <View style={[styles.cell, { width: COL_WIDTHS.visual }]}>
                                                    <View style={styles.visualBarTable}>
                                                        {getVisualSegments(log).map((seg, i) => (
                                                            <View key={i} style={[styles.visualSeg, { width: `${seg.width}%`, backgroundColor: seg.type === 'work' ? '#48327d' : 'transparent' }]} />
                                                        ))}
                                                    </View>
                                                </View>
                                                <Text style={[styles.cell, styles.timeText, { width: COL_WIDTHS.inOut }]}>{log.checkIn || '-'}</Text>
                                                <TouchableOpacity
                                                    style={[styles.cell, { width: COL_WIDTHS.breaks, alignItems: 'center' }]}
                                                    disabled={s.totalBreakMins === 0}
                                                    onPress={() => setActiveBreakLog(log)}
                                                >
                                                    {s.totalBreakMins > 0 ? (
                                                        <View style={styles.breakItemContainer}>
                                                            <View style={styles.infoSquare}>
                                                                <Text style={styles.infoIconText}>i</Text>
                                                            </View>
                                                            <Text style={styles.breakDurationText}>{s.totalBreakMins}m</Text>
                                                        </View>
                                                    ) : (
                                                        <Text style={styles.dashText}>-</Text>
                                                    )}
                                                </TouchableOpacity>
                                                <View style={[styles.cell, { width: COL_WIDTHS.inOut }]}>
                                                    {log.checkOut === '-' && log.checkIn !== '-' && log.date !== toLocalDateString(new Date()) ? (
                                                        <Text style={styles.missingCheckOutText}>Missed Check-Out</Text>
                                                    ) : (
                                                        <Text style={styles.timeText}>{log.checkOut || '-'}</Text>
                                                    )}
                                                </View>
                                                <Text style={[styles.cell, styles.durationText, { width: COL_WIDTHS.hrs }]}>{s.gross}</Text>
                                                <Text style={[styles.cell, styles.effText, { width: COL_WIDTHS.hrs }]}>{s.effective}</Text>
                                                <View style={[styles.cell, { width: COL_WIDTHS.status }]}>
                                                    {s.arrivalStatus !== '-' ? (
                                                        <Text style={[styles.statusTabText, { color: s.arrivalColor }]}>{s.arrivalStatus}</Text>
                                                    ) : <Text style={styles.dashText}>-</Text>}
                                                </View>
                                            </>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View >
            </ScrollView >
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 60 },
    welcomeSection: { marginBottom: 20 },
    greetingTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
    greetingSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
    loadingText: { marginTop: 12, color: '#64748b', fontWeight: 'bold' },

    card: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.02, elevation: 1 },
    cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#334155' },
    cardHeaderSectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 16 },

    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statsRowIdentity: { width: 110, flexDirection: 'row', alignItems: 'center', gap: 10 },
    statsIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    statsRowLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
    statsRowMetric: { flex: 1, alignItems: 'center' },
    smallMetricLabel: { fontSize: 8, fontWeight: '800', color: '#8e78b0', letterSpacing: 0.2, marginBottom: 4, textTransform: 'uppercase', textAlign: 'center', lineHeight: 10 },
    statsRowValue: { fontSize: 18, fontWeight: '900', color: '#1e293b' },

    daySelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    dayItem: { alignItems: 'center' },
    dayCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    dayCircleActive: { backgroundColor: '#48327d' },
    dayCircleToday: { backgroundColor: 'rgba(72, 50, 125, 0.08)', borderWidth: 1, borderColor: 'rgba(72, 50, 125, 0.2)' },
    dayCircleInactive: { backgroundColor: '#f8fafc' },
    dayTextAbbr: { fontSize: 12, fontWeight: '800' },
    dayTextActive: { color: 'white' },
    dayTextToday: { color: '#48327d' },
    dayTextInactive: { color: '#64748b' },
    todayOuterDot: { position: 'absolute', top: -2, right: -2, width: 9, height: 9, backgroundColor: 'white', borderRadius: 4.5, justifyContent: 'center', alignItems: 'center' },
    todayInnerDot: { width: 6, height: 6, backgroundColor: '#ef4444', borderRadius: 3 },

    timingDetails: { paddingTop: 4 },
    timingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    timingDayFull: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
    timingDateSmall: { fontSize: 12, color: '#64748b', fontWeight: '500' },
    shiftBadge: { backgroundColor: 'rgba(72, 50, 125, 0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    shiftBadgeText: { fontSize: 10, color: '#48327d', fontWeight: '800' },

    progressSection: { marginTop: 4 },
    visualBar: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, width: '100%', overflow: 'hidden', flexDirection: 'row', marginBottom: 12 },
    visualBarTable: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, width: '100%', overflow: 'hidden', flexDirection: 'row' },
    visualSeg: { height: '100%' },
    timingFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timingFooterText: { fontSize: 12, fontWeight: '700', color: '#8e78b0' },
    timingFooterBreak: { flexDirection: 'row', alignItems: 'center' },

    actionGrid: { flexDirection: 'row', gap: 0 },
    actionTimeSide: { flex: 1.2, paddingRight: 16, borderRightWidth: 1, borderRightColor: '#f1f5f9', justifyContent: 'center' },
    actionClockText: { fontSize: 20, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
    actionDateText: { fontSize: 11, color: '#8e78b0', fontWeight: '700', marginTop: 4 },
    debugInfoBox: { marginTop: 8 },
    debugInfoText: { fontSize: 9, color: '#94a3b8', lineHeight: 12 },
    actionLinksSide: { flex: 1.5, paddingLeft: 16, gap: 10 },
    actionLinkItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionLinkIcon: { fontSize: 12, color: '#48327d', width: 16, textAlign: 'center' },
    actionLabel: { fontSize: 12, fontWeight: '600', color: '#48327d' },

    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#334155' },
    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
    filterTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 3 },
    filterTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
    filterTabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
    filterTabText: { fontSize: 9, fontWeight: '900', color: '#94a3b8' },
    filterTabTextActive: { color: '#6366f1' },

    monthScroller: { marginBottom: 16 },
    monthItem: { paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#f1f5f9' },
    monthItemActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    monthText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
    monthTextActive: { color: 'white' },

    tableCard: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.02, elevation: 1 },
    tableHead: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 14 },
    headCell: { fontSize: 9, fontWeight: '900', color: '#94a3b8', textAlign: 'center', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 14, alignItems: 'center' },
    rowOff: { backgroundColor: '#f5f5f5' },
    cell: { paddingHorizontal: 12, justifyContent: 'center' },
    dateText: { fontSize: 12, fontWeight: '800', color: '#334155', textAlign: 'center' },
    offBadge: { fontSize: 8, fontWeight: 'bold', color: '#48327d', backgroundColor: '#d1d5db', alignSelf: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    offFullText: { fontSize: 12, color: '#334155', fontWeight: '600' },
    timeText: { fontSize: 11, fontWeight: '600', color: '#334155', textAlign: 'center' },
    breakItemContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoSquare: { width: 18, height: 18, backgroundColor: '#98a5b2', borderRadius: 3, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },
    infoIconText: { color: 'white', fontSize: 12, fontWeight: '900', fontStyle: 'italic' },
    breakDurationText: { fontSize: 14, fontWeight: '700', color: '#6e77ef' },
    durationText: { fontSize: 11, fontWeight: '600', color: '#334155', textAlign: 'center' },
    effText: { fontSize: 12, fontWeight: '900', color: '#48327d', textAlign: 'center' },
    statusTabText: { fontSize: 10, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
    dashText: { fontSize: 12, color: '#cbd5e1', textAlign: 'center' },
    missingCheckOutText: { fontSize: 8, fontWeight: '900', color: '#ef4444', textAlign: 'center', textTransform: 'uppercase', backgroundColor: '#fef2f2', paddingVertical: 2, paddingHorizontal: 4, borderRadius: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 320, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 14, fontWeight: '900', color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 },
    closeBtn: { fontSize: 16, color: '#94a3b8', fontWeight: 'bold' },
    modalBody: { gap: 12 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalRowLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
    modalRowInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    modalRowTime: { fontSize: 11, fontWeight: '800', color: '#1e293b' },
    modalRowDuration: { fontSize: 11, fontWeight: '900', color: '#48327d' },
    noBreakText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 10 },
    modalFooter: { marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
    modalTotalLabel: { fontSize: 11, fontWeight: '900', color: '#94a3b8' },
    modalTotalValue: { fontSize: 12, fontWeight: '900', color: '#6366f1' }
});

export default MeScreen;
