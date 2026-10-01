import { execSync } from 'child_process';

console.log('Iniciando despliegue de dist a Netlify producción...');
try {
  const result = execSync('npx --yes netlify deploy --prod --dir=dist', {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120000,
  });
  console.log('Resultado del despliegue:');
  console.log(result);
} catch (err) {
  console.error('Error durante el despliegue:', err.stdout || err.stderr || err.message);
}
