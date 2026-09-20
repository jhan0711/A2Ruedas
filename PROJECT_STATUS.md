# Estado general del proyecto: A2Ruedas

Fase actual: FASE 2 — Base del Frontend
Estado: COMPLETADA
Última actualización: 2026-09-20

## Fases completadas:
- [x] FASE 0 — Análisis del Entorno
- [x] FASE 1 — Repositorio y Control de Versiones
- [x] FASE 2 — Base del Frontend (Vite + React + TS + Tailwind + Router + Lucide)

## Fases pendientes:
- [ ] FASE 3 — Sistema Visual y Componentes Base (Design System B2B, Dark Mode)
- [ ] FASE 4 — Autenticación y Protección de Rutas
- [ ] FASE 5 — Supabase y Base de Datos (Modelos, Migraciones, RLS)
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
- Configuración de React 19 + TypeScript + Vite 8 + Tailwind CSS v4 con `@tailwindcss/vite`.
- Enrutamiento con React Router (`routes.tsx`) con separación arquitectónica entre experiencia pública (`/`, `/productos`, `/bike/:code`) y experiencia administrativa (`/admin/*`).
- Sistema de layouts:
  - `AdminLayout`: Header superior con switch de modo claro/oscuro, usuario técnico, status y Sidebar retráctil B2B con 12 módulos y soporte para pantallas táctiles/móviles.
  - `PublicLayout`: Catálogo y portal público sin login, información de taller, ubicación, horarios y botón WhatsApp.
- Vistas base implementadas:
  - `DashboardPage`: 8 KPIs en tiempo real (bicis en taller, mantenimientos hoy, órdenes abiertas, ingresos, ventas, alertas de stock bajo y caja actual), tabla de órdenes y estado de periféricos.
  - `HomePage`: Presentación del taller, consulta de bicicletas por QR, servicios y contacto.
  - `CatalogPage`: Catálogo de repuestos con filtros de búsqueda por categoría, selector de compra presencial y generador de pedido por WhatsApp.
  - `BikePublicPage`: Timeline cronológico de mantenimientos de bicicleta por código QR seguro (sin exponer datos personales del cliente).
  - `LoginPage`: Formulario administrativo de acceso.
  - `ModulePlaceholder`: Manejo ordenado de rutas administrativas pendientes de fases posteriores.
- Hook `useTheme` con persistencia en `localStorage` y sincronización con clase `.dark`.
- Estilos de impresión térmica `@media print` calibrados a 58 mm (48 mm imprimibles).

## Funcionalidades pendientes:
- Sistema de diseño de componentes atómicos UI propios en Tailwind (Fase 3).
- Autenticación real con Supabase Auth y guardia de rutas (Fase 4).
- Conexión a base de datos PostgreSQL en Supabase (Fase 5).

## Errores conocidos:
- Ninguno. Compilación limpia (`npm run build`) en 334 ms con 0 errores y 0 warnings. Servidor de desarrollo validado con HTTP 200.

## Pruebas ejecutadas:
- Compilación de TypeScript y empaquetado de Vite (`npm run build`): PASS.
- Inicialización y respuesta del servidor dev (`npm run dev` en `http://localhost:5173`): PASS (HTTP 200).
- Verificación de exclusión de dependencias en Git: PASS.
- Verificación de navegación entre rutas públicas y administrativas: PASS.

## Pruebas pendientes:
- Pruebas de integración de componentes UI reutilizables (Fase 3).

## Decisiones técnicas:
- **Tailwind CSS**: Versión 4 con `@tailwindcss/vite` de alto rendimiento y cero configuración extra de PostCSS.
- **Enrutamiento**: React Router v7 con `createBrowserRouter` y layouts anidados.
- **Iconografía**: `lucide-react` integrada en todos los módulos de navegación y métricas.
- **Alias de Importación**: `@/*` mapeado a `src/*` en `vite.config.ts` y `tsconfig.app.json` utilizando el estándar moderno `import.meta.dirname`.

## Próximo paso:
Iniciar **FASE 3 — SISTEMA VISUAL Y COMPONENTES BASE**: Construir design system B2B propio utilizando Tailwind (Botones, Inputs, Selects, Tablas con estados, Modales, Badges de estado, Cards técnicas, Alerts, Spinners de carga y Empty States).
