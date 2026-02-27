import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { leaveApi } from '../../services/api';

const LeaveBalanceCard = ({ user }) => {
    const [balance, setBalance] = useState({
        cl: 0, sl: 0, el: 0, scl: 0, bl: 0, pl: 0,
        ll: 0, co: 0, lwp: 0
    });

    useEffect(() => {
        if (user?.id) {
            fetchBalance();
        }
    }, [user?.id]);

    const fetchBalance = async () => {
        try {
            const data = await leaveApi.getBalance(user.id);
            // Convert array back to object for compatibility with the rendering logic
            const balanceObj = {};
            if (Array.isArray(data)) {
                data.forEach(item => {
                    balanceObj[item.code] = item.available;
                });
            } else {
                Object.assign(balanceObj, data);
            }
            setBalance(balanceObj);
        } catch (error) {
            console.error("Failed to fetch leave balance", error);
        }
    };

    // Show ALL leave types; only cl, sl, bl have colored progress rings
    const allLeaveTypes = [
        { key: 'cl', label: 'Casual', max: 12, color: '#48327d', filled: true },
        { key: 'sl', label: 'Sick', max: 12, color: '#48327d', filled: true },
        { key: 'el', label: 'Earned', max: 15, color: '#48327d', filled: false },
        { key: 'scl', label: 'Special', max: 3, color: '#48327d', filled: false },
        { key: 'bl', label: 'Bereavement', max: 5, color: '#48327d', filled: true },
        { key: 'pl', label: 'Paternity', max: 3, color: '#48327d', filled: false },
        { key: 'll', label: 'Long', max: 21, color: '#48327d', filled: false },
        { key: 'co', label: 'Comp Off', max: 2, color: '#48327d', filled: false }
    ];

    return (
        <div className="bg-white rounded-xl p-4 shadow-lg flex flex-col justify-between relative min-h-[140px]">
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-[#2d3436]">Leave Balance</h3>
                    <span className="text-[10px] text-[#64748b] font-medium leading-none mt-0.5">(Annual)</span>
                </div>
                <CalendarIcon size={16} className="text-[#48327d]" />
            </div>

            <div className="grid grid-cols-4 gap-2 mm:gap-2.5">
                {allLeaveTypes.map(({ key, label, max, color, filled }) => (
                    <div key={key} className="flex flex-col items-center gap-1">
                        <div className="relative w-9 h-9 mm:w-10 mm:h-10">
                            <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                                <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f2f6" strokeWidth="3" />
                                {filled && (
                                    <circle
                                        cx="16" cy="16" r="14"
                                        fill="transparent"
                                        stroke={color}
                                        strokeWidth="3"
                                        strokeDasharray={`${((balance[key] || 0) / max) * 100} 100`}
                                        pathLength="100"
                                        className="transition-all duration-500 ease-out"
                                    />
                                )}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] mm:text-[11px] font-bold text-[#2d3436]">
                                    {balance[key] || 0}
                                </span>
                            </div>
                        </div>
                        <span className="text-[7px] mm:text-[8px] font-extrabold text-[#2d3436] whitespace-nowrap text-center">
                            {label}
                        </span>
                    </div>
                ))}
            </div>


        </div>
    );
};

export default LeaveBalanceCard;
