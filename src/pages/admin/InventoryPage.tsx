import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  Plus,
  Search,
  DollarSign,
  Package,
  Sparkles,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { Product, InventoryMovement } from '../../types/database';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '../../components/ui';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'in' | 'out' | 'adjustment'>('ALL');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal para registrar movimiento
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, movs] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getMovements(),
      ]);
      setProducts(prods);
      setMovements(movs);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setAlertMessage({ type: 'error', text: 'No se pudieron cargar los datos de inventario.' });
    } finally {
      setIsLoading(false);
    }
  };

  const openMovementModal = (productId?: string, defaultType: 'in' | 'out' | 'adjustment' = 'in') => {
    setSelectedProductId(productId || (products.length > 0 ? products[0].id : ''));
    setMovementType(defaultType);
    setQuantity(1);
    setReason('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setFormError('Debes seleccionar un producto.');
      return;
    }
    if (quantity <= 0) {
      setFormError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (!reason.trim()) {
      setFormError('El motivo o justificación del movimiento es obligatorio.');
      return;
    }

    const targetProduct = products.find((p) => p.id === selectedProductId);
    if (movementType === 'out' && targetProduct && targetProduct.stock < quantity) {
      setFormError(`Stock insuficiente. Stock actual disponible: ${targetProduct.stock} ${targetProduct.unit}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { product, movement } = await inventoryService.adjustStock(
        selectedProductId,
        quantity,
        movementType,
        reason.trim(),
      );

      setAlertMessage({
        type: 'success',
        text: `Movimiento registrado: ${movementType.toUpperCase()} de ${quantity} ${product.unit} en "${product.name}". Nuevo stock: ${movement.new_stock}.`,
      });

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Error al registrar movimiento:', err);
      setFormError(err.message || 'Error al procesar el movimiento de almacén.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Métricas financieras y operativas del Kardex
  const totalCostValuation = products.reduce((acc, p) => acc + p.stock * p.cost_price, 0);
  const totalSaleValuation = products.reduce((acc, p) => acc + p.stock * p.sale_price, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock);
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);

  // Producto seleccionado en el modal para calcular proyección
  const currentModalProduct = products.find((p) => p.id === selectedProductId);
  let projectedStock = currentModalProduct ? currentModalProduct.stock : 0;
  if (currentModalProduct) {
    if (movementType === 'in') projectedStock += Number(quantity || 0);
    else if (movementType === 'out') projectedStock -= Number(quantity || 0);
    else if (movementType === 'adjustment') projectedStock = Number(quantity || 0);
  }

  // Filtrado de movimientos
  const filteredMovements = movements.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    const prodName = m.product?.name?.toLowerCase() || '';
    const prodSku = m.product?.sku?.toLowerCase() || '';
    const movReason = m.reason?.toLowerCase() || '';

    const matchesSearch = !term || prodName.includes(term) || prodSku.includes(term) || movReason.includes(term);
    const matchesType = movementFilter === 'ALL' || m.movement_type === movementFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Control de Inventario y Kardex
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro auditable de entradas, salidas, ajustes de almacén y cálculo matemático de existencias.
          </p>
        </div>

        <Button size="sm" onClick={() => openMovementModal()} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Registrar Movimiento
        </Button>
      </div>

      {/* Alerta de feedback */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type === 'success' ? 'success' : 'error'}
          title={alertMessage.type === 'success' ? 'Operación Exitosa' : 'Atención'}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* KPI Cards del Almacén */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              VALORACIÓN AL COSTO
            </span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              ${totalCostValuation.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-400 block">Capital invertido en repuestos</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              VALOR ESTIMADO VENTA
            </span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ${totalSaleValuation.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-400 block">Recuperación bruta proyectada</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              STOCK BAJO / REPOSICIÓN
            </span>
            <AlertTriangle className={`w-4 h-4 ${lowStockProducts.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-1">
            <span className={`text-lg font-bold font-mono ${lowStockProducts.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {lowStockProducts.length} {lowStockProducts.length === 1 ? 'referencia' : 'referencias'}
            </span>
            <span className="text-[10px] text-slate-400 block">Por debajo del stock mínimo</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              UNIDADES EN TALLER
            </span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {totalUnits} unidades
            </span>
            <span className="text-[10px] text-slate-400 block">{products.length} productos registrados</span>
          </div>
        </Card>
      </div>

      {/* Sección de Alertas Críticas de Reposición */}
      {lowStockProducts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="border-b border-amber-200/80 dark:border-amber-900/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Alertas de Stock Mínimo ({lowStockProducts.length})
              </CardTitle>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Artículos que requieren orden de compra inmediata
              </span>
            </div>
          </CardHeader>
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-md border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[180px]">
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                      {p.sku} • Stock: {p.stock} (Mín: {p.min_stock})
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700 hover:bg-amber-50 text-[11px] shrink-0"
                    onClick={() => openMovementModal(p.id, 'in')}
                  >
                    Reabastecer
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Barra de Búsqueda y Filtros de Kardex */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar movimientos por SKU, producto o motivo..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMovementFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              movementFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setMovementFilter('in')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              movementFilter === 'in'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Entradas (+)
          </button>
          <button
            onClick={() => setMovementFilter('out')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              movementFilter === 'out'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Salidas (-)
          </button>
          <button
            onClick={() => setMovementFilter('adjustment')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              movementFilter === 'adjustment'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Ajustes (~)
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 self-center">
          Total: <span className="font-bold text-slate-900 dark:text-white">{filteredMovements.length}</span> registros
        </div>
      </div>

      {/* Tabla del Kardex */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos de Almacén (Kardex Auditable)</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner size="md" text="Cargando historial de movimientos..." />
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Layers className="w-6 h-6" />}
              title={searchTerm || movementFilter !== 'ALL' ? 'No se encontraron movimientos' : 'Sin movimientos registrados'}
              description={
                searchTerm || movementFilter !== 'ALL'
                  ? 'No existen registros de Kardex con el filtro actual.'
                  : 'Registra la primera entrada o salida de inventario para comenzar la auditoría.'
              }
              actionText={searchTerm || movementFilter !== 'ALL' ? 'Limpiar Filtros' : 'Registrar Movimiento'}
              onAction={
                searchTerm || movementFilter !== 'ALL'
                  ? () => {
                      setSearchTerm('');
                      setMovementFilter('ALL');
                    }
                  : () => openMovementModal()
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Producto / SKU</TableHead>
                <TableHead>Tipo Movimiento</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Stock Anterior</TableHead>
                <TableHead>Stock Resultante</TableHead>
                <TableHead>Motivo / Justificación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((mov) => {
                const isEntry = mov.movement_type === 'in';
                const isExit = mov.movement_type === 'out';
                const isAdjustment = mov.movement_type === 'adjustment';

                return (
                  <TableRow key={mov.id}>
                    <TableCell isMono className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(mov.created_at).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>

                    <TableCell>
                      {mov.product ? (
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                            {mov.product.name}
                          </span>
                          <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                            {mov.product.sku}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">ID: {mov.product_id}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isEntry && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          ENTRADA
                        </span>
                      )}
                      {isExit && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200/80 dark:border-red-800/60">
                          <ArrowUpRight className="w-3 h-3 text-red-600" />
                          SALIDA
                        </span>
                      )}
                      {isAdjustment && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60">
                          <RefreshCw className="w-3 h-3 text-indigo-600" />
                          AJUSTE
                        </span>
                      )}
                    </TableCell>

                    <TableCell isMono className="font-bold text-xs">
                      <span className={isEntry ? 'text-emerald-600' : isExit ? 'text-red-600' : 'text-indigo-600'}>
                        {isEntry ? `+${mov.quantity}` : isExit ? `-${mov.quantity}` : `${mov.quantity}`}
                      </span>
                    </TableCell>

                    <TableCell isMono className="text-slate-500 dark:text-slate-400 text-xs">
                      {mov.previous_stock}
                    </TableCell>

                    <TableCell isMono className="font-bold text-slate-900 dark:text-white text-xs">
                      {mov.new_stock}
                    </TableCell>

                    <TableCell className="max-w-xs truncate text-xs text-slate-700 dark:text-slate-300">
                      {mov.reason}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal para Registrar Movimiento de Kardex */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Movimiento de Inventario (Kardex)"
        description="Registra formalmente compras, entregas de mostrador o ajustes físicos de auditoría."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleRegisterMovement} isLoading={isSubmitting}>
              Confirmar Movimiento
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterMovement} className="space-y-4">
          {formError && (
            <Alert variant="error" title="Atención" onDismiss={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('in')}
                className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  movementType === 'in'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Entrada (+)
              </button>

              <button
                type="button"
                onClick={() => setMovementType('out')}
                className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  movementType === 'out'
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Salida (-)
              </button>

              <button
                type="button"
                onClick={() => setMovementType('adjustment')}
                className={`py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  movementType === 'adjustment'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ajuste (~)
              </button>
            </div>
          </div>

          {/* Selección de Producto */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Producto / Repuesto *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">Selecciona un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}] — Stock actual: {p.stock} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad y Previsualización Matemática */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={movementType === 'adjustment' ? 'Nuevo Stock Físico *' : 'Cantidad a Mover *'}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              isMono
              required
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Cálculo de Kardex Resultante
              </label>
              <div className="h-8 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">
                  {currentModalProduct ? `${currentModalProduct.stock} act.` : '0 act.'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  $\rightarrow$ {projectedStock} result.
                </span>
              </div>
            </div>
          </div>

          {/* Motivo o Justificación */}
          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Motivo o Justificación *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Factura proveedor F-8910, uso en OT-000002, o ajuste conteo físico..."
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
