import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Appointment, AppointmentInsert, AppointmentUpdate } from '../types/database';
import { customerService } from './customerService';
import { bicycleService } from './bicycleService';

const LOCAL_STORAGE_APPOINTMENTS = 'a2ruedas_appointments_cache';
export const DEFAULT_DAILY_CAPACITY = 6;

export const AVAILABLE_MECHANICS = [
  'Carlos (Mecánico Senior MTB)',
  'Andrés (Especialista en Suspensiones)',
  'David (Mantenimiento Express)',
  'Cualquier mecánico disponible',
];

export const COMMON_SERVICES = [
  { name: 'Mantenimiento General Completo', duration: 120, price: 65000 },
  { name: 'Ajuste de Frenos y Cambios', duration: 45, price: 25000 },
  { name: 'Purga de Frenos Hidráulicos', duration: 60, price: 35000 },
  { name: 'Mantenimiento de Horquilla / Suspensión', duration: 90, price: 55000 },
  { name: 'Lavado, Desengrase y Lubricación Pro', duration: 45, price: 28000 },
  { name: 'Centrado y Alineación de Ruedas', duration: 45, price: 20000 },
  { name: 'Diagnóstico Técnico Inicial', duration: 30, price: 15000 },
];

// Base de datos limpia de citas para producción
function generateInitialAppointments(): Appointment[] {
  return [];
}

function getLocalAppointments(): Appointment[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_APPOINTMENTS);
  if (!cached) {
    const initial = generateInitialAppointments();
    localStorage.setItem(LOCAL_STORAGE_APPOINTMENTS, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(cached);
  } catch {
    const initial = generateInitialAppointments();
    localStorage.setItem(LOCAL_STORAGE_APPOINTMENTS, JSON.stringify(initial));
    return initial;
  }
}

function saveLocalAppointments(list: Appointment[]) {
  localStorage.setItem(LOCAL_STORAGE_APPOINTMENTS, JSON.stringify(list));
}

