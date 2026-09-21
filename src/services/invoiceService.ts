import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Invoice,
  InvoiceInsert,
  InvoiceItem,
  InvoiceItemInsert,
  CashPaymentMethod,
  WorkOrder,
} from '../types/database';
import { customerService } from './customerService';
import { cashService } from './cashService';

const LOCAL_STORAGE_INVOICES = 'a2ruedas_invoices_v1';
const LOCAL_STORAGE_INVOICE_ITEMS = 'a2ruedas_invoice_items_v1';
const LOCAL_STORAGE_INITIALIZED = 'a2ruedas_invoices_initialized_v1';

/**
 * Inicializa facturas demostrativas para primera carga
 */
function initializeDemoInvoices(): void {
  if (localStorage.getItem(LOCAL_STORAGE_INITIALIZED)) return;

  const demoInvoices: Invoice[] = [
    {
      id: 'fac-001',
      invoice_number: 'FAC-000001',
      customer_id: 'cust-1',
      work_order_id: 'OT-000001',
      subtotal: 110000,
      discount: 0,
      tax: 0,
      tax_rate: 0,
      total: 110000,
      payment_method: 'CASH',
      payment_status: 'PAID',
      issued_by: 'Administrador / Jefe de Taller',
      created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      notes: 'Mantenimiento preventivo general y cambio de pastillas.',
      customer: {
        id: 'cust-1',
        full_name: 'Ana María Gómez',
        phone: '3101112233',
        document_id: '1020304050',
        email: 'anamaria@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    {
      id: 'fac-002',
      invoice_number: 'FAC-000002',
      customer_id: 'cust-2',
      work_order_id: null,
      subtotal: 73000,
      discount: 3000,
      tax: 0,
      tax_rate: 0,
      total: 70000,
      payment_method: 'TRANSFER',
      payment_status: 'PAID',
      issued_by: 'Administrador / Jefe de Taller',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      notes: 'Venta rápida de mostrador. Descuento comercial por pago en Nequi.',
      customer: {
        id: 'cust-2',
        full_name: 'Carlos Andrés Pérez',
        phone: '3204445566',
        document_id: '1098765432',
        email: 'carlos@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  ];

  const demoItems: InvoiceItem[] = [
    {
      id: 'item-001',
      invoice_id: 'fac-001',
      description: 'Mantenimiento General Completo (Desarme, lavado y engrase)',
      quantity: 1,
      unit_price: 75000,
      total_price: 75000,
      item_type: 'service',
    },
    {
      id: 'item-002',
      invoice_id: 'fac-001',
      description: 'Pastillas de Freno Shimano B05S Resina (Par)',
      quantity: 1,
      unit_price: 35000,
      total_price: 35000,
      item_type: 'part',
    },
    {
      id: 'item-003',
      invoice_id: 'fac-002',
      description: 'Lubricante Seco para Cadena Squirt Lube 120ml',
      quantity: 1,
      unit_price: 45000,
      total_price: 45000,
      item_type: 'product',
    },
    {
      id: 'item-004',
      invoice_id: 'fac-002',
      description: 'Neumático Chaoyang 29 x 2.10 Válvula Presta 48mm',
      quantity: 1,
      unit_price: 28000,
      total_price: 28000,
      item_type: 'part',
    },
  ];

  localStorage.setItem(LOCAL_STORAGE_INVOICES, JSON.stringify(demoInvoices));
  localStorage.setItem(LOCAL_STORAGE_INVOICE_ITEMS, JSON.stringify(demoItems));
  localStorage.setItem(LOCAL_STORAGE_INITIALIZED, 'true');
}

export const invoiceService = {
  /**
   * Calcula el próximo número correlativo con formato FAC-000001
   */
  async getNextInvoiceNumber(): Promise<string> {
    initializeDemoInvoices();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('invoice_number')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.invoice_number) {
          const match = data.invoice_number.match(/^FAC-(\d+)$/);
          if (match) {
            const nextNum = parseInt(match[1], 10) + 1;
            return `FAC-${String(nextNum).padStart(6, '0')}`;
          }
        }
      } catch (err) {
        console.warn('Error al obtener consecutivo de factura en Supabase:', err);
      }
    }

    const localInvoices: Invoice[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_INVOICES) || '[]'
    );
    if (localInvoices.length === 0) return 'FAC-000001';

    let maxNum = 0;
    localInvoices.forEach((inv) => {
      const match = inv.invoice_number.match(/^FAC-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    return `FAC-${String(maxNum + 1).padStart(6, '0')}`;
  },

  /**
   * Obtiene la lista de facturas con filtros y datos de clientes hidratados
   */
  async getInvoices(filters?: {
    customerId?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    searchTerm?: string;
  }): Promise<Invoice[]> {
    initializeDemoInvoices();

    let invoices: Invoice[] = [];

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('invoices')
          .select('*, customer:customers(*), items:invoice_items(*)')
          .order('created_at', { ascending: false });

        if (filters?.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
        if (filters?.paymentStatus && filters.paymentStatus !== 'ALL') {
          query = query.eq('payment_status', filters.paymentStatus);
        }
        if (filters?.paymentMethod && filters.paymentMethod !== 'ALL') {
          query = query.eq('payment_method', filters.paymentMethod);
        }

        const { data, error } = await query;
        if (!error && data) invoices = data as Invoice[];
      } catch (err) {
        console.warn('Error al consultar facturas en Supabase:', err);
      }
    }

    if (invoices.length === 0) {
      const local: Invoice[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_INVOICES) || '[]'
      );
      const allItems: InvoiceItem[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_INVOICE_ITEMS) || '[]'
      );
      const customers = await customerService.getCustomers();

      invoices = local.map((inv) => {
        const cust = customers.find((c) => c.id === inv.customer_id) || inv.customer;
        const items = allItems.filter((it) => it.invoice_id === inv.id);
        return {
          ...inv,
          customer: cust,
          items,
        };
      });
    }

    // Filtrado reactivo en memoria
    return invoices.filter((inv) => {
      if (filters?.customerId && inv.customer_id !== filters.customerId) return false;
      if (filters?.paymentStatus && filters.paymentStatus !== 'ALL' && inv.payment_status !== filters.paymentStatus) return false;
      if (filters?.paymentMethod && filters.paymentMethod !== 'ALL' && inv.payment_method !== filters.paymentMethod) return false;

      if (!filters?.searchTerm?.trim()) return true;

      const term = filters.searchTerm.toLowerCase().trim();
      const matchNum = inv.invoice_number.toLowerCase().includes(term);
      const matchCust = inv.customer?.full_name.toLowerCase().includes(term) || false;
      const matchDoc = inv.customer?.document_id?.toLowerCase().includes(term) || false;
      const matchOT = inv.work_order_id?.toLowerCase().includes(term) || false;
      const matchNotes = inv.notes?.toLowerCase().includes(term) || false;

      return matchNum || matchCust || matchDoc || matchOT || matchNotes;
    });
  },

  /**
   * Obtiene una factura individual por su ID con sus líneas de detalle
   */
  async getInvoiceById(id: string): Promise<Invoice | null> {
    const list = await this.getInvoices();
    return list.find((i) => i.id === id) || null;
  },

  /**
   * Emite una nueva factura comercial con sus líneas de detalle
   */
  async createInvoice(
    payload: InvoiceInsert,
    items: InvoiceItemInsert[],
    options?: { recordInCash?: boolean }
  ): Promise<Invoice> {
    if (items.length === 0) {
      throw new Error('La factura debe contener al menos un ítem o servicio.');
    }
    if (payload.total < 0) {
      throw new Error('El total de la factura no puede ser negativo.');
    }

    const invoiceNumber = payload.invoice_number || (await this.getNextInvoiceNumber());
    const invoiceId = crypto.randomUUID ? crypto.randomUUID() : `fac-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const newInvoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      customer_id: payload.customer_id,
      work_order_id: payload.work_order_id || null,
      subtotal: payload.subtotal,
      discount: payload.discount || 0,
      tax: payload.tax || 0,
      tax_rate: payload.tax_rate || 0,
      total: payload.total,
      payment_method: payload.payment_method,
      payment_status: payload.payment_status,
      issued_by: payload.issued_by || 'Administrador / Jefe de Taller',
      created_at: createdAt,
      notes: payload.notes?.trim() || null,
    };

    const newItems: InvoiceItem[] = items.map((it, idx) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${idx}`,
      invoice_id: invoiceId,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price,
      item_type: it.item_type || 'service',
    }));

    if (isSupabaseConfigured) {
      try {
        const { data: dbInvoice, error: invError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: newInvoice.invoice_number,
            customer_id: newInvoice.customer_id,
            work_order_id: newInvoice.work_order_id,
            subtotal: newInvoice.subtotal,
            discount: newInvoice.discount,
            tax: newInvoice.tax,
            total: newInvoice.total,
            payment_method: newInvoice.payment_method,
            payment_status: newInvoice.payment_status,
            issued_by: newInvoice.issued_by,
          })
          .select()
          .single();

        if (!invError && dbInvoice) {
          newInvoice.id = dbInvoice.id;
          newInvoice.created_at = dbInvoice.created_at;

          const itemsToInsert = newItems.map((it) => ({
            invoice_id: dbInvoice.id,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total_price: it.total_price,
          }));

          await supabase.from('invoice_items').insert(itemsToInsert);
        }
      } catch (err) {
        console.warn('Error al guardar factura en Supabase:', err);
      }
    }

    // Persistencia local
    const localInvoices: Invoice[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_INVOICES) || '[]'
    );
    localInvoices.unshift(newInvoice);
    localStorage.setItem(LOCAL_STORAGE_INVOICES, JSON.stringify(localInvoices));

    const localItems: InvoiceItem[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_INVOICE_ITEMS) || '[]'
    );
    localStorage.setItem(LOCAL_STORAGE_INVOICE_ITEMS, JSON.stringify([...newItems, ...localItems]));

    // Sincronización automática con la Caja activa (Fase 15)
    if (options?.recordInCash && newInvoice.payment_status === 'PAID') {
      try {
        const activeReg = await cashService.getActiveRegister();
        if (activeReg) {
          await cashService.recordMovement({
            type: 'INCOME',
            concept: `Cobro Factura ${newInvoice.invoice_number}${
              newInvoice.work_order_id ? ` (OT: ${newInvoice.work_order_id})` : ''
            }`,
            amount: newInvoice.total,
            paymentMethod: (newInvoice.payment_method as CashPaymentMethod) || 'CASH',
            category: newInvoice.work_order_id ? 'ORDER_PAYMENT' : 'COUNTER_SALE',
            userId: newInvoice.issued_by,
            referenceType: 'INVOICE',
            referenceId: newInvoice.invoice_number,
            notes: `Emisión automática desde facturación. Ítems: ${items.length}`,
          });
        }
      } catch (err) {
        console.warn('No se pudo asentar el ingreso en caja (caja cerrada o error):', err);
      }
    }

    // Hidratar cliente para retornar objeto completo
    const cust = (await customerService.getCustomers()).find((c) => c.id === newInvoice.customer_id);
    newInvoice.customer = cust;
    newInvoice.items = newItems;

    return newInvoice;
  },

  /**
   * Genera una factura automáticamente a partir de una Orden de Trabajo (OT)
   */
  async createInvoiceFromWorkOrder(
    workOrder: WorkOrder,
    paymentMethod: CashPaymentMethod,
    discount: number = 0,
    notes?: string
  ): Promise<Invoice> {
    const rawItems = workOrder.items || [];
    let invoiceItems: InvoiceItemInsert[] = [];

    if (rawItems.length > 0) {
      invoiceItems = rawItems.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        item_type: it.item_type,
      }));
    } else {
      // Si la orden no tiene desglose de ítems, usar el total general como servicio
      invoiceItems = [
        {
          description: `Servicio de Mantenimiento / Reparación para ${
            workOrder.bicycle ? `${workOrder.bicycle.brand} ${workOrder.bicycle.model}` : 'Bicicleta'
          }`,
          quantity: 1,
          unit_price: workOrder.grand_total,
          total_price: workOrder.grand_total,
          item_type: 'service',
        },
      ];
    }

    const subtotal = invoiceItems.reduce((acc, it) => acc + it.total_price, 0);
    const validDiscount = Math.min(discount, subtotal);
    const total = Math.max(0, subtotal - validDiscount);

    return this.createInvoice(
      {
        customer_id: workOrder.customer_id,
        work_order_id: workOrder.order_number || workOrder.id,
        subtotal,
        discount: validDiscount,
        tax: 0,
        tax_rate: 0,
        total,
        payment_method: paymentMethod,
        payment_status: 'PAID',
        notes: notes || `Liquidación de orden ${workOrder.order_number}`,
      },
      invoiceItems,
      { recordInCash: true }
    );
  },

  /**
   * Anulación formal de una factura con motivo registrado
   */
  async cancelInvoice(invoiceId: string, reason: string): Promise<Invoice> {
    if (!reason.trim()) {
      throw new Error('Es obligatorio indicar el motivo de la anulación.');
    }

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'CANCELLED',
          })
          .eq('id', invoiceId);
      } catch (err) {
        console.warn('Error al anular factura en Supabase:', err);
      }
    }

    const localInvoices: Invoice[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_INVOICES) || '[]'
    );
    const target = localInvoices.find((i) => i.id === invoiceId);
    if (!target) throw new Error('Factura no encontrada.');

    target.payment_status = 'CANCELLED';
    target.cancel_reason = reason.trim();
    localStorage.setItem(LOCAL_STORAGE_INVOICES, JSON.stringify(localInvoices));

    return target;
  },

  /**
   * Métricas y KPIs consolidados de facturación
   */
  async getInvoiceStats(): Promise<{
    totalInvoiced: number;
    invoicesCount: number;
    averageTicket: number;
    pendingCount: number;
    pendingAmount: number;
  }> {
    const list = await this.getInvoices();
    const paidInvoices = list.filter((i) => i.payment_status === 'PAID');
    const pendingInvoices = list.filter((i) => i.payment_status === 'PENDING');

    const totalInvoiced = paidInvoices.reduce((sum, i) => sum + i.total, 0);
    const invoicesCount = paidInvoices.length;
    const averageTicket = invoicesCount > 0 ? Math.round(totalInvoiced / invoicesCount) : 0;
    const pendingCount = pendingInvoices.length;
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);

    return {
      totalInvoiced,
      invoicesCount,
      averageTicket,
      pendingCount,
      pendingAmount,
    };
  },
};
