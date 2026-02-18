import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Platform,
    Modal,
    ScrollView
} from 'react-native';
import { teamApi } from '../services/api';
import { normalize, wp, hp } from '../utils/responsive';
import { EditIcon, TrashIcon, SearchIcon, MapPinIcon, MailIcon } from '../components/Icons';

interface MyTeamScreenProps {
    user: any;
}

const TeamHeader = React.memo(({ teams, selectedTeamId, searchTerm, setSearchTerm, stats, isManager, setIsTeamSelectorVisible, setIsAddModalVisible, user }: any) => {
    const currentTeam = teams.find((t: any) => t.id === selectedTeamId);
    return (
        <View style={styles.headerContainer}>
            <View style={styles.titleRow}>
                <View style={styles.titleContent}>
                    <Text style={styles.pageTitle}>My Team</Text>
                    <Text style={styles.teamLeadSubtitle}>
                        {currentTeam?.manager_name ? `Team ${currentTeam.manager_name}` : (currentTeam ? `Team ${currentTeam.name}` : (user?.team_lead_name ? `Team ${user.team_lead_name}` : 'My Team Members'))}
                    </Text>
                </View>
                {isManager && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => setIsAddModalVisible(true)}
                    >
                        <Text style={styles.addButtonText}>Add Member</Text>
                    </TouchableOpacity>
                )}
            </View>

            {teams.length > 1 && (
                <View style={styles.selectorContainer}>
                    <Text style={styles.selectorLabel}>TEAM</Text>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setIsTeamSelectorVisible(true)}
                    >
                        <Text style={styles.dropdownButtonText}>
                            {teams.find((t: any) => t.id === selectedTeamId)?.name || 'Select Team'}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.searchContainer}>
                <SearchIcon color="#94a3b8" size={normalize(16)} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search members..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Members</Text>
                    <Text style={[styles.statValue, { color: '#1e293b' }]}>{stats?.total || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Active Now</Text>
                    <View style={styles.activeRow}>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>{stats?.active || 0}</Text>
                        <Text style={styles.onlineBadge}>Online</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>On Leave</Text>
                    <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats?.onLeave || 0}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Remote</Text>
                    <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats?.remote || 0}</Text>
                </View>
            </View>
        </View>
    );
});

const MemberCard = React.memo(({ item, isManager, isRemovingMember, handleEditMemberClick, handleDeleteMember }: any) => (
    <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                </Text>
                <Text style={styles.memberRole} numberOfLines={1} ellipsizeMode="tail">
                    {item.role}
                </Text>
            </View>
            {isManager && (
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleEditMemberClick(item)}
                    >
                        <EditIcon color="#3b82f6" size={normalize(18)} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => handleDeleteMember(item)}
                        disabled={isRemovingMember === item.id}
                    >
                        {isRemovingMember === item.id ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                            <TrashIcon color="#ef4444" size={normalize(18)} strokeWidth={2.5} />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>

        <View style={styles.divider} />

        <View style={styles.cardDetailsRow}>
            <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>STATUS</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: item.status === 'Active' ? '#10b981' : '#f59e0b' }]} />
                    <Text style={styles.detailValue}>{item.status}</Text>
                </View>
            </View>
            <View style={[styles.detailItem, { flex: 1.5 }]}>
                <Text style={styles.detailLabel}>LOCATION</Text>
                <View style={styles.statusRow}>
                    <MapPinIcon size={normalize(12)} color="#64748b" />
                    <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                        {item.location || 'Not Specified'}
                    </Text>
                </View>
            </View>
        </View>

        <View style={styles.cardFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <MailIcon size={normalize(14)} color="#64748b" style={{ marginRight: wp(1) }} />
                <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="middle">
                    {item.email || 'No email provided'}
                </Text>
            </View>
            <TouchableOpacity style={styles.viewProfileBtn}>
                <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
        </View>
    </View >
));

