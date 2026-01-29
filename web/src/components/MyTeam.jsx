import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { teamApi } from '../services/api';
import TeamStats from './Teams/TeamStats';
import TeamMemberCard from './Teams/TeamMemberCard';

function MyTeam({ user }) {
    const [teamMembers, setTeamMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const teamId = user?.team_id;

                const [membersData, statsData] = await Promise.all([
                    teamApi.getMembers(teamId),
                    teamApi.getStats(teamId)
                ]);
                setTeamMembers(membersData);
                setStats(statsData);
            } catch (error) {
                console.error("Failed to fetch team data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, []);

    const filteredMembers = teamMembers.filter(member =>
        (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const [showAddModal, setShowAddModal] = useState(false);
    const [newMember, setNewMember] = useState({
        first_name: '',
        last_name: '',
        email: '',
        role: '',
        contact: '',
        location: '',
        aadhar: ''
    });

    // Check if user is a Team Lead
    const isTeamLead = user?.role?.toLowerCase().includes('team lead');

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const memberData = {
                ...newMember,
                team_id: user?.team_id,
                // Combine names for display/search if needed, but backend splits them or takes first/last
                name: `${newMember.first_name} ${newMember.last_name}`
            };

            await teamApi.addEmployee(memberData);

            // Refresh list
            const updatedMembers = await teamApi.getMembers(user?.team_id);
            setTeamMembers(updatedMembers);

            setShowAddModal(false);
            setNewMember({ first_name: '', last_name: '', email: '', role: '', contact: '', location: '', aadhar: '' });
            alert("Member added successfully!");
        } catch (error) {
            console.error("Failed to add member:", error);
            alert("Failed to add member: " + (error.response?.data?.error || error.message));
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-[#636e72]">Loading team data...</div>;
    }



    return (
        <main className="flex-1 p-6 overflow-y-auto bg-[#f5f7fa] relative">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#2d3436]">My Team</h1>
                        <p className="text-sm text-[#636e72]">Manage and view your team members</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636e72]" size={18} />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent text-sm w-full md:w-64 shadow-sm"
                            />
                        </div>
                        {isTeamLead && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5b4bc4] transition-colors shadow-sm"
                            >
                                Add Member
                            </button>
                        )}
                    </div>
                </header>

                <TeamStats stats={stats} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(member => (
                        <TeamMemberCard key={member.id} member={member} />
                    ))}
                </div>
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Add New Team Member</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAddMember} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                                        value={newMember.first_name}
                                        onChange={e => setNewMember({ ...newMember, first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                                        value={newMember.last_name}
                                        onChange={e => setNewMember({ ...newMember, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                                    value={newMember.email}
                                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Software Engineer"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                                        value={newMember.role}
                                        onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                                        value={newMember.contact}
                                        onChange={e => setNewMember({ ...newMember, contact: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
                                    value={newMember.location}
                                    onChange={e => setNewMember({ ...newMember, location: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#6c5ce7] text-white rounded-lg text-sm hover:bg-[#5b4bc4]"
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MyTeam;
