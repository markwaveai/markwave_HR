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
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-[#2d3436]">{log.type}</span>
                                        <span className="text-[10px] text-[#636e72] italic truncate max-w-[400px]">{log.reason}</span>
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
