import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text' | 'card' | 'table-row' | 'avatar';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-surface-hover";
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'h-4 rounded w-full';
      case 'card':
        return 'h-40 rounded-xl w-full';
      case 'table-row':
        return 'h-12 rounded-lg w-full';
      case 'avatar':
        return 'h-10 w-10 rounded-full';
      default:
        return 'rounded-lg';
    }
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;
  
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(baseStyles, getVariantStyles(), className)}
      style={style}
    />
  ));
  
  return count === 1 ? items[0] : <div className="space-y-2">{items}</div>;
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%', className }: { lines?: number; lastLineWidth?: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines - 1 }, (_, i) => (
        <Skeleton key={i} variant="text" className="w-full" />
      ))}
      <Skeleton variant="text" className={lastLineWidth} />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface-elevated rounded-xl p-6 border border-border-subtle", className)}>
      <Skeleton variant="rectangular" className="h-40 mb-4" />
      <Skeleton variant="text" className="mb-2" />
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} variant="text" className="h-6" />
        ))}
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} variant="table-row" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton variant="avatar" />
          <div className="flex-1">
            <Skeleton variant="text" className="mb-2" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}