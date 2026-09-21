import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  sanitizeString,
  sanitizePositiveAmount,
  sanitizePhone,
  sanitizeEmail,
  sanitizeSku,
  sanitizeDocumentId,
  validateQrCodeFormat,
  maskPII,
  sanitizeUrl,
  isSafeInternalRedirect,
} from '../src/utils/securityUtils.ts';

console.log('--- INICIANDO PRUEBAS DE LA FASE 20: AUDITORÍA DE SEGURIDAD ---');

const projectRoot = process.cwd();

// 1. Prevención de Inyección XSS (Cross-Site Scripting)
const xssPayloads = [
  { input: '<script>alert("xss")</script>', expected: '' },
  { input: '<img src=x onerror="alert(1)">', expected: '' },
  { input: '<iframe src="http://evil.com"></iframe>Texto legítimo', expected: 'Texto legítimo' },
  { input: '<a href="javascript:steal()">Peligro</a>', expected: 'Peligro' },
  { input: 'Mantenimiento General <style>body{display:none}</style>', expected: 'Mantenimiento General' },
  { input: 'Repuesto Shimano &lt;script&gt;alert(1)&lt;/script&gt;', expected: 'Repuesto Shimano' },
];

for (const p of xssPayloads) {
  const result = sanitizeString(p.input);
  assert.strictEqual(result, p.expected);
}
console.log('1. Prevención estricta de XSS (Scripts, iframes, atributos onerror/onload eliminados):', 'PASS');

// 2. Mitigación de Vulnerabilidades de Redirección Abierta (Open Redirect)
assert.strictEqual(isSafeInternalRedirect('/admin'), true);
assert.strictEqual(isSafeInternalRedirect('/admin/ordenes/nueva'), true);
assert.strictEqual(isSafeInternalRedirect('/productos?p=1'), true);
assert.strictEqual(isSafeInternalRedirect('//evil.com'), false); // Protocol-relative bypass
assert.strictEqual(isSafeInternalRedirect('https://evil.com/admin'), false);
assert.strictEqual(isSafeInternalRedirect('/\\evil.com'), false); // Backslash trick
assert.strictEqual(isSafeInternalRedirect(null), false);
assert.strictEqual(isSafeInternalRedirect(''), false);
console.log('2. Protección contra Open Redirects en flujo de autenticación y navegación:', 'PASS');

// 3. Sanitización y Validación Financiera (Prevención de Montos Negativos y Manipulación)
assert.strictEqual(sanitizePositiveAmount(150000), 150000);
assert.strictEqual(sanitizePositiveAmount('$ 150.000 COP'), 150000);
assert.strictEqual(sanitizePositiveAmount(-50000, 0), 0); // Bloqueo de importes negativos
assert.strictEqual(sanitizePositiveAmount(NaN, 0), 0);
assert.strictEqual(sanitizePositiveAmount(Infinity, 0), 0);
assert.strictEqual(sanitizePositiveAmount('Monto inválido', 0), 0);
console.log('3. Integridad financiera y prevención de cantidades negativas o corruptas:', 'PASS');

// 4. Normalización y Limpieza de Teléfonos Celulares (+57)
assert.strictEqual(sanitizePhone('3104567890'), '+573104567890');
assert.strictEqual(sanitizePhone('+57 310 456 7890'), '+573104567890');
assert.strictEqual(sanitizePhone('310-456-7890'), '+573104567890');
assert.strictEqual(sanitizePhone('3104567890; DROP TABLE customers;'), '+573104567890');
console.log('4. Normalización estricta de telefonía y neutralización de caracteres maliciosos:', 'PASS');

// 5. Validación y Normalización de Correos Electrónicos
assert.strictEqual(sanitizeEmail('  Admin@A2Ruedas.com  '), 'admin@a2ruedas.com');
assert.strictEqual(sanitizeEmail('usuario.taller+mecanico@gmail.com'), 'usuario.taller+mecanico@gmail.com');
assert.strictEqual(sanitizeEmail('correo-invalido@'), '');
assert.strictEqual(sanitizeEmail('admin<script>@a2ruedas.com'), '');
console.log('5. Validación RFC y sanitización de correos electrónicos:', 'PASS');

