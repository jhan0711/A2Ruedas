# Arquitectura del Sistema: A2Ruedas PWA

## 1. Visión General del Sistema

**A2Ruedas** es una Progressive Web Application (PWA) de alto rendimiento diseñada para la administración integral de un taller de bicicletas profesional.
El sistema está diseñado bajo estándares B2B modernos (inspirado en Linear, Vercel y Stripe Dashboard), priorizando densidad de información, legibilidad técnica, rendimiento de carga inmediata y compatibilidad con dispositivos móviles, tablets y computadoras de escritorio.

---

## 2. Separación de Experiencias y Seguridad

El sistema divide estrictamente sus usuarios en dos perfiles:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE ACCESO                          │
├────────────────────────────────────────┬───────────────────────────────┤
│ Experiencia Pública (Cliente)          │ Experiencia Privada (Admin)   │
│ - Sin autenticación ni registro        │ - Autenticación requerida     │
│ - Rutas: / , /productos, /bike/:id     │ - Rutas: /admin/*             │
│ - Consulta de catálogo y precios       │ - Gestión de órdenes (OT)     │
│ - Consulta de historial público por QR │ - Clientes, Bicicletas, Caja  │
│ - Sin acceso a inventario interno      │ - Inventario, Facturación     │
│ - Sin acceso a costos ni margen        │ - Agenda, Impresión, Config   │
└────────────────────────────────────────┴───────────────────────────────┘
```

---

## 3. Stack Tecnológico

### Frontend
- **Framework**: React 19 + TypeScript.
- **Bundler & Build Tool**: Vite (rápido, ligero, optimizado para PWA).
- **Estilos**: Tailwind CSS con diseño de tema claro/oscuro nativo vía clases `dark:`.
- **Enrutamiento**: React Router v6+ con layout anidado y guardias de ruta (`ProtectedRoute`).
- **Iconografía**: `lucide-react` (exclusivo; sin emojis como elementos de interfaz).
- **Notificaciones**: Componentes Toast accesibles y modales con confirmación de seguridad.

### Backend y Persistencia
- **Plataforma**: Supabase (`https://bmwrsekgpfculdtzvcfx.supabase.co`).
- **Base de Datos**: PostgreSQL 15+.
- **Seguridad**: Row Level Security (RLS) en todas las tablas:
  - Lectura pública anónima permitida únicamente en `products` (donde `is_active = true`) y datos no sensibles de `bicycles` vía código QR.
  - Escritura y lectura administrativa restringida a usuarios autenticados con rol administrativo en `profiles`.
- **Almacenamiento**: Supabase Storage para fotografías de recepción de bicicletas y repuestos.
- **Autenticación**: Supabase Auth (Email + Password para administración).

### Progressive Web App (PWA)
- **Plugin**: `vite-plugin-pwa` configurado con Workbox.
- **Manifiesto**: `manifest.webmanifest` con iconos adaptativos (192x192, 512x512, maskable), colores de tema y orientación responsive.
- **Service Worker**: Estrategia de caching para assets estáticos y funcionamiento resiliente ante caídas momentáneas de red.
- **Instalabilidad**: Prompt personalizado de instalación para Windows, Android e iOS (Safari).

---

## 4. Hardware y Periféricos Especializados

### A. Impresión Térmica de 58 mm
- **Estándar Físico**: Papel térmico de 58 mm de ancho (ancho útil imprimible de 48 mm / 384 puntos a 203 DPI).
- **Estrategia de Renderizado**:
  - Reglas CSS `@media print` dedicadas con `@page { size: 58mm auto; margin: 0; }`.
  - Tipografía monoespaciada compacta (`text-[10px]` a `text-xs`, interlineado ajustado).
  - Supresión automática de cabeceras, pies de página y márgenes de impresión del navegador.
  - Componente contenedor aislado para imprimir órdenes de trabajo (OT) y recibos/facturas.
- **Modo Simulación**: Visor de ticket en pantalla con papel continuo simulado, permitiendo ver el diseño real antes de imprimir a impresora física o PDF.
- **Hoja de ruta de integración física**: Documentación y soporte para drivers ESC/POS estándar de Windows y aplicaciones puente en Android (RawBT / Bluetooth Print).

### B. Generación y Escaneo de Códigos QR
- **Generación**: Formato unificado `BIKE-[HEX6]` (ejemplo: `BIKE-8F3A92`).
- **URL Segura**: Redirección a `/bike/:code`, mostrando marca, modelo y timeline de mantenimientos, ocultando estrictamente datos sensibles del cliente (teléfono, documento, costo de repuestos).
- **Escáner**: Integración con cámara web y móvil mediante `html5-qrcode`, con selector de cámara frontal/trasera, control de flash/linterna y soporte para subir fotos con QR.

### C. Firma Digital en Recepción
- **Tecnología**: HTML5 Canvas interactivo de alto refresco.
- **Soporte**: Eventos de puntero unificados (`pointerdown`, `pointermove`, `pointerup`) con escalado para pantallas táctiles de alta densidad (DPR).
- **Funcionalidad**: Dibujo fluido, botón para limpiar trazo, previsualización y exportación en formato PNG optimizado vinculado a la orden de trabajo.

---

## 5. Diseño UI/UX y Sistema Visual

- **Estilo**: B2B Técnico, compacto y de alta densidad de información.
- **Paleta de Colores**:
  - **Modo Claro**: Fondos `slate-50`, tarjetas `white` con bordes `border-slate-200`, textos `slate-900` y secundarios `slate-600`.
  - **Modo Oscuro**: Fondos `slate-950` / `gray-950`, tarjetas `slate-900` con bordes `border-slate-800`, textos `slate-100` y secundarios `slate-400`.
  - **Acento**: `blue-600` (acciones primarias) y `emerald-600` (estados de éxito / confirmación).
  - **Estados semánticos**:
    - Azul (`blue-500`): Informativo.
    - Ámbar (`amber-500`): Pendiente / en proceso.
    - Esmeralda (`emerald-500`): Completado / pagado.
    - Rojo (`rose-500`): Cancelado / alerta / stock bajo.
- **Geometría**: `rounded-md` y `rounded-lg`. Sin sombras exageradas ni gradientes decorativos que reduzcan el rendimiento.
- **Tipografía Monoespaciada**: Obligatoria para IDs, seriales de bicicletas, números de OT, códigos QR, SKU de productos y valores monetarios.

---

## 6. Estructura Modular del Código Fuente

```text
src/
├── app/                  # Configuración de rutas y proveedores globales
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
├── assets/               # Imágenes, logotipos y fuentes
├── components/           # Componentes reutilizables de UI
│   ├── ui/               # Button, Input, Modal, Badge, Card, Table, Alert, EmptyState
│   ├── layout/           # AdminLayout, PublicLayout, Sidebar, Header, MobileNav
│   ├── qr/               # QRGenerator, QRScanner, QRBadge
│   ├── signature/        # SignaturePad
│   ├── printing/         # ThermalTicket58, PrintPreviewModal
│   └── calendar/         # MaintenanceCalendar
├── features/             # Módulos por dominio de negocio
│   ├── auth/             # Login, sesión, guardias
│   ├── customers/        # CRUD clientes, historial
│   ├── bicycles/         # Registro de bicicletas, seriales, fotos
│   ├── inventory/        # Productos, stock, categorías, alertas
│   ├── work-orders/      # Órdenes de trabajo, estados, diagnóstico
│   ├── reception/        # Formulario de recepción + firma
│   ├── appointments/     # Agenda de citas y mantenimientos
│   ├── cash/             # Flujo de caja, ingresos, egresos, arqueo
│   ├── invoices/         # Facturas internas y recibos
│   ├── public-catalog/   # Catálogo público /productos y vista QR /bike/:id
│   └── whatsapp/         # Generador de mensajes y enlaces
├── hooks/                # Custom React hooks (useTheme, useAuth, usePrinter, useDebounce)
├── lib/                  # Clientes externos (supabase.ts)
├── services/             # Capa de acceso a datos desacoplada de la UI
├── types/                # Definiciones de TypeScript e interfaces de base de datos
└── utils/                # Formateadores de moneda, fechas, validadores
```

---

## 7. Principios de Mantenibilidad y Calidad

1. **Separación de Responsabilidades**: Ningún componente de interfaz realiza llamadas SQL o de API directas; se utiliza siempre la capa `services/` y hooks personalizados.
2. **Resiliencia y Estados de UI**: Toda vista contempla obligatoriamente los cinco estados: `loading`, `empty`, `error`, `success` y `disabled`.
3. **Acciones Peligrosas con Confirmación**: Eliminaciones y cancelaciones requieren modal de confirmación con detalle explícito de la acción.
4. **Trazabilidad y Auditoría**: Todo cambio de estado de una orden de trabajo o movimiento de caja queda registrado con fecha, hora, usuario y notas.
