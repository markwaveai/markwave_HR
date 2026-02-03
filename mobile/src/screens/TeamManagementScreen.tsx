import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Platform,
    ScrollView
} from 'react-native';
import { teamApi } from '../services/api';

const TeamManagementScreen = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTeam, setEditingTeam] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '', manager_id: '' });
    const [managers, setManagers] = useState<any[]>([]);

    // Member Management State
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<any[]>([]);
    const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
    const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState('');
    const [pickerModalOpen, setPickerModalOpen] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

    useEffect(() => {
        fetchTeams();
        fetchManagers();
    }, []);

    const fetchTeams = async () => {
        try {
            const data = await teamApi.getTeams();
            setTeams(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const data = await teamApi.getAttendanceRegistry();
            setManagers(data);
        } catch (error) {
            console.log(error);
        }
    };

    const handleSave = async () => {
        try {
            if (editingTeam) {
                await teamApi.updateTeam(editingTeam.id, formData);
            } else {
                await teamApi.createTeam(formData);
            }
            setModalVisible(false);
            fetchTeams();
        } catch (error) {
            Alert.alert("Error", "Failed to save team");
        }
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            "Delete Team",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await teamApi.deleteTeam(id);
                            fetchTeams();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete team");
                        }
                    }
                }
            ]
        );
    };

    const openModal = (team: any = null) => {
        if (team) {
            setEditingTeam(team);
            setFormData({
                name: team.name,
                description: team.description || '',
                manager_id: team.manager_id || ''
            });
        } else {
            setEditingTeam(null);
            setFormData({ name: '', description: '', manager_id: '' });
        }
        setModalVisible(true);
    };

    const handleManageMembers = async (team: any) => {
        setEditingTeam(team);
        setMemberModalOpen(true);
        fetchTeamMembers(team.id);
        fetchManagers();
    };

    const fetchTeamMembers = async (teamId: number) => {
        try {
            console.log('Fetching members for team:', teamId);
            const data = await teamApi.getMembers(teamId);
            console.log('Team members fetched:', data);
            setSelectedTeamMembers(data);
        } catch (error) {
            console.error("Failed to fetch team members", error);
            Alert.alert("Error", "Failed to fetch team members");
        }
    };

    const handleAddMember = async () => {
        if (!selectedEmployeeToAdd) return;
        try {
            console.log('Adding member:', selectedEmployeeToAdd, 'to team:', editingTeam.id);
            const result = await teamApi.updateMember(selectedEmployeeToAdd, { team_id: editingTeam.id });
            console.log('Member added successfully:', result);
            await fetchTeamMembers(editingTeam.id);
            await fetchTeams();
            setSelectedEmployeeToAdd('');
            Alert.alert("Success", "Member added successfully");
        } catch (error) {
            console.error("Failed to add member", error);
            Alert.alert("Error", `Failed to add member: ${error}`);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        Alert.alert(
            "Remove Member",
            "Remove this member from the team?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log('Removing member:', memberId, 'from team:', editingTeam.id);
                            const result = await teamApi.updateMember(memberId, { team_id: null });
                            console.log('Member removed successfully:', result);
                            await fetchTeamMembers(editingTeam.id);
                            await fetchTeams();
                            Alert.alert("Success", "Member removed successfully");
                        } catch (error) {
                            console.error("Failed to remove member", error);
                            Alert.alert("Error", `Failed to remove member: ${error}`);
                        }
                    }
                }
            ]
        );
    };

    // Set available employees (now ALL employees, we will handle "Added" state in UI)
    useEffect(() => {
        if (memberModalOpen && editingTeam && Array.isArray(managers)) {
            // Just pass all managers/employees, we'll check isAdded in the render loop
            setAvailableEmployees(managers);
        }
    }, [managers, memberModalOpen, editingTeam]);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>T</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleManageMembers(item)}>
                        <Text style={[styles.cardSubtitle, { color: '#48327d', fontWeight: 'bold' }]}>
                            {item.member_count} Members
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleManageMembers(item)} style={styles.actionBtn}>
                        <Text style={styles.manageIcon}>👥</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openModal(item)} style={styles.actionBtn}>
                        <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.label}>TEAM LEAD</Text>
                <Text style={styles.value}>{item.manager_name}</Text>
            </View>
            {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
            ) : null}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <Text style={styles.pageTitle}>Teams</Text>
                <TouchableOpacity onPress={() => openModal()} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+ Add Team</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={teams}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 20 }}
            />

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingTeam ? 'Edit Team' : 'New Team'}</Text>

                        <Text style={styles.inputLabel}>Team Name</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={t => setFormData({ ...formData, name: t })}
                            placeholder="Engineering"
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.description}
                            onChangeText={t => setFormData({ ...formData, description: t })}
                            placeholder="Team description"
                        />

                        {/* Very simple Manager ID input for now - Dropdown is complex in RN without libs */}
                        <Text style={styles.inputLabel}>Team Lead ID (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={String(formData.manager_id || '')}
                            onChangeText={t => setFormData({ ...formData, manager_id: t })}
                            placeholder="Employee ID"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, styles.cancelBtn]}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.modalBtn, styles.saveBtn, !formData.name.trim() && { opacity: 0.5 }]}
                                disabled={!formData.name.trim()}
                            >
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Member Management Modal */}
            <Modal visible={memberModalOpen} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View>
                                <Text style={styles.modalTitle}>Manage Members</Text>
                                <Text style={{ color: '#636e72', fontSize: 14, marginTop: -15, marginBottom: 10 }}>{editingTeam?.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setMemberModalOpen(false)} style={{ padding: 5, marginTop: -20 }}>
                                <Text style={{ fontSize: 20, color: '#636e72' }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Add Member Section */}
                        <View style={styles.addMemberSection}>
                            <Text style={[styles.inputLabel, { textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }]}>ADD EMPLOYEE TO TEAM</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <TouchableOpacity
                                        style={styles.input}
                                        onPress={() => setPickerModalOpen(true)}
                                    >
                                        <Text style={{ fontSize: 14, color: selectedEmployeeToAdd ? '#2d3436' : '#a0aec0' }}>
                                            {selectedEmployeeToAdd
                                                ? (() => {
                                                    const emp = availableEmployees.find(e => e.id === selectedEmployeeToAdd) || managers.find(e => e.id === selectedEmployeeToAdd);
                                                    return emp ? `${emp.first_name} ${emp.last_name} (${emp.role})` : 'Select an employee...';
                                                })()
                                                : 'Select an employee...'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    onPress={handleAddMember}
                                    disabled={!selectedEmployeeToAdd}
                                    style={[styles.addMemberBtn, !selectedEmployeeToAdd && { opacity: 0.5 }]}
                                >
                                    <Text style={styles.addMemberBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Employee Picker Modal */}
                        <Modal visible={pickerModalOpen} transparent={true} animationType="slide">
                            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                                <View style={{ backgroundColor: 'white', maxHeight: '60%', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' }}>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2d3436' }}>Select Employee</Text>
                                        <TouchableOpacity onPress={() => setPickerModalOpen(false)}>
                                            <Text style={{ fontSize: 20, color: '#636e72' }}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' }}>
                                        <TextInput
                                            style={{
                                                backgroundColor: '#f8f9fa',
                                                padding: 10,
                                                borderRadius: 8,
                                                fontSize: 14,
                                                color: '#2d3436'
                                            }}
                                            placeholder="Search employees..."
                                            value={employeeSearchQuery}
                                            onChangeText={setEmployeeSearchQuery}
                                        />
                                    </View>
                                    <ScrollView style={{ height: 300 }}>
                                        {availableEmployees
                                            .filter(emp => {
                                                if (!emp) return false;
                                                const q = (employeeSearchQuery || '').toLowerCase();
                                                const firstName = (emp.first_name || '').toLowerCase();
                                                const lastName = (emp.last_name || '').toLowerCase();
                                                const role = (emp.role || '').toLowerCase();

                                                return firstName.includes(q) || lastName.includes(q) || role.includes(q);
                                            })
                                            .map(emp => {
                                                const isAdded = selectedTeamMembers.some(m => String(m.id) === String(emp.id));
                                                return (
                                                    <TouchableOpacity
                                                        key={emp.id}
                                                        disabled={isAdded}
                                                        style={{
                                                            padding: 16,
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: '#f1f2f6',
                                                            backgroundColor: isAdded ? '#f8f9fa' : (selectedEmployeeToAdd === emp.id ? '#f3e5f5' : 'white'),
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                        onPress={() => {
                                                            setSelectedEmployeeToAdd(emp.id);
                                                            setPickerModalOpen(false);
                                                        }}
                                                    >
                                                        <Text style={{ color: isAdded ? '#b2bec3' : '#2d3436', fontWeight: '500' }}>
                                                            {emp.first_name} {emp.last_name} ({emp.role})
                                                        </Text>
                                                        {isAdded && (
                                                            <Text style={{ fontSize: 12, color: '#b2bec3', fontStyle: 'italic' }}>Added</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>

                        {/* Current Members List */}
                        {/* Current Members List */}
                        <View style={{ marginTop: 20, minHeight: 200 }}>
                            <Text style={[styles.inputLabel, { marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }]}>
                                CURRENT MEMBERS ({selectedTeamMembers.length})
                            </Text>

                            {selectedTeamMembers.length === 0 ? (
                                <View style={styles.emptyMemberList}>
                                    <Text style={{ color: '#a0aec0', textAlign: 'center' }}>No members in this team yet.</Text>
                                </View>
                            ) : (
                                <ScrollView style={{ height: 300 }} showsVerticalScrollIndicator={true}>
                                    <View style={{ gap: 10, paddingBottom: 10 }}>
                                        {selectedTeamMembers.map(member => (
                                            <View key={member.id} style={styles.memberItem}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                                    <View style={styles.memberAvatar}>
                                                        <Text style={styles.memberAvatarText}>{member.name?.[0]}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.memberName}>{member.name}</Text>
                                                        <Text style={styles.memberRole}>{member.role}</Text>
                                                    </View>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => handleRemoveMember(member.id)}
                                                    style={styles.removeMemberBtn}
                                                >
                                                    <Text style={styles.removeMemberText}>Remove</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f2f6', alignItems: 'flex-end' }}>
                            <TouchableOpacity
                                onPress={() => setMemberModalOpen(false)}
                                style={{
                                    backgroundColor: '#f1f2f6',
                                    paddingHorizontal: 24,
                                    paddingVertical: 12,
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{ color: '#636e72', fontWeight: 'bold' }}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View >
            </Modal >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2d3436'
    },
    addBtn: {
        backgroundColor: '#48327d',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    addBtnText: {
        color: 'white',
        fontWeight: 'bold'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 }
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3e5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    iconText: {
        color: '#48327d',
        fontWeight: 'bold',
        fontSize: 18
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d3436'
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#636e72'
    },
    actions: {
        flexDirection: 'row',
        gap: 10
    },
    actionBtn: {
        padding: 5
    },
    manageIcon: { fontSize: 16 },
    editIcon: { fontSize: 16 },
    deleteIcon: { fontSize: 16 },
    addMemberSection: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    addMemberBtn: {
        backgroundColor: '#48327d',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    addMemberBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14
    },
    emptyMemberList: {
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed'
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 8,
        // Shadow for "Card" look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3e5f5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    memberAvatarText: {
        color: '#48327d',
        fontWeight: 'bold',
        fontSize: 16
    },
    memberName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2d3436'
    },
    memberRole: {
        fontSize: 12,
        color: '#636e72'
    },
    removeMemberBtn: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingVertical: 6,
    },
    removeMemberText: {
        color: '#ff6b6b',
        fontWeight: '600',
        fontSize: 12
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f2f6'
    },
    label: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#b2bec3',
        letterSpacing: 1
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2d3436'
    },
    description: {
        marginTop: 8,
        color: '#636e72',
        fontSize: 12,
        fontStyle: 'italic'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: 16,
        padding: 20,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2d3436'
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#636e72',
        marginBottom: 6,
        marginTop: 10
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#2d3436',
        backgroundColor: '#f8f9fa'
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24
    },
    modalBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center'
    },
    cancelBtn: {
        backgroundColor: '#f1f2f6'
    },
    saveBtn: {
        backgroundColor: '#48327d'
    },
    cancelText: {
        color: '#636e72',
        fontWeight: 'bold'
    },
    saveText: {
        color: 'white',
        fontWeight: 'bold'
    }
});

export default TeamManagementScreen;
