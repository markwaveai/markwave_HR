import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary' }) => {
    const [isClosing, setIsClosing] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) setIsClosing(false);
    }, [isOpen]);

    if (!isOpen && !isClosing) return null;

    const handleClose = (callback) => {
        setIsClosing(true);
        setTimeout(() => {
            callback();
            setIsClosing(false);
        }, 200);
    };

    const isDanger = type === 'danger';

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1e293b]/60 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}>
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        </div>
                        <button onClick={() => handleClose(onCancel)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-gray-600 mb-8 ml-11 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex justify-end gap-3 ml-11">
                        <button
                            onClick={() => handleClose(onCancel)}
                            className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => handleClose(onConfirm)}
                            className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg active:scale-95 ${isDanger
                                ? 'bg-[#ef4444] hover:bg-[#dc2626] shadow-red-200'
                                : 'bg-[#48327d] hover:bg-[#3d2a6a] shadow-purple-200'
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
