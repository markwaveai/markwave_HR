import React, { useState, useEffect } from 'react';
import { teamApi } from '../services/api';
import { UserPlus, Users, MapPin, Mail, Briefcase, Phone, Clock, Calendar, X, ShieldCheck, Trash2, Search, Edit2 } from 'lucide-react';
import ConfirmDialog from './Common/ConfirmDialog';
import LoadingSpinner from './Common/LoadingSpinner';

function EmployeeManagement({ user }) {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);

    const [formData, setFormData] = useState({
        employeeId: '',
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
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, employee: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const closeModal = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setEditingEmployee(null);
            setFormData({
                employeeId: '',
                firstName: '',
                lastName: '',
                email: '',
                role: '',
                contact: '',
                location: '',
                aadhar: ''
            });
            setMessage({ type: '', text: '' });
            setIsClosing(false);
        }, 200);
    };

    useEffect(() => {
        fetchEmployees();
        fetchDesignations();
    }, []);

    const fetchDesignations = async () => {
        try {
            const data = await teamApi.getDesignations();
            if (Array.isArray(data)) {
                setDesignations(data.map(r => r.name));
            }
        } catch (error) {
            console.error('Error fetching designations:', error);
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
        const { name, value } = e.target;

        // Only allow letters and spaces for first and last names
        if ((name === 'firstName' || name === 'lastName') && value !== '') {
            if (!/^[a-zA-Z\s]+$/.test(value)) return;
        }

        // Only allow digits for contact and aadhar
        if ((name === 'contact' || name === 'aadhar') && value !== '') {
            if (!/^\d+$/.test(value)) return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const filteredEmployees = employees.filter(emp => {
        const query = searchQuery.toLowerCase();
        return (
            emp.first_name?.toLowerCase().includes(query) ||
            emp.last_name?.toLowerCase().includes(query) ||
            emp.employee_id?.toLowerCase().includes(query) ||
            emp.email?.toLowerCase().includes(query) ||
            emp.role?.toLowerCase().includes(query)
        );
    });

    const isAllZeros = (str) => /^[0]+$/.test(str);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        // Local Validations
        if (!formData.employeeId || !formData.firstName || !formData.email || !formData.role || !formData.contact || !formData.aadhar || !formData.location) {
            const err = 'Please fill in all mandatory fields.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        // Validate First Name (Alphabets + Spaces only)
        if (!/^[A-Za-z\s]+$/.test(formData.firstName)) {
            const err = 'First Name must contain only alphabets.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        // Validate Last Name (Alphabets + Spaces only, if provided)
        if (formData.lastName && !/^[A-Za-z\s]+$/.test(formData.lastName)) {
            const err = 'Last Name must contain only alphabets.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        if (formData.contact.length !== 10 || !/^\d+$/.test(formData.contact)) {
            const err = 'Contact number must be exactly 10 digits.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        if (isAllZeros(formData.contact)) {
            const err = 'Contact number cannot be all zeros.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        if (!formData.email.includes('@')) {
            const err = 'Please enter a valid email address with @.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        if (formData.aadhar.length !== 12 || !/^\d+$/.test(formData.aadhar)) {
            const err = 'Aadhar number must be exactly 12 digits.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        if (isAllZeros(formData.aadhar)) {
            setMessage({ type: 'error', text: 'Aadhar number cannot be all zeros.' });
            setIsSubmitting(false);
            return;
        }

        if (isAllZeros(formData.aadhar)) {
            const err = 'Aadhar number cannot be all zeros.';
            alert(err);
            setMessage({ type: 'error', text: err });
            setIsSubmitting(false);
            return;
        }

        try {
            const payload = {
                employee_id: formData.employeeId,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                role: formData.role,
                contact: formData.contact,
                location: formData.location,
                aadhar: formData.aadhar,
                acting_user_id: user?.id
            };

            if (editingEmployee) {
                await teamApi.updateMember(editingEmployee.id, payload);
                const successMsg = 'Employee updated successfully!';
                alert(successMsg);
                setMessage({ type: 'success', text: successMsg });
            } else {
                await teamApi.addEmployee(payload);
                const successMsg = 'Employee added successfully!';
                alert(successMsg);
                setMessage({ type: 'success', text: successMsg });
            }

            setFormData({
                employeeId: '',
                firstName: '',
                lastName: '',
                email: '',
                role: '',
                contact: '',
                location: '',
                aadhar: ''
            });
            setEditingEmployee(null);
            setTimeout(() => {
                setIsModalOpen(false);
                setMessage({ type: '', text: '' });
                fetchEmployees();
            }, 500);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to add employee.';
            alert(errorMsg);
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.employee) return;

        setIsDeleting(true);
        const targetId = deleteConfirm.employee.id;
        // Close modal immediately to avoid flicker/re-opening during API call
        // setDeleteConfirm({ isOpen: false, employee: null }); // Don't close immediately

        try {
            await teamApi.updateMember(targetId, {
                status: 'Inactive',
                acting_user_id: user?.id
            });
            await fetchEmployees();
            setDeleteConfirm({ isOpen: false, employee: null });
        } catch (error) {
            console.error('Error deactivating employee:', error);
            alert('Failed to deactivate employee');
        } finally {
            setIsDeleting(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-600';
            case 'On Leave': return 'bg-yellow-100 text-yellow-600';
            case 'Remote': return 'bg-blue-100 text-blue-600';
            case 'Inactive': return 'bg-gray-100 text-[#636e72]';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const isAdmin = user?.is_admin === true ||
        ['Admin', 'Administrator', 'Project Manager', 'Advisor-Technology & Operations', 'Founder'].includes(user?.role);

    return (
        <div className="flex-1 p-3 mm:p-4 ml:p-5 tab:p-8 overflow-y-auto bg-[#f5f7fa]">
            <div className="mb-4 mm:mb-6 flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                <div>
                    <h1 className="text-xl mm:text-2xl font-bold text-[#2d3436]">Employee Management</h1>
                    <p className="text-[12px] mm:text-sm text-[#636e72] mt-1">Personnel registry and employee records</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search employee records"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#48327d]/20 w-48 lg:w-64"
                        />
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-[#48327d] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#3a2865] transition-all shadow-md whitespace-nowrap"
                        >
                            <UserPlus size={18} /> Register Employee
                        </button>
                    )}
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-[#48327d] whitespace-nowrap">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e293b]/60 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
                    <div className={`bg-white rounded-[1.5rem] shadow-2xl border border-white/20 w-full max-w-md overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                        <div className="p-5 border-b border-[#dfe6e9] flex justify-between items-center bg-[#fbfcff]">
                            <h2 className="text-[#48327d] font-bold flex items-center gap-2">
                                <UserPlus size={18} /> {editingEmployee ? 'Edit Employee Details' : 'Register New Employee'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-[#636e72] hover:text-[#2d3436] p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Employee ID <span className="text-red-500">*</span></label>
                                <input type="text" name="employeeId" required value={formData.employeeId} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="Eg: MW0000" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">First Name <span className="text-red-500">*</span></label>
                                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="Enter First Name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Last Name</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="Enter Last Name" />
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
                                        <option value="">Select Designation</option>
                                        {designations.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Contact <span className="text-red-500">*</span></label>
                                    <input type="tel" name="contact" required maxLength={10} minLength={10} inputMode="numeric" value={formData.contact} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="10-digit phone" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="email@example.com" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Aadhar Number <span className="text-red-500">*</span></label>
                                    <input type="text" name="aadhar" required maxLength={12} minLength={12} inputMode="numeric" value={formData.aadhar} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="12-digit Aadhar" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#636e72] uppercase mb-1">Address / Location <span className="text-red-500">*</span></label>
                                    <input type="text" name="location" required value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border border-[#dfe6e9] rounded-lg text-sm focus:ring-2 focus:ring-[#48327d]/10 outline-none" placeholder="City / Address" />
                                </div>
                            </div>

                            {message.text && (
                                <div className={`p-3 rounded-lg text-xs font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-2.5 rounded-lg font-bold text-sm shadow-md mt-2 flex justify-center items-center gap-2 transition-all ${isSubmitting
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#48327d] text-white hover:bg-[#3a2865]'
                                    }`}
                            >
                                {isSubmitting ? <LoadingSpinner size={16} color="border-white" /> : (editingEmployee ? 'Update Employee' : 'Register Employee')}
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

                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#f8f9fa] text-[#636e72] text-[10px] uppercase tracking-wider font-black">
                            <tr>
                                <th className="px-6 py-4 truncate text-center">ID</th>
                                <th className="px-6 py-4 truncate text-center">Emp ID</th>
                                <th className="px-6 py-4 text-center">First Name</th>
                                <th className="px-6 py-4 text-center">Last Name</th>
                                <th className="px-6 py-4 text-center">Designation</th>
                                <th className="px-6 py-4 text-center">Contact</th>
                                <th className="px-6 py-4 text-center">Email</th>
                                <th className="px-6 py-4 text-center">Aadhar</th>
                                <th className="px-6 py-4 text-center">Location</th>
                                <th className="px-6 py-4 text-center min-w-[120px]">Action / Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f2f6] text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-20 text-center">
                                        <LoadingSpinner size={40} className="mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-20 text-center text-[#636e72]">
                                        {employees.length === 0 ? 'No records found.' : 'No matching employees found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp, index) => (
                                    <tr key={emp.id} className={`hover:bg-[#f8f9fa] transition-all group ${emp.status === 'Inactive' ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                        <td className="px-6 py-4 font-mono text-[#48327d] font-bold text-center">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[#48327d] font-bold text-center">
                                            {emp.employee_id || '----'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold whitespace-nowrap ${emp.status === 'Inactive' ? 'text-gray-400' : 'text-[#2d3436]'}`}>{emp.first_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold whitespace-nowrap ${emp.status === 'Inactive' ? 'text-gray-400' : 'text-[#2d3436]'}`}>{emp.last_name || '-'}</span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-center ${emp.status === 'Inactive' ? 'text-gray-400' : 'text-[#636e72]'}`}>{emp.role}</td>
                                        <td className={`px-6 py-4 font-medium text-center ${emp.status === 'Inactive' ? 'text-gray-400' : 'text-[#636e72]'}`}>{emp.contact || '-'}</td>
                                        <td className={`px-6 py-4 text-center ${emp.status === 'Inactive' ? 'text-gray-400' : 'text-[#636e72]'}`}>{emp.email}</td>
                                        <td className={`px-6 py-4 font-medium text-center whitespace-nowrap ${emp.status === 'Inactive' ? 'text-gray-400' : 'text-[#636e72]'}`}>
                                            {emp.aadhar ? emp.aadhar.toString().replace(/(\d{4})(?=\d)/g, "$1 ") : '-'}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-center ${emp.status === 'Inactive' ? 'text-gray-400' : 'text-[#636e72]'}`}>
                                            <div className="flex items-center justify-center gap-1">
                                                <MapPin size={12} className={emp.status === 'Inactive' ? 'text-gray-300' : 'text-[#48327d]/40'} />
                                                {emp.location || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isAdmin && (
                                                <div className="flex items-center justify-center gap-2">
                                                    {emp.status !== 'Inactive' ? (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingEmployee(emp);
                                                                    setFormData({
                                                                        employeeId: emp.employee_id || '',
                                                                        firstName: emp.first_name || '',
                                                                        lastName: emp.last_name || '',
                                                                        email: emp.email || '',
                                                                        role: emp.role || '',
                                                                        contact: emp.contact || '',
                                                                        location: emp.location || '',
                                                                        aadhar: emp.aadhar || ''
                                                                    });
                                                                    setIsModalOpen(true);
                                                                }}
                                                                className="p-2 text-[#48327d] hover:bg-purple-50 rounded-lg transition-all hover:scale-110 active:scale-90"
                                                                title="Edit Employee"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ isOpen: true, employee: emp })}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110 active:scale-90"
                                                                title="Disable Employee"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => navigate('/delete-account', { state: { mobile: emp.contact, action: 'activate', fromPortal: true } })}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110 active:scale-90 flex items-center justify-center gap-1"
                                                            title="Enable Employee"
                                                        >
                                                            <ShieldCheck size={18} />
                                                            <span className="text-[10px] font-bold uppercase">Enable</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Disable Employee"
                message={`Are you sure you want to disable ${deleteConfirm.employee?.first_name} ${deleteConfirm.employee?.last_name || ''}? They will no longer be able to log in, but their historical records will be preserved.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, employee: null })}
                confirmText="Disable"
                type="danger"
                isLoading={isDeleting}
                closeOnConfirm={false}
            />
        </div >
    );
}

export default EmployeeManagement;
