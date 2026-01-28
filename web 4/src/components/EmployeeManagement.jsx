import { useState, useEffect } from 'react';
import { teamApi } from '../services/api';
import { UserPlus, Users, MapPin, Mail, Briefcase, Phone, Clock, Calendar, X, ShieldCheck } from 'lucide-react';

function EmployeeManagement() {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        contact: '',
        location: '',
        aadhar: ''
    });

    const [designations, setDesignations] = useState([]);

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchEmployees();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await teamApi.getRoles();
            if (Array.isArray(data)) {
                setDesignations(data.map(r => r.name));
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const data = await teamApi.getAttendanceRegistry();
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                role: formData.role,
                contact: formData.contact,
                location: formData.location,
                aadhar: formData.aadhar
            };

            await teamApi.addEmployee(payload);
            setMessage({ type: 'success', text: 'Employee added successfully!' });
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                role: '',
                contact: '',
                location: '',
                aadhar: ''
            });
            setTimeout(() => {
                setIsModalOpen(false);
                setMessage({ type: '', text: '' });
                fetchEmployees();
            }, 1500);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to add employee.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-600';
            case 'On Leave': return 'bg-yellow-100 text-yellow-600';
            case 'Remote': return 'bg-blue-100 text-blue-600';
            case 'Inactive': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <main className="flex-1 p-6 overflow-y-auto bg-[#f5f7fa]">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#2d3436]">Employee Management</h1>
                    <p className="text-sm text-[#636e72] mt-1">Personnel registry and employee records</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-[#48327d] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#3a2865] transition-all shadow-md"
                    >
                        <UserPlus size={18} /> Register Employee
                    </button>
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-[#48327d]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-[#dfe6e9] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-[#dfe6e9] flex justify-between items-center bg-[#fbfcff]">
                            <h2 className="text-[#48327d] font-bold flex items-center gap-2">
                                <UserPlus size={18} /> Register New Employee
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setMessage({ type: '', text: '' });
                                }}
                                className="text-[#636e72] hover:text-[#2d3436] p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">First Name</label>
                                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="Enter Name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Last Name</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="Enter Name" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Designation</label>
                                    <select
                                        name="role"
                                        required
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none bg-white"
                                    >
                                        <option value="">Select Role</option>
                                        {designations.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Contact</label>
                                    <input type="text" name="contact" required value={formData.contact} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="Phone number" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Email</label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="email@example.com" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Aadhar Number</label>
                                    <input type="text" name="aadhar" value={formData.aadhar} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="Enter Aadhar" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Address / Location</label>
                                    <input type="text" name="location" required value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="City / Address" />
                                </div>
                            </div>

                            {message.text && (
                                <div className={`p-3 rounded-lg text-xs font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-[#48327d] text-white rounded-lg font-bold hover:bg-[#3a2865] transition-all disabled:opacity-50 text-sm shadow-md mt-2">
                                {isSubmitting ? 'Processing...' : 'Register Employee'}
                            </button>
                        </form>
                    </div>
                </div >
            )
            }

            <div className="bg-white rounded-xl shadow-sm border border-[#dfe6e9] overflow-hidden">
                <div className="p-4 bg-[#fbfcff] border-b border-[#dfe6e9] flex justify-between items-center">
                    <h2 className="text-[#48327d] font-bold flex items-center gap-2">
                        <Users size={18} /> Company Employee Registry
                    </h2>
                    <div className="flex gap-4 text-[10px] sm:text-xs">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span> On Leave</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Remote</div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#f8f9fa] text-[#636e72] text-[10px] uppercase tracking-wider font-black">
                            <tr>
                                <th className="px-6 py-4 truncate text-center">Emp ID</th>
                                <th className="px-6 py-4 text-center">First Name</th>
                                <th className="px-6 py-4 text-center">Last Name</th>
                                <th className="px-6 py-4 text-center">Designation</th>
                                <th className="px-6 py-4 text-center">Contact</th>
                                <th className="px-6 py-4 text-center">Email</th>
                                <th className="px-6 py-4 text-center">Aadhar</th>
                                <th className="px-6 py-4 text-center">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f2f6] text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center text-[#636e72]">Syncing with database...</td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-20 text-center text-[#636e72]">No records found.</td>
                                </tr>
                            ) : (
                                employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-[#f8f9fa] transition-all group">
                                        <td className="px-6 py-4 font-mono text-[#48327d] font-bold text-center">
                                            {emp.id || '----'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-[#2d3436] whitespace-nowrap">{emp.first_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-[#2d3436] whitespace-nowrap">{emp.last_name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-[#636e72] whitespace-nowrap text-center">{emp.role}</td>
                                        <td className="px-6 py-4 text-[#636e72] font-medium text-center">{emp.contact || '-'}</td>
                                        <td className="px-6 py-4 text-[#636e72] text-center">{emp.email}</td>
                                        <td className="px-6 py-4 text-[#636e72] font-medium text-center whitespace-nowrap">
                                            {emp.aadhar ? emp.aadhar.toString().replace(/(\d{4})(?=\d)/g, "$1 ") : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-[#636e72] whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <MapPin size={12} className="text-[#48327d]/40" />
                                                {emp.location || '-'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main >
    );
}

export default EmployeeManagement;
