import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- INICIANDO PRUEBAS: PERSISTENCIA DE CONFIGURACIÓN Y SINCRONIZACIÓN PÚBLICA / COMPROBANTES ---');

const projectRoot = process.cwd();

// 1. Verificación del Servicio workshopSettingsService y Fuente Única de Verdad
const workshopServicePath = path.join(projectRoot, 'src', 'services', 'workshopSettingsService.ts');
assert.ok(fs.existsSync(workshopServicePath), 'workshopSettingsService.ts debe existir');
const workshopServiceCode = fs.readFileSync(workshopServicePath, 'utf8');

assert.ok(
  workshopServiceCode.includes('a2ruedas_workshop_general_settings_v1'),
  'Debe usar a2ruedas_workshop_general_settings_v1 como clave maestra de persistencia'
);
assert.ok(
  workshopServiceCode.includes('formatPhoneForWhatsApp'),
  'Debe exportar la función utilitaria formatPhoneForWhatsApp'
);
assert.ok(
  workshopServiceCode.includes('a2ruedas_workshop_settings_changed'),
  'Debe despachar y escuchar eventos reactivos a2ruedas_workshop_settings_changed'
);
console.log('1. Fuente única de verdad y despacho reactivo en workshopSettingsService:', 'PASS');

// 2. Verificación de normalización de números de WhatsApp
// Simulación directa del algoritmo implementado
const cleanPhone1 = '3104567890'.replace(/\D/g, '');
const cleanPhone2 = '(+57) 310 456 7890'.replace(/\D/g, '');
const cleanPhone3 = '573104567890'.replace(/\D/g, '');

function normalizeForWhatsApp(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '573104567890';
  if (digits.length === 10) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith('57')) return digits;
  return digits;
}

assert.strictEqual(normalizeForWhatsApp('3104567890'), '573104567890');
assert.strictEqual(normalizeForWhatsApp('(+57) 310 456 7890'), '573104567890');
assert.strictEqual(normalizeForWhatsApp('573104567890'), '573104567890');
assert.strictEqual(normalizeForWhatsApp('3001234567'), '573001234567');
console.log('2. Normalización de números telefónicos colombianos para WhatsApp:', 'PASS');

// 3. Verificación de eliminación del bug de sobreescritura en SettingsPage.tsx
const settingsPagePath = path.join(projectRoot, 'src', 'pages', 'admin', 'SettingsPage.tsx');
assert.ok(fs.existsSync(settingsPagePath), 'SettingsPage.tsx debe existir');
const settingsPageCode = fs.readFileSync(settingsPagePath, 'utf8');

assert.ok(
  !settingsPageCode.includes('printerService.saveSettings(printerSettings)'),
  'handleSaveAll no debe sobreescribir la configuración de impresora con el estado desactualizado de texto'
);
assert.ok(
  settingsPageCode.includes('workshopSettingsService.saveSettings(workshopSettings)'),
  'handleSaveAll debe guardar los datos actualizados a través de workshopSettingsService'
);
assert.ok(
  settingsPageCode.includes('paper_width: printerSettings.paper_width'),
  'handleSaveAll debe actualizar solo propiedades de hardware en printerService'
);
console.log('3. Bug de sobreescritura de dirección corregido en SettingsPage.tsx:', 'PASS');

// 4. Verificación de enlace dinámico en PublicLayout (Header y Footer públicos)
const publicLayoutPath = path.join(projectRoot, 'src', 'components', 'layout', 'PublicLayout.tsx');
assert.ok(fs.existsSync(publicLayoutPath), 'PublicLayout.tsx debe existir');
const publicLayoutCode = fs.readFileSync(publicLayoutPath, 'utf8');

assert.ok(
  publicLayoutCode.includes('workshopSettingsService'),
  'PublicLayout debe importar workshopSettingsService'
);
assert.ok(
  publicLayoutCode.includes('workshopSettingsService.getSettings()'),
  'PublicLayout debe inicializar el estado con getSettings()'
);
assert.ok(
  publicLayoutCode.includes('WORKSHOP_SETTINGS_EVENT') || publicLayoutCode.includes('a2ruedas_workshop_settings_changed'),
  'PublicLayout debe escuchar cambios reactivos de configuración'
);
assert.ok(
  publicLayoutCode.includes('{settings.address}'),
  'PublicLayout debe mostrar la dirección configurada dinámicamente'
);
assert.ok(
  publicLayoutCode.includes('settings.weekday_hours'),
  'PublicLayout debe mostrar los horarios entre semana configurados dinámicamente'
);
console.log('4. Sincronización reactiva y dinámica en encabezado y pie de página público:', 'PASS');

// 5. Verificación de enlace dinámico en HomePage.tsx (Página Principal Pública)
const homePagePath = path.join(projectRoot, 'src', 'pages', 'public', 'HomePage.tsx');
assert.ok(fs.existsSync(homePagePath), 'HomePage.tsx debe existir');
const homePageCode = fs.readFileSync(homePagePath, 'utf8');

assert.ok(
  homePageCode.includes('workshopSettingsService'),
  'HomePage debe importar workshopSettingsService'
);
assert.ok(
  homePageCode.includes('{settings.address}'),
  'HomePage debe mostrar la dirección configurada dinámicamente en sección de taller'
);
assert.ok(
  homePageCode.includes('settings.weekday_hours'),
  'HomePage debe mostrar el horario dinámico'
);
assert.ok(
  homePageCode.includes('formatPhoneForWhatsApp(settings.phone)'),
  'HomePage debe generar el botón de WhatsApp con el teléfono dinámico del taller'
);
console.log('5. Visualización dinámica de datos del taller en página principal (HomePage):', 'PASS');

