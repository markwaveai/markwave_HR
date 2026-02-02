import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { leaveApi } from '../../services/api';

const LeaveBalanceCard = ({ user }) => {
    const [balance, setBalance] = useState({ cl: 0, sl: 0, el: 0, total: 0 });

    useEffect(() => {
        if (user?.id) {
            fetchBalance();
        }
    }, [user?.id]);

    const fetchBalance = async () => {
        try {
            const data = await leaveApi.getBalance(user.id);
            setBalance(data);
        } catch (error) {
            console.error("Failed to fetch leave balance", error);
        }
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-lg flex flex-col justify-between relative min-h-[140px]">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold text-[#2d3436]">Leave Balance</h3>
                <CalendarIcon size={16} className="text-[#48327d]" />
            </div>

            <div className="flex items-center gap-2 ms:gap-4 px-0.5 flex-grow justify-center mt-2">
                <div className="flex flex-col items-center gap-1 mm:gap-1.5">
                    <div className="relative w-9 h-9 mm:w-11 mm:h-11">
                        <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f2f6" strokeWidth="3" />
                            <circle
                                cx="16" cy="16" r="14"
                                fill="transparent"
                                stroke="#48327d"
                                strokeWidth="3"
                                strokeDasharray={`${(balance.total / 29) * 100} 100`}
                                pathLength="100"
                                className="transition-all duration-500 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[12px] font-bold text-[#2d3436]">{balance.total}</span>
                        </div>
                    </div>
                    <span className="text-[8px] font-bold text-[#2d3436] whitespace-nowrap">Total Leaves</span>
                </div>

                {/* Casual Leave Chart */}
                <div className="flex flex-col items-center gap-1 mm:gap-1.5">
                    <div className="relative w-9 h-9 mm:w-11 mm:h-11">
                        <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f2f6" strokeWidth="3" />
                            <circle
                                cx="16" cy="16" r="14"
                                fill="transparent"
                                stroke="#48327d"
                                strokeWidth="3"
                                strokeDasharray={`${(balance.cl / 6) * 100} 100`}
                                pathLength="100"
                                className="transition-all duration-500 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[12px] font-bold text-[#2d3436]">{balance.cl}</span>
                        </div>
                    </div>
                    <span className="text-[8px] font-bold text-[#2d3436] whitespace-nowrap">Casual Leaves</span>
                </div>

                {/* Sick Leave Chart */}
                <div className="flex flex-col items-center gap-1 mm:gap-1.5">
                    <div className="relative w-9 h-9 mm:w-11 mm:h-11">
                        <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f2f6" strokeWidth="3" />
                            <circle
                                cx="16" cy="16" r="14"
                                fill="transparent"
                                stroke="#48327d"
                                strokeWidth="3"
                                strokeDasharray={`${(balance.sl / 6) * 100} 100`}
                                pathLength="100"
                                className="transition-all duration-500 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[12px] font-bold text-[#2d3436]">{balance.sl}</span>
                        </div>
                    </div>
                    <span className="text-[8px] font-bold text-[#2d3436] whitespace-nowrap">Sick Leaves</span>
                </div>

                <div className="flex flex-col items-center gap-1 mm:gap-1.5">
                    <div className="relative w-9 h-9 mm:w-11 mm:h-11">
                        <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
                            <circle cx="16" cy="16" r="14" fill="transparent" stroke="#f1f2f6" strokeWidth="3" />
                            <circle
                                cx="16" cy="16" r="14"
                                fill="transparent"
                                stroke="#48327d"
                                strokeWidth="3"
                                strokeDasharray={`${(balance.el / 17) * 100} 100`}
                                pathLength="100"
                                className="transition-all duration-500 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[12px] font-bold text-[#2d3436]">{balance.el}</span>
                        </div>
                    </div>
                    <span className="text-[8px] font-bold text-[#2d3436] whitespace-nowrap">Earned Leaves</span>
                </div>
            </div>
        </div>
    );
};

export default LeaveBalanceCard;
