import React from 'react';

const LoadingSpinner = ({ size = 24, className = '', color = 'border-[#6366f1]' }) => {
    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div
                className={`animate-spin rounded-full border-2 border-t-transparent ${color}`}
                style={{ width: size, height: size }}
            />
        </div>
    );
};

export default LoadingSpinner;
