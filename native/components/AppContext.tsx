import React, { createContext, useContext, useState } from 'react';
import { QuietAlert, QuietAlertOptions, QuietAlertButton } from './QuietAlert';

interface AppContextType {
    showAlert: (
        title: string,
        message: string,
        buttons?: QuietAlertButton[]
    ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState<QuietAlertOptions>({
        visible: false,
        title: '',
        message: '',
        buttons: [],
        onDismiss: () => { }
    });

    const showAlert = (
        title: string,
        message: string,
        buttons?: QuietAlertButton[]
    ) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            buttons: buttons || [{ text: 'OK' }],
            onDismiss: () => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    return (
        <AppContext.Provider value={{ showAlert }}>
            {children}
            <QuietAlert {...alertConfig} />
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
