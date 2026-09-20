import React from 'react';
import {
  Bike,
  Calendar,
  Clock,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Wallet,
  PlusCircle,
  QrCode,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Encabezado y acciones rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Panel Operativo del Taller
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Resumen en tiempo real de operaciones, bicicletas activas e ingresos de caja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/ordenes/nueva"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ingresar Bicicleta (OT)</span>
          </Link>
          <Link
            to="/admin/qr"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Escanear QR</span>
          </Link>
        </div>
      </div>

      {/* Grid de 8 Indicadores Clave (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* KPI 1: Bicicletas en taller */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Bicis en Taller</span>
            <Bike className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">8</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">3 en reparación</span>
          </div>
        </div>

        {/* KPI 2: Mantenimientos Hoy */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Mantenimientos Hoy</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">5</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">2 completados</span>
          </div>
        </div>

        {/* KPI 3: Órdenes Abiertas */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Órdenes Abiertas</span>
            <Wrench className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">6</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">1 por presupuesto</span>
          </div>
        </div>

        {/* KPI 4: Trabajos Próximos */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Trabajos Próximos</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">3</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Agendados mañana</span>
          </div>
        </div>

        {/* KPI 5: Ingresos del Día */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Ingresos Servicios</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs font-mono text-slate-400">$</span>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">280.000</span>
          </div>
        </div>

        {/* KPI 6: Ventas de Productos */}
        <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Ventas Mostrador</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs font-mono text-slate-400">$</span>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">145.000</span>
          </div>
        </div>

        {/* KPI 7: Stock Bajo */}
        <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">Alerta Stock Bajo</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-300">4</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Requieren pedido</span>
          </div>
        </div>

        {/* KPI 8: Caja Actual */}
        <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-medium">Caja en Efectivo</span>
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">$</span>
            <span className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-300">425.000</span>
          </div>
        </div>
      </div>

      {/* Sección principal: Órdenes activas y alertas de taller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Órdenes de Trabajo en Curso (2 columnas) */}
        <div className="lg:col-span-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Órdenes de Trabajo en Curso
              </h2>
            </div>
            <Link
              to="/admin/ordenes"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">OT #</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5">Bicicleta</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-right">Total Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">OT-000104</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">Carlos Mendoza</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Trek Marlin 7 (Rojo)</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      EN_REPARACION
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                    $120.000
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">OT-000103</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">Laura Gómez</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Specialized Allez (Negro)</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      DIAGNOSTICO
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                    $65.000
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">OT-000102</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">Andrés Pardo</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Giant Talon 2 (Azul)</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      LISTA
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                    $180.000
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel lateral: Alertas de Stock y Actividad Reciente */}
        <div className="space-y-4">
          {/* Card Alerta de Stock Bajo */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Repuestos por Agotarse
              </span>
              <Link to="/admin/inventario" className="text-[11px] text-blue-600 hover:underline">
                Ajustar
              </Link>
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">Cadena Shimano 9V</span>
                  <span className="font-mono text-[10px] text-slate-400">SKU: REP-CAD-09</span>
                </div>
                <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded">
                  1 un.
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">Pastillas Shimano B05S</span>
                  <span className="font-mono text-[10px] text-slate-400">SKU: FRE-PAS-B05</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                  2 par
                </span>
              </div>
            </div>
          </div>

          {/* Card de Estado del Sistema */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block mb-2">
              Dispositivos Conectados
            </span>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Impresión 58 mm</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" /> Simulación Activa
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Lector de Cámara QR</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Listo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Firma Táctil</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Calibrado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
