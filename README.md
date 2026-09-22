# 🚴‍♂️ A2Ruedas — Progressive Web App para Taller y Almacén de Ciclismo

![A2Ruedas Banner](https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80)

[![Producción en Vivo](https://img.shields.io/badge/Producci%C3%B3n-a2ruedas.netlify.app-success.svg)](https://a2ruedas.netlify.app)
[![Estado del Proyecto](https://img.shields.io/badge/Fases_Completadas-26_de_26_(100%25)-emerald.svg)](./PROJECT_STATUS.md)
[![Pruebas QA](https://img.shields.io/badge/QA_Suite-25_Suites_|_100%25_PASS-blue.svg)](./tests/qaRunner.mjs)
[![Preflight Check](https://img.shields.io/badge/Preflight-6_de_6_Aprobadas-success.svg)](./scripts/predeployCheck.mjs)
[![TypeScript](https://img.shields.io/badge/TypeScript-Tipado_Estricto-informational.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Instalable_Offline-orange.svg)]()

🌐 **Aplicación Desplegada en Vivo:** [https://a2ruedas.netlify.app](https://a2ruedas.netlify.app)  
🛒 **Catálogo Público para Clientes:** [https://a2ruedas.netlify.app/productos](https://a2ruedas.netlify.app/productos)

**A2Ruedas** es una plataforma web progresiva (PWA) de nivel empresarial diseñada para la digitalización y gestión integral de talleres mecánicos de bicicletas y tiendas de ciclismo. Centraliza la atención a clientes, fichas técnicas de bicicletas con seriales y fotos, órdenes de trabajo con estados en vivo, inventario multidepartamento (bicicletas convencionales, e-bikes, indumentaria, suplementación y repuestos mecánicos), cotización con firma digital táctil, impresión térmica de tickets en 58 mm y 80 mm, control de caja diaria y vitrina web pública.

---

## 🌟 Características Principales

1. **Gestión Integral de Servicio Técnico:**
   - Registro de clientes con historial de visitas e identificación por documento/teléfono.
   - Fichas de bicicletas con número de serie único y galería fotográfica de inspección.
   - Recepción digital con checklist de accesorios, diagrama interactivo de averías y **firma digital táctil del cliente**.
   - Tablero Kanban y órdenes correlativas (`OT-000001` / `ORD-2026-XXXX`) con ciclo de 6 a 9 estados en tiempo real.
   - Envío automático de notificaciones de estado y recibos vía WhatsApp con enlaces de seguimiento.
2. **Hardware y Movilidad en Taller:**
   - **Impresión Térmica (58 mm y 80 mm):** Ticket de cliente, comanda para potro de mecánico y stickers adhesivos con código QR.
   - **Códigos QR de Bicicleta:** Identificadores únicos (`BIKE-XXXXXX`) para escaneo rápido con cámara de celular o lector de código de barras.
   - **PWA Instalable:** Acceso instantáneo en pantalla completa en computadores, tablets y celulares (Android / iPhone) con funcionamiento offline sin internet.
3. **Control Comercial, Inventario y Caja:**
   - **Gestión Dinámica de Categorías:** Soporte de fábrica para Bicicletas Convencionales, E-Bikes Eléctricas, Ropa Ciclista, Nutrición Deportiva y Repuestos Mecánicos, con creación inline y protección de integridad referencial.
   - Control de existencias con Kardex auditable (entradas, salidas, mermas) y alertas visuales de stock bajo.
   - Arqueo ciego de caja menor con registro de base inicial, entradas, gastos menores y balance de cierre.
   - Módulo de facturación con múltiples medios de pago (Efectivo, Nequi, Daviplata, Tarjetas).
4. **Vitrina Comercial Pública (`/productos`):**
   - Catálogo web optimizado para móviles sin necesidad de inicio de sesión.
   - Bolsa de cotización para que los clientes consulten disponibilidad y envíen su pedido directamente al WhatsApp del taller.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Interfaz reactiva con verificación estricta de tipos |
| **Herramienta de Build** | Vite | Compilación ultrarrápida, code-splitting y bundle optimizado |
| **Estilos y UI** | Tailwind CSS | Sistema visual B2B profesional con tema oscuro/claro nativo |
| **Enrutamiento** | React Router v6+ | Navegación SPA con carga perezosa (`React.lazy`) y fallback accesible |
| **Iconografía** | Lucide React | Iconos vectoriales semánticos |
| **Base de Datos & Auth** | Supabase (PostgreSQL) | Persistencia relacional, autenticación segura y políticas RLS |
| **PWA & Offline** | Vite PWA / Workbox | Service Worker, almacenamiento local persistente y manifiesto |

---

## 🚀 Inicio Rápido y Comandos

### Requisitos Previos
- **Node.js**: Versión 18 o superior (verificado con v24.15.0).
- **npm**: Versión 9 o superior.

### Comandos Principales
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo local (puerto 5173)
npm run dev

# 3. Compilar bundle de producción optimizado
npm run build

# 4. Ejecutar la batería completa de pruebas QA (25 suites)
npm test

# 5. Ejecutar la certificación integral de producción (Preflight Check)
npm run preflight
```

---

## 📚 Manuales de Operación y Documentación Oficial

El proyecto cuenta con documentación completa lista para operación y soporte:

- 📖 [**MANUAL_USUARIO.md**](./MANUAL_USUARIO.md): Guía ilustrada paso a paso para recepcionistas, mecánicos y cajeros.
- 🖨️ [**MANUAL_IMPRESION_58MM.md**](./MANUAL_IMPRESION_58MM.md): Guía de conexión física y calibración de impresoras térmicas USB/Bluetooth.
- 🚀 [**MANUAL_DESPLIEGUE.md**](./MANUAL_DESPLIEGUE.md): Instructivo para publicar en producción en Netlify o Vercel con base de datos en Supabase.
- 📜 [**ACTA_ENTREGA.md**](./ACTA_ENTREGA.md): Acta formal de entrega técnica con matriz de alcance al 100% y firmas.
- 📋 [**PROJECT_STATUS.md**](./PROJECT_STATUS.md): Matriz de avance y registro de las 26 fases ejecutadas.
- 🏗️ [**ARCHITECTURE.md**](./ARCHITECTURE.md): Arquitectura de software, componentes y flujo de datos.
- 🗄️ [**DATABASE.md**](./DATABASE.md): Diccionario de datos relacional y políticas de seguridad RLS.

---

## 📄 Licencia

Software desarrollado para **A2Ruedas Taller y Almacén de Ciclismo**. Todos los derechos reservados © 2026.
