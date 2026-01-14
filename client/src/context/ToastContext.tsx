import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-suppression après 3s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    useEffect(() => {
        // La fonction qui se déclenche quand le signal arrive
        const handleExternalToast = (event: any) => {
            const { message, type } = event.detail;
            showToast(message, type);
        };

        // On branche l'écouteur
        window.addEventListener('SHOW_TOAST', handleExternalToast);

        // On débranche quand on quitte (propreté)
        return () => window.removeEventListener('SHOW_TOAST', handleExternalToast);
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div id="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        <span style={{ fontSize: '1.2rem' }}>
                            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
                        </span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast doit être utilisé à l'intérieur de ToastProvider !");
        
    }
    return context;
}