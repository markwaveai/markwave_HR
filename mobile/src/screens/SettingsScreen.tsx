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

    const InfoRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
                {icon}
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.label}>{label}</Text>
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
                <View style={styles.avatarLarge}>
                    <Text style={styles.avatarTextLarge}>{getInitials()}</Text>
                    <View style={styles.statusDot} />
                </View>
                <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                <View style={styles.headerSubInfo}>
                    <Text style={styles.role}>{user.role || user.designation}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.idTextSmall}>{user.employee_id || getFormattedID(user.id)}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: '#f3e8ff' }]}>
                        <UserIcon color="#48327d" size={18} />
                    </View>
                    <Text style={styles.sectionTitle}>Personal Profile</Text>
                </View>
                <View style={styles.card}>
                    <InfoRow icon={<MailIcon color="#48327d" size={18} />} label="EMAIL ADDRESS" value={user.email} />
                    <View style={styles.divider} />
                    <InfoRow icon={<PhoneIcon color="#48327d" size={18} />} label="PHONE NUMBER" value={user.phone} />
                    <View style={styles.divider} />
                    <InfoRow icon={<MapPinIcon color="#48327d" size={18} />} label="LOCATION" value={user.location} />
                    <View style={styles.divider} />
                    <InfoRow icon={<IdCardIcon color="#48327d" size={18} />} label="AADHAR" value={user.aadhar ? user.aadhar.toString().replace(/(\d{4})(?=\d)/g, "$1 ") : '-'} />
                    <View style={styles.divider} />
                    <InfoRow icon={<BriefcaseIcon color="#48327d" size={18} />} label="QUALIFICATION" value={user.qualification || 'B.Tech'} />
                    <View style={styles.divider} />
                    <InfoRow icon={<CalendarIcon color="#48327d" size={18} />} label="JOINING DATE" value={formatDate(user.date_joined || user.joining_date)} />
                </View>
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={[styles.sectionIconBg, { backgroundColor: '#e0f2fe' }]}>
                        <BriefcaseIcon color="#0284c7" size={18} />
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
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconBg, { backgroundColor: '#fff7ed' }]}>
                            <UsersIcon color="#ea580c" size={18} />
                        </View>
                        <Text style={styles.sectionTitle}>Teams</Text>
                    </View>
                    <View style={styles.card}>
                        {user.teams && user.teams.length > 0 ? (
                            user.teams.map((team: any, index: number) => (
                                <React.Fragment key={team.id || index}>
                                    <View style={styles.teamCard}>
                                        <View style={styles.teamInfo}>
                                            <Text style={styles.teamNameText}>Team {team.name}</Text>
                                            {team.manager_name && (
                                                <View style={styles.leadRow}>
                                                    <Text style={styles.leadLabel}>Lead: </Text>
                                                    <Text style={styles.leadName}>{team.manager_name}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.activeDot} />
                                    </View>
                                    {index < user.teams.length - 1 && <View style={[styles.divider, { marginVertical: 12 }]} />}
                                </React.Fragment>
                            ))
                        ) : (
                            <View style={styles.teamCard}>
                                <View style={styles.teamInfo}>
                                    <Text style={styles.teamNameText}>Team {user.team_name}</Text>
                                    {user.team_lead_name && (
                                        <View style={styles.leadRow}>
                                            <Text style={styles.leadLabel}>Lead: </Text>
                                            <Text style={styles.leadName}>{user.team_lead_name}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.activeDot} />
                            </View>
                        )}
                    </View>
                </View>
            )}
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
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatarLarge: {
        width: 110,
        height: 110,
        borderRadius: 24,
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    avatarTextLarge: {
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white',
    },
    statusDot: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22c55e',
        borderWidth: 3,
        borderColor: 'white',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    headerSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    role: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    dotSeparator: {
        color: '#cbd5e1',
        fontSize: 16,
    },
    idTextSmall: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    sectionIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 20,
    },
    workDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workLabel: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    workValue: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    workValueBold: {
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    teamCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    teamInfo: {
        flex: 1,
    },
    teamNameText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    leadRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leadLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    leadName: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    activeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#f97316',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    backButtonText: {
        fontSize: 18,
        color: '#64748b',
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
