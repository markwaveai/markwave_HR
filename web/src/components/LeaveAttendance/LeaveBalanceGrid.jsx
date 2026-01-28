import React from 'react';

const LeaveBalanceGrid = ({ balances }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {balances.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-[#e2e8f0] hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                            {item.icon}
                        </div>
                        <h3 className="text-sm font-bold text-[#2d3436]">{item.name}</h3>
                    </div>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-2xl font-bold text-[#48327d]">{item.available}</span>
                        <span className="text-xs text-[#636e72] mb-1.5 font-medium">days available</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-[#636e72]">Consumed: {item.consumed}</span>
                            <span className="text-[#636e72]">Total: {item.total}</span>
                        </div>
                        <div className="h-1.5 w-full bg-[#f1f2f6] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#48327d] rounded-full"
                                style={{ width: `${(item.consumed / item.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LeaveBalanceGrid;
