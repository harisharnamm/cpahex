import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Button } from '../atoms/Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  iconClassName
}: EmptyStateProps) {
  return (
    <div className={cn(
      "bg-surface-elevated dark:bg-gray-900 rounded-2xl border border-border-subtle dark:border-gray-800 p-8 sm:p-12 shadow-soft text-center",
      className
    )}>
      <div className={cn(
        "p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 rounded-2xl w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center",
        iconClassName
      )}>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-text-primary dark:text-white mb-2">{title}</h3>
      <p className="text-text-tertiary dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto mb-6">{description}</p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            icon={action.icon}
            className="w-full sm:w-auto"
          >
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button
            variant="secondary"
            onClick={secondaryAction.onClick}
            icon={secondaryAction.icon}
            className="w-full sm:w-auto"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}