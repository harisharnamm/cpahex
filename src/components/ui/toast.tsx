import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

// Toast component
function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);
  
  const handleClose = () => {
    setIsVisible(false);
  };
  
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onClose(id);
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };
  
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={handleAnimationComplete}
      className={cn(
        "w-full max-w-sm rounded-xl border shadow-medium p-4 pointer-events-auto dark:border-gray-700",
        getStyles()
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5 dark:text-white">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          {message && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light-dark/20"
            onClick={handleClose}
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Toast container
function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-0 right-0 p-4 sm:p-6 z-50 flex flex-col items-end space-y-4 pointer-events-none">
      {children}
    </div>
  );
}

// Toast manager
class ToastManager {
  private containerRef: HTMLDivElement | null = null;
  private toasts: ToastProps[] = [];
  private root: any = null;
  
  constructor() {
    // Create container element
    this.containerRef = document.createElement('div');
    document.body.appendChild(this.containerRef);
    this.root = createRoot(this.containerRef);
    this.render();
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
  
  private removeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.render();
  }
  
  private render(): void {
    this.root.render(
      <ToastContainer>
        <AnimatePresence>
          {this.toasts.map(toast => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={this.removeToast.bind(this)}
            />
          ))}
        </AnimatePresence>
      </ToastContainer>
    );
  }
  
  public show(type: ToastType, title: string, message?: string, duration?: number): string {
    const id = this.generateId();
    this.toasts.push({ id, type, title, message, duration, onClose: this.removeToast.bind(this) });
    this.render();
    return id;
  }
  
  public success(title: string, message?: string, duration?: number): string {
    return this.show('success', title, message, duration);
  }
  
  public error(title: string, message?: string, duration?: number): string {
    return this.show('error', title, message, duration);
  }
  
  public warning(title: string, message?: string, duration?: number): string {
    return this.show('warning', title, message, duration);
  }
  
  public info(title: string, message?: string, duration?: number): string {
    return this.show('info', title, message, duration);
  }
  
  public dismiss(id: string): void {
    this.removeToast(id);
  }
  
  public dismissAll(): void {
    this.toasts = [];
    this.render();
  }
}

// Export singleton instance
export const toast = new ToastManager();