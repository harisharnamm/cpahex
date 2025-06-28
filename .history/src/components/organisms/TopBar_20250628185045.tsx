import React from 'react';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { Button } from '../atoms/Button';

interface TopBarProps {
  title: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
}

export function TopBar({ title, breadcrumbItems, action }: TopBarProps) {
  return (
    <div className="bg-surface-elevated/80 backdrop-blur-sm border-b border-border-subtle sticky top-0 z-30">
      <div className="max-w-content mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">{title}</h1>
          </div>
          {action && (
            <Button
              onClick={action.onClick}
              icon={action.icon}
              className="shadow-medium"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}