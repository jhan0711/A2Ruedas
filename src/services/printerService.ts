import { PrinterSettings } from '../types/database';

const LOCAL_STORAGE_KEY = 'a2ruedas_printer_settings_v1';

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  paper_width: '58mm',
  workshop_name: 'A2RUEDAS TALLER',
  workshop_nit: '901.452.879-1',
  workshop_phone: '(+57) 310 456 7890',
  workshop_address: 'Calle 123 # 45-67, Bogotá, Colombia',
  header_slogan: 'TALLER ESPECIALIZADO DE BICICLETAS',
  footer_message: '¡Gracias por pedalear con nosotros! 🚲',
  warranty_text: 'Garantía: 30 días en mano de obra y ajustes. Retiro máximo: 30 días post-aviso.',
  font_density: 'normal',
  show_qr_code: true,
  feed_lines: 3,
};

export const printerService = {
  /**
   * Obtiene la configuración de la impresora térmica guardada o sus valores predeterminados
   */
  getSettings(): PrinterSettings {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return {
          ...DEFAULT_PRINTER_SETTINGS,
          ...JSON.parse(stored),
        };
      }
    } catch (err) {
      console.warn('Error al cargar configuración de impresora, usando valores predeterminados:', err);
    }
    return { ...DEFAULT_PRINTER_SETTINGS };
  },

  /**
   * Guarda los nuevos parámetros de configuración de la impresora térmica
   */
  saveSettings(newSettings: Partial<PrinterSettings>): PrinterSettings {
    const current = this.getSettings();
    const updated: PrinterSettings = {
      ...current,
      ...newSettings,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error al guardar configuración de impresora:', err);
    }
    return updated;
  },

  /**
   * Restaura la configuración de fábrica recomendada para rollos de 58 mm
   */
  resetSettings(): PrinterSettings {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err) {
      console.error('Error al resetear configuración de impresora:', err);
    }
    return { ...DEFAULT_PRINTER_SETTINGS };
  },

  /**
   * Retorna el ancho útil en milímetros según el tipo de rollo
   */
  getPrintableWidthMm(width: '58mm' | '80mm' = '58mm'): number {
    return width === '80mm' ? 72 : 52;
  },

  /**
   * Retorna el tamaño tipográfico base en píxeles según la densidad elegida
   */
  getFontSizePx(density: 'compact' | 'normal' | 'large' = 'normal'): number {
    switch (density) {
      case 'compact':
        return 9.5;
      case 'large':
        return 12.5;
      case 'normal':
      default:
        return 11;
    }
  },
};
