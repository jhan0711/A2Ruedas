import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  isOnline: boolean;
  wasOffline: boolean;
  dismissRestoredAlert: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isUpdateAvailable: boolean;
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
  promptInstall: () => Promise<boolean>;
  updateApp: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Detección de iOS (iPad, iPhone, iPod)
  const isIOS =
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  // 1. Monitoreo de conectividad (Online / Offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Auto-ocultar notificación de restablecimiento después de 4 segundos
      setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dismissRestoredAlert = useCallback(() => {
    setWasOffline(false);
  }, []);

  // 2. Detección de modo Standalone / Instalado
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    }

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 3. Captura del evento beforeinstallprompt (Chromium / Android / Desktop)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 4. Registro del Service Worker y detección de actualizaciones
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Comprobar si ya hay un worker esperando
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setIsUpdateAvailable(true);
        }

        // Escuchar cuando se descubre un nuevo worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(newWorker);
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Error al registrar Service Worker:', err);
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  // 5. Función para disparar la instalación nativa
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // Si es iOS o no hay evento diferido, abrir el modal con instrucciones
      setShowInstallModal(true);
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowInstallModal(false);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[PWA] Error al solicitar instalación:', error);
      return false;
    }
  }, [deferredPrompt]);

  // 6. Función para actualizar la aplicación
  const updateApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        wasOffline,
        dismissRestoredAlert,
        isInstallable: !!deferredPrompt || isIOS,
        isInstalled,
        isIOS,
        isUpdateAvailable,
        showInstallModal,
        setShowInstallModal,
        promptInstall,
        updateApp,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA debe utilizarse dentro de un PWAProvider');
  }
  return context;
};
