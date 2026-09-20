import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  onDismiss,
  className = '',
  ...props
}) => {
  const configs: Record<
    AlertVariant,
    { container: string; text: string; icon: React.ReactNode }
  > = {
    info: {
      container:
        'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200',
      text: 'text-blue-800 dark:text-blue-300',
      icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />,
    },
    success: {
      container:
        'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200',
      text: 'text-emerald-800 dark:text-emerald-300',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
    },
    warning: {
      container:
        'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
      text: 'text-amber-800 dark:text-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
    },
    error: {
      container:
        'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200',
      text: 'text-red-800 dark:text-red-300',
      icon: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />,
    },
  };

  const current = configs[variant];

  return (
    <div
      role="alert"
      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${current.container} ${className}`}
      {...props}
    >
      {current.icon}
      <div className="flex-1 space-y-0.5">
        {title && <h4 className="font-bold leading-tight">{title}</h4>}
        <div className={`text-[11px] leading-relaxed ${current.text}`}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Cerrar alerta"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
