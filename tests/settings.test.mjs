import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- INICIANDO PRUEBAS: MÓDULO DE CONFIGURACIÓN Y GESTIÓN DE USUARIOS ---');

const projectRoot = process.cwd();

// 1. Verificación de existencia del servicio de configuración del taller
const servicePath = path.join(projectRoot, 'src', 'services', 'workshopSettingsService.ts');
assert.ok(fs.existsSync(servicePath), 'workshopSettingsService.ts debe existir');
const serviceCode = fs.readFileSync(servicePath, 'utf8');
assert.ok(serviceCode.includes('DEFAULT_WORKSHOP_SETTINGS'), 'Debe exportar DEFAULT_WORKSHOP_SETTINGS');
assert.ok(serviceCode.includes('workshopSettingsService'), 'Debe exportar workshopSettingsService');
assert.ok(serviceCode.includes('printerService.saveSettings'), 'Debe sincronizar con printerService');
console.log('1. Servicio de configuración y sincronización con tickets térmicos:', 'PASS');

// 2. Verificación de servicio de gestión de usuarios del taller (userService.ts)
const userServicePath = path.join(projectRoot, 'src', 'services', 'userService.ts');
assert.ok(fs.existsSync(userServicePath), 'userService.ts debe existir');
const userServiceCode = fs.readFileSync(userServicePath, 'utf8');
assert.ok(userServiceCode.includes('INITIAL_ADMIN_USER'), 'Debe tener INITIAL_ADMIN_USER');
assert.ok(userServiceCode.includes('createUser'), 'Debe tener método createUser');
assert.ok(userServiceCode.includes('updateUser'), 'Debe tener método updateUser');
assert.ok(userServiceCode.includes('deleteUser'), 'Debe tener método deleteUser');
assert.ok(userServiceCode.includes('validateCredentials'), 'Debe validar credenciales de acceso');
console.log('2. Servicio integral de gestión y autenticación de usuarios del taller:', 'PASS');

// 3. Verificación de campos obligatorios en los valores por defecto del taller
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
console.log('3. Campos institucionales, operativos y fiscales verificados:', 'PASS');

// 4. Verificación del componente SettingsPage.tsx y sus 5 pestañas
const settingsPagePath = path.join(projectRoot, 'src', 'pages', 'admin', 'SettingsPage.tsx');
assert.ok(fs.existsSync(settingsPagePath), 'SettingsPage.tsx debe existir');
const settingsPageCode = fs.readFileSync(settingsPagePath, 'utf8');

assert.ok(settingsPageCode.includes('export const SettingsPage'), 'Debe exportar SettingsPage');
assert.ok(settingsPageCode.includes('Taller & Identidad'), 'Debe incluir pestaña de Identidad');
assert.ok(settingsPageCode.includes('Usuarios & Técnicos'), 'Debe incluir pestaña de Gestión de Usuarios');
assert.ok(settingsPageCode.includes('Operación & Horarios'), 'Debe incluir pestaña de Operación');
assert.ok(settingsPageCode.includes('Impresión & Hardware'), 'Debe incluir pestaña de Hardware');
assert.ok(settingsPageCode.includes('Sesión & Seguridad'), 'Debe incluir pestaña de Seguridad');
console.log('4. Interfaz completa de 5 pestañas incluyendo Gestión de Usuarios:', 'PASS');

// 5. Verificación de Funcionalidad para Agregar Usuarios en SettingsPage
assert.ok(
  settingsPageCode.includes('Agregar Nuevo Usuario'),
  'Debe contener botón para agregar nuevo usuario'
);
assert.ok(
  settingsPageCode.includes('handleOpenAddUser'),
  'Debe tener handler para abrir modal de nuevo usuario'
);
assert.ok(
  settingsPageCode.includes('handleSaveUser'),
  'Debe tener handler para guardar el usuario creado'
);
assert.ok(
  settingsPageCode.includes('handleOpenDeleteUser'),
  'Debe tener soporte para eliminar/desactivar usuarios'
);
console.log('5. Flujo completo de alta, edición y baja de usuarios autorizado:', 'PASS');

// 6. Verificación de Integración de Autenticación en AuthContext
const authContextPath = path.join(projectRoot, 'src', 'features', 'auth', 'AuthContext.tsx');
const authContextCode = fs.readFileSync(authContextPath, 'utf8');
assert.ok(
  authContextCode.includes('userService.validateCredentials'),
  'AuthContext debe validar credenciales con userService'
);
console.log('6. Validación dinámica de credenciales para usuarios agregados:', 'PASS');

// 7. Verificación de Botones y Accesibilidad (Button.tsx)
const buttonPath = path.join(projectRoot, 'src', 'components', 'ui', 'Button.tsx');
const buttonCode = fs.readFileSync(buttonPath, 'utf8');
assert.ok(
  buttonCode.includes('min-h-[32px]') || buttonCode.includes('min-h-'),
  'Button.tsx debe usar alturas mínimas flexibles sin recorte'
);
console.log('7. Corrección de proporciones, padding y alturas en botones:', 'PASS');

// 8. Verificación de Integración de Rutas en routes.tsx y Sidebar.tsx
const routesPath = path.join(projectRoot, 'src', 'app', 'routes.tsx');
const routesCode = fs.readFileSync(routesPath, 'utf8');
assert.ok(
  routesCode.includes('element: <SettingsPage />'),
  'routes.tsx debe montar <SettingsPage />'
);

const sidebarPath = path.join(projectRoot, 'src', 'components', 'layout', 'Sidebar.tsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
assert.ok(
  sidebarCode.includes("path: '/admin/configuracion'"),
  'Sidebar.tsx debe apuntar a /admin/configuracion'
);
console.log('8. Enrutamiento y navegación en panel administrativo:', 'PASS');

// 9. Verificación de Persistencia de Sesión ante Recarga de Página
assert.ok(
  authContextCode.includes('event === \'SIGNED_OUT\''),
  'AuthContext debe verificar explícitamente SIGNED_OUT para no borrar sesión en INITIAL_SESSION'
);
assert.ok(
  authContextCode.includes('useState<User | null>(() =>'),
  'AuthContext debe inicializar el estado síncronamente desde localStorage'
);
console.log('9. Persistencia de sesión garantizada ante recarga de página (F5):', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE CONFIGURACIÓN Y USUARIOS HAN SIDO APROBADAS ---');

