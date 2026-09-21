# Estado general del proyecto: A2Ruedas

Fase actual: FASE 21 — QA Completo (Runner Maestro Automatizado, Suite E2E de Negocio y Auditoría de Responsividad/A11y)
Estado: COMPLETADA
Última actualización: 2026-09-21

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
- [x] FASE 15 — Módulo de Flujo de Caja (Apertura, ingresos, egresos, anticipos, medios de pago y arqueo de cierre)
- [x] FASE 16 — Facturación y Recibos Internos (Emisión de comprobantes, numeración FAC-000001, sincronización de caja y tirilla 58mm)
- [x] FASE 17 — Impresión Térmica de 58 mm (Centro de Impresión Térmica, plantillas continuas, marbetes de bicicleta con QR, comprobantes de recepción/custodia, liquidación de órdenes, facturas, arqueos de caja y calibración de hardware)
- [x] FASE 18 — Catálogo Público de Productos (/productos, sin login)
- [x] FASE 19 — Configuración PWA (Manifest, Service Worker, Instalación, Offline)
- [x] FASE 20 — Auditoría de Seguridad (RLS, Sanitización, Protección de Rutas)
- [x] FASE 21 — QA Completo (Unitarias, Integración, E2E, Responsive)

## Fases pendientes:
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
- **Módulo de Flujo de Caja y Arqueo Diario (Fase 15)**:
  * Modelo completo de sesiones de caja en `cash_registers` y movimientos en `cash_movements`.
  * Apertura de caja formal mediante `OpenCashModal` con registro de base inicial en efectivo ($150.000 COP sugerido por defecto), atajos rápidos ($100k, $150k, $200k, $300k) y notas operativas.
  * Registro de ingresos y egresos mediante `CashMovementModal` con discriminación por medio de pago (Efectivo, Nequi / Bancolombia, Datáfono / Tarjeta, Otro), categorías de taller y vinculación a órdenes OT.
  * Panel administrativo en tiempo real en `/admin/caja` con tarjetas KPI:
    1. Base Inicial en Efectivo.
    2. Efectivo Físico en Gaveta (`Base + Entradas_Efectivo - Salidas_Efectivo`).
    3. Transferencias Nequi / Bancos (segregadas de la gaveta física).
    4. Pagos por Datáfono / Tarjetas.
    5. Total de Egresos de la Jornada.
    6. Balance Neto Total Consolidado.
  * Tabla de movimientos de la jornada con búsqueda instantánea por concepto, categoría o número de OT, y filtros por tipo y medio de pago.
  * Modal de Arqueo y Cierre Diario `CloseCashModal`:
    1. Comparador en vivo: Efectivo Esperado en Gaveta vs. Efectivo Físico Contado.
    2. Calculadora interactiva por denominaciones de billetes colombianos ($100k, $50k, $20k, $10k, $5k, $2k y monedas) con botón para prellenar el valor esperado.
    3. Opción de ingreso manual directo del total contado.
    4. Detección automática y visual del resultado del arqueo: Caja Cuadrada ($0, verde), Sobrante (+$, azul), Faltante (-$, rojo con justificación obligatoria).
  * Comprobante Térmico POS de 58 mm (`CashTicketModal`):
    1. Formato `@page { size: 58mm auto; margin: 0; }` con 50 mm útiles.
    2. Encabezado de taller, fecha/hora de apertura y cierre, cajero responsable.
    3. Desglose detallado de efectivo, canales digitales, balance neto, arqueo contado y diferencia.
    4. Desglose opcional de billetes contados y espacio para firma física del cajero.
  * Pestaña de Histórico de Cajas Cerradas con tabla de auditoría permanente y botón para reimprimir cualquier comprobante previo.
  * Suite de pruebas automatizadas en `tests/cash.test.mjs` (14 pruebas con 100% PASS).

## Errores conocidos:
- Ninguno. Compilación limpia y pruebas ejecutadas exitosamente al 100%.

