import React from 'react';
import { Menu, Search } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSearch } from '../../contexts/SearchContext';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { GlobalSearch } from '../molecules/GlobalSearch';
import { Button } from '../atoms/Button';

interface TopBarProps {
  title?: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  action?: React.ReactNode | { label: string; onClick: () => void; icon?: React.ReactNode };
  customAction?: React.ReactNode | { customRender: () => React.ReactNode };
}

export function TopBar({ title, breadcrumbItems, action, customAction }: TopBarProps) {
  const { toggleSidebar } = useSidebar();
  const { isSearchOpen, toggleSearch } = useSearch();

  const renderAction = (actionProp: TopBarProps['action']) => {
    if (!actionProp) return null;
    
    if (React.isValidElement(actionProp)) {
      return actionProp;
    }
    
    if (typeof actionProp === 'object' && 'label' in actionProp && 'onClick' in actionProp) {
      return (
        <Button
          onClick={actionProp.onClick}
          variant="primary"
          size="sm"
          icon={actionProp.icon}
        >
          {actionProp.label}
        </Button>
      );
    }
    
    return null;
  };

  const renderCustomAction = (customActionProp: TopBarProps['customAction']) => {
    if (!customActionProp) return null;
    
    if (React.isValidElement(customActionProp)) {
      return customActionProp;
    }
    
    if (typeof customActionProp === 'object' && 'customRender' in customActionProp) {
      return customActionProp.customRender();
    }
    
    return null;
  };
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between relative">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        {breadcrumbItems ? (
          <Breadcrumb items={breadcrumbItems} />
        ) : title ? (
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        ) : null}
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSearch}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        >
          <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        {renderCustomAction(customAction)}
        {renderAction(action)}
      </div>

      {isSearchOpen && (
        <GlobalSearch 
          isOpen={isSearchOpen}
          onClose={toggleSearch}
        />
      )}
    </div>
  );
}