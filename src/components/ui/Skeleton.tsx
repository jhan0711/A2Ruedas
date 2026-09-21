import React from 'react';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'table-row';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  count = 1,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'text':
        return 'h-4 rounded-md';
      case 'card':
        return 'rounded-xl h-48';
      case 'table-row':
        return 'h-10 rounded-md';
      case 'rectangular':
      default:
        return 'rounded-lg';
    }
  };

  const baseStyles = 'animate-pulse bg-slate-200 dark:bg-slate-800/80';
  const customStyle: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  if (variant === 'card') {
    return (
      <div
        aria-hidden="true"
        className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-3/4" />
            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-1/2" />
          </div>
        </div>
        <div className="h-16 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-lg" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-20" />
          <div className="h-7 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg w-24" />
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div
        aria-hidden="true"
        className={`flex items-center gap-4 py-3 px-4 border-b border-slate-100 dark:border-slate-800 animate-pulse ${className}`}
        {...props}
      >
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-24 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md hidden sm:block" />
        <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
    );
  }

  if (count > 1) {
    return (
      <div aria-hidden="true" className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${baseStyles} ${getVariantStyles()} ${className}`}
            style={customStyle}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${baseStyles} ${getVariantStyles()} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};
