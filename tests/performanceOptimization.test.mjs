import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== INICIANDO PRUEBAS DE OPTIMIZACIÓN DE PERFORMANCE (FASE 24) ===\n');

// 1. Verificación de React.lazy y Code-Splitting en routes.tsx
const routesPath = path.join(rootDir, 'src/app/routes.tsx');
assert.ok(fs.existsSync(routesPath), 'El archivo routes.tsx debe existir');
const routesContent = fs.readFileSync(routesPath, 'utf8');
assert.ok(routesContent.includes('lazy('), 'routes.tsx debe utilizar lazy() para carga perezosa de rutas');
assert.ok(routesContent.includes('Suspense'), 'routes.tsx debe importar y utilizar Suspense');
assert.ok(routesContent.includes('import('), 'routes.tsx debe utilizar importaciones dinámicas');
console.log('1. [PERF] Enrutador configurado con React.lazy e importaciones dinámicas para división de código (Code-Splitting):', 'PASS');

// 2. Verificación de Suspense con fallback en layouts
const adminLayoutContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/AdminLayout.tsx'), 'utf8');
assert.ok(adminLayoutContent.includes('<Suspense'), 'AdminLayout debe envolver Outlet con Suspense');
assert.ok(adminLayoutContent.includes('PageLoadingFallback'), 'AdminLayout debe usar PageLoadingFallback como fallback');

const publicLayoutContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/PublicLayout.tsx'), 'utf8');
assert.ok(publicLayoutContent.includes('<Suspense'), 'PublicLayout debe envolver Outlet con Suspense');
assert.ok(publicLayoutContent.includes('PageLoadingFallback'), 'PublicLayout debe usar PageLoadingFallback como fallback');
console.log('2. [PERF] Contenedores Layout envolviendo Outlet con Suspense y PageLoadingFallback sin parpadeos de interfaz:', 'PASS');

// 3. Verificación de PageLoadingFallback componente
const fallbackPath = path.join(rootDir, 'src/components/ui/PageLoadingFallback.tsx');
assert.ok(fs.existsSync(fallbackPath), 'PageLoadingFallback.tsx debe existir');
const fallbackContent = fs.readFileSync(fallbackPath, 'utf8');
assert.ok(fallbackContent.includes('role="status"'), 'PageLoadingFallback debe tener role="status"');
assert.ok(fallbackContent.includes('aria-busy="true"'), 'PageLoadingFallback debe anunciar aria-busy="true"');
assert.ok(fallbackContent.includes('Skeleton'), 'PageLoadingFallback debe usar Skeleton para evitar Layout Shift (CLS)');
console.log('3. [PERF] Componente PageLoadingFallback accesible con role="status", aria-busy="true" y siluetas esqueleto:', 'PASS');

// 4. Verificación de exportación en index.ts
const uiIndexContent = fs.readFileSync(path.join(rootDir, 'src/components/ui/index.ts'), 'utf8');
assert.ok(uiIndexContent.includes("export * from './PageLoadingFallback'"), 'src/components/ui/index.ts debe exportar PageLoadingFallback');
console.log('4. [PERF] Exportación unificada de PageLoadingFallback en barrel file src/components/ui/index.ts:', 'PASS');

// 5. Verificación de manualChunks en vite.config.ts
const viteConfigPath = path.join(rootDir, 'vite.config.ts');
const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf8');
assert.ok(viteConfigContent.includes('manualChunks'), 'vite.config.ts debe definir manualChunks en rollupOptions');
assert.ok(viteConfigContent.includes('vendor-react'), 'vite.config.ts debe aislar vendor-react');
assert.ok(viteConfigContent.includes('vendor-supabase'), 'vite.config.ts debe aislar vendor-supabase');
assert.ok(viteConfigContent.includes('vendor-qr'), 'vite.config.ts debe aislar vendor-qr');
assert.ok(viteConfigContent.includes('vendor-icons'), 'vite.config.ts debe aislar vendor-icons');
console.log('5. [PERF] Estrategia de troceado granular de librerías vendor (React, Supabase, QR, Icons) en vite.config.ts:', 'PASS');

