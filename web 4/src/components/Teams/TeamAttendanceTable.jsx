import attendanceData from '../data/attendance.json';

function AttendanceTable() {
    return (
        <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl shadow-lg">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] p-4 py-6">
                <span className="text-md font-semibold text-[#2d3436]">Team Attendance</span>
                <a href="#" className="text-xs text-[#48327d] font-medium no-underline hover:underline">View All</a>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="border-b border-[#e2e8f0]">
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Date</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Emp ID</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Employee Name</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Role</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Check In</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Breaks</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Check Out</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Status</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Worked Hours</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap w-[200px]">Progress</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Arrival Time</th>
                            <th className="p-4 py-4 text-center text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">Arrival Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceData.map((employee, index) => {
                            // Logic for Worked Hours Color and Bar
                            let workedMinutes = 0;
                            let isLess = true;
                            let width = 0;

                            if (employee.workedHours && employee.workedHours !== '-') {
                                const [h, mArr] = employee.workedHours.split('h ');
                                const m = mArr ? parseInt(mArr) : 0;
                                workedMinutes = (parseInt(h) * 60) + m;
                                const requiredMinutes = 8 * 60 + 15; // 8h 15m = 495 min
                                isLess = workedMinutes < requiredMinutes;
                                width = Math.min((workedMinutes / requiredMinutes) * 100, 100);
                            }

                            const getStatusDotColor = (status) => {
                                switch (status) {
                                    case 'Present': return 'bg-green-500';
                                    case 'Absent': return 'bg-red-500';
                                    case 'Half Day': return 'bg-[#ea580c]'; // Brownish/Orange
                                    case 'WFH': return 'bg-blue-500';
                                    default: return 'bg-gray-400';
                                }
                            };

                            const getArrivalColor = (status) => {
                                if (status === 'Late') return 'text-[#ef4444]';
                                if (status === 'Early') return 'text-[#22c55e]';
                                return 'text-[#636e72]';
                            };

                            return (
                                <tr key={index} className="border-b border-[#f1f5f9] hover:bg-[#f3f0ff] transition-colors last:border-none text-center">
                                    <td className="p-4 py-3 text-xs text-[#5F6D7A ] font-medium whitespace-nowrap text-center">{employee.date}</td>
                                    <td className="p-4 py-3 text-xs text-[#2d3436] font-medium whitespace-nowrap text-center">{employee.employeeId}</td>
                                    <td className="p-4 py-3 text-sm font-medium text-[#2d3436] whitespace-nowrap text-center">{employee.employeeName}</td>
                                    <td className="p-4 py-3 text-xs text-[#5F6D7A ] whitespace-nowrap text-center">{employee.role}</td>
                                    <td className="p-4 py-3 text-xs text-[#2d3436] font-medium whitespace-nowrap text-center">{employee.checkIn}</td>
                                    <td className="p-4 py-3 text-xs text-[#5F6D7A ] whitespace-nowrap text-center">{employee.breaks}</td>
                                    <td className="p-4 py-3 text-xs text-[#2d3436] font-medium whitespace-nowrap text-center">{employee.checkOut}</td>
                                    <td className="p-4 py-3 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusDotColor(employee.status)}`}></div>
                                            <span className="text-xs font-semibold text-[#2d3436]">{employee.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 py-3 whitespace-nowrap text-center">
                                        <span className={`text-xs font-bold ${isLess ? 'text-red-500' : 'text-green-600'}`}>
                                            {employee.workedHours}
                                        </span>
                                    </td>
                                    <td className="p-4 py-3 whitespace-nowrap text-center">
                                        <div className="h-2 w-full bg-[#f8fafc] rounded-full overflow-hidden border border-gray-100 mx-auto">
                                            <div
                                                className="h-full rounded-full bg-[#48327d]"
                                                style={{ width: `${width}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="p-4 py-3 text-xs text-[#2d3436] font-medium whitespace-nowrap text-center">{employee.arrivalTime}</td>
                                    <td className={`p-4 py-3 text-xs font-bold whitespace-nowrap text-center ${getArrivalColor(employee.arrivalStatus)}`}>
                                        {employee.arrivalStatus}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AttendanceTable;
