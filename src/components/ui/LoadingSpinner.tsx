import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center space-y-2 ${className}`}>
      <Loader2 className={`${sizeStyles[size]} animate-spin text-blue-600 dark:text-blue-400`} />
      {text && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div
    className={`bg-slate-200 dark:bg-slate-800 rounded animate-pulse ${className}`}
    aria-hidden="true"
  />
);
