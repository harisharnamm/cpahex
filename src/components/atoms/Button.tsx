import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light-dark/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary dark:bg-primary-light-dark text-gray-900 hover:bg-primary-hover dark:hover:bg-primary-light-dark/90 hover:shadow-medium hover:scale-105 active:scale-95 shadow-soft',
    secondary: 'bg-surface-elevated dark:bg-gray-800 text-text-primary dark:text-white border border-border-light dark:border-gray-700 hover:bg-surface-hover dark:hover:bg-gray-700 hover:border-border-light dark:hover:border-gray-600 hover:shadow-soft',
    ghost: 'text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white hover:bg-surface-hover dark:hover:bg-gray-800',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-sm min-h-[44px]',
    lg: 'px-8 py-4 text-base min-h-[48px]',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
}