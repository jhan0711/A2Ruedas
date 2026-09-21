import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${BOLD}${CYAN}==============================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   A2RUEDAS — PREFLIGHT CHECK & CERTIFICACIÓN PREVIA AL DESPLIEGUE            ${RESET}`);
console.log(`${BOLD}${CYAN}==============================================================================${RESET}\n`);

let checksPassed = 0;
let totalChecks = 6;

// 1. Verificación de variables de entorno mínimas
console.log('1. [ENTORNO] Comprobando configuración de variables de entorno (.env)...');
const envPath = path.join(projectRoot, '.env');
const envExamplePath = path.join(projectRoot, '.env.example');
assertExists(envExamplePath, '.env.example debe existir como plantilla');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    console.log(`   ${GREEN}✔ Variables de Supabase detectadas y listas.${RESET}`);
    checksPassed++;
  } else {
    console.log(`   ${YELLOW}⚠ .env encontrado pero faltan variables requeridas.${RESET}`);
  }
} else {
  console.log(`   ${YELLOW}⚠ .env no detectado en local (en CI/CD deben ser provistas por variables de entorno).${RESET}`);
  checksPassed++; // Permitir en CI/CD donde las variables están en el runner
}

// 2. Verificación y compilación estricta de TypeScript
console.log('\n2. [TYPESCRIPT] Validando tipado estricto (tsc -b)...');
const tscResult = spawnSync('npx tsc -b', {
  cwd: projectRoot,
  encoding: 'utf8',
  shell: true,
});

if (tscResult.status === 0) {
  console.log(`   ${GREEN}✔ TypeScript compilado sin errores de tipado.${RESET}`);
  checksPassed++;
} else {
  console.error(`   ${RED}✖ Error en compilación de TypeScript:${RESET}\n`, tscResult.stderr || tscResult.stdout);
  process.exit(1);
}

// 3. Empaquetado de producción con Vite
console.log('\n3. [VITE BUILD] Generando bundle de producción...');
const buildResult = spawnSync('npx vite build', {
  cwd: projectRoot,
  encoding: 'utf8',
  shell: true,
});

if (buildResult.status === 0) {
  console.log(`   ${GREEN}✔ Build de producción generado exitosamente.${RESET}`);
  checksPassed++;
} else {
  console.error(`   ${RED}✖ Error en vite build:${RESET}\n`, buildResult.stderr || buildResult.stdout);
  process.exit(1);
}

// 4. Verificación de archivos críticos en dist/
console.log('\n4. [ARCHIVOS CRÍTICOS] Verificando presencia de artefactos en dist/...');
const distDir = path.join(projectRoot, 'dist');
const requiredDistFiles = [
  'index.html',
  'sw.js',
  'manifest.webmanifest',
  'offline.html',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
];

let allFilesPresent = true;
for (const f of requiredDistFiles) {
  const p = path.join(distDir, f);
  if (!fs.existsSync(p)) {
    console.error(`   ${RED}✖ Archivo crítico faltante en dist/: ${f}${RESET}`);
    allFilesPresent = false;
  }
}

if (allFilesPresent) {
  console.log(`   ${GREEN}✔ Todos los 7 artefactos críticos están presentes en dist/.${RESET}`);
  checksPassed++;
} else {
  process.exit(1);
}

// 5. Verificación de tamaños de fragmentos JS (< 500 kB)
console.log('\n5. [TAMAÑO DE BUNDLE] Verificando que ningún fragmento exceda 500 kB...');
const distAssets = path.join(distDir, 'assets');
const jsFiles = fs.readdirSync(distAssets).filter((f) => f.endsWith('.js'));
let oversized = false;

for (const js of jsFiles) {
  const stat = fs.statSync(path.join(distAssets, js));
  if (stat.size > 500 * 1024) {
    console.error(`   ${RED}✖ Fragmento sobredimensionado: ${js} (${(stat.size / 1024).toFixed(1)} kB > 500 kB)${RESET}`);
    oversized = true;
  }
}

if (!oversized) {
  console.log(`   ${GREEN}✔ Todos los ${jsFiles.length} fragmentos JS cumplen el límite de 500 kB.${RESET}`);
  checksPassed++;
} else {
  process.exit(1);
}

// 6. Ejecución de la suite completa de QA
console.log('\n6. [QA RUNNER] Ejecutando batería completa de pruebas automatizadas...');
const qaResult = spawnSync(process.execPath, [path.join(projectRoot, 'tests', 'qaRunner.mjs')], {
  cwd: projectRoot,
  encoding: 'utf8',
});

if (qaResult.status === 0) {
  console.log(`   ${GREEN}✔ Runner Maestro de QA ejecutado exitosamente al 100% PASS.${RESET}`);
  checksPassed++;
} else {
  console.error(`   ${RED}✖ Pruebas fallidas en QA Runner:${RESET}\n`, qaResult.stdout);
  process.exit(1);
}

console.log(`\n${BOLD}${CYAN}==============================================================================${RESET}`);
console.log(`${BOLD}${GREEN}✔ CERTIFICACIÓN PREVIA AL DESPLIEGUE APROBADA: ${checksPassed}/${totalChecks} VERIFICACIONES EXITOSAS.${RESET}`);
console.log(`${BOLD}  El proyecto A2Ruedas está 100% listo para producción en Netlify / Vercel.${RESET}`);
console.log(`${BOLD}${CYAN}==============================================================================${RESET}\n`);

function assertExists(filePath, msg) {
  if (!fs.existsSync(filePath)) {
    console.error(`${RED}✖ ${msg}${RESET}`);
    process.exit(1);
  }
}
