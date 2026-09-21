import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== INICIANDO PRUEBAS DE PREPARACIÓN PARA DESPLIEGUE EN PRODUCCIÓN (FASE 25) ===\n');

// 1. Verificación de public/_redirects
const redirectsPath = path.join(rootDir, 'public/_redirects');
assert.ok(fs.existsSync(redirectsPath), 'public/_redirects debe existir');
const redirectsContent = fs.readFileSync(redirectsPath, 'utf8');
assert.ok(redirectsContent.includes('/*'), 'Debe cubrir todas las rutas con /*');
assert.ok(redirectsContent.includes('/index.html'), 'Debe redirigir a /index.html');
assert.ok(redirectsContent.includes('200'), 'Debe responder con código 200');
console.log('1. [DESPLIEGUE] Archivo public/_redirects configurado para enrutamiento SPA (Netlify/Cloudflare):', 'PASS');

// 2. Verificación de netlify.toml
const netlifyPath = path.join(rootDir, 'netlify.toml');
assert.ok(fs.existsSync(netlifyPath), 'netlify.toml debe existir');
const netlifyContent = fs.readFileSync(netlifyPath, 'utf8');
assert.ok(netlifyContent.includes('publish = "dist"'), 'netlify.toml debe publicar directorio dist');
assert.ok(netlifyContent.includes('npm run build'), 'netlify.toml debe ejecutar npm run build');
assert.ok(netlifyContent.includes('status = 200'), 'netlify.toml debe reescribir con status = 200');
console.log('2. [DESPLIEGUE] Configuración de compilación y redirección SPA en netlify.toml:', 'PASS');

// 3. Verificación de cabeceras de seguridad en netlify.toml
assert.ok(netlifyContent.includes('X-Frame-Options'), 'netlify.toml debe incluir X-Frame-Options');
assert.ok(netlifyContent.includes('X-Content-Type-Options'), 'netlify.toml debe incluir X-Content-Type-Options');
assert.ok(netlifyContent.includes('Referrer-Policy'), 'netlify.toml debe incluir Referrer-Policy');
assert.ok(netlifyContent.includes('Permissions-Policy'), 'netlify.toml debe incluir Permissions-Policy');
console.log('3. [SEGURIDAD] Cabeceras HTTP de protección (X-Frame-Options, nosniff, Referrer, Permissions) en netlify.toml:', 'PASS');

// 4. Verificación de vercel.json
const vercelPath = path.join(rootDir, 'vercel.json');
assert.ok(fs.existsSync(vercelPath), 'vercel.json debe existir');
const vercelContent = fs.readFileSync(vercelPath, 'utf8');
const vercelJson = JSON.parse(vercelContent);
assert.ok(Array.isArray(vercelJson.rewrites), 'vercel.json debe tener sección rewrites');
assert.ok(vercelJson.rewrites.some((r) => r.destination === '/index.html'), 'vercel.json debe reescribir a /index.html');
assert.ok(Array.isArray(vercelJson.headers), 'vercel.json debe tener sección headers');
console.log('4. [DESPLIEGUE] Configuración de reescrituras SPA y cabeceras en vercel.json:', 'PASS');

// 5. Verificación de public/robots.txt
const robotsPath = path.join(rootDir, 'public/robots.txt');
assert.ok(fs.existsSync(robotsPath), 'public/robots.txt debe existir');
const robotsContent = fs.readFileSync(robotsPath, 'utf8');
assert.ok(robotsContent.includes('Allow: /'), 'robots.txt debe permitir indexar la raíz');
assert.ok(robotsContent.includes('Allow: /productos'), 'robots.txt debe permitir indexar productos');
assert.ok(robotsContent.includes('Disallow: /admin'), 'robots.txt debe bloquear acceso de rastreadores a /admin');
assert.ok(robotsContent.includes('Disallow: /login'), 'robots.txt debe bloquear acceso de rastreadores a /login');
assert.ok(robotsContent.includes('Sitemap:'), 'robots.txt debe incluir referencia al sitemap');
console.log('5. [SEO & PRIVACIDAD] robots.txt configurado (permitiendo catálogo y protegiendo rutas administrativas):', 'PASS');

// 6. Verificación de public/sitemap.xml
const sitemapPath = path.join(rootDir, 'public/sitemap.xml');
assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml debe existir');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
assert.ok(sitemapContent.includes('<urlset'), 'sitemap.xml debe ser un documento XML urlset válido');
assert.ok(sitemapContent.includes('https://a2ruedas.com/'), 'sitemap.xml debe contener la URL raíz');
assert.ok(sitemapContent.includes('https://a2ruedas.com/productos'), 'sitemap.xml debe contener la URL de catálogo');
console.log('6. [SEO] sitemap.xml estándar con URLs públicas y frecuencias de rastreo:', 'PASS');

// 7. Verificación de scripts/predeployCheck.mjs
const predeployScriptPath = path.join(rootDir, 'scripts/predeployCheck.mjs');
assert.ok(fs.existsSync(predeployScriptPath), 'scripts/predeployCheck.mjs debe existir');
const scriptContent = fs.readFileSync(predeployScriptPath, 'utf8');
assert.ok(scriptContent.includes('tsc'), 'predeployCheck debe validar TypeScript');
assert.ok(scriptContent.includes('vite'), 'predeployCheck debe validar empaquetado de producción');
assert.ok(scriptContent.includes('qaRunner.mjs'), 'predeployCheck debe validar la batería de pruebas');
console.log('7. [AUTOMATIZACIÓN] Script autónomo de certificación previa al despliegue (scripts/predeployCheck.mjs):', 'PASS');

// 8. Verificación de comando preflight en package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
assert.ok(packageJson.scripts && packageJson.scripts.preflight, 'package.json debe definir script preflight');
console.log('8. [SCRIPTS] Comando npm run preflight registrado en package.json:', 'PASS');

// 9. Verificación de políticas de caché para Service Worker (revalidación inmediata)
assert.ok(netlifyContent.includes('/sw.js') && netlifyContent.includes('max-age=0'), 'netlify.toml debe revalidar /sw.js');
assert.ok(vercelContent.includes('/sw.js') && vercelContent.includes('max-age=0'), 'vercel.json debe revalidar /sw.js');
console.log('9. [CACHÉ PWA] Políticas de revalidación obligatoria para Service Worker (max-age=0, must-revalidate):', 'PASS');

// 10. Verificación de permisos de cámara en Permissions-Policy para QR
assert.ok(netlifyContent.includes('camera=(self)'), 'netlify.toml debe autorizar cámara para escáner QR');
assert.ok(vercelContent.includes('camera=(self)'), 'vercel.json debe autorizar cámara para escáner QR');
console.log('10. [HARDWARE] Permiso de cámara explícito para escaneo QR en Permissions-Policy:', 'PASS');

console.log('\n==============================================================================');
console.log('✔ TODAS LAS 10 VERIFICACIONES DE PREPARACIÓN PARA PRODUCCIÓN PASARON (100% PASS)');
console.log('==============================================================================');
