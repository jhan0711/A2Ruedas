# 🚀 GUÍA OFICIAL DE DESPLIEGUE A PRODUCCIÓN — A2RUEDAS PWA

Esta guía detalla la arquitectura de infraestructura, configuración en la nube, procedimientos de despliegue continuo (CI/CD), seguridad, contingencia y mantenimiento para el sistema de taller **A2Ruedas**.

---

## 1. Arquitectura de Producción

El sistema opera bajo un modelo desacoplado moderno orientado a alta disponibilidad, costo cero o mínimo, y resiliencia offline:

```text
                     INTERNET
                         │
                         ▼
                  ┌─────────────┐
                  │    Vercel   │
                  │   / Netlify │
                  │ React + PWA │  (Frontend estático SPA, Service Worker)
                  └──────┬──────┘
                         │
             HTTPS / API │ (REST / PostgREST & WebSocket Realtime)
                         ▼
                  ┌─────────────┐
                  │  Supabase   │
                  │             │  (PostgreSQL 15+, Auth, RLS, Storage,
                  │ PostgreSQL  │   Copias de seguridad automáticas)
                  │ Auth / RLS  │
                  └─────────────┘
```

- **Frontend:** SPA desarrollada en React 19 + TypeScript + Tailwind CSS v4, empaquetada con Vite 8 y distribuida globalmente por CDN (Vercel / Netlify Edge Network).
- **Backend / Persistencia:** Base de datos relacional PostgreSQL administrada en **Supabase** (región us-east o sa-east), con políticas de seguridad a nivel de fila (Row Level Security - RLS).
- **PWA (Progressive Web App):** Instalable en Android (Chrome), iOS (Safari), Windows y macOS con soporte de caché de interfaz y contingencia offline.

---

## 2. Plataforma de Frontend (Vercel / Netlify)

### Especificaciones de Compilación
- **Framework Preset:** Vite
- **Node.js Version:** `20.x` o `22.x` LTS
- **Install Command:** `npm install`
- **Build Command:** `npm run build` (`tsc -b && vite build`)
- **Output Directory:** `dist`

### Configuración de Redirecciones SPA
Para evitar errores 404 al recargar páginas internas (`/admin/ordenes`, `/productos`, etc.):
- En Vercel: [`vercel.json`](file:///c:/dev/A2Ruedas/vercel.json) gestiona el rewrite hacia `/index.html`.
- En Netlify: [`netlify.toml`](file:///c:/dev/A2Ruedas/netlify.toml) gestiona el redirect `/* -> /index.html 200`.

---

## 3. Base de Datos y Backend (Supabase)

- **Instancia Oficial:** `https://bmwrsekgpfculdtzvcfx.supabase.co`
- **Motor:** PostgreSQL 15.x
- **Tablas Principales:**
  - `products`: Catálogo de repuestos y accesorios con control de stock e imágenes.
  - `product_categories`: Categorías organizadas de repuestos.
  - `customers`: Directorio unificado de clientes propietarios.
  - `work_orders`: Órdenes de trabajo, estados, mano de obra, repuestos y totales.
  - `work_order_items`: Desglose individual de intervenciones y repuestos por orden.
  - `appointments`: Citas y turnos de taller programados.
  - `invoices` e `invoice_items`: Facturación y liquidación fiscal de órdenes y ventas.
  - `cash_registers` y `cash_movements`: Turnos de caja, ingresos, egresos y arqueos.
  - `workshop_settings`: Parámetros operativos, dirección, horarios, NIT y datos de pie de ticket.

---

## 4. Redes, Dominio y DNS

- **Dominio Canónico:** Se recomienda configurar un dominio propio (ejemplo: `taller.a2ruedas.com` o `a2ruedas.com`).
- **Registros DNS requeridos (en Vercel o registrador):**
  - `A`: `@` ➔ `76.76.21.21` (Vercel)
  - `CNAME`: `www` ➔ `cname.vercel-dns.com`
- **Certificados SSL:** Generados y renovados de forma automática y gratuita mediante Let's Encrypt / Vercel Edge con forzado estricto de HTTPS.

---

## 5. Variables de Entorno

### Variables Públicas (Expuestas en Frontend)
| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | URL de la API de Supabase | `https://bmwrsekgpfculdtzvcfx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Llave anónima pública JWT | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `VITE_SUPABASE_ANON_KEY` | Alias de compatibilidad | *(Misma llave anon)* |

> ⚠️ **Regla de Seguridad:** NUNCA colocar la llave `SUPABASE_SERVICE_ROLE_KEY` en el archivo `.env` del frontend ni en variables con prefijo `VITE_`.

---

## 6. Control de Versiones y Flujo CI/CD

El repositorio está alojado en: `https://github.com/jhan0711/A2Ruedas.git`.

### Flujo de Despliegue Automatizado
1. Todo cambio se verifica localmente con:
   ```bash
   npm run build
   node scripts/predeployCheck.mjs
   ```
2. Al hacer `git push origin main`, el proveedor de nube detecta el commit y dispara la compilación y publicación automática en segundos.

---

## 7. PWA (Aplicación Web Progresiva)

- **Manifiesto:** Sincronizado en [`public/manifest.json`](file:///c:/dev/A2Ruedas/public/manifest.json) y [`public/manifest.webmanifest`](file:///c:/dev/A2Ruedas/public/manifest.webmanifest).
- **Íconos Oficiales:**
  - `icon-192x192.png`: Ícono estándar de alta definición.
  - `icon-512x512.png`: Ícono para pantallas de carga y launchers con soporte maskable.
- **Service Worker:** `sw.js` almacena en caché la shell de la aplicación e intercepta fallos de red para mostrar la interfaz sin conexión.

---

## 8. Seguridad y Control de Acceso (RLS)

- La seguridad no depende del frontend: cada tabla en Supabase tiene activado Row Level Security (**RLS**).
- La información financiera (`cash_registers`, `invoices`, `work_orders`) cuenta con políticas de restricción.
- Sanitización XSS implementada en formularios de cliente, notas y referencias.
- Headers HTTP estrictos configurados: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 9. Monitoreo y Solución de Problemas

1. **Si un registro no se ve en otro dispositivo:**
   - Verificar la consola del navegador (`F12` ➔ Console).
   - Comprobar que no haya errores de política RLS (`42501`) o campos no existentes en PostgREST (`PGRST204`).
   - Validar que la sesión de usuario esté autenticada en Supabase Auth.
2. **Si el frontend no actualiza:**
   - Limpiar la caché del Service Worker desde `Application ➔ Storage ➔ Clear site data`.
   - Forzar recarga con `Ctrl + F5`.
3. **Rollback:**
   - En el panel de Vercel/Netlify, ingresar a **Deployments**, ubicar la versión anterior estable y hacer clic en **Instant Rollback**.
