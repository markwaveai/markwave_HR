import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    ShieldCheck,
    IdCard,
    Building2,
    Clock,
    UserCircle2
} from 'lucide-react';

function Settings({ user }) {
    if (!user) return null;

    const personalInfo = [
        { label: "Email Address", value: user.email, icon: Mail },
        { label: "Phone Number", value: user.contact, icon: Phone },
        { label: "Location", value: user.location || "Not Provided", icon: MapPin },
        { label: "Aadhar", value: user.aadhar || "Not Provided", icon: IdCard },
        { label: "Qualification", value: user.qualification || "Not Provided", icon: ShieldCheck },
        { label: "Joining Date", value: user.joining_date ? new Date(user.joining_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "Not Provided", icon: Calendar },
    ];

    const workDetails = [
        { label: "Employee ID", value: user.employee_id, icon: IdCard },
        { label: "Designation", value: user.role, icon: ShieldCheck },
    ];

    return (
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#F4F7F9]">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Professional Compact Header */}
                <div className="relative overflow-hidden bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/60">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-full -mr-24 -mt-24 blur-3xl opacity-40"></div>
                    <div className="relative flex flex-col md:flex-row items-center gap-5">
                        <div className="shrink-0 relative">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#48327d] to-[#6a4fb3] flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg shadow-purple-500/10">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-lg border-2 border-white"></div>
                        </div>
                        <div className="text-center md:text-left flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                                <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">
                                    {user.first_name} {user.last_name}
                                </h1>
                                {user.is_admin && (
                                    <span className="px-2 py-0.5 bg-purple-600 text-white text-[9px] font-bold rounded-md uppercase tracking-wider">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                <p className="text-slate-500 font-medium text-sm flex items-center justify-center md:justify-start gap-1.5">
                                    <Briefcase size={14} className="text-slate-400" />
                                    {user.role}
                                </p>
                                <div className="hidden md:block w-1 h-1 rounded-full bg-slate-300"></div>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                    {user.employee_id}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Info Section */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#48327d]">
                                    <User size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Personal Profile</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                {personalInfo.map((item, idx) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <div key={idx} className="flex flex-col gap-1.5 border-b border-slate-50 pb-3 last:border-0 sm:even:border-l sm:even:pl-6 sm:even:pb-3 sm:border-slate-100">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {item.label}
                                            </label>
                                            <div className="flex items-center gap-2.5">
                                                <ItemIcon size={14} className="text-slate-300 shrink-0" />
                                                <span className="text-sm font-semibold text-slate-700 break-all">{item.value || "—"}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info Section */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Employment Status */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Briefcase size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Work</h2>
                            </div>
                            <div className="space-y-4">
                                {workDetails.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                        <span className="text-xs font-medium text-slate-400">{item.label}</span>
                                        <span className="text-xs font-bold text-slate-700">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Teams - Compressed */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                    <Building2 size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800">Teams</h2>
                            </div>
                            <div className="space-y-3">
                                {user.teams && user.teams.length > 0 ? (
                                    user.teams.map((team, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-orange-100 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-slate-800">{team.name}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                            </div>
                                            {team.manager_name && (
                                                <p className="text-[9px] font-medium text-slate-500 flex items-center gap-1">
                                                    <UserCircle2 size={10} /> Lead: {team.manager_name}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-4 text-center">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Teams</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Settings;
