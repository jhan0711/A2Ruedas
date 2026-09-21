import React, { useEffect } from 'react';
import { Download, X, Smartphone, Wifi, Zap, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export const InstallPromptModal: React.FC = () => {
  const {
    showInstallModal,
    setShowInstallModal,
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
  } = usePWA();

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showInstallModal) {
        setShowInstallModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInstallModal, setShowInstallModal]);

  if (!showInstallModal) {
    return null;
  }

  const handleInstallClick = async () => {
    await promptInstall();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setShowInstallModal(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={() => setShowInstallModal(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado con Icono de App */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-600 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
            <img
              src="/icons/icon-192x192.svg"
              alt="A2Ruedas App"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                // Fallback si la imagen aún no está disponible
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h3 id="pwa-install-title" className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Instalar A2Ruedas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isInstalled
                ? '¡La aplicación ya está instalada!'
                : 'Aplicación oficial para taller y mostrador'}
            </p>
          </div>
        </div>

        {/* Si ya está instalada */}
        {isInstalled ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>A2Ruedas ya se encuentra instalada en este dispositivo y lista para usar.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Beneficios de la PWA */}
            <div className="space-y-2.5 mb-6 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Acceso en pantalla de inicio:</strong> Ícono directo en tu teléfono o escritorio sin abrir el navegador.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Modo sin conexión:</strong> Trabaja con tranquilidad en el taller ante cortes de internet.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Carga instantánea:</strong> Pantalla completa, sin barras molestas y mayor fluidez de uso.
                </span>
              </div>
            </div>

            {/* Instrucciones según plataforma */}
            {isIOS ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3 mb-4">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  📱 Para instalar en tu iPhone o iPad:
                </p>
                <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>
                      Toca el botón <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> <strong>Compartir</strong> en la barra inferior de Safari.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>
                      Desliza y selecciona <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> <strong>"Agregar a pantalla de inicio"</strong>.
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>
                      Pulsa <strong>"Agregar"</strong> en la esquina superior derecha.
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={!isInstallable}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Download className="w-4 h-4" />
                  Instalar en este dispositivo
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Instalación instantánea sin pasar por tiendas de aplicaciones
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
