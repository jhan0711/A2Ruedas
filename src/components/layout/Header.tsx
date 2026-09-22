import React, { useState } from 'react';
import { Menu, Sun, Moon, ExternalLink, ShieldCheck, LogOut, QrCode, Download } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { usePWA } from '../../context/PWAContext';
import { Link, useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../ui';
import { QRScannerModal } from '../qr/QRScannerModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, user, logout } = useAuth();
  const { isInstalled, setShowInstallModal } = usePWA();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.fullName || user?.email?.split('@')[0] || 'Administrador';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Sistema en línea" />
            A2Ruedas
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
            Taller B2B
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Botón Escanear QR con Cámara o Teclado */}
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
          title="Escanear código QR de bicicleta"
        >
          <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Escanear QR</span>
        </button>

        {/* Botón Instalar App */}
        {!isInstalled && (
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 px-2.5 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 transition-colors shadow-xs"
            title="Instalar A2Ruedas en tu dispositivo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar App</span>
          </button>
        )}

        <Link
          to="/productos"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Abrir vista pública que ven los clientes"
        >
          <span>Catálogo Público</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Switch de Modo Claro / Modo Oscuro */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Indicador de Usuario y Cierre de Sesión */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-mono text-xs font-bold shadow-xs">
            {initials || 'AD'}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium leading-none text-slate-900 dark:text-slate-100 flex items-center gap-1">
              {displayName}
              <ShieldCheck className="w-3 h-3 text-blue-500" />
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[120px]">
              {displayEmail}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1"
            title="Cerrar Sesión del Taller"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmación obligatoria de cierre de sesión (Regla 44) */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="¿Deseas cerrar tu sesión?"
        message="Saldrás del panel administrativo de A2Ruedas. Para volver a gestionar órdenes y caja deberás ingresar tus credenciales nuevamente."
        confirmText="Cerrar Sesión"
        variant="warning"
      />

      {/* Modal global de escaneo de QR */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />
    </header>
  );
};