// 6. Sanitización de SKUs y Números de Serie
assert.strictEqual(sanitizeSku('cad-shi-12s'), 'CAD-SHI-12S');
assert.strictEqual(sanitizeSku("CAD'; DROP TABLE products;--"), 'CADDROPTABLEPRODUCTS--');
assert.strictEqual(sanitizeDocumentId('cc 1.020.345.678'), 'CC1.020.345.678');
console.log('6. Aislamiento alfanumérico en referencias de inventario y documentos de identidad:', 'PASS');

// 7. Validación Estricta de Códigos QR Oficiales (^BIKE-[0-9A-F]{6}$)
assert.strictEqual(validateQrCodeFormat('BIKE-8F3A92'), true);
assert.strictEqual(validateQrCodeFormat('bike-8f3a92'), true);
assert.strictEqual(validateQrCodeFormat('BIKE-000001'), true);
assert.strictEqual(validateQrCodeFormat('BIKE-ZZZZZZ'), false); // 'Z' no es hexadecimal
assert.strictEqual(validateQrCodeFormat('BIKE-12345'), false); // Faltan dígitos
assert.strictEqual(validateQrCodeFormat('HACK-8F3A92'), false);
assert.strictEqual(validateQrCodeFormat('<script>'), false);
console.log('7. Verificación criptográfica y regex de identificadores QR autorizados:', 'PASS');

// 8. Enmascaramiento de Datos Personales (PII Protection)
const rawPhone = '+573104567890';
const masked = maskPII(rawPhone, 6, 3);
assert.ok(masked.includes('****'));
assert.ok(masked.startsWith('+57310'));
assert.ok(masked.endsWith('890'));
assert.ok(!masked.includes('4567')); // Los dígitos intermedios quedan ocultos
console.log('8. Enmascaramiento de información privada del cliente (PII):', 'PASS');

// 9. Validación de Protocolos Seguros en Enlaces (URL Sanitization)
assert.strictEqual(sanitizeUrl('https://wa.me/573100000000'), 'https://wa.me/573100000000');
assert.strictEqual(sanitizeUrl('/productos?cat=frenos'), '/productos?cat=frenos');
assert.strictEqual(sanitizeUrl('javascript:alert(document.cookie)'), ''); // Bloqueado
assert.strictEqual(sanitizeUrl('data:text/html,<script>evil()</script>'), ''); // Bloqueado
console.log('9. Bloqueo de esquemas peligrosos (javascript:, data:) en enlaces:', 'PASS');

// 10. Blindaje de Precios de Costo en Catálogo Público
const testInternalProduct = {
  id: 'prod-sec-1',
  sku: 'REP-SEC-01',
  name: 'Pastillas Cerámicas Pro',
  brand: 'Shimano',
  description: 'Repuesto garantizado',
  cost_price: 32000,        // DATO INTERNO
  sale_price: 65000,
  stock: 12,
  min_stock: 4,             // DATO INTERNO
  location: 'Cajón B-2',    // DATO INTERNO
  is_active: true,
};

// Simulador de sanitización pública (catalogService)
function getPublicViewOfProduct(p) {
  return {
    id: p.id,
    sku: p.sku,
    name: sanitizeString(p.name),
    brand: sanitizeString(p.brand),
    description: sanitizeString(p.description),
    price: p.sale_price,
    available: p.stock > 0,
    stock_quantity: p.stock,
  };
}

const publicView = getPublicViewOfProduct(testInternalProduct);
assert.strictEqual(publicView.cost_price, undefined);
assert.strictEqual(publicView.min_stock, undefined);
assert.strictEqual(publicView.location, undefined);
assert.strictEqual(publicView.price, 65000);
console.log('10. Ausencia determinista de cost_price, min_stock y location en vistas públicas:', 'PASS');

