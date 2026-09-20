# Estrategia y Plan Maestro de Pruebas: A2Ruedas

Este documento establece la metodología, criterios de aceptación y matrices de prueba para asegurar que cada funcionalidad del sistema opere de extremo a extremo sin regresiones.

---

## 1. Regla Fundamental de Aprobación

> **Ninguna fase se considera terminada simplemente porque el código compile o la pantalla se visualice.**
> Una funcionalidad solamente está COMPLETA cuando:
> 1. Persiste datos reales o ejecuta su flujo de negocio de punta a punta.
> 2. Pasa todas las pruebas de la fase con resultado **PASS**.
> 3. No genera errores de consola ni rompe módulos previos.
> 4. Está documentada y registrada en `PROJECT_STATUS.md`.

---

## 2. Niveles de Prueba

### 2.1. Pruebas Unitarias
- Funciones puras de cálculo financiero (subtotales, descuentos, impuestos, balance de caja).
- Formateadores de fecha, hora, moneda y números correlativos (`OT-000001`, `FAC-000123`).
- Validadores de formularios (teléfonos, identificación, seriales, stock mínimo).

### 2.2. Pruebas de Integración (Supabase)
- Autenticación: Inicio de sesión válido, contraseña inválida, recuperación y cierre de sesión.
- Persistencia CRUD en todas las tablas (`customers`, `bicycles`, `products`, `work_orders`).
- Verificación de políticas RLS: Intentar leer datos privados desde un cliente no autenticado debe ser denegado automáticamente por la base de datos.
- Descuento automático de inventario al asociar repuestos a una orden de trabajo o venta.

### 2.3. Pruebas de Hardware y Periféricos
- **Impresora Térmica de 58 mm**:
  - Verificación visual del renderizado de ticket continuo (ancho útil 48 mm / 384 px a 203 DPI).
  - Impresión virtual a PDF comprobando corte de papel, márgenes cero y legibilidad de caracteres monoespaciados.
- **Códigos QR**:
  - Generación de código QR SVG/PNG válido para cada bicicleta.
  - Escaneo con cámara física (webcam y celular) decodificando correctamente la URL `/bike/:code`.
- **Firma Digital**:
  - Captura fluida del trazo táctil en pantallas touch y con puntero de mouse.
  - Limpieza del lienzo y exportación a imagen Base64 PNG.

### 2.4. Pruebas Responsive y Adaptabilidad
- **Desktop (1920x1080 / 1366x768)**: Dashboard administrativo, tablas de alta densidad y reportes.
- **Tablet (768x1024 / iPad)**: Módulo de recepción, inspección visual de la bicicleta y firma del cliente.
- **Celular (375x667 a 414x896)**: Escaneo QR rápido, consulta de órdenes y catálogo público.

---

## 3. Matriz de Pruebas por Fase

| Fase | Módulo / Componente | Caso de Prueba | Criterio de Aprobación | Tipo |
| :--- | :--- | :--- | :--- | :--- |
| **0** | Entorno | Node, npm, Git y Supabase | Versiones compatibles detectadas | Sistema |
| **1** | Repositorio | Git init, .gitignore, docs | Repositorio limpio y commit inicial | Sistema |
| **2** | Base Frontend | Vite + React + TS + Tailwind | `npm run dev` y `npm run build` sin errores | Compilación |
| **3** | Sistema Visual | Dark/Light mode y componentes UI | Switch de tema persistente y renderizado de componentes | UI/UX |
| **4** | Autenticación | Login, Logout, Rutas protegidas | Redirección a `/login` si no hay sesión activa | Seguridad |
| **5** | Base de Datos | Conexión Supabase y RLS | Inserción y consulta verificada contra la nube | Integración |
| **6** | Clientes | CRUD de clientes | Crear, buscar, editar y listar clientes | E2E |
| **7** | Bicicletas | Asociación Cliente → Bicicleta | Registro de bici con serial y fotos vinculadas | E2E |
| **8** | Inventario | Kardex y alertas de stock | Entradas/salidas actualizan `stock` con precisión matemática | Negocio |
| **9** | Órdenes (OT) | Ciclo de estados | Transición `RECIBIDA` → `ENTREGADA` sin saltos inválidos | Negocio |
| **10** | Recepción + Firma | Firma táctil y daños | Trazo guardado y renderizado en orden | Hardware |
| **11** | Agenda | Calendario de citas | Detección de solapamiento de horarios de técnicos | Lógica |
| **12** | Historial Bici | Timeline cronológico | Órdenes históricas mostradas correctamente | UI / Datos |
| **13** | QR | Generación y lectura | Escáner decodifica identificador y abre `/bike/:code` | Hardware |
| **14** | WhatsApp | Deep links dinámicos | Mensaje preformateado abre app de WhatsApp con datos reales | Integración |
| **15** | Caja | Apertura, movimientos y arqueo | Balance = Base + Ingresos - Egresos | Financiero |
| **16** | Facturación | Recibos de cobro | Subtotal, descuentos y total calculados con exactitud | Financiero |
| **17** | Impresión 58mm | Ticket de orden y factura | Vista previa de 58 mm legible y sin cortes anormales | Impresión |
| **18** | Catálogo Público | Acceso no autenticado | Consulta sin login, sin ver costos ni clientes | Seguridad |
| **19** | PWA | Instalación y Service Worker | App instalable en Windows/móvil y funcional offline | PWA |
| **20** | Auditoría Seg. | Validación RLS y tokens | Consultas no autorizadas rechazadas por PostgreSQL | Seguridad |
| **21** | QA Completo | Suite integral de pruebas | 100% de casos de prueba en estado PASS | QA |
| **22** | Negocio E2E | Simulación taller real | Flujo completo desde llegada de cliente hasta entrega | E2E |
| **23** | UX Final | Accesibilidad y diseño | Sin desbordamientos, contraste AA, focus visible | A11y |
| **24** | Rendimiento | Lighthouse y bundle size | Puntuación > 90 en Performance y Best Practices | Calidad |
| **25** | Producción | Build para despliegue | Generación de bundle minificado sin warnings críticos | Despliegue |
| **26** | Entrega | Documentación y entrega | Manuales probados y entrega final conforme | Entrega |
