import React from 'react';
import { WorkOrderStatus } from '../../types';

export type BadgeVariant =
  | 'info'
  | 'warning'
  | 'success'
  | 'danger'
  | 'neutral'
  | 'purple'
  | 'indigo'
  | 'cyan';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  status?: WorkOrderStatus;
  withDot?: boolean;
  isMono?: boolean;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  status,
  withDot = false,
  isMono = false,
  size = 'sm',
  className = '',
  ...props
}) => {
  // Mapeo automático de estados de orden de trabajo
  let effectiveVariant = variant;
  if (status) {
    switch (status) {
      case 'RECIBIDA':
        effectiveVariant = 'info';
        break;
      case 'DIAGNOSTICO':
        effectiveVariant = 'indigo';
        break;
      case 'PRESUPUESTO':
        effectiveVariant = 'purple';
        break;
      case 'APROBADA':
        effectiveVariant = 'cyan';
        break;
      case 'EN_REPARACION':
        effectiveVariant = 'warning';
        break;
      case 'ESPERANDO_REPUESTO':
        effectiveVariant = 'warning';
        break;
      case 'LISTA':
        effectiveVariant = 'success';
        break;
      case 'ENTREGADA':
        effectiveVariant = 'neutral';
        break;
      case 'CANCELADA':
        effectiveVariant = 'danger';
        break;
    }
  }

  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    info: {
      container:
        'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      dot: 'bg-blue-500',
    },
    warning: {
      container:
        'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      dot: 'bg-amber-500',
    },
    success: {
      container:
        'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      dot: 'bg-emerald-500',
    },
    danger: {
      container:
        'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
      dot: 'bg-red-500',
    },
    neutral: {
      container:
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
    },
    indigo: {
      container:
        'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
      dot: 'bg-indigo-500',
    },
    purple: {
      container:
        'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
      dot: 'bg-purple-500',
    },
    cyan: {
      container:
        'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
      dot: 'bg-cyan-500',
    },
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const current = variantStyles[effectiveVariant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-semibold border ${current.container} ${sizeStyles[size]} ${
        isMono ? 'font-mono' : ''
      } ${className}`}
      {...props}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />}
      {status ? status : children}
    </span>
  );
};
