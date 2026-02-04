import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    const [isClosing, setIsClosing] = React.useState(false);

    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const variants = {
        success: {
            icon: <CheckCircle size={20} className="text-green-500" />,
            bg: 'bg-white',
            border: 'border-l-4 border-green-500',
            text: 'text-[#1e293b]'
        },
        error: {
            icon: <XCircle size={20} className="text-red-500" />,
            bg: 'bg-white',
            border: 'border-l-4 border-red-500',
            text: 'text-[#1e293b]'
        },
        info: {
            icon: <Info size={20} className="text-blue-500" />,
            bg: 'bg-white',
            border: 'border-l-4 border-blue-500',
            text: 'text-[#1e293b]'
        }
    };

    const style = variants[type] || variants.info;

    return (
        <div className={`fixed top-6 right-6 z-[10000] flex items-center gap-4 px-5 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-[#e2e8f0] ${style.bg} ${style.border} min-w-[320px] transition-all duration-300 ${isClosing ? 'opacity-0 translate-x-10' : 'animate-in slide-in-from-right-10'}`}>
            <div className="shrink-0">{style.icon}</div>
            <p className={`flex-1 text-sm font-bold ${style.text}`}>{message}</p>
            <button
                onClick={handleClose}
                className="text-[#94a3b8] hover:text-[#475569] p-1 pointer-events-auto transition-colors"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default Toast;
