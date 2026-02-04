import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Calendar, User, FileText } from 'lucide-react';
import { attendanceApi } from '../../services/api';

const RegularizationRequests = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Using user.id or user.employee_id as manager_id
            const data = await attendanceApi.getRegularizationRequests(user.employee_id || user.id);
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user]);

    const handleAction = async (id, action) => {
        try {
            await attendanceApi.actionRegularization(id, action);
            setRequests(prev => prev.filter(req => req.id !== id));
        } catch (error) {
            console.error('Action failed:', error);
            alert('Failed to process request');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-400">Loading requests...</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>No pending regularization requests</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
                {requests.map((request) => (
                    <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-[#2d3436] text-sm md:text-base">{request.employee_name}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{request.employee_id}</span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-[#48327d]" />
                                    <span className="font-medium text-gray-700">{request.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded text-gray-700">
                                    <Clock size={12} />
                                    <span>In: <b>{request.check_in || '-'}</b></span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                                    <Clock size={12} />
                                    <span>Requested Out: <b>{request.requested_checkout}</b></span>
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-gray-600 italic border-l-2 border-gray-200 pl-3 py-1">
                                "{request.reason}"
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                onClick={() => handleAction(request.id, 'Rejected')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <X size={14} /> REJECT
                            </button>
                            <button
                                onClick={() => handleAction(request.id, 'Approved')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm shadow-green-200 rounded-lg transition-all active:scale-95"
                            >
                                <Check size={14} /> APPROVE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RegularizationRequests;
