# 🚀 A2Ruedas — Manual de Despliegue en Producción (Netlify / Vercel + Supabase)

Esta guía explica paso a paso cómo publicar el sistema **A2Ruedas** en internet para que el equipo del taller y los clientes puedan acceder desde cualquier computador, tablet o teléfono celular con conexión segura HTTPS.

---

## 📋 1. Requisitos Previos

1. **Código fuente en GitHub:** El repositorio de A2Ruedas (`https://github.com/jhan0711/A2Ruedas.git`) actualizado y con todos los cambios confirmados.
2. **Cuenta en Supabase:** Cuenta gratuita en [supabase.com](https://supabase.com) para la base de datos PostgreSQL en la nube.
3. **Cuenta en Netlify o Vercel:** Cuenta gratuita en [netlify.com](https://www.netlify.com) (recomendado) o [vercel.com](https://vercel.com).
4. **Node.js (v18 o superior):** Instalado en tu equipo para pruebas locales.

---

## 🗄️ 2. Paso 1: Configurar la Base de Datos en Supabase

1. Inicia sesión en **Supabase** y presiona **"New project"**.
2. Asigna un nombre a tu proyecto (ej. `a2ruedas-taller`), elige una contraseña segura para la base de datos y selecciona la región más cercana a Colombia (ej. *South America - São Paulo* o *US East*).
3. Una vez creado el proyecto, ve al menú lateral izquierdo y abre el **SQL Editor**.
4. Abre el archivo local [`supabase/schema.sql`](file:///c:/dev/A2Ruedas/supabase/schema.sql), copia todo su contenido, pégalo en el editor de Supabase y presiona **"Run"**.
   - Esto creará todas las tablas requeridas: clientes, bicicletas, órdenes de trabajo, inventario, categorías, movimientos de caja menor, facturas y citas.
5. Ve a **Project Settings > API** y copia los dos valores de conexión:
   - **Project URL:** `https://xxxxxxxx.supabase.co`
   - **API Key (anon / public):** `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

---

## 🧪 3. Paso 2: Certificación Pre-Vuelo Local (`npm run preflight`)

Antes de subir a internet, ejecuta en tu terminal local la verificación automática del sistema:

```bash
npm run preflight
```

El script validará automáticamente:
1. Variables de entorno activas.
2. Tipado estricto de TypeScript sin errores (`tsc -b`).
3. Compilación limpia del bundle con Vite (`npm run build`).
4. Presencia de archivos críticos en la carpeta `dist/` (`index.html`, `manifest.webmanifest`, `sw.js`, `_redirects`, etc.).
5. Tamaño de fragmentos de código menores a 500 kB (optimización de velocidad).
6. Aprobación al 100% de la batería de pruebas de calidad.

> **Resultado esperado:** `✔ CERTIFICACIÓN PREVIA AL DESPLIEGUE APROBADA: 6/6 VERIFICACIONES EXITOSAS`.

---

## 🌐 4. Paso 3: Despliegue en Netlify (Opción Recomendada)

Netlify es la plataforma recomendada para A2Ruedas gracias a su integración nativa con PWAs y manejo de enrutamiento SPA:

1. Ingresa a tu cuenta de **Netlify** y presiona **"Add new site" > "Import an existing project"**.
2. Conecta tu cuenta de **GitHub** y selecciona el repositorio **`A2Ruedas`**.
3. En la pantalla de configuración básica del despliegue, verifica los siguientes valores (que Netlify detectará automáticamente gracias a nuestro archivo [`netlify.toml`](file:///c:/dev/A2Ruedas/netlify.toml)):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Presiona **"Add environment variables"** y agrega las 2 variables de Supabase:
   - Nombre: `VITE_SUPABASE_URL` | Valor: `https://tu-proyecto.supabase.co`
   - Nombre: `VITE_SUPABASE_ANON_KEY` | Valor: `tu_clave_anonima_publica`
5. Haz clic en **"Deploy A2Ruedas"**.
6. En aproximadamente 60 segundos, Netlify completará la compilación y te entregará una URL pública segura con candado verde HTTPS (ej. `https://a2ruedas-taller.netlify.app`).

> **Nota de Enrutamiento:** El archivo `public/_redirects` y `netlify.toml` ya están configurados en el repositorio para que al recargar páginas internas (como `/admin/ordenes` o `/productos`) nunca aparezca el error 404 de página no encontrada.

---

## ⚡ 5. Paso 4: Despliegue en Vercel (Opción Alternativa)

Si prefieres usar Vercel:
1. Inicia sesión en **Vercel** y presiona **"Add New..." > "Project"**.
2. Importa el repositorio **`jhan0711/A2Ruedas`**.
3. Vercel detectará que es un proyecto **Vite**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Despliega la sección **"Environment Variables"** y añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Presiona **"Deploy"**.
6. El archivo [`vercel.json`](file:///c:/dev/A2Ruedas/vercel.json) incluido en el proyecto manejará automáticamente las reglas de reescritura de URLs para la PWA.

---

## 🏷️ 6. Paso 5: Conectar un Dominio Propio (ej. `taller.a2ruedas.com`)

Tanto Netlify como Vercel permiten asociar tu propio dominio o subdominio de forma gratuita y con certificado de seguridad SSL automático:

1. En el panel de Netlify o Vercel, ve a **Domain Management > Add a domain**.
2. Escribe tu dominio (ej. `a2ruedas.co` o `taller.a2ruedas.com`).
3. En el proveedor donde compraste el dominio (GoDaddy, Namecheap, Google Domains, etc.), añade el registro DNS indicado:
   - **Tipo:** `CNAME`
   - **Nombre / Host:** `taller` (o `@` si es el dominio principal)
   - **Valor / Destino:** El enlace que te indica Netlify (ej. `a2ruedas-taller.netlify.app`).
4. Espera unos minutos a que se propague el DNS. El sistema generará el certificado de seguridad HTTPS automáticamente.

---

## ✅ 7. Lista de Comprobación Post-Despliegue

Una vez publicado el sitio web:
- [ ] Ingresa a la URL desde el celular y verifica que aparezca la invitación de instalación de la aplicación.
- [ ] Inicia sesión en el panel administrativo (`/admin/login`).
- [ ] Crea un cliente de prueba y una orden de trabajo para confirmar la escritura en la base de datos Supabase.
- [ ] Ingresa a `/productos` y verifica que el catálogo de repuestos y bicicletas cargue sin errores.
- [ ] Envía un ticket de prueba a la impresora térmica para validar márgenes y legibilidad del código QR.

---

*Manual de despliegue en producción — A2Ruedas PWA.*
