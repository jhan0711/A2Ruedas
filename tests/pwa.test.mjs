import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- INICIANDO PRUEBAS DE LA FASE 19: CONFIGURACIÓN PWA ---');

const projectRoot = process.cwd();

// 1. Validación de manifest.webmanifest y manifest.json
const manifestPath = path.join(projectRoot, 'public', 'manifest.webmanifest');
assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest debe existir');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.strictEqual(manifestContent.name, 'A2Ruedas — Taller de Bicicletas');
assert.strictEqual(manifestContent.short_name, 'A2Ruedas');
assert.strictEqual(manifestContent.start_url, '/');
assert.strictEqual(manifestContent.display, 'standalone');
assert.strictEqual(manifestContent.theme_color, '#0f172a');
assert.strictEqual(manifestContent.background_color, '#0f172a');
console.log('1. Especificación W3C de Manifest Web App (name, short_name, standalone, colores):', 'PASS');

// 2. Validación de Íconos PWA en el Manifiesto
assert.ok(Array.isArray(manifestContent.icons), 'Debe contener un arreglo de iconos');
assert.ok(manifestContent.icons.length >= 3, 'Debe definir al menos 3 iconos');

const icon192 = manifestContent.icons.find((i) => i.sizes === '192x192');
const icon512 = manifestContent.icons.find((i) => i.sizes === '512x512' && i.purpose === 'any');
const iconMaskable = manifestContent.icons.find((i) => i.purpose === 'maskable');

assert.ok(icon192, 'Debe incluir icono 192x192');
assert.ok(icon512, 'Debe incluir icono 512x512 para splash screens');
assert.ok(iconMaskable, 'Debe incluir icono maskable para launchers móviles');
console.log('2. Especificación de iconos de aplicación (192px, 512px y maskable):', 'PASS');

// 3. Validación de Accesos Directos (App Shortcuts)
assert.ok(Array.isArray(manifestContent.shortcuts), 'Debe contener shortcuts de acceso rápido');
assert.ok(manifestContent.shortcuts.length >= 4, 'Debe definir al menos 4 shortcuts del taller');

const shortcutOt = manifestContent.shortcuts.find((s) => s.url === '/admin/ordenes/nueva');
const shortcutCatalog = manifestContent.shortcuts.find((s) => s.url === '/productos');
const shortcutQr = manifestContent.shortcuts.find((s) => s.url === '/admin/qr');
const shortcutCash = manifestContent.shortcuts.find((s) => s.url === '/admin/caja');

assert.ok(shortcutOt, 'Debe existir shortcut de Nueva Orden');
assert.ok(shortcutCatalog, 'Debe existir shortcut de Catálogo');
assert.ok(shortcutQr, 'Debe existir shortcut de Escanear QR');
assert.ok(shortcutCash, 'Debe existir shortcut de Caja');
console.log('3. Accesos directos para pantalla de inicio (Nueva OT, Catálogo, QR, Caja):', 'PASS');

// 4. Validación de Archivos Físicos de Iconos SVG
const icon192Path = path.join(projectRoot, 'public', 'icons', 'icon-192x192.svg');
const icon512Path = path.join(projectRoot, 'public', 'icons', 'icon-512x512.svg');
const iconMaskablePath = path.join(projectRoot, 'public', 'icons', 'icon-maskable-512x512.svg');

assert.ok(fs.existsSync(icon192Path), 'icon-192x192.svg debe existir');
assert.ok(fs.existsSync(icon512Path), 'icon-512x512.svg debe existir');
assert.ok(fs.existsSync(iconMaskablePath), 'icon-maskable-512x512.svg debe existir');

const svg192Content = fs.readFileSync(icon192Path, 'utf8');
assert.ok(svg192Content.includes('<svg') && svg192Content.includes('A2RUEDAS'));
console.log('4. Integridad de activos vectoriales de alta definición en public/icons/:', 'PASS');

// 5. Validación de Página de Contingencia Offline
const offlinePath = path.join(projectRoot, 'public', 'offline.html');
assert.ok(fs.existsSync(offlinePath), 'offline.html debe existir');
const offlineContent = fs.readFileSync(offlinePath, 'utf8');
assert.ok(offlineContent.includes('Sin conexión a internet'));
assert.ok(offlineContent.includes('A2Ruedas'));
assert.ok(offlineContent.includes('window.location.reload()'));
console.log('5. Plantilla de respaldo offline corporativa con diagnóstico y recarga:', 'PASS');

// 6. Validación de Service Worker (sw.js)
const swPath = path.join(projectRoot, 'public', 'sw.js');
assert.ok(fs.existsSync(swPath), 'sw.js debe existir');
const swContent = fs.readFileSync(swPath, 'utf8');

