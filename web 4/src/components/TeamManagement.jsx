import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    Briefcase
} from 'lucide-react';
import { teamApi } from '../services/api';

const TeamManagement = () => {
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

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this team?")) {
            try {
                await teamApi.deleteTeam(id);
                fetchTeams();
            } catch (error) {
                console.error("Failed to delete team", error);
            }
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
            const data = await teamApi.getMembers(teamId);
            setSelectedTeamMembers(data);
        } catch (error) {
            console.error("Failed to fetch team members", error);
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
            await teamApi.updateMember(selectedEmployeeToAdd, { team_id: editingTeam.id });
            fetchTeamMembers(editingTeam.id);
            fetchTeams();
            setSelectedEmployeeToAdd('');
        } catch (error) {
            alert("Failed to add member");
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (window.confirm("Remove this member from the team?")) {
            try {
                await teamApi.updateMember(memberId, { team_id: null });
                fetchTeamMembers(editingTeam.id);
                fetchTeams();
            } catch (error) {
                alert("Failed to remove member");
            }
        }
    };

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#2d3436] mb-1">Team Management</h1>
                    <p className="text-[#636e72]">Manage all departments and teams</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#48327d] text-white rounded-xl hover:bg-[#3d2a6a] transition-all shadow-lg shadow-purple-500/20"
                >
                    <Plus size={20} />
                    Create Team
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#e2e8f0] mb-6 flex items-center gap-3">
                <Search className="text-[#a0aec0]" size={20} />
                <input
                    type="text"
                    placeholder="Search teams..."
                    className="flex-1 outline-none text-[#2d3436]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    onClick={() => handleDelete(team.id)}
                                    className="p-1.5 hover:bg-[#f1f2f6] rounded-lg text-[#ff6b6b]"
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-2xl font-bold text-[#2d3436] mb-6">
                            {editingTeam ? 'Edit Team' : 'Create New Team'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-[#f1f2f6] text-[#636e72] font-bold rounded-xl hover:bg-[#e2e6ea] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-[#48327d] text-white font-bold rounded-xl hover:bg-[#3d2a6a] shadow-lg shadow-purple-500/30 transition-all"
                                >
                                    {editingTeam ? 'Save Changes' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Members Modal */}
            {memberModalOpen && editingTeam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#2d3436]">Manage Members</h2>
                                <p className="text-[#636e72]">{editingTeam.name}</p>
                            </div>
                            <button
                                onClick={() => setMemberModalOpen(false)}
                                className="p-2 hover:bg-[#f1f2f6] rounded-full text-[#636e72]"
                            >
                                <Users size={24} />
                            </button>
                        </div>

                        {/* Add Member Section */}
                        <div className="bg-[#f8f9fa] p-4 rounded-xl mb-6 flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-[#636e72] mb-1 uppercase tracking-wider">Add Employee to Team</label>
                                <select
                                    className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-[#2d3436] focus:border-[#48327d] outline-none"
                                    value={selectedEmployeeToAdd}
                                    onChange={e => setSelectedEmployeeToAdd(e.target.value)}
                                >
                                    <option value="">Select an employee...</option>
                                    {availableEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name} ({emp.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAddMember}
                                disabled={!selectedEmployeeToAdd}
                                className="px-6 py-2.5 bg-[#48327d] text-white font-bold rounded-xl hover:bg-[#3d2a6a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Add
                            </button>
                        </div>

                        {/* Current Members List */}
                        <div className="flex-1 overflow-y-auto">
                            <h3 className="text-sm font-bold text-[#636e72] mb-3 uppercase tracking-wider">Current Members ({selectedTeamMembers.length})</h3>

                            {selectedTeamMembers.length === 0 ? (
                                <div className="text-center py-10 text-[#a0aec0] bg-white border border-dashed border-[#e2e8f0] rounded-xl">
                                    No members in this team yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedTeamMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-[#e2e8f0] rounded-xl hover:shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#f3e5f5] flex items-center justify-center text-[#48327d] font-bold">
                                                    {member.name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#2d3436]">{member.name}</p>
                                                    <p className="text-xs text-[#636e72]">{member.role}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-[#ff6b6b] hover:bg-[#fff0f0] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-[#f1f2f6] flex justify-end">
                            <button
                                onClick={() => setMemberModalOpen(false)}
                                className="px-6 py-2.5 bg-[#f1f2f6] text-[#636e72] font-bold rounded-xl hover:bg-[#e2e6ea] transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
