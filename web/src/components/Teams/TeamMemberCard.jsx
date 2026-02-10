import React from 'react';
import { Mail, MapPin, Trash2 } from 'lucide-react';

const TeamMemberCard = ({ member, onRemove }) => {
    return (
        <div className="bg-white rounded-2xl p-4 mm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#e2e8f0] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all relative group flex flex-col h-full">
            {onRemove && (
                <button
                    onClick={() => onRemove(member.id)}
                    className="absolute top-5 right-5 text-[#ef4444] hover:bg-red-50 p-2 rounded-xl transition-all"
                    title="Remove from team"
                >
                    <Trash2 size={18} />
                </button>
            )}

            <div className="flex-1 min-w-0">
                <div className="pr-10 mb-3 text-left">
                    <h3 className="font-bold text-[#1e293b] text-base mm:text-lg leading-tight truncate" title={member.name}>
                        {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#6366f1] mt-1.5 uppercase tracking-widest truncate" title={member.role}>
                        {member.role || 'Designation Not Set'}
                    </p>
                </div>

                <div className="space-y-3 pt-3 mm:space-y-4 mm:pt-4 border-t border-[#f1f5f9]">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] text-[#94a3b8] uppercase font-black tracking-widest mb-1.5 text-left">STATUS</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`}></div>
                                <span className="text-xs font-bold text-[#334155]">{member.status || 'Active'}</span>
                            </div>
                        </div>
                        <div className="min-w-0 text-left">
                            <p className="text-[10px] text-[#94a3b8] uppercase font-black tracking-widest mb-1.5">LOCATION</p>
                            <div className="flex items-center gap-1.5 min-w-0" title={member.location}>
                                <MapPin size={12} className="text-[#94a3b8] shrink-0" />
                                <span className="text-xs font-bold text-[#475569] truncate">
                                    {member.location || 'Remote'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="min-w-0 text-left">
                        <p className="text-[10px] text-[#94a3b8] uppercase font-black tracking-widest mb-1.5">WORK EMAIL</p>
                        <a
                            href={member.email ? `https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-[#475569] hover:text-[#6366f1] transition-all group/mail min-w-0"
                            title={member.email ? `Compose email to ${member.email}` : 'No email provided'}
                        >
                            <Mail size={14} className="text-[#94a3b8] shrink-0 group-hover/mail:text-[#6366f1] transition-colors" />
                            <span className="truncate font-bold border-b border-transparent group-hover/mail:border-[#6366f1]">{member.email || 'No email provided'}</span>
                        </a>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default TeamMemberCard;
