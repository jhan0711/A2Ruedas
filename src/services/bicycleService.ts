import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Bicycle,
  BicycleInsert,
  BicycleUpdate,
  BikeQRCode,
  BicyclePhoto,
  PublicBikeTimeline,
  PublicWorkOrderTimelineItem,
  BicycleFullDossier,
  ReplacedPartSummary,
  MileageRecord,
} from '../types/database';
import { customerService } from './customerService';
import { workOrderService } from './workOrderService';
import { sanitizeString } from '../utils/securityUtils';

const LOCAL_STORAGE_BIKES = 'a2ruedas_bicycles_cache';
const LOCAL_STORAGE_QRS = 'a2ruedas_qrs_cache';
const LOCAL_STORAGE_PHOTOS = 'a2ruedas_bike_photos_cache';

const initialLocalQRs: Record<string, BikeQRCode> = {
  'b-001': {
    id: 'qr-001',
    bicycle_id: 'b-001',
    qr_code: 'BIKE-8F3A92',
    public_token: 'token-b001-8f3a92',
    is_active: true,
    created_at: new Date('2026-01-10').toISOString(),
  },
  'b-002': {
    id: 'qr-002',
    bicycle_id: 'b-002',
    qr_code: 'BIKE-4C6310',
    public_token: 'token-b002-4c6310',
    is_active: true,
    created_at: new Date('2026-02-15').toISOString(),
  },
  'b-003': {
    id: 'qr-003',
    bicycle_id: 'b-003',
    qr_code: 'BIKE-2E91D4',
    public_token: 'token-b003-2e91d4',
    is_active: true,
    created_at: new Date('2026-03-01').toISOString(),
  },
};

