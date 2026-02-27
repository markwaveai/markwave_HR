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
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { normalize, wp, hp } from '../utils/responsive';
import AsyncStorageLib from '@react-native-async-storage/async-storage';
import { teamApi } from '../services/api';
import {
    EditIcon,
    TrashIcon,
    UsersIcon,
    BriefcaseIcon,
    PlusIcon,
    CloseIcon
} from '../components/Icons';

const TeamManagementScreen = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTeam, setEditingTeam] = useState<any>(null);
    const [formData, setFormData] = useState<{ name: string; description: string; manager_id: string; members: any[] }>({ name: '', description: '', manager_id: '', members: [] });
    const [managers, setManagers] = useState<any[]>([]);

    // Member Management State
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<any[]>([]);
    const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
    const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState('');
    const [pickerModalOpen, setPickerModalOpen] = useState(false);
    const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
    const [managerPickerOpen, setManagerPickerOpen] = useState(false);
    const [managerSearchQuery, setManagerSearchQuery] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    // Helper function to format employee ID
    const getFormattedID = (id: number) => {
        return `MW${String(id).padStart(4, '0')}`;
    };

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
        setIsSubmitting(true);
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
        } finally {
            setIsSubmitting(false);
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
                manager_id: team.manager_id || '',
                members: []
            });
        } else {
            setEditingTeam(null);
            setFormData({ name: '', description: '', manager_id: '', members: [] });
            setMemberSearchTerm('');
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
                            const result = await teamApi.updateMember(memberId, { remove_team_id: editingTeam.id });
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
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.memberCountText}>{item.member_count} Members</Text>
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => openModal(item)} style={styles.iconBtn}>
                        <EditIcon color="#3b82f6" size={18} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                        <TrashIcon color="#ef4444" size={18} strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.descriptionText}>
                {item.description || `Team led by ${item.manager_name || 'No Manager'}`}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerInfo}>
                    <BriefcaseIcon color="#64748b" size={16} />
                    <Text style={styles.managerName} numberOfLines={1}>{item.manager_name || 'No Manager'}</Text>
                </View>
                <TouchableOpacity style={styles.manageBtn} onPress={() => handleManageMembers(item)}>
                    <UsersIcon color="#48327d" size={16} />
                    <Text style={styles.manageBtnText}>Manage Members</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.pageTitle}>Team Management</Text>
                    <Text style={styles.pageSubtitle}>Manage organizational teams and members</Text>
                </View>
                <TouchableOpacity onPress={() => openModal()} style={styles.addBtn}>
                    <PlusIcon color="white" size={16} strokeWidth={3} />
                    <Text style={styles.addBtnText}>Create Team</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={teams}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 20 }}
            />

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { flex: 1 }]}>
                    <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: hp(2) }]}>
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
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={formData.description}
                            onChangeText={t => setFormData({ ...formData, description: t })}
                            placeholder="Team description"
                            multiline
                            numberOfLines={3}
                        />

                        <Text style={styles.inputLabel}>Team Manager</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setManagerPickerOpen(true)}
                        >
                            <Text style={{ fontSize: 14, color: formData.manager_id ? '#2d3436' : '#a0aec0' }}>
                                {formData.manager_id
                                    ? (() => {
                                        const mgr = managers.find(m => String(m.id) === String(formData.manager_id));
                                        return mgr ? `${mgr.first_name} ${mgr.last_name} (${mgr.employee_id})` : 'Select Manager';
                                    })()
                                    : 'Select Manager'}
                            </Text>
                        </TouchableOpacity>

                        {/* Manager Picker Modal */}
                        <Modal visible={managerPickerOpen} transparent={true} animationType="slide">
                            <View style={[styles.modalOverlay, { flex: 1, justifyContent: 'flex-end' }]}>
                                <View style={{ backgroundColor: 'white', maxHeight: '60%', borderTopLeftRadius: normalize(20), borderTopRightRadius: normalize(20) }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(4), borderBottomWidth: 1, borderBottomColor: '#f1f2f6' }}>
                                        <Text style={{ fontSize: normalize(16), fontWeight: 'bold', color: '#2d3436' }}>Select Manager</Text>
                                        <TouchableOpacity onPress={() => setManagerPickerOpen(false)}>
                                            <CloseIcon color="#636e72" size={normalize(20)} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ padding: wp(3), borderBottomWidth: 1, borderBottomColor: '#f1f2f6' }}>
                                        <TextInput
                                            style={{
                                                backgroundColor: '#f8f9fa',
                                                padding: wp(2.5),
                                                borderRadius: normalize(8),
                                                fontSize: normalize(14),
                                                color: '#2d3436'
                                            }}
                                            placeholder="Search managers..."
                                            value={managerSearchQuery}
                                            onChangeText={setManagerSearchQuery}
                                        />
                                    </View>
                                    <ScrollView style={{ maxHeight: hp(40) }}>
                                        {managers
                                            .filter(mgr => {
                                                if (!mgr) return false;
                                                const q = (managerSearchQuery || '').toLowerCase();
                                                const firstName = (mgr.first_name || '').toLowerCase();
                                                const lastName = (mgr.last_name || '').toLowerCase();
                                                const employeeId = (mgr.employee_id || '').toLowerCase();
                                                return firstName.includes(q) || lastName.includes(q) || employeeId.includes(q);
                                            })
                                            .map(mgr => (
                                                <TouchableOpacity
                                                    key={mgr.id}
                                                    style={{
                                                        padding: wp(4),
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#f1f2f6',
                                                        backgroundColor: String(formData.manager_id) === String(mgr.id) ? '#f3e5f5' : 'white',
                                                    }}
                                                    onPress={() => {
                                                        setFormData({ ...formData, manager_id: String(mgr.id) });
                                                        setManagerPickerOpen(false);
                                                        setManagerSearchQuery('');
                                                    }}
                                                >
                                                    <Text style={{ color: '#2d3436', fontWeight: '500', fontSize: normalize(14) }}>
                                                        {mgr.first_name} {mgr.last_name} ({mgr.employee_id})
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </Modal>

                        {/* Add Initial Members Section - Only for New Teams */}
                        {!editingTeam && (
                            <View style={{ marginTop: hp(1.25) }}>
                                <Text style={styles.inputLabel}>Add Initial Members</Text>

                                {/* Search Input */}
                                <View style={{ marginBottom: hp(1) }}>
                                    <TextInput
                                        style={[styles.input, { paddingLeft: wp(3) }]}
                                        placeholder="Search employees..."
                                        placeholderTextColor="#a0aec0"
                                        value={memberSearchTerm}
                                        onChangeText={setMemberSearchTerm}
                                    />
                                </View>

                                {/* Member Checkbox List */}
                                <ScrollView
                                    style={{
                                        maxHeight: hp(25),
                                        borderWidth: 1,
                                        borderColor: '#e2e8f0',
                                        borderRadius: normalize(8),
                                        backgroundColor: '#f8f9fa'
                                    }}
                                    nestedScrollEnabled={true}
                                >
                                    {managers
                                        .filter(emp => {
                                            if (!emp) return false;
                                            // Don't show the selected manager in the members list
                                            if (String(emp.id) === String(formData.manager_id)) return false;

                                            const q = (memberSearchTerm || '').toLowerCase();
                                            const firstName = (emp.first_name || '').toLowerCase();
                                            const lastName = (emp.last_name || '').toLowerCase();
                                            const role = (emp.role || '').toLowerCase();
                                            const employeeId = (emp.employee_id || '').toLowerCase();

                                            return firstName.includes(q) || lastName.includes(q) || role.includes(q) || employeeId.includes(q);
                                        })
                                        .map(emp => (
                                            <TouchableOpacity
                                                key={emp.id}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    padding: wp(3),
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: '#f1f2f6',
                                                    backgroundColor: formData.members.includes(emp.id) ? '#f3e5f5' : 'white'
                                                }}
                                                onPress={() => {
                                                    const isSelected = formData.members.includes(emp.id);
                                                    if (isSelected) {
                                                        setFormData({
                                                            ...formData,
                                                            members: formData.members.filter(id => id !== emp.id)
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            members: [...formData.members, emp.id]
                                                        });
                                                    }
                                                }}
                                            >
                                                {/* Checkbox */}
                                                <View style={{
                                                    width: wp(5),
                                                    height: wp(5),
                                                    borderRadius: normalize(4),
                                                    borderWidth: 2,
                                                    borderColor: formData.members.includes(emp.id) ? '#48327d' : '#cbd5e1',
                                                    backgroundColor: formData.members.includes(emp.id) ? '#48327d' : 'white',
                                                    marginRight: wp(3),
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    {formData.members.includes(emp.id) && (
                                                        <Text style={{ color: 'white', fontSize: normalize(12), fontWeight: 'bold' }}>✓</Text>
                                                    )}
                                                </View>

                                                {/* Employee Info */}
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{
                                                        fontSize: normalize(14),
                                                        fontWeight: '600',
                                                        color: '#2d3436'
                                                    }}>
                                                        {emp.first_name} {emp.last_name}
                                                    </Text>
                                                    <Text style={{
                                                        fontSize: 12,
                                                        color: '#636e72',
                                                        marginTop: 2
                                                    }}>
                                                        {emp.role}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    {managers.filter(emp => {
                                        if (!emp || String(emp.id) === String(formData.manager_id)) return false;
                                        const q = (memberSearchTerm || '').toLowerCase();
                                        const firstName = (emp.first_name || '').toLowerCase();
                                        const lastName = (emp.last_name || '').toLowerCase();
                                        const role = (emp.role || '').toLowerCase();
                                        const employeeId = (emp.employee_id || '').toLowerCase();
                                        return firstName.includes(q) || lastName.includes(q) || role.includes(q) || employeeId.includes(q);
                                    }).length === 0 && (
                                            <View style={{ padding: 20, alignItems: 'center' }}>
                                                <Text style={{ color: '#a0aec0', fontSize: 12, fontStyle: 'italic' }}>
                                                    {memberSearchTerm ? 'No matching employees found' : 'No employees available'}
                                                </Text>
                                            </View>
                                        )}
                                </ScrollView>

                                {/* Helper Text */}
                                <Text style={{
                                    fontSize: 10,
                                    color: '#636e72',
                                    fontStyle: 'italic',
                                    marginTop: 6
                                }}>
                                    * Selected members will be added to the team and a WhatsApp group will be created automatically.
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, styles.cancelBtn]}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.modalBtn, styles.saveBtn, (!formData.name?.trim() || !formData.description?.trim() || !formData.manager_id || isSubmitting) && { opacity: 0.5 }]}
                                disabled={!formData.name?.trim() || !formData.description?.trim() || !formData.manager_id || isSubmitting}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    {isSubmitting && <ActivityIndicator size="small" color="white" />}
                                    <Text style={styles.saveText}>{isSubmitting ? 'Saving...' : (editingTeam ? 'Update Team' : 'Create Team')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Member Management Modal */}
            <Modal visible={memberModalOpen} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { flex: 1 }]}>
                    <View style={[styles.modalContent, { maxHeight: '90%', paddingBottom: hp(3) }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View>
                                <Text style={styles.modalTitle}>Manage Members</Text>
                                <Text style={{ color: '#636e72', fontSize: 14, marginTop: -15, marginBottom: 10 }}>{editingTeam?.name}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setMemberModalOpen(false)} style={{ padding: 5, marginTop: -20 }}>
                                <CloseIcon color="#636e72" size={20} />
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
                            <View style={[styles.modalOverlay, { flex: 1, justifyContent: 'flex-end' }]}>
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
                                    <ScrollView style={{ maxHeight: hp(40) }}>
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
                                                            padding: wp(4),
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
                                                        <Text style={{ color: isAdded ? '#b2bec3' : '#2d3436', fontWeight: '500', fontSize: normalize(14) }}>
                                                            {emp.first_name} {emp.last_name} ({emp.role})
                                                        </Text>
                                                        {isAdded && (
                                                            <Text style={{ fontSize: normalize(12), color: '#b2bec3', fontStyle: 'italic' }}>Added</Text>
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
                        <View style={{ marginTop: hp(2.5), flexShrink: 1 }}>
                            <Text style={[styles.inputLabel, { marginBottom: hp(1.2), textTransform: 'uppercase', letterSpacing: 0.5, fontSize: normalize(11) }]}>
                                CURRENT MEMBERS ({selectedTeamMembers.length})
                            </Text>

                            {selectedTeamMembers.length === 0 ? (
                                <View style={styles.emptyMemberList}>
                                    <Text style={{ color: '#a0aec0', textAlign: 'center', fontSize: normalize(14) }}>No members in this team yet.</Text>
                                </View>
                            ) : (
                                <ScrollView style={{ maxHeight: hp(40) }} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: hp(2.5) }}>
                                    <View style={{ gap: hp(1.2) }}>
                                        {selectedTeamMembers.map(member => (
                                            <View key={member.id} style={styles.memberItem}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: wp(2.5), flex: 1 }}>
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

                        <View style={{ marginTop: hp(2.5), paddingTop: hp(2.5), borderTopWidth: 1, borderTopColor: '#f1f2f6', alignItems: 'flex-end' }}>
                            <TouchableOpacity
                                onPress={() => setMemberModalOpen(false)}
                                style={{
                                    backgroundColor: '#f1f2f6',
                                    paddingHorizontal: wp(6),
                                    paddingVertical: hp(1.5),
                                    borderRadius: normalize(8),
                                }}
                            >
                                <Text style={{ color: '#636e72', fontWeight: 'bold', fontSize: normalize(14) }}>Done</Text>
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
        paddingHorizontal: wp(5),
        paddingTop: Platform.OS === 'ios' ? hp(7) : hp(5),
        paddingBottom: hp(2.5),
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6'
    },
    pageTitle: {
        fontSize: normalize(22),
        fontWeight: '900',
        color: '#1e293b'
    },
    pageSubtitle: {
        fontSize: normalize(14),
        color: '#64748b',
        marginTop: hp(0.5),
    },
    addBtn: {
        backgroundColor: '#48327d',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: normalize(12),
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5),
        shadowColor: '#48327d',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    addBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: normalize(14),
    },
    card: {
        backgroundColor: 'white',
        borderRadius: normalize(16),
        padding: wp(5),
        marginBottom: hp(2),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: hp(1),
    },
    cardTitle: {
        fontSize: normalize(18),
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: hp(0.2),
    },
    memberCountText: {
        fontSize: normalize(14),
        color: '#64748b',
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: wp(3),
    },
    iconBtn: {
        padding: wp(1),
    },
    descriptionText: {
        fontSize: normalize(14),
        color: '#475569',
        lineHeight: normalize(20),
        marginBottom: hp(2.5),
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: hp(2),
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
        flex: 1,
        marginRight: wp(3),
        minWidth: 0,
    },
    managerName: {
        fontSize: normalize(13),
        color: '#64748b',
        fontWeight: '600',
        flexShrink: 1,
    },
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(1.5),
        flexShrink: 0,
    },
    manageBtnText: {
        fontSize: normalize(13),
        fontWeight: '700',
        color: '#48327d',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: wp(5)
    },
    modalContent: {
        backgroundColor: 'white',
        width: '100%',
        borderRadius: normalize(16),
        padding: wp(5),
        paddingBottom: hp(2),
        elevation: 5
    },
    modalTitle: {
        fontSize: normalize(20),
        fontWeight: 'bold',
        marginBottom: hp(2.5),
        color: '#2d3436'
    },
    inputLabel: {
        fontSize: normalize(12),
        fontWeight: 'bold',
        color: '#636e72',
        marginBottom: hp(0.8),
        marginTop: hp(1.2)
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: normalize(8),
        padding: wp(3),
        fontSize: normalize(16),
        color: '#2d3436',
        backgroundColor: '#f8f9fa'
    },
    modalButtons: {
        flexDirection: 'row',
        gap: wp(3),
        marginTop: hp(3)
    },
    modalBtn: {
        flex: 1,
        padding: hp(1.8),
        borderRadius: normalize(10),
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
    },
    addMemberSection: {
        backgroundColor: '#f8f9fa',
        padding: wp(4),
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    addMemberBtn: {
        backgroundColor: '#48327d',
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
        borderRadius: normalize(8),
        justifyContent: 'center',
        alignItems: 'center'
    },
    addMemberBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: normalize(14)
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: wp(4),
        backgroundColor: 'white',
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: hp(1),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
    },
    memberAvatar: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        backgroundColor: '#f3e5f5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    memberAvatarText: {
        color: '#48327d',
        fontWeight: 'bold',
        fontSize: normalize(16)
    },
    memberName: {
        fontSize: normalize(14),
        fontWeight: 'bold',
        color: '#2d3436'
    },
    memberRole: {
        fontSize: normalize(12),
        color: '#636e72'
    },
    removeMemberBtn: {
        backgroundColor: 'transparent',
    },
    removeMemberText: {
        color: '#ff6b6b',
        fontWeight: '600',
        fontSize: normalize(12)
    },
    emptyMemberList: {
        padding: wp(10),
        backgroundColor: 'white',
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed'
    },
});

export default TeamManagementScreen;
