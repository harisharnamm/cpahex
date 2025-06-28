import React from 'react';

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
        className={`w-full px-4 py-3 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200 hover:border-border-light ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}