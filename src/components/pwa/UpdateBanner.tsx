import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const UpdateBanner: React.FC = () => {
  const { isUpdateAvailable, updateApp } = usePWA();

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-slate-900 border border-blue-500/30 text-white p-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 mt-0.5 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            Nueva versión disponible
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Hemos actualizado A2Ruedas con mejoras de estabilidad y rendimiento para el taller.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={updateApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
