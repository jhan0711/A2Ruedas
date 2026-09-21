/**
 * A2Ruedas - Utilidades Universales de Seguridad y Sanitización
 * Prevención de XSS, inyecciones, Open Redirects y blindaje de datos sensibles (PII).
 */

/**
 * Elimina etiquetas HTML potencialmente maliciosas, scripts y atributos de eventos.
 */
export function sanitizeString(input: unknown): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // 1. Decodificar entidades HTML para evitar ofuscación doble
  str = str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  // 2. Eliminar bloques <script>...</script>, <iframe>...</iframe>, <style>...</style>, etc.
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  str = str.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  str = str.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 3. Eliminar cualquier etiqueta HTML remanente
  str = str.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');

  // 4. Eliminar esquemas de URL peligrosos si aparecen en texto plano
  str = str.replace(/javascript:/gi, '');
  str = str.replace(/vbscript:/gi, '');
  str = str.replace(/data:text\/html/gi, '');

  // 5. Eliminar atributos de manejadores de eventos (ej. onerror=, onload=)
  str = str.replace(/\bon[a-z]+\s*=/gi, '');

  return str.trim();
}

/**
 * Valida y sanitiza montos financieros y cantidades numéricas no negativas.
 * Rechaza NaN, valores infinitos o negativos (ej. en facturas, precios, base de caja).
 */
export function sanitizePositiveAmount(input: unknown, fallback: number = 0): number {
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input) || input < 0) return fallback;
    return Math.round(input * 100) / 100;
  }

  if (typeof input === 'string') {
    const str = input.trim();
    if (str.includes('-')) return fallback; // Bloqueo estricto de montos negativos

    // Eliminar símbolos y letras (ej. $, COP, espacios)
    let cleaned = str.replace(/[^0-9.,]/g, '');
    if (!cleaned) return fallback;

    // Detectar separador de miles vs decimal
    if (cleaned.includes('.') && cleaned.includes(',')) {
      if (cleaned.lastIndexOf('.') > cleaned.lastIndexOf(',')) {
        // Formato anglosajón: 1,500.50
        cleaned = cleaned.replace(/,/g, '');
      } else {
        // Formato colombiano / europeo: 1.500,50
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    } else if (cleaned.includes('.')) {
      // Si tiene múltiples puntos (ej. 1.500.000) o un punto seguido de 3 dígitos (ej. 150.000) -> separador de miles
      const parts = cleaned.split('.');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        cleaned = cleaned.replace(/\./g, '');
      }
    } else if (cleaned.includes(',')) {
      // Si tiene múltiples comas (ej. 1,500,000) o una coma seguida de 3 dígitos (ej. 150,000) -> separador de miles
      const parts = cleaned.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        cleaned = cleaned.replace(/,/g, '');
      } else {
        cleaned = cleaned.replace(',', '.');
      }
    }

    const parsed = parseFloat(cleaned);
    if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return fallback;
    return Math.round(parsed * 100) / 100;
  }

  return fallback;
}

/**
 * Normaliza y valida números telefónicos con estándar nacional e internacional (+57).
 */
export function sanitizePhone(input: unknown): string {
  if (!input) return '';
  let phone = String(input).trim();

  // Preservar indicativo '+' si existe al inicio
  const hasPlus = phone.startsWith('+');
  phone = phone.replace(/\D/g, '');

  // Si tiene 10 dígitos (formato estándar móvil Colombia), anteponer 57
  if (phone.length === 10 && (phone.startsWith('3') || phone.startsWith('6'))) {
    phone = `57${phone}`;
  }

  return hasPlus || phone.startsWith('57') ? `+${phone}` : phone;
}

/**
 * Valida y normaliza direcciones de correo electrónico.
 */
export function sanitizeEmail(input: unknown): string {
  if (!input) return '';
  const email = String(input).toLowerCase().trim();

  // Expresión regular RFC 5322 simplificada y segura contra ReDoS
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

  return emailRegex.test(email) ? email : '';
}

/**
 * Sanitiza códigos de producto (SKU) permitiendo solo caracteres alfanuméricos y guiones.
 */
export function sanitizeSku(input: unknown): string {
  if (!input) return '';
  return String(input)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .trim();
}

/**
 * Sanitiza documentos de identidad (Cédula de ciudadanía, NIT, Pasaporte).
 */
export function sanitizeDocumentId(input: unknown): string {
  if (!input) return '';
  return String(input)
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, '')
    .trim();
}

/**
 * Valida si un código QR cumple estrictamente el formato oficial de A2Ruedas: ^BIKE-[0-9A-F]{6}$
 */
export function validateQrCodeFormat(code: unknown): boolean {
  if (typeof code !== 'string') return false;
  return /^BIKE-[0-9A-F]{6}$/i.test(code.trim());
}

/**
 * Enmascara datos personales sensibles (PII) para visualización en comprobantes o logs.
 * Ejemplo: +57 310 123 4567 -> +57 310 **** 567
 */
export function maskPII(text: string, visibleStart: number = 6, visibleEnd: number = 3): string {
  if (!text) return '';
  if (text.length <= visibleStart + visibleEnd) return text;

  const start = text.slice(0, visibleStart);
  const end = text.slice(-visibleEnd);
  const maskedLength = text.length - visibleStart - visibleEnd;
  const mask = '*'.repeat(Math.min(maskedLength, 4));

  return `${start} ${mask} ${end}`;
}

/**
 * Valida y sanitiza URLs evitando ataques de ejecución mediante javascript: o data:
 */
export function sanitizeUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Permitir URLs relativas seguras (ej. /admin/caja, /productos)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const safeProtocols = ['http:', 'https:', 'tel:', 'mailto:'];
    if (safeProtocols.includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
}

/**
 * Previene vulnerabilidades de redirección abierta (Open Redirect).
 * Asegura que una ruta de retorno sea interna dentro de la aplicación.
 */
export function isSafeInternalRedirect(path: unknown): boolean {
  if (typeof path !== 'string') return false;
  const trimmed = path.trim();

  // Debe empezar con '/' y NO con '//' (que los navegadores interpretan como dominio externo protocol-relative)
  return trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\');
}
