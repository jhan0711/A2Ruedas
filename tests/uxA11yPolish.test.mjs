import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=== INICIANDO PRUEBAS DE PULIDO DE UX/UI Y ACCESIBILIDAD (FASE 23) ===\n');

// 1. Verificación del enlace de omisión para teclado (Skip to Content)
const skipToContentPath = path.join(rootDir, 'src/components/ui/SkipToContent.tsx');
assert.ok(fs.existsSync(skipToContentPath), 'El archivo SkipToContent.tsx debe existir');
const skipContent = fs.readFileSync(skipToContentPath, 'utf8');
assert.ok(skipContent.includes('sr-only'), 'SkipToContent debe incluir sr-only para estar oculto visualmente por defecto');
assert.ok(skipContent.includes('focus:not-sr-only'), 'SkipToContent debe incluir focus:not-sr-only para revelarse al enfocar');
assert.ok(skipContent.includes('targetId'), 'SkipToContent debe permitir configurar el targetId');
assert.ok(skipContent.includes("target.focus()"), 'SkipToContent debe transferir el foco al pulsar la acción');
console.log('1. Enlace de omisión accesible SkipToContent con revelado en foco y transferencia de foco:', 'PASS');

// 2. Verificación de anclajes de contenido principal en Layouts
const adminLayoutContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/AdminLayout.tsx'), 'utf8');
assert.ok(adminLayoutContent.includes('<SkipToContent'), 'AdminLayout debe incluir SkipToContent');
assert.ok(adminLayoutContent.includes('id="main-content"'), 'AdminLayout debe definir id="main-content" en la etiqueta main');
assert.ok(adminLayoutContent.includes('tabIndex={-1}'), 'AdminLayout main debe tener tabIndex={-1} para recibir foco accesible');

const publicLayoutContent = fs.readFileSync(path.join(rootDir, 'src/components/layout/PublicLayout.tsx'), 'utf8');
assert.ok(publicLayoutContent.includes('<SkipToContent'), 'PublicLayout debe incluir SkipToContent');
assert.ok(publicLayoutContent.includes('id="public-content"'), 'PublicLayout debe definir id="public-content"');
assert.ok(publicLayoutContent.includes('tabIndex={-1}'), 'PublicLayout main debe tener tabIndex={-1}');
console.log('2. Anclajes de salto #main-content y #public-content en Layouts de Administración y Público:', 'PASS');

// 3. Verificación de atributos ARIA en Input
const inputContent = fs.readFileSync(path.join(rootDir, 'src/components/ui/Input.tsx'), 'utf8');
assert.ok(inputContent.includes('aria-invalid={error ? true : undefined}'), 'Input debe vincular aria-invalid ante errores');
assert.ok(inputContent.includes('aria-describedby={describedBy}'), 'Input debe vincular aria-describedby dinámicamente');
assert.ok(inputContent.includes('role="alert"'), 'El mensaje de error de Input debe poseer role="alert"');
assert.ok(inputContent.includes('React.useId()'), 'Input debe generar ID único accesible cuando no se provee id explícito');
console.log('3. Control Input con vinculación estricta de aria-invalid, aria-describedby y role="alert":', 'PASS');

// 4. Verificación de atributos ARIA en Select
const selectContent = fs.readFileSync(path.join(rootDir, 'src/components/ui/Select.tsx'), 'utf8');
assert.ok(selectContent.includes('aria-invalid={error ? true : undefined}'), 'Select debe vincular aria-invalid ante errores');
assert.ok(selectContent.includes('aria-describedby={describedBy}'), 'Select debe vincular aria-describedby dinámicamente');
assert.ok(selectContent.includes('role="alert"'), 'El mensaje de error de Select debe poseer role="alert"');
console.log('4. Control Select con vinculación de aria-invalid, aria-describedby y role="alert":', 'PASS');

// 5. Verificación del Sistema Global de Toasts
const toastContextPath = path.join(rootDir, 'src/context/ToastContext.tsx');
assert.ok(fs.existsSync(toastContextPath), 'ToastContext.tsx debe existir');
const toastContextContent = fs.readFileSync(toastContextPath, 'utf8');
assert.ok(toastContextContent.includes('ToastProvider'), 'Debe exportar ToastProvider');
assert.ok(toastContextContent.includes('useToast'), 'Debe exportar useToast');
assert.ok(toastContextContent.includes('success'), 'Debe soportar método success');
assert.ok(toastContextContent.includes('error'), 'Debe soportar método error');
assert.ok(toastContextContent.includes('warning'), 'Debe soportar método warning');
assert.ok(toastContextContent.includes('info'), 'Debe soportar método info');

