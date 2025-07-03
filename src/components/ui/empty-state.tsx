import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Button } from '../atoms/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl w-16 h-16 mb-6 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-text-primary mb-3">
        {title}
      </h3>
      
      <p className="text-text-secondary max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      
      {action && (
        <Button
          onClick={action.onClick}
          icon={action.icon}
          className="bg-primary text-gray-900 hover:bg-primary-hover"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}