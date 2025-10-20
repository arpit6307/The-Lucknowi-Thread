import React, { useState, useEffect } from 'react';

// --- Icons for different toast types ---
const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
    </svg>
);

const DangerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
    </svg>
);

const AlertToast = ({ message, type = 'success', show, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (show) {
            setIsExiting(false);
            const timer = setTimeout(() => {
                setIsExiting(true);
                // Allow exit animation to complete before calling onClose
                setTimeout(onClose, 400); 
            }, 5000); // Disappears after 5 seconds

            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show && !isExiting) {
        return null;
    }

    const toastType = type === 'danger' ? 'danger' : 'success';
    const Icon = type === 'danger' ? DangerIcon : SuccessIcon;

    return (
        <div className={`custom-toast ${toastType} ${show ? 'show' : ''} ${isExiting ? 'exit' : ''}`}>
            <div className="toast-icon">
                <Icon />
            </div>
            <div className="toast-message">
                {message}
            </div>
            <button onClick={onClose} className="toast-close-btn">&times;</button>
            <div className="toast-progress-bar"></div>
        </div>
    );
};

export default AlertToast;