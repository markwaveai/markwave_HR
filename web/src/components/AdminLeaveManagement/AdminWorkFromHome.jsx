import React, { useState, useEffect } from 'react';
import { wfhApi } from '../../services/api';
import { CheckCircle, XCircle, Clock, Calendar, AlertCircle, Plane } from 'lucide-react';
import Toast from '../Common/Toast';
import ConfirmDialog from '../Common/ConfirmDialog';

const AdminWorkFromHome = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);
    const [dialogConfig, setDialogConfig] = useState({
        isOpen: false,
        id: null,
        action: null,
        employeeName: ''
    });

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const data = await wfhApi.getPending();
            setRequests(data);
        } catch (error) {
            console.error(error);
            setToast({ type: 'error', message: 'Failed to fetch WFH requests.' });
        } finally {
            setLoading(false);
        }
    };

    const initiateAction = (request, action) => {
        setDialogConfig({
            isOpen: true,
            id: request.id,
            action: action,
            employeeName: request.employee_name
        });
    };

    const confirmAction = async () => {
        const { id, action } = dialogConfig;
        if (!id || !action) return;

        setDialogConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(id);

        try {
            await wfhApi.action(id, action);
            setToast({ type: 'success', message: `Request ${action}d successfully.` });
            setRequests(prev => prev.filter(r => r.id !== id));
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    };

    if (loading) {
        return <div className="text-center py-20 text-[#636e72]">Loading requests...</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-[#dfe6e9] p-10 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-[#2d3436]">All Caught Up!</h3>
                <p className="text-[#636e72]">There are no pending WFH requests.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-[#dfe6e9] overflow-hidden">
            <div className="p-4 bg-[#fbfcff] border-b border-[#dfe6e9]">
                <h2 className="text-[#48327d] font-bold flex items-center gap-2">
                    <Clock size={18} /> Pending WFH Requests ({requests.length})
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#f8f9fa] text-[#636e72] text-[10px] uppercase tracking-wider font-black">
                        <tr>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4 text-center">Dates</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4 text-center">Applied On</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f2f6] text-sm">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-[#f8f9fa] transition-all">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-bold text-[#2d3436]">{req.employee_name}</div>
                                        <div className="text-xs text-[#636e72] font-mono">ID: {req.employee_id}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="text-[#2d3436] font-medium text-xs">
                                        {formatDate(req.from_date)} - {formatDate(req.to_date)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    <p className="text-[#636e72] text-xs truncate" title={req.reason}>
                                        {req.reason}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-center text-xs text-[#636e72]">
                                    {formatDate(req.applied_on)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => initiateAction(req, 'Approve')}
                                            disabled={actionLoading === req.id}
                                            className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
                                            title="Approve"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <button
                                            onClick={() => initiateAction(req, 'Reject')}
                                            disabled={actionLoading === req.id}
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

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <ConfirmDialog
                isOpen={dialogConfig.isOpen}
                title={`${dialogConfig.action} WFH Request`}
                message={`Are you sure you want to ${dialogConfig.action?.toLowerCase()} the WFH request for ${dialogConfig.employeeName}?`}
                onConfirm={confirmAction}
                onCancel={closeDialog}
                confirmText={dialogConfig.action}
                type={dialogConfig.action === 'Reject' ? 'danger' : 'primary'}
            />
        </div>
    );
};

export default AdminWorkFromHome;
