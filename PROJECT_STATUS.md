# Estado general del proyecto: A2Ruedas

Fase actual: FASE 9 — Módulo de Órdenes de Trabajo (OT)
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
- [x] FASE 7 — Módulo de Bicicletas (Registro, serial, fotos de inspección, QR)
- [x] FASE 8 — Módulo de Inventario (Productos, stock, Kardex, alertas)
- [x] FASE 9 — Módulo de Órdenes de Trabajo (OT-000001, estados, repuestos)

## Fases pendientes:
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
- **Módulo de Bicicletas (Fase 7)**:
  * Directorio visual de bicicletas con tabla B2B, marcas, modelos, tipo y color.
  * Soporte completo para relación 1:N (un cliente con múltiples bicicletas).
  * Asignación automática de códigos QR únicos (`BIKE-XXXXXX`) con enlace público.
  * Identificación técnica detallada: Serial de fábrica, talla de marco, tamaño de rin, componentes clave y daños previos.
  * Galería de fotografías de inspección física con clasificación por tipo (*general*, *daño*, *transmisión*, *frenos*, *cuadro*) y subida reactiva.
  * Consolidación de órdenes de trabajo asociadas a cada bicicleta.
  * Eliminación con modal de confirmación `ConfirmModal` (Regla 44).
  * Suite de pruebas automatizadas en `tests/bicycles.test.mjs`.
- **Módulo de Inventario y Kardex (Fase 8)**:
  * Catálogo maestro de productos y repuestos en `/admin/productos` con SKU, nombre, marca, categoría, costo, precio venta, margen comercial (%) y ubicación física.
  * Soporte para múltiples fotografías por producto (galería con selector).
  * Control de existencias y auditoría de Kardex en `/admin/inventario` con Entradas, Salidas y Ajustes de almacén.
  * Alertas tempranas automáticas de stock mínimo (`stock <= min_stock`).
  * Validación matemática estricta de Kardex con prueba obligatoria ($0 + 10 - 2 = 8$).
  * Prevención estricta de stock negativo.
  * Suite de pruebas automatizadas en `tests/inventory.test.mjs`.

- **Módulo de Órdenes de Trabajo (Fase 9)**:
  * Generación y control de correlativo estricto `OT-000001` (6 dígitos secuenciales).
  * Soporte completo para el ciclo de 9 estados del taller (`RECIBIDA`, `DIAGNOSTICO`, `PRESUPUESTO`, `APROBADA`, `EN_REPARACION`, `ESPERANDO_REPUESTO`, `LISTA`, `ENTREGADA`, `CANCELADA`) con badges cromáticos.
  * Articulación relacional dinámica: Selector de cliente que filtra automáticamente sus bicicletas vinculadas.
  * Desglose de ítems con mano de obra y repuestos de inventario.
  * Descuento automático de existencias en Kardex al asignar repuestos a la orden (`inventory_movements` con referencia `Uso en OT-XXXXXX`).
  * Modal de cambio de estado con auditoría inmutable en `work_order_status_history`.
  * Modal Dossier técnico con desglose financiero, línea de tiempo de auditoría y notificaciones directas a WhatsApp contextualizadas.
  * Eliminación con modal de confirmación `ConfirmModal` (Regla 44).
  * Suite de pruebas automatizadas en `tests/workOrders.test.mjs`.

## Funcionalidades pendientes:
- Recepción de Bicicleta + Firma Digital Táctil en pantalla (Fase 10).
- Agenda y Calendario de Mantenimientos (Fase 11).

## Errores conocidos:
- Ninguno. Compilación limpia y pruebas ejecutadas exitosamente al 100%.

## Pruebas ejecutadas:
- Compilación de TypeScript y empaquetado de Vite (`npm run build`): PASS (0 errores).
- Validación de formato correlativo de OT (`^OT-\d{6}$`): PASS.
- Secuencia correlativa automática a partir de lista o vacío: PASS.
- Soporte para el ciclo completo de 9 estados del taller: PASS.
- Consistencia del balance financiero ($Labor + Parts - Discount = Total$): PASS.
- Descuento automático en Kardex al agregar repuestos: PASS.
- Auditoría de movimiento de salida vinculado a la OT: PASS.
- Plantillas de WhatsApp contextuales para estados `LISTA` y `PRESUPUESTO`: PASS.

## Pruebas pendientes:
- Pruebas E2E de firma digital en canvas táctil (Fase 10).

## Decisiones técnicas:
- **Correlativo Inquebrantable**: El número de orden se determina evaluando el número correlativo más alto registrado y formateándolo con 6 dígitos (`OT-000001`), evitando duplicados.
- **Sincronización Transaccional Taller-Almacén**: La selección de piezas en una orden de trabajo descuenta de inmediato el stock físico en el almacén para evitar ventas cruzadas de repuestos comprometidos.

## Próximo paso:
Iniciar **FASE 10 — RECEPCIÓN DE BICICLETA Y FIRMA DIGITAL**: Formulario especializado de recepción con diagrama de daños / inspección inicial visual y lienzo interactivo de firma digital táctil del cliente en pantalla.



