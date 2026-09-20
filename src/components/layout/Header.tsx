import React from 'react';
import { Menu, Sun, Moon, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();

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

        {/* Indicador de Usuario Administrador */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-mono text-xs font-bold shadow-sm">
            AD
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium leading-none text-slate-900 dark:text-slate-100 flex items-center gap-1">
              Admin Taller
              <ShieldCheck className="w-3 h-3 text-blue-500" />
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">admin@a2ruedas.com</span>
          </div>
        </div>
      </div>
    </header>
  );
};
