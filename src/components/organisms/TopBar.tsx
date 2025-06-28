import React from 'react';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { Button } from '../atoms/Button';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

interface TopBarProps {
  title: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
  customAction?: {
    label: string;
    onClick: () => void;
    customRender: () => React.ReactNode;
  };
}

export function TopBar({ title, breadcrumbItems, action, customAction }: TopBarProps) {
  const { openSidebar } = useSidebar();
  
  return (
    <div className="bg-surface-elevated/80 backdrop-blur-sm border-b border-border-subtle sticky top-0 z-30">
      <div className="max-w-content mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            {/* Hamburger menu - only visible on mobile */}
            <button 
              onClick={openSidebar}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="space-y-1 sm:space-y-2">
              {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary tracking-tight truncate">{title}</h1>
            </div>
          </div>
          
          {action && (
            <Button
              onClick={action.onClick}
              icon={action.icon}
              className="shadow-medium text-sm sm:text-base py-1.5 sm:py-2 mt-2 sm:mt-0 w-full sm:w-auto"
            >
              {action.label}
            </Button>
          )}
          {customAction && customAction.customRender()}
        </div>
      </div>
    </div>
  );
}