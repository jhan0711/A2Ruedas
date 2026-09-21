import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import type { ToastItem, ToastType } from '../../context/ToastContext';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notificaciones del sistema"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {toasts.length > 0 ? `${toasts.length} notificaciones activas` : ''}
      </div>

      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </aside>
  );
};

const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const isError = toast.type === 'error';
  const role = isError ? 'alert' : 'status';
  const ariaLive = isError ? 'assertive' : 'polite';

  const typeConfig: Record<
    ToastType,
    {
      icon: React.ReactNode;
      borderClass: string;
      bgClass: string;
      iconClass: string;
      progressClass: string;
    }
  > = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400" />,
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      bgClass: 'bg-white dark:bg-slate-900',
      iconClass: 'text-emerald-500',
      progressClass: 'bg-emerald-500',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />,
      borderClass: 'border-red-200 dark:border-red-800',
      bgClass: 'bg-white dark:bg-slate-900',
      iconClass: 'text-red-500',
      progressClass: 'bg-red-500',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 dark:text-amber-400" />,
      borderClass: 'border-amber-200 dark:border-amber-800',
      bgClass: 'bg-white dark:bg-slate-900',
      iconClass: 'text-amber-500',
      progressClass: 'bg-amber-500',
    },
    info: {
      icon: <Info className="w-5 h-5 shrink-0 text-blue-500 dark:text-blue-400" />,
      borderClass: 'border-blue-200 dark:border-blue-800',
      bgClass: 'bg-white dark:bg-slate-900',
      iconClass: 'text-blue-500',
      progressClass: 'bg-blue-500',
    },
  };

  const config = typeConfig[toast.type];

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`pointer-events-auto relative flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${config.borderClass} ${config.bgClass} text-slate-800 dark:text-slate-100 transition-all duration-200 transform translate-y-0`}
    >
      <div className="pt-0.5">{config.icon}</div>

      <div className="flex-1 text-left min-w-0 pr-1">
        {toast.title && (
          <h4 className="text-xs font-bold leading-tight text-slate-900 dark:text-white">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug mt-0.5 break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 -mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
