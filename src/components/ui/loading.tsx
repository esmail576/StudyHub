import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const Loading = ({ className, size = 'md', text = 'Pretending to work while loading…' }: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className="relative">
        <div className={cn(
          'animate-spin rounded-full border-4 border-slate-200',
          sizeClasses[size]
        )} />
        <div className={cn(
          'absolute inset-0 animate-spin rounded-full border-4 border-t-slate-800',
          sizeClasses[size]
        )} />
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">
        {text}
      </p>
    </div>
  );
};

export default Loading; 