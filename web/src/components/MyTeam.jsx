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

    if (loading) {
        return <div className="p-6 text-center text-[#636e72]">Loading team data...</div>;
    }

    return (
        <main className="flex-1 p-6 overflow-y-auto bg-[#f5f7fa]">
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
                        <button className="bg-[#6c5ce7] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#5b4bc4] transition-colors shadow-sm">
                            Add Member
                        </button>
                    </div>
                </header>

                <TeamStats stats={stats} />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map(member => (
                        <TeamMemberCard key={member.id} member={member} />
                    ))}
                </div>
            </div>
        </main>
    );
}

export default MyTeam;
