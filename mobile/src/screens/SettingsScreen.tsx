import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MailIcon, PhoneIcon, MapPinIcon, IdCardIcon, BriefcaseIcon, UsersIcon, CalendarIcon, UserIcon } from '../components/Icons';
import { authApi } from '../services/api';

const SettingsScreen = ({ user: initialUser, onBack }: { user: any, onBack?: () => void }) => {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFullProfile = async () => {
            if (!initialUser?.id && !initialUser?.employee_id) return;
            setLoading(true);
            try {
                const profileData = await authApi.getProfile(initialUser.employee_id || initialUser.id.toString());
                setUser(profileData);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, [initialUser]);

    if (!user && loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#48327d" />
            </View>
        );
    }

    if (!user) return null;

    const getFormattedID = (id: any) => {
        if (!id) return '----';
        const numId = parseInt(id);
        if (isNaN(numId)) return id;
        if (numId < 1000) {
            return `MWI${numId.toString().padStart(3, '0')}`;
        }
        return `MW${numId}`;
    };

    const getInitials = () => {
        return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    const InfoItem = ({ icon, label, value, isFullWidth = false }: { icon: any, label: string, value: string, isFullWidth?: boolean }) => (
        <View style={[styles.infoItem, isFullWidth ? { width: '100%' } : { width: '48%' }]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.valueRow}>
                <View style={styles.iconMini}>{icon}</View>
                <Text style={styles.value}>{value || '-'}</Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                {onBack && (
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <Text style={styles.backButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
                <View style={styles.headerContent}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{getInitials()}</Text>
                        <View style={styles.statusDot} />
                    </View>
                    <View>
                        <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                        <View style={styles.headerSubInfo}>
                            <BriefcaseIcon size={14} color="#64748b" />
                            <Text style={styles.role}>{user.role || user.designation}</Text>
                            <Text style={styles.dotSeparator}>•</Text>
                            <Text style={styles.idTextSmall}>{user.employee_id || getFormattedID(user.id)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: '#f3e8ff' }]}>
                        <UserIcon color="#48327d" size={20} />
                    </View>
                    <Text style={styles.sectionTitle}>Personal Profile</Text>
                </View>
                <View style={styles.card}>
                    <InfoItem
                        icon={<MailIcon color="#94a3b8" size={14} />}
                        label="EMAIL ADDRESS"
                        value={user.email}
                        isFullWidth
                    />
                    <View style={styles.divider} />
                    <InfoItem
                        icon={<PhoneIcon color="#94a3b8" size={14} />}
                        label="PHONE NUMBER"
                        value={user.contact || user.phone}
                        isFullWidth
                    />
                    <View style={styles.divider} />
                    <InfoItem
                        icon={<MapPinIcon color="#94a3b8" size={14} />}
                        label="LOCATION"
                        value={user.location}
                        isFullWidth
                    />
                    <View style={styles.divider} />
                    <InfoItem
                        icon={<IdCardIcon color="#94a3b8" size={14} />}
                        label="AADHAR"
                        value={user.aadhar ? user.aadhar.toString().replace(/(\d{4})(?=\d)/g, "$1 ") : '-'}
                        isFullWidth
                    />
                    <View style={styles.divider} />
                    <InfoItem
                        icon={<BriefcaseIcon color="#94a3b8" size={14} />}
                        label="QUALIFICATION"
                        value={user.qualification || 'B.Tech'}
                        isFullWidth
                    />
                    <View style={styles.divider} />
                    <InfoItem
                        icon={<CalendarIcon color="#94a3b8" size={14} />}
                        label="JOINING DATE"
                        value={formatDate(user.date_joined || user.joining_date)}
                        isFullWidth
                    />
                </View>
            </View>

            <View style={styles.rowSection}>
                <View style={[styles.section, { flex: 1, marginTop: 0 }]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconBg, { backgroundColor: '#e0f2fe' }]}>
                            <BriefcaseIcon color="#0284c7" size={20} />
                        </View>
                        <Text style={styles.sectionTitle}>Work</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.workDetailRow}>
                            <Text style={styles.workLabel}>Employee ID</Text>
                            <Text style={styles.workValueBold}>{user.employee_id || getFormattedID(user.id)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.workDetailRow}>
                            <Text style={styles.workLabel}>Designation</Text>
                            <Text style={styles.workValue}>{user.role || user.designation}</Text>
                        </View>
                    </View>
                </View>

                {(user.team_name || (user.teams && user.teams.length > 0)) && (
                    <View style={[styles.section, { flex: 1, marginTop: 0, paddingLeft: 0 }]}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconBg, { backgroundColor: '#fff7ed' }]}>
                                <UsersIcon color="#ea580c" size={20} />
                            </View>
                            <Text style={styles.sectionTitle}>Teams</Text>
                        </View>
                        <View style={styles.card}>
                            {user.teams && user.teams.length > 0 ? (
                                user.teams.map((team: any, index: number) => (
                                    <React.Fragment key={team.id || index}>
                                        <View style={styles.teamCard}>
                                            <View style={styles.activeDot} />
                                            <View style={styles.teamInfo}>
                                                <Text style={styles.teamNameText}>
                                                    {team.name.startsWith('Team ') ? team.name : `Team ${team.name}`}
                                                </Text>
                                                {team.manager_name && (
                                                    <View style={styles.leadRow}>
                                                        <UserIcon size={12} color="#94a3b8" />
                                                        <Text style={styles.leadLabel}> Lead: </Text>
                                                        <Text style={styles.leadName}>{team.manager_name}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        {index < user.teams.length - 1 && <View style={[styles.divider, { marginVertical: 12 }]} />}
                                    </React.Fragment>
                                ))
                            ) : (
                                <View style={styles.teamCard}>
                                    <View style={styles.activeDot} />
                                    <View style={styles.teamInfo}>
                                        <Text style={styles.teamNameText}>
                                            {user.team_name.startsWith('Team ') ? user.team_name : `Team ${user.team_name}`}
                                        </Text>
                                        {user.team_lead_name && (
                                            <View style={styles.leadRow}>
                                                <UserIcon size={12} color="#94a3b8" />
                                                <Text style={styles.leadLabel}> Lead: </Text>
                                                <Text style={styles.leadName}>{user.team_lead_name}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: 'white',
        padding: 24,
        paddingTop: 40,
        margin: 16,
        borderRadius: 24,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarTextLarge: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#22c55e',
        borderWidth: 3,
        borderColor: 'white',
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 6,
    },
    headerSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    role: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    dotSeparator: {
        color: '#cbd5e1',
        fontSize: 14,
    },
    idTextSmall: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    rowSection: {
        flexDirection: 'row',
        paddingHorizontal: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    sectionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    infoItem: {
        marginBottom: 4,
    },
    iconMini: {
        marginRight: 6,
        marginTop: 2
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    label: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '800',
        marginBottom: 6,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    value: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },
    workDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    workValue: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
    },
    workValueBold: {
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    teamCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    teamInfo: {
        flex: 1,
    },
    teamNameText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    leadRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leadLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600'
    },
    leadName: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '500',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f97316',
        marginRight: 12
    },
    backButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backButtonText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
