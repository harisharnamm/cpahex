import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface NavigationItemProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function NavigationItem({ to, icon: Icon, children }: NavigationItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-surface-elevated ${
        isActive
          ? 'bg-primary text-gray-900 shadow-soft'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
      {children}
    </Link>
  );
}