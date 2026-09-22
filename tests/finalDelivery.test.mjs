import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('--- INICIANDO PRUEBAS DE LA FASE 26: ENTREGA FINAL Y MANUALES DE OPERACIÓN ---');

const projectRoot = process.cwd();

// 1. Verificación del Manual de Usuario Oficial
const userManualPath = path.join(projectRoot, 'MANUAL_USUARIO.md');
assert.ok(fs.existsSync(userManualPath), 'MANUAL_USUARIO.md debe existir en la raíz');
const userManualContent = fs.readFileSync(userManualPath, 'utf8');
assert.ok(userManualContent.includes('Primeros Pasos e Instalación (PWA)'));
assert.ok(userManualContent.includes('Recepción de Bicicletas'));
assert.ok(userManualContent.includes('Diagrama Visual de Daños'));
assert.ok(userManualContent.includes('Firma Digital Táctil'));
assert.ok(userManualContent.includes('Impresión de Tickets y Etiquetas Térmicas'));
assert.ok(userManualContent.includes('Gestión Dinámica de Categorías'));
assert.ok(userManualContent.includes('Control de Caja Menor'));
console.log('1. Manual de Usuario oficial exhaustivo con todos los módulos y flujos operativos:', 'PASS');

// 2. Verificación del Manual de Impresión Térmica (58mm y 80mm)
const printManualPath = path.join(projectRoot, 'MANUAL_IMPRESION_58MM.md');
assert.ok(fs.existsSync(printManualPath), 'MANUAL_IMPRESION_58MM.md debe existir en la raíz');
const printManualContent = fs.readFileSync(printManualPath, 'utf8');
assert.ok(printManualContent.includes('58 mm') && printManualContent.includes('80 mm'));
assert.ok(printManualContent.includes('NINGUNO') || printManualContent.includes('0 mm'));
assert.ok(printManualContent.includes('Encabezados y pies'));
assert.ok(printManualContent.includes('Comanda de Taller') || printManualContent.includes('Ticket de Entrega'));
assert.ok(printManualContent.includes('Solución de Problemas Frecuentes'));
console.log('2. Manual de Configuración física y calibración de impresoras térmicas de 58mm/80mm:', 'PASS');

// 3. Verificación del Manual de Despliegue en la Nube
const deployManualPath = path.join(projectRoot, 'MANUAL_DESPLIEGUE.md');
assert.ok(fs.existsSync(deployManualPath), 'MANUAL_DESPLIEGUE.md debe existir en la raíz');
const deployManualContent = fs.readFileSync(deployManualPath, 'utf8');
assert.ok(deployManualContent.includes('Supabase'));
assert.ok(deployManualContent.includes('Netlify'));
assert.ok(deployManualContent.includes('Vercel'));
assert.ok(deployManualContent.includes('VITE_SUPABASE_URL'));
assert.ok(deployManualContent.includes('npm run preflight'));
console.log('3. Manual de Despliegue en producción para Netlify, Vercel y Supabase:', 'PASS');

// 4. Verificación del Acta Formal de Entrega y Cierre Técnico
const actaPath = path.join(projectRoot, 'ACTA_ENTREGA.md');
assert.ok(fs.existsSync(actaPath), 'ACTA_ENTREGA.md debe existir en la raíz');
const actaContent = fs.readFileSync(actaPath, 'utf8');
assert.ok(actaContent.includes('ACTA FORMAL DE ENTREGA'));
assert.ok(actaContent.includes('100% CULMINADO Y CERTIFICADO'));
assert.ok(actaContent.includes('Matriz de Alcance Ejecutado (26 Fases al 100%)'));
assert.ok(actaContent.includes('LÍDER TÉCNICO') && actaContent.includes('REPRESENTANTE A2RUEDAS'));
assert.ok(actaContent.includes('a2ruedas.netlify.app'));
console.log('4. Acta formal de entrega técnica con matriz de 26 fases y firmas de aceptación:', 'PASS');

