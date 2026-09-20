import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bike, Sun, Moon, MapPin, Clock, MessageCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Barra superior informativa */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              Lunes a Sábado: 8:00 AM - 6:30 PM
            </span>
            <span className="hidden md:flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400" />
              Calle Principal del Taller #12-34
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/573000000000?text=Hola%20A2Ruedas,%20quisiera%20consultar%20sobre%20un%20servicio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp Taller</span>
            </a>
          </div>
        </div>
      </div>

      {/* Navegación pública principal */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs sticky top-0 z-30 px-4 transition-colors">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
                A2Ruedas
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 block">
                Taller Especializado
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 md:gap-3">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Inicio
            </Link>
            <Link
              to="/productos"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                location.pathname === '/productos'
                  ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Repuestos y Accesorios
            </Link>

            {/* Switch de Modo Claro / Modo Oscuro */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 ml-1 transition-colors"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Acceso para Técnicos */}
            <Link
              to="/admin"
              className="ml-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            >
              Acceso Taller
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido público */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer público */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 mt-auto transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">A2Ruedas Taller</span>
            <span>— Mantenimiento profesional y repuestos de alta gama</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>Atención presencial en taller</span>
            <span>•</span>
            <span>Tel: +57 300 000 0000</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
