import React from 'react';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { Button } from '../atoms/Button';
import { Menu, Search as SearchIcon, X } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useSearch } from '../../contexts/SearchContext';
import type { LucideIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch, SearchResult } from '../../hooks/useGlobalSearch';

interface TopBarProps {
  title: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  customAction?: {
    label: string;
    onClick: () => void;
    customRender: () => React.ReactNode;
  };
}

export function TopBar({ title, breadcrumbItems, action, customAction }: TopBarProps) {
  const { openSidebar } = useSidebar();
  const { openSearch, isSearchOpen, closeSearch } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { search } = useGlobalSearch();
  const navigate = useNavigate();
  
  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults) return;
      
      switch (e.key) {
        case 'Escape':
          setShowResults(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultClick(results[selectedIndex]);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResults, results, selectedIndex]);
  
  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      const searchResults = await search(searchQuery);
      setResults(searchResults);
      setLoading(false);
    };
    
    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);
  
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setShowResults(false);
    setSearchQuery('');
  };
  
  const getIconForType = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-amber-600" />;
      case 'vendor':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'irs_notice':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-text-tertiary" />;
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
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
          
          {/* Quick search button - only show when no custom action */}
          {!customAction && !action && (
            <div ref={searchRef} className="relative mt-2 sm:mt-0">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  className="w-full sm:w-64 px-4 py-2 pl-10 bg-surface-elevated border border-border-subtle rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hidden sm:flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-surface border border-border-subtle rounded">⌘K</kbd>
                </div>
              </div>
              
              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full mt-2 right-0 w-full sm:w-96 bg-surface-elevated rounded-xl border border-border-subtle shadow-premium z-50 max-h-[70vh] overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-text-tertiary text-sm mt-2">Searching...</p>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2">
                        <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Search Results
                        </h3>
                      </div>
                      
                      <div className="space-y-1">
                        {results.map((result, index) => (
                          <div
                            key={`${result.type}-${result.id}`}
                            className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                              selectedIndex === index ? 'bg-primary/10' : 'hover:bg-surface-hover'
                            }`}
                            onClick={() => handleResultClick(result)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${
                                selectedIndex === index ? 'bg-primary/20' : 'bg-surface'
                              }`}>
                                {getIconForType(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-text-primary truncate">{result.title}</h4>
                                  <span className="text-xs text-text-tertiary ml-2 flex-shrink-0 capitalize">
                                    {result.type.replace('_', ' ')}
                                  </span>
                                </div>
                                {result.description && (
                                  <p className="text-sm text-text-secondary line-clamp-1 mt-1">
                                    {result.description}
                                  </p>
                                )}
                                {result.date && (
                                  <p className="text-xs text-text-tertiary mt-1">
                                    {formatDate(result.date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : searchQuery.length > 1 ? (
                    <div className="p-6 text-center">
                      <FileText className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                      <p className="text-text-primary font-medium">No results found</p>
                      <p className="text-text-tertiary text-sm mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <SearchIcon className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
                      <p className="text-text-tertiary text-sm">Type at least 2 characters to search</p>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="p-3 border-t border-border-subtle bg-surface">
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <kbd className="px-1.5 py-0.5 font-mono bg-surface border border-border-subtle rounded">↑</kbd>
                          <kbd className="px-1.5 py-0.5 font-mono bg-surface border border-border-subtle rounded">↓</kbd>
                          <span>to navigate</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <kbd className="px-1.5 py-0.5 font-mono bg-surface border border-border-subtle rounded">Enter</kbd>
                          <span>to select</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <kbd className="px-1.5 py-0.5 font-mono bg-surface border border-border-subtle rounded">Esc</kbd>
                        <span>to close</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}