import React from 'react';
import { Menu, Search } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSearch } from '../../contexts/SearchContext';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { GlobalSearch } from '../molecules/GlobalSearch';

interface TopBarProps {
  title?: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  action?: React.ReactNode;
  customAction?: React.ReactNode;
}

export function TopBar({ title, breadcrumbItems, action, customAction }: TopBarProps) {
  const { toggleSidebar } = useSidebar();
  const { isSearchOpen, toggleSearch } = useSearch();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        
        {breadcrumbItems ? (
          <Breadcrumb items={breadcrumbItems} />
        ) : title ? (
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        ) : null}
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSearch}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <Search className="w-5 h-5 text-gray-600" />
        </button>
        
        {customAction}
        {action}
      </div>

      {isSearchOpen && <GlobalSearch />}
    </div>
  );
}