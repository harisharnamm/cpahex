import React, { createContext, useContext } from 'react';
import { toast, ToastType } from '../components/ui/toast';

interface ToastContextType {
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const success = (title: string, message?: string, duration?: number) => {
    return toast.success(title, message, duration);
  };
  
  const error = (title: string, message?: string, duration?: number) => {
    return toast.error(title, message, duration);
  };
  
  const warning = (title: string, message?: string, duration?: number) => {
    return toast.warning(title, message, duration);
  };
  
  const info = (title: string, message?: string, duration?: number) => {
    return toast.info(title, message, duration);
  };
  
  const dismiss = (id: string) => {
    toast.dismiss(id);
  };
  
  const dismissAll = () => {
    toast.dismissAll();
  };
  
  return (
    <ToastContext.Provider value={{ success, error, warning, info, dismiss, dismissAll }}>
      {children}
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