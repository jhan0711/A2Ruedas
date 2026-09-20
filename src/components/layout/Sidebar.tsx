import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Bike,
  Wrench,
  Boxes,
  Tag,
  Users,
  Wallet,
  Receipt,
  QrCode,
  Printer,
  Settings,
  Palette,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Agenda', path: '/admin/agenda', icon: Calendar },
  { name: 'Bicicletas', path: '/admin/bicicletas', icon: Bike },
  { name: 'Órdenes de Trabajo', path: '/admin/ordenes', icon: Wrench, badge: 'OT' },
  { name: 'Inventario', path: '/admin/inventario', icon: Boxes },
  { name: 'Productos', path: '/admin/productos', icon: Tag },
  { name: 'Clientes', path: '/admin/clientes', icon: Users },
  { name: 'Caja', path: '/admin/caja', icon: Wallet },
  { name: 'Facturas', path: '/admin/facturas', icon: Receipt },
  { name: 'Códigos QR', path: '/admin/qr', icon: QrCode },
  { name: 'Impresión 58mm', path: '/admin/impresion', icon: Printer },
  { name: 'Configuración', path: '/admin/configuracion', icon: Settings },
  { name: 'Design System', path: '/admin/design-system', icon: Palette, badge: 'UI' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel lateral */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera lateral móvil */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 md:hidden">
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            Navegación Taller
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de navegación */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-blue-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer lateral */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>A2Ruedas v0.1.0</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Sistema operativo" />
          </div>
        </div>
      </aside>
    </>
  );
};
