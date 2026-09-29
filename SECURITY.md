# 🛡️ POLÍTICA Y AUDITORÍA DE SEGURIDAD — A2RUEDAS

Este documento detalla las directivas de seguridad informática, control de acceso, modelo de permisos y protección de datos implementadas en el sistema **A2Ruedas**.

---

## 1. Modelo de Autenticación y Control de Acceso

- **Motor de Autenticación:** Supabase Auth con JSON Web Tokens (JWT) seguros y cifrados en tránsito vía TLS/HTTPS.
- **Rutas Protegidas:** Componente `ProtectedRoute` en React Router que valida la existencia de una sesión de taller antes de conceder acceso a `/admin/*`.
- **Registro Público:** Deshabilitado. La creación de usuarios autorizados se administra de forma controlada.

---

## 2. Matriz de Políticas RLS (Row Level Security en Supabase)

| Tabla | Acceso Público (anon) | Acceso Taller (authenticated) | Notas de Seguridad |
| :--- | :---: | :---: | :--- |
| `products` | **SELECT** (solo productos activos) | **CRUD Completo** | Catálogo público para clientes; modificación solo por administradores. |
| `product_categories` | **SELECT** | **CRUD Completo** | Clasificación visible públicamente; gestión por personal autorizado. |
| `customers` | Restringido | **CRUD Completo** | Datos personales protegidos (Habeas Data). |
| `work_orders` | Restringido | **CRUD Completo** | Órdenes internas del taller, costos de mano de obra y notas. |
| `work_order_items` | Restringido | **CRUD Completo** | Desglose confidencial de intervenciones técnicas y repuestos. |
| `appointments` | Restringido | **CRUD Completo** | Agenda de turnos del taller. |
| `invoices` / `items` | Restringido | **CRUD Completo** | Información fiscal y financiera protegida. |
| `cash_registers` | Restringido | **CRUD Completo** | Arqueos de dinero y balances de turno. |
| `cash_movements` | Restringido | **CRUD Completo** | Movimientos de efectivo inmutables tras cierre de caja. |
| `workshop_settings` | **SELECT** | **ALL** | Datos de contacto y pie de página visibles para clientes. |

---

## 3. Protección contra Vulnerabilidades Web (OWASP Top 10)

1. **Inyección SQL (SQLi):**  
   Prevenida al 100% mediante el uso de Supabase SDK / PostgREST, que procesa todas las consultas utilizando sentencias preparadas y parámetros tipados en el motor PostgreSQL.
2. **Cross-Site Scripting (XSS):**  
   React sanitiza automáticamente cualquier contenido inyectado en el DOM. Además, el módulo `securityUtils.ts` filtra y escapa cadenas en campos de texto libre antes de su procesamiento.
3. **Fugas de Secretos:**  
   El repositorio Git y el frontend están libres de llaves de rol de servicio (`service_role`). Solo se expone la llave anónima pública (`anon key`), la cual está restringida por las políticas RLS.
4. **Cabeceras de Seguridad HTTP:**  
   Configuradas en `vercel.json` y `netlify.toml`:
   - `X-Frame-Options: SAMEORIGIN` (previene Clickjacking).
   - `X-Content-Type-Options: nosniff` (previene MIME sniffing).
   - `Referrer-Policy: strict-origin-when-cross-origin`.
   - `Permissions-Policy: camera=(self), microphone=(), geolocation=()`.
