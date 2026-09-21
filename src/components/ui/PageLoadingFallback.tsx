import React from 'react';
import { Skeleton } from './Skeleton';

export interface PageLoadingFallbackProps {
  message?: string;
}

export const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({
  message = 'Cargando módulo...',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="w-full space-y-6 animate-in fade-in duration-150 py-2"
    >
      <span className="sr-only">{message}</span>

      {/* Cabecera esqueleto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <Skeleton variant="text" width={180} height={24} className="rounded-lg" />
          <Skeleton variant="text" width={280} height={14} className="rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={100} height={36} className="rounded-lg" />
          <Skeleton variant="rectangular" width={120} height={36} className="rounded-lg" />
        </div>
      </div>

      {/* Métricas o tarjetas superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width={80} height={14} />
              <Skeleton variant="circular" width={28} height={28} />
            </div>
            <Skeleton variant="text" width={120} height={28} />
          </div>
        ))}
      </div>

      {/* Contenido principal esqueleto (tabla / cuadrícula) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden p-4 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <Skeleton variant="text" width={140} height={18} />
          <Skeleton variant="rectangular" width={200} height={32} />
        </div>
        <div className="space-y-2.5">
          <Skeleton variant="table-row" />
          <Skeleton variant="table-row" />
          <Skeleton variant="table-row" />
          <Skeleton variant="table-row" />
        </div>
      </div>
    </div>
  );
};
