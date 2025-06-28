import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  // On very small screens, show only the last two items
  const displayItems = items.length > 2 && window.innerWidth < 640 
    ? [...items.slice(items.length - 2)] 
    : items;
    
  return (
    <nav className="flex flex-wrap items-center space-x-1 sm:space-x-2 text-xs sm:text-sm" aria-label="Breadcrumb">
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-text-secondary flex-shrink-0" />}
          {item.href ? (
            <Link
              to={item.href}
              className="text-text-secondary hover:text-text-primary transition-colors duration-200 truncate max-w-[100px] sm:max-w-xs"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-primary font-medium truncate max-w-[120px] sm:max-w-xs">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}