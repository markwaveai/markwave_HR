import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const variants = {
        success: {
            icon: <CheckCircle size={20} className="text-green-500" />,
            bg: 'bg-white',
            border: 'border-l-4 border-green-500',
            text: 'text-gray-800'
        },
        error: {
            icon: <XCircle size={20} className="text-red-500" />,
            bg: 'bg-white',
            border: 'border-l-4 border-red-500',
            text: 'text-gray-800'
        },
        info: {
            icon: <Info size={20} className="text-blue-500" />,
            bg: 'bg-white',
            border: 'border-l-4 border-blue-500',
            text: 'text-gray-800'
        }
    };

    const style = variants[type] || variants.info;

    return (
        <div className={`fixed top-5 right-5 z-[10000] flex items-center gap-3 px-4 py-3 rounded shadow-lg shadow-gray-200/50 ${style.bg} ${style.border} min-w-[300px] animate-in slide-in-from-right duration-300`}>
            {style.icon}
            <p className={`flex-1 text-sm font-medium ${style.text}`}>{message}</p>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