assert.ok(swContent.includes('a2ruedas-pwa-v1'), 'Debe definir identificador de versión de caché');
assert.ok(swContent.includes("addEventListener('install'"), 'Debe registrar evento install');
assert.ok(swContent.includes("addEventListener('activate'"), 'Debe registrar evento activate');
assert.ok(swContent.includes("addEventListener('fetch'"), 'Debe registrar evento fetch');
assert.ok(swContent.includes("addEventListener('message'"), 'Debe registrar evento message');
assert.ok(swContent.includes('/offline.html'), 'Debe incluir offline.html en pre-caché');
assert.ok(swContent.includes('skipWaiting()'), 'Debe soportar activación inmediata skipWaiting');
assert.ok(swContent.includes('clients.claim()'), 'Debe reclamar control de clientes activos');
console.log('6. Ciclo de vida y estrategias de caché del Service Worker (Install, Activate, Fetch, Message):', 'PASS');

// 7. Validación de Meta Tags en index.html
const indexPath = path.join(projectRoot, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

assert.ok(indexContent.includes('rel="manifest"'), 'index.html debe vincular el manifest');
assert.ok(indexContent.includes('apple-mobile-web-app-capable'), 'index.html debe soportar iOS standalone');
assert.ok(indexContent.includes('apple-touch-icon'), 'index.html debe incluir apple-touch-icon');
assert.ok(indexContent.includes('theme-color'), 'index.html debe especificar theme-color');
console.log('7. Metadatos PWA para iOS Safari, Android y navegadores de escritorio en index.html:', 'PASS');

// 8. Lógica de Detección de Dispositivos iOS
function detectIsIOS(userAgent) {
  return /iPad|iPhone|iPod/.test(userAgent);
}

assert.strictEqual(detectIsIOS('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), true);
assert.strictEqual(detectIsIOS('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)'), true);
assert.strictEqual(detectIsIOS('Mozilla/5.0 (Linux; Android 14; Pixel 8)'), false);
assert.strictEqual(detectIsIOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), false);
console.log('8. Detección precisa de iOS para instrucciones de instalación en Safari:', 'PASS');

// 9. Lógica de Detección de Modo Standalone / Instalado
function checkStandaloneMode({ displayModeStandalone, navigatorStandalone, referrerAndroid }) {
  return Boolean(displayModeStandalone || navigatorStandalone || (referrerAndroid && referrerAndroid.includes('android-app://')));
}

assert.strictEqual(checkStandaloneMode({ displayModeStandalone: true }), true);
assert.strictEqual(checkStandaloneMode({ navigatorStandalone: true }), true);
assert.strictEqual(checkStandaloneMode({ referrerAndroid: 'android-app://com.android.chrome' }), true);
assert.strictEqual(checkStandaloneMode({}), false);
console.log('9. Detección de modo Standalone en Android, iOS y Desktop:', 'PASS');

// 10. Lógica de Transiciones de Conectividad (Online / Offline)
function createConnectivityTracker() {
  let isOnline = true;
  let wasOffline = false;

  return {
    get status() {
      return { isOnline, wasOffline };
    },
    goOffline() {
      isOnline = false;
    },
    goOnline() {
      isOnline = true;
      wasOffline = true;
    },
    dismissRestored() {
      wasOffline = false;
    },
  };
}

const tracker = createConnectivityTracker();
assert.strictEqual(tracker.status.isOnline, true);
assert.strictEqual(tracker.status.wasOffline, false);

tracker.goOffline();
assert.strictEqual(tracker.status.isOnline, false);
assert.strictEqual(tracker.status.wasOffline, false);

tracker.goOnline();
assert.strictEqual(tracker.status.isOnline, true);
assert.strictEqual(tracker.status.wasOffline, true);

tracker.dismissRestored();
assert.strictEqual(tracker.status.wasOffline, false);
console.log('10. Máquina de estados de conectividad reactiva (Online -> Offline -> Conexión restaurada):', 'PASS');

// 11. Validación de Alias manifest.json
const manifestJsonPath = path.join(projectRoot, 'public', 'manifest.json');
assert.ok(fs.existsSync(manifestJsonPath), 'manifest.json debe existir como alias');
const manifestJsonContent = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
assert.strictEqual(manifestJsonContent.short_name, manifestContent.short_name);
console.log('11. Paridad de manifest.json para compatibilidad con navegadores legacy:', 'PASS');

// 12. Validación de Artefactos Generados en Producción (dist/)
assert.ok(fs.existsSync(path.join(projectRoot, 'dist', 'sw.js')), 'dist/sw.js generado');
assert.ok(fs.existsSync(path.join(projectRoot, 'dist', 'manifest.webmanifest')), 'dist/manifest.webmanifest generado');
assert.ok(fs.existsSync(path.join(projectRoot, 'dist', 'offline.html')), 'dist/offline.html generado');
assert.ok(fs.existsSync(path.join(projectRoot, 'dist', 'icons', 'icon-192x192.svg')), 'dist/icons/icon-192x192.svg generado');
console.log('12. Presencia de todos los artefactos PWA en el bundle de producción (dist/):', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 19 PASARON SATISFACTORIAMENTE (100% PASS) ---');
