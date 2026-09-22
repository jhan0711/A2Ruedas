import { printerService } from './printerService';

export interface WorkshopGeneralSettings {
  // Identidad y Datos Fiscales
  name: string;
  nit: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  header_slogan: string;
  footer_message: string;
  warranty_text: string;

  // Parámetros de Operación
  daily_capacity: number;
  weekday_hours: string;
  saturday_hours: string;
  sunday_hours: string;
  currency_code: string;
  currency_symbol: string;
  default_tax_rate: number;
  order_prefix: string;
  invoice_prefix: string;
  whatsapp_notifications_enabled: boolean;
}

const LOCAL_STORAGE_WORKSHOP_KEY = 'a2ruedas_workshop_general_settings_v1';

export const DEFAULT_WORKSHOP_SETTINGS: WorkshopGeneralSettings = {
  name: 'A2RUEDAS TALLER',
  nit: '901.452.879-1',
  phone: '(+57) 310 456 7890',
  address: 'Calle 123 # 45-67, Bogotá, Colombia',
  city: 'Bogotá D.C.',
  email: 'contacto@a2ruedas.com',
  header_slogan: 'TALLER ESPECIALIZADO DE BICICLETAS',
  footer_message: '¡Gracias por pedalear con nosotros! 🚲',
  warranty_text: 'Garantía: 30 días en mano de obra y ajustes. Retiro máximo: 30 días post-aviso.',

  daily_capacity: 6,
  weekday_hours: '08:00 - 18:00',
  saturday_hours: '08:00 - 14:00',
  sunday_hours: 'Cerrado',
  currency_code: 'COP',
  currency_symbol: '$',
  default_tax_rate: 0,
  order_prefix: 'OT-',
  invoice_prefix: 'FAC-',
  whatsapp_notifications_enabled: true,
};

export const workshopSettingsService = {
  /**
   * Obtiene la configuración general del taller
   */
  getSettings(): WorkshopGeneralSettings {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_WORKSHOP_KEY);
      const printer = printerService.getSettings();

      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_WORKSHOP_SETTINGS,
          ...parsed,
          // Mantener sincronizados los campos compartidos con printerService
          name: printer.workshop_name || parsed.name || DEFAULT_WORKSHOP_SETTINGS.name,
          nit: printer.workshop_nit || parsed.nit || DEFAULT_WORKSHOP_SETTINGS.nit,
          phone: printer.workshop_phone || parsed.phone || DEFAULT_WORKSHOP_SETTINGS.phone,
          address: printer.workshop_address || parsed.address || DEFAULT_WORKSHOP_SETTINGS.address,
          header_slogan: printer.header_slogan || parsed.header_slogan || DEFAULT_WORKSHOP_SETTINGS.header_slogan,
          footer_message: printer.footer_message || parsed.footer_message || DEFAULT_WORKSHOP_SETTINGS.footer_message,
          warranty_text: printer.warranty_text || parsed.warranty_text || DEFAULT_WORKSHOP_SETTINGS.warranty_text,
        };
      }
    } catch (err) {
      console.warn('Error al cargar configuración general del taller:', err);
    }
    return { ...DEFAULT_WORKSHOP_SETTINGS };
  },

  /**
   * Guarda las opciones de configuración y sincroniza con los formatos de impresión térmica
   */
  saveSettings(newSettings: Partial<WorkshopGeneralSettings>): WorkshopGeneralSettings {
    const current = this.getSettings();
    const updated: WorkshopGeneralSettings = {
      ...current,
      ...newSettings,
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_WORKSHOP_KEY, JSON.stringify(updated));

      // Sincronizar inmediatamente con printerService para que marbetes, facturas y OTs lo reflejen
      printerService.saveSettings({
        workshop_name: updated.name,
        workshop_nit: updated.nit,
        workshop_phone: updated.phone,
        workshop_address: updated.address,
        header_slogan: updated.header_slogan,
        footer_message: updated.footer_message,
        warranty_text: updated.warranty_text,
      });
    } catch (err) {
      console.error('Error al guardar configuración general del taller:', err);
    }

    return updated;
  },

  /**
   * Restablece los parámetros del taller a los valores predeterminados
   */
  resetSettings(): WorkshopGeneralSettings {
    try {
      localStorage.removeItem(LOCAL_STORAGE_WORKSHOP_KEY);
      printerService.resetSettings();
    } catch (err) {
      console.error('Error al restaurar valores por defecto:', err);
    }
    return { ...DEFAULT_WORKSHOP_SETTINGS };
  },
};
