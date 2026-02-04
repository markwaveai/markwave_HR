import { FileText, ChevronRight, CheckCircle2, Clock3, Info, XCircle } from 'lucide-react';

const LeaveHistoryTable = ({ history }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText size={18} className="text-[#48327d]" />
                    <h3 className="text-sm font-bold text-[#2d3436] uppercase tracking-wider">Leave Logs</h3>
                </div>
                <button className="text-[11px] font-bold text-[#48327d] flex items-center gap-1 hover:underline">
                    View Full History <ChevronRight size={14} />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                            <th className="px-5 py-3 text-left text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Type</th>
                            <th className="px-5 py-3 text-left text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Dates</th>
                            <th className="px-5 py-3 text-center text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Days</th>
                            <th className="px-5 py-3 text-center text-[10px] font-bold text-[#636e72] uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f2f6]">
                        {history.map((log) => (
                            <tr key={log.id} className="hover:bg-[#f9fafb] transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-bold text-[#2d3436] tracking-tight">{log.type?.toUpperCase()}</span>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex flex-wrap items-center gap-1">
                                                <span className="text-[9px] mm:text-[10px] text-[#48327d] font-bold bg-purple-50 px-1.5 py-0.5 rounded-sm inline-flex items-center">
                                                    {(() => {
                                                        const fmt = (d) => new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
                                                        const s1 = (s) => {
                                                            if (s === 'Session 1' || s === 'First Half') return 'First Half';
                                                            if (s === 'Session 2' || s === 'Second Half') return 'Second Half';
                                                            return 'Full Day';
                                                        };

                                                        if (log.fromDate === log.toDate) {
                                                            return `${fmt(log.fromDate)} (${s1(log.from_session)})`;
                                                        }
                                                        return `${fmt(log.fromDate)} (${s1(log.from_session)}) - ${fmt(log.toDate)} (${s1(log.to_session)})`;
                                                    })()}
                                                </span>
                                            </div>
                                            <span className="text-[10px] leading-relaxed text-[#636e72] font-medium whitespace-normal break-words max-w-[400px]">
                                                {log.reason}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-xs font-medium text-[#2d3436]">{log.dates}</td>
                                <td className="px-5 py-4 text-center text-xs font-bold text-[#2d3436]">{log.days}</td>
                                <td className="px-5 py-4">
                                    <div className="flex justify-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${log.statusColor}`}>
                                            {log.status === 'Approved' && <CheckCircle2 size={12} />}
                                            {log.status === 'Pending' && <Clock3 size={12} />}
                                            {log.status === 'Rejected' && <XCircle size={12} />}
                                            {log.status}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {history.length === 0 && (
                    <div className="py-12 text-center">
                        <Info size={32} className="mx-auto text-[#e2e8f0] mb-2" />
                        <p className="text-sm text-[#636e72]">No leave requests found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveHistoryTable;
