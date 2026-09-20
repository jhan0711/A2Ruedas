# A2Ruedas — Progressive Web App para Taller de Bicicletas

![A2Ruedas Banner](https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80)

**A2Ruedas** es una aplicación web progresiva (PWA) de nivel empresarial diseñada para la administración y operación de talleres de bicicletas profesionales. Integra gestión de clientes, bicicletas, órdenes de trabajo, inventario con control de stock, caja diaria, facturación interna, firma digital táctil en recepción, generación y lectura de códigos QR, impresión térmica en formato de 58 mm y comunicación con clientes vía WhatsApp.

---

## 🌟 Características Principales

1. **Gestión Integral de Taller**:
   - Registro de clientes con historial completo.
   - Fichas técnicas de bicicletas con número de serie único y fotografías de estado.
   - Recepción digital con captura de daños, accesorios y **firma digital táctil**.
   - Órdenes de trabajo con numeración correlativa (`OT-000001`) y ciclo completo de estados.
2. **Hardware y Movilidad**:
   - **Impresión térmica de 58 mm**: Formatos compactos optimizados para tickets de trabajo y recibos.
   - **Códigos QR de Bicicleta**: Identificadores únicos (`BIKE-XXXXXX`) con escaneo por cámara y consulta pública segura.
   - **PWA instalable**: Funcionamiento fluido en computadores (Windows/macOS), tablets de recepción y celulares (Android/iOS).
3. **Control Comercial y Financiero**:
   - Inventario con alertas de stock bajo y kardex de movimientos.
   - Flujo de caja diario con registro de ingresos, egresos y arqueo de cierre.
   - Facturación y recibos internos independientes.
4. **Experiencia Dual (Seguridad)**:
   - **Panel Administrativo (`/admin`)**: Acceso exclusivo para técnicos y administradores autenticados.
   - **Catálogo Público (`/productos`)**: Consulta de repuestos y servicios sin acceso a datos privados ni inventario interno.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Interfaz reactiva y tipado estricto |
| **Herramienta de Build** | Vite | Compilación ultrarrápida y soporte HMR |
| **Estilos** | Tailwind CSS | Sistema visual B2B con modo claro y oscuro nativo |
| **Enrutamiento** | React Router v6+ | Navegación SPA y protección de rutas |
| **Iconografía** | Lucide React | Iconos vectoriales consistentes |
| **Backend & DB** | Supabase (PostgreSQL) | Persistencia, autenticación y Row Level Security (RLS) |
| **PWA** | Vite PWA / Workbox | Service Worker, caché y manifiesto web |

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js**: Versión 18 o superior (verificado con v24.15.0).
- **npm**: Versión 9 o superior (verificado con 11.12.1).

### Comandos de Ejecución
```bash
# 1. Instalar dependencias (a partir de la Fase 2)
npm install

# 2. Iniciar servidor de desarrollo local
npm run dev

# 3. Compilar para producción
npm run build

# 4. Previsualizar compilación de producción
npm run preview
```

---

## 📁 Documentos de Control del Proyecto

Este proyecto se rige por un estricto protocolo de desarrollo por fases documentadas:

- 📋 [**PROJECT_STATUS.md**](./PROJECT_STATUS.md): Control de avance de las 26 fases y registro de pruebas.
- 🏗️ [**ARCHITECTURE.md**](./ARCHITECTURE.md): Especificación técnica de software y hardware.
- 🗄️ [**DATABASE.md**](./DATABASE.md): Diccionario de datos relacional y políticas RLS.
- ⚙️ [**SETUP.md**](./SETUP.md): Manual paso a paso para el usuario no técnico.
- 🧪 [**TESTING.md**](./TESTING.md): Estrategia y matrices de pruebas unitarias, de integración y hardware.
- 🛠️ [**TROUBLESHOOTING.md**](./TROUBLESHOOTING.md): Guía de resolución de problemas comunes.
- 📝 [**CHANGELOG.md**](./CHANGELOG.md): Historial de versiones y cambios aplicados.

---

## 📄 Licencia

Proyecto privado desarrollado para **A2Ruedas**. Todos los derechos reservados.
