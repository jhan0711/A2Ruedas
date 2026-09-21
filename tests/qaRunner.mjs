import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const testsDir = path.join(projectRoot, 'tests');

// ANSI Color Codes
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

console.log(`${BOLD}${CYAN}==============================================================================${RESET}`);
console.log(`${BOLD}${CYAN}   A2RUEDAS — RUNNER MAESTRO DE CONTROL DE CALIDAD (QA MASTER SUITE)          ${RESET}`);
console.log(`${BOLD}${CYAN}==============================================================================${RESET}\n`);

// 1. Descubrir todos los archivos de prueba en tests/
const testFiles = fs
  .readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.mjs'))
  .sort();

console.log(`${GRAY}Descubiertas ${testFiles.length} suites de prueba automatizadas.${RESET}\n`);

const results = [];
const startTime = Date.now();
let totalChecks = 0;

// 2. Ejecutar cada suite secuencialmente
for (let i = 0; i < testFiles.length; i++) {
  const fileName = testFiles[i];
  const filePath = path.join(testsDir, fileName);
  const suiteName = fileName.replace('.test.mjs', '');

  const suiteStart = Date.now();
  const processResult = spawnSync(process.execPath, [filePath], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: process.env,
  });
  const suiteDuration = Date.now() - suiteStart;

  const stdout = processResult.stdout || '';
  const stderr = processResult.stderr || '';
  const combined = stdout + '\n' + stderr;

  // Contar cuántos PASS tuvo esta suite
  const passMatches = (stdout.match(/:\s*PASS/gi) || []).length;
  totalChecks += passMatches;

  const passed = processResult.status === 0;

  results.push({
    file: fileName,
    name: suiteName,
    passed,
    checks: passMatches,
    durationMs: suiteDuration,
    output: combined,
  });

  const statusLabel = passed ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  const padName = suiteName.padEnd(22, ' ');
  const padChecks = `(${passMatches} checks)`.padStart(13, ' ');
  const padTime = `${suiteDuration}ms`.padStart(8, ' ');

  console.log(
    `  ${GRAY}[${String(i + 1).padStart(2, '0')}/${testFiles.length}]${RESET} ${BOLD}${padName}${RESET} ${padChecks}  ${padTime}  [${statusLabel}]`
  );

  // Si falló, mostrar el error inmediatamente
  if (!passed) {
    console.log(`\n${RED}${BOLD}--- ERROR EN SUITE ${fileName} ---${RESET}`);
    console.log(combined);
    console.log(`${RED}--------------------------------------------------${RESET}\n`);
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
const passedCount = results.filter((r) => r.passed).length;
const failedCount = results.filter((r) => !r.passed).length;

console.log(`\n${BOLD}${CYAN}==============================================================================${RESET}`);
console.log(`${BOLD}   TABLERO CONSOLIDADO DE CALIDAD (QA DASHBOARD)                              ${RESET}`);
console.log(`${BOLD}${CYAN}==============================================================================${RESET}`);

console.log(`  • ${BOLD}Total de Suites Ejecutadas:${RESET}  ${testFiles.length}`);
console.log(`  • ${BOLD}Suites Aprobadas (PASS):${RESET}     ${GREEN}${passedCount}${RESET} / ${testFiles.length} (${((passedCount / testFiles.length) * 100).toFixed(1)}%)`);
console.log(`  • ${BOLD}Suites Fallidas (FAIL):${RESET}      ${failedCount === 0 ? GREEN + '0' : RED + failedCount}${RESET}`);
console.log(`  • ${BOLD}Total Verificaciones:${RESET}        ${BOLD}${totalChecks} aserciones unitarias/E2E${RESET}`);
console.log(`  • ${BOLD}Tiempo Total de Ejecución:${RESET}   ${totalDuration} segundos`);

if (failedCount === 0) {
  console.log(`\n${BOLD}${GREEN}✔ RESULTADO FINAL: 100% PASS — SISTEMA A2RUEDAS EN ÓPTIMAS CONDICIONES.${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${BOLD}${RED}✘ RESULTADO FINAL: SE ENCONTRARON FALLOS EN ${failedCount} SUITE(S).${RESET}\n`);
  process.exit(1);
}