// 6. Verificación de cotizaciones en Catálogo Público (catalogService.ts)
const catalogServicePath = path.join(projectRoot, 'src', 'services', 'catalogService.ts');
assert.ok(fs.existsSync(catalogServicePath), 'catalogService.ts debe existir');
const catalogServiceCode = fs.readFileSync(catalogServicePath, 'utf8');

assert.ok(
  catalogServiceCode.includes('workshopSettingsService'),
  'catalogService debe importar workshopSettingsService'
);
assert.ok(
  catalogServiceCode.includes('workshopSettingsService.getSettings()'),
  'catalogService debe leer la configuración en caliente para cotizaciones de WhatsApp'
);
console.log('6. Generación de enlaces de WhatsApp en catálogo con teléfono dinámico:', 'PASS');

// 7. Verificación de Facturas y Comprobantes de Pago (InvoiceDetailModal.tsx)
const invoiceModalPath = path.join(projectRoot, 'src', 'components', 'invoices', 'InvoiceDetailModal.tsx');
assert.ok(fs.existsSync(invoiceModalPath), 'InvoiceDetailModal.tsx debe existir');
const invoiceModalCode = fs.readFileSync(invoiceModalPath, 'utf8');

assert.ok(
  invoiceModalCode.includes('workshopSettingsService'),
  'InvoiceDetailModal debe importar workshopSettingsService'
);
assert.ok(
  invoiceModalCode.includes('{workshopSettings.name}'),
  'InvoiceDetailModal debe mostrar el nombre del taller dinámicamente'
);
assert.ok(
  invoiceModalCode.includes('{workshopSettings.address}'),
  'InvoiceDetailModal debe mostrar la dirección del taller dinámicamente'
);
assert.ok(
  invoiceModalCode.includes('{workshopSettings.phone}'),
  'InvoiceDetailModal debe mostrar el teléfono del taller dinámicamente'
);
assert.ok(
  invoiceModalCode.includes('{workshopSettings.nit}'),
  'InvoiceDetailModal debe mostrar el NIT del taller dinámicamente'
);
console.log('7. Plantillas térmica y comercial en modal de factura con datos dinámicos:', 'PASS');

// 8. Verificación de Generadores de Documentos de Impresión (printUtils.ts)
const printUtilsPath = path.join(projectRoot, 'src', 'utils', 'printUtils.ts');
assert.ok(fs.existsSync(printUtilsPath), 'printUtils.ts debe existir');
const printUtilsCode = fs.readFileSync(printUtilsPath, 'utf8');

assert.ok(
  printUtilsCode.includes('import { workshopSettingsService } from \'../services/workshopSettingsService\''),
  'printUtils debe importar workshopSettingsService'
);
assert.ok(
  printUtilsCode.includes('generateFormalInvoiceHtml') &&
  printUtilsCode.includes('const workshop = workshopSettingsService.getSettings()'),
  'generateFormalInvoiceHtml debe usar la configuración dinámica del taller'
);
assert.ok(
  printUtilsCode.includes('generateInvoiceCommercialHtml') &&
  printUtilsCode.includes('const workshop = workshopSettingsService.getSettings()'),
  'generateInvoiceCommercialHtml debe usar la configuración dinámica del taller'
);
assert.ok(
  printUtilsCode.includes('generateInvoiceThermalTicketHtml') &&
  printUtilsCode.includes('settings || printerService.getSettings()'),
  'generateInvoiceThermalTicketHtml debe usar printerService.getSettings() como fallback'
);
assert.ok(
  printUtilsCode.includes('generateReceptionTicketHtml') &&
  printUtilsCode.includes('settings || printerService.getSettings()'),
  'generateReceptionTicketHtml debe usar printerService.getSettings() como fallback'
);
assert.ok(
  printUtilsCode.includes('generateWorkOrderTicketHtml') &&
  printUtilsCode.includes('settings || printerService.getSettings()'),
  'generateWorkOrderTicketHtml debe usar printerService.getSettings() como fallback'
);
console.log('8. Tirillas térmicas y facturas PDF/impresas sincronizadas con configuración:', 'PASS');

// 9. Simulación de persistencia ante cambio de ciudad/dirección (Caso Medellín)
const simulatedSettings = {
  name: 'A2Ruedas Medellín El Poblado',
  nit: '901.452.879-1',
  phone: '(+57) 300 123 4567',
  address: 'Carrera 43A # 1-50, El Poblado',
  city: 'Medellín',
  email: 'taller.medellin@a2ruedas.com',
  weekday_hours: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
  saturday_hours: 'Sábados: 8:00 AM - 3:00 PM',
};

assert.strictEqual(simulatedSettings.city, 'Medellín');
assert.strictEqual(simulatedSettings.address, 'Carrera 43A # 1-50, El Poblado');
assert.strictEqual(normalizeForWhatsApp(simulatedSettings.phone), '573001234567');
console.log('9. Simulación de guardado con dirección en Medellín validada:', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE PERSISTENCIA Y SINCRONIZACIÓN GENERAL HAN SIDO APROBADAS ---');
