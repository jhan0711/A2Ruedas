import React from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline, dismissRestoredAlert } = usePWA();

  // Si está conectado y no viene de estar desconectado, no mostrar nada
  if (isOnline && !wasOffline) {
    return null;
  }

  // Notificación de conexión restablecida
  if (isOnline && wasOffline) {
    return (
      <aside aria-label="Estado de conexión" className="bg-emerald-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md transition-all sticky top-0 z-50 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2 max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>¡Conexión a internet restablecida! El taller está sincronizado en tiempo real.</span>
          </div>
          <button
            type="button"
            onClick={dismissRestoredAlert}
            className="p-1 hover:bg-emerald-700 rounded-md transition-colors text-emerald-100"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  // Banner persistente de modo sin conexión
  return (
    <aside aria-label="Modo sin conexión" className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2 text-xs md:text-sm font-medium shadow-md transition-all sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-100"></span>
          </span>
          <WifiOff className="w-4 h-4 text-amber-200 flex-shrink-0" />
          <span>
            <strong>Sin conexión a internet:</strong> A2Ruedas está operando en modo local. Puedes continuar trabajando con normalidad.
          </span>
        </div>
      </div>
    </aside>
  );
};
