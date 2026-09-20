# Estado general del proyecto: A2Ruedas

Fase actual: FASE 6 — Módulo de Clientes
Estado: COMPLETADA
Última actualización: 2026-09-20

## Fases completadas:
- [x] FASE 0 — Análisis del Entorno
- [x] FASE 1 — Repositorio y Control de Versiones
- [x] FASE 2 — Base del Frontend (Vite + React + TS + Tailwind + Router + Lucide)
- [x] FASE 3 — Sistema Visual y Componentes Base (Design System B2B, Dark Mode)
- [x] FASE 4 — Autenticación y Protección de Rutas (Supabase Auth, ProtectedRoute)
- [x] FASE 5 — Supabase y Base de Datos (Modelos, Migraciones, RLS, Capa de Servicios)
- [x] FASE 6 — Módulo de Clientes (CRUD, búsqueda y vinculación)

## Fases pendientes:
- [ ] FASE 7 — Módulo de Bicicletas (Registro, serial, fotografías)
- [ ] FASE 8 — Módulo de Inventario (Productos, stock, movimientos, alertas)
- [ ] FASE 9 — Módulo de Órdenes de Trabajo (OT-000001, estados, repuestos)
- [ ] FASE 10 — Recepción de Bicicleta + Firma Digital Táctil
- [ ] FASE 11 — Agenda y Calendario de Mantenimientos
- [ ] FASE 12 — Historial Completo y Timeline de Bicicleta
- [ ] FASE 13 — Módulo de Códigos QR (Generación, descarga, escaneo por cámara)
- [ ] FASE 14 — Módulo de Comunicación por WhatsApp (Deep links dinámicos)
- [ ] FASE 15 — Módulo de Flujo de Caja (Apertura, ingresos, egresos, cierre)
- [ ] FASE 16 — Facturación y Recibos Internos
- [ ] FASE 17 — Impresión Térmica de 58 mm (Órdenes y Facturas)
- [ ] FASE 18 — Catálogo Público de Productos (/productos, sin login)
- [ ] FASE 19 — Configuración PWA (Manifest, Service Worker, Instalación, Offline)
- [ ] FASE 20 — Auditoría de Seguridad (RLS, Sanitización, Protección de Rutas)
- [ ] FASE 21 — QA Completo (Unitarias, Integración, E2E, Responsive)
- [ ] FASE 22 — Prueba Completa de Negocio Extremo a Extremo
- [ ] FASE 23 — Pulido de UX/UI Final y Accesibilidad
- [ ] FASE 24 — Optimización de Performance (Bundle, Renders, Caching)
- [ ] FASE 25 — Preparación para Despliegue en Producción
- [ ] FASE 26 — Entrega Final y Manuales de Operación

## Funcionalidades implementadas:
- Creación de migración SQL maestra en `supabase/migrations/20260920000001_initial_schema.sql` cubriendo las 20 tablas relacionales requeridas:
  * `profiles` (usuarios administrativos con trigger de sincronización).
  * `customers` (directorio de clientes con índices telefónicos).
  * `bicycles` (fichas técnicas, número de serie único y relación cliente).
  * `bike_qr_codes` (identificadores únicos formateados `BIKE-XXXXXX` y tokens públicos).
  * `bicycle_photos` (fotografías de inspección y daños).
  * `product_categories` y `products` (inventario, stock, stock mínimo, precio y costo).
  * `inventory_movements` (kardex auditable de entradas, salidas y ajustes).
  * `services` (catálogo de mano de obra del taller).
  * `work_orders` (órdenes correlativas `OT-000001`, ciclo completo de 9 estados).
  * `work_order_items` (repuestos y servicios agregados a la orden).
  * `work_order_status_history` (trazabilidad de auditoría de cada transición de estado).
  * `signatures` (registro de firmas digitales de recepción y entrega).
  * `cash_registers` (sesiones de caja, apertura, base en efectivo y cierre contable).
  * `cash_movements` (movimientos de caja detallados con medio de pago).
  * `invoices` y `invoice_items` (facturación y recibos de cobro).
  * `appointments` (agenda de citas y disponibilidad técnica).
  * `whatsapp_messages` (historial de mensajes y plantillas enviadas).
  * `activity_logs` (bitácora de auditoría general).
- Función RPC de seguridad en base de datos `get_bike_public_timeline(p_qr_code)` para consultar el historial de mantenimiento por QR sin exponer información personal sensible de clientes.
- Políticas de seguridad Row Level Security (RLS) habilitadas en las 20 tablas, con lectura anónima limitada a productos activos y acceso total restringido a administradores autenticados.
- Tipos de TypeScript sincronizados en `src/types/database.ts`.
- Capa de servicios desacoplada en `src/services/` (`customerService`, `bicycleService`, `inventoryService`, `workOrderService`, `cashService`) con persistencia dual (Supabase + resiliencia local).
- Suite de pruebas de base de datos en `tests/database.test.mjs`.
- **Módulo de Clientes (Fase 6)**:
  * Directorio visual con tabla B2B, avatares monocromáticos y badges.
  * Búsqueda reactiva instantánea por coincidencia de nombre, teléfono y cédula/documento.
  * Modal de creación y edición con validación de campos obligatorios.
  * Generación automática de enlace directo a WhatsApp (`https://wa.me/57...`) con mensaje de apertura prellenado.
  * Ficha y perfil de cliente detallado mostrando bicicletas registradas e historial de órdenes de trabajo asociadas.
  * Eliminación de cliente con modal de confirmación `ConfirmModal` (Regla 44).
  * Suite de pruebas automatizadas en `tests/customers.test.mjs`.

## Funcionalidades pendientes:
- Módulo de registro de Bicicletas y fotografías de ingreso (Fase 7).
- Módulo de Inventario y Kardex (Fase 8).

## Errores conocidos:
- Ninguno. Compilación limpia y pruebas ejecutadas exitosamente al 100%.

## Pruebas ejecutadas:
- Compilación de TypeScript y empaquetado de Vite (`npm run build`): PASS (0 errores).
- Validación de campos obligatorios de cliente (Rechazo datos inválidos y aceptación válidos): PASS.
- Sanitización y generación de Deep Link de WhatsApp internacional/nacional: PASS.
- Búsqueda reactiva multicriterio (Nombre, Teléfono, Documento): PASS.
- Vinculación relacional cliente con bicicletas vinculadas y órdenes de trabajo: PASS.

## Pruebas pendientes:
- Pruebas E2E de interfaz de usuario de Bicicletas (Fase 7).

## Decisiones técnicas:
- **Sanitización de WhatsApp**: Normalización de números telefónicos para garantizar compatibilidad con el esquema `https://wa.me/57...` tanto para números ingresados con prefijo internacional como locales.
- **Resiliencia Operativa**: Los servicios implementan persistencia híbrida para que la aplicación mantenga su operatividad técnica en caso de fallos momentáneos de conectividad.

## Próximo paso:
Iniciar **FASE 7 — MÓDULO DE BICICLETAS**: Construcción del registro de bicicletas, marcas, modelos, números de serie únicos, tipos de bicicleta, vinculación a clientes y captura/galería de fotografías de estado de ingreso.

