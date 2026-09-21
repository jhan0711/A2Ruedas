import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Search,
  Plus,
  Trash2,
  Eye,
  MessageCircle,
  FileText,
  Calendar,
  RefreshCw,
  X,
  History,
  Printer,
  ClipboardCheck,
  PenTool,
} from 'lucide-react';
import { WorkOrderTicketModal } from '../../components/receipts/WorkOrderTicketModal';
import { WhatsAppComposeModal } from '../../components/whatsapp/WhatsAppComposeModal';
import { workOrderService } from '../../services/workOrderService';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { inventoryService } from '../../services/inventoryService';
import {
  WorkOrder,
  WorkOrderInsert,
  WorkOrderItem,
  WorkOrderStatusHistory,
  Customer,
  Bicycle,
  Product,
  Signature,
} from '../../types/database';
import { WorkOrderStatus } from '../../types';
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
  Badge,
  Modal,
  ConfirmModal,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '../../components/ui';

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'RECIBIDA', label: 'Recibida en Taller' },
  { value: 'DIAGNOSTICO', label: 'En Diagnóstico' },
  { value: 'PRESUPUESTO', label: 'En Presupuesto' },
  { value: 'APROBADA', label: 'Aprobada por Cliente' },
  { value: 'EN_REPARACION', label: 'En Reparación' },
  { value: 'ESPERANDO_REPUESTO', label: 'Espera de Repuestos' },
  { value: 'LISTA', label: 'Lista para Entrega' },
  { value: 'ENTREGADA', label: 'Entregada y Facturada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

export const WorkOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Crear / Editar Orden
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [nextOrderNumber, setNextOrderNumber] = useState('OT-000001');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedBicycleId, setSelectedBicycleId] = useState('');
  const [reportedIssues, setReportedIssues] = useState('');
  const [accessoriesReceived, setAccessoriesReceived] = useState('');
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [internalNotes, setInternalNotes] = useState('');
  const [orderItems, setOrderItems] = useState<
    Omit<WorkOrderItem, 'id' | 'work_order_id' | 'created_at'>[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Sub-formulario para agregar ítems
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQuantity, setProductQuantity] = useState<number>(1);

  // Modal Cambiar Estado
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [orderForStatus, setOrderForStatus] = useState<WorkOrder | null>(null);
  const [newStatus, setNewStatus] = useState<WorkOrderStatus>('EN_REPARACION');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Modal Detalle / Dossier de la OT
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<WorkOrder | null>(null);
  const [orderHistory, setOrderHistory] = useState<WorkOrderStatusHistory[]>([]);
  const [orderSignatures, setOrderSignatures] = useState<Signature[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modal Eliminar Orden
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<WorkOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Imprimir Ticket Térmico
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketOrder, setTicketOrder] = useState<WorkOrder | null>(null);

  // Modal WhatsApp con Auditoría
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappOrder, setWhatsappOrder] = useState<WorkOrder | null>(null);

  const handleOpenWhatsApp = (order: WorkOrder) => {
    setWhatsappOrder(order);
    setWhatsappModalOpen(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ords, custs, bikes, prods, nextNum] = await Promise.all([
        workOrderService.getWorkOrders(),
        customerService.getCustomers(),
        bicycleService.getBicycles(),
        inventoryService.getProducts(),
        workOrderService.getNextOrderNumber(),
      ]);
      setOrders(ords);
      setCustomers(custs);
      setBicycles(bikes);
      setProducts(prods);
      setNextOrderNumber(nextNum);
    } catch (err) {
      console.error('Error al cargar órdenes de trabajo:', err);
      setAlertMessage({ type: 'error', text: 'No se pudieron cargar las órdenes de trabajo.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Bicicletas filtradas por el cliente seleccionado
  const availableBikes = bicycles.filter((b) => b.customer_id === selectedCustomerId);

  const openCreateModal = async () => {
    const nextNum = await workOrderService.getNextOrderNumber();
    setNextOrderNumber(nextNum);
    setSelectedCustomerId(customers.length > 0 ? customers[0].id : '');
    setSelectedBicycleId('');
    setReportedIssues('');
    setAccessoriesReceived('');
    setEstimatedDeliveryAt(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setDiscount(0);
    setInternalNotes('');
    setOrderItems([]);
    setNewServiceDesc('');
    setNewServicePrice(0);
    setSelectedProductId(products.length > 0 ? products[0].id : '');
    setProductQuantity(1);
    setFormErrors({});
    setFormModalOpen(true);
  };

  // Manejo de adición de Mano de Obra
  const handleAddServiceItem = () => {
    if (!newServiceDesc.trim()) return;
    const item: Omit<WorkOrderItem, 'id' | 'work_order_id' | 'created_at'> = {
      item_type: 'service',
      description: newServiceDesc.trim(),
      quantity: 1,
      unit_price: newServicePrice,
      total_price: newServicePrice,
    };
    setOrderItems([...orderItems, item]);
    setNewServiceDesc('');
    setNewServicePrice(0);
  };

  // Manejo de adición de Repuesto de Inventario
  const handleAddPartItem = () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    const qty = Math.max(1, productQuantity);
    const item: Omit<WorkOrderItem, 'id' | 'work_order_id' | 'created_at'> = {
      item_type: 'part',
      product_id: product.id,
      description: `${product.name} [${product.sku}]`,
      quantity: qty,
      unit_price: product.sale_price,
      total_price: product.sale_price * qty,
    };
    setOrderItems([...orderItems, item]);
    setProductQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== index));
  };

  // Cálculos financieros
  const totalLabor = orderItems
    .filter((it) => it.item_type === 'service')
    .reduce((sum, it) => sum + it.total_price, 0);

  const totalParts = orderItems
    .filter((it) => it.item_type === 'part')
    .reduce((sum, it) => sum + it.total_price, 0);

  const grandTotal = Math.max(0, totalLabor + totalParts - discount);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!selectedCustomerId) errors.customer = 'Debes seleccionar un cliente.';
    if (!selectedBicycleId) errors.bicycle = 'Debes seleccionar una bicicleta.';
    if (!reportedIssues.trim()) errors.reportedIssues = 'La falla reportada por el cliente es obligatoria.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const orderPayload: WorkOrderInsert = {
        order_number: nextOrderNumber,
        customer_id: selectedCustomerId,
        bicycle_id: selectedBicycleId,
        status: 'RECIBIDA',
        reported_issues: reportedIssues.trim(),
        accessories_received: accessoriesReceived.trim() || undefined,
        estimated_delivery_at: estimatedDeliveryAt ? new Date(estimatedDeliveryAt).toISOString() : undefined,
        total_labor: totalLabor,
        total_parts: totalParts,
        discount,
        grand_total: grandTotal,
        internal_notes: internalNotes.trim() || undefined,
      };

      await workOrderService.createWorkOrder(orderPayload, orderItems);
      setAlertMessage({
        type: 'success',
        text: `Orden de trabajo ${nextOrderNumber} creada y repuestos descontados del Kardex exitosamente.`,
      });
      setFormModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Error al guardar orden:', err);
      setAlertMessage({ type: 'error', text: err.message || 'No se pudo guardar la orden de trabajo.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Cambio de estado
  const openStatusModal = (order: WorkOrder) => {
    setOrderForStatus(order);
    setNewStatus(order.status);
    setStatusNotes('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForStatus) return;

    setIsUpdatingStatus(true);
    try {
      await workOrderService.updateStatus(orderForStatus.id, newStatus, statusNotes.trim());
      setAlertMessage({
        type: 'success',
        text: `Orden ${orderForStatus.order_number} actualizada a estado "${newStatus}".`,
      });
      setStatusModalOpen(false);
      setOrderForStatus(null);
      loadData();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setAlertMessage({ type: 'error', text: 'No se pudo actualizar el estado de la orden.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Abrir detalle / Dossier
  const openDetailModal = async (order: WorkOrder) => {
    setDetailOrder(order);
    setDetailModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const [history, sigs] = await Promise.all([
        workOrderService.getOrderHistory(order.id),
        workOrderService.getSignatures(order.id),
      ]);
      setOrderHistory(history);
      setOrderSignatures(sigs);
    } catch (err) {
      console.error('Error al cargar historial o firmas de OT:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const openTicketModal = (order: WorkOrder) => {
    setTicketOrder(order);
    setTicketModalOpen(true);
  };

  const confirmDelete = (order: WorkOrder) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await workOrderService.deleteWorkOrder(orderToDelete.id);
      setAlertMessage({
        type: 'success',
        text: `Orden de trabajo ${orderToDelete.order_number} eliminada.`,
      });
      setDeleteModalOpen(false);
      setOrderToDelete(null);
      loadData();
    } catch (err) {
      console.error('Error al eliminar orden:', err);
      setAlertMessage({ type: 'error', text: 'No se pudo eliminar la orden de trabajo.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrado reactivo de órdenes
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase().trim();
    const custName = o.customer?.full_name?.toLowerCase() || '';
    const bikeModel = o.bicycle ? `${o.bicycle.brand} ${o.bicycle.model}`.toLowerCase() : '';
    const orderNum = o.order_number.toLowerCase();
    const issue = o.reported_issues.toLowerCase();

    const matchesSearch =
      !term ||
      orderNum.includes(term) ||
      custName.includes(term) ||
      bikeModel.includes(term) ||
      issue.includes(term);

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Órdenes de Trabajo (OT)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de reparaciones, estados correlativos OT-000001, repuestos de Kardex y mano de obra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/ordenes/nueva">
            <Button size="sm" variant="primary" leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}>
              Recepción con Firma Digital
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={openCreateModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Orden Rápida
          </Button>
        </div>
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

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° OT, cliente, bicicleta o falla reportada..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="w-full sm:w-52">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Todos los estados</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 self-center">
          Total: <span className="font-bold text-slate-900 dark:text-white">{filteredOrders.length}</span> órdenes
        </div>
      </div>

      {/* Tabla de Órdenes de Trabajo */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes del Taller</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner size="md" text="Cargando órdenes de trabajo..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Wrench className="w-6 h-6" />}
              title={searchTerm || statusFilter !== 'ALL' ? 'No se encontraron órdenes' : 'Sin órdenes de trabajo'}
              description={
                searchTerm || statusFilter !== 'ALL'
                  ? 'No hay órdenes de trabajo que coincidan con los filtros aplicados.'
                  : 'Crea tu primera orden para iniciar la recepción, cotización y reparación de bicicletas.'
              }
              actionText={searchTerm || statusFilter !== 'ALL' ? 'Restablecer Filtros' : 'Crear Orden de Trabajo'}
              onAction={
                searchTerm || statusFilter !== 'ALL'
                  ? () => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                    }
                  : openCreateModal
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Orden & Fecha</TableHead>
                <TableHead>Cliente / WhatsApp</TableHead>
                <TableHead>Bicicleta</TableHead>
                <TableHead>Estado Actual</TableHead>
                <TableHead>Falla Reportada</TableHead>
                <TableHead>Gran Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const customer = order.customer;
                const bike = order.bicycle;

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 block">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(order.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs block">
                          {customer?.full_name || 'Sin asignar'}
                        </span>
                        {customer?.phone && (
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp(order)}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
                            title="Enviar actualización por WhatsApp con bitácora"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-500" />
                            <span>{customer.phone}</span>
                          </button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {bike ? (
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-xs block">
                            {bike.brand} {bike.model}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {bike.bike_type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => openStatusModal(order)}
                        className="group flex items-center gap-1.5 cursor-pointer hover:opacity-85 transition-opacity"
                        title="Hacer clic para cambiar estado"
                      >
                        <Badge status={order.status} withDot isMono />
                        <RefreshCw className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </button>
                    </TableCell>

                    <TableCell className="max-w-xs truncate text-xs text-slate-700 dark:text-slate-300">
                      {order.reported_issues}
                    </TableCell>

                    <TableCell isMono className="font-bold text-slate-900 dark:text-white text-xs">
                      ${order.grand_total.toLocaleString('es-CO')}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailModal(order)}
                          title="Ver ficha completa y auditoría"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openStatusModal(order)}
                          title="Cambiar estado de orden"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        {customer?.phone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenWhatsApp(order)}
                            className="text-slate-500 hover:text-emerald-600 transition-colors"
                            title="Enviar actualización a WhatsApp con registro"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openTicketModal(order)}
                          title="Imprimir Comprobante (58 mm)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => confirmDelete(order)}
                          title="Eliminar orden"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal Nueva Orden de Trabajo */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={`Crear Orden de Trabajo: ${nextOrderNumber}`}
        description="Ingresa los datos del cliente, bicicleta, fallas reportadas y desglosa los repuestos y mano de obra."
        maxWidth="xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setFormModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveOrder} isLoading={isSaving}>
              Registrar Orden de Trabajo
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveOrder} className="space-y-4">
          {/* Selección de Cliente y Bicicleta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cliente Propietario *
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedBicycleId('');
                }}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Selecciona cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.phone}
                  </option>
                ))}
              </select>
              {formErrors.customer && (
                <span className="text-[11px] text-red-600 block mt-1">{formErrors.customer}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bicicleta a Intervenir *
              </label>
              <select
                value={selectedBicycleId}
                onChange={(e) => setSelectedBicycleId(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                disabled={!selectedCustomerId}
              >
                <option value="">
                  {!selectedCustomerId
                    ? 'Primero selecciona un cliente...'
                    : availableBikes.length === 0
                    ? 'Este cliente no tiene bicicletas registradas'
                    : 'Selecciona la bicicleta...'}
                </option>
                {availableBikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brand} {b.model} ({b.bike_type}) — Serial: {b.serial_number || 'N/A'}
                  </option>
                ))}
              </select>
              {formErrors.bicycle && (
                <span className="text-[11px] text-red-600 block mt-1">{formErrors.bicycle}</span>
              )}
            </div>
          </div>

          {/* Problemas Reportados y Accesorios */}
          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Problemas Reportados / Solicitud del Cliente *
            </label>
            <textarea
              rows={2}
              value={reportedIssues}
              onChange={(e) => setReportedIssues(e.target.value)}
              placeholder="Describir fallas, ruidos, holguras o servicios solicitados..."
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            {formErrors.reportedIssues && (
              <span className="text-[11px] text-red-600 block">{formErrors.reportedIssues}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Accesorios Recibidos (Luces, velocímetro, bolsa...)"
              value={accessoriesReceived}
              onChange={(e) => setAccessoriesReceived(e.target.value)}
              placeholder="Candado, ciclocomputador, portatermo..."
            />

            <Input
              label="Fecha Estimada de Entrega"
              type="date"
              value={estimatedDeliveryAt}
              onChange={(e) => setEstimatedDeliveryAt(e.target.value)}
            />
          </div>

          {/* Desglose de Repuestos y Mano de Obra */}
          <div className="p-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Desglose de Repuestos e Intervención
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                {orderItems.length} {orderItems.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {/* Selector de agregar Mano de Obra o Repuesto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              {/* Agregar Mano de Obra */}
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  + Agregar Mano de Obra (Servicio)
                </span>
                <input
                  type="text"
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  placeholder="Ej. Ajuste de frenos y purgado"
                  className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newServicePrice || ''}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    placeholder="Precio ($)"
                    className="w-28 text-xs p-1.5 font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <Button size="sm" type="button" variant="outline" onClick={handleAddServiceItem}>
                    Añadir Servicio
                  </Button>
                </div>
              </div>

              {/* Agregar Repuesto de Inventario */}
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  + Agregar Repuesto de Inventario (Kardex)
                </span>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.sale_price.toLocaleString('es-CO')} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(Math.max(1, Number(e.target.value)))}
                    placeholder="Cant."
                    className="w-20 text-xs p-1.5 font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <Button size="sm" type="button" variant="outline" onClick={handleAddPartItem}>
                    Añadir Repuesto
                  </Button>
                </div>
              </div>
            </div>

            {/* Listado de ítems agregados */}
            {orderItems.length === 0 ? (
              <div className="text-center py-3 text-xs text-slate-400 italic">
                Aún no has agregado repuestos ni mano de obra a esta orden.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {orderItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          it.item_type === 'service'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                        }`}
                      >
                        {it.item_type === 'service' ? 'Mano de Obra' : 'Repuesto'}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {it.description}
                      </span>
                      {it.quantity > 1 && (
                        <span className="text-[10px] text-slate-400 font-mono">x{it.quantity}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ${it.total_price.toLocaleString('es-CO')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resumen Financiero y Gran Total */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">MANO DE OBRA</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ${totalLabor.toLocaleString('es-CO')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">REPUESTOS</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  ${totalParts.toLocaleString('es-CO')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">DESCUENTO ($)</span>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-xs p-1 font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">GRAN TOTAL</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ${grandTotal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Cambiar Estado de la Orden */}
      {orderForStatus && (
        <Modal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          title={`Cambiar Estado: ${orderForStatus.order_number}`}
          description="Selecciona la nueva etapa de trabajo y agrega notas técnicas para el historial de auditoría."
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)} disabled={isUpdatingStatus}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleUpdateStatus} isLoading={isUpdatingStatus}>
                Actualizar Estado
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nuevo Estado de la Orden *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 text-left">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Notas u Observaciones del Cambio
              </label>
              <textarea
                rows={2}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Ej. Revisión final aprobada, piezas instaladas, bicicleta en banco..."
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Dossier / Detalle Completo de la OT */}
      {detailOrder && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={`Ficha de Orden: ${detailOrder.order_number}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openTicketModal(detailOrder)}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimir Comprobante (58 mm)
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Cerrar Ficha
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Cabecera y Resumen de Estado */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  {detailOrder.order_number}
                </span>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Ingreso: {new Date(detailOrder.created_at).toLocaleString('es-CO')}
                </div>
              </div>
              <div className="text-right">
                <Badge status={detailOrder.status} withDot isMono size="md" />
              </div>
            </div>

            {/* Propietario y Bicicleta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">CLIENTE PROPIETARIO</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {detailOrder.customer?.full_name}
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-400 block">
                  Tel: {detailOrder.customer?.phone}
                </span>
                {detailOrder.customer?.phone && (
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(detailOrder)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline pt-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Enviar actualización a WhatsApp
                  </button>
                )}
              </div>

              <div className="p-3 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px] block">BICICLETA VINCULADA</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {detailOrder.bicycle?.brand} {detailOrder.bicycle?.model}
                </span>
                <span className="text-slate-500 block">
                  Tipo: {detailOrder.bicycle?.bike_type} • Serial: {detailOrder.bicycle?.serial_number || 'N/A'}
                </span>
              </div>
            </div>

            {/* Falla Reportada */}
            <div className="p-3 rounded-md bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300 uppercase text-[10px] block">
                FALLA REPORTADA POR EL CLIENTE:
              </span>
              <p className="text-slate-800 dark:text-slate-200">{detailOrder.reported_issues}</p>
            </div>

            {/* Accesorios y Custodia */}
            {detailOrder.accessories_received && (
              <div className="p-3 rounded-md bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-1 text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-300 uppercase text-[10px] block">
                  ACCESORIOS RECIBIDOS EN CUSTODIA:
                </span>
                <p className="text-slate-800 dark:text-slate-200">{detailOrder.accessories_received}</p>
              </div>
            )}

            {/* Notas Técnicas / Inspección de Daños Previos */}
            {detailOrder.internal_notes && (
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] block">
                  INSPECCIÓN TÉCNICA Y DAÑOS PREVIOS REGISTRADOS:
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                  {detailOrder.internal_notes}
                </p>
              </div>
            )}

            {/* Desglose de Ítems */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Ítems de la Orden (Repuestos & Servicios)
              </h3>
              <div className="space-y-1.5">
                {detailOrder.items && detailOrder.items.length > 0 ? (
                  detailOrder.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            it.item_type === 'service'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60'
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60'
                          }`}
                        >
                          {it.item_type === 'service' ? 'Mano de Obra' : 'Repuesto'}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {it.description}
                        </span>
                        {it.quantity > 1 && (
                          <span className="text-[10px] text-slate-400 font-mono">x{it.quantity}</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ${it.total_price.toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded">
                    Sin ítems registrados
                  </div>
                )}
              </div>

              {/* Totalizador */}
              <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-between font-mono text-xs">
                <span>TOTAL DE LA ORDEN</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ${detailOrder.grand_total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Firmas Digitales Registradas */}
            {orderSignatures.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  Firmas Digitales de Conformidad ({orderSignatures.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {orderSignatures.map((sig) => (
                    <div
                      key={sig.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                          {sig.signature_type === 'reception'
                            ? 'Firma de Recepción (Ingreso)'
                            : 'Firma de Entrega (Retiro)'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(sig.signed_at).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 flex justify-center">
                        <img
                          src={sig.signature_data}
                          alt={`Firma de ${sig.signer_name}`}
                          className="h-16 object-contain"
                        />
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300">
                        <strong>Firmante:</strong> {sig.signer_name}
                        {sig.signer_doc && (
                          <span className="text-slate-500 font-mono ml-1">
                            (Doc: {sig.signer_doc})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historial de Auditoría de Estados */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-600" />
                Historial de Trazabilidad y Auditoría ({orderHistory.length})
              </h3>
              {isLoadingHistory ? (
                <LoadingSpinner size="sm" text="Consultando historial..." />
              ) : orderHistory.length === 0 ? (
                <div className="text-xs text-slate-400 italic">No hay historial previo registrado.</div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {orderHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-2 rounded bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge status={h.to_status} isMono size="sm" />
                          {h.notes && (
                            <span className="text-[11px] text-slate-700 dark:text-slate-300">
                              {h.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(h.created_at).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Comprobante Térmico Imprimible (58 mm) */}
      <WorkOrderTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        order={ticketOrder}
      />

      {/* Confirmación de Eliminación (Regla 44) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteOrder}
        title="¿Deseas eliminar esta orden de trabajo?"
        message={`Estás a punto de eliminar la orden ${orderToDelete?.order_number}. Esta acción es irreversible.`}
        confirmText="Eliminar Orden"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Modal de Envío de WhatsApp con Bitácora */}
      <WhatsAppComposeModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        customer={whatsappOrder?.customer}
        workOrder={whatsappOrder}
        bicycle={whatsappOrder?.bicycle}
        defaultTrigger={whatsappOrder?.status}
      />
    </div>
  );
};