function getLocalQRs(): Record<string, BikeQRCode> {
  const cached = localStorage.getItem(LOCAL_STORAGE_QRS);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_QRS, JSON.stringify(initialLocalQRs));
    return initialLocalQRs;
  }
  try {
    const parsed = JSON.parse(cached);
    let modified = false;
    for (const [bikeId, qr] of Object.entries(initialLocalQRs)) {
      if (!parsed[bikeId]) {
        parsed[bikeId] = qr;
        modified = true;
      }
    }
    if (modified) {
      localStorage.setItem(LOCAL_STORAGE_QRS, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return initialLocalQRs;
  }
}

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

    const localQRs = getLocalQRs();
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

  // Consulta por Código QR o Token Público
  async getBicycleByQRCode(code: string): Promise<{ bicycle: Bicycle; qrCode: BikeQRCode } | null> {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) return null;

    if (isSupabaseConfigured) {
      try {
        const { data: qrData, error: qrError } = await supabase
          .from('bike_qr_codes')
          .select('*, bicycle:bicycles(*, customer:customers(*))')
          .or(`qr_code.ilike.${normalized},public_token.eq.${code}`)
          .single();

        if (!qrError && qrData && qrData.bicycle) {
          const photos = await this.getBicyclePhotos(qrData.bicycle.id);
          const fullBike = { ...qrData.bicycle, photos };
          return { bicycle: fullBike, qrCode: qrData };
        }
      } catch (err) {
        console.warn('Error al buscar QR en Supabase, intentando local:', err);
      }
    }

    // Búsqueda en caché local
    const localQRs = getLocalQRs();
    let foundQR: BikeQRCode | null = null;

    for (const qr of Object.values(localQRs)) {
      if (
        qr.qr_code.toUpperCase() === normalized ||
        qr.public_token === code ||
        qr.bicycle_id.toUpperCase() === normalized
      ) {
        foundQR = qr;
        break;
      }
    }

    if (foundQR) {
      const bike = await this.getBicycleById(foundQR.bicycle_id);
      if (bike) {
        return { bicycle: bike, qrCode: foundQR };
      }
    }

    // Búsqueda por ID directo de bicicleta o serial
    const allBikes = await this.getBicycles();
    const matchedBike = allBikes.find(
      (b) =>
        b.id.toUpperCase() === normalized ||
        (b.serial_number && b.serial_number.toUpperCase() === normalized)
    );

    if (matchedBike) {
      const qr = await this.getOrGenerateQRCode(matchedBike.id);
      return { bicycle: matchedBike, qrCode: qr };
    }

    return null;
  },

  // Consulta de Timeline Público (Seguro y Libre de PII)
  async getPublicBicycleTimeline(code: string): Promise<PublicBikeTimeline | null> {
    const result = await this.getBicycleByQRCode(code);
    if (!result) return null;

    const { bicycle, qrCode } = result;
    const workOrders = await workOrderService.getWorkOrdersByBicycleId(bicycle.id);

    // Mantenimientos públicos (excluyendo canceladas)
    const publicWorkOrders: PublicWorkOrderTimelineItem[] = workOrders
      .filter((wo) => wo.status !== 'CANCELADA')
      .map((wo) => {
        const services = (wo.items || [])
          .filter((it) => it.item_type === 'service')
          .map((it) => it.description);
        const partsChanged = (wo.items || [])
          .filter((it) => it.item_type === 'part')
          .map((it) => it.description);

        return {
          id: wo.id,
          order_number: wo.order_number,
          status: wo.status,
          date: wo.created_at,
          entry_mileage_km: wo.entry_mileage_km,
          reported_issues: sanitizeString(wo.reported_issues),
          technician_notes: null, // Ocultar notas privadas del taller en la vista pública por QR
          services: services.length > 0 ? services.map(sanitizeString) : [sanitizeString(wo.reported_issues)],
          parts_changed: partsChanged.map(sanitizeString),
        };
      });

    // Calcular odómetro actual (mayor kilometraje registrado en órdenes)
    const mileages = workOrders
      .map((w) => w.entry_mileage_km)
      .filter((km): km is number => typeof km === 'number' && km > 0);
    const currentMileage = mileages.length > 0 ? Math.max(...mileages) : null;

    // Fecha del último servicio completado o registrado
    const lastServiceDate = publicWorkOrders.length > 0 ? publicWorkOrders[0].date : null;

    // Recomendaciones preventivas inteligentes
    const recommendations = generatePreventiveRecommendations(bicycle.bike_type, currentMileage);

    return {
      qr_code: qrCode.qr_code,
      brand: bicycle.brand,
      model: bicycle.model,
      bike_type: bicycle.bike_type,
      color: bicycle.color,
      serial_number: bicycle.serial_number,
      frame_size: bicycle.frame_size,
      wheel_size: bicycle.wheel_size,
      year: bicycle.year,
      key_components: bicycle.key_components,
      current_mileage_km: currentMileage,
      last_service_date: lastServiceDate,
      is_verified: true,
      photos: bicycle.photos || [],
      work_orders: publicWorkOrders,
      recommendations,
    };
  },

  // Dossier Técnico Administrativo Completo
  async getBicycleFullDossier(bicycleId: string): Promise<BicycleFullDossier | null> {
    const bicycle = await this.getBicycleById(bicycleId);
    if (!bicycle) return null;

    const [qrCode, workOrders] = await Promise.all([
      this.getOrGenerateQRCode(bicycleId),
      workOrderService.getWorkOrdersByBicycleId(bicycleId),
    ]);

    const nonCancelled = workOrders.filter((w) => w.status !== 'CANCELADA');
    const totalSpent = nonCancelled.reduce((sum, w) => sum + (w.grand_total || 0), 0);

    const mileages = workOrders
      .map((w) => w.entry_mileage_km)
      .filter((km): km is number => typeof km === 'number' && km > 0);
    const currentMileageKm = mileages.length > 0 ? Math.max(...mileages) : null;

    const mileageHistory: MileageRecord[] = workOrders
      .filter((w) => typeof w.entry_mileage_km === 'number' && w.entry_mileage_km > 0)
      .map((w) => ({
        date: w.created_at,
        km: w.entry_mileage_km!,
        order_number: w.order_number,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allPartsReplaced: ReplacedPartSummary[] = [];
    for (const wo of workOrders) {
      for (const it of wo.items || []) {
        if (it.item_type === 'part') {
          allPartsReplaced.push({
            date: wo.created_at,
            order_number: wo.order_number,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total_price: it.total_price,
          });
        }
      }
    }

    const recommendations = generatePreventiveRecommendations(bicycle.bike_type, currentMileageKm);

    return {
      bicycle,
      customer: bicycle.customer,
      qrCode,
      photos: bicycle.photos || [],
      workOrders,
      totalServicesCount: workOrders.length,
      totalSpent,
      currentMileageKm,
      mileageHistory,
      allPartsReplaced,
      recommendations,
    };
  },
};

// Generador de recomendaciones preventivas por tipo de bicicleta y odómetro
export function generatePreventiveRecommendations(
  bikeType: string,
  mileageKm?: number | null,
): string[] {
  const recommendations: string[] = [];
  const typeLower = (bikeType || '').toLowerCase();

  if (typeLower.includes('mtb') || typeLower.includes('montaña')) {
    recommendations.push(
      'Mantenimiento y lubricación de horquilla/suspensión cada 50 horas de pedaleo o 1.000 km.',
      'Revisión y purga de frenos hidráulicos con líquido mineral/DOT cada 6 meses.',
      'Chequeo de desgaste de cadena con calibrador (reemplazo sugerido al 0.75% de elongación).',
      'Monitoreo y recarga de líquido sellante en corazas tubeless cada 3 a 4 meses.'
    );
  } else if (typeLower.includes('ruta') || typeLower.includes('carretera')) {
    recommendations.push(
      'Inspección periódica de tensión homogénea en radios y centrado fino de rines.',
      'Verificación de desgaste de zapatas o pastillas de freno antes de rutas de montaña.',
      'Lubricación de cadena con cera o aceite seco cada 250-300 km.',
      'Presión sugerida de neumáticos: 85-100 PSI para máxima eficiencia de rodadura.'
    );
  } else if (typeLower.includes('gravel')) {
    recommendations.push(
      'Limpieza y desengrase profundo de transmisión tras rodar por trocha o barro.',
      'Revisión preventiva de holgura y engrase de rodamientos en caja pedalier (bottom bracket).',
      'Monitoreo de sellante tubeless y presión recomendada entre 35-45 PSI según terreno mixto.',
      'Ajuste preventivo de tensión de guayas y tornillería de cockpit.'
    );
  } else if (typeLower.includes('eléctrica') || typeLower.includes('e-bike')) {
    recommendations.push(
      'Diagnóstico de salud de celdas de batería de litio y limpieza de terminales de contacto.',
      'Inspección y calibración de sensores de pedaleo asistido (PAS) y sensor de torque.',
      'Uso exclusivo de cadenas y piñonería reforzada específica para alto par de e-bikes.',
      'Chequeo de espesor de discos y pastillas de freno ante el mayor peso del vehículo.'
    );
  } else {
    recommendations.push(
      'Ajuste general de frenos, guayas y torque de seguridad en manillar y sillín.',
      'Lubricación regular de cadena cada 15 a 20 días.',
      'Presión recomendada de neumáticos: 40-50 PSI para desplazamiento urbano eficiente.',
      'Revisión preventiva general en taller cada 6 meses.'
    );
  }

  if (mileageKm && mileageKm >= 1000) {
    recommendations.unshift(
      `Odómetro acumulado (${mileageKm.toLocaleString('es-CO')} km): Se sugiere servicio técnico completo de rodamientos de masa y centro.`
    );
  }

  return recommendations;
}

