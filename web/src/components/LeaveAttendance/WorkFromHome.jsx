import React, { useState, useEffect } from 'react';
import { wfhApi } from '../../services/api';
import { Clock } from 'lucide-react';

const WorkFromHome = ({ user, setToast }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();

        const pollInterval = setInterval(() => {
            fetchRequests();
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [user?.id]);

    const fetchRequests = async () => {
        try {
            const data = await wfhApi.getRequests(user.id);
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch WFH requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="text-purple-600" size={20} />
                    WFH Request History
                </h2>
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No WFH requests found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                    <th className="p-3 font-medium">Applied On</th>
                                    <th className="p-3 font-medium">Dates</th>
                                    <th className="p-3 font-medium">Reason</th>
                                    <th className="p-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <td className="p-3 text-sm text-gray-600">{formatDate(req.applied_on)}</td>
                                        <td className="p-3 text-sm font-medium text-gray-800">
                                            {formatDate(req.from_date)} - {formatDate(req.to_date)}
                                        </td>
                                        <td className="p-3 text-sm text-gray-600 max-w-xs truncate" title={req.reason}>
                                            {req.reason}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                req.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkFromHome;
