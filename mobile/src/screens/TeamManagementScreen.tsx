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
    Platform
} from 'react-native';
import { teamApi } from '../services/api';

const TeamManagementScreen = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTeam, setEditingTeam] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '', manager_id: '' });
    const [managers, setManagers] = useState<any[]>([]);

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

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>T</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.member_count} Members</Text>
                </View>
                <View style={styles.actions}>
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
                            <TouchableOpacity onPress={handleSave} style={[styles.modalBtn, styles.saveBtn]}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
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
    editIcon: { fontSize: 16 },
    deleteIcon: { fontSize: 16 },
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