// 6. Verificación de archivos generados en dist/assets/
const distAssetsDir = path.join(rootDir, 'dist/assets');
assert.ok(fs.existsSync(distAssetsDir), 'El directorio dist/assets debe existir tras la compilación');
const distFiles = fs.readdirSync(distAssetsDir);
const jsFiles = distFiles.filter((f) => f.endsWith('.js'));
assert.ok(jsFiles.length >= 15, `Debe generar múltiples chunks JS independientes (generados: ${jsFiles.length}, mínimo esperado: 15)`);
console.log(`6. [PERF] Bundle de producción troceado exitosamente en ${jsFiles.length} fragmentos modulares:`, 'PASS');

// 7. Verificación de presencia de chunks vendor clave
const hasVendorReact = jsFiles.some((f) => f.startsWith('vendor-react'));
const hasVendorSupabase = jsFiles.some((f) => f.startsWith('vendor-supabase'));
const hasVendorQr = jsFiles.some((f) => f.startsWith('vendor-qr'));
assert.ok(hasVendorReact, 'Debe existir chunk de vendor-react en dist/assets/');
assert.ok(hasVendorSupabase, 'Debe existir chunk de vendor-supabase en dist/assets/');
assert.ok(hasVendorQr, 'Debe existir chunk de vendor-qr en dist/assets/');
console.log('7. [PERF] Fragmentos vendor compilados y aislados (vendor-react, vendor-supabase, vendor-qr):', 'PASS');

// 8. Verificación de tamaño máximo de chunk (< 500 kB)
let largestJsSize = 0;
let largestJsFile = '';
for (const f of jsFiles) {
  const stat = fs.statSync(path.join(distAssetsDir, f));
  if (stat.size > largestJsSize) {
    largestJsSize = stat.size;
    largestJsFile = f;
  }
}
const largestJsKb = (largestJsSize / 1024).toFixed(1);
assert.ok(largestJsSize < 500 * 1024, `Ningún chunk JS debe exceder 500 kB. Mayor chunk: ${largestJsFile} (${largestJsKb} kB)`);
console.log(`8. [PERF] Eliminación de alerta de Vite: Ningún chunk excede 500 kB (Fragmento más grande: ${largestJsFile} con ${largestJsKb} kB):`, 'PASS');

// 9. Verificación de tamaño del entry point principal
const indexJsFile = jsFiles.find((f) => f.startsWith('index-'));
assert.ok(indexJsFile, 'Debe existir archivo index-*.js de entrada principal');
const indexStat = fs.statSync(path.join(distAssetsDir, indexJsFile));
const indexKb = (indexStat.size / 1024).toFixed(1);
assert.ok(indexStat.size < 200 * 1024, `El entry point inicial debe ser liviano (< 200 kB). Actual: ${indexKb} kB`);
console.log(`9. [PERF] Reducción drástica del punto de entrada inicial a ${indexKb} kB (reducción > 85% respecto a 1.41 MB):`, 'PASS');

// 10. Verificación de que HomePage y CatalogPage son chunks independientes
const hasHomePage = jsFiles.some((f) => f.startsWith('HomePage-'));
const hasCatalogPage = jsFiles.some((f) => f.startsWith('CatalogPage-'));
assert.ok(hasHomePage, 'HomePage debe ser un chunk independiente');
assert.ok(hasCatalogPage, 'CatalogPage debe ser un chunk independiente');
console.log('10. [PERF] Páginas públicas (HomePage, CatalogPage) desacopladas y descargadas solo bajo demanda:', 'PASS');

console.log('\n==============================================================================');
console.log('✔ TODAS LAS 10 VERIFICACIONES DE OPTIMIZACIÓN DE RENDIMIENTO PASARON (100% PASS)');
console.log('==============================================================================');
