import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  WhatsAppMessage,
  WhatsAppMessageInsert,
  WhatsAppTemplate,
  WhatsAppTemplateId,
  WhatsAppTrigger,
} from '../types/database';
import { customerService } from './customerService';
import { workOrderService } from './workOrderService';

const LOCAL_STORAGE_KEY = 'a2ruedas_whatsapp_messages_cache';

/**
 * Catálogo maestro de plantillas oficiales de comunicación por WhatsApp para el taller
 */
export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'ORDEN_RECIBIDA',
    title: 'Recepción Formal de Bicicleta',
    description: 'Notifica al cliente que su bicicleta ha ingresado al taller con su número de orden OT.',
    trigger: 'RECIBIDA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{FALLA}'],
    template:
      '¡Hola {CLIENTE}! 👋 Te confirmamos que tu bicicleta {BICICLETA} ha sido RECIBIDA exitosamente en A2Ruedas Taller con la Orden N° {ORDEN}.\n\nDiagnóstico técnico en curso. Puedes consultar el estado en cualquier momento. ¡Gracias por confiar en nosotros! 🚲',
  },
  {
    id: 'PRESUPUESTO_LISTO',
    title: 'Presupuesto Listo y Solicitud de Aprobación',
    description: 'Envía el desglose financiero estimado solicitando la autorización del cliente.',
    trigger: 'PRESUPUESTO',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{TOTAL}'],
    template:
      '¡Hola {CLIENTE}! 🔧 Tenemos listo el diagnóstico y presupuesto técnico para tu bicicleta {BICICLETA} (Orden N° {ORDEN}).\n\nEl valor total estimado es de ${TOTAL}.\n\nPor favor confírmanos si apruebas el servicio para iniciar de inmediato con las intervenciones.',
  },
  {
    id: 'ESPERANDO_REPUESTO',
    title: 'Notificación de Repuestos en Tránsito',
    description: 'Informa al cliente que el servicio está en pausa temporal aguardando un componente.',
    trigger: 'ESPERANDO_REPUESTO',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}'],
    template:
      'Estimado(a) {CLIENTE}, te informamos que tu bicicleta {BICICLETA} (Orden N° {ORDEN}) se encuentra temporalmente en espera de un repuesto específico de alta calidad necesario para el ensamblaje.\n\nTe avisaremos tan pronto reanudemos los trabajos.',
  },
  {
    id: 'BICICLETA_LISTA',
    title: 'Bicicleta Lista para Retiro',
    description: 'Avisa al cliente que su bicicleta está terminada, indicando el saldo pendiente y horarios.',
    trigger: 'LISTA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{SALDO}'],
    template:
      '¡Buenas noticias {CLIENTE}! 🎉 Tu bicicleta {BICICLETA} está 100% LISTA para entrega en A2Ruedas Taller (Orden N° {ORDEN}).\n\nSaldo pendiente por cancelar: ${SALDO}.\n\nPuedes pasar a retirarla en nuestro horario habitual: Lunes a Sábado de 8:00 am a 6:00 pm. ¡Te esperamos!',
  },
  {
    id: 'ENTREGA_AGRADECIMIENTO',
    title: 'Entrega Formal, Garantía e Historial QR',
    description: 'Agradece la visita, confirma la garantía de servicio y comparte el enlace al timeline QR.',
    trigger: 'ENTREGADA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{ENLACE_QR}'],
    template:
      '¡Hola {CLIENTE}! 🌟 Tu bicicleta {BICICLETA} ha sido ENTREGADA con éxito (Orden N° {ORDEN}).\n\nTodas nuestras intervenciones cuentan con garantía de satisfacción. Puedes consultar en cualquier momento el historial técnico y mantenimientos escaneando el código QR de tu marco o en este enlace:\n{ENLACE_QR}\n\n¡Gracias por rodar con A2Ruedas!',
  },
  {
    id: 'CONFIRMACION_CITA',
    title: 'Confirmación de Cita Programada',
    description: 'Notifica la reserva de fecha y hora en el taller.',
    trigger: 'CITA_PROGRAMADA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{FECHA}', '{HORA}', '{MECANICO}'],
    template:
      '¡Hola {CLIENTE}! 📅 Confirmamos tu cita de mantenimiento para tu bicicleta {BICICLETA} en A2Ruedas Taller para el día {FECHA} a las {HORA}.\n\nMecánico asignado: {MECANICO}.\nSi necesitas reprogramar, por favor avísanos con anticipación.',
  },
  {
    id: 'RECORDATORIO_CITA',
    title: 'Recordatorio de Cita Próxima',
    description: 'Recuerda al cliente su cita en las próximas 24 horas.',
    trigger: 'RECORDATORIO_CITA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{FECHA}', '{HORA}'],
    template:
      '¡Hola {CLIENTE}! 🔔 Te recordamos tu cita de mantenimiento programada para el {FECHA} a las {HORA} en A2Ruedas Taller.\n\nTe esperamos puntualmente para recibir tu bicicleta {BICICLETA} y comenzar el servicio.',
  },
  {
    id: 'ALERTA_KILOMETRAJE',
    title: 'Alerta de Mantenimiento Preventivo (Odómetro)',
    description: 'Sugiere revisión técnica cuando la bicicleta supera un ciclo de kilometraje.',
    trigger: 'ALERTA_KILOMETRAJE',
    variables: ['{CLIENTE}', '{BICICLETA}', '{KILOMETRAJE}'],
    template:
      '¡Hola {CLIENTE}! 🚴‍♂️ Notamos que tu bicicleta {BICICLETA} ya acumula {KILOMETRAJE} km de rodaje. Para prevenir el desgaste de la cadena y conservar la suspensión, te sugerimos un mantenimiento preventivo. Escríbenos para agendar tu cupo.',
  },
  {
    id: 'HISTORIAL_QR',
    title: 'Compartir Historial Técnico por QR',
    description: 'Envía el enlace público de la bicicleta al cliente.',
    trigger: 'HISTORIAL_QR',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ENLACE_QR}'],
    template:
      '¡Hola {CLIENTE}! 📱 Te compartimos el enlace al historial técnico y mantenimientos certificado de tu bicicleta {BICICLETA} en A2Ruedas:\n{ENLACE_QR}',
  },
  {
    id: 'PERSONALIZADO',
    title: 'Mensaje Libre / Personalizado',
    description: 'Redacción directa para comunicaciones específicas o presupuestos a la medida.',
    trigger: 'MANUAL',
    variables: ['{CLIENTE}', '{BICICLETA}'],
    template:
      '¡Hola {CLIENTE}! Te escribimos desde A2Ruedas Taller con respecto a tu bicicleta {BICICLETA}.',
  },
];

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
   * Obtiene la lista completa de plantillas preconfiguradas
   */
  getTemplates(): WhatsAppTemplate[] {
    return WHATSAPP_TEMPLATES;
  },

  /**
   * Obtiene una plantilla por su ID
   */
  getTemplateById(id: WhatsAppTemplateId): WhatsAppTemplate | undefined {
    return WHATSAPP_TEMPLATES.find((t) => t.id === id);
  },

  /**
   * Obtiene la plantilla más adecuada según el estado de la orden de trabajo
   */
  getTemplateForStatus(status: string): WhatsAppTemplate {
    switch (status) {
      case 'RECIBIDA':
        return this.getTemplateById('ORDEN_RECIBIDA')!;
      case 'PRESUPUESTO':
        return this.getTemplateById('PRESUPUESTO_LISTO')!;
      case 'ESPERANDO_REPUESTO':
        return this.getTemplateById('ESPERANDO_REPUESTO')!;
      case 'LISTA':
        return this.getTemplateById('BICICLETA_LISTA')!;
      case 'ENTREGADA':
        return this.getTemplateById('ENTREGA_AGRADECIMIENTO')!;
      default:
        return this.getTemplateById('PERSONALIZADO')!;
    }
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
   * Construye el enlace universal seguro (Deep Link) para abrir WhatsApp Web o App
   */
  buildWhatsAppDeepLink(phone: string, text: string): string {
    const formatted = this.formatWhatsAppPhone(phone);
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${formatted}?text=${encoded}`;
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
      '{ENLACE_QR}': data.publicUrl || 'https://a2ruedas.app',
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
    const deepLink = this.buildWhatsAppDeepLink(params.phone, params.message);
    if (typeof window !== 'undefined') {
      window.open(deepLink, '_blank');
    }

    return this.logMessage({
      customer_id: params.customerId,
      work_order_id: params.workOrderId || null,
      phone_number: params.phone,
      message_content: params.message,
      status_trigger: params.trigger,
    });
  },
};
