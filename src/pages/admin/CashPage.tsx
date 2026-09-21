import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Coins,
  Smartphone,
  CreditCard,
  Plus,
  Minus,
  Receipt,
  Printer,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  CashRegister,
  CashMovement,
  CashRegisterSummary,
  CashMovementType,
  CashPaymentMethod,
} from '../../types/database';
import { cashService } from '../../services/cashService';
import {
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '../../components/ui';
import { OpenCashModal } from '../../components/cash/OpenCashModal';
import { CashMovementModal } from '../../components/cash/CashMovementModal';
import { CloseCashModal } from '../../components/cash/CloseCashModal';
import { CashTicketModal } from '../../components/cash/CashTicketModal';

export const CashPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [pastRegisters, setPastRegisters] = useState<CashRegister[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de movimientos
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterMethod, setFilterMethod] = useState<'ALL' | CashPaymentMethod>('ALL');

  // Modales
  const [openCashModalOpen, setOpenCashModalOpen] = useState(false);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementModalType, setMovementModalType] = useState<CashMovementType>('INCOME');
  const [closeCashModalOpen, setCloseCashModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicketRegister, setSelectedTicketRegister] = useState<CashRegister | null>(null);
  const [selectedTicketMovements, setSelectedTicketMovements] = useState<CashMovement[]>([]);

  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const current = await cashService.getActiveRegister();
      setActiveRegister(current);

      if (current) {
        const movs = await cashService.getMovements(current.id);
        setMovements(movs);
      } else {
        setMovements([]);
      }

      const history = await cashService.getPastRegisters();
      setPastRegisters(history);
    } catch (err) {
      console.error('Error al cargar datos de caja:', err);
      setAlertMessage({ type: 'error', text: 'Error al conectar con el módulo de caja.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Abrir modal de movimiento con tipo predefinido
  const handleOpenMovementModal = (type: CashMovementType) => {
    setMovementModalType(type);
    setMovementModalOpen(true);
  };

  // Abrir tirilla de la sesión activa
  const handleOpenCurrentTicket = () => {
    if (!activeRegister) return;
    setSelectedTicketRegister(activeRegister);
    setSelectedTicketMovements(movements);
    setTicketModalOpen(true);
  };

  // Abrir tirilla de una sesión del historial
  const handleOpenPastTicket = async (pastReg: CashRegister) => {
    setSelectedTicketRegister(pastReg);
    const pastMovs = await cashService.getMovements(pastReg.id);
    setSelectedTicketMovements(pastMovs);
    setTicketModalOpen(true);
  };

  // Resumen financiero de la caja activa
  const summary: CashRegisterSummary | null = activeRegister
    ? cashService.calculateSummary(activeRegister, movements)
    : null;

  // Filtrado reactivo de movimientos
  const filteredMovements = movements.filter((m) => {
    if (filterType !== 'ALL' && m.type !== filterType) return false;
    if (filterMethod !== 'ALL' && m.payment_method !== filterMethod) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    const matchConcept = m.concept.toLowerCase().includes(term);
    const matchRef = m.reference_id?.toLowerCase().includes(term);
    const matchCat = m.category?.toLowerCase().includes(term);

    return matchConcept || matchRef || matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Alerta de notificación */}
      {alertMessage && (
        <Alert variant={alertMessage.type} onDismiss={() => setAlertMessage(null)}>
          {alertMessage.text}
        </Alert>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-emerald-600" />
            Flujo de Caja y Arqueo Diario
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Control de ingresos, egresos, anticipos, medios de pago físicos y digitales, y arqueo de cierre.
          </p>
        </div>

        {/* Pestañas de Vista */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'current'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeRegister ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              Caja de Hoy
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Histórico ({pastRegisters.length})
            </button>
          </div>

          <Button size="sm" variant="outline" onClick={loadData} title="Actualizar datos">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center">
          <LoadingSpinner size="lg" text="Cargando estado financiero de caja..." />
        </div>
      ) : activeTab === 'current' ? (
        /* ================= VISTA 1: CAJA ACTUAL (EN VIVO) ================= */
        !activeRegister ? (
          /* Estado de Caja Cerrada */
          <Card className="p-8 text-center border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Wallet className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                La caja se encuentra cerrada
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Para comenzar a registrar pagos de órdenes de trabajo, ventas de mostrador o gastos operativos,
                realiza la apertura de caja registrando la base inicial en efectivo.
              </p>
            </div>

            <div>
              <Button
                size="md"
                variant="primary"
                onClick={() => setOpenCashModalOpen(true)}
                leftIcon={<Wallet className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
              >
                Realizar Apertura de Caja
              </Button>
            </div>
          </Card>
        ) : (
          /* Estado de Caja Abierta */
          <div className="space-y-5">
            {/* Barra de Estado de la Caja Activa */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Sesión de Caja Activa
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      ABIERTA
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Abierta por <strong className="text-slate-800 dark:text-slate-200">{activeRegister.opened_by}</strong> el{' '}
                    {new Date(activeRegister.opened_at).toLocaleString('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              {/* Botones de Acción Operativa */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleOpenMovementModal('INCOME')}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
                >
                  Registrar Ingreso
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenMovementModal('EXPENSE')}
                  leftIcon={<Minus className="w-3.5 h-3.5 text-red-600" />}
                  className="text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60 hover:bg-red-50"
                >
                  Registrar Egreso
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenCurrentTicket}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                  title="Imprimir resumen térmico parcial"
                >
                  Tirilla 58mm
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setCloseCashModalOpen(true)}
                  leftIcon={<Receipt className="w-3.5 h-3.5" />}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-xs"
                >
                  Arqueo & Cierre
                </Button>
              </div>
            </div>

            {/* Tarjetas KPI Financieras */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Base Inicial */}
                <Card className="p-3 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block truncate">
                    Base Inicial
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-700 dark:text-slate-300 block mt-1">
                    ${summary.initialAmount.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block">Efectivo de inicio</span>
                </Card>

                {/* 2. Efectivo en Gaveta (Físico) */}
                <Card className="p-3 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20">
                  <span className="text-[10px] uppercase font-mono text-emerald-800 dark:text-emerald-300 block truncate font-bold flex items-center gap-1">
                    <Coins className="w-3 h-3 text-emerald-600" />
                    Efectivo Gaveta
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
                    ${summary.expectedCashInDrawer.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block truncate">
                    Base + Entradas - Salidas
                  </span>
                </Card>

                {/* 3. Transferencias Nequi/Bancos */}
                <Card className="p-3 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block truncate flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-purple-500" />
                    Transferencias
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-purple-600 dark:text-purple-400 block mt-1">
                    ${summary.totalTransferIncome.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block">Nequi / Bancolombia</span>
                </Card>

                {/* 4. Tarjetas / Datáfono */}
                <Card className="p-3 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block truncate flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    Datáfono / Tarj.
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-blue-600 dark:text-blue-400 block mt-1">
                    ${summary.totalCardIncome.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block">Débito y Crédito</span>
                </Card>

                {/* 5. Total Egresos */}
                <Card className="p-3 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block truncate flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    Total Egresos
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-red-600 dark:text-red-400 block mt-1">
                    -${summary.totalExpense.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block">Gastos y repuestos</span>
                </Card>

                {/* 6. Balance Neto */}
                <Card className="p-3 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block truncate font-bold">
                    Balance Neto
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white block mt-1">
                    ${summary.netBalance.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono block">
                    {summary.movementsCount} movimientos
                  </span>
                </Card>
              </div>
            )}

            {/* Barra de Filtros y Búsqueda de Movimientos */}
            <Card className="p-3.5 border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por concepto, N° orden OT o categoría..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ALL">Todos los flujos</option>
                    <option value="INCOME">Solo Ingresos (+)</option>
                    <option value="EXPENSE">Solo Egresos (-)</option>
                  </select>

                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="ALL">Todos los medios</option>
                    <option value="CASH">Efectivo</option>
                    <option value="TRANSFER">Transferencia (Nequi)</option>
                    <option value="CARD">Datáfono / Tarjeta</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Tabla de Movimientos de la Sesión */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
              {filteredMovements.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="w-5 h-5" />}
                  title="Sin movimientos registrados"
                  description={
                    searchTerm || filterType !== 'ALL' || filterMethod !== 'ALL'
                      ? 'No hay transacciones que coincidan con los filtros seleccionados.'
                      : 'Aún no se han registrado ingresos ni egresos en esta sesión de caja.'
                  }
                  actionText="Registrar Primer Ingreso"
                  onAction={() => handleOpenMovementModal('INCOME')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Hora</TableHead>
                        <TableHead className="w-28">Tipo</TableHead>
                        <TableHead>Concepto / Detalle</TableHead>
                        <TableHead className="w-36">Medio de Pago</TableHead>
                        <TableHead className="w-32">Orden OT</TableHead>
                        <TableHead className="text-right w-32">Monto (COP)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((mov) => {
                        const timeStr = new Date(mov.created_at).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <TableRow key={mov.id}>
                            {/* Hora */}
                            <TableCell>
                              <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {timeStr}
                              </span>
                            </TableCell>

                            {/* Tipo */}
                            <TableCell>
                              {mov.type === 'INCOME' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-mono">
                                  <TrendingUp className="w-3 h-3 text-emerald-600" /> INGRESO
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md font-mono">
                                  <TrendingDown className="w-3 h-3 text-red-600" /> EGRESO
                                </span>
                              )}
                            </TableCell>

                            {/* Concepto */}
                            <TableCell>
                              <div className="space-y-0.5">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                                  {mov.concept}
                                </span>
                                {mov.notes && (
                                  <span className="text-[11px] text-slate-500 block italic">
                                    Nota: {mov.notes}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Medio de Pago */}
                            <TableCell>
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {mov.payment_method === 'CASH' ? (
                                  <>
                                    <Coins className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Efectivo</span>
                                  </>
                                ) : mov.payment_method === 'TRANSFER' ? (
                                  <>
                                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Nequi / Bancos</span>
                                  </>
                                ) : mov.payment_method === 'CARD' ? (
                                  <>
                                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Datáfono</span>
                                  </>
                                ) : (
                                  <span>Otro</span>
                                )}
                              </span>
                            </TableCell>

                            {/* Orden OT */}
                            <TableCell>
                              {mov.reference_id ? (
                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                                  {mov.reference_id}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </TableCell>

                            {/* Monto */}
                            <TableCell className="text-right">
                              <span
                                className={`font-mono font-bold text-xs ${
                                  mov.type === 'INCOME'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {mov.type === 'INCOME' ? '+' : '-'}${mov.amount.toLocaleString('es-CO')}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        )
      ) : (
        /* ================= VISTA 2: HISTORIAL DE CAJAS CERRADAS ================= */
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
          {pastRegisters.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-5 h-5" />}
              title="Sin histórico de cajas cerradas"
              description="Las sesiones de caja cerradas y sus arqueos quedarán registradas aquí permanentemente para auditoría."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Base Inicial</TableHead>
                    <TableHead>Efectivo Esperado</TableHead>
                    <TableHead>Efectivo Contado</TableHead>
                    <TableHead>Diferencia Arqueo</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastRegisters.map((reg) => {
                    const openDate = new Date(reg.opened_at).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                    });
                    const closeHour = reg.closed_at
                      ? new Date(reg.closed_at).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    const diff = reg.difference || 0;

                    return (
                      <TableRow key={reg.id}>
                        {/* Fecha */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white block">
                              {openDate}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Cierre: {closeHour}
                            </span>
                          </div>
                        </TableCell>

                        {/* Responsable */}
                        <TableCell>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                            {reg.closed_by || reg.opened_by}
                          </span>
                        </TableCell>

                        {/* Base Inicial */}
                        <TableCell isMono className="text-xs text-slate-600 dark:text-slate-400">
                          ${reg.initial_amount.toLocaleString('es-CO')}
                        </TableCell>

                        {/* Esperado */}
                        <TableCell isMono className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          ${(reg.system_calculated_amount || 0).toLocaleString('es-CO')}
                        </TableCell>

                        {/* Contado */}
                        <TableCell isMono className="text-xs font-bold text-slate-900 dark:text-white">
                          ${(reg.final_counted_amount || 0).toLocaleString('es-CO')}
                        </TableCell>

                        {/* Diferencia */}
                        <TableCell>
                          {diff === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-mono">
                              <CheckCheck className="w-3 h-3" /> CUADRADA ($0)
                            </span>
                          ) : diff > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full font-mono">
                              +${diff.toLocaleString('es-CO')} (SOBRANTE)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full font-mono">
                              <AlertTriangle className="w-3 h-3" /> -${Math.abs(diff).toLocaleString('es-CO')} (FALTANTE)
                            </span>
                          )}
                        </TableCell>

                        {/* Notas */}
                        <TableCell className="max-w-xs truncate text-xs text-slate-600 dark:text-slate-400">
                          {reg.notes || '—'}
                        </TableCell>

                        {/* Botón de Tirilla */}
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenPastTicket(reg)}
                            leftIcon={<Printer className="w-3.5 h-3.5" />}
                            title="Reimprimir comprobante de cierre"
                          >
                            Tirilla
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* Modal de Apertura de Caja */}
      <OpenCashModal
        isOpen={openCashModalOpen}
        onClose={() => setOpenCashModalOpen(false)}
        onSuccess={(newReg) => {
          setActiveRegister(newReg);
          setMovements([]);
          setAlertMessage({
            type: 'success',
            text: `Apertura de caja realizada con éxito con base de $${newReg.initial_amount.toLocaleString('es-CO')} COP.`,
          });
        }}
      />

      {/* Modal de Registro de Movimientos */}
      <CashMovementModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        defaultType={movementModalType}
        onSuccess={(newMov) => {
          setMovements((prev) => [newMov, ...prev]);
          setAlertMessage({
            type: 'success',
            text: `${newMov.type === 'INCOME' ? 'Ingreso' : 'Egreso'} de $${newMov.amount.toLocaleString('es-CO')} registrado exitosamente.`,
          });
        }}
      />

      {/* Modal de Arqueo y Cierre */}
      {activeRegister && (
        <CloseCashModal
          isOpen={closeCashModalOpen}
          onClose={() => setCloseCashModalOpen(false)}
          register={activeRegister}
          movements={movements}
          onSuccess={(closedReg) => {
            setActiveRegister(null);
            setPastRegisters((prev) => [closedReg, ...prev]);
            setSelectedTicketRegister(closedReg);
            setSelectedTicketMovements(movements);
            setTicketModalOpen(true);
            setAlertMessage({
              type: 'success',
              text: 'Caja cerrada y arqueada exitosamente. Se ha generado la tirilla de cierre.',
            });
          }}
        />
      )}

      {/* Modal de Comprobante Térmico (58 mm) */}
      <CashTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        register={selectedTicketRegister}
        movements={selectedTicketMovements}
      />
    </div>
  );
};
