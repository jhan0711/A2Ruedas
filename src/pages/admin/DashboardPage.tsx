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
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui';

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
          <Link to="/admin/ordenes/nueva">
            <Button size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
              Ingresar Bicicleta (OT)
            </Button>
          </Link>
          <Link to="/admin/qr">
            <Button variant="secondary" size="sm" leftIcon={<QrCode className="w-3.5 h-3.5" />}>
              Escanear QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de 8 Indicadores Clave (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* KPI 1: Bicicletas en taller */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Bicis en Taller</span>
            <Bike className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">8</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">3 en reparación</span>
          </div>
        </Card>

        {/* KPI 2: Mantenimientos Hoy */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Mantenimientos Hoy</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">5</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">2 completados</span>
          </div>
        </Card>

        {/* KPI 3: Órdenes Abiertas */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Órdenes Abiertas</span>
            <Wrench className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">6</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">1 por presupuesto</span>
          </div>
        </Card>

        {/* KPI 4: Trabajos Próximos */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Trabajos Próximos</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">3</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Agendados mañana</span>
          </div>
        </Card>

        {/* KPI 5: Ingresos del Día */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Ingresos Servicios</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs font-mono text-slate-400">$</span>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">280.000</span>
          </div>
        </Card>

        {/* KPI 6: Ventas de Productos */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Ventas Mostrador</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs font-mono text-slate-400">$</span>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">145.000</span>
          </div>
        </Card>

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
        {/* Tabla de Órdenes de Trabajo en Curso */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <CardTitle>Órdenes de Trabajo en Curso</CardTitle>
              </div>
              <Link
                to="/admin/ordenes"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OT #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Bicicleta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total Est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell isMono className="font-bold text-blue-600 dark:text-blue-400">
                    OT-000104
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    Carlos Mendoza
                  </TableCell>
                  <TableCell>Trek Marlin 7 (Rojo)</TableCell>
                  <TableCell>
                    <Badge status="EN_REPARACION" withDot isMono />
                  </TableCell>
                  <TableCell isMono className="text-right font-semibold">
                    $120.000
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell isMono className="font-bold text-blue-600 dark:text-blue-400">
                    OT-000103
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    Laura Gómez
                  </TableCell>
                  <TableCell>Specialized Allez (Negro)</TableCell>
                  <TableCell>
                    <Badge status="DIAGNOSTICO" withDot isMono />
                  </TableCell>
                  <TableCell isMono className="text-right font-semibold">
                    $65.000
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell isMono className="font-bold text-blue-600 dark:text-blue-400">
                    OT-000102
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    Andrés Pardo
                  </TableCell>
                  <TableCell>Giant Talon 2 (Azul)</TableCell>
                  <TableCell>
                    <Badge status="LISTA" withDot isMono />
                  </TableCell>
                  <TableCell isMono className="text-right font-semibold">
                    $180.000
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Panel lateral: Alertas de Stock y Periféricos */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Repuestos por Agotarse
              </CardTitle>
              <Link to="/admin/inventario" className="text-[11px] text-blue-600 hover:underline">
                Ajustar
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">
                    Cadena Shimano 9V
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">SKU: REP-CAD-09</span>
                </div>
                <Badge variant="danger" isMono>
                  1 un.
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 block">
                    Pastillas Shimano B05S
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">SKU: FRE-PAS-B05</span>
                </div>
                <Badge variant="warning" isMono>
                  2 par
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card variant="muted">
            <CardHeader>
              <CardTitle>Dispositivos de Taller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-600 dark:text-slate-400">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
