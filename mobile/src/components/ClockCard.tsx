import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPinIcon } from './Icons';
import { normalize, wp, hp } from '../utils/responsive';

interface ClockCardProps {
    currentTime: Date;
    isClockedIn: boolean | null;
    isLoadingLocation: boolean;
    locationState: string | null;
    handleClockAction: () => void;
    canClock?: boolean;
    disabledReason?: string | null;
    isPendingOverride?: boolean;
    onRetry?: () => void;
}




const ClockCard: React.FC<ClockCardProps> = ({
    currentTime,
    isClockedIn,
    isLoadingLocation,
    locationState,
    handleClockAction,
    canClock = true,
    isPendingOverride = false,
    disabledReason,
    onRetry
}) => {

    const lowerReason = disabledReason?.toLowerCase() || '';
    const isOnLeave = lowerReason.includes('leave');
    const isAbsent = lowerReason.includes('absent');
    const isError = disabledReason === 'Status check failed' || lowerReason.includes('error') || lowerReason.includes('create an account');

    // Format date similar to web: "Mon, 09 Feb, 2026"
    const dateStr = currentTime.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    // Format time parts
    const hours = currentTime.getHours();
    const isPM = hours >= 12;
    const hour12 = hours % 12 || 12;
    const hourStr = hour12.toString().padStart(2, '0');
    const minuteStr = currentTime.getMinutes().toString().padStart(2, '0');
    const secondStr = currentTime.getSeconds().toString().padStart(2, '0');
    const ampmStr = isPM ? 'PM' : 'AM';

    // Button is disabled if:
    // 1. Location is currently loading
    // 2. User is Absent (Absent status blocks clocking)
    // 3. User cannot clock AND is not on Leave AND is not in Error state
    //    (Being on Leave acts as an override to allow clocking even if canClock is false)
    const isButtonDisabled = isLoadingLocation || isAbsent || (!canClock && !isError && !isOnLeave);

    return (
        <View style={styles.card}>
            {/* Header: Date and Status Badge */}
            <View style={styles.header}>
                <Text style={styles.dateText}>Time Today - {dateStr}</Text>
                {(disabledReason || isPendingOverride) && (
                    <View style={[
                        styles.badge,
                        isError && { backgroundColor: '#fee2e2' },
                        isPendingOverride && { backgroundColor: '#f5f3ff' }
                    ]}>
                        <Text style={[
                            styles.badgeText,
                            isError && { color: '#ef4444' },
                            isPendingOverride && { color: '#7c3aed' }
                        ]}>
                            {isPendingOverride ? 'PENDING OVERRIDE' : disabledReason?.toUpperCase()}
                        </Text>
                    </View>
                )}

            </View>

            {/* Body: Time and Button */}
            <View style={styles.body}>
                <View>
                    <Text style={styles.timeLabel}>{isOnLeave ? 'LEAVE STATUS' : isAbsent ? 'ABSENT STATUS' : 'CURRENT TIME'}</Text>
                    {isOnLeave ? (
                        <Text style={styles.statusText}>{disabledReason}</Text>
                    ) : isAbsent ? (
                        <Text style={styles.statusText}>{disabledReason}</Text>
                    ) : (
                        <View style={styles.timeContainer}>
                            <Text style={styles.bigTime}>{hourStr}:{minuteStr}</Text>
                            <Text style={styles.seconds}>:{secondStr}</Text>
                            <Text style={styles.ampm}>{ampmStr}</Text>
                        </View>
                    )}
                </View>

                <View>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            isButtonDisabled && styles.buttonDisabled,
                            isError && { backgroundColor: '#fffbe6' }
                        ]}
                        onPress={isError && onRetry ? onRetry : handleClockAction}
                        disabled={isButtonDisabled}
                        activeOpacity={0.8}
                    >
                        {isLoadingLocation || (isClockedIn === null && !isOnLeave && !isAbsent && !isError) ? (
                            <ActivityIndicator size="small" color="#8e78b0" />
                        ) : (
                            <Text style={[styles.buttonText, isError && { color: '#d97706' }]}>
                                {isError ? 'RETRY' : isClockedIn ? 'Check-Out' : 'Check-In'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {!isOnLeave && !isAbsent && (locationState || isLoadingLocation) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <MapPinIcon size={12} color="white" style={{ marginRight: 4, opacity: 0.8 }} />
                    <Text style={styles.locationText} numberOfLines={3}>
                        {locationState || "Fetching location..."}
                    </Text>
                </View>
            )}
        </View >
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#6366f1',
        borderRadius: normalize(16),
        padding: wp(4),
        minHeight: hp(18),
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: hp(2),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2),
        opacity: 0.9,
    },
    dateText: {
        color: 'white',
        fontSize: normalize(13),
        fontWeight: '500',
    },
    badge: {
        backgroundColor: 'white',
        borderRadius: normalize(12),
        paddingHorizontal: wp(2),
        paddingVertical: hp(0.3),
    },
    badgeText: {
        color: '#6366f1',
        fontSize: normalize(10),
        fontWeight: 'bold',
    },
    body: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    timeLabel: {
        color: 'white',
        fontSize: normalize(10),
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: hp(0.5),
        opacity: 0.8,
        textTransform: 'uppercase',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    bigTime: {
        color: 'white',
        fontSize: normalize(32),
        fontWeight: '600',
        letterSpacing: -1,
    },
    seconds: {
        color: 'white',
        fontSize: normalize(16),
        opacity: 0.8,
        marginHorizontal: wp(0.5),
    },
    ampm: {
        color: 'white',
        fontSize: normalize(16),
        marginLeft: wp(0.5),
        fontWeight: '400',
    },
    button: {
        backgroundColor: 'white',
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(5),
        borderRadius: normalize(12),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        minWidth: wp(28),
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#6366f1',
        fontWeight: '800',
        fontSize: normalize(14),
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationText: {
        color: 'white',
        fontSize: normalize(10),
        opacity: 0.8,
        fontWeight: '500',
    },
    onLeaveCard: {
        backgroundColor: '#10b981',
    },
    onAbsentCard: {
        backgroundColor: '#ef4444',
    },
    onLeaveBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
    },
    onAbsentBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
    },
    onStatusBadgeText: {
        color: 'white',
    },
    statusText: {
        color: 'white',
        fontSize: normalize(22),
        fontWeight: 'bold',
    },
    statusIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: wp(2),
        borderRadius: normalize(25),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    }
});


export default ClockCard;
