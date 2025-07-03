import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-text-primary">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-3 bg-surface-elevated dark:bg-gray-800 border border-border-subtle dark:border-gray-700 rounded-xl text-text-primary dark:text-white placeholder-text-tertiary dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary-light-dark/20 focus:border-primary/30 dark:focus:border-primary-light-dark/30 transition-all duration-200 hover:border-border-light dark:hover:border-gray-600",
          error ? 'border-red-300 dark:border-red-500/50 focus:border-red-400 dark:focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/20' : '',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}