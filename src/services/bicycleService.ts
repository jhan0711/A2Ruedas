import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Bicycle, BicycleInsert, BicycleUpdate, BikeQRCode } from '../types/database';

const LOCAL_STORAGE_BIKES = 'a2ruedas_bicycles_cache';
const LOCAL_STORAGE_QRS = 'a2ruedas_qrs_cache';

const initialLocalBikes: Bicycle[] = [
  {
    id: 'b-001',
    customer_id: 'c-001',
    brand: 'Trek',
    model: 'Marlin 7',
    bike_type: 'MTB',
    color: 'Rojo Viper / Negro',
    frame_size: 'M',
    serial_number: 'WTU281C0492S',
    year: 2024,
    key_components: 'Shimano Deore 1x10, Frenos Hidráulicos MT200, Horquilla RockShox Judy',
    observations: 'Sin detalles graves. Rayón leve en vaina trasera derecha.',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'b-002',
    customer_id: 'c-002',
    brand: 'Specialized',
    model: 'Allez',
    bike_type: 'Ruta',
    color: 'Negro Mate',
    frame_size: '54',
    serial_number: 'WSBC602019284T',
    year: 2023,
    key_components: 'Shimano Claris 2x8, Frenos de herradura Tektro, Ruedas Axis Sport',
    observations: 'Guayas oxidadas, requiere cambio.',
    created_at: new Date('2026-02-15').toISOString(),
    updated_at: new Date('2026-02-15').toISOString(),
  },
];

function getLocalBikes(): Bicycle[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_BIKES);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_BIKES, JSON.stringify(initialLocalBikes));
    return initialLocalBikes;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return initialLocalBikes;
  }
}

function saveLocalBikes(list: Bicycle[]) {
  localStorage.setItem(LOCAL_STORAGE_BIKES, JSON.stringify(list));
}

export const bicycleService = {
  async getBicycles(customerId?: string): Promise<Bicycle[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('bicycles').select('*, customer:customers(*)');
        if (customerId) {
          query = query.eq('customer_id', customerId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          saveLocalBikes(data);
          return data;
        }
      } catch (err) {
        console.warn('Usando caché local de bicicletas:', err);
      }
    }

    const local = getLocalBikes();
    if (!customerId) return local;
    return local.filter((b) => b.customer_id === customerId);
  },

  async getBicycleById(id: string): Promise<Bicycle | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bicycles')
          .select('*, customer:customers(*)')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al obtener bicicleta en Supabase:', err);
      }
    }
    const local = getLocalBikes();
    return local.find((b) => b.id === id) || null;
  },

  async createBicycle(bicycle: BicycleInsert): Promise<Bicycle> {
    const now = new Date().toISOString();
    const newBike: Bicycle = {
      ...bicycle,
      id: crypto.randomUUID ? crypto.randomUUID() : `bike-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('bicycles').insert([bicycle]).select().single();
        if (!error && data) {
          const list = getLocalBikes();
          saveLocalBikes([data, ...list]);
          return data;
        }
      } catch (err) {
        console.warn('Error al guardar bicicleta en Supabase:', err);
      }
    }

    const list = getLocalBikes();
    saveLocalBikes([newBike, ...list]);
    return newBike;
  },

  async updateBicycle(id: string, updates: BicycleUpdate): Promise<Bicycle> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bicycles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          const list = getLocalBikes().map((b) => (b.id === id ? data : b));
          saveLocalBikes(list);
          return data;
        }
      } catch (err) {
        console.warn('Error al actualizar bicicleta en Supabase:', err);
      }
    }

    const list = getLocalBikes();
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('Bicicleta no encontrada');
    const updated: Bicycle = { ...list[index], ...updates, updated_at: now };
    list[index] = updated;
    saveLocalBikes(list);
    return updated;
  },

  async getOrGenerateQRCode(bicycleId: string): Promise<BikeQRCode> {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const defaultCode = `BIKE-${randomHex}`;

    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase
          .from('bike_qr_codes')
          .select('*')
          .eq('bicycle_id', bicycleId)
          .single();
        if (existing) return existing;

        const newQR = {
          bicycle_id: bicycleId,
          qr_code: defaultCode,
          public_token: crypto.randomUUID ? crypto.randomUUID() : `tok-${Date.now()}`,
          is_active: true,
        };
        const { data, error } = await supabase.from('bike_qr_codes').insert([newQR]).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al gestionar QR en Supabase:', err);
      }
    }

    const localQRs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QRS) || '{}');
    if (localQRs[bicycleId]) return localQRs[bicycleId];

    const fallbackQR: BikeQRCode = {
      id: `qr-${Date.now()}`,
      bicycle_id: bicycleId,
      qr_code: defaultCode,
      public_token: `token-${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    localQRs[bicycleId] = fallbackQR;
    localStorage.setItem(LOCAL_STORAGE_QRS, JSON.stringify(localQRs));
    return fallbackQR;
  },
};