const MyTeamScreen: React.FC<MyTeamScreenProps> = ({ user }) => {
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [selectedExistingId, setSelectedExistingId] = useState<string>('');
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [teams, setTeams] = useState<any[]>([]);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
    const [isTeamSelectorVisible, setIsTeamSelectorVisible] = useState(false);

    const isManager = user?.is_manager || user?.role?.toLowerCase()?.includes('team lead');

    useEffect(() => {
        console.log('User data for team:', JSON.stringify({ teams: user?.teams, team_id: user?.team_id }, null, 2));
        if (user?.teams && user.teams.length > 0) {
            setTeams(user.teams);
            // Default to the first team they manage if available, else first team they belong to
            const leadTeam = user.teams.find((t: any) => t.manager_name?.includes(user.first_name));
            const teamId = leadTeam ? leadTeam.id : user.teams[0].id;
            console.log('Setting team ID from teams array:', teamId);
            setSelectedTeamId(teamId);
        } else if (user?.team_id) {
            console.log('Setting team ID from user.team_id:', user.team_id);
            setSelectedTeamId(user.team_id);
        } else {
            console.warn('⚠️ No team data found for user. User needs to be assigned to a team.');
        }
    }, [user]);

    useEffect(() => {
        if (selectedTeamId !== null) {
            fetchTeamData();
        }
    }, [selectedTeamId]);

    const fetchTeamData = async () => {
        if (selectedTeamId === null) return;

        setLoading(true);
        try {
            console.log('Fetching team data for team ID:', selectedTeamId);
            const [membersData, statsData, allEmpsData] = await Promise.all([
                teamApi.getMembers(selectedTeamId).catch((err) => { console.error('❌ Members API Error:', err); throw err; }),
                teamApi.getStats(selectedTeamId).catch((err) => { console.error('❌ Stats API Error:', err); throw err; }),
                teamApi.getAttendanceRegistry().catch((err) => { console.error('❌ Registry API Error:', err); throw err; })
            ]);

            console.log('Team Members:', membersData);
            console.log('Team Stats:', statsData);
            setTeamMembers(membersData);
            setStats(statsData);
            setAllEmployees(allEmpsData);
        } catch (error) {
            console.log("Failed to fetch team data:", error);
            Alert.alert("Error", "Could not load team data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedExistingId || selectedTeamId === null) {
            Alert.alert("Required", "Please select an employee.");
            return;
        }

        setIsSubmitting(true);
        try {
            await teamApi.updateMember(selectedExistingId, {
                team_id: selectedTeamId,
                acting_user_id: user?.id
            });

            Alert.alert("Success", "Team member added successfully!");
            setIsAddModalVisible(false);
            setSelectedExistingId('');
            fetchTeamData(); // Refresh list
        } catch (error: any) {
            console.log("Failed to add member:", error);
            Alert.alert("Error", error.message || "Could not add team member.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMember = (member: any) => {
        Alert.alert(
            "Remove Member",
            `Are you sure you want to remove ${member.name} from the team?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        setIsRemovingMember(member.id);
                        try {
                            await teamApi.updateMember(member.id, {
                                remove_team_id: selectedTeamId,
                                acting_user_id: user?.id
                            });
                            Alert.alert("Success", "Member removed from team.");
                            fetchTeamData();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to remove member");
                        } finally {
                            setIsRemovingMember(null);
                        }
                    }
                }
            ]
        );
    };

    const handleUpdateMember = async (updatedData: any) => {
        if (!editingMember) return;
        setIsSubmitting(true);
        try {
            await teamApi.updateMember(editingMember.id, {
                ...updatedData,
                acting_user_id: user?.id
            });
            Alert.alert("Success", "Employee updated successfully!");
            setIsEditModalVisible(false);
            setEditingMember(null);
            fetchTeamData();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update employee");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditMemberClick = (member: any) => {
        setEditingMember(member);
        setIsEditModalVisible(true);
    };

    const filteredMembers = teamMembers.filter(member => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
        return (
            (member.name?.toLowerCase() || '').includes(searchLower) ||
            (member.first_name?.toLowerCase() || '').includes(searchLower) ||
            (member.last_name?.toLowerCase() || '').includes(searchLower) ||
            fullName.includes(searchLower) ||
            (member.role?.toLowerCase() || '').includes(searchLower) ||
            (member.email?.toLowerCase() || '').includes(searchLower) ||
            (member.location?.toLowerCase() || '').includes(searchLower) ||
            (member.employee_id?.toLowerCase() || '').includes(searchLower)
        );
    });

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={{ marginTop: hp(1.2), color: '#64748b', fontWeight: '500' }}>Syncing team...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={filteredMembers}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <MemberCard
                        item={item}
                        isManager={isManager}
                        isRemovingMember={isRemovingMember}
                        handleEditMemberClick={handleEditMemberClick}
                        handleDeleteMember={handleDeleteMember}
                    />
                )}
                ListHeaderComponent={
                    <TeamHeader
                        teams={teams}
                        selectedTeamId={selectedTeamId}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        stats={stats}
                        isManager={isManager}
                        setIsTeamSelectorVisible={setIsTeamSelectorVisible}
                        setIsAddModalVisible={setIsAddModalVisible}
                        user={user}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Add Member Modal */}
            <Modal
                visible={isAddModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Team Member</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                            <View>
                                <Text style={styles.inputLabel}>SELECT EMPLOYEE</Text>
                                <View style={styles.pickerContainer}>
                                    {allEmployees
                                        .filter(emp => !teamMembers.some(m => m.id === emp.id))
                                        .map(emp => (
                                            <TouchableOpacity
                                                key={emp.id}
                                                onPress={() => setSelectedExistingId(String(emp.id))}
                                                style={[
                                                    styles.employeeSelectItem,
                                                    selectedExistingId === String(emp.id) && styles.employeeSelected
                                                ]}
                                            >
                                                <View>
                                                    <Text style={[styles.empSelectName, selectedExistingId === String(emp.id) && styles.empSelectedText]}>
                                                        {emp.first_name} {emp.last_name}
                                                    </Text>
                                                    <Text style={styles.empSelectRole}>{emp.role}</Text>
                                                </View>
                                                {selectedExistingId === String(emp.id) && <Text style={styles.checkIcon}>✓</Text>}
                                            </TouchableOpacity>
                                        ))}
                                    {allEmployees.filter(emp => !teamMembers.some(m => m.id === emp.id)).length === 0 && (
                                        <Text style={styles.emptyText}>All available employees are already in your team.</Text>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, (!selectedExistingId || isSubmitting) && { opacity: 0.5 }]}
                                onPress={handleAddMember}
                                disabled={!selectedExistingId || isSubmitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting ? "Adding..." : "Add Member"}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit Member Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Member Details</Text>
                            <TouchableOpacity onPress={() => setIsEditModalVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                            <View>
                                <Text style={styles.inputLabel}>FULL NAME</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editingMember?.name}
                                    editable={false} // Name usually managed via profile/HR
                                />

                                <Text style={styles.inputLabel}>DESIGNATION / ROLE</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editingMember?.role}
                                    onChangeText={(text) => setEditingMember({ ...editingMember, role: text })}
                                    placeholder="e.g. Senior Developer"
                                />

                                <Text style={styles.inputLabel}>OFFICE LOCATION</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={editingMember?.location}
                                    onChangeText={(text) => setEditingMember({ ...editingMember, location: text })}
                                    placeholder="e.g. Hyderabad"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, isSubmitting && { opacity: 0.5 }]}
                                onPress={() => handleUpdateMember({
                                    role: editingMember.role,
                                    location: editingMember.location
                                })}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isSubmitting ? "Updating..." : "Update Details"}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Team Selector Modal */}
            <Modal
                visible={isTeamSelectorVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsTeamSelectorVisible(false)}
            >
                <TouchableOpacity
                    style={styles.teamModalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsTeamSelectorVisible(false)}
                >
                    <View style={styles.teamDropdownContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.teamDropdownTitle}>Select Team</Text>
                        <ScrollView style={styles.teamListContainer} showsVerticalScrollIndicator={false}>
                            {teams.map(t => (
                                <TouchableOpacity
                                    key={t.id}
                                    onPress={() => {
                                        setSelectedTeamId(t.id);
                                        setIsTeamSelectorVisible(false);
                                    }}
                                    style={[
                                        styles.teamDropdownItem,
                                        selectedTeamId === t.id && styles.teamDropdownItemActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.teamDropdownItemText,
                                        selectedTeamId === t.id && styles.teamDropdownItemTextActive
                                    ]}>
                                        {t.name}
                                    </Text>
                                    {selectedTeamId === t.id && (
                                        <Text style={styles.teamCheckIcon}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        paddingTop: Platform.OS === 'ios' ? hp(2) : hp(1),
    },
    listContent: {
        padding: wp(4),
        paddingBottom: hp(12), // Space for tab bar
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    headerContainer: {
        marginBottom: hp(2.5),
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp(2.5),
    },
    titleContent: {
        flex: 1,
        paddingRight: wp(2.5),
    },
    pageTitle: {
        fontSize: normalize(24),
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    teamLeadSubtitle: {
        fontSize: normalize(14),
        color: '#6c757d',
        fontStyle: 'italic',
        marginTop: hp(0.2),
    },
    pageSubtitle: {
        fontSize: normalize(13),
        color: '#64748b',
        marginTop: hp(0.2),
    },
    selectorContainer: {
        marginBottom: hp(2.5),
    },
    selectorLabel: {
        fontSize: normalize(10),
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: hp(1),
    },
    teamsScroll: {
        flexDirection: 'row',
    },
    teamTab: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        borderRadius: normalize(20),
        backgroundColor: '#f1f5f9',
        marginRight: wp(2.5),
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    activeTeamTab: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    teamTabText: {
        fontSize: normalize(12),
        fontWeight: '600',
        color: '#64748b',
    },
    activeTeamTabText: {
        color: 'white',
    },
    addButton: {
        backgroundColor: '#6366f1',
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        borderRadius: normalize(10),
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: normalize(12),
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: normalize(12),
        paddingHorizontal: wp(3),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: hp(2.5),
        height: hp(5.5),
    },
    searchIcon: {
        marginRight: wp(2.5),
    },
    searchInput: {
        flex: 1,
        fontSize: normalize(14),
        color: '#1e293b',
        fontWeight: '500',
    },
    // Stats
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: wp(3),
    },
    statCard: {
        width: '48%',
        backgroundColor: 'white',
        padding: wp(4),
        borderRadius: normalize(16),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
    },
    statLabel: {
        fontSize: normalize(9),
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: hp(0.8),
    },
    statValue: {
        fontSize: normalize(24),
        fontWeight: '900',
    },
    activeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: wp(1.5),
    },
    onlineBadge: {
        fontSize: normalize(8),
        fontWeight: 'bold',
        color: '#10b981',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: wp(1),
        paddingVertical: hp(0.1),
        borderRadius: normalize(4),
        marginBottom: hp(0.5),
    },
    // Member Card
    card: {
        backgroundColor: 'white',
        borderRadius: normalize(20),
        padding: wp(5),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    memberInfo: {
        flex: 1,
        paddingRight: wp(3),
    },
    memberName: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -0.3,
    },
    memberRole: {
        fontSize: normalize(12),
        color: '#6366f1',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: hp(0.5),
    },
    moreButton: {
        padding: wp(1),
        marginTop: -4,
    },
    moreButtonText: {
        fontSize: normalize(20),
        color: '#94a3b8',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: hp(2),
    },
    cardDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: wp(3),
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: normalize(9),
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: hp(1),
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5)
    },
    statusDot: {
        width: normalize(6),
        height: normalize(6),
        borderRadius: normalize(3),
    },
    detailValue: {
        fontSize: normalize(12),
        fontWeight: '600',
        color: '#334155',
    },
    cardFooter: {
        marginTop: hp(2.5),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: wp(2.5),
    },
    emailText: {
        flex: 1,
        fontSize: normalize(12),
        color: '#64748b',
        fontWeight: '500',
    },
    viewProfileBtn: {
        paddingHorizontal: wp(2.5),
        paddingVertical: hp(0.8),
        borderRadius: normalize(8),
        backgroundColor: '#eff6ff',
    },
    viewProfileText: {
        fontSize: normalize(10),
        fontWeight: '800',
        color: '#3b82f6',
        textTransform: 'uppercase',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: wp(5),
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: normalize(24),
        maxHeight: '85%',
        width: '100%',
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(6),
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: normalize(18),
        fontWeight: '900',
        color: '#1e293b',
    },
    closeButton: {
        padding: wp(1),
    },
    closeButtonText: {
        fontSize: normalize(18),
        color: '#94a3b8',
    },
    formContainer: {
        padding: wp(6),
    },
    inputLabel: {
        fontSize: normalize(10),
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
        marginBottom: hp(1),
        marginTop: hp(2),
    },
    submitButton: {
        backgroundColor: '#6366f1',
        borderRadius: normalize(12),
        padding: wp(4),
        alignItems: 'center',
        marginTop: hp(4),
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: normalize(15),
    },
    pickerContainer: {
        marginTop: hp(1.2),
    },
    employeeSelectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(3),
        backgroundColor: '#f8fafc',
        borderRadius: normalize(12),
        marginBottom: hp(1),
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    employeeSelected: {
        borderColor: '#6366f1',
        backgroundColor: '#f5f3ff',
    },
    empSelectName: {
        fontSize: normalize(14),
        fontWeight: '700',
        color: '#1e293b',
    },
    empSelectedText: {
        color: '#6366f1',
    },
    empSelectRole: {
        fontSize: normalize(11),
        color: '#64748b',
        marginTop: hp(0.2),
    },
    checkIcon: {
        color: '#6366f1',
        fontWeight: 'bold',
        fontSize: normalize(16),
    },
    emptyText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: normalize(12),
        fontStyle: 'italic',
        marginTop: hp(2.5),
    },
    modalInput: {
        backgroundColor: '#f8fafc',
        borderRadius: normalize(12),
        padding: wp(3.5),
        fontSize: normalize(14),
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: hp(2),
        fontWeight: '500',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: wp(3),
    },
    actionIconBtn: {
        padding: wp(1),
    },
    actionIconText: {
        fontSize: normalize(18),
    },
    // Dropdown Button Styles
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: normalize(12),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dropdownButtonText: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#1e293b',
        flex: 1,
    },
    dropdownArrow: {
        fontSize: normalize(10),
        color: '#94a3b8',
        marginLeft: wp(2),
    },
    // Team Selector Modal Styles
    teamModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: wp(5),
    },
    teamDropdownContent: {
        backgroundColor: 'white',
        borderRadius: normalize(16),
        padding: wp(5),
        maxHeight: '60%',
    },
    teamDropdownTitle: {
        fontSize: normalize(16),
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: hp(2),
    },
    teamListContainer: {
        maxHeight: hp(50),
    },
    teamDropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: wp(4),
        borderRadius: normalize(12),
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: hp(1),
    },
    teamDropdownItemActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#6366f1',
    },
    teamDropdownItemText: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: '#64748b',
        flex: 1,
    },
    teamDropdownItemTextActive: {
        color: '#6366f1',
    },
    teamCheckIcon: {
        fontSize: normalize(16),
        color: '#6366f1',
        fontWeight: 'bold',
    },
});

export default MyTeamScreen;
