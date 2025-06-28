import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

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
    up: 'text-emerald-600',
    down: 'text-red-500',
    warning: 'text-amber-500',
    neutral: 'text-text-secondary',
  };

  const trendBgColors = {
    up: 'bg-emerald-50',
    down: 'bg-red-50',
    warning: 'bg-amber-50',
    neutral: 'bg-surface',
  };

  return (
    <div className={`group relative bg-surface-elevated rounded-xl border border-border-subtle p-6 transition-all duration-300 hover:shadow-medium hover:border-border-light hover:-translate-y-1 ${isAnimating ? 'animate-glow-pulse' : ''}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-tertiary mb-1">{title}</p>
          <p className="text-3xl font-semibold text-text-primary mb-2 tracking-tight">{value}</p>
          {change && (
            <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${trendColors[trend]} ${trendBgColors[trend]}`}>
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl transition-all duration-200 group-hover:scale-110 ${trendBgColors[trend]}`}>
          <Icon className={`w-6 h-6 ${trendColors[trend]}`} />
        </div>
      </div>
    </div>
  );
}