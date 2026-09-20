# Registro de Cambios (Changelog): A2Ruedas

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

---

## [0.7.0] - 2026-09-20

### Agregado
- **Fase 7 — Módulo de Bicicletas**:
  - Implementación de la vista completa `BicyclesPage` en `/admin/bicicletas`.
  - Directorio y tabla de bicicletas con filtros reactivos por tipo (MTB, Ruta, Urbana, Gravel, BMX, Eléctrica, Infantil) y buscador multicriterio por marca, modelo, serial de marco o cliente propietario.
  - Soporte completo para relación 1 a Muchos ($1:N$), permitiendo que un mismo cliente registre múltiples bicicletas.
  - Modal de registro y edición técnica de bicicletas (marca, modelo, tipo, color, talla de cuadro, tamaño de rin, serial de fábrica, año, componentes y observaciones de ingreso).
  - Asignación automática de códigos QR únicos con formato `BIKE-XXXXXX` y enlace a timeline público.
  - Dossier / Ficha técnica de bicicleta con especificaciones completas, cliente propietario con enlace contextualizado a WhatsApp, código QR y órdenes de trabajo asociadas.
  - Galería interactiva de fotografías de inspección física y evidencia de daños previos clasificada por categorías (*general*, *daño*, *transmisión*, *frenos*, *cuadro*) con subida instantánea.
  - Modal de confirmación para eliminación con `ConfirmModal` (Regla 44).
  - Suite de pruebas automatizadas en `tests/bicycles.test.mjs` con 10 aserciones ejecutadas exitosamente.

---

### Agregado
- **Fase 6 — Módulo de Clientes**:
  - Implementación de la vista completa `CustomersPage` en `/admin/clientes`.
  - Directorio visual de clientes con tabla de alta densidad de información, avatares monocromáticos basados en iniciales y conteo en tiempo real.
  - Buscador reactivo multicriterio (búsqueda instantánea por nombre, teléfono y documento).
  - Modal de registro y edición de clientes con validación estricta de campos obligatorios.
  - Generación automática de enlace directo a WhatsApp (`https://wa.me/57...`) con número sanitizado y mensaje de cortesía prellenado.
  - Modal lateral/drawer de ficha técnica del cliente con visualización de datos de contacto, bicicletas vinculadas y listado de órdenes de trabajo asociadas.
  - Diálogo de confirmación de eliminación con `ConfirmModal` (Regla 44 de seguridad).
  - Suite de pruebas automatizadas en `tests/customers.test.mjs` con 9 aserciones de validación, búsqueda y relaciones.

---

### Agregado
- **Fase 5 — Supabase y Base de Datos**:
  - Script SQL de migración inicial `supabase/migrations/20260920000001_initial_schema.sql` con 20 tablas relacionales, llaves foráneas con borrado controlado, restricciones e índices.
  - Función RPC `get_bike_public_timeline(p_qr_code)` para consulta segura del historial de la bicicleta por QR sin exponer datos personales (PII) del cliente.
  - Activación de Row Level Security (RLS) en todas las tablas con reglas públicas para productos/categorías/servicios y reglas privadas para administración.
  - Tipos e interfaces de TypeScript en `src/types/database.ts` para todas las entidades y operaciones de inserción/actualización.
  - Capa de servicios modular y desacoplada en `src/services/` (`customerService`, `bicycleService`, `inventoryService`, `workOrderService`, `cashService`).
  - Script de validación de base de datos en `tests/database.test.mjs`.

---

## [0.4.0] - 2026-09-20

### Agregado
- **Fase 4 — Autenticación y Protección de Rutas**:
  - Instalación y configuración de `@supabase/supabase-js`.
  - Configuración de variables de entorno `.env` (ignorado en Git) y plantilla `.env.example`.
  - Inicialización del cliente Supabase en `src/lib/supabase.ts`.
  - Contexto de autenticación `AuthContext` y hook `useAuth` con manejo de sesión, login, logout y auto-refresh de tokens.
  - Guardia de seguridad `ProtectedRoute` para blindar todas las rutas bajo `/admin/*`.
  - Vista `LoginPage` conectada a `useAuth` con alertas de error y validación.
  - Botón de cierre de sesión en `Header` con modal de confirmación `ConfirmModal` (regla 44).
  - Script de pruebas automatizadas en `tests/auth.test.mjs` validando integración con el proyecto de Supabase.

---

## [0.3.0] - 2026-09-20

### Agregado
- **Fase 3 — Sistema Visual y Componentes Base**:
  - Implementación completa del Design System B2B propio utilizando Tailwind CSS v4.
  - Componentes UI: `Button`, `Input`, `Select`, `Badge`, `Card`, `Modal`, `ConfirmModal`, `Table`, `Alert`, `LoadingSpinner`, `LoadingSkeleton`, `EmptyState`.
  - Página de pruebas `DesignSystemPage` en `/admin/design-system`.
  - Refactorización de `DashboardPage` con los nuevos componentes.

---

## [0.2.0] - 2026-09-20

### Agregado
- **Fase 2 — Base del Frontend**:
  - Configuración de Vite 8 + React 19 + TypeScript + Tailwind CSS v4.
  - Configuración de React Router con arquitectura dividida: portal público y taller administrativo.
  - Layouts `AdminLayout` y `PublicLayout`.
  - Vistas base: `DashboardPage`, `HomePage`, `CatalogPage`, `BikePublicPage`, `LoginPage` y `ModulePlaceholder`.
  - Hook `useTheme` con persistencia en `localStorage`.
  - Calibración CSS `@media print` para tickets térmicos de 58 mm.

---

## [0.1.0] - 2026-09-20

### Agregado
- **Fase 0 — Análisis del Entorno**:
  - Inspección del sistema anfitrión (Windows 11 Pro 64-bit).
  - Verificación de herramientas: Node.js, npm, Git y Supabase.
  - Creación de documentación de arranque: `PROJECT_STATUS.md`, `SETUP.md` y `ARCHITECTURE.md`.
- **Fase 1 — Repositorio y Documentación de Control**:
  - Configuración del repositorio local de Git con rama principal `main`.
  - Configuración de `.gitignore` protector y documentación maestro (`DATABASE.md`, `README.md`, `TESTING.md`, `TROUBLESHOOTING.md`).
  - Creación del commit inicial.
