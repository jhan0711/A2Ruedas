import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BusinessFlowTourModal } from '../../components/admin/BusinessFlowTourModal';
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
  LoadingSpinner,
} from '../../components/ui';
import { workOrderService } from '../../services/workOrderService';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { inventoryService } from '../../services/inventoryService';
import { cashService } from '../../services/cashService';
import { appointmentService } from '../../services/appointmentService';
import {
  WorkOrder,
  Customer,
  Bicycle,
  Product,
  CashRegister,
  CashRegisterSummary,
  Appointment,
} from '../../types/database';

export const DashboardPage: React.FC = () => {
  const [tourOpen, setTourOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de datos reales
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [cashSummary, setCashSummary] = useState<CashRegisterSummary | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        loadedOrders,
        loadedCustomers,
        loadedBikes,
        loadedProducts,
        loadedRegister,
        loadedAppointments,
      ] = await Promise.all([
        workOrderService.getWorkOrders().catch(() => []),
        customerService.getCustomers().catch(() => []),
        bicycleService.getBicycles().catch(() => []),
        inventoryService.getProducts().catch(() => []),
        cashService.getActiveRegister().catch(() => null),
        appointmentService.getAppointments().catch(() => []),
      ]);

      setWorkOrders(loadedOrders);
      setCustomers(loadedCustomers);
      setBicycles(loadedBikes);
      setProducts(loadedProducts);
      setActiveRegister(loadedRegister);
      setAppointments(loadedAppointments);

      if (loadedRegister) {
        try {
          const movements = await cashService.getMovements(loadedRegister.id);
          const summary = cashService.calculateSummary(loadedRegister, movements);
          setCashSummary(summary);
        } catch {
          setCashSummary(null);
        }
      } else {
        setCashSummary(null);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCOP = (amount: number) => {
    return Math.round(amount || 0).toLocaleString('es-CO');
  };

  // Cálculos dinámicos
  const activeOrders = workOrders.filter(
    (o) => o.status !== 'ENTREGADA' && o.status !== 'CANCELADA',
  );
  const inRepairOrders = activeOrders.filter((o) => o.status === 'EN_REPARACION');
  const evaluatingOrders = activeOrders.filter(
    (o) => o.status === 'DIAGNOSTICO' || o.status === 'PRESUPUESTO',
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = workOrders.filter((o) => o.created_at?.slice(0, 10) === todayStr);
  const todayCompleted = todayOrders.filter(
    (o) => o.status === 'ENTREGADA' || o.status === 'LISTA',
  );

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS',
  );

  const deliveredOrders = workOrders.filter((o) => o.status === 'ENTREGADA');
  const serviceIncome = deliveredOrders.reduce((sum, o) => sum + (o.total_labor || 0), 0);
  const partsIncome = deliveredOrders.reduce((sum, o) => sum + (o.total_parts || 0), 0);

  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock);

  const expectedCash = activeRegister && cashSummary ? cashSummary.expectedCashInDrawer : 0;

  const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));
  const bicycleMap = new Map<string, Bicycle>(bicycles.map((b) => [b.id, b]));

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
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDashboardData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            title="Actualizar métricas"
          >
            Refrescar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTourOpen(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
            className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            title="Abrir la guía paso a paso de las 5 jornadas reales del taller"
          >
            Guía de Flujos del Taller
          </Button>
          <Link to="/admin/recepcion">
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

      <BusinessFlowTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />

      {/* Grid de 8 Indicadores Clave (KPIs Dinámicos) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* KPI 1: Bicicletas en taller */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Bicis en Taller</span>
            <Bike className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? '...' : activeOrders.length}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {activeOrders.length > 0 ? `${inRepairOrders.length} en reparación` : 'Sin bicis activas'}
            </span>
          </div>
        </Card>

        {/* KPI 2: Mantenimientos Hoy */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Mantenimientos Hoy</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? '...' : todayOrders.length}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {todayOrders.length > 0 ? `${todayCompleted.length} completados` : '0 hoy'}
            </span>
          </div>
        </Card>

        {/* KPI 3: Órdenes Abiertas */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Órdenes Abiertas</span>
            <Wrench className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? '...' : activeOrders.length}
            </span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {activeOrders.length > 0 ? `${evaluatingOrders.length} en evaluación` : 'Bandeja al día'}
            </span>
          </div>
        </Card>

        {/* KPI 4: Trabajos Próximos */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Trabajos Próximos</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? '...' : upcomingAppointments.length}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {upcomingAppointments.length > 0 ? `${upcomingAppointments.length} agendados` : 'Sin citas'}
            </span>
          </div>
        </Card>

        {/* KPI 5: Ingresos del Día / Servicios */}
        <Card className="p-3.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Ingresos Servicios</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xs font-mono text-slate-400">$</span>
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? '...' : formatCOP(serviceIncome)}
            </span>
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
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoading ? '...' : formatCOP(partsIncome)}
            </span>
          </div>
        </Card>

        {/* KPI 7: Stock Bajo */}
        <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-medium">Alerta Stock Bajo</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-300">
              {isLoading ? '...' : lowStockProducts.length}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
              {lowStockProducts.length > 0 ? `${lowStockProducts.length} por reponer` : 'Stock al día'}
            </span>
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
            <span className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-300">
              {isLoading ? '...' : formatCOP(expectedCash)}
            </span>
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

            {isLoading ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner text="Cargando operaciones del taller..." />
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    No hay órdenes de trabajo activas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    El taller no tiene bicicletas en proceso en este momento. Registra una nueva recepción para generar una orden de trabajo.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/admin/recepcion">
                    <Button size="sm" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                      Registrar Nueva Recepción
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
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
                  {activeOrders.slice(0, 5).map((order) => {
                    const customer = customerMap.get(order.customer_id);
                    const bike = bicycleMap.get(order.bicycle_id);
                    return (
                      <TableRow key={order.id}>
                        <TableCell isMono className="font-bold text-blue-600 dark:text-blue-400">
                          {order.order_number}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                          {customer?.full_name || 'Cliente registrado'}
                        </TableCell>
                        <TableCell>
                          {bike ? `${bike.brand} ${bike.model} (${bike.color})` : 'Bicicleta en taller'}
                        </TableCell>
                        <TableCell>
                          <Badge status={order.status} withDot isMono />
                        </TableCell>
                        <TableCell isMono className="text-right font-semibold">
                          ${formatCOP(order.grand_total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
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
                Gestionar
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {isLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  Verificando inventario...
                </div>
              ) : lowStockProducts.length === 0 ? (
                <div className="py-6 text-center text-slate-500 dark:text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Stock completamente al día
                  </p>
                  <p className="text-[11px] text-slate-400">
                    No hay repuestos con existencias por debajo del mínimo.
                  </p>
                </div>
              ) : (
                lowStockProducts.slice(0, 4).map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200 block text-xs">
                        {prod.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">SKU: {prod.sku}</span>
                    </div>
                    <Badge variant={prod.stock === 0 ? 'danger' : 'warning'} isMono>
                      {prod.stock} {prod.unit}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card variant="muted">
            <CardHeader>
              <CardTitle>Dispositivos de Taller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Impresión 58 mm</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Listo para imprimir
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