export const appointmentService = {
  async getAppointments(startDate?: string, endDate?: string): Promise<Appointment[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('appointments')
          .select('*, customer:customers(*), bicycle:bicycles(*)')
          .order('scheduled_at', { ascending: true });

        if (startDate) query = query.gte('scheduled_at', startDate);
        if (endDate) query = query.lte('scheduled_at', endDate);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          saveLocalAppointments(data);
          return data;
        }
      } catch (err) {
        console.warn('Usando citas desde almacenamiento local:', err);
      }
    }

    const local = getLocalAppointments();
    const [customers, bicycles] = await Promise.all([
      customerService.getCustomers(),
      bicycleService.getBicycles(),
    ]);

    const custMap = new Map(customers.map((c) => [c.id, c]));
    const bikeMap = new Map(bicycles.map((b) => [b.id, b]));

    const populated = local.map((apt) => ({
      ...apt,
      customer: apt.customer || custMap.get(apt.customer_id),
      bicycle: apt.bicycle || (apt.bicycle_id ? bikeMap.get(apt.bicycle_id) : null),
    }));

    let filtered = populated;
    if (startDate) {
      filtered = filtered.filter((a) => a.scheduled_at >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((a) => a.scheduled_at <= endDate);
    }

    return filtered.sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );
  },

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const list = await this.getAppointments();
    return list.find((a) => a.id === id) || null;
  },

  async createAppointment(appointment: AppointmentInsert): Promise<Appointment> {
    const now = new Date().toISOString();
    const newId = crypto.randomUUID ? crypto.randomUUID() : `apt-${Date.now()}`;

    const newAppointment: Appointment = {
      ...appointment,
      id: newId,
      created_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .insert([newAppointment])
          .select('*, customer:customers(*), bicycle:bicycles(*)')
          .single();
        if (!error && data) {
          const list = getLocalAppointments();
          saveLocalAppointments([data, ...list]);
          return data;
        }
      } catch (err) {
        console.warn('Error al guardar cita en Supabase, guardando en local:', err);
      }
    }

    const list = getLocalAppointments();
    saveLocalAppointments([newAppointment, ...list]);

    // Poblar cliente y bicicleta si están en memoria
    const [customers, bicycles] = await Promise.all([
      customerService.getCustomers(),
      bicycleService.getBicycles(),
    ]);
    return {
      ...newAppointment,
      customer: customers.find((c) => c.id === newAppointment.customer_id),
      bicycle: newAppointment.bicycle_id
        ? bicycles.find((b) => b.id === newAppointment.bicycle_id)
        : null,
    };
  },

  async updateAppointment(id: string, updates: AppointmentUpdate): Promise<Appointment> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .update(updates)
          .eq('id', id)
          .select('*, customer:customers(*), bicycle:bicycles(*)')
          .single();
        if (!error && data) {
          const list = getLocalAppointments().map((a) => (a.id === id ? data : a));
          saveLocalAppointments(list);
          return data;
        }
      } catch (err) {
        console.warn('Error al actualizar cita en Supabase:', err);
      }
    }

    const list = getLocalAppointments();
    const updatedList = list.map((a) => (a.id === id ? { ...a, ...updates } : a));
    saveLocalAppointments(updatedList);

    const updated = updatedList.find((a) => a.id === id)!;
    const [customers, bicycles] = await Promise.all([
      customerService.getCustomers(),
      bicycleService.getBicycles(),
    ]);
    return {
      ...updated,
      customer: customers.find((c) => c.id === updated.customer_id),
      bicycle: updated.bicycle_id ? bicycles.find((b) => b.id === updated.bicycle_id) : null,
    };
  },

  async deleteAppointment(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('appointments').delete().eq('id', id);
      } catch (err) {
        console.warn('Error al eliminar cita en Supabase:', err);
      }
    }

    const list = getLocalAppointments();
    saveLocalAppointments(list.filter((a) => a.id !== id));
    return true;
  },

  /**
   * Calcula la capacidad diaria y aforo para una fecha específica (YYYY-MM-DD)
   */
  async getDailyCapacity(
    dateString: string,
    maxDaily: number = DEFAULT_DAILY_CAPACITY
  ): Promise<{
    date: string;
    booked: number;
    max: number;
    percentage: number;
    isFull: boolean;
    remaining: number;
  }> {
    const list = await this.getAppointments();
    const targetDate = dateString.slice(0, 10);

    // Contar citas activas que no estén canceladas
    const booked = list.filter((a) => {
      const aptDate = a.scheduled_at.slice(0, 10);
      return aptDate === targetDate && a.status !== 'CANCELLED';
    }).length;

    const percentage = Math.min(100, Math.round((booked / maxDaily) * 100));
    const isFull = booked >= maxDaily;
    const remaining = Math.max(0, maxDaily - booked);

    return {
      date: targetDate,
      booked,
      max: maxDaily,
      percentage,
      isFull,
      remaining,
    };
  },

  /**
   * Genera un mapa de capacidad para todo un mes
   */
  async getMonthlyCapacityMap(
    year: number,
    month: number,
    maxDaily: number = DEFAULT_DAILY_CAPACITY
  ): Promise<
    Record<
      string,
      { booked: number; max: number; percentage: number; isFull: boolean; remaining: number }
    >
  > {
    const list = await this.getAppointments();
    const result: Record<
      string,
      { booked: number; max: number; percentage: number; isFull: boolean; remaining: number }
    > = {};

    // Obtener días del mes
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const booked = list.filter((a) => {
        const aptDate = a.scheduled_at.slice(0, 10);
        return aptDate === dayStr && a.status !== 'CANCELLED';
      }).length;

      const percentage = Math.min(100, Math.round((booked / maxDaily) * 100));
      result[dayStr] = {
        booked,
        max: maxDaily,
        percentage,
        isFull: booked >= maxDaily,
        remaining: Math.max(0, maxDaily - booked),
      };
    }

    return result;
  },

  /**
   * Genera enlace de WhatsApp para confirmación de cita agendada
   */
  getWhatsAppConfirmationUrl(appointment: Appointment): string {
    const phone = appointment.customer?.phone?.replace(/\D/g, '') || '';
    const waNumber = phone.startsWith('57') ? phone : `57${phone}`;

    const date = new Date(appointment.scheduled_at);
    const dateFormatted = date.toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeFormatted = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const bikeInfo = appointment.bicycle
      ? `${appointment.bicycle.brand} ${appointment.bicycle.model}`
      : 'tu bicicleta';

    const text = encodeURIComponent(
      `¡Hola ${appointment.customer?.full_name}! 👋 Te confirmamos tu cita de servicio en A2Ruedas Taller:\n\n` +
        `🚲 Bicicleta: ${bikeInfo}\n` +
        `🔧 Servicio: ${appointment.service_name || 'Mantenimiento General'}\n` +
        `👨‍🔧 Técnico Asignado: ${appointment.mechanic_name || 'Equipo A2Ruedas'}\n` +
        `📅 Fecha: ${dateFormatted}\n` +
        `⏰ Hora: ${timeFormatted}\n\n` +
        `Te esperamos en nuestro taller (Cra 15 #85-20). Si necesitas reprogramar, por favor avísanos con anticipación.`
    );

    return `https://wa.me/${waNumber}?text=${text}`;
  },
};
