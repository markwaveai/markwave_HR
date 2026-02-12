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
    const [formData, setFormData] = useState({ name: '', description: '', manager_id: '', members: [] });
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [memberSearchTerm, setMemberSearchTerm] = useState('');

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
        setIsSubmitting(true);
        try {
            if (editingTeam) {
                await teamApi.updateTeam(editingTeam.id, formData);
            } else {
                await teamApi.createTeam(formData);
            }
            setIsModalOpen(false);
            setEditingTeam(null);
            setFormData({ name: '', description: '', manager_id: '', members: [] });
            setMemberSearchTerm('');
            fetchTeams(true);
        } catch (error) {
            console.error("Failed to save team", error);
            if (error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert("Failed to save team");
            }
        } finally {
            setIsSubmitting(false);
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

    const filteredManagers = managers
        .filter(mgr => String(mgr.id) !== String(formData.manager_id))
        .filter(mgr =>
            (mgr.first_name?.toLowerCase() || '').includes(memberSearchTerm.toLowerCase()) ||
            (mgr.last_name?.toLowerCase() || '').includes(memberSearchTerm.toLowerCase()) ||
            (mgr.role?.toLowerCase() || '').includes(memberSearchTerm.toLowerCase()) ||
            String(mgr.employee_id || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
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
                        setFormData({ name: '', description: '', manager_id: '', members: [] });
                        setMemberSearchTerm('');
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
                                                manager_id: team.manager_id || '',
                                                members: []
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-modal-in shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-bold text-lg text-gray-800">{editingTeam ? 'Edit Team' : 'Create New Team'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateTeam} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#48327d]/20 focus:border-[#48327d]"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#48327d]/20 focus:border-[#48327d]"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team Manager</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#48327d]/20 focus:border-[#48327d]"
                                    value={formData.manager_id}
                                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                >
                                    <option value="">Select Manager</option>
                                    {managers.map(mgr => (
                                        <option key={mgr.id} value={mgr.id}>{mgr.first_name} {mgr.last_name} ({mgr.employee_id})</option>
                                    ))}
                                </select>
                            </div>

                            {!editingTeam && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Initial Members</label>

                                    {/* Search Input for Members */}
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#48327d]/20 focus:border-[#48327d]"
                                            value={memberSearchTerm}
                                            onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="border rounded-lg max-h-48 overflow-y-auto p-2 bg-gray-50">
                                        {filteredManagers.map(emp => (
                                            <label key={emp.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer group transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-[#48327d] focus:ring-[#48327d]"
                                                    checked={formData.members?.includes(emp.id)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        const currentMembers = formData.members || [];
                                                        if (isChecked) {
                                                            setFormData({ ...formData, members: [...currentMembers, emp.id] });
                                                        } else {
                                                            setFormData({ ...formData, members: currentMembers.filter(id => id !== emp.id) });
                                                        }
                                                    }}
                                                />
                                                <div className="text-sm">
                                                    <div className="font-semibold text-gray-700 group-hover:text-[#48327d] transition-colors">{emp.first_name} {emp.last_name}</div>
                                                    <div className="text-xs text-gray-400 group-hover:text-gray-500">{emp.role}</div>
                                                </div>
                                            </label>
                                        ))}
                                        {filteredManagers.length === 0 && (
                                            <div className="text-xs text-gray-400 p-4 text-center">
                                                {memberSearchTerm ? 'No matching employees found' : 'No employees available'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    !formData.name?.trim() ||
                                    !formData.description?.trim() ||
                                    !formData.manager_id ||
                                    (editingTeam &&
                                        formData.name === editingTeam.name &&
                                        formData.description === (editingTeam.description || '') &&
                                        String(formData.manager_id) === String(editingTeam.manager_id || '')
                                    )
                                }
                                className="w-full py-2.5 bg-[#48327d] text-white rounded-lg font-bold hover:bg-[#3a2865] active:scale-[0.98] transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size={16} color="border-white" />
                                        <span>{editingTeam ? 'Updating...' : 'Creating...'}</span>
                                    </>
                                ) : (
                                    <span>{editingTeam ? 'Update Team' : 'Create Team'}</span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Member Management Modal */}
            {memberModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-modal-in shadow-2xl">
                        <div className="p-4 border-b flex justify-between items-center bg-[#48327d] text-white">
                            <div>
                                <h2 className="font-bold text-lg">Manage Members: {editingTeam?.name}</h2>
                            </div>
                            <button onClick={closeMemberModal} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-2 mb-6">
                                <select
                                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/20 focus:border-[#48327d]"
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
                                    className="bg-[#48327d] text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:bg-[#3a2865] transition-colors"
                                >
                                    {isAddingMember ? <LoadingSpinner size={14} /> : <UserPlus size={16} />}
                                    Add
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto border rounded-lg bg-gray-50/30">
                                {membersLoading ? (
                                    <div className="flex justify-center py-20"><LoadingSpinner /></div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-gray-50 text-gray-500 uppercase text-[10px] font-bold border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Member</th>
                                                <th className="px-6 py-3 text-left">Role</th>
                                                <th className="px-6 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y bg-white">
                                            {selectedTeamMembers.length === 0 ? (
                                                <tr><td colSpan="3" className="px-4 py-16 text-center text-gray-400 italic">No members in this team yet.</td></tr>
                                            ) : (
                                                selectedTeamMembers.map(member => (
                                                    <tr key={member.id} className="hover:bg-purple-50/30 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-gray-800">{member.name || `${member.first_name} ${member.last_name}`}</div>
                                                            <div className="text-xs text-gray-400 font-medium">{member.employee_id}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 font-medium">{member.role}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => setRemoveMemberConfig({ isOpen: true, memberId: member.id, memberName: member.name || member.first_name })}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Remove from Team"
                                                            >
                                                                <Trash2 size={16} />
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
