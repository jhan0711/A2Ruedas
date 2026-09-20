import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <div className="max-w-xs space-y-1">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{title}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <div className="pt-1">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
