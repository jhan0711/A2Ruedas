# 🚴‍♂️ A2Ruedas — Manual de Operación y Usuario del Taller

Bienvenido al manual oficial de usuario de **A2Ruedas**, el sistema integral para la gestión profesional de talleres mecánicos de bicicletas y ventas de ciclismo.

Este manual está diseñado paso a paso para que cualquier miembro del equipo (recepcionistas, mecánicos, cajeros y administradores) domine el funcionamiento diario del taller sin complicaciones técnicas.

---

## 📑 Tabla de Contenido

1. [Primeros Pasos e Instalación (PWA)](#1-primeros-pasos-e-instalación-pwa)
2. [Módulo de Recepción de Bicicletas (Paso a Paso)](#2-módulo-de-recepción-de-bicicletas-paso-a-paso)
   - [Búsqueda y Registro de Cliente](#búsqueda-y-registro-de-cliente)
   - [Ficha de la Bicicleta](#ficha-de-la-bicicleta)
   - [Checklist de Accesorios](#checklist-de-accesorios)
   - [Diagrama Visual de Daños y Golpes](#diagrama-visual-de-daños-y-golpes)
   - [Cotización Inicial y Repuestos](#cotización-inicial-y-repuestos)
   - [Firma Digital Táctil del Cliente](#firma-digital-táctil-del-cliente)
3. [Gestión de Órdenes de Trabajo](#3-gestión-de-órdenes-de-trabajo)
   - [Ciclo de Estados de una Orden](#ciclo-de-estados-de-una-orden)
   - [Seguimiento y Cambio de Estado](#seguimiento-y-cambio-de-estado)
   - [Notificaciones Automáticas por WhatsApp](#notificaciones-automáticas-por-whatsapp)
4. [Impresión de Tickets y Etiquetas Térmicas (58 mm / 80 mm)](#4-impresión-de-tickets-y-etiquetas-térmicas-58-mm--80-mm)
5. [Catálogo de Productos, Repuestos y Categorías](#5-catálogo-de-productos-repuestos-y-categorías)
   - [Gestión Dinámica de Categorías (Bicicletas, E-Bikes, Ropa, Nutrición)](#gestión-dinámica-de-categorías)
   - [Creación y Edición de Productos](#creación-y-edición-de-productos)
   - [Control de Stock y Kardex de Inventario](#control-de-stock-y-kardex-de-inventario)
   - [Catálogo Web Público para Clientes](#catálogo-web-público-para-clientes)
6. [Control de Caja Menor y Flujo de Dinero](#6-control-de-caja-menor-y-flujo-de-dinero)
   - [Apertura de Turno](#apertura-de-turno)
   - [Entradas y Salidas de Efectivo](#entradas-y-salidas-de-efectivo)
   - [Arqueo Ciego y Cierre de Turno](#arqueo-ciego-y-cierre-de-turno)
7. [Módulo de Facturación y Cuentas](#7-módulo-de-facturación-y-cuentas)
8. [Preguntas Frecuentes y Solución de Problemas](#8-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. Primeros Pasos e Instalación (PWA)

A2Ruedas es una **Aplicación Web Progresiva (PWA)**, lo que significa que funciona desde el navegador web de cualquier computador, tablet o teléfono móvil (Android o iPhone), y puede **instalarse como una app nativa** sin necesidad de descargarla de una tienda de aplicaciones.

### ¿Cómo instalar A2Ruedas en el celular o tablet del taller?
- **En Android (Chrome):**
  1. Ingresa a la dirección web del taller.
  2. Aparecerá automáticamente un aviso en la parte inferior: **"Instalar A2Ruedas en tu pantalla de inicio"**.
  3. Presiona **Instalar**. El ícono de la aplicación aparecerá junto a tus demás aplicaciones.
- **En iPhone / iPad (Safari):**
  1. Abre la página en Safari.
  2. Presiona el botón de **Compartir** (el cuadro con la flecha hacia arriba).
  3. Desliza hacia abajo y elige **"Agregar a pantalla de inicio"**.
  4. Presiona **Agregar**.

> **Ventaja de la app instalada:** Funciona a pantalla completa, carga instantáneamente y te permite seguir operando en el taller incluso si hay cortes temporales de internet gracias a su base de datos local sincronizada.

---

## 2. Módulo de Recepción de Bicicletas (Paso a Paso)

La recepción es el momento clave para brindar confianza al cliente y proteger legalmente al taller documentando el estado real en que ingresa la bicicleta.

Para iniciar una recepción, dirígete en el menú a **Recepción** (`/admin/recepcion`).

### Paso 1: Búsqueda y Registro de Cliente
1. En el campo **"Buscar cliente por documento, teléfono o nombre"**, escribe el número de cédula o teléfono del cliente.
2. Si el cliente ya nos ha visitado, sus datos se cargarán automáticamente.
3. Si es un cliente nuevo, presiona **"Nuevo Cliente"**, completa sus nombres, apellidos, teléfono celular con WhatsApp y correo electrónico opcional.

### Paso 2: Ficha de la Bicicleta
1. Selecciona si es una bicicleta ya registrada del cliente o registra una nueva.
2. Ingresa **Marca** (ej. Trek, Specialized, GW, Scott), **Modelo**, **Color**, **Tipo** (Montaña MTB, Ruta, Gravel, Urbana, E-Bike Eléctrica) y opcionalmente el **Número de Serie del Marco** (fundamental para respaldo legal ante hurtos).

### Paso 3: Checklist de Accesorios
Para evitar reclamos futuros sobre elementos olvidados:
- Marca con un clic los accesorios que el cliente deja instalados en la bicicleta:
  - 🚲 Ciclocomputador / Odómetro
  - 💡 Luces delanteras / traseras
  - 🎒 Bolsa de sillín / Alforjas
  - 🍼 Portacaramañola / Caramañola
  - 🔔 Timbre / Soporte de celular
  - 🔒 Candado / Guaya
  - ⚙️ Pedales especiales (automáticos SPD, Look, Crankbrothers)
- Puedes añadir observaciones adicionales en el campo de texto si hay algún elemento no listado.

### Paso 4: Diagrama Visual de Daños y Golpes
A2Ruedas cuenta con un **diagrama interactivo de la bicicleta**:
1. Toca o haz clic sobre la parte del dibujo de la bicicleta donde detectes un daño existente (rayón, golpe en el marco, rin desalineado, desgarro en el sillín, etc.).
2. Selecciona el tipo de daño y añade una nota corta.
3. El sistema registrará los puntos marcados para que queden impresos en el comprobante y en la hoja de vida digital de la bicicleta.

### Paso 5: Cotización Inicial y Repuestos
1. Selecciona los servicios solicitados por el cliente (ej. *Mantenimiento General*, *Purga de Frenos Hidráulicos*, *Alineación de Rines*, *Ajuste de Cambios*).
2. Si se requieren repuestos inmediatos (pastillas de freno, cadena, cables, líquido tubeless), agrégalos con el botón **"+ Agregar Repuesto"**.
3. El sistema calculará automáticamente el subtotal, descuentos e IVA si aplica.
4. Define la **Fecha y Hora estimada de entrega** acordada con el cliente.

### Paso 6: Firma Digital Táctil del Cliente
1. Pídele al cliente que revise el resumen en la pantalla.
2. En el recuadro de **Firma de Conformidad**, el cliente firma directamente usando su dedo (en tablet/celular) o el ratón (en computador).
3. Presiona **"Crear Orden de Trabajo"**.
4. En ese instante, el sistema:
   - Genera el código de orden único (ej. `ORD-2026-0042`).
   - Envía el comprobante digital al WhatsApp del cliente con su código QR.
   - Habilita la impresión inmediata del ticket térmico y sticker.

---

## 3. Gestión de Órdenes de Trabajo

Ingresa a **Órdenes** (`/admin/ordenes`) para gestionar todos los trabajos activos del taller organizados en un tablero visual tipo Kanban o listado maestro.

### Ciclo de Estados de una Orden
Cada servicio atraviesa un flujo controlado para que todo el equipo sepa qué hacer:

```
[RECIBIDA] ➔ [DIAGNÓSTICO] ➔ [EN REPARACIÓN] ➔ [ESPERANDO REPUESTOS] ➔ [LISTA PARA ENTREGA] ➔ [ENTREGADA]
                                     ↓
                               [CANCELADA]
```

- **Recibida:** La bicicleta ingresó al taller y está en fila de espera.
- **Diagnóstico:** El mecánico está desarmando o evaluando averías no detectadas inicialmente.
- **En Reparación:** El trabajo técnico y la mano de obra se encuentran en ejecución.
- **Esperando Repuestos:** El servicio está pausado a la espera de repuestos especiales autorizados por el cliente.
- **Lista para Entrega:** El mecánico finalizó el mantenimiento y la bicicleta pasó el control de calidad. El cliente es notificado para que pase a recogerla.
- **Entregada:** El cliente pagó la cuenta y retiró su bicicleta del taller.

### Notificaciones Automáticas por WhatsApp
Desde la misma orden de trabajo, puedes hacer clic en el botón de **WhatsApp** para enviar mensajes automáticos prediseñados:
- Notificación de ingreso con enlace al ticket digital.
- Solicitud de autorización de presupuesto adicional si surge un imprevisto.
- Aviso de *"¡Tu bicicleta está lista para entrega!"*.
- Envío del resumen de cuenta y recibo de caja.

---

## 4. Impresión de Tickets y Etiquetas Térmicas (58 mm / 80 mm)

A2Ruedas está optimizado para impresoras térmicas de recibos de **58 mm (2 pulgadas)** y **80 mm (3 pulgadas)**.

Existen 3 tipos de documentos impresos:
1. **Ticket de Entrega al Cliente (58 mm):** Comprobante que se entrega al cliente al dejar su bicicleta, con fecha prometida, resumen de trabajos, valor estimado y código QR de seguimiento en vivo.
2. **Comanda de Taller para el Mecánico:** Hoja de trabajo que se cuelga en el potro de mecánica con la lista de tareas pendientes, accesorios recibidos y daños previos señalados.
3. **Sticker Adhesivo con Código QR:** Etiqueta pequeña para adherir al marco de la bicicleta. Permite al mecánico o al cliente escanear el QR con cualquier teléfono celular para ver la ficha técnica instantánea.

*(Para detalles de conexión física USB o Bluetooth, consulta el [MANUAL_IMPRESION_58MM.md](file:///c:/dev/A2Ruedas/MANUAL_IMPRESION_58MM.md)).*

---

## 5. Catálogo de Productos, Repuestos y Categorías

Accede a **Productos** (`/admin/productos`) para administrar todo el inventario del negocio.

### Gestión Dinámica de Categorías
A2Ruedas soporta departamentos especializados para tiendas que combinan taller y almacén:
- 🚲 **Bicicletas Convencionales:** Ruta, MTB, Gravel, Urbanas y BMX.
- ⚡ **Bicicletas Eléctricas (E-Bikes):** Asistidas, baterías de litio, cargadores y motores.
- 👕 **Ropa y Equipamiento:** Jerseys, pantalonetas con badana, zapatillas, guantes y cascos.
- 🥤 **Nutrición y Suplementos:** Geles energéticos, sales isotónicas, hidratantes y barras.
- ⚙️ **Componentes Mecánicos:** Transmisiones, pastillas de freno, llantas, lubricantes y calas.

**¿Cómo crear una nueva categoría?**
1. Haz clic en el botón **"Gestionar Categorías"** en la parte superior.
2. Escribe el nombre (ej. *"Herramientas Especiales"* o *"Accesorios de Viaje"*).
3. Haz clic en **"Agregar Categoría"**. ¡Listo! Aparecerá de inmediato en el taller y en la tienda web.
4. *Nota:* También puedes hacer clic en **`+ Nueva`** directamente dentro de la ventana de registro de un producto.

### Creación y Edición de Productos
Al registrar un producto puedes configurar:
- **Código SKU:** Identificador único (ej. `REP-CAD-09` o `BIC-GRV-01`).
- **Nombre y Marca:** Nombre comercial y fabricante (ej. Shimano, Maxxis, Specialized).
- **Costo de Compra y Precio de Venta:** El sistema calcula automáticamente el **Margen de Ganancia** en porcentaje y en pesos colombianos ($ COP).
- **Control de Stock y Alerta Mínima:** Si el stock cae a un nivel igual o inferior al mínimo configurado, el sistema emitirá una alerta visual para reordenar con los proveedores.
- **Ubicación Física:** Estante, gaveta o vitrina donde se encuentra guardado el repuesto.
- **Galería de Fotos:** Carga hasta 5 fotos del artículo para mostrarlas a los clientes.

### Catálogo Web Público para Clientes
Los clientes pueden ingresar a la vitrina web pública en la dirección `/productos` desde su celular:
- Pueden explorar repuestos por categorías.
- Pueden armar una **bolsa de cotización**.
- Con un solo toque, pueden enviar la lista de repuestos seleccionados directamente al WhatsApp del taller para apartarlos o agendar su instalación.

---

## 6. Control de Caja Menor y Flujo de Dinero

En la sección **Caja Menor** (`/admin/caja`), el taller lleva el control estricto del dinero en efectivo para evitar descuadres al final del día.

### Paso 1: Apertura de Turno
- Al iniciar la jornada, el cajero o administrador presiona **"Abrir Caja"**.
- Ingresa el monto base de sencillo en efectivo (ej. `$150.000 COP`).
- El turno queda formalmente abierto y vinculado al responsable.

### Paso 2: Entradas y Salidas de Efectivo
- **Entrada de Dinero:** Pagos de servicios, abonos de clientes o ventas directas de repuestos.
- **Salida de Dinero:** Gastos operativos menores (ej. compra de agua, bolsas de aseo, repuesto urgente de ferretería). Todo egreso exige motivo y destinatario obligatorio.

### Paso 3: Arqueo Ciego y Cierre de Turno
Para garantizar máxima honestidad y transparencia:
1. Al finalizar el turno, presiona **"Cerrar Caja"**.
2. El sistema aplica **Arqueo Ciego**: el cajero debe contar físicamente los billetes y monedas que tiene en la gaveta e ingresar el monto sin que el sistema le diga de antemano cuánto debería haber.
3. El sistema compara el conteo real contra el saldo esperado del sistema:
   - Si coincide exactamente: **Caja Cuadrada**.
   - Si hay sobrante o faltante: El sistema lo calcula y genera el comprobante de cierre de turno para firma del cajero y administrador.

---

## 7. Módulo de Facturación y Cuentas

En **Facturación** (`/admin/facturas`) se consolidan las cuentas de cobro y facturas del taller:
- Conversión de órdenes de trabajo finalizadas en factura con un clic.
- Registro de métodos de pago combinados: Efectivo, Nequi, Daviplata, Tarjeta Débito/Crédito o Transferencia Bancaria.
- Generación de comprobante digital en PDF y ticket térmico.

---

## 8. Preguntas Frecuentes y Solución de Problemas

### ¿Qué hago si se cae la conexión a internet en el taller?
No te preocupes. A2Ruedas almacena los datos de tus órdenes, productos y clientes en la memoria local de tu dispositivo. Puedes seguir atendiendo clientes, registrando bicicletas y cobrando. En cuanto regrese la señal, los datos se sincronizan automáticamente con la nube de Supabase.

### ¿Cómo busco la historia clínica de una bicicleta antigua?
Ve al menú **Bicicletas** (`/admin/bicicletas`) y digita el número de serie, la placa interna o el nombre del propietario. Verás la lista cronológica completa de todas las reparaciones, repuestos instalados y fechas de visita anteriores.

### ¿Se puede utilizar una pistola lectora de código de barras?
Sí. Cualquier lector de código de barras o código QR USB/Bluetooth que se conecte al computador o tablet funciona automáticamente como teclado. Al disparar sobre el código de un repuesto o sobre el ticket de una orden, el sistema abrirá la ficha correspondiente en milisegundos.

---

*Manual oficial versión 1.0 — A2Ruedas Taller y Almacén de Ciclismo.*
