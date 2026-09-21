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
import { Modal, Button } from '../ui';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInvoice: Invoice) => void;
  prefilledWorkOrder?: WorkOrder | null;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  itemType: 'service' | 'part' | 'product';
}

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
  const [paymentStatus] = useState<InvoicePaymentStatus>('PAID');
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0% o 19%
  const [notes, setNotes] = useState('');
  const [recordInCash, setRecordInCash] = useState(true);

  // Líneas de ítems
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, itemType: 'service' },
  ]);

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
    setSelectedWorkOrderId(order.order_number);
    setSelectedCustomerId(order.customer_id || '');

    const items: InvoiceLineItem[] =
      order.items && order.items.length > 0
        ? order.items.map((it, idx) => ({
            id: `line-${idx}`,
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
  const handleWorkOrderSelect = (orderNum: string) => {
    setSelectedWorkOrderId(orderNum);
    const found = workOrders.find((o) => o.order_number === orderNum);
    if (found) {
      applyWorkOrder(found);
    }
  };

  // Manipular líneas de la factura
  const handleAddLine = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        itemType: 'product',
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

  // Autocompletar ítem desde el catálogo de inventario
  const handleSelectProduct = (id: string, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          description: `${prod.name} (${prod.brand})`,
          unitPrice: prod.sale_price,
          itemType: 'product',
        };
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
        { recordInCash }
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
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Seleccionar Orden OT a Facturar *
              </label>
              <select
                value={selectedWorkOrderId}
                onChange={(e) => handleWorkOrderSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-blue-600"
              >
                <option value="">-- Elige una orden del taller --</option>
                {workOrders.map((o) => (
                  <option key={o.id} value={o.order_number}>
                    {o.order_number} — {o.customer?.full_name} (${o.grand_total.toLocaleString('es-CO')}) [{o.status}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Cliente (Opcional)
                </label>
                <span className="text-[10px] text-slate-500 italic">Venta rápida: dejar en blanco</span>
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                <option value="">👤 Consumidor Final / Venta Rápida (Sin registrar datos)</option>
                {customers.length > 0 && (
                  <optgroup label="Clientes Registrados en el Taller">
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} {c.document_id ? `(CC: ${c.document_id})` : c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* Medio de Pago */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Medio de Pago
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

        {/* Tabla de Líneas de Ítems */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Líneas de Factura (Servicios & Repuestos)
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddLine}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs py-1"
            >
              Agregar Ítem
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {lineItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
              >
                {/* Selector de Producto rápido si es mostrador */}
                {sourceMode === 'counter' && (
                  <div className="col-span-12 sm:col-span-4">
                    <select
                      onChange={(e) => handleSelectProduct(item.id, e.target.value)}
                      className="w-full py-1 px-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px]"
                    >
                      <option value="">-- Catálogo de Inventario --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.sale_price.toLocaleString('es-CO')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Descripción */}
                <div className={sourceMode === 'counter' ? 'col-span-12 sm:col-span-4' : 'col-span-12 sm:col-span-6'}>
                  <input
                    type="text"
                    required
                    placeholder="Descripción del servicio o repuesto"
                    value={item.description}
                    onChange={(e) => handleLineChange(item.id, 'description', e.target.value)}
                    className="w-full py-1 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* Cantidad */}
                <div className="col-span-3 sm:col-span-1">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleLineChange(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                    className="w-full py-1 px-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* Precio Unitario */}
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    placeholder="P. Unit"
                    value={item.unitPrice}
                    onChange={(e) => handleLineChange(item.id, 'unitPrice', Math.max(0, Number(e.target.value)))}
                    className="w-full py-1 px-2 text-right font-mono font-bold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                {/* Subtotal Línea */}
                <div className="col-span-4 sm:col-span-2 text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                  ${(item.quantity * item.unitPrice).toLocaleString('es-CO')}
                </div>

                {/* Botón Borrar */}
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(item.id)}
                    disabled={lineItems.length <= 1}
                    className="p-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose de Totales y Opciones de Cobro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          {/* Opciones de Cobro e Integración con Caja */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={recordInCash}
                onChange={(e) => setRecordInCash(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Registrar automáticamente el ingreso en la Caja Activa</span>
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
