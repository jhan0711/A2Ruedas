import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Bicycle, BicycleInsert, BicycleUpdate, BikeQRCode, BicyclePhoto } from '../types/database';
import { customerService } from './customerService';

const LOCAL_STORAGE_BIKES = 'a2ruedas_bicycles_cache';
const LOCAL_STORAGE_QRS = 'a2ruedas_qrs_cache';
const LOCAL_STORAGE_PHOTOS = 'a2ruedas_bike_photos_cache';

const initialLocalBikes: Bicycle[] = [
  {
    id: 'b-001',
    customer_id: 'c-001',
    brand: 'Trek',
    model: 'Marlin 7',
    bike_type: 'MTB',
    color: 'Rojo Viper / Negro',
    frame_size: 'M',
    wheel_size: '29"',
    serial_number: 'WTU281C0492S',
    year: 2024,
    key_components: 'Shimano Deore 1x10, Frenos Hidráulicos MT200, Horquilla RockShox Judy',
    observations: 'Rayón superficial en vaina trasera derecha por caída leve.',
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
    frame_size: '54 cm',
    wheel_size: '700c',
    serial_number: 'WSBC602019284T',
    year: 2023,
    key_components: 'Shimano Claris 2x8, Frenos de herradura Tektro, Ruedas Axis Sport',
    observations: 'Guayas oxidadas, cinta de manubrio con desgaste.',
    created_at: new Date('2026-02-15').toISOString(),
    updated_at: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'b-003',
    customer_id: 'c-001',
    brand: 'Giant',
    model: 'Revolt 2',
    bike_type: 'Gravel',
    color: 'Verde Oliva',
    frame_size: 'M/L',
    wheel_size: '700x38c',
    serial_number: 'GA29381745K',
    year: 2025,
    key_components: 'Shimano Sora 2x9, Frenos de disco mecánicos, Cuadro ALUXX Grade',
    observations: 'Excelente estado. Primera revisión de 500 km.',
    created_at: new Date('2026-03-01').toISOString(),
    updated_at: new Date('2026-03-01').toISOString(),
  },
];

const initialLocalPhotos: BicyclePhoto[] = [
  {
    id: 'p-001',
    bicycle_id: 'b-001',
    photo_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
    photo_type: 'general',
    caption: 'Vista lateral completa al ingreso al taller',
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'p-002',
    bicycle_id: 'b-001',
    photo_url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80',
    photo_type: 'transmision',
    caption: 'Estado de cassette Deore y cadena (desgaste 0.75)',
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'p-003',
    bicycle_id: 'b-002',
    photo_url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80',
    photo_type: 'general',
    caption: 'Inspección de ingreso de ruta Specialized',
    created_at: new Date('2026-02-15').toISOString(),
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

function getLocalPhotos(): BicyclePhoto[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_PHOTOS);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_PHOTOS, JSON.stringify(initialLocalPhotos));
    return initialLocalPhotos;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return initialLocalPhotos;
  }
}

function saveLocalPhotos(list: BicyclePhoto[]) {
  localStorage.setItem(LOCAL_STORAGE_PHOTOS, JSON.stringify(list));
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
    const customers = await customerService.getCustomers();
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const populated = local.map((bike) => ({
      ...bike,
      customer: bike.customer || customerMap.get(bike.customer_id),
    }));

    if (!customerId) return populated;
    return populated.filter((b) => b.customer_id === customerId);
  },

  async getBicycleById(id: string): Promise<Bicycle | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bicycles')
          .select('*, customer:customers(*)')
          .eq('id', id)
          .single();
        if (!error && data) {
          const photos = await this.getBicyclePhotos(id);
          return { ...data, photos };
        }
      } catch (err) {
        console.warn('Error al obtener bicicleta en Supabase:', err);
      }
    }
    const local = getLocalBikes();
    const bike = local.find((b) => b.id === id);
    if (!bike) return null;

    const customers = await customerService.getCustomers();
    const customer = customers.find((c) => c.id === bike.customer_id);
    const photos = await this.getBicyclePhotos(id);
    return { ...bike, customer: bike.customer || customer, photos };
  },

  async createBicycle(bicycle: BicycleInsert): Promise<Bicycle> {
    const now = new Date().toISOString();
    const bikeId = crypto.randomUUID ? crypto.randomUUID() : `bike-${Date.now()}`;
    const newBike: Bicycle = {
      ...bicycle,
      id: bikeId,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('bicycles').insert([bicycle]).select().single();
        if (!error && data) {
          const list = getLocalBikes();
          saveLocalBikes([data, ...list]);
          await this.getOrGenerateQRCode(data.id);
          return data;
        }
      } catch (err) {
        console.warn('Error al guardar bicicleta en Supabase:', err);
      }
    }

    const list = getLocalBikes();
    saveLocalBikes([newBike, ...list]);
    await this.getOrGenerateQRCode(newBike.id);
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

  async deleteBicycle(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('bicycles').delete().eq('id', id);
        if (!error) {
          const list = getLocalBikes().filter((b) => b.id !== id);
          saveLocalBikes(list);
          return;
        }
      } catch (err) {
        console.warn('Error al eliminar bicicleta en Supabase:', err);
      }
    }

    const list = getLocalBikes().filter((b) => b.id !== id);
    saveLocalBikes(list);
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

  async getBicyclePhotos(bicycleId: string): Promise<BicyclePhoto[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bicycle_photos')
          .select('*')
          .eq('bicycle_id', bicycleId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Error al consultar fotos de bicicleta en Supabase:', err);
      }
    }

    const localPhotos = getLocalPhotos();
    return localPhotos.filter((p) => p.bicycle_id === bicycleId);
  },

  async addBicyclePhoto(photo: Omit<BicyclePhoto, 'id' | 'created_at'>): Promise<BicyclePhoto> {
    const now = new Date().toISOString();
    const newPhoto: BicyclePhoto = {
      ...photo,
      id: crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`,
      created_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('bicycle_photos').insert([photo]).select().single();
        if (!error && data) {
          const list = getLocalPhotos();
          saveLocalPhotos([data, ...list]);
          return data;
        }
      } catch (err) {
        console.warn('Error al guardar foto en Supabase:', err);
      }
    }

    const list = getLocalPhotos();
    saveLocalPhotos([newPhoto, ...list]);
    return newPhoto;
  },

  async deleteBicyclePhoto(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('bicycle_photos').delete().eq('id', id);
        if (!error) {
          const list = getLocalPhotos().filter((p) => p.id !== id);
          saveLocalPhotos(list);
          return;
        }
      } catch (err) {
        console.warn('Error al eliminar foto en Supabase:', err);
      }
    }

    const list = getLocalPhotos().filter((p) => p.id !== id);
    saveLocalPhotos(list);
  },
};
