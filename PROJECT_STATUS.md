# Estado general del proyecto: A2Ruedas

Fase actual: FASE 14 — Módulo de Comunicación por WhatsApp (Deep links dinámicos, plantillas y trazabilidad)
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
- [x] FASE 10 — Recepción de Bicicleta + Firma Digital Táctil
- [x] FASE 11 — Agenda y Calendario de Mantenimientos
- [x] FASE 12 — Historial Completo y Timeline de Bicicleta
- [x] FASE 13 — Módulo de Códigos QR (Generación, descarga, escaneo por cámara)
- [x] FASE 14 — Módulo de Comunicación por WhatsApp (Deep links dinámicos, plantillas automáticas y bitácora)

## Fases pendientes:
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
- Capa de servicios desacoplada en `src/services/` (`customerService`, `bicycleService`, `inventoryService`, `workOrderService`, `cashService`, `appointmentService`) con persistencia dual (Supabase + resiliencia local).
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
- **Módulo de Recepción y Firma Digital Táctil (Fase 10)**:
  * Pantalla especializada en `/admin/ordenes/nueva` con flujo de 4 pasos para ingreso de bicicletas.
  * Lienzo táctil HTML5 Canvas para firma digital del cliente con calibración DPI y prevención de scroll táctil.
  * Diagrama anatómico vectorial SVG con marcado de daños por coordenadas porcentuales y detección anatómica.
  * Lista de verificación de accesorios en custodia del cliente (10 ítems comunes + campo libre).
  * Emisión de orden en estado `RECIBIDA` con correlativo secuencial e incrustación de firma en comprobante POS 58 mm y formato carta A4.
  * Suite de pruebas automatizadas en `tests/reception.test.mjs`.
