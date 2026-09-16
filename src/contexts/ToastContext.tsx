import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle; border: string; iconColor: string; iconBg: string }> = {
  success: { icon: CheckCircle, border: 'border-sage/30', iconColor: 'text-sage', iconBg: 'bg-sage/15' },
  error: { icon: XCircle, border: 'border-soft-red/30', iconColor: 'text-soft-red', iconBg: 'bg-soft-red/15' },
  info: { icon: Info, border: 'border-accent/30', iconColor: 'text-accent', iconBg: 'bg-accent/15' },
};

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  }, [dismiss]);

  const value: ToastContextType = {
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error'),
    info: (message) => show(message, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 bg-white rounded-xl shadow-soft-lg border-2 ${style.border} p-4 animate-toast-in`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                <Icon className={`w-5 h-5 ${style.iconColor}`} />
              </div>
              <p className="text-sm text-dark-brown flex-1 pt-1">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="p-1 rounded-lg hover:bg-dark-brown/5 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-dark-brown/40" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
