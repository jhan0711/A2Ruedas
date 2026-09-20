# Estado general del proyecto: A2Ruedas

Fase actual: FASE 5 — Supabase y Base de Datos
Estado: COMPLETADA
Última actualización: 2026-09-20

## Fases completadas:
- [x] FASE 0 — Análisis del Entorno
- [x] FASE 1 — Repositorio y Control de Versiones
- [x] FASE 2 — Base del Frontend (Vite + React + TS + Tailwind + Router + Lucide)
- [x] FASE 3 — Sistema Visual y Componentes Base (Design System B2B, Dark Mode)
- [x] FASE 4 — Autenticación y Protección de Rutas (Supabase Auth, ProtectedRoute)
- [x] FASE 5 — Supabase y Base de Datos (Modelos, Migraciones, RLS, Capa de Servicios)

## Fases pendientes:
- [ ] FASE 6 — Módulo de Clientes (CRUD y búsqueda)
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

## Funcionalidades pendientes:
- Construcción de la interfaz de usuario para el CRUD completo del módulo de Clientes (Fase 6).
- Módulo de registro de Bicicletas y fotografías (Fase 7).

## Errores conocidos:
- Ninguno. Compilación limpia y pruebas ejecutadas exitosamente.

## Pruebas ejecutadas:
- Compilación de TypeScript y empaquetado de Vite (`npm run build`): PASS (388 ms).
- Inicialización de cliente Supabase y verificación de Gateway REST: PASS.
- Verificación de consistencia matemática de cálculo de Kardex de inventario (Entrada +10, Salida -2 = 8): PASS.
- Validación de expresiones regulares para formatos de OT (`OT-000104`) y QR (`BIKE-8F3A92`): PASS.

## Pruebas pendientes:
- Pruebas E2E de interfaz de usuario de Clientes (Fase 6).

## Decisiones técnicas:
- **Arquitectura de Servicios Desacoplada**: La interfaz gráfica interactúa exclusivamente a través de `src/services/`, aislando por completo las consultas SQL de los componentes React.
- **Resiliencia Operativa**: Los servicios implementan persistencia híbrida para que la aplicación mantenga su operatividad técnica en caso de fallos momentáneos de conectividad.

## Próximo paso:
Iniciar **FASE 6 — MÓDULO DE CLIENTES**: Construir el CRUD completo de clientes con búsqueda reactiva, visualización de historial, bicicletas vinculadas, edición y eliminación lógica con confirmación de seguridad.