const toastContainerPath = path.join(rootDir, 'src/components/ui/ToastContainer.tsx');
assert.ok(fs.existsSync(toastContainerPath), 'ToastContainer.tsx debe existir');
const toastContainerContent = fs.readFileSync(toastContainerPath, 'utf8');
assert.ok(toastContainerContent.includes('role={role}'), 'ToastCard debe alternar roles status y alert');
assert.ok(toastContainerContent.includes('aria-live={ariaLive}'), 'ToastCard debe proveer regiones vivas polite/assertive');
assert.ok(toastContainerContent.includes('aria-label="Cerrar notificación"'), 'Botón de cierre debe tener aria-label');
console.log('5. Sistema Global de Toasts con roles ARIA status/alert y regiones vivas polite/assertive:', 'PASS');

// 6. Verificación del componente Skeleton (Zero Layout Shift)
const skeletonPath = path.join(rootDir, 'src/components/ui/Skeleton.tsx');
assert.ok(fs.existsSync(skeletonPath), 'Skeleton.tsx debe existir');
const skeletonContent = fs.readFileSync(skeletonPath, 'utf8');
assert.ok(skeletonContent.includes('aria-hidden="true"'), 'Skeleton debe tener aria-hidden="true" para no saturar lectores de pantalla');
assert.ok(skeletonContent.includes('animate-pulse'), 'Skeleton debe tener animación sutil animate-pulse');
assert.ok(skeletonContent.includes('card'), 'Skeleton debe soportar variante card');
assert.ok(skeletonContent.includes('table-row'), 'Skeleton debe soportar variante table-row');
assert.ok(skeletonContent.includes('circular'), 'Skeleton debe soportar variante circular');
console.log('6. Componente Skeleton con aria-hidden="true" y variantes para mitigación de Layout Shift (CLS):', 'PASS');

// 7. Verificación de micro-interacciones táctiles y accesibilidad en Button
const buttonContent = fs.readFileSync(path.join(rootDir, 'src/components/ui/Button.tsx'), 'utf8');
assert.ok(buttonContent.includes('active:scale-[0.98]'), 'Button debe incluir micro-interacción active:scale');
assert.ok(buttonContent.includes('focus-visible:ring-2'), 'Button debe incluir anillo de foco visible focus-visible');
assert.ok(buttonContent.includes('aria-busy={isLoading ? true : undefined}'), 'Button debe reflejar aria-busy en estado de carga');
console.log('7. Micro-interacción táctil active:scale-[0.98], foco visible y aria-busy en Button:', 'PASS');

// 8. Verificación de accesibilidad y foco en Modal
const modalContent = fs.readFileSync(path.join(rootDir, 'src/components/ui/Modal.tsx'), 'utf8');
assert.ok(modalContent.includes('aria-describedby={description ? \'modal-description\' : undefined}'), 'Modal debe soportar aria-describedby');
assert.ok(modalContent.includes('id="modal-description"'), 'Modal debe identificar la descripción con id');
assert.ok(modalContent.includes('focus-visible:ring-2'), 'Botón de cierre de Modal debe tener foco visible');
assert.ok(modalContent.includes('role="dialog"'), 'Modal debe tener role="dialog"');
assert.ok(modalContent.includes('aria-modal="true"'), 'Modal debe tener aria-modal="true"');
console.log('8. Modal accesible con aria-modal="true", role="dialog", aria-describedby y foco visible:', 'PASS');

// 9. Verificación de reglas CSS globales (Focus Visible, Reduced Motion, Scrollbars)
const indexCssContent = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');
assert.ok(indexCssContent.includes(':focus-visible'), 'index.css debe definir :focus-visible para navegación por teclado');
assert.ok(indexCssContent.includes('prefers-reduced-motion: reduce'), 'index.css debe incluir @media (prefers-reduced-motion: reduce)');
assert.ok(indexCssContent.includes('::-webkit-scrollbar'), 'index.css debe incluir estilos para barras de desplazamiento');
console.log('9. Reglas CSS globales :focus-visible, prefers-reduced-motion: reduce y scrollbars ergonómicos:', 'PASS');

// 10. Verificación de integración en App.tsx y barrel export en index.ts
const appContent = fs.readFileSync(path.join(rootDir, 'src/app/App.tsx'), 'utf8');
assert.ok(appContent.includes('<ToastProvider>'), 'App.tsx debe envolver la aplicación con ToastProvider');
const uiIndexContent = fs.readFileSync(path.join(rootDir, 'src/components/ui/index.ts'), 'utf8');
assert.ok(uiIndexContent.includes("export * from './Skeleton'"), 'index.ts debe exportar Skeleton');
assert.ok(uiIndexContent.includes("export * from './SkipToContent'"), 'index.ts debe exportar SkipToContent');
assert.ok(uiIndexContent.includes("export * from './ToastContainer'"), 'index.ts debe exportar ToastContainer');
console.log('10. Integración de ToastProvider en App.tsx y exportación modular en src/components/ui/index.ts:', 'PASS');

console.log('\n==============================================================================');
console.log('✔ TODAS LAS 10 VERIFICACIONES DE PULIDO UX/UI Y ACCESIBILIDAD PASARON (100% PASS)');
console.log('==============================================================================');