## Pruebas ejecutadas:
- Compilación de TypeScript y empaquetado de Vite (`npm run build`): PASS (0 errores).
- Normalización y extracción de códigos QR y sticker adhesivo: PASS (19/19).
- Mensajería con WhatsApp, plantillas oficiales y Deep links wa.me: PASS (13/13).
- Apertura formal de caja con base inicial en efectivo ($150.000 COP): PASS.
- Bloqueo estricto de apertura con monto inicial negativo: PASS.
- Registro de ingresos en efectivo, transferencias digitales y datáfono: PASS.
- Registro de egresos / salidas de taller en efectivo: PASS.
- Cálculo matemático exacto de efectivo en gaveta (`Base + Entradas - Salidas`): PASS.
- Segregación estricta de transferencias y tarjetas sin alterar gaveta física: PASS.
- Balance neto total de la jornada (`Total Ingresos - Total Egresos`): PASS.
- Calculadora de denominaciones de billetes colombianos: PASS.
- Detección de Caja Cuadrada ($0), Sobrante (+$) y Faltante (-$): PASS.
- Cierre formal de caja y consolidación en histórico: PASS.
- Regresión completa de las 15 fases del proyecto (12 suites de prueba): PASS (100%).

- Módulo de Facturación y Recibos Internos (14 pruebas automatizadas): PASS (100%).
  * Formato correlativo estricto FAC-000001 con relleno a 6 dígitos: PASS.
  * Secuencia correlativa ininterrumpida y protección de integridad: PASS.
  * Desglose financiero de ítems, descuentos comerciales y régimen tributario (IVA): PASS.
  * Conversión fidedigna e importación directa desde Órdenes de Trabajo (OT): PASS.
  * Sincronización automática de ingresos cobrados en la Caja activa: PASS.
  * Anulación controlada de facturas con motivo obligatorio registrado: PASS.
  * Compartir comprobante por WhatsApp con formato nacional Colombia: PASS.
  * Métricas y KPIs consolidados de facturación: PASS.
- Regresión completa de las 16 fases del proyecto (13 suites de prueba): PASS (100%).
- Centro de Impresión Térmica de 58 mm (13 pruebas automatizadas): PASS (100%).
  * Valores predeterminados de taller y hardware térmico (58mm, 3 líneas de avance): PASS.
  * Cálculo exacto de margen y ancho útil milimétrico (52 mm para rollo de 58 mm): PASS.
  * Escala tipográfica adaptativa para legibilidad térmica (9.5px, 11px, 12.5px): PASS.
  * Generación de marbete adhesivo de bicicleta para marco con código QR: PASS.
  * Generación de comprobante de recepción técnica e inventario de accesorios: PASS.
  * Generación de tirilla de liquidación y entrega de orden con desglose y garantía: PASS.
  * Generación de tirilla térmica POS de factura con datos del cliente y medio de pago: PASS.
  * Soporte automático de Venta Rápida (Consumidor Final) en factura térmica: PASS.
  * Generación de tirilla de arqueo y cierre diario de caja con desglose: PASS.
  * Detección visual y registro de descuadre (Faltante / Sobrante) en tirilla: PASS.
  * Generación de tirilla de prueba con regla milimétrica y barra de densidad: PASS.
  * Estándar CSS @page { size: auto; margin: 0; } uniforme en todas las plantillas: PASS.
  * Ciclo de persistencia, personalización y restauración de fábrica en LocalStorage: PASS.
- Regresión total de las 17 fases del proyecto (14 suites de prueba): PASS (100%).
- Catálogo Público de Productos (/productos, sin login) (12 pruebas automatizadas): PASS (100%).
  * Sanitización estricta de productos públicos (cost_price, min_stock, location y notas internas omitidos): PASS.
  * Detección automática de disponibilidad según stock en tiempo real y fallback de imagen: PASS.
  * Exclusión estricta de productos desactivados (is_active: false): PASS.
  * Filtrado reactivo por categoría con insignias de conteo dinámico: PASS.
  * Búsqueda inteligente multi-criterio (nombre, marca, código SKU y categoría): PASS.
  * Filtro de disponibilidad inmediata para entrega en tienda: PASS.
  * Algoritmos de ordenamiento (menor precio, mayor precio, alfabético A-Z y relevancia): PASS.
  * Conteo dinámico de productos activos por categoría inmune a productos inactivos: PASS.
  * Resolución de deep-link por ID o SKU (?p=ID / ?sku=SKU) para compartir en redes: PASS.
  * Construcción de enlace de WhatsApp con formato nacional (+57), cotización calculada y desglose: PASS.
