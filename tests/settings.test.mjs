import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- INICIANDO PRUEBAS: MÓDULO DE CONFIGURACIÓN Y PARÁMETROS DEL TALLER ---');

const projectRoot = process.cwd();

// 1. Verificación de existencia del servicio de configuración del taller
const servicePath = path.join(projectRoot, 'src', 'services', 'workshopSettingsService.ts');
assert.ok(fs.existsSync(servicePath), 'workshopSettingsService.ts debe existir');
const serviceCode = fs.readFileSync(servicePath, 'utf8');
assert.ok(serviceCode.includes('DEFAULT_WORKSHOP_SETTINGS'), 'Debe exportar DEFAULT_WORKSHOP_SETTINGS');
assert.ok(serviceCode.includes('workshopSettingsService'), 'Debe exportar workshopSettingsService');
assert.ok(serviceCode.includes('printerService.saveSettings'), 'Debe sincronizar con printerService');
console.log('1. Servicio de configuración y sincronización con tickets térmicos:', 'PASS');

// 2. Verificación de campos obligatorios en los valores por defecto
const requiredFields = [
  'name',
  'nit',
  'phone',
  'address',
  'city',
  'email',
  'header_slogan',
  'footer_message',
  'warranty_text',
  'daily_capacity',
  'weekday_hours',
  'saturday_hours',
  'sunday_hours',
  'currency_code',
  'currency_symbol',
  'default_tax_rate',
  'order_prefix',
  'invoice_prefix',
  'whatsapp_notifications_enabled',
];

requiredFields.forEach((field) => {
  assert.ok(
    serviceCode.includes(`${field}:`),
    `El campo ${field} debe estar definido en DEFAULT_WORKSHOP_SETTINGS`
  );
});
console.log('2. Campos institucionales, operativos y fiscales verificados:', 'PASS');

// 3. Verificación del componente de página SettingsPage.tsx
const settingsPagePath = path.join(projectRoot, 'src', 'pages', 'admin', 'SettingsPage.tsx');
assert.ok(fs.existsSync(settingsPagePath), 'SettingsPage.tsx debe existir');
const settingsPageCode = fs.readFileSync(settingsPagePath, 'utf8');

assert.ok(settingsPageCode.includes('export const SettingsPage'), 'Debe exportar SettingsPage');
assert.ok(settingsPageCode.includes('Taller & Identidad Fiscal'), 'Debe incluir pestaña de Identidad');
assert.ok(settingsPageCode.includes('Operación & Horarios'), 'Debe incluir pestaña de Operación');
assert.ok(settingsPageCode.includes('Impresión & Hardware'), 'Debe incluir pestaña de Hardware');
assert.ok(settingsPageCode.includes('Sesión & Nube'), 'Debe incluir pestaña de Seguridad y Sesión');
console.log('3. Interfaz completa de 4 pestañas en SettingsPage.tsx:', 'PASS');

// 4. Verificación de Previsualización en Vivo de Marbetes/Tirillas
assert.ok(
  settingsPageCode.includes('Previsualización de Cabecera'),
  'Debe incluir previsualización interactiva de tirilla'
);
assert.ok(
  settingsPageCode.includes('workshopSettings.name'),
  'Debe reflejar dinámicamente el nombre comercial en vivo'
);
console.log('4. Previsualizador dinámico de cabecera térmica en vivo:', 'PASS');

// 5. Verificación de Integración de Rutas en routes.tsx
const routesPath = path.join(projectRoot, 'src', 'app', 'routes.tsx');
const routesCode = fs.readFileSync(routesPath, 'utf8');

assert.ok(
  routesCode.includes("import('../pages/admin/SettingsPage')"),
  'routes.tsx debe importar SettingsPage'
);
assert.ok(
  routesCode.includes("path: 'configuracion'"),
  'routes.tsx debe tener ruta configuracion'
);
assert.ok(
  routesCode.includes('element: <SettingsPage />'),
  'routes.tsx debe montar <SettingsPage /> en configuracion'
);
assert.ok(
  !routesCode.includes('Fase 20'),
  'No debe quedar rastro del placeholder provisional Fase 20'
);
console.log('5. Montaje de la ruta /admin/configuracion en routes.tsx:', 'PASS');

// 6. Verificación del Enlace en Sidebar.tsx
const sidebarPath = path.join(projectRoot, 'src', 'components', 'layout', 'Sidebar.tsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

assert.ok(
  sidebarCode.includes("name: 'Configuración'"),
  'Sidebar.tsx debe contener el item Configuración'
);
assert.ok(
  sidebarCode.includes("path: '/admin/configuracion'"),
  'Sidebar.tsx debe apuntar a /admin/configuracion'
);
console.log('6. Elemento de navegación oficial en Sidebar.tsx:', 'PASS');

// 7. Verificación de exportación en services/index.ts
const servicesIndexPath = path.join(projectRoot, 'src', 'services', 'index.ts');
const servicesIndexCode = fs.readFileSync(servicesIndexPath, 'utf8');
assert.ok(
  servicesIndexCode.includes('./workshopSettingsService'),
  'services/index.ts debe re-exportar workshopSettingsService'
);
console.log('7. Re-exportación en el índice de servicios de la aplicación:', 'PASS');

// 8. Verificación de Seguridad y Sesión Activa
assert.ok(
  settingsPageCode.includes('admin@a2ruedas.com'),
  'SettingsPage debe mostrar la cuenta autorizada del administrador'
);
assert.ok(
  settingsPageCode.includes('logout()'),
  'SettingsPage debe tener función de cierre de sesión seguro'
);
console.log('8. Protocolos de autenticación y seguridad en la configuración:', 'PASS');

console.log('--- TODAS LAS PRUEBAS DEL MÓDULO DE CONFIGURACIÓN HAN SIDO APROBADAS ---');
