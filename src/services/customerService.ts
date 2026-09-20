import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Customer, CustomerInsert, CustomerUpdate } from '../types/database';

const LOCAL_STORAGE_CUSTOMERS = 'a2ruedas_customers_cache';

// Semilla inicial local para resiliencia inmediata
const initialLocalCustomers: Customer[] = [
  {
    id: 'c-001',
    full_name: 'Carlos Mendoza',
    phone: '3104567890',
    whatsapp: '3104567890',
    email: 'carlos.mendoza@email.com',
    document_id: '1020304050',
    address: 'Cra 15 #85-20',
    notes: 'Cliente frecuente. Ruta y MTB.',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'c-002',
    full_name: 'Laura Gómez',
    phone: '3209876543',
    whatsapp: '3209876543',
    email: 'laura.gomez@email.com',
    document_id: '1098765432',
    address: 'Calle 100 #19-40',
    notes: 'Bicicleta Specialized Allez.',
    created_at: new Date('2026-02-15').toISOString(),
    updated_at: new Date('2026-02-15').toISOString(),
  },
];

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
        if (!error && data && data.length > 0) {
          saveLocalCustomers(data);
          return data;
        }
      } catch (err) {
        console.warn('Usando caché local de clientes:', err);
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
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert([customer])
          .select()
          .single();
        if (!error && data) {
          const list = getLocalCustomers();
          saveLocalCustomers([data, ...list]);
          return data;
        }
      } catch (err) {
        console.warn('Error al guardar cliente en Supabase, persistiendo en caché local:', err);
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
      try {
        const { data, error } = await supabase
          .from('customers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          const list = getLocalCustomers().map((c) => (c.id === id ? data : c));
          saveLocalCustomers(list);
          return data;
        }
      } catch (err) {
        console.warn('Error al actualizar en Supabase:', err);
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
      try {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (!error) {
          const list = getLocalCustomers().filter((c) => c.id !== id);
          saveLocalCustomers(list);
          return true;
        }
      } catch (err) {
        console.warn('Error al eliminar en Supabase:', err);
      }
    }

    const list = getLocalCustomers().filter((c) => c.id !== id);
    saveLocalCustomers(list);
    return true;
  },
};
