import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  WhatsAppMessage,
  WhatsAppMessageInsert,
  WhatsAppTemplate,
  WhatsAppTrigger,
} from '../types/database';
import { customerService } from './customerService';
import { workOrderService } from './workOrderService';

const LOCAL_STORAGE_KEY = 'a2ruedas_whatsapp_messages_cache';

/**
/**
 * Catálogo maestro de las 2 plantillas oficiales requeridas:
 * 1. Recepción de la bicicleta (Agenda / Ingreso)
 * 2. Entrega final (Orden de trabajo)
 */
export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'ORDEN_RECIBIDA',
    title: 'Recepción de la Bicicleta (Agenda / Ingreso)',
    description: 'Notifica al cliente que su bicicleta ha ingresado al taller con su orden o agendamiento.',
    trigger: 'RECIBIDA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{FALLA}'],
    template:
      '¡Hola {CLIENTE}! 👋 Te confirmamos que tu bicicleta {BICICLETA} ha sido RECIBIDA exitosamente en A2Ruedas Taller con la Orden N° {ORDEN}.\n\nDiagnóstico técnico en curso. Puedes consultar el estado en cualquier momento. ¡Gracias por confiar en nosotros! 🚲',
  },
  {
    id: 'ENTREGA_FINAL',
    title: 'Entrega Final de la Bicicleta (Orden de Trabajo)',
    description: 'Avisa al cliente que su bicicleta está terminada, indicando saldo pendiente y garantía técnica.',
    trigger: 'ENTREGADA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{TOTAL}', '{SALDO}'],
    template:
      '¡Hola {CLIENTE}! 🎉 Tu bicicleta {BICICLETA} está 100% lista y ha sido ENTREGADA con éxito (Orden N° {ORDEN}).\n\nTotal del servicio: ${TOTAL}.\nSaldo pendiente: ${SALDO}.\n\nTodas nuestras intervenciones cuentan con garantía técnica de 30 días. ¡Gracias por rodar con A2Ruedas! 🚲',
  },
];

export const WHATSAPP_TEMPLATES = DEFAULT_WHATSAPP_TEMPLATES;

const TEMPLATES_STORAGE_KEY = 'a2ruedas_whatsapp_templates_custom_v3';

function getStoredTemplates(): WhatsAppTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_WHATSAPP_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved WhatsApp templates:', e);
  }
  return DEFAULT_WHATSAPP_TEMPLATES;
}

function saveStoredTemplates(templates: WhatsAppTemplate[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  }
}

// En producción la bitácora de envíos de WhatsApp inicia limpia
const INITIAL_LOGS: WhatsAppMessage[] = [];

function getLocalLogs(): WhatsAppMessage[] {
  if (typeof window === 'undefined') return INITIAL_LOGS;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
    return INITIAL_LOGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOGS;
  }
}

function saveLocalLogs(logs: WhatsAppMessage[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  }
}

