import { useState, useRef } from 'react';
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
    UserCircle2,
    Camera
} from 'lucide-react';
import { authApi } from '../../services/api';

function Settings({ user }) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    if (!user) return null;

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const employeeId = user.employee_id || user.id;
            await authApi.updateProfilePicture(employeeId, file);

            // Re-fetch profile to get updated image URL
            const profileData = await authApi.getProfile(employeeId);
            const updatedUser = { ...user, ...profileData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Reload to reflect changes globally
            window.location.reload();
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Failed to update profile picture. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

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
        <main className="flex-1 p-4 mm:p-6 ml:p-8 xl:p-10 overflow-y-auto bg-[#f8fafc]">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                {/* Refined Modern Header */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/60 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#48327d]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="relative flex flex-col md:flex-row items-center gap-6">
                        <div
                            className="shrink-0 relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {user.profile_picture ? (
                                <img
                                    src={user.profile_picture}
                                    alt="Profile"
                                    className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shadow-lg shadow-[#48327d]/10 ${isUploading ? 'opacity-50' : ''}`}
                                />
                            ) : (
                                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#48327d] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#48327d]/10 ${isUploading ? 'opacity-50' : ''}`}>
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white mb-1" />
                                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change</span>
                            </div>

                            {/* Loading State */}
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </div>

                        <div className="text-center md:text-left flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">
                                    {user.first_name} {user.last_name}
                                </h1>
                                {user.is_admin && (
                                    <span className="px-2 py-1 bg-slate-100 text-[#48327d] text-[10px] font-bold rounded-lg uppercase tracking-wider border border-slate-200">
                                        Executive Portal
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Briefcase size={16} className="text-slate-400" />
                                    {user.role}
                                </div>
                                <div className="hidden md:block w-1 h-1 rounded-full bg-slate-300"></div>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    {user.employee_id}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Primary Content Area */}
                    <div className="lg:col-span-8 space-y-6 lg:space-y-8">
                        {/* Profile Details */}
                        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                    <User size={18} />
                                </div>
                                <h2 className="text-base font-bold text-slate-800">Profile Information</h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {personalInfo.map((item, idx) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <div key={idx} className="flex flex-col gap-1.5 transition-all hover:translate-x-1 duration-200">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {item.label}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <ItemIcon size={14} />
                                                </div>
                                                <span className="text-sm font-semibold text-slate-700 truncate">{item.value || "—"}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Secondary Context Area */}
                    <div className="lg:col-span-4 space-y-6 lg:space-y-8">
                        {/* Organizational Identity */}
                        <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
                                    <Building2 size={18} />
                                </div>
                                <h2 className="text-base font-bold text-slate-800">Organization</h2>
                            </div>

                            <div className="p-6 space-y-6">
                                {workDetails.map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                                        <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                                    </div>
                                ))}

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Assigned Units</label>
                                    <div className="space-y-3">
                                        {user.teams && user.teams.length > 0 ? (
                                            user.teams.map((team, idx) => (
                                                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 hover:bg-white hover:border-[#48327d]/30 transition-all group">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#48327d]">{team.name}</span>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    </div>
                                                    {team.manager_name && (
                                                        <p className="text-[10px] font-medium text-slate-500">
                                                            Lead: {team.manager_name}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs font-medium text-slate-400 italic">No assigned units</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Settings;
