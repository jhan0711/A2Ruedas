import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Wrench,
  ShoppingBag,
  AlertCircle,
  Coins,
  Smartphone,
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItemInsert,
  Customer,
  WorkOrder,
  Product,
  CashPaymentMethod,
  InvoicePaymentStatus,
} from '../../types/database';
import { invoiceService } from '../../services/invoiceService';
import { customerService } from '../../services/customerService';
import { workOrderService } from '../../services/workOrderService';
import { inventoryService } from '../../services/inventoryService';
import { Modal, Button, SearchableSelect } from '../ui';
import { SearchableOption } from '../ui/SearchableSelect';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInvoice: Invoice) => void;
  prefilledWorkOrder?: WorkOrder | null;
}

interface InvoiceLineItem {
  id: string;
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  itemType: 'service' | 'part' | 'product';
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'product';
  badge: string;
  sku?: string;
  stock?: number;
}

const COMMON_WORKSHOP_SERVICES: Array<{ id: string; name: string; price: number }> = [
  { id: 'srv-1', name: 'Mantenimiento General Completo', price: 80000 },
  { id: 'srv-2', name: 'Mantenimiento Básico / Alistamiento', price: 45000 },
  { id: 'srv-3', name: 'Purga de Frenos Hidráulicos (Par)', price: 35000 },
  { id: 'srv-4', name: 'Purga de Freno Hidráulico Individual', price: 20000 },
  { id: 'srv-5', name: 'Mantenimiento Suspensión Delantera', price: 50000 },
  { id: 'srv-6', name: 'Mantenimiento Shock / Suspensión Trasera', price: 60000 },
  { id: 'srv-7', name: 'Ajuste y Sincronización de Cambios', price: 15000 },
  { id: 'srv-8', name: 'Ajuste y Graduación de Frenos', price: 15000 },
  { id: 'srv-9', name: 'Lavado Especializado y Desengrase Pro', price: 25000 },
  { id: 'srv-10', name: 'Centrado y Nivelado de Rin', price: 18000 },
  { id: 'srv-11', name: 'Enllantado y Montaje Tubeless', price: 20000 },
  { id: 'srv-12', name: 'Cambio de Cadena / Instalación', price: 10000 },
  { id: 'srv-13', name: 'Instalación de Pastillas de Freno', price: 10000 },
  { id: 'srv-14', name: 'Mano de Obra Reparación Menor', price: 15000 },
];

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefilledWorkOrder,
}) => {
  const [sourceMode, setSourceMode] = useState<'work_order' | 'counter'>('work_order');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Datos de factura
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<CashPaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>('PAID');
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0% o 19%
  const [notes, setNotes] = useState('');
  const [recordInCash, setRecordInCash] = useState(true);

  // Líneas de ítems
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, itemType: 'service' },
  ]);

  // Búsqueda rápida de catálogo
  const [catalogSearchVal, setCatalogSearchVal] = useState('');
  const [activeSuggestLineId, setActiveSuggestLineId] = useState<string | null>(null);
  const [suggestQuery, setSuggestQuery] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar catálogos
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [custList, orderList, prodList] = await Promise.all([
          customerService.getCustomers(),
          workOrderService.getWorkOrders(),
          inventoryService.getProducts(),
        ]);
        setCustomers(custList);
        setWorkOrders(orderList);
        setProducts(prodList);

        if (prefilledWorkOrder) {
          setSourceMode('work_order');
          applyWorkOrder(prefilledWorkOrder);
        } else {
          // Venta rápida: no obligar cliente, predeterminar Consumidor Final
          setSelectedCustomerId('');
        }
      } catch (err) {
        console.error('Error al cargar datos para facturar:', err);
      }
    };

    loadData();
  }, [isOpen, prefilledWorkOrder]);

  // Aplicar datos de una orden de trabajo seleccionada
  const applyWorkOrder = (order: WorkOrder) => {
    setSelectedWorkOrderId(order.id);
    setSelectedCustomerId(order.customer_id || '');

    const items: InvoiceLineItem[] =
      order.items && order.items.length > 0
        ? order.items.map((it, idx) => ({
            id: `line-${idx}`,
            productId: (it as any).product_id || null,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unit_price,
            itemType: it.item_type === 'service' ? 'service' : 'part',
          }))
        : [
            {
              id: 'line-service',
              description: `Mantenimiento para ${
                order.bicycle ? `${order.bicycle.brand} ${order.bicycle.model}` : 'Bicicleta'
              } (${order.order_number})`,
              quantity: 1,
              unitPrice: order.grand_total,
              itemType: 'service',
            },
          ];

    setLineItems(items);
    setNotes(`Liquidación de la orden de trabajo ${order.order_number}`);
  };

  // Manejar cambio de orden seleccionada en el dropdown
  const handleWorkOrderSelect = (orderId: string) => {
    setSelectedWorkOrderId(orderId);
    const found = workOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (found) {
      applyWorkOrder(found);
    }
  };

  // Catálogo unificado de servicios y repuestos
  const catalogItems: CatalogItem[] = [
    ...COMMON_WORKSHOP_SERVICES.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      type: 'service' as const,
      badge: 'Servicio',
    })),
    ...products.map((p) => ({
      id: `prod-${p.id}`,
      name: `${p.name} ${p.brand ? `(${p.brand})` : ''}`.trim(),
      price: p.sale_price,
      type: 'product' as const,
      sku: p.sku,
      stock: p.stock,
      badge: `Stock: ${p.stock}`,
    })),
  ];

  // Opciones para SearchableSelect unificado
  const catalogSelectOptions: SearchableOption[] = catalogItems.map((item) => ({
    value: item.id,
    label: item.name,
    sublabel: item.sku
      ? `SKU: ${item.sku} • $${item.price.toLocaleString('es-CO')} COP`
      : `$${item.price.toLocaleString('es-CO')} COP`,
    badge: item.badge,
  }));

  // Agregar ítem desde el selector rápido de catálogo
  const handleAddItemFromCatalog = (catalogId: string) => {
    const item = catalogItems.find((c) => c.id === catalogId);
    if (!item) return;

    setLineItems((prev) => {
      if (prev.length === 1 && !prev[0].description.trim() && prev[0].unitPrice === 0) {
        return [
          {
            id: prev[0].id,
            productId: item.sku ? item.id.replace('prod-', '') : null,
            description: item.name,
            quantity: 1,
            unitPrice: item.price,
            itemType: item.type === 'service' ? 'service' : 'product',
          },
        ];
      }
      return [
        ...prev,
        {
          id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: item.sku ? item.id.replace('prod-', '') : null,
          description: item.name,
          quantity: 1,
          unitPrice: item.price,
          itemType: item.type === 'service' ? 'service' : 'product',
        },
      ];
    });
  };

  // Agregar servicio rápido con 1 click
  const handleAddQuickService = (name: string, price: number) => {
    setLineItems((prev) => {
      if (prev.length === 1 && !prev[0].description.trim() && prev[0].unitPrice === 0) {
        return [
          {
            id: prev[0].id,
            productId: null,
            description: name,
            quantity: 1,
            unitPrice: price,
            itemType: 'service',
          },
        ];
      }
      return [
        ...prev,
        {
          id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: null,
          description: name,
          quantity: 1,
          unitPrice: price,
          itemType: 'service',
        },
      ];
    });
  };

  // Aplicar sugerencia a una línea específica
  const applyCatalogItemToLine = (lineId: string, item: CatalogItem) => {
    setLineItems((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        return {
          ...line,
          productId: item.sku ? item.id.replace('prod-', '') : null,
          description: item.name,
          unitPrice: item.price,
          itemType: item.type === 'service' ? 'service' : 'product',
        };
      })
    );
    setActiveSuggestLineId(null);
  };

  // Manipular líneas de la factura
  const handleAddLine = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        itemType: 'service',
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleLineChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Cálculos financieros
  const subtotal = lineItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.unitPrice || 0), 0);
  const validDiscount = Math.min(discount, subtotal);
  const taxableAmount = Math.max(0, subtotal - validDiscount);
  const tax = taxRate > 0 ? Math.round(taxableAmount * (taxRate / 100)) : 0;
  const grandTotal = taxableAmount + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lineItems.some((it) => !it.description.trim() || it.unitPrice < 0 || it.quantity <= 0)) {
      setErrorMessage('Todos los ítems deben tener descripción, cantidad mayor a cero y precio válido.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const customerIdToUse = selectedCustomerId.trim() ? selectedCustomerId.trim() : null;

      const itemsPayload: InvoiceItemInsert[] = lineItems.map((it) => ({
        product_id: it.productId || null,
        description: it.description.trim(),
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.quantity * it.unitPrice,
        item_type: it.itemType,
      }));

      const newInvoice = await invoiceService.createInvoice(
        {
          customer_id: customerIdToUse,
          work_order_id: sourceMode === 'work_order' && selectedWorkOrderId ? selectedWorkOrderId : null,
          subtotal,
          discount: validDiscount,
          tax,
          tax_rate: taxRate,
          total: grandTotal,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          notes: notes.trim() || undefined,
        },
        itemsPayload,
        { recordInCash: paymentStatus === 'PAID' ? recordInCash : false }
      );

      onSuccess(newInvoice);
      onClose();
    } catch (err: any) {
      console.error('Error al crear factura:', err);
      setErrorMessage(err.message || 'Error al emitir la factura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado de sugerencias de autocompletado para la línea activa
  const lineSuggestions =
    activeSuggestLineId && suggestQuery.trim().length >= 1
      ? catalogItems
          .filter(
            (c) =>
              c.name.toLowerCase().includes(suggestQuery.toLowerCase()) ||
              (c.sku && c.sku.toLowerCase().includes(suggestQuery.toLowerCase()))
          )
          .slice(0, 8)
      : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emitir Nueva Factura / Recibo Comercial"
      description="Liquida órdenes de trabajo o registra ventas directas de mostrador con numeración correlativa."
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs">
            <span className="text-slate-500">Total a Facturar: </span>
            <strong className="text-sm font-mono text-blue-600 dark:text-blue-400">
              ${grandTotal.toLocaleString('es-CO')} COP
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              form="create-invoice-form"
              isLoading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-xs"
            >
              Emitir Factura
            </Button>
          </div>
        </div>
      }
    >
      <form id="create-invoice-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Alternador de Modo: Orden de Trabajo vs Venta Mostrador */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSourceMode('work_order')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              sourceMode === 'work_order'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Wrench className="w-4 h-4 text-blue-600" />
            <span>Desde Orden de Trabajo (OT)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSourceMode('counter');
              setSelectedWorkOrderId('');
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              sourceMode === 'counter'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span>Venta Directa de Mostrador</span>
          </button>
        </div>

        {/* Selector Contextual según Modo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {sourceMode === 'work_order' ? (
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Seleccionar Orden OT a Facturar *
              </label>
              <SearchableSelect
                value={selectedWorkOrderId}
                onChange={(val) => handleWorkOrderSelect(val)}
                placeholder="Escribe N° OT o nombre de cliente..."
                options={workOrders.map((o) => ({
                  value: o.id,
                  label: `${o.order_number} — ${o.customer?.full_name || 'Cliente'}`,
                  sublabel: `Total: $${o.grand_total.toLocaleString('es-CO')} • ${o.bicycle_info || 'Bicicleta'}`,
                  badge: o.status,
                }))}
                emptyMessage="No se encontró ninguna orden de trabajo"
                required
              />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Cliente (Opcional)
                </label>
                <span className="text-[10px] text-slate-500 italic">Venta rápida: dejar en blanco</span>
              </div>
              <SearchableSelect
                value={selectedCustomerId}
                onChange={(val) => setSelectedCustomerId(val)}
                placeholder="Consumidor Final (o escribe para buscar cliente)..."
                options={customers.map((c) => ({
                  value: c.id,
                  label: c.full_name,
                  sublabel: `Tel: ${c.phone || c.whatsapp || 'Sin número'}${c.document_id ? ` • Doc: ${c.document_id}` : ''}`,
                }))}
                emptyMessage="No se encontró ningún cliente"
                clearable={true}
              />
            </div>
          )}

          {/* Estado del Pago y Medio de Pago */}
          <div className="space-y-2.5">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Estado del Pago *
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('PAID');
                    setRecordInCash(true);
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentStatus === 'PAID'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pagada (Al contado)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('PENDING');
                    setRecordInCash(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentStatus === 'PENDING'
                      ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pendiente de Pago</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                {paymentStatus === 'PAID' ? 'Medio de Pago' : 'Medio de Pago Acordado'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Coins className="w-3 h-3 text-emerald-600" />
                  <span>Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Smartphone className="w-3 h-3 text-purple-600" />
                  <span>Nequi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 ${
                    paymentMethod === 'CARD'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <CreditCard className="w-3 h-3 text-blue-600" />
                  <span>Datáfono</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Catálogo y Líneas de Factura */}
        <div className="space-y-3">
          {/* Barra de Búsqueda Rápida de Catálogo (Repuestos y Servicios) */}
          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                Buscar y Agregar Repuesto o Servicio del Taller
              </span>
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                {products.length} repuestos • {COMMON_WORKSHOP_SERVICES.length} servicios
              </span>
            </div>

            <SearchableSelect
              value={catalogSearchVal}
              onChange={(val) => {
                if (val) {
                  handleAddItemFromCatalog(val);
                  setCatalogSearchVal('');
                }
              }}
              placeholder="🔍 Escribe o busca aquí para agregar repuesto o servicio..."
              options={catalogSelectOptions}
              emptyMessage="No se encontró ningún repuesto o servicio con ese nombre"
              clearable={true}
            />

            {/* Accesos rápidos de Servicios Populares */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Servicios Rápidos:
              </span>
              {[
                { name: 'Mantenimiento General', price: 80000 },
                { name: 'Ajuste de Frenos', price: 15000 },
                { name: 'Purga Hidráulica', price: 35000 },
                { name: 'Sincronización Cambios', price: 15000 },
                { name: 'Lavado Pro', price: 25000 },
              ].map((srv) => (
                <button
                  type="button"
                  key={srv.name}
                  onClick={() => handleAddQuickService(srv.name, srv.price)}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:border-blue-400 transition-colors"
                >
                  + {srv.name} (${(srv.price / 1000).toFixed(0)}k)
                </button>
              ))}
            </div>
          </div>

          {/* Encabezado de la Tabla de Ítems */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Líneas de Factura ({lineItems.length} {lineItems.length === 1 ? 'ítem' : 'ítems'})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddLine}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs py-1"
            >
              Agregar Ítem en Blanco
            </Button>
          </div>

          {/* Listado de Líneas */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {lineItems.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-2xs space-y-2"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Tipo de Ítem (Toggle Servicio / Repuesto) */}
                  <div className="col-span-12 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleLineChange(item.id, 'itemType', item.itemType === 'service' ? 'product' : 'service')
                      }
                      title={
                        item.itemType === 'service'
                          ? 'Tipo: Servicio (Click para cambiar a Repuesto)'
                          : 'Tipo: Repuesto (Click para cambiar a Servicio)'
                      }
                      className={`w-full py-1.5 px-2 rounded border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        item.itemType === 'service'
                          ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.itemType === 'service' ? (
                        <>
                          <Wrench className="w-3 h-3 text-blue-600" />
                          <span>Servicio</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3 h-3 text-amber-600" />
                          <span>Repuesto</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Input Descripción con Autocompletado Integrado */}
                  <div className="col-span-12 sm:col-span-4 relative">
                    <input
                      type="text"
                      required
                      placeholder="Escribe o busca repuesto o servicio..."
                      value={item.description}
                      onFocus={() => {
                        setActiveSuggestLineId(item.id);
                        setSuggestQuery(item.description);
                      }}
                      onChange={(e) => {
                        handleLineChange(item.id, 'description', e.target.value);
                        setActiveSuggestLineId(item.id);
                        setSuggestQuery(e.target.value);
                      }}
                      className="w-full py-1 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Menú de sugerencias en tiempo real */}
                    {activeSuggestLineId === item.id && lineSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                        {lineSuggestions.map((sug) => (
                          <button
                            key={sug.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              applyCatalogItemToLine(item.id, sug);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {sug.type === 'service' ? (
                                <Wrench className="w-3 h-3 text-blue-600 shrink-0" />
                              ) : (
                                <ShoppingBag className="w-3 h-3 text-amber-600 shrink-0" />
                              )}
                              <div className="truncate">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block truncate">
                                  {sug.name}
                                </span>
                                {sug.sku && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    SKU: {sug.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  sug.type === 'service'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {sug.badge}
                              </span>
                              <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                ${sug.price.toLocaleString('es-CO')}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-3 sm:col-span-2">
                    <div className="flex items-center">
                      <span className="text-[10px] text-slate-400 mr-1 sm:hidden">Cant:</span>
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          handleLineChange(item.id, 'quantity', Math.max(1, Number(e.target.value)))
                        }
                        className="w-full py-1 px-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Precio Unitario */}
                  <div className="col-span-4 sm:col-span-2">
                    <div className="flex items-center">
                      <span className="text-[10px] text-slate-400 mr-1 sm:hidden">P.U:</span>
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        min="0"
                        step="500"
                        required
                        placeholder="P. Unit"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleLineChange(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))
                        }
                        className="w-full py-1 px-2 text-right font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Subtotal Línea */}
                  <div className="col-span-4 sm:col-span-1 text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    ${(item.quantity * item.unitPrice).toLocaleString('es-CO')}
                  </div>

                  {/* Botón Borrar */}
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(item.id)}
                      disabled={lineItems.length <= 1}
                      className="p-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-30"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose de Totales y Opciones de Cobro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          {/* Opciones de Cobro e Integración con Caja */}
          <div className="space-y-2">
            <label
              className={`flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium ${
                paymentStatus === 'PENDING' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={paymentStatus === 'PAID' && recordInCash}
                disabled={paymentStatus === 'PENDING'}
                onChange={(e) => setRecordInCash(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span>
                {paymentStatus === 'PENDING'
                  ? 'No ingresa a caja todavía (se registrará automáticamente al cobrar)'
                  : 'Registrar automáticamente el ingreso en la Caja Activa'}
              </span>
            </label>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-500">
                Notas / Observaciones de la Factura:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Garantía 30 días en ajuste de cambios"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Bloque Numérico de Totales */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">${subtotal.toLocaleString('es-CO')}</span>
            </div>

            {/* Descuento */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">Descuento ($):</span>
              <input
                type="number"
                onFocus={(e) => e.target.select()}
                min="0"
                max={subtotal}
                step="500"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-28 py-0.5 px-2 text-right font-mono font-semibold text-red-600 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            {/* Impuesto IVA */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">IVA Aplicable:</span>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-28 py-0.5 px-2 text-right font-mono font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value={0}>0% (Sin IVA)</option>
                <option value={19}>19% (General)</option>
              </select>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                ${grandTotal.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
