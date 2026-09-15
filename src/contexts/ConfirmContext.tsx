import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    setOptions(typeof opts === 'string' ? { message: opts } : opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleClose = (result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
  };

  const variant = options?.variant ?? 'danger';
  const isDanger = variant === 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-dark-brown/50 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-soft-lg max-w-md w-full animate-modal-in">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger ? 'bg-soft-red/15' : 'bg-primary/10'}`}>
                  {isDanger ? (
                    <AlertTriangle className="w-6 h-6 text-soft-red" />
                  ) : (
                    <HelpCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
                <h2 className="font-heading text-xl font-bold text-primary">
                  {options.title ?? (isDanger ? 'Confirm Deletion' : 'Please Confirm')}
                </h2>
              </div>
              <p className="text-dark-brown/70 mb-6">{options.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 px-6 py-3 border-2 border-dark-brown/20 text-dark-brown font-semibold rounded-xl hover:bg-dark-brown/5 transition-all duration-300"
                >
                  {options.cancelText ?? 'Cancel'}
                </button>
                <button
                  onClick={() => handleClose(true)}
                  className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl shadow-soft hover:shadow-e2 hover:-translate-y-[3px] active:translate-y-[1px] transition-[transform,box-shadow] duration-[180ms] ease-brisk ${
                    isDanger ? 'bg-soft-red' : 'bg-primary'
                  }`}
                >
                  {options.confirmText ?? (isDanger ? 'Delete' : 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}