- **Módulo de Agenda y Calendario de Mantenimientos (Fase 11)**:
  * Calendario interactivo en `/admin/agenda` con visualizaciones por Mes, Día y Lista cronológica.
  * Control en tiempo real de capacidad diaria (aforo máximo configurable por día, por defecto 6 cupos) con semáforo verde/amarillo/rojo.
  * Asignación de mecánico responsable y estimación de tiempo de servicio.
  * Ciclo de vida de 4 estados para citas (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
  * Generador de Deep Links de WhatsApp para confirmación inmediata de citas.
  * Integración con módulo de recepción para transferir cliente y bicicleta con un solo clic.
  * Suite de pruebas automatizadas en `tests/appointments.test.mjs`.
- **Historial Completo y Timeline de Bicicleta (Fase 12)**:
  * Dossier Técnico B2B renovado con navegación por pestañas en `/admin/bicicletas`:
    1. *Timeline de Mantenimientos*: Línea de tiempo cronológica vertical con lectura de odómetro, diagnósticos técnicos, desglose de servicios, repuestos instalados e impresión instantánea de comprobantes térmicos o tamaño carta vía `WorkOrderTicketModal`.
    2. *Ficha Técnica & Componentes*: Especificaciones completas de fábrica, serial de cuadro, historial evolutivo de odómetro y recomendaciones preventivas inteligentes por tipo de bici (MTB, Ruta, Gravel, E-Bike).
    3. *Fotos de Inspección*: Galería categorizada con subida reactiva de evidencia visual.
    4. *Historial Consolidado de Repuestos*: Auditoría de todas las piezas reemplazadas a lo largo de la vida útil de la bicicleta con fecha, cantidad, orden OT y valor monetario.
  * Página Pública de Certificación por Código QR en `/bike/:code`:
    1. Perfil técnico público de la bicicleta sin requerir inicio de sesión.
    2. Insignia de autenticidad ("Historial Verificado A2Ruedas ✓").
    3. Protección estricta de privacidad: CERO exposición de datos personales sensibles (PII como teléfonos, cédulas o nombres completos del propietario jamás se muestran al público).
    4. Odómetro acumulado en tiempo real, recomendaciones de mantenimiento y enlace directo a WhatsApp para agendar servicio.
  * Preselección relacional en `/admin/ordenes/nueva` al hacer clic en "Crear Nueva Orden" desde la ficha de cualquier bicicleta.
  * Suite de pruebas automatizadas en `tests/bicycleTimeline.test.mjs`.
- **Módulo de Códigos QR y Etiquetas Adhesivas (Fase 13)**:
  * Motor de Códigos QR de alta densidad usando `qrcode` con nivel de recuperación 'H' (30% de tolerancia ante manchas de grasa, barro, agua y raspaduras físicas en taller).
  * Soporte Dual de Formatos de Impresión:
    1. **Tirilla Térmica POS (58 mm)**: Especialmente diseñada para impresoras térmicas de taller y rollo continuo (`@page { size: 58mm auto; margin: 0; }`, sin márgenes de hoja carta, ancho imprimible de 50 mm, alto contraste monocromático, QR nítido, código `BIKE-XXXXXX`, ficha técnica de la bicicleta, sello de verificación y guía de corte). Ideal para fijar al marco con cinta transparente protectora.
    2. **Sticker Gráfico Horizontal (50mm x 30mm / 600x360 px Canvas)**: Diseñado para pliegos de hoja adhesiva tamaño Carta / A4 o descarga en archivo PNG de alta resolución.
  * Centro de Códigos QR en `/admin/qr`:
    1. KPIs en vivo: QRs Asignados, Bicicletas Identificadas, Etiquetas Seleccionadas y Red 100% Verificada.
    2. Filtrado y búsqueda reactiva por marca, modelo, cliente, serial y código QR.
    3. Impresión masiva por lote tanto en rollo térmico continuo de 58 mm como en pliego de hoja Carta/A4.
    4. Botón directo por cada fila para enviar a la impresora térmica en 1 clic.
  * Modal de Previsualización e Impresión `StickerPreviewModal`:
    1. Pestañas de alternancia entre formato **Tirilla Térmica (58 mm)** y **Sticker Gráfico (Carta / A4)**.
    2. Previsualización fotorrealista de la tirilla térmica y del sticker horizontal.
    3. Botón para imprimir en térmica, imprimir en pliego carta o descargar PNG.
    4. Copia rápida del enlace público y recomendaciones de instalación en el marco.
  * Escáner Universal por Cámara `QRScannerModal` con motor dual: `BarcodeDetector` nativo acelerado por hardware + fallback universal con `jsQR`, alternador de cámara (frontal/trasera en móviles), interruptor de linterna (flashlight), retícula animada, sonido suave Web Audio + vibración háptica, pestaña de ingreso manual por teclado y ficha emergente interactiva de resultados con botones de acción directa ("Iniciar Recepción", "Ver Dossier Técnico", "Ver Perfil Público").
  * Botón global "Escanear QR" en la cabecera `Header.tsx` para acceso instantáneo desde cualquier pantalla del panel.
  * Botón de escaneo express en el Paso 1 de Recepción de Bicicleta (`ReceptionPage.tsx`) que autocompleta el cliente y la bicicleta en 1 clic.
  * Suite de pruebas automatizadas en `tests/qrCodes.test.mjs` (19 pruebas con 100% PASS).
- **Módulo de Comunicación por WhatsApp (Fase 14)**:
  * Catálogo maestro de 10 plantillas oficiales de taller (`ORDEN_RECIBIDA`, `PRESUPUESTO_LISTO`, `ESPERANDO_REPUESTO`, `BICICLETA_LISTA`, `ENTREGA_AGRADECIMIENTO`, `CONFIRMACION_CITA`, `RECORDATORIO_CITA`, `ALERTA_KILOMETRAJE`, `HISTORIAL_QR`, `PERSONALIZADO`).
  * Motor de interpolación inteligente con variables dinámicas (`{CLIENTE}`, `{BICICLETA}`, `{ORDEN}`, `{TOTAL}`, `{SALDO}`, `{FECHA}`, `{HORA}`, `{MECANICO}`, `{ENLACE_QR}`, `{KILOMETRAJE}`).
  * Normalizador automático de números móviles colombianos a formato internacional (`573...`).
  * Construcción de Deep Links estándar `https://wa.me/57...` con codificación segura de caracteres especiales, saltos de línea y emojis.
  * Modal interactivo `WhatsAppComposeModal` con simulador fotorrealista de chat de WhatsApp (cabecera verde, burbuja con hora en vivo, doble check azul y selector de plantillas).
  * Centro Administrativo de WhatsApp en `/admin/whatsapp` con tarjetas de KPI (Mensajes Enviados, Clientes Únicos, Trazabilidad de Órdenes OT, 100% Auditado), galería de prueba rápida de plantillas y bitácora con búsqueda reactiva, filtrado por disparador, copia rápida y reenvío.
  * Integración en el flujo de trabajo del taller:
    1. Paso 4 de Recepción de Bicicleta (`ReceptionPage.tsx`) con apertura automática tras crear la orden.
    2. Tabla de Órdenes de Trabajo (`WorkOrdersPage.tsx`) con clic directo en el número de teléfono del cliente y botón de acción en fila.
    3. Modal Dossier Técnico (`WorkOrdersPage.tsx`) con notificación contextualizada a WhatsApp.
  * Trazabilidad y persistencia dual en tabla `whatsapp_messages` y almacenamiento local (`localStorage`) para resiliencia sin conexión.
  * Suite de pruebas automatizadas en `tests/whatsapp.test.mjs` (13 pruebas con 100% PASS).

## Errores conocidos:
- Ninguno. Compilación limpia y pruebas ejecutadas exitosamente al 100%.

## Pruebas ejecutadas:
- Compilación de TypeScript y empaquetado de Vite (`npm run build`): PASS (0 errores).
- Normalización y extracción de códigos QR y sticker adhesivo: PASS (19/19).
- Normalización telefónica (+57, 10 dígitos, limpieza de caracteres no numéricos): PASS.
- Deep Links wa.me con codificación URL de emojis y saltos de línea: PASS.
- Catálogo de 10 plantillas oficiales de taller: PASS.
- Interpolación dinámica de datos (cliente, bici, orden, totales y saldo pendiente): PASS.
- Mapeo de estados de taller a plantillas sugeridas: PASS.
- Bitácora de auditoría y búsqueda reactiva multicriterio: PASS.
- Cálculo de métricas y KPIs de WhatsApp: PASS.
- Regresión completa de las 14 fases previas (11 suites de prueba): PASS (100%).

## Pruebas pendientes:
- Pruebas de integración para el Módulo de Flujo de Caja (Fase 15).

## Decisiones técnicas:
- **Enfoque de Deep Links Oficiales (`wa.me`) sin intermediarios de pago**: Para una PWA ágil y sin costos mensuales recurrentes de la API oficial de WhatsApp Cloud o Twilio, se utilizaron Deep Links de WhatsApp Web / App directa. Esto permite al mecánico o administrador disparar el mensaje en 1 clic desde su propio WhatsApp personal o empresarial del taller en cualquier dispositivo (PC, tablet o smartphone), registrando simultáneamente la auditoría en la base de datos `whatsapp_messages`.
- **Cálculo de Saldo Pendiente en Plantillas de Cobro**: En la plantilla `BICICLETA_LISTA`, el sistema extrae automáticamente los abonos o anticipos previos y muestra al cliente exactamente el saldo que debe cancelar al momento de retirar su bicicleta, eliminando confusiones de caja en el mostrador.
- **Simulador Fotorrealista de Chat WhatsApp**: Permite al recepcionista o mecánico leer con anticipación exactamente cómo verá el cliente el mensaje en la pantalla de su celular antes de enviarlo, evitando errores ortográficos o montos incorrectos.

## Próximo paso:
Esperar la confirmación explícita del usuario ("confirmo") para iniciar **FASE 15 — MÓDULO DE FLUJO DE CAJA (Apertura de caja, ingresos, egresos, medios de pago y arqueo de cierre)**.
