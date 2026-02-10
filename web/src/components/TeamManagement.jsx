import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Briefcase,
    X,
    UserPlus
} from 'lucide-react';
import { teamApi } from '../services/api';
import ConfirmDialog from './Common/ConfirmDialog';
import LoadingSpinner from './Common/LoadingSpinner';

const TeamManagement = ({ user }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', manager_id: '' });
    const [managers, setManagers] = useState([]); // Potential managers (employees)

    // Member Management State
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [selectedEmployeeToAdd, setSelectedEmployeeToAdd] = useState('');
    const [membersLoading, setMembersLoading] = useState(false);
    const [isClosingTeamModal, setIsClosingTeamModal] = useState(false);
    const [isClosingMemberModal, setIsClosingMemberModal] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({ isOpen: false, teamId: null, teamName: '' });
    const [removeMemberConfig, setRemoveMemberConfig] = useState({ isOpen: false, memberId: null, memberName: '' });
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchTeams();
        fetchPotentialManagers();
    }, []);

    const fetchTeams = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const data = await teamApi.getTeams();
            setTeams(data);
        } catch (error) {
            console.error("Failed to fetch teams", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPotentialManagers = async () => {
        try {
            const data = await teamApi.getAttendanceRegistry();
            setManagers(data);
        } catch (error) {
            console.error("Failed to fetch potential managers", error);
        }
    };

    const fetchTeamMembers = async (teamId) => {
        setMembersLoading(true);
        try {
            const data = await teamApi.getMembers(teamId);
            setSelectedTeamMembers(data);

            // Use cached managers (all employees) if available, otherwise fetch
            let allEmployees = managers;
            if (allEmployees.length === 0) {
                allEmployees = await teamApi.getAttendanceRegistry();
                setManagers(allEmployees);
            }

            const memberIds = new Set(data.map(m => m.id));
            setAvailableEmployees(allEmployees.filter(emp => !memberIds.has(emp.id)));
        } catch (error) {
            console.error("Failed to fetch team members", error);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            if (editingTeam) {
                await teamApi.updateTeam(editingTeam.id, formData);
            } else {
                await teamApi.createTeam(formData);
            }
            setIsModalOpen(false);
            setEditingTeam(null);
            setFormData({ name: '', description: '', manager_id: '' });
            fetchTeams(true);
        } catch (error) {
            console.error("Failed to save team", error);
            alert("Failed to save team");
        }
    };

    const handleAddMember = async () => {
        if (!selectedEmployeeToAdd) return;
        setIsAddingMember(true);
        try {
            await teamApi.updateMember(selectedEmployeeToAdd, {
                team_id: editingTeam.id,
                acting_user_id: user?.id
            });
            setSelectedEmployeeToAdd('');
            fetchTeamMembers(editingTeam.id);
            fetchTeams(true);
        } catch (error) {
            alert("Failed to add member");
        } finally {
            setIsAddingMember(false);
        }
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await teamApi.deleteTeam(deleteConfig.teamId);
            await fetchTeams(true);
            setDeleteConfig({ ...deleteConfig, isOpen: false });
        } catch (error) {
            console.error("Failed to delete team", error);
            alert("Failed to delete team");
        } finally {
            setIsDeleting(false);
        }
    };

    const openMemberModal = (team) => {
        setEditingTeam(team);
        setSelectedEmployeeToAdd('');
        fetchTeamMembers(team.id);
        setMemberModalOpen(true);
    };

    const closeMemberModal = () => {
        setMemberModalOpen(false);
        setSelectedEmployeeToAdd('');
        setEditingTeam(null);
    };

    const confirmRemoveMember = async () => {
        setIsDeleting(true);
        try {
            await teamApi.updateMember(removeMemberConfig.memberId, {
                remove_team_id: editingTeam.id,
                acting_user_id: user?.id
            });
            await fetchTeamMembers(editingTeam.id);
            await fetchTeams(true);
            setRemoveMemberConfig({ ...removeMemberConfig, isOpen: false });
        } catch (error) {
            alert("Failed to remove member");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 tab:p-8 max-w-[1600px] mx-auto overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
                    <p className="text-gray-500">Manage organizational teams and members</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTeam(null);
                        setFormData({ name: '', description: '', manager_id: '' });
                        setIsModalOpen(true);
                    }}
                    className="bg-[#48327d] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#3a2865] transition-colors"
                >
                    <Plus size={20} /> Create Team
                </button>
            </div>

            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search teams..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#48327d]/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map(team => (
                        <div key={team.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1">{team.name}</h3>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                                        {team.member_count} Members
                                    </span>
                                </div>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingTeam(team);
                                            setFormData({
                                                name: team.name,
                                                description: team.description || '',
                                                manager_id: team.manager_id || ''
                                            });
                                            setIsModalOpen(true);
                                        }}
                                        className="p-1.5 text-slate-900 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                                        title="Edit Team"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfig({ isOpen: true, teamId: team.id, teamName: team.name })}
                                        className="p-1.5 text-slate-900 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                        title="Delete Team"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 mb-6 line-clamp-2 min-h-[40px] leading-relaxed">
                                {team.description || "No description provided."}
                            </p>

                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Team Lead</p>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 truncate" title={team.manager_name}>
                                        <Briefcase size={14} className="text-gray-400 shrink-0" />
                                        <span className="truncate">{team.manager_name || "Unassigned"}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openMemberModal(team)}
                                    className="shrink-0 px-3 py-2 bg-[#f8fafc] hover:bg-[#f1f5f9] text-gray-600 hover:text-[#48327d] text-xs font-bold rounded-lg transition-colors flex items-center gap-2 border border-gray-100"
                                >
                                    <Users size={14} />
                                    <span>Manage</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Team Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-md overflow-hidden animate-modal-in">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="font-bold text-lg">{editingTeam ? 'Edit Team' : 'Create New Team'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Manager</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.manager_id}
                                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                >
                                    <option value="">Select Manager</option>
                                    {managers.map(mgr => (
                                        <option key={mgr.id} value={mgr.id}>{mgr.first_name} {mgr.last_name} ({mgr.employee_id})</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-2 bg-[#48327d] text-white rounded-lg font-bold hover:bg-[#3a2865]">
                                {editingTeam ? 'Update Team' : 'Create Team'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Member Management Modal */}
            {memberModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden animate-modal-in">
                        <div className="p-4 border-b flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-lg">Manage Members: {editingTeam?.name}</h2>
                            </div>
                            <button onClick={closeMemberModal}><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-2 mb-6">
                                <select
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    value={selectedEmployeeToAdd}
                                    onChange={(e) => setSelectedEmployeeToAdd(e.target.value)}
                                >
                                    <option value="">Select Employee to Add</option>
                                    {availableEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_id})</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddMember}
                                    disabled={!selectedEmployeeToAdd || isAddingMember}
                                    className="bg-[#48327d] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAddingMember ? <LoadingSpinner size={14} /> : <UserPlus size={16} />}
                                    Add
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto">
                                {membersLoading ? (
                                    <div className="flex justify-center py-10"><LoadingSpinner /></div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Member</th>
                                                <th className="px-4 py-2 text-left">Role</th>
                                                <th className="px-4 py-2 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedTeamMembers.length === 0 ? (
                                                <tr><td colSpan="3" className="px-4 py-10 text-center text-gray-400">No members in this team yet.</td></tr>
                                            ) : (
                                                selectedTeamMembers.map(member => (
                                                    <tr key={member.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold">{member.name || `${member.first_name} ${member.last_name}`}</div>
                                                            <div className="text-xs text-gray-500">{member.employee_id}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">{member.role}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => setRemoveMemberConfig({ isOpen: true, memberId: member.id, memberName: member.first_name })}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion confirmation dialog */}
            <ConfirmDialog
                isOpen={deleteConfig.isOpen}
                title="Delete Team"
                message={`Are you sure you want to delete the "${deleteConfig.teamName}" team? This action cannot be undone.`}
                confirmText="Delete Team"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
                type="danger"
                isLoading={isDeleting}
                closeOnConfirm={false}
            />

            {/* Member removal confirmation dialog */}
            <ConfirmDialog
                isOpen={removeMemberConfig.isOpen}
                title="Remove Member"
                message={`Are you sure you want to remove "${removeMemberConfig.memberName}" from the team?`}
                confirmText="Remove Member"
                onConfirm={confirmRemoveMember}
                onCancel={() => setRemoveMemberConfig({ ...removeMemberConfig, isOpen: false })}
                type="danger"
                isLoading={isDeleting}
                closeOnConfirm={false}
            />
        </div>
    );
};

export default TeamManagement;
