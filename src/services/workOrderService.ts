import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WorkOrder, WorkOrderInsert, WorkOrderItem, WorkOrderStatusHistory, Signature } from '../types/database';
import { WorkOrderStatus } from '../types';

const LOCAL_STORAGE_ORDERS = 'a2ruedas_orders_cache';
const LOCAL_STORAGE_HISTORY = 'a2ruedas_order_history_cache';
const LOCAL_STORAGE_SIGNATURES = 'a2ruedas_signatures_cache';

const initialOrders: WorkOrder[] = [
  {
    id: 'wo-001',
    order_number: 'OT-000104',
    customer_id: 'c-001',
    bicycle_id: 'b-001',
    status: 'EN_REPARACION',
    reported_issues: 'Cambios saltan al pedalear en subida. Ruido metálico en el tensor trasero.',
    accessories_received: 'Ciclocomputador Cateye, soporte para termo',
    entry_mileage_km: 1250,
    estimated_delivery_at: new Date(Date.now() + 86400000).toISOString(),
    total_labor: 55000,
    total_parts: 85000,
    discount: 20000,
    grand_total: 120000,
    internal_notes: 'Dientes de piñón desgastados. Se cotizó cambio de cadena.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wo-002',
    order_number: 'OT-000103',
    customer_id: 'c-002',
    bicycle_id: 'b-002',
    status: 'DIAGNOSTICO',
    reported_issues: 'Freno delantero esponjoso. Maneta llega hasta el manubrio.',
    accessories_received: 'Bolsa de sillín',
    total_labor: 45000,
    total_parts: 20000,
    discount: 0,
    grand_total: 65000,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

function getLocalOrders(): WorkOrder[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_ORDERS);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(initialOrders));
    return initialOrders;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return initialOrders;
  }
}

function saveLocalOrders(list: WorkOrder[]) {
  localStorage.setItem(LOCAL_STORAGE_ORDERS, JSON.stringify(list));
}

export const workOrderService = {
  async getWorkOrders(status?: WorkOrderStatus): Promise<WorkOrder[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('work_orders')
          .select('*, customer:customers(*), bicycle:bicycles(*), items:work_order_items(*)')
          .order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          saveLocalOrders(data);
          return data;
        }
      } catch (err) {
        console.warn('Usando órdenes de trabajo locales:', err);
      }
    }

    const local = getLocalOrders();
    if (!status) return local;
    return local.filter((o) => o.status === status);
  },

  async getWorkOrderById(id: string): Promise<WorkOrder | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*, customer:customers(*), bicycle:bicycles(*), items:work_order_items(*)')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al obtener OT en Supabase:', err);
      }
    }
    const local = getLocalOrders();
    return local.find((o) => o.id === id) || null;
  },

  async getNextOrderNumber(): Promise<string> {
    const orders = getLocalOrders();
    const nextNum = orders.length + 105;
    return `OT-${String(nextNum).padStart(6, '0')}`;
  },

  async createWorkOrder(order: WorkOrderInsert, items: Omit<WorkOrderItem, 'id' | 'work_order_id' | 'created_at'>[]): Promise<WorkOrder> {
    const now = new Date().toISOString();
    const orderId = crypto.randomUUID ? crypto.randomUUID() : `wo-${Date.now()}`;
    const orderNumber = order.order_number || (await this.getNextOrderNumber());

    const createdItems: WorkOrderItem[] = items.map((it, idx) => ({
      ...it,
      id: `woi-${Date.now()}-${idx}`,
      work_order_id: orderId,
      created_at: now,
    }));

    const newOrder: WorkOrder = {
      ...order,
      id: orderId,
      order_number: orderNumber,
      items: createdItems,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('work_orders').insert([order]).select().single();
        if (!error && data) {
          if (items.length > 0) {
            const itemsToInsert = items.map((it) => ({ ...it, work_order_id: data.id }));
            await supabase.from('work_order_items').insert(itemsToInsert);
          }
          const list = getLocalOrders();
          saveLocalOrders([newOrder, ...list]);
          return newOrder;
        }
      } catch (err) {
        console.warn('Error al guardar OT en Supabase:', err);
      }
    }

    const list = getLocalOrders();
    saveLocalOrders([newOrder, ...list]);
    return newOrder;
  },

  async updateStatus(
    orderId: string,
    newStatus: WorkOrderStatus,
    notes?: string,
    userId?: string,
  ): Promise<WorkOrder> {
    const list = getLocalOrders();
    const index = list.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error('Orden de trabajo no encontrada');

    const previousStatus = list[index].status;
    const now = new Date().toISOString();

    const historyEntry: WorkOrderStatusHistory = {
      id: crypto.randomUUID ? crypto.randomUUID() : `woh-${Date.now()}`,
      work_order_id: orderId,
      from_status: previousStatus,
      to_status: newStatus,
      user_id: userId || null,
      notes: notes || null,
      created_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('work_orders').update({ status: newStatus, updated_at: now }).eq('id', orderId);
        await supabase.from('work_order_status_history').insert([historyEntry]);
      } catch (err) {
        console.warn('Error al actualizar estado en Supabase:', err);
      }
    }

    list[index].status = newStatus;
    list[index].updated_at = now;
    saveLocalOrders(list);

    const history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY) || '[]');
    localStorage.setItem(LOCAL_STORAGE_HISTORY, JSON.stringify([historyEntry, ...history]));

    return list[index];
  },

  async saveSignature(
    workOrderId: string,
    type: 'reception' | 'delivery',
    signatureData: string,
    signerName: string,
    signerDoc?: string,
  ): Promise<Signature> {
    const signature: Signature = {
      id: crypto.randomUUID ? crypto.randomUUID() : `sig-${Date.now()}`,
      work_order_id: workOrderId,
      signature_type: type,
      signature_data: signatureData,
      signer_name: signerName,
      signer_doc: signerDoc || null,
      signed_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('signatures').insert([signature]);
      } catch (err) {
        console.warn('Error al guardar firma en Supabase:', err);
      }
    }

    const signatures = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SIGNATURES) || '[]');
    localStorage.setItem(LOCAL_STORAGE_SIGNATURES, JSON.stringify([signature, ...signatures]));

    return signature;
  },
};