- Regresión completa de las 18 fases del proyecto (15 suites de prueba): PASS (100%).
- Configuración PWA (Manifest, Service Worker, Instalación, Offline) (12 pruebas automatizadas): PASS (100%).
  * Especificación W3C de Manifest Web App (name, short_name, standalone, colores de tema): PASS.
  * Iconos de aplicación adaptables de alta definición (192px, 512px y maskable safe-zone): PASS.
  * Accesos directos para pantalla de inicio móvil (Nueva OT, Catálogo, Escanear QR, Caja): PASS.
  * Integridad de activos vectoriales en public/icons/: PASS.
  * Plantilla de respaldo offline corporativa con diagnóstico y botón de recarga (offline.html): PASS.
  * Ciclo de vida y estrategias de caché del Service Worker (Install, Activate, Fetch, Message): PASS.
  * Metadatos PWA para iOS Safari, Android y navegadores de escritorio en index.html: PASS.
  * Detección precisa de iOS para instrucciones personalizadas de instalación en Safari: PASS.
  * Detección reactiva de modo Standalone en Android, iOS y Desktop: PASS.
  * Máquina de estados de conectividad reactiva (Online -> Offline -> Conexión restaurada): PASS.
  * Paridad de manifest.json para compatibilidad con navegadores legacy: PASS.
  * Presencia de todos los artefactos PWA en el bundle de producción (dist/): PASS.
- Regresión total de las 19 fases del proyecto (16 suites de prueba): PASS (100%).
- Auditoría de Seguridad (RLS, Sanitización, Protección de Rutas) (14 pruebas automatizadas): PASS (100%).
  * Prevención estricta de XSS (Scripts, iframes, atributos onerror/onload y esquemas maliciosos eliminados): PASS.
  * Mitigación de Open Redirects en flujo de autenticación y navegación (isSafeInternalRedirect): PASS.
  * Integridad financiera y prevención de cantidades negativas o corruptas en caja y facturación: PASS.
  * Normalización estricta de telefonía nacional e internacional (+57) y neutralización de caracteres: PASS.
  * Validación RFC y sanitización de correos electrónicos corporativos: PASS.
  * Aislamiento alfanumérico en referencias SKU y documentos de identidad (Cédulas/NIT): PASS.
  * Verificación criptográfica y regex de identificadores QR autorizados (^BIKE-[0-9A-F]{6}$): PASS.
  * Enmascaramiento de información privada del cliente (PII) para comprobantes públicos: PASS.
  * Bloqueo de esquemas peligrosos (javascript:, data:, vbscript:) en enlaces web: PASS.
  * Ausencia determinista de cost_price, min_stock y location en vistas públicas del catálogo: PASS.
  * Protección y ocultación de notas técnicas privadas y datos personales en el timeline público por QR: PASS.
  * Integridad de scripts SQL de endurecimiento RLS e inmutabilidad financiera en PostgreSQL: PASS.
  * Presencia de directivas y meta tags de seguridad HTTP (X-Content-Type-Options, Referrer-Policy) en index.html: PASS.
  * Garantía de inmutabilidad y prevención de fraude en arqueos y movimientos de cajas cerradas: PASS.
- Regresión total de las 20 fases del proyecto (17 suites de prueba): PASS (100%).
- QA Completo (Runner Maestro, Suite E2E de Negocio y Auditoría de Responsividad/A11y) (18 pruebas automatizadas adicionales): PASS (100%).
  * Simulación de ciclo de vida completo de cliente y bicicleta desde recepción hasta retiro conforme: PASS.
  * Asignación y vinculación criptográfica de código QR oficial en flujo de recepción: PASS.
  * Mapeo inmutable de daños preexistentes, accesorios en custodia y firma digital táctil: PASS.
  * Evolución de orden de trabajo OT-000001 a través de sus 6 estados operacionales sin saltos: PASS.
  * Descuento atómico de existencias en Kardex con trazabilidad contable de repuestos instalados: PASS.
  * Emisión de factura correlativa FAC-000001 y sincronización transaccional de cobro en Caja: PASS.
  * Comprobante físico térmico de 58 mm con términos contractuales y cláusula de garantía de 30 días: PASS.
  * Notificación automática de retiro por WhatsApp formateada con indicativo de país (+57): PASS.
  * Verificación del timeline certificado por QR preservando la privacidad del propietario: PASS.
  * Meta tag de Viewport optimizado para teléfonos móviles en index.html: PASS.
  * Cálculo matemático de ratios de contraste cromático superiores a 4.5:1 (WCAG AA): PASS.
  * Dimensiones táctiles mínimas para botones móviles (>= 44x44 px): PASS.
  * Estructura semántica de ventanas modales con ARIA roles y captura de tecla Escape: PASS.
  * Etiquetas accesibles aria-label en botones de solo icono para lectores de pantalla: PASS.
  * Jerarquía HTML semántica estricta (<header>, <nav>, <main>, <footer>): PASS.
  * Adaptabilidad responsiva escalonada (1 columna móvil, 2 columnas tablet, 3 columnas desktop): PASS.
  * Regiones vivas no disruptivas (aria-live="polite") para notificaciones PWA en segundo plano: PASS.
  * Ejecución consolidada del Runner Maestro (19 suites, 204 verificaciones en <3 segundos): PASS.
