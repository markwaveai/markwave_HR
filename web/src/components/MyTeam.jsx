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
    const [allEmployees, setAllEmployees] = useState([]);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const teamId = user?.team_id;
                const [membersData, statsData, allEmpsData] = await Promise.all([
                    teamApi.getMembers(teamId),
                    teamApi.getStats(teamId),
                    teamApi.getAttendanceRegistry()
                ]);
                setTeamMembers(membersData);
                setStats(statsData);
                setAllEmployees(allEmpsData);
            } catch (error) {
                console.error("Failed to fetch team data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, [user?.team_id]);

    const filteredMembers = teamMembers.filter(member =>
        (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedExistingId, setSelectedExistingId] = useState('');

    // Check if user is a Team Lead (with fallback)
    const isManager = user?.is_manager || user?.role?.toLowerCase().includes('team lead');
    console.log("MyTeam Debug - User ID:", user?.id, "Is Manager:", isManager, "Raw is_manager:", user?.is_manager);

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            if (!selectedExistingId) throw new Error("Please select an employee");
            await teamApi.updateMember(selectedExistingId, {
                team_id: user?.team_id,
                acting_user_id: user?.id
            });

            // Refresh list
            const updatedMembers = await teamApi.getMembers(user?.team_id);
            setTeamMembers(updatedMembers);

            setShowAddModal(false);
            setSelectedExistingId('');
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
                        {isManager && (
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
                            <h3 className="text-lg font-bold text-gray-800">Add Team Member</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAddMember} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Select Employee (Total Employees)</label>
                                <select
                                    required
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5ce7] bg-white"
                                    value={selectedExistingId}
                                    onChange={e => setSelectedExistingId(e.target.value)}
                                >
                                    <option value="">Choose an employee...</option>
                                    {allEmployees
                                        .filter(emp => !teamMembers.some(m => m.id === emp.id)) // Filter out already in team
                                        .map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.first_name} {emp.last_name} ({emp.role})
                                            </option>
                                        ))}
                                </select>
                                <p className="mt-2 text-[10px] text-gray-500 italic">
                                    Showing employees not currently in your team.
                                </p>
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
