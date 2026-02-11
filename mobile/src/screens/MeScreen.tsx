import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Modal, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Geolocation from '@react-native-community/geolocation';
import { attendanceApi, teamApi } from '../services/api';
import { ChevronDownIcon, MoreVerticalIcon, UserIcon, UsersIcon, CoffeeIcon, UmbrellaIcon, PartyPopperIcon, HomeIcon } from '../components/Icons';
import RegularizeModal from '../components/RegularizeModal';

const { width } = Dimensions.get('window');

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
                <Text style={styles.debugInfoText}>ID: {user.id} | St: {clockStatus || 'UNKNOWN'}</Text>
                <Text style={styles.debugInfoText}>LastLog: {debugInfo ? `${debugInfo.last_log_id}` : 'None'}</Text>
            </View>
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
    const [requestType, setRequestType] = useState<'employee' | 'manager'>(user?.is_manager ? 'manager' : 'employee');

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
        if (user?.id) {
            fetchData();
        }
    }, [user, statsDuration]);

    useEffect(() => {
        if (user?.id && activeTab === 'Requests') {
            fetchRequests();
        }
    }, [user, requestType, activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [history, status, stats] = await Promise.all([
                attendanceApi.getHistory(user.id),
                attendanceApi.getStatus(user.id),
                teamApi.getStats(user.team_ids || user.team_id, statsDuration)
            ]);
            setLogs(history);
            setClockStatus(status.status);
            setCanClock(status.can_clock !== undefined ? status.can_clock : true);
            setDisabledReason(status.disabled_reason);
            setDebugInfo(status.debug);
            setTeamStats(stats);

            // Set today as selected day in timing card
            const todayStr = toLocalDateString(new Date());
            const day = new Date().getDay();
            const diff = (day === 0 ? 6 : day - 1); // 0-indexed Mon-Sun
            setSelectedDayIndex(diff);

        } catch (error) {
            console.log("Error fetching data:", error);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

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

    const handleClockAction = async () => {
        setClockLoading(true);
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
        if (!log || log.checkIn === '-' || !log.checkIn) {
            return { gross: '-', effective: '-', status: log?.status || 'Not Marked', effectiveProgress: 0, arrivalStatus: '-', arrivalColor: '#94a3b8', totalBreakMins: 0 };
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
        if (checkInT && (checkInT.h * 60 + checkInT.m > 9 * 60 + 30)) { arrivalStatus = 'Late'; arrivalColor = '#ef4444'; }
        return { gross: formatDuration(grossMins), effective: formatDuration(effectiveMins), status: log.status, effectiveProgress: Math.min(100, (effectiveMins / (9 * 60)) * 100), arrivalStatus, arrivalColor, totalBreakMins };
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
    const todayStr = toLocalDateString(new Date());

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

            <View style={[styles.card, { marginBottom: 16, zIndex: 10 }]}>
                <View style={styles.cardHeaderFlex}>
                    <View style={{ position: 'relative', zIndex: 20 }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }} onPress={() => setShowDurationDropdown(!showDurationDropdown)}>
                            <Text style={styles.cardHeaderTitle}>{statsDuration}</Text>
                            <ChevronDownIcon size={16} color="#48327d" />
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
                        <View style={styles.statsIconCircle}><UserIcon color="#48327d" size={18} /></View>
                        <Text style={styles.statsRowLabel}>Me</Text>
                    </View>
                    <View style={styles.statsRowMetric}>
                        <Text style={styles.smallMetricLabel}>AVG HRS /{"\n"}DAY</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                            <Text style={styles.statsRowValue}>{meStats.avg.split(' ')[0]}</Text>
                            <Text style={[styles.statsRowValue, { fontSize: 13, marginLeft: 2, opacity: 0.7 }]}>{meStats.avg.split(' ')[1]}</Text>
                        </View>
                    </View>
                    <View style={styles.statsRowMetric}>
                        <Text style={styles.smallMetricLabel}>ON TIME{"\n"}ARRIVAL</Text>
                        <Text style={[styles.statsRowValue, { fontSize: 24, marginTop: 4 }]}>{meStats.onTime}</Text>
                    </View>
                </View>
                {teamStats && (teamStats.avg_working_hours || teamStats.on_time_arrival) && (
                    <View style={[styles.statsRow, { marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 }]}>
                        <View style={styles.statsRowIdentity}>
                            <View style={[styles.statsIconCircle, { backgroundColor: '#fcfaff' }]}><UsersIcon color="#48327d" size={18} /></View>
                            <Text style={styles.statsRowLabel}>My Team</Text>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>AVG HRS /{"\n"}DAY</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={styles.statsRowValue}>{(teamStats?.avg_working_hours || '0h 00m').split(' ')[0]}</Text>
                                <Text style={[styles.statsRowValue, { fontSize: 13, marginLeft: 2, opacity: 0.7 }]}>{(teamStats?.avg_working_hours || '0h 00m').split(' ')[1] || '00m'}</Text>
                            </View>
                        </View>
                        <View style={styles.statsRowMetric}>
                            <Text style={styles.smallMetricLabel}>ON TIME{"\n"}ARRIVAL</Text>
                            <Text style={[styles.statsRowValue, { fontSize: 24, marginTop: 4 }]}>{teamStats?.on_time_arrival || '0%'}</Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={[styles.card, { marginBottom: 16 }]}>
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
                            <Text style={styles.shiftBadgeText}>{(() => {
                                const dayOfWeek = new Date(activeDayLog.date).getDay();
                                return (dayOfWeek === 0 || dayOfWeek === 6) ? "Week Off" : "09:30 AM - 06:30 PM";
                            })()}</Text>
                        </View>
                    </View>
                    {(() => {
                        const isWeekend = [0, 6].includes(new Date(activeDayLog.date).getDay());
                        const isApprovedLeave = !!activeDayLog.leaveType;
                        const isHoliday = activeDayLog.isHoliday;
                        if (isWeekend || isApprovedLeave || isHoliday) {
                            return <View style={styles.progressSection}><Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 }}>{isHoliday ? `Holiday: ${activeDayLog.holidayName}` : isWeekend ? 'Weekend' : getLeaveLabel(activeDayLog.leaveType)}</Text></View>;
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
                                    <View style={styles.timingFooterBreak}><CoffeeIcon color="#64748b" size={14} style={{ marginRight: 4 }} /><Text style={styles.timingFooterText}>{activeTiming.totalBreakMins} min</Text></View>
                                </View>
                            </View>
                        );
                    })()}
                </View>
            </View>

            <View style={[styles.card, { marginBottom: 24 }]}>
                <Text style={styles.cardHeaderSectionTitle}>Actions</Text>
                <View style={styles.actionGrid}>
                    <LiveDateTime user={user} clockStatus={clockStatus} debugInfo={debugInfo} />
                    <View style={styles.actionLinksSide}>
                        <TouchableOpacity style={[styles.actionLinkItem, clockLoading && { opacity: 0.6 }]} onPress={handleClockAction} disabled={clockLoading || !canClock}>
                            <View style={{ width: 24, alignItems: 'center' }}>
                                {disabledReason === 'On Leave' ? <UmbrellaIcon color="#94a3b8" size={18} /> : disabledReason === 'Holiday' ? <PartyPopperIcon color="#94a3b8" size={18} /> : <Text style={styles.actionLinkIcon}>{clockStatus === 'IN' ? '⇠' : '➔'}</Text>}
                            </View>
                            <Text style={styles.actionLabel}>{clockStatus === 'IN' ? 'Web Clock-Out' : 'Web Clock-In'}{disabledReason ? ` (${disabledReason})` : ''}</Text>
                            {clockLoading && <ActivityIndicator size="small" color="#48327d" style={{ marginLeft: 8 }} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionLinkItem}><HomeIcon color="#48327d" size={14} style={styles.actionLinkIcon} /><Text style={styles.actionLabel}>Work From Home</Text></TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.tableHeader}>
                <Text style={styles.sectionTitle}>Attendance Logs</Text>
                <View style={styles.filterTabs}>
                    <TouchableOpacity onPress={() => setFilterType('30Days')} style={[styles.filterTab, filterType === '30Days' && styles.filterTabActive]}><Text style={[styles.filterTabText, filterType === '30Days' && styles.filterTabTextActive]}>30 DAYS</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setFilterType('Month')} style={[styles.filterTab, filterType === 'Month' && styles.filterTabActive]}><Text style={[styles.filterTabText, filterType === 'Month' && styles.filterTabTextActive]}>SELECT MONTH</Text></TouchableOpacity>
                </View>
            </View>

            <View style={styles.mainTabsContainer}>
                <TouchableOpacity style={[styles.mainTab, activeTab === 'Log' && styles.mainTabActive]} onPress={() => setActiveTab('Log')}><Text style={[styles.mainTabText, activeTab === 'Log' && styles.mainTabTextActive]}>ATTENDANCE LOG</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.mainTab, activeTab === 'Requests' && styles.mainTabActive]} onPress={() => setActiveTab('Requests')}><Text style={[styles.mainTabText, activeTab === 'Requests' && styles.mainTabTextActive]}>REQUESTS</Text></TouchableOpacity>
            </View>

            {activeTab === 'Log' && filterType === 'Month' && (
                <View style={styles.monthScrollerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroller} contentContainerStyle={styles.monthScrollerContent}>
                        {MONTHS.map((m, idx) => {
                            const currentMonth = new Date().getMonth();
                            if (idx > currentMonth) return null;
                            return (
                                <TouchableOpacity key={m} style={[styles.monthItem, selectedMonth === idx && styles.monthItemActive]} onPress={() => setSelectedMonth(idx)}><Text style={[styles.monthText, selectedMonth === idx && styles.monthTextActive]}>{m}</Text></TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {activeTab === 'Log' && (
                <View style={styles.tableCard}>
                    <ScrollView horizontal persistentScrollbar={true}>
                        <View>
                            <View style={styles.tableHead}>
                                {['DATE', 'ATTENDANCE VISUAL', 'CHECK-IN', 'BREAKS', 'CHECK-OUT', 'GROSS HRS', 'EFFECTIVE HRS', 'ARRIVAL STATUS'].map((h, i) => (
                                    <Text key={h} style={[styles.headCell, { width: Object.values(COL_WIDTHS)[i > 4 ? 4 : i] || 100 }, i === 6 && { color: '#48327d' }]}>{h}</Text>
                                ))}
                            </View>
                            {displayedLogs.map((log, index) => {
                                const s = calculateStats(log);
                                const isWeekend = new Date(log.date).getDay() === 0 || new Date(log.date).getDay() === 6;
                                const isTodayVal = log.date === todayStr;
                                const hasActivity = (log.checkIn && log.checkIn !== '-') || (log.logs && log.logs.length > 0);
                                const showAsOff = (isWeekend || log.isHoliday || !!log.leaveType || (!isTodayVal && !hasActivity)) && !hasActivity;
                                return (
                                    <View key={index} style={[styles.tableRow, showAsOff && styles.rowOff]}>
                                        <View style={[styles.cell, { width: COL_WIDTHS.date }]}>
                                            <Text style={styles.dateText}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                                            {showAsOff && <Text style={styles.offBadge}>{log.isHoliday ? 'HOLIDAY' : isWeekend ? 'W-OFF' : !!log.leaveType ? 'LEAVE' : 'ABSENT'}</Text>}
                                        </View>
                                        {showAsOff ? <View style={{ flex: 1, paddingLeft: 12 }}><Text style={styles.offFullText}>{log.isHoliday ? 'Holiday' : isWeekend ? 'Weekly-off' : !!log.leaveType ? 'Leave' : 'Absent'}</Text></View> : (
                                            <>
                                                <View style={[styles.cell, { width: COL_WIDTHS.visual }]}><View style={styles.visualBarTable}>{getVisualSegments(log).map((seg, i) => <View key={i} style={[styles.visualSeg, { width: `${seg.width}%`, backgroundColor: seg.type === 'work' ? '#48327d' : 'transparent' }]} />)}</View></View>
                                                <Text style={[styles.cell, styles.timeText, { width: COL_WIDTHS.inOut }]}>{log.checkIn || '-'}</Text>
                                                <TouchableOpacity style={[styles.cell, { width: COL_WIDTHS.breaks, alignItems: 'center' }]} disabled={s.totalBreakMins === 0} onPress={() => setActiveBreakLog(log)}>
                                                    {s.totalBreakMins > 0 ? <View style={styles.breakItemContainer}><View style={styles.infoSquare}><Text style={styles.infoIconText}>i</Text></View><Text style={styles.breakDurationText}>{s.totalBreakMins}m</Text></View> : <Text style={styles.dashText}>-</Text>}
                                                </TouchableOpacity>
                                                <View style={[styles.cell, { width: COL_WIDTHS.inOut }]}>
                                                    {log.checkOut === '-' && log.checkIn !== '-' && !isTodayVal ? (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                            <View style={styles.missedCheckOutBadge}><Text style={styles.missedCheckOutText}>MISSED</Text></View>
                                                            <TouchableOpacity onPress={() => { setActiveRegularizeLog(log); setRegularizeModalVisible(true); }}><MoreVerticalIcon size={16} color="#1e293b" /></TouchableOpacity>
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
                data={activeTab === 'Requests' ? requests : []}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={renderHeader}
                renderItem={({ item: req }) => (
                    <View style={styles.requestCard}>
                        <View style={styles.requestCardHeader}>
                            <View>
                                <Text style={styles.requestEmpName}>{req.employee_name}</Text>
                                <View style={styles.requestBadgeRow}>
                                    <View style={styles.requestEmpIdBadge}><Text style={styles.requestEmpIdText}>{req.employee_id}</Text></View>
                                    <View style={[styles.requestStatusBadge, { borderColor: req.status === 'Approved' ? '#10b98120' : req.status === 'Rejected' ? '#ef444420' : '#f59e0b20' }]}>
                                        <Text style={[styles.requestStatusText, { color: req.status === 'Approved' ? '#10b981' : req.status === 'Rejected' ? '#ef4444' : '#f59e0b' }]}>{req.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.requestDate}>{req.attendance.date}</Text>
                                <Text style={styles.requestCreated}>{new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                            </View>
                        </View>
                        <View style={styles.requestReasonBox}>
                            <Text style={styles.requestReasonText}><Text style={styles.requestLabel}>Reason: </Text>{req.reason}</Text>
                            <View style={styles.requestTimingRow}>
                                <View><Text style={styles.requestSubLabel}>CHECK IN</Text><Text style={styles.requestTimingValue}>{req.attendance.check_in}</Text></View>
                                <View><Text style={styles.requestSubLabel}>REQ OUT</Text><Text style={styles.requestTimingValue}>{req.requested_checkout}</Text></View>
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
    scrollContent: { padding: 16, paddingBottom: 60 },
    welcomeSection: { marginBottom: 24, paddingHorizontal: 4 },
    greetingTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b', letterSpacing: -0.8 },
    greetingSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },
    loadingText: { marginTop: 12, color: '#64748b', fontWeight: '700' },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
    cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b', letterSpacing: -0.2 },
    cardHeaderSectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
    dropdownMenu: { position: 'absolute', top: 30, left: 0, backgroundColor: 'white', borderRadius: 8, padding: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, minWidth: 120, borderWidth: 1, borderColor: '#f1f5f9', zIndex: 50 },
    dropdownItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
    dropdownItemText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statsRowIdentity: { flex: 0.8, flexDirection: 'row', alignItems: 'center', gap: 12 },
    statsIconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
    statsRowLabel: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
    statsRowMetric: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
    smallMetricLabel: { fontSize: 8, fontWeight: '900', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase', textAlign: 'center', lineHeight: 10 },
    statsRowValue: { fontSize: 22, fontWeight: '900', color: '#48327d', letterSpacing: -0.5 },
    daySelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, width: '100%' },
    dayItem: { flex: 1, alignItems: 'center' },
    dayCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    dayCircleActive: { backgroundColor: '#48327d', elevation: 4 },
    dayCircleToday: { backgroundColor: 'rgba(72, 50, 125, 0.06)', borderWidth: 1.5, borderColor: 'rgba(72, 50, 125, 0.15)' },
    dayCircleInactive: { backgroundColor: '#f8fafc' },
    dayTextAbbr: { fontSize: 11, fontWeight: '900' },
    dayTextActive: { color: 'white' },
    dayTextToday: { color: '#48327d' },
    dayTextInactive: { color: '#94a3b8' },
    todayOuterDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, backgroundColor: 'white', borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
    todayInnerDot: { width: 6, height: 6, backgroundColor: '#ef4444', borderRadius: 3 },
    timingDetails: { paddingTop: 0 },
    timingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    timingDayFull: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
    shiftBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    shiftBadgeText: { fontSize: 10, color: '#48327d', fontWeight: '800' },
    progressSection: { marginTop: 0 },
    visualBar: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 5, width: '100%', overflow: 'hidden', flexDirection: 'row', marginBottom: 16 },
    visualBarTable: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, width: '100%', overflow: 'hidden', flexDirection: 'row' },
    visualSeg: { height: '100%' },
    timingFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timingFooterText: { fontSize: 13, fontWeight: '800', color: '#48327d' },
    timingFooterBreak: { flexDirection: 'row', alignItems: 'center' },
    actionGrid: { flexDirection: 'row', alignItems: 'center' },
    actionTimeSide: { flex: 1.2, paddingRight: 20, borderRightWidth: 1, borderRightColor: '#f1f5f9' },
    actionClockText: { fontSize: 24, fontWeight: '900', color: '#1e293b', letterSpacing: -0.8 },
    actionDateText: { fontSize: 12, color: '#94a3b8', fontWeight: '700', marginTop: 4 },
    debugInfoBox: { marginTop: 10, opacity: 0.6 },
    debugInfoText: { fontSize: 9, color: '#94a3b8', lineHeight: 12, fontWeight: '500' },
    actionLinksSide: { flex: 1.5, paddingLeft: 24, gap: 14 },
    actionLinkItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    actionLinkIcon: { fontSize: 14, color: '#48327d', width: 20, textAlign: 'center' },
    actionLabel: { fontSize: 13, fontWeight: '700', color: '#48327d', flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10, paddingHorizontal: 4 },
    filterTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
    filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    filterTabActive: { backgroundColor: 'white', elevation: 1 },
    filterTabText: { fontSize: 10, fontWeight: '900', color: '#94a3b8' },
    filterTabTextActive: { color: '#48327d' },
    mainTabsContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, marginHorizontal: 20, marginBottom: 16 },
    mainTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
    mainTabActive: { backgroundColor: 'white', elevation: 1 },
    mainTabText: { fontSize: 13, fontWeight: '700', color: '#94a3b8' },
    mainTabTextActive: { color: '#48327d' },
    monthScrollerContainer: { marginBottom: 16, marginHorizontal: 20 },
    monthScroller: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4 },
    monthScrollerContent: { paddingRight: 4 },
    monthItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginRight: 4 },
    monthItemActive: { backgroundColor: 'white', elevation: 1 },
    monthText: { fontSize: 11, fontWeight: '900', color: '#94a3b8' },
    monthTextActive: { color: '#48327d' },
    tableCard: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', elevation: 1 },
    tableHead: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 16 },
    headCell: { fontSize: 9, fontWeight: '900', color: '#94a3b8', textAlign: 'center', letterSpacing: 0.8 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 16, alignItems: 'center' },
    rowOff: { backgroundColor: '#fcfcfd' },
    cell: { paddingHorizontal: 16, justifyContent: 'center' },
    dateText: { fontSize: 13, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
    offBadge: { fontSize: 8, fontWeight: '900', color: '#48327d', backgroundColor: '#f3e8ff', alignSelf: 'center', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginTop: 5 },
    offFullText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    timeText: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'center' },
    breakItemContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoSquare: { width: 20, height: 20, backgroundColor: '#cbd5e1', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    infoIconText: { color: 'white', fontSize: 11, fontWeight: '900' },
    breakDurationText: { fontSize: 14, fontWeight: '800', color: '#48327d' },
    durationText: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'center' },
    effText: { fontSize: 12, fontWeight: '900', color: '#48327d', textAlign: 'center' },
    statusTabText: { fontSize: 10, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
    dashText: { fontSize: 12, color: '#e2e8f0', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 24, width: '100%', maxWidth: 340, padding: 24, elevation: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' },
    closeBtn: { fontSize: 18, color: '#94a3b8', fontWeight: 'bold' },
    modalBody: { gap: 16 },
    modalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalRowLabel: { fontSize: 13, color: '#64748b', fontWeight: '700' },
    modalRowInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    modalRowTime: { fontSize: 12, fontWeight: '800', color: '#1e293b' },
    modalRowDuration: { fontSize: 12, fontWeight: '900', color: '#48327d' },
    noBreakText: { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 },
    modalFooter: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
    modalTotalLabel: { fontSize: 12, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
    modalTotalValue: { fontSize: 14, fontWeight: '900', color: '#48327d' },
    missedCheckOutBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#ef444410' },
    missedCheckOutText: { fontSize: 9, fontWeight: '900', color: '#ef4444', textTransform: 'uppercase' },

    requestCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 16, marginHorizontal: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 1 },
    requestCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    requestEmpName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    requestBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    requestEmpIdBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    requestEmpIdText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
    requestStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    requestStatusText: { fontSize: 9, fontWeight: '900' },
    requestDate: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
    requestCreated: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
    requestReasonBox: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#f1f5f9' },
    requestReasonText: { fontSize: 13, color: '#334155', lineHeight: 20 },
    requestLabel: { fontWeight: '700', color: '#64748b', fontSize: 11, textTransform: 'uppercase' },
    requestTimingRow: { flexDirection: 'row', marginTop: 12, gap: 24 },
    requestSubLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '800', marginBottom: 2 },
    requestTimingValue: { fontSize: 14, color: '#1e293b', fontWeight: '700' },
    requestActions: { flexDirection: 'row', gap: 12 },
    approveBtn: { flex: 1, backgroundColor: '#ecfdf5', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#10b98120' },
    approveBtnText: { color: '#10b981', fontWeight: '900', fontSize: 12 },
    rejectBtn: { flex: 1, backgroundColor: '#fef2f2', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ef444420' },
    rejectBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 12 },
    requestFilterContainer: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 12 },
    requestFilterBtn: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    requestFilterBtnActive: { backgroundColor: '#48327d' },
    requestFilterText: { color: '#64748b', fontWeight: '700', fontSize: 12 },
    requestFilterTextActive: { color: 'white' },
    emptyRequests: { padding: 60, alignItems: 'center' },
    emptyRequestsText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' }
});

export default MeScreen;
