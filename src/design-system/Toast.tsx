import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  subtext?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, subtext?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);

  const showToast = useCallback(
    (type: ToastType, message: string, subtext?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, subtext };
      setCurrentToast(newToast);

      setTimeout(() => {
        setCurrentToast((curr) => (curr?.id === id ? null : curr));
      }, 4000);
    },
    []
  );

  const dismissToast = () => {
    setCurrentToast(null);
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#2563EB] shrink-0" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {currentToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white border border-[#DCE3ED] rounded-lg shadow-lg p-4 flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-2"
        >
          {getToastIcon(currentToast.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1A1F29]">
              {currentToast.message}
            </p>
            {currentToast.subtext && (
              <p className="text-xs text-[#5B6472] mt-0.5 font-mono">
                {currentToast.subtext}
              </p>
            )}
          </div>
          <button
            onClick={dismissToast}
            className="p-1 rounded text-[#8A93A3] hover:text-[#1A1F29] transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
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