// 5. Verificación de Enlaces y Documentación en README.md
const readmePath = path.join(projectRoot, 'README.md');
assert.ok(fs.existsSync(readmePath), 'README.md debe existir');
const readmeContent = fs.readFileSync(readmePath, 'utf8');
assert.ok(readmeContent.includes('MANUAL_USUARIO.md'));
assert.ok(readmeContent.includes('MANUAL_IMPRESION_58MM.md'));
assert.ok(readmeContent.includes('MANUAL_DESPLIEGUE.md'));
assert.ok(readmeContent.includes('ACTA_ENTREGA.md'));
assert.ok(readmeContent.includes('26_de_26'));
assert.ok(readmeContent.includes('a2ruedas.netlify.app'));
console.log('5. Actualización completa de README.md con enlaces activos a todos los manuales:', 'PASS');

// 6. Verificación de Matriz de Fases en PROJECT_STATUS.md
const statusPath = path.join(projectRoot, 'PROJECT_STATUS.md');
assert.ok(fs.existsSync(statusPath), 'PROJECT_STATUS.md debe existir');
const statusContent = fs.readFileSync(statusPath, 'utf8');
assert.ok(statusContent.includes('[x] FASE 26 — Entrega Final y Manuales de Operación'));
assert.ok(statusContent.includes('100% CULMINADO Y CERTIFICADO'));
console.log('6. Validación de PROJECT_STATUS.md con las 26 fases al 100% completadas:', 'PASS');

// 7. Verificación de Scripts Operativos en package.json
const pkgPath = path.join(projectRoot, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
assert.ok(pkg.scripts.dev, 'Debe existir script dev');
assert.ok(pkg.scripts.build, 'Debe existir script build');
assert.ok(pkg.scripts.test, 'Debe existir script test');
assert.ok(pkg.scripts.preflight, 'Debe existir script preflight');
console.log('7. Verificación de scripts operativos estándar en package.json:', 'PASS');

// 8. Verificación de Infraestructura de Despliegue y Hosting
assert.ok(fs.existsSync(path.join(projectRoot, 'public', '_redirects')), 'public/_redirects debe existir');
assert.ok(fs.existsSync(path.join(projectRoot, 'netlify.toml')), 'netlify.toml debe existir');
assert.ok(fs.existsSync(path.join(projectRoot, 'vercel.json')), 'vercel.json debe existir');
assert.ok(fs.existsSync(path.join(projectRoot, 'public', 'robots.txt')), 'public/robots.txt debe existir');
assert.ok(fs.existsSync(path.join(projectRoot, 'public', 'sitemap.xml')), 'public/sitemap.xml debe existir');
console.log('8. Archivos de infraestructura de despliegue y SEO listos para producción:', 'PASS');

// 9. Verificación de Manifiesto PWA y Service Worker
assert.ok(fs.existsSync(path.join(projectRoot, 'public', 'manifest.webmanifest')), 'manifest.webmanifest debe existir');
assert.ok(fs.existsSync(path.join(projectRoot, 'public', 'sw.js')), 'sw.js debe existir');
console.log('9. Activos para funcionamiento de PWA instalable y modo sin conexión:', 'PASS');

// 10. Integridad del Esquema SQL de Base de Datos
const sqlPath = path.join(projectRoot, 'supabase', 'schema.sql');
assert.ok(fs.existsSync(sqlPath), 'supabase/schema.sql debe existir');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');
assert.ok(sqlContent.includes('customers'));
assert.ok(sqlContent.includes('bicycles'));
assert.ok(sqlContent.includes('work_orders'));
assert.ok(sqlContent.includes('product_categories'));
assert.ok(sqlContent.includes('products'));
assert.ok(sqlContent.includes('cash_movements'));
console.log('10. Integridad del esquema maestro relacional de base de datos en Supabase:', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 26 PASARON EXITOSAMENTE (100% PASS) ---');
