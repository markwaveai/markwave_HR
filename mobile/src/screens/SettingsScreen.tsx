import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { MailIcon, PhoneIcon, MapPinIcon, IdCardIcon, BriefcaseIcon, UsersIcon, CalendarIcon, UserIcon } from '../components/Icons';
import { authApi } from '../services/api';
import { fallbackEmployees } from '../data/fallbackEmployees';
import EditProfileModal from '../components/EditProfileModal';
import { normalize, wp, hp } from '../utils/responsive';

const SettingsScreen = ({ user: initialUser, onBack }: { user: any, onBack?: () => void }) => {
    const [user, setUser] = useState(initialUser);
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    useEffect(() => {
        const fetchFullProfile = async () => {
            if (!initialUser?.id && !initialUser?.employee_id) return;
            setLoading(true);
            try {
                const idToFetch = initialUser.employee_id || initialUser.id.toString();
                console.log('Fetching profile for:', idToFetch);
                let profileData = await authApi.getProfile(idToFetch);

                // FALLBACK: If API returns missing details, patch them from local DB findings
                // This fetches details for ALL users as requested without changing API
                const empId = profileData.employee_id;

                if (empId && fallbackEmployees[empId]) {
                    const fallback = fallbackEmployees[empId];
                    if (!profileData.email) profileData.email = fallback.email;
                    if (!profileData.contact) profileData.contact = fallback.contact;
                    if (!profileData.location) profileData.location = fallback.location;
                    if (!profileData.aadhar) profileData.aadhar = fallback.aadhar;
                    if (!profileData.joining_date) profileData.joining_date = fallback.joining_date;
                    if (!profileData.qualification) profileData.qualification = fallback.qualification;
                }

                console.log('Profile data processed:', JSON.stringify(profileData, null, 2));
                setUser(profileData);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, [initialUser]);

    const handleUploadProfilePicture = () => {
        Alert.alert(
            "Upload Profile Photo",
            "Choose an option",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Take Photo",
                    onPress: async () => {
                        const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
                        processImageResult(result);
                    }
                },
                {
                    text: "Choose from Gallery",
                    onPress: async () => {
                        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
                        processImageResult(result);
                    }
                }
            ]
        );
    };

    const processImageResult = async (result: any) => {
        if (result.didCancel || !result.assets || result.assets.length === 0) return;
        const asset = result.assets[0];

        try {
            setLoading(true);
            const idToFetch = user.employee_id || user.id.toString();
            const response = await authApi.updateProfilePicture(
                idToFetch,
                asset.uri,
                asset.type || 'image/jpeg',
                asset.fileName || `avatar_${idToFetch}.jpg`
            );

            // Re-fetch profile to get updated image URL
            const updatedProfile = await authApi.getProfile(idToFetch);
            setUser(updatedProfile);
            Alert.alert("Success", "Profile picture updated successfully!");
        } catch (error: any) {
            console.error("Failed to upload image:", error);
            Alert.alert("Error", error.message || "Failed to update profile picture. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                    <TouchableOpacity style={styles.avatarLarge} onPress={handleUploadProfilePicture}>
                        {user.profile_picture ? (
                            <Image source={{ uri: user.profile_picture }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarTextLarge}>{getInitials()}</Text>
                        )}
                        <View style={styles.statusDot} />
                        <View style={styles.editBadge}>
                            <Text style={styles.editBadgeText}>✏️</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerNameContainer}>
                        <Text style={styles.name} numberOfLines={2}>{user.first_name} {user.last_name}</Text>
                        <View style={styles.headerSubInfo}>
                            <BriefcaseIcon size={14} color="#64748b" />
                            <Text style={styles.role} numberOfLines={1}>{user.role || user.designation}</Text>
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
                    <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
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

            <View style={styles.verticalSection}>
                <View style={styles.section}>
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
                    <View style={styles.section}>
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
                                                        <UserIcon size={normalize(12)} color="#94a3b8" />
                                                        <Text style={styles.leadLabel}> Lead: </Text>
                                                        <Text style={styles.leadName}>{team.manager_name}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        {index < user.teams.length - 1 && <View style={[styles.divider, { marginVertical: hp(1.5) }]} />}
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
                                                <UserIcon size={normalize(12)} color="#94a3b8" />
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

            <View style={{ height: hp(12) }} />

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                user={user}
                onUpdate={(updatedUser) => setUser({ ...user, ...updatedUser })}
            />
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
        padding: wp(6),
        paddingTop: hp(5),
        margin: wp(4),
        borderRadius: normalize(24),
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(4)
    },
    headerNameContainer: {
        flex: 1,
        paddingRight: wp(8),
    },
    avatarLarge: {
        width: wp(16),
        height: wp(16),
        borderRadius: normalize(16),
        backgroundColor: '#48327d',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarTextLarge: {
        fontSize: normalize(24),
        fontWeight: 'bold',
        color: 'white',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: normalize(16),
    },
    editBadge: {
        position: 'absolute',
        bottom: -5,
        left: -5,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
    },
    editBadgeText: {
        fontSize: normalize(8),
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: wp(4),
        height: wp(4),
        borderRadius: wp(2),
        backgroundColor: '#22c55e',
        borderWidth: 3,
        borderColor: 'white',
    },
    name: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: hp(0.5),
    },
    headerSubInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5),
    },
    role: {
        fontSize: normalize(14),
        color: '#64748b',
        fontWeight: '600',
    },
    dotSeparator: {
        color: '#cbd5e1',
        fontSize: normalize(14),
    },
    idTextSmall: {
        fontSize: normalize(14),
        color: '#94a3b8',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    section: {
        paddingHorizontal: wp(4),
        marginBottom: hp(3),
    },
    verticalSection: {
        paddingHorizontal: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
        gap: wp(3),
    },
    sectionIconBg: {
        width: wp(10),
        height: wp(10),
        borderRadius: normalize(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#1e293b',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: normalize(20),
        padding: wp(6),
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
        marginBottom: hp(0.5),
    },
    iconMini: {
        marginRight: wp(1.5),
        marginTop: hp(0.3)
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    label: {
        fontSize: normalize(11),
        color: '#94a3b8',
        fontWeight: '800',
        marginBottom: hp(0.8),
        letterSpacing: 0.5,
        textTransform: 'uppercase'
    },
    value: {
        fontSize: normalize(14),
        color: '#334155',
        fontWeight: '600',
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: hp(2),
    },
    workDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    workLabel: {
        fontSize: normalize(14),
        color: '#64748b',
        fontWeight: '500',
    },
    workValue: {
        fontSize: normalize(14),
        color: '#334155',
        fontWeight: '600',
    },
    workValueBold: {
        fontSize: normalize(14),
        color: '#0f172a',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    teamCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: hp(0.5),
    },
    teamInfo: {
        flex: 1,
        paddingRight: wp(1),
    },
    teamNameText: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: hp(0.5),
    },
    leadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: hp(0.3),
    },
    leadLabel: {
        fontSize: normalize(12),
        color: '#64748b',
        fontWeight: '600',
        marginLeft: wp(0.5),
    },
    leadName: {
        fontSize: normalize(12),
        color: '#334155',
        fontWeight: '500',
        flexShrink: 1,
    },
    activeDot: {
        width: wp(2),
        height: wp(2),
        borderRadius: wp(1),
        backgroundColor: '#f97316',
        marginRight: wp(3)
    },
    backButton: {
        position: 'absolute',
        top: hp(2.5),
        right: wp(5),
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    backButtonText: {
        fontSize: normalize(14),
        color: '#64748b',
        fontWeight: 'bold',
    },
    editButton: {
        marginLeft: 'auto',
        backgroundColor: '#f3e8ff',
        paddingHorizontal: wp(3),
        paddingVertical: hp(0.8),
        borderRadius: normalize(8),
    },
    editButtonText: {
        color: '#48327d',
        fontWeight: '700',
        fontSize: normalize(12),
    },
});

export default SettingsScreen;
