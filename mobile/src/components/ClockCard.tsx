import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { MapPinIcon } from './Icons';

interface ClockCardProps {
    currentTime: Date;
    isClockedIn: boolean | null;
    isLoadingLocation: boolean;
    locationState: string | null;
    handleClockAction: () => void;
    canClock?: boolean;
    disabledReason?: string | null;
}

const { width } = Dimensions.get('window');

const ClockCard: React.FC<ClockCardProps> = ({
    currentTime,
    isClockedIn,
    isLoadingLocation,
    locationState,
    handleClockAction,
    canClock = true,
    disabledReason
}) => {
    const isOnLeave = disabledReason?.toLowerCase() === 'on leave' || disabledReason?.toLowerCase() === 'leave';
    const isAbsent = disabledReason?.toLowerCase() === 'absent';

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

    return (
        <View style={[styles.card, isOnLeave && styles.onLeaveCard, isAbsent && styles.onAbsentCard]}>
            {/* Header: Date and Status Badge */}
            <View style={styles.header}>
                <Text style={styles.dateText}>Time Today - {dateStr}</Text>
                {disabledReason && (
                    <View style={[styles.badge, isOnLeave && styles.onLeaveBadge, isAbsent && styles.onAbsentBadge]}>
                        <Text style={[styles.badgeText, (isOnLeave || isAbsent) && styles.onStatusBadgeText]}>{disabledReason.toUpperCase()}</Text>
                    </View>
                )}
            </View>

            {/* Body: Time and Button */}
            <View style={styles.body}>
                <View>
                    <Text style={styles.timeLabel}>{isOnLeave ? 'LEAVE STATUS' : isAbsent ? 'ABSENT STATUS' : 'CURRENT TIME'}</Text>
                    {isOnLeave ? (
                        <Text style={styles.statusText}>On Approved Leave</Text>
                    ) : isAbsent ? (
                        <Text style={styles.statusText}>Marked as Absent</Text>
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
                            (isOnLeave || isAbsent || !canClock || isLoadingLocation) && styles.buttonDisabled
                        ]}
                        onPress={handleClockAction}
                        disabled={isOnLeave || isAbsent || !canClock || isLoadingLocation}
                        activeOpacity={0.8}
                    >
                        {isLoadingLocation || (isClockedIn === null && !isOnLeave && !isAbsent) ? (
                            <ActivityIndicator size="small" color="#8e78b0" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isClockedIn ? 'Check-Out' : 'Check-In'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {locationState && !isOnLeave && !isAbsent && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MapPinIcon size={12} color="white" style={{ marginRight: 4, opacity: 0.8 }} />
                    <Text style={styles.locationText} numberOfLines={3}>
                        {locationState}
                    </Text>
                </View>
            )}
        </View >
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#8e78b0',
        borderRadius: 16,
        padding: 16,
        minHeight: 140,
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        opacity: 0.9,
    },
    dateText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
    },
    badge: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        color: '#8e78b0',
        fontSize: 10,
        fontWeight: 'bold',
    },
    body: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    timeLabel: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 4,
        opacity: 0.8,
        textTransform: 'uppercase',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    bigTime: {
        color: 'white',
        fontSize: 32, // Matches text-4xl/5xl roughly
        fontWeight: '300',
    },
    seconds: {
        color: 'white',
        fontSize: 16,
        opacity: 0.8,
        marginHorizontal: 2,
    },
    ampm: {
        color: 'white',
        fontSize: 16,
        marginLeft: 2,
        fontWeight: '400',
    },
    button: {
        backgroundColor: 'white',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        elevation: 1,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#8e78b0',
        fontWeight: '700',
        fontSize: 13,
    },
    locationText: {
        color: 'white',
        fontSize: 10,
        marginTop: 12,
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
        fontSize: 22,
        fontWeight: 'bold',
    },
    statusIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 8,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    }
});


export default ClockCard;
