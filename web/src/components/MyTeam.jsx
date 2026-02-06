import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { teamApi } from '../services/api';
import TeamStats from './Teams/TeamStats';
import TeamMemberCard from './Teams/TeamMemberCard';
import LoadingSpinner from './Common/LoadingSpinner';
import ConfirmDialog from './Common/ConfirmDialog';

function MyTeam({ user }) {
    const [teamMembers, setTeamMembers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [allEmployees, setAllEmployees] = useState([]);

    // Determine initial selected team
    // Use optional chaining for safety. If teams is valid array, use first. Else fallback.
    const initialTeamId = (user?.teams?.length > 0) ? user.teams[0].id : (user?.team_id || null);
    const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);

    // Update selected team if user prop changes (e.g. initial load or re-fetch)
    useEffect(() => {
        if (user?.teams?.length > 0) {
            // Only update if currently selected is not in the list (or not set)
            // But usually we want to default to first if the user object refreshes completely
            if (!selectedTeamId || !user.teams.find(t => t.id == selectedTeamId)) {
                setSelectedTeamId(user.teams[0].id);
            }
        } else if (user?.team_id) {
            setSelectedTeamId(user.team_id);
        }
    }, [user, user?.teams]);

    useEffect(() => {
        const fetchTeamData = async () => {
            if (!selectedTeamId) {
                // User has no team, reset states and skip API calls
                setTeamMembers([]);
                setStats({ total: 0, active: 0, onLeave: 0, remote: 0 });
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const [membersData, statsData, allEmpsData] = await Promise.all([
                    teamApi.getMembers(selectedTeamId),
                    teamApi.getStats(selectedTeamId),
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
    }, [selectedTeamId]);

    const filteredMembers = teamMembers.filter(member =>
        (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (member.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading && !stats) { // Only show full loader on initial load, not when switching teams if we want smoother transition, or just show it simply
        return <LoadingSpinner size={40} className="p-10" />;
    }

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 tab:p-8 bg-[#f5f7fa] relative">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 mm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mm:gap-6">
                    <div className="text-left">
                        <h1 className="text-2xl mm:text-3xl font-black text-[#1e293b] tracking-tight">My Team</h1>

                        {/* Team Selector Dropdown */}
                        {user?.teams && user.teams.length > 1 ? (
                            <div className="mt-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Select Team:</label>
                                <select
                                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent outline-none shadow-sm min-w-[200px]"
                                    value={selectedTeamId || ''}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                >
                                    {user.teams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <p className="text-[12px] mm:text-sm text-[#64748b] font-medium mt-1 italic">
                                {user?.teams && user.teams.length === 1 ? user.teams[0].name : 'Manage and view your team members'}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="relative block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636e72]" size={18} />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent text-sm w-full md:w-64 shadow-sm"
                            />
                        </div>
                    </div>
                </header>

                <div className="mb-6 mm:mb-10">
                    <TeamStats stats={stats} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mm:gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20"><LoadingSpinner /></div>
                    ) : filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                            <TeamMemberCard
                                key={member.id}
                                member={member}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-medium">No team members found.</p>
                        </div>
                    )}
                </div>
            </div >


        </div >
    );
}

export default MyTeam;
