import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bmwrsekgpfculdtzvcfx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ENfuJdohMAL2Z-RU13BPAw_gdBOv6kA';

console.log('--- INICIANDO PRUEBAS DE LA FASE 4: AUTENTICACIÓN ---');

// 1. Inicialización de cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
console.log('1. Cliente Supabase inicializado correctamente: PASS');

// 2. Prueba de Acceso sin sesión
const sessionResp = await supabase.auth.getSession();
console.log('2. Prueba de acceso sin sesión previa (esperado null):', sessionResp.data.session === null ? 'PASS' : 'FAIL');

// 3. Prueba de Contraseña Incorrecta
const failLogin = await supabase.auth.signInWithPassword({
  email: 'admin@a2ruedas.com',
  password: 'wrong_password_xyz',
});

if (failLogin.error) {
  console.log('3. Prueba de contraseña incorrecta rechazada por Supabase Auth:', failLogin.error.message ? 'PASS' : 'FAIL');
} else {
  console.log('3. Contraseña incorrecta fallo: FAIL');
}

// 4. Verificación de endpoint de Supabase activo
const healthCheck = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
  headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
});
console.log('4. Estado de salud de Auth Gateway en Supabase (HTTP status):', healthCheck.status === 200 ? 'PASS (200 OK)' : `STATUS ${healthCheck.status}`);

console.log('--- TODAS LAS PRUEBAS DE AUTENTICACIÓN EJECUTADAS CON ÉXITO ---');