export const whatsappService = {
  /**
   * Obtiene la lista de plantillas (editadas o por defecto)
   */
  getTemplates(): WhatsAppTemplate[] {
    return getStoredTemplates();
  },

  /**
   * Obtiene una plantilla por su ID
   */
  getTemplateById(id: string): WhatsAppTemplate | undefined {
    const templates = this.getTemplates();
    const found = templates.find((t) => t.id === id);
    if (found) return found;
    if (id === 'ENTREGA_AGRADECIMIENTO' || id === 'BICICLETA_LISTA' || id === 'ENTREGA_FINAL') {
      return templates.find((t) => t.id === 'ENTREGA_FINAL') || templates[1] || templates[0];
    }
    return templates.find((t) => t.id === 'ORDEN_RECIBIDA') || templates[0];
  },

  /**
   * Obtiene la plantilla más adecuada según el estado de la orden de trabajo
   */
  getTemplateForStatus(status: string): WhatsAppTemplate {
    const templates = this.getTemplates();
    const delivery = templates.find((t) => t.id === 'ENTREGA_FINAL') || templates[1] || templates[0];
    const reception = templates.find((t) => t.id === 'ORDEN_RECIBIDA') || templates[0];
    if (status === 'ENTREGADA' || status === 'LISTA') {
      return delivery;
    }
    return reception;
  },

  /**
   * Guarda o edita una plantilla de forma persistente
   */
  saveTemplate(updated: WhatsAppTemplate): WhatsAppTemplate {
    const templates = this.getTemplates();
    const index = templates.findIndex((t) => t.id === updated.id);
    let nextList: WhatsAppTemplate[];
    if (index >= 0) {
      nextList = [...templates];
      nextList[index] = { ...nextList[index], ...updated };
    } else {
      nextList = [...templates, updated];
    }
    saveStoredTemplates(nextList);
    return updated;
  },

  /**
   * Restablece las plantillas a los valores por defecto
   */
  resetTemplates(): WhatsAppTemplate[] {
    saveStoredTemplates(DEFAULT_WHATSAPP_TEMPLATES);
    return DEFAULT_WHATSAPP_TEMPLATES;
  },

  /**
   * Normaliza un número de teléfono para WhatsApp (Prefijo internacional Colombia 57)
   * Ejemplo: "310 456 7890" -> "573104567890"
   * Ejemplo: "+57 310 456 7890" -> "573104567890"
   */
  formatWhatsAppPhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('3')) {
      return `57${digits}`;
    }
    if (digits.startsWith('57') && digits.length === 12) {
      return digits;
    }
    return digits;
  },

  /**
   * Construye el enlace de protocolo nativo para abrir la aplicación instalada en Windows / dispositivo
   * Protocolo oficial de la aplicación: whatsapp://send?phone=...&text=...
   */
  buildWhatsAppDeepLink(phone: string, text: string): string {
    const formatted = this.formatWhatsAppPhone(phone);
    const encoded = encodeURIComponent(text);
    return `whatsapp://send?phone=${formatted}&text=${encoded}`;
  },

  /**
   * Construye enlace alternativo para navegador web clásico (wa.me)
   */
  buildWhatsAppWebLink(phone: string, text: string): string {
    const formatted = this.formatWhatsAppPhone(phone);
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${formatted}?text=${encoded}`;
  },

  /**
   * Invoca directamente la aplicación de WhatsApp instalada en Windows / dispositivo
   * sin abrir páginas intermedias de navegador
   */
  openWhatsApp(phone: string, text: string): void {
    if (typeof window === 'undefined') return;
    const formatted = this.formatWhatsAppPhone(phone);
    const encoded = encodeURIComponent(text);
    const appUri = `whatsapp://send?phone=${formatted}&text=${encoded}`;

    // Disparar invocación directa del protocolo registrado en Windows
    const link = document.createElement('a');
    link.href = appUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Sustituye las etiquetas dinámicas por los valores reales de la operación
   */
  interpolateTemplate(
    templateText: string,
    data: {
      customerName?: string;
      bikeName?: string;
      orderNumber?: string;
      totalAmount?: number | string;
      balanceDue?: number | string;
      reportedIssues?: string;
      publicUrl?: string;
      appointmentDate?: string;
      appointmentTime?: string;
      mechanicName?: string;
      mileageKm?: number | string;
    }
  ): string {
    let result = templateText;

    const replacements: Record<string, string> = {
      '{CLIENTE}': data.customerName || 'Estimado(a) Cliente',
      '{BICICLETA}': data.bikeName || 'su bicicleta',
      '{ORDEN}': data.orderNumber || 'OT-000000',
      '{TOTAL}':
        typeof data.totalAmount === 'number'
          ? data.totalAmount.toLocaleString('es-CO')
          : data.totalAmount || '0',
      '{SALDO}':
        typeof data.balanceDue === 'number'
          ? data.balanceDue.toLocaleString('es-CO')
          : data.balanceDue || '0',
      '{FALLA}': data.reportedIssues || 'Revisión técnica',
      '{FECHA}': data.appointmentDate || 'fecha acordada',
      '{HORA}': data.appointmentTime || 'hora acordada',
      '{MECANICO}': data.mechanicName || 'Técnico Especializado',
      '{KILOMETRAJE}':
        typeof data.mileageKm === 'number'
          ? data.mileageKm.toLocaleString('es-CO')
          : data.mileageKm || '1.000',
    };

    for (const [tag, val] of Object.entries(replacements)) {
      result = result.split(tag).join(val);
    }

    return result;
  },

  /**
   * Registra un mensaje enviado en la bitácora inmutable de la base de datos
   */
  async logMessage(insertData: WhatsAppMessageInsert): Promise<WhatsAppMessage> {
    const formattedPhone = this.formatWhatsAppPhone(insertData.phone_number);

    const newRecord: WhatsAppMessage = {
      id: `wa-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      customer_id: insertData.customer_id,
      work_order_id: insertData.work_order_id || null,
      phone_number: formattedPhone,
      message_content: insertData.message_content,
      status_trigger: insertData.status_trigger || 'MANUAL',
      created_at: new Date().toISOString(),
    };

    // 1. Intentar persistencia en Supabase si está disponible
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('whatsapp_messages')
          .insert({
            customer_id: insertData.customer_id,
            work_order_id: insertData.work_order_id || null,
            phone_number: formattedPhone,
            message_content: insertData.message_content,
            status_trigger: insertData.status_trigger || 'MANUAL',
          })
          .select()
          .single();

        if (!error && data) {
          newRecord.id = data.id;
          newRecord.created_at = data.created_at;
        }
      } catch (err) {
        console.warn('Supabase no disponible para registrar mensaje WhatsApp, usando cache local:', err);
      }
    }

    // 2. Guardar en almacenamiento local
    const local = getLocalLogs();
    local.unshift(newRecord);
    saveLocalLogs(local);

    return newRecord;
  },

  /**
   * Consulta el historial de mensajes enviados con hidratación de cliente y orden
   */
  async getMessages(filters?: {
    customerId?: string;
    workOrderId?: string;
    trigger?: string;
    searchTerm?: string;
  }): Promise<WhatsAppMessage[]> {
    let logs: WhatsAppMessage[] = [];

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('whatsapp_messages')
          .select('*, customer:customers(*), work_order:work_orders(*)')
          .order('created_at', { ascending: false });

        if (filters?.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
        if (filters?.workOrderId) {
          query = query.eq('work_order_id', filters.workOrderId);
        }
        if (filters?.trigger && filters.trigger !== 'ALL') {
          query = query.eq('status_trigger', filters.trigger);
        }

        const { data, error } = await query;
        if (!error && data) {
          logs = data as WhatsAppMessage[];
        } else {
          logs = getLocalLogs();
        }
      } catch {
        logs = getLocalLogs();
      }
    } else {
      logs = getLocalLogs();
    }

    // Hidratar con clientes y órdenes locales si hace falta
    const customers = await customerService.getCustomers();
    const workOrders = await workOrderService.getWorkOrders();

    const customerMap = new Map(customers.map((c) => [c.id, c]));
    const orderMap = new Map(workOrders.map((o) => [o.id, o]));

    const hydrated = logs.map((log) => ({
      ...log,
      customer: log.customer || customerMap.get(log.customer_id) || null,
      work_order: log.work_order || (log.work_order_id ? orderMap.get(log.work_order_id) : null) || null,
    }));

    // Filtrar en memoria por cliente, orden, disparador y término de búsqueda
    return hydrated.filter((item) => {
      if (filters?.customerId && item.customer_id !== filters.customerId) {
        return false;
      }
      if (filters?.workOrderId && item.work_order_id !== filters.workOrderId) {
        return false;
      }
      if (filters?.trigger && filters.trigger !== 'ALL' && item.status_trigger !== filters.trigger) {
        return false;
      }
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase().trim();
        const matchesClient = item.customer?.full_name?.toLowerCase().includes(term);
        const matchesPhone = item.phone_number?.toLowerCase().includes(term);
        const matchesOrder = item.work_order?.order_number?.toLowerCase().includes(term);
        const matchesContent = item.message_content?.toLowerCase().includes(term);
        if (!matchesClient && !matchesPhone && !matchesOrder && !matchesContent) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Abre la ventana de WhatsApp Web / app con el mensaje y lo audita en la base de datos
   */
  async sendAndLogMessage(params: {
    customerId: string;
    workOrderId?: string | null;
    phone: string;
    message: string;
    trigger: WhatsAppTrigger | string;
  }): Promise<WhatsAppMessage> {
    this.openWhatsApp(params.phone, params.message);

    return this.logMessage({
      customer_id: params.customerId,
      work_order_id: params.workOrderId || null,
      phone_number: params.phone,
      message_content: params.message,
      status_trigger: params.trigger,
    });
  },
};