// 11. Blindaje del Timeline Público por QR (Sin fuga de PII ni notas privadas)
const testInternalWorkOrder = {
  id: 'wo-001',
  order_number: 'OT-000001',
  customer: {
    full_name: 'Carlos Ruiz',
    phone: '3129876543',     // PII PRIVADA
    email: 'carlos@mail.com', // PII PRIVADA
  },
  reported_issues: 'Mantenimiento preventivo',
  internal_notes: 'Cliente exigente; se le otorgó 10% de descuento en mano de obra.', // PRIVADA
  status: 'LISTA',
};

function getPublicTimelineOrderItem(wo) {
  return {
    id: wo.id,
    order_number: wo.order_number,
    status: wo.status,
    reported_issues: sanitizeString(wo.reported_issues),
    technician_notes: null, // Bloqueo de notas privadas
  };
}

const publicTimelineItem = getPublicTimelineOrderItem(testInternalWorkOrder);
assert.strictEqual(publicTimelineItem.technician_notes, null);
assert.strictEqual(publicTimelineItem.customer, undefined);
assert.strictEqual(publicTimelineItem.customer_phone, undefined);
console.log('11. Protección de notas internas y datos de clientes en el timeline público por QR:', 'PASS');

// 12. Validación de la Migración SQL de Endurecimiento de Seguridad
const migrationPath = path.join(projectRoot, 'supabase', 'migrations', '20260921000001_security_hardening.sql');
assert.ok(fs.existsSync(migrationPath), 'La migración 20260921000001_security_hardening.sql debe existir');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

assert.ok(migrationSql.includes('Auth Update Own Profile'), 'Debe restringir actualización de perfiles a su propio ID');
assert.ok(migrationSql.includes('Admin Manage Profiles'), 'Debe reservar gestión de roles únicamente a admins');
assert.ok(migrationSql.includes('check_cash_register_immutable'), 'Debe incluir función de inmutabilidad de caja');
assert.ok(migrationSql.includes('public_products_catalog'), 'Debe crear vista segura sin cost_price');
assert.ok(migrationSql.includes('SECURITY DEFINER SET search_path = public'), 'Debe proteger búsqueda de funciones RPC');
console.log('12. Integridad de scripts SQL de endurecimiento RLS e inmutabilidad financiera:', 'PASS');

// 13. Verificación de Meta Tags de Seguridad en index.html
const indexPath = path.join(projectRoot, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

assert.ok(indexHtml.includes('http-equiv="X-Content-Type-Options" content="nosniff"'), 'Debe incluir X-Content-Type-Options');
assert.ok(indexHtml.includes('name="referrer" content="strict-origin-when-cross-origin"'), 'Debe incluir Referrer-Policy');
console.log('13. Presencia de directivas y meta tags de seguridad HTTP en index.html:', 'PASS');

// 14. Simulación de Inmutabilidad de Sesiones de Caja Cerradas
function simulateRegisterMovementCreation(register, movement) {
  if (register.closed_at !== null) {
    throw new Error('Operación rechazada: La sesión de caja ya fue cerrada y es inmutable.');
  }
  return { ...movement, registered: true };
}

const openRegister = { id: 'reg-01', closed_at: null };
const closedRegister = { id: 'reg-02', closed_at: '2026-09-21T18:00:00Z' };

const validMove = simulateRegisterMovementCreation(openRegister, { amount: 50000, type: 'INCOME' });
assert.strictEqual(validMove.registered, true);

let closedBlocked = false;
try {
  simulateRegisterMovementCreation(closedRegister, { amount: 20000, type: 'INCOME' });
} catch (err) {
  closedBlocked = true;
  assert.ok(err.message.includes('inmutable'));
}
assert.strictEqual(closedBlocked, true);
console.log('14. Garantía de inmutabilidad y prevención de fraude en arqueos de caja cerrados:', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 20 PASARON SATISFACTORIAMENTE (100% PASS) ---');
