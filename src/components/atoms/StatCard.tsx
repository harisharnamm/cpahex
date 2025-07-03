import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral' | 'warning';
  isAnimating?: boolean;
}

export function StatCard({ title, value, change, icon: Icon, trend = 'neutral', isAnimating = false }: StatCardProps) {
  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-500 dark:text-red-400',
    warning: 'text-amber-500 dark:text-amber-400',
    neutral: 'text-text-secondary dark:text-gray-400',
  };

  const trendBgColors = {
    up: 'bg-emerald-50 dark:bg-emerald-900/30',
    down: 'bg-red-50 dark:bg-red-900/30',
    warning: 'bg-amber-50 dark:bg-amber-900/30',
    neutral: 'bg-surface dark:bg-gray-800',
  };

  return (
    <div className={cn(
      "group relative bg-surface-elevated dark:bg-gray-900 rounded-xl border border-border-subtle dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-medium hover:border-border-light dark:hover:border-gray-700 hover:-translate-y-1",
      isAnimating ? 'animate-glow-pulse' : ''
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 dark:from-white/5 to-transparent rounded-xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-tertiary dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-semibold text-text-primary dark:text-white mb-2 tracking-tight">{value}</p>
          {change && (
            <div className={cn("inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium", trendColors[trend], trendBgColors[trend])}>
              {change}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl transition-all duration-200 group-hover:scale-110", trendBgColors[trend])}>
          <Icon className={cn("w-6 h-6", trendColors[trend])} />
        </div>
      </div>
    </div>
  );
}