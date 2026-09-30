import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Toast } from '../components/Toast';

export type ToastType = 'success' | 'error';

interface ToastContextData {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: '',
        type: 'success',
    });

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        setToast({ visible: true, message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={hideToast}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
