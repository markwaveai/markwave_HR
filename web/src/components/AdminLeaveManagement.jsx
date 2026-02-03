
import React, { useState, useEffect } from 'react';
import { leaveApi } from '../services/api';
import { CheckCircle, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import Toast from './Common/Toast';
import ConfirmDialog from './Common/ConfirmDialog';

const AdminLeaveManagement = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // ID of request being processed
    const [toast, setToast] = useState(null);

    // Dialog State
    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        id: null,
        action: null, // 'Approve' or 'Reject'
        employeeName: ''
    });

    useEffect(() => {
        fetchPendingLeaves();
    }, []);

    const fetchPendingLeaves = async () => {
        try {
            const data = await leaveApi.getPending();
            setLeaves(data);
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Failed to fetch leave requests.' });
        } finally {
            setLoading(false);
        }
    };

    const initiateAction = (leave, action) => {
        setDialogConfig({
            isOpen: true,
            id: leave.id,
            action: action,
            employeeName: leave.employee_name
        });
    };

    const confirmAction = async () => {
        const { id, action } = dialogConfig;
        if (!id || !action) return;

        setDialogConfig(prev => ({ ...prev, isOpen: false })); // Close dialog immediately or keep open for loading? Let's close.
        setActionLoading(id);

        try {
            await leaveApi.action(id, action);
            setToast({ type: 'success', message: `Leave request ${action}d successfully.` });
            // Remove from list
            setLeaves(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: `Failed to ${action} request.` });
        } finally {
            setActionLoading(null);
        }
    };

    const closeDialog = () => {
        setDialogConfig(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 tab:p-8 bg-[#f5f7fa]">
            <div className="mb-4 mm:mb-6">
                <h1 className="text-xl mm:text-2xl font-bold text-[#2d3436]">Leave Management</h1>
                <p className="text-[12px] mm:text-sm text-[#636e72] mt-1">Review and manage employee leave requests</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-[#636e72]">Loading requests...</div>
            ) : leaves.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-[#dfe6e9] p-10 text-center">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-[#2d3436]">All Caught Up!</h3>
                    <p className="text-[#636e72]">There are no pending leave requests at the moment.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-[#dfe6e9] overflow-hidden">
                    <div className="p-4 bg-[#fbfcff] border-b border-[#dfe6e9]">
                        <h2 className="text-[#48327d] font-bold flex items-center gap-2">
                            <Clock size={18} /> Pending Requests ({leaves.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#f8f9fa] text-[#636e72] text-[10px] uppercase tracking-wider font-black">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4 text-center">Leave Type</th>
                                    <th className="px-6 py-4 text-center">Dates</th>
                                    <th className="px-6 py-4 text-center">Duration</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f1f2f6] text-sm">
                                {leaves.map((leave) => (
                                    <tr key={leave.id} className="hover:bg-[#f8f9fa] transition-all">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-[#2d3436]">{leave.employee_name}</div>
                                                <div className="text-xs text-[#636e72] font-mono">ID: {leave.employee_id}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${leave.type === 'cl' ? 'bg-blue-50 text-blue-600' :
                                                leave.type === 'sl' ? 'bg-red-50 text-red-600' :
                                                    'bg-green-50 text-green-600'
                                                }`}>
                                                {leave.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-[#2d3436] font-medium text-xs">
                                                {leave.fromDate === leave.toDate ? leave.fromDate : (
                                                    <div className="flex flex-col items-center">
                                                        <span>{leave.fromDate}</span>
                                                        <span className="text-[#b2bec3] text-[10px]">to</span>
                                                        <span>{leave.toDate}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-[#48327d]">
                                            {leave.days} Day{leave.days > 1 ? 's' : ''}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-[#636e72] text-xs truncate" title={leave.reason}>
                                                {leave.reason}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => initiateAction(leave, 'Approve')}
                                                    disabled={actionLoading === leave.id}
                                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => initiateAction(leave, 'Reject')}
                                                    disabled={actionLoading === leave.id}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                title={`${dialogConfig.action} Leave Request`}
                message={`Are you sure you want to ${dialogConfig.action?.toLowerCase()} the leave request for ${dialogConfig.employeeName}?`}
                onConfirm={confirmAction}
                onCancel={closeDialog}
                confirmText={dialogConfig.action}
                type={dialogConfig.action === 'Reject' ? 'danger' : 'primary'}
            />
        </div>
    );
};

export default AdminLeaveManagement;
