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

    useEffect(() => {
        fetchTeams();
        fetchPotentialManagers();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
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
            // Reusing getRegistry to get list of employees to pick a manager from
            const data = await teamApi.getAttendanceRegistry();
            setManagers(data);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const handleOpenModal = (team = null) => {
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
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTeam) {
                await teamApi.updateTeam(editingTeam.id, formData);
            } else {
                await teamApi.createTeam(formData);
            }
            setIsModalOpen(false);
            fetchTeams();
        } catch (error) {
            alert("Failed to save team. Name usually must be unique.");
        }
    };

    const handleDelete = (team) => {
        setDeleteConfig({
            isOpen: true,
            teamId: team.id,
            teamName: team.name
        });
    };

    const confirmDelete = async () => {
        try {
            await teamApi.deleteTeam(deleteConfig.teamId);
            fetchTeams();
            setDeleteConfig({ ...deleteConfig, isOpen: false });
        } catch (error) {
            console.error("Failed to delete team", error);
            alert("Failed to delete team");
        }
    };

    const handleManageMembers = async (team) => {
        setEditingTeam(team);
        setMemberModalOpen(true);
        fetchTeamMembers(team.id);
        fetchPotentialManagers();
    };

    const fetchTeamMembers = async (teamId) => {
        try {
            setMembersLoading(true);
            const data = await teamApi.getMembers(teamId);
            setSelectedTeamMembers(data);
        } catch (error) {
            console.error("Failed to fetch team members", error);
        } finally {
            setMembersLoading(false);
        }
    };

    useEffect(() => {
        if (memberModalOpen && editingTeam) {
            const currentMemberIds = selectedTeamMembers.map(m => m.id);
            const available = managers.filter(emp => !currentMemberIds.includes(emp.id));
            setAvailableEmployees(available);
        }
    }, [selectedTeamMembers, managers, memberModalOpen, editingTeam]);

    const handleAddMember = async () => {
        if (!selectedEmployeeToAdd) return;
        try {
            await teamApi.updateMember(selectedEmployeeToAdd, {
                team_id: editingTeam.id,
                acting_user_id: user?.id
            });
            fetchTeamMembers(editingTeam.id);
            fetchTeams();
            setSelectedEmployeeToAdd('');
        } catch (error) {
            alert("Failed to add member");
        }
    };

    const closeMemberModal = () => {
        setIsClosingMemberModal(true);
        setTimeout(() => {
            setMemberModalOpen(false);
            setSelectedEmployeeToAdd('');
            setSelectedTeamMembers([]);
            setIsClosingMemberModal(false);
        }, 200);
    };

    const closeTeamModal = () => {
        setIsClosingTeamModal(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setEditingTeam(null);
            setFormData({ name: '', description: '', manager_id: '' });
            setIsClosingTeamModal(false);
        }, 200);
    };

    const handleRemoveMember = (member) => {
        setRemoveMemberConfig({
            isOpen: true,
            memberId: member.id,
            memberName: member.name
        });
    };

    const confirmRemoveMember = async () => {
        try {
            await teamApi.updateMember(removeMemberConfig.memberId, {
                team_id: null,
                acting_user_id: user?.id
            });
            fetchTeamMembers(editingTeam.id);
            fetchTeams();
            setRemoveMemberConfig({ ...removeMemberConfig, isOpen: false });
        } catch (error) {
            alert("Failed to remove member");
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 tab:p-8 max-w-[1600px] mx-auto overflow-y-auto">
            <div className="animate-in fade-in duration-500">
                {/* Header & Search Bar combined for better alignment */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 mm:mb-8 bg-white p-4 mm:p-6 rounded-[1.5rem] shadow-sm border border-[#e2e8f0]">
                    <div className="flex-1">
                        <h1 className="text-xl mm:text-2xl font-black text-[#1e293b] tracking-tight">Team Management</h1>
                        <p className="text-[11px] mm:text-xs text-[#64748b] font-medium mt-0.5">Manage all departments, teams and their respective leads</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        {/* Search Bar */}
                        <div className="relative group w-full sm:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#48327d] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search teams..."
                                className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-sm font-bold text-[#1e293b] outline-none focus:border-[#48327d]/30 focus:ring-4 focus:ring-[#48327d]/5 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#48327d] text-white rounded-xl hover:bg-[#3d2a6a] transition-all shadow-lg shadow-purple-500/20 text-sm font-black active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            Create Team
                        </button>
                    </div>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#48327d]"></div>
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-[#a0aec0]">
                            No teams found
                        </div>
                    ) : (
                        filteredTeams.map(team => (
                            <div key={team.id} className="bg-white rounded-xl p-5 border border-[#e2e8f0] hover:shadow-lg transition-all group relative">
                                {/* Header Row: Icon + Name */}
                                <div className="flex items-start gap-4 mb-4 pr-16">
                                    <div className="w-12 h-12 rounded-xl bg-[#f3e5f5] flex items-center justify-center text-[#48327d] shrink-0">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#2d3436] leading-tight mb-1">{team.name}</h3>
                                        <p className="text-xs text-[#636e72] line-clamp-2">{team.description || "No description provided"}</p>
                                    </div>
                                </div>

                                {/* Actions (Absolute Top Right) */}
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleManageMembers(team)}
                                        className="p-1.5 hover:bg-[#f1f2f6] rounded-lg text-[#48327d]"
                                        title="Manage Members"
                                    >
                                        <Users size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(team)}
                                        className="p-1.5 hover:bg-[#f1f2f6] rounded-lg text-[#636e72]"
                                        title="Edit Team"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Team"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Data Layout matching reference */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#f1f2f6] items-center">
                                    <div>
                                        <p className="text-[10px] text-[#a0aec0] font-bold uppercase tracking-wider mb-1">TEAM LEAD</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#dfe6e9] flex items-center justify-center text-[10px] font-bold text-[#636e72]">
                                                {team.manager_name?.[0] || "?"}
                                            </div>
                                            <p className="text-sm font-bold text-[#2d3436]">{team.manager_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-[#a0aec0] font-bold uppercase tracking-wider mb-1">MEMBERS</p>
                                        <p className="text-xl font-bold text-[#2d3436]">{team.member_count}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create/Edit Team Modal */}
            {isModalOpen && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 mm:p-6 bg-[#1e293b]/60 ${isClosingTeamModal ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
                    <div className={`bg-white rounded-[1.5rem] w-full max-w-md shadow-2xl border border-white/20 ${isClosingTeamModal ? 'animate-modal-out' : 'animate-modal-in'} flex flex-col max-h-[90vh] overflow-hidden`}>
                        <div className="p-6 border-b border-[#f1f5f9] flex justify-between items-center">
                            <h2 className="text-xl font-black text-[#1e293b] tracking-tight">{editingTeam ? 'Edit Team' : 'Create New Team'}</h2>
                            <button onClick={closeTeamModal} className="p-2 hover:bg-[#f1f5f9] rounded-full text-[#94a3b8] transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                            <div>
                                <label className="block text-sm font-bold text-[#636e72] mb-2">TEAM NAME</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#f8f9fa] border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#2d3436] focus:border-[#48327d] focus:ring-2 focus:ring-[#48327d]/20 transition-all outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Engineering"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#636e72] mb-2">DESCRIPTION</label>
                                <textarea
                                    className="w-full bg-[#f8f9fa] border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#2d3436] focus:border-[#48327d] focus:ring-2 focus:ring-[#48327d]/20 transition-all outline-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the team..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#636e72] mb-2">TEAM LEAD</label>
                                <select
                                    className="w-full bg-[#f8f9fa] border border-[#e2e8f0] rounded-xl px-4 py-3 text-[#2d3436] focus:border-[#48327d] focus:ring-2 focus:ring-[#48327d]/20 transition-all outline-none"
                                    value={formData.manager_id}
                                    onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                                >
                                    <option value="">Select a Manager...</option>
                                    {managers.map(mgr => (
                                        <option key={mgr.id} value={mgr.id}>
                                            {mgr.first_name} {mgr.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={closeTeamModal} className="px-5 py-2 text-[#64748b] font-bold hover:bg-[#f1f5f9] rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button type="submit" className="px-6 py-2 bg-[#48327d] text-white font-bold rounded-xl hover:bg-[#3d2a6a] shadow-lg shadow-purple-500/20 transition-all active:scale-95">
                                    {editingTeam ? 'Update Team' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {memberModalOpen && editingTeam && (
                <div className={`fixed inset-0 z-[110] flex items-center justify-center bg-[#1e293b]/60 p-4 mm:p-6 ${isClosingMemberModal ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
                    <div className={`bg-white rounded-[2rem] w-full max-w-xl shadow-2xl border border-white/20 ${isClosingMemberModal ? 'animate-modal-out' : 'animate-modal-in'} max-h-[85vh] flex flex-col overflow-hidden`}>
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <div className="p-1.5 bg-[#48327d]/10 rounded-lg text-[#48327d]">
                                        <Users size={18} />
                                    </div>
                                    <h2 className="text-xl font-black text-[#1e293b] tracking-tight">Manage Members</h2>
                                </div>
                                <p className="text-xs text-[#64748b] font-medium">Team: <span className="text-[#48327d] font-bold">{editingTeam.name}</span></p>
                            </div>
                            <button
                                onClick={closeMemberModal}
                                className="p-2 hover:bg-[#f1f5f9] rounded-full text-[#94a3b8] hover:text-[#1e293b] transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Add Member Bar */}
                        <div className="px-6 pb-5">
                            <div className="bg-[#f8fafc] p-1 rounded-xl border border-[#e2e8f0] flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#48327d]/10 transition-all">
                                <div className="flex-1 flex items-center gap-2 px-2">
                                    <UserPlus className="text-[#94a3b8]" size={16} />
                                    <select
                                        className="w-full bg-transparent py-2 text-xs font-bold text-[#1e293b] outline-none cursor-pointer placeholder:text-[#94a3b8]"
                                        value={selectedEmployeeToAdd}
                                        onChange={e => setSelectedEmployeeToAdd(e.target.value)}
                                    >
                                        <option value="">Select an employee to add...</option>
                                        {availableEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.first_name} {emp.last_name} — {emp.role}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddMember}
                                    disabled={!selectedEmployeeToAdd}
                                    className="px-4 py-2 bg-[#48327d] text-white font-bold rounded-lg hover:bg-[#3d2a6a] disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-purple-500/10 active:scale-95 whitespace-nowrap text-xs"
                                >
                                    Add Member
                                </button>
                            </div>
                        </div>

                        {/* Members List Container */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-[#fdfdff] border-t border-[#f1f5f9]">
                            <div className="px-6 py-3 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                <h3 className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.1em]">Current Team Members ({selectedTeamMembers.length})</h3>
                            </div>

                            <div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 pt-1 min-h-[200px]">
                                {membersLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-[#48327d]">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                                        <p className="mt-4 text-xs font-bold text-[#64748b]">Syncing members...</p>
                                    </div>
                                ) : selectedTeamMembers.length === 0 ? (
                                    <div className="text-center py-16 flex flex-col items-center gap-4 bg-white border-2 border-dashed border-[#e2e8f0] rounded-3xl">
                                        <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#cbd5e1]">
                                            <Users size={32} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#475569]">No members assigned yet</p>
                                            <p className="text-sm text-[#94a3b8]">Add employees from the dropdown above</p>
                                        </div>
                                    </div>
                                ) : (
                                    selectedTeamMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="group flex items-center justify-between p-3.5 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#48327d]/30 hover:shadow-md hover:shadow-purple-500/5 transition-all animate-in fade-in slide-in-from-left-2 duration-300"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#48327d] to-[#6c5ce7] flex items-center justify-center text-white font-black text-base shadow-inner ring-4 ring-[#48327d]/5">
                                                    {member.name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-[#1e293b] text-sm truncate">{member.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-bold text-[#64748b] bg-[#f1f5f9] px-1.5 py-0.5 rounded-md">{member.role}</span>
                                                        <span className="text-[9px] text-[#94a3b8] font-medium tracking-tight">ID: {member.employee_id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(member)}
                                                className="opacity-0 group-hover:opacity-100 p-2.5 text-[#ef4444] hover:bg-red-50 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5"
                                            >
                                                <Trash2 size={16} />
                                                <span className="hidden sm:inline">Remove</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#f1f5f9] flex justify-end">
                            <button
                                onClick={closeMemberModal}
                                className="px-6 py-2 bg-white border border-[#e2e8f0] text-[#475569] font-black rounded-lg hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-all text-xs shadow-sm active:scale-95"
                            >
                                Done
                            </button>
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
            />
        </div>
    );
};

export default TeamManagement;
