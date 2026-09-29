import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Customer, CustomerInsert, CustomerUpdate } from '../types/database';

const LOCAL_STORAGE_CUSTOMERS = 'a2ruedas_customers_cache';

// Base de datos limpia de clientes para producción
const initialLocalCustomers: Customer[] = [];

function getLocalCustomers(): Customer[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_CUSTOMERS);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(initialLocalCustomers));
    return initialLocalCustomers;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return initialLocalCustomers;
  }
}

function saveLocalCustomers(list: Customer[]) {
  localStorage.setItem(LOCAL_STORAGE_CUSTOMERS, JSON.stringify(list));
}

export const customerService = {
  async getCustomers(searchTerm?: string): Promise<Customer[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('customers').select('*').order('full_name', { ascending: true });
        if (searchTerm) {
          query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
        }
        const { data, error } = await query;
        if (!error && data) {
          saveLocalCustomers(data);
          return data;
        }
        if (error) {
          console.warn('Error al consultar clientes en Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Error inesperado al consultar clientes en Supabase:', err);
      }
    }

    const local = getLocalCustomers();
    if (!searchTerm) return local;
    const term = searchTerm.toLowerCase();
    return local.filter(
      (c) => c.full_name.toLowerCase().includes(term) || c.phone.includes(term),
    );
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al obtener cliente en Supabase:', err);
      }
    }
    const local = getLocalCustomers();
    return local.find((c) => c.id === id) || null;
  },

  async createCustomer(customer: CustomerInsert): Promise<Customer> {
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID ? crypto.randomUUID() : `cust-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      const dbPayload = {
        full_name: customer.full_name.trim(),
        phone: customer.phone.trim(),
        whatsapp: customer.whatsapp?.trim() || null,
        email: customer.email?.trim() || null,
        document_id: customer.document_id?.trim() || null,
        address: customer.address?.trim() || null,
        notes: customer.notes?.trim() || null,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([dbPayload])
        .select()
        .single();
      if (error) {
        console.error('Error al guardar cliente en Supabase:', error);
        throw new Error(`Error en base de datos: ${error.message}`);
      }
      if (data) {
        const list = getLocalCustomers();
        saveLocalCustomers([data, ...list]);
        return data;
      }
    }

    const list = getLocalCustomers();
    const updatedList = [newCustomer, ...list];
    saveLocalCustomers(updatedList);
    return newCustomer;
  },

  async updateCustomer(id: string, updates: CustomerUpdate): Promise<Customer> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      const dbUpdates: Record<string, any> = {};
      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name.trim();
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone.trim();
      if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp?.trim() || null;
      if (updates.email !== undefined) dbUpdates.email = updates.email?.trim() || null;
      if (updates.document_id !== undefined) dbUpdates.document_id = updates.document_id?.trim() || null;
      if (updates.address !== undefined) dbUpdates.address = updates.address?.trim() || null;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes?.trim() || null;

      const { data, error } = await supabase
        .from('customers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Error al actualizar cliente en Supabase:', error);
        throw new Error(`Error en base de datos: ${error.message}`);
      }
      if (data) {
        const list = getLocalCustomers().map((c) => (c.id === id ? data : c));
        saveLocalCustomers(list);
        return data;
      }
    }

    const list = getLocalCustomers();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Cliente no encontrado');
    const updated: Customer = { ...list[index], ...updates, updated_at: now };
    list[index] = updated;
    saveLocalCustomers(list);
    return updated;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar cliente en Supabase:', error);
        throw new Error(`Error en base de datos: ${error.message}`);
      }
      const list = getLocalCustomers().filter((c) => c.id !== id);
      saveLocalCustomers(list);
      return true;
    }

    const list = getLocalCustomers().filter((c) => c.id !== id);
    saveLocalCustomers(list);
    return true;
  },
};
