// Toast notification component with animations and auto-dismiss

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  autoClose?: boolean;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-black',
  info: 'bg-blue-500 text-white'
};

const toastIcons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ'
};

export const ToastItem: React.FC<ToastProps> = ({
  id,
  message,
  type,
  duration = 5000,
  autoClose = true,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Animation duration
  };

  return (
    <div
      className={`
        mb-2 ${toastStyles[type]} rounded-lg shadow-lg p-4 flex items-center justify-between min-w-80 max-w-md
      `}
      style={{
        transition: 'all 0.3s ease-in-out',
        transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible && !isExiting ? 1 : 0
      }}
    >
      <div className="flex items-center">
        <span className="text-lg mr-3 font-bold">
          {toastIcons[type]}
        </span>
        <span className="font-medium">{message}</span>
      </div>
      
      <button
        onClick={handleClose}
        className="ml-4 text-lg font-bold hover:opacity-70 transition-opacity"
        aria-label="Bezárás"
      >
        ×
      </button>
    </div>
  );
};