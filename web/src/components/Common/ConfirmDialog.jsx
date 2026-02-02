import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary' }) => {
    if (!isOpen) return null;

    const isDanger = type === 'danger';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-scale-in">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        </div>
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-gray-600 mb-8 ml-11">
                        {message}
                    </p>

                    <div className="flex justify-end gap-3 ml-11">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${isDanger
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-[#48327d] hover:bg-[#5d4496]'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
