import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { WorkOrder, WorkOrderInsert, WorkOrderItem, WorkOrderStatusHistory, Signature } from '../types/database';
import { WorkOrderStatus } from '../types';
import { customerService } from './customerService';
import { bicycleService } from './bicycleService';
import { inventoryService } from './inventoryService';

const LOCAL_STORAGE_ORDERS = 'a2ruedas_orders_cache';
const LOCAL_STORAGE_HISTORY = 'a2ruedas_order_history_cache';
const LOCAL_STORAGE_SIGNATURES = 'a2ruedas_signatures_cache';

// Base de datos limpia de órdenes de trabajo e historial para producción
const initialOrders: WorkOrder[] = [];
const initialHistory: WorkOrderStatusHistory[] = [];

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

function getLocalHistory(): WorkOrderStatusHistory[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_HISTORY);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_HISTORY, JSON.stringify(initialHistory));
    return initialHistory;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return initialHistory;
  }
}

function saveLocalHistory(list: WorkOrderStatusHistory[]) {
  localStorage.setItem(LOCAL_STORAGE_HISTORY, JSON.stringify(list));
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
    const [customers, bicycles] = await Promise.all([
      customerService.getCustomers(),
      bicycleService.getBicycles(),
    ]);

    const custMap = new Map(customers.map((c) => [c.id, c]));
    const bikeMap = new Map(bicycles.map((b) => [b.id, b]));

    const populated = local.map((order) => ({
      ...order,
      customer: order.customer || custMap.get(order.customer_id),
      bicycle: order.bicycle || bikeMap.get(order.bicycle_id),
    }));

    if (!status) return populated;
    return populated.filter((o) => o.status === status);
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
    const list = await this.getWorkOrders();
    return list.find((o) => o.id === id) || null;
  },

  async getWorkOrdersByBicycleId(bicycleId: string): Promise<WorkOrder[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('work_orders')
          .select('*, customer:customers(*), bicycle:bicycles(*), items:work_order_items(*)')
          .eq('bicycle_id', bicycleId)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al obtener OTs por bicicleta en Supabase:', err);
      }
    }
    const list = await this.getWorkOrders();
    return list
      .filter((o) => o.bicycle_id === bicycleId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getNextOrderNumber(): Promise<string> {
    const orders = getLocalOrders();
    let maxNum = 0;
    for (const o of orders) {
      const match = o.order_number.match(/^OT-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum > 0 ? maxNum + 1 : 1;
    return `OT-${String(nextNum).padStart(6, '0')}`;
  },

  async createWorkOrder(
    order: WorkOrderInsert,
    items: Omit<WorkOrderItem, 'id' | 'work_order_id' | 'created_at'>[],
  ): Promise<WorkOrder> {
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

    // Descontar del Kardex de inventario los repuestos utilizados
    for (const item of items) {
      if (item.item_type === 'part' && item.product_id) {
        try {
          await inventoryService.adjustStock(
            item.product_id,
            item.quantity,
            'out',
            `Instalación en orden ${orderNumber}`,
          );
        } catch (err) {
          console.warn(`No se pudo descontar automáticamente el producto ${item.product_id}:`, err);
        }
      }
    }

    // Registrar historial de estado inicial
    const initialHistoryEntry: WorkOrderStatusHistory = {
      id: crypto.randomUUID ? crypto.randomUUID() : `woh-${Date.now()}`,
      work_order_id: orderId,
      from_status: null,
      to_status: order.status || 'RECIBIDA',
      notes: 'Creación y recepción de la orden de trabajo en el taller',
      created_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('work_orders').insert([order]).select().single();
        if (!error && data) {
          if (items.length > 0) {
            const itemsToInsert = items.map((it) => ({ ...it, work_order_id: data.id }));
            await supabase.from('work_order_items').insert(itemsToInsert);
          }
          await supabase.from('work_order_status_history').insert([initialHistoryEntry]);
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

    const history = getLocalHistory();
    saveLocalHistory([initialHistoryEntry, ...history]);

    return newOrder;
  },

  async updateWorkOrder(
    id: string,
    updates: Partial<WorkOrderInsert>,
    newItems?: Omit<WorkOrderItem, 'id' | 'work_order_id' | 'created_at'>[],
  ): Promise<WorkOrder> {
    const list = getLocalOrders();
    const index = list.findIndex((o) => o.id === id);
    if (index === -1) throw new Error('Orden de trabajo no encontrada');

    const now = new Date().toISOString();
    const existing = list[index];

    let items = existing.items;
    if (newItems) {
      items = newItems.map((it, idx) => ({
        ...it,
        id: `woi-${Date.now()}-${idx}`,
        work_order_id: id,
        created_at: now,
      }));
    }

    const updated: WorkOrder = {
      ...existing,
      ...updates,
      items,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('work_orders').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Error al actualizar OT en Supabase:', err);
      }
    }

    list[index] = updated;
    saveLocalOrders(list);
    return updated;
  },

  async deleteWorkOrder(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('work_orders').delete().eq('id', id);
      } catch (err) {
        console.warn('Error al eliminar OT en Supabase:', err);
      }
    }

    const list = getLocalOrders().filter((o) => o.id !== id);
    saveLocalOrders(list);
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

    const history = getLocalHistory();
    saveLocalHistory([historyEntry, ...history]);

    return list[index];
  },

  async getOrderHistory(workOrderId: string): Promise<WorkOrderStatusHistory[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('work_order_status_history')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al consultar historial de estados en Supabase:', err);
      }
    }

    const history = getLocalHistory();
    return history.filter((h) => h.work_order_id === workOrderId);
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

  async getSignatures(workOrderId: string): Promise<Signature[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('signatures')
          .select('*')
          .eq('work_order_id', workOrderId)
          .order('signed_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al consultar firmas en Supabase:', err);
      }
    }

    const signatures: Signature[] = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_SIGNATURES) || '[]'
    );
    return signatures.filter((s) => s.work_order_id === workOrderId);
  },
};
