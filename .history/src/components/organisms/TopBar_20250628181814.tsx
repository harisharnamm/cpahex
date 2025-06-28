import React from 'react';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { Button } from '../atoms/Button';
import { Menu } from 'lucide-react';

interface TopBarProps {
  title: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
  onMenuClick?: () => void;
}

export function TopBar({ title, breadcrumbItems, action, onMenuClick }: TopBarProps) {
  return (
    <div className="bg-surface-elevated/80 backdrop-blur-sm border-b border-border-subtle sticky top-0 z-30">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="space-y-1 sm:space-y-2">
              {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">{title}</h1>
            </div>
          </div>
          {action && (
            <Button
              onClick={action.onClick}
              icon={action.icon}
              className="shadow-medium text-sm sm:text-base"
            >
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">
                {action.icon && <action.icon className="w-4 h-4" />}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}