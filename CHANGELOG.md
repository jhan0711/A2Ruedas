# Registro de Cambios (Changelog): A2Ruedas

Todos los cambios notables en este proyecto serán documentados en este archivo.
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

---

## [0.3.0] - 2026-09-20

### Agregado
- **Fase 3 — Sistema Visual y Componentes Base**:
  - Implementación completa del Design System B2B propio utilizando Tailwind CSS v4.
  - Componente `Button` con 6 variantes semánticas, 3 tamaños, soporte de iconos y estado de carga (`isLoading`).
  - Componente `Input` con soporte para prefijos (`$`, `OT-`, etc.), iconos, modo monoespaciado y validación de errores.
  - Componente `Select` con chevron vectorizado y accesibilidad nativa.
  - Componente `Badge` con mapeo automático de los 9 estados de ciclo de taller (`RECIBIDA`, `DIAGNOSTICO`, `PRESUPUESTO`, `APROBADA`, `EN_REPARACION`, `ESPERANDO_REPUESTO`, `LISTA`, `ENTREGADA`, `CANCELADA`).
  - Componente `Card` modular (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
  - Componentes `Modal` y `ConfirmModal` para confirmación obligatoria de acciones destructivas (regla 44).
  - Componente `Table` de alta densidad con tipografía monoespaciada para seriales y valores numéricos.
  - Componente `Alert` con 4 estados (`info`, `success`, `warning`, `error`) y botón de descarte.
  - Componentes `LoadingSpinner` y `LoadingSkeleton` para prevenir pantallas en blanco.
  - Componente `EmptyState` para estados sin datos o sin registros.
  - Página interactiva de demostración y pruebas `DesignSystemPage` en `/admin/design-system`.
  - Refactorización de `DashboardPage` integrando los nuevos componentes UI.

---

## [0.2.0] - 2026-09-20

### Agregado
- **Fase 2 — Base del Frontend**:
  - Configuración completa de Vite 8 + React 19 + TypeScript + Tailwind CSS v4.
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