- Regresión global de las 21 fases del proyecto (19 suites de prueba en `tests/`): PASS (100%).

## Pruebas pendientes:
- Pruebas para la Prueba Completa de Negocio Extremo a Extremo en Producción (Fase 22).

## Decisiones técnicas:
- **Sanitización de Datos Comerciales Sensibles (`sanitizePublicProduct`)**: Para evitar fugas de información estratégica y proteger los márgenes del taller, el servicio público filtra rigurosamente el precio de costo (`cost_price`), el stock mínimo (`min_stock`), la ubicación física en el taller (`location`) y notas privadas antes de servir cualquier dato a la vista pública.
- **Bolsa de Cotización y Deep-Link de WhatsApp en vez de Pasarela**: Al ser un taller de bicicletas enfocado en servicio técnico, instalación y retiro físico, los clientes prefieren consultar disponibilidad o asesoría técnica antes de pagar en línea. La bolsa flotante permite acumular repuestos y generar un mensaje instantáneo a WhatsApp con el formato comercial colombiano (+57), detalle de productos y cálculo estimado en pesos colombianos ($ COP).
- **Service Worker con Estrategia Mixta (Network First + Cache First + Offline Fallback)**: Para la navegación entre vistas del taller y del catálogo público se utiliza *Network First* garantizando que los datos más recientes siempre se descarguen si hay conexión; en caso de fallo de red, se sirve la versión cacheada o la pantalla de contingencia `offline.html`. Para activos estáticos (iconos, fuentes, scripts empaquetados con hash) se emplea *Cache First* con actualización en segundo plano para una carga instantánea.
- **Instalación Multi-Plataforma con Guía Nativa para iOS Safari**: Debido a que Safari en iOS no soporta el evento nativo `beforeinstallprompt`, el sistema detecta dispositivos Apple y presenta instrucciones visuales con los íconos de "Compartir" -> "Agregar a pantalla de inicio" (+), mientras que en Android y Desktop lanza directamente la solicitud de instalación del navegador.
- **Gestión Reactiva de Conectividad (`PWAContext`)**: Se implementó una máquina de estados con auto-ocultado de la alerta verde de "Conexión restaurada" y un banner persistente en modo desconectado para tranquilizar al usuario de que la app sigue operable localmente.
- **Inmutabilidad Financiera por Disparador en PostgreSQL (`tr_cash_movement_immutability`)**: Para prevenir fraudes o alteraciones retroactivas de arqueos en el taller, una vez que una sesión de caja es cerrada (`closed_at IS NOT NULL`), el motor de base de datos rechaza de forma inmutable cualquier inserción, actualización o eliminación de movimientos asociados a dicha caja.
- **Blindaje Estricto de Roles y Aislamiento de Perfiles (RLS)**: Se restringió la política de `profiles` de forma que los técnicos mecánicos solo pueden actualizar sus propios datos personales de contacto, imposibilitando la auto-promoción no autorizada a rol administrador.
- **Protección contra Open Redirects (`isSafeInternalRedirect`)**: En el proceso de inicio de sesión (`/login`), se valida que la ruta de retorno sea estrictamente un path interno de la aplicación (comenzando por `/` simple y descartando `//` o caracteres de escape de host), evitando que atacantes redirijan a los usuarios a sitios de phishing externos tras autenticarse.
- **Runner Maestro de QA Multiplataforma (`tests/qaRunner.mjs`)**: Orquestador centralizado de pruebas que descubre dinámicamente las 19 suites de prueba, mide tiempos en milisegundos, extrae aserciones individuales y presenta un tablero de métricas formateado con colores ANSI en terminal, integrable nativamente con `npm test` en cualquier entorno (Windows, Linux, CI/CD).

## Próximo paso:
Esperar la confirmación explícita del usuario ("confirmo") para iniciar **FASE 22 — PRUEBA COMPLETA DE NEGOCIO EXTREMO A EXTREMO**.
