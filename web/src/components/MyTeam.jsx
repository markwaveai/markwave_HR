import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Users } from 'lucide-react';
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


    const filteredMembers = teamMembers
        .filter(member => {
            const query = searchTerm.toLowerCase();
            const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase();
            return (
                (member.name?.toLowerCase() || '').includes(query) ||
                (member.first_name?.toLowerCase() || '').includes(query) ||
                (member.last_name?.toLowerCase() || '').includes(query) ||
                fullName.includes(query) ||
                (member.role?.toLowerCase() || '').includes(query)
            );
        })
        .sort((a, b) => {
            // Priority 1: The actual Team Manager (is_manager flag from backend)
            if (a.is_manager && !b.is_manager) return -1;
            if (!a.is_manager && b.is_manager) return 1;

            // Priority 2: Leadership Roles
            const roleA = a.role?.toLowerCase() || '';
            const roleB = b.role?.toLowerCase() || '';
            const priorityRoles = ['advisor-technology & operations', 'project manager', 'admin', 'administrator', 'manager'];

            const getPriorityIndex = (role) => priorityRoles.findIndex(p => role.includes(p));

            const priorityA = getPriorityIndex(roleA);
            const priorityB = getPriorityIndex(roleB);

            if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
            if (priorityA !== -1) return -1;
            if (priorityB !== -1) return 1;

            return 0;
        });

    if (loading && !stats) { // Only show full loader on initial load, not when switching teams if we want smoother transition, or just show it simply
        return <LoadingSpinner size={40} className="p-10" />;
    }

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 tab:p-8 bg-[#f5f7fa] relative">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 mm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-left">
                        <h1 className="text-2xl mm:text-3xl font-black text-[#1e293b] tracking-tight">My Team</h1>
                        <p className="text-[12px] mm:text-sm text-[#64748b] font-medium mt-1 italic">
                            {user?.teams && user.teams.length > 0 && selectedTeamId
                                ? user.teams.find(t => t.id == selectedTeamId)?.name || 'Manage team'
                                : 'Manage and view your team members'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Team Selector Dropdown */}
                        {user?.teams && user.teams.length > 1 && (
                            <div className="relative w-full sm:w-auto group">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-[#48327d]" size={16} />
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#48327d] transition-colors" size={16} />
                                <select
                                    className="appearance-none w-full sm:w-56 pl-10 pr-10 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm font-semibold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#48327d]/20 focus:border-[#48327d] transition-all shadow-sm hover:border-[#48327d]/50"
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
                        )}

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636e72]" size={18} />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent text-sm shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </header>

                <div className="mb-6 mm:mb-10">
                    <TeamStats stats={{
                        total: teamMembers.length,
                        active: teamMembers.filter(m => m.status === 'Active').length,
                        onLeave: teamMembers.filter(m => m.status === 'Leave').length,
                        remote: teamMembers.filter(m => m.status === 'Remote' || (m.location && m.location.toLowerCase().includes('remote'))).length
                    }} />
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
