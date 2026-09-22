# 🖨️ A2Ruedas — Manual de Configuración de Impresión Térmica (58 mm y 80 mm)

Este manual proporciona las instrucciones exactas para conectar, configurar y calibrar impresoras térmicas de recibos (tickets y etiquetas adhesivas) en el taller **A2Ruedas**.

---

## 📌 1. Impresoras Compatibles

El sistema A2Ruedas utiliza estándares universales de impresión web y ESC/POS, haciéndolo compatible con el 100% de impresoras térmicas del mercado:

- **Impresoras de 58 mm (2 pulgadas):**
  - Modelos estándar POS-58, ZJiang ZJ-5890, Xprinter XP-58, GOOJPRT, Netum.
  - Impresoras portátiles Bluetooth para celular/tablet (MTP-II, PT-210, etc.).
- **Impresoras de 80 mm (3 pulgadas):**
  - Epson TM-T20 / TM-T88, Bixolon SRP-330, Xprinter XP-N160, Star Micronics.

---

## 🔌 2. Conexión de la Impresora

### Opción A: Conexión por Cable USB a Computador (Windows / Mac)
1. Conecta el cable de poder a la toma eléctrica y el cable USB a un puerto del computador.
2. Enciende la impresora con un rollo de papel térmico instalado (asegúrate de que la cara brillante del papel quede hacia la cabeza térmica).
3. En Windows, dirígete a **Configuración > Dispositivos > Impresoras y escáneres**.
4. Windows reconocerá el dispositivo como *"POS-58"*, *"Generic / Text Only"* o el nombre de la marca.
5. Instala el controlador suministrado por el fabricante (o descarga el driver universal *POS-58 Series Printer Driver*).

### Opción B: Conexión por Bluetooth a Teléfono o Tablet (Android)
1. Enciende la impresora térmica Bluetooth.
2. En el teléfono/tablet Android, ve a **Ajustes > Bluetooth** y presiona **Buscar dispositivos**.
3. Selecciona la impresora (usualmente aparece como *MTP-2*, *RPP02N* o *POS-Printer*).
4. Si solicita un PIN de emparejamiento, digita `0000` o `1234`.
5. *(Opcional recomendado)* Instala la aplicación gratuita **RawBT Print Service** desde Google Play Store para permitir impresión directa desde el navegador Chrome sin cuadros de diálogo adicionales.

---

## ⚙️ 3. Configuración Obligatoria del Navegador Web (Chrome / Edge)

Para que los tickets salgan perfectamente alineados, sin desperdicio de papel y con el código QR nítido, debes configurar los parámetros de impresión la primera vez que envíes un ticket. El navegador recordará estos ajustes para siempre:

```
┌──────────────────────────────────────────────────────────┐
│              VENTANA DE IMPRESIÓN DEL NAVEGADOR          │
├──────────────────────────────────────────────────────────┤
│  Destino:                  [ POS-58 Thermal Printer    ▼] │
│  Copias:                   [ 1                         ] │
│  Diseño:                   (o) Vertical   ( ) Horizontal  │
│  Color:                    (o) Blanco y negro             │
│                                                          │
│  [v] MÁS AJUSTES                                         │
│  Tamaño de papel:          [ 58mm x Roll / Continuo    ▼] │
│  Escala:                   [ 100% o Ajustar al área    ▼] │
│  Márgenes:                 [ NINGUNO (0 mm)            ▼] │ ⚠️ CRÍTICO
│  Encabezados y pies:       [ ] Desmarcado               │ ⚠️ CRÍTICO
│  Imprimir gráficos fondo:  [x] Marcado                    │
└──────────────────────────────────────────────────────────┘
```

### Explicación de los ajustes críticos:
1. **Márgenes = "NINGUNO":**
   - *Por qué es vital:* Si dejas los márgenes en "Predeterminado", el navegador forzará un espacio en blanco de 1 centímetro a la izquierda y el ticket se imprimirá cortado o desplazado hacia la derecha. Con "Ninguno", el diseño de 58 mm encaja exacto de borde a borde.
2. **Encabezados y pies de página = "DESMARCADO":**
   - *Por qué es vital:* Evita que en la parte superior e inferior del ticket salgan impresas la dirección web (`http://localhost...`), la fecha del navegador o el número de página `1/1`.
3. **Tamaño de papel = "58mm x Roll" o "Continuo":**
   - En las propiedades de la impresora en Windows, selecciona la opción de papel continuo para que la impresora avance solo el largo del ticket y corte justo donde termina la información.

---

## 🧾 4. Formatos de Impresión Disponibles en A2Ruedas

El sistema cuenta con 3 formatos especializados listos para impresión:

### Formato 1: Ticket de Entrega para el Cliente (58 mm)
- **Uso:** Se imprime y entrega al cliente al momento de recibir la bicicleta.
- **Contenido:**
  * Nombre comercial del taller, NIT, teléfono y dirección.
  * Número consecutivo de orden (ej. `ORD-2026-0038`).
  * Fecha de recepción y fecha prometida de entrega.
  * Nombre y teléfono del cliente.
  * Datos de la bicicleta (Marca, modelo, color, serie).
  * Lista de servicios solicitados y repuestos cotizados con precios en $ COP.
  * Total estimado a pagar y valor de abono recibido.
  * **Código QR de Seguimiento en Vivo:** El cliente puede escanear este código con la cámara de su celular en cualquier momento para ver si su bicicleta ya está en diagnóstico, en reparación o lista para retirar.
  * Texto legal de garantía y política de retiro de bicicletas.

### Formato 2: Comanda de Taller para el Mecánico
- **Uso:** Se cuelga en el soporte de mecánica junto a la bicicleta.
- **Contenido:**
  * Número de orden y nombre del mecánico asignado.
  * Lista de chequeo de accesorios recibidos (luces, ciclo-computador, candados).
  * Resumen de daños señalados en la inspección visual previa.
  * Especificación detallada de los trabajos mecánicos a realizar.
  * Casillas de verificación para control de calidad antes de entregar.

### Formato 3: Sticker Adhesivo con Código QR (Marco de la Bici)
- **Uso:** Rollo térmico adhesivo de 50x30 mm o 58 mm.
- **Contenido:**
  * Identificador de orden en tipografía grande y legible.
  * Placa interna o serie de marco.
  * Código QR de alta resolución.
  * Permite a los mecánicos escanear la bicicleta con el celular del taller para abrir la orden al instante sin tener que escribir nada.

---

## 🛠️ 5. Solución de Problemas Frecuentes

| Problema Detectado | Causa Principal | Solución Paso a Paso |
|---|---|---|
| **El ticket sale en blanco.** | El rollo de papel térmico está colocado al revés. | Abre la tapa de la impresora e invierte el rollo. La cara termosensible debe rozar la cuchilla/cabezal. |
| **El texto se imprime recortado en el lado derecho.** | El navegador tiene márgenes activados. | En la ventana de impresión, abre "Más ajustes", busca **Márgenes** y cámbialo a **"Ninguno"**. |
| **Sale impresa la URL web y la fecha arriba y abajo.** | Encabezados del navegador activos. | En la ventana de impresión, desmarca la casilla **"Encabezados y pies de página"**. |
| **El papel sale continuo sin detenerse.** | Sensor de fin de papel o tamaño configurado como Carta/A4. | Ve a las propiedades de la impresora en Windows > Preferencias de impresión > Tamaño de papel y selecciona **58mm x Roll** o **Continuo**. |
| **El código QR sale borroso o no lo lee la cámara.** | Escala del navegador modificada o cabezal sucio. | Verifica que la **Escala** esté en 100%. Limpia suavemente el cabezal térmico con un copito humedecido en alcohol isopropílico (con la impresora apagada). |
| **La impresora no responde al hacer clic en "Imprimir".** | Cable USB desconectado o cola de impresión bloqueada. | Abre el Administrador de Dispositivos de Windows, cancela documentos pendientes y reinicia el servicio de cola de impresión (*Spooler*). |

---

*Guía técnica de impresión térmica — A2Ruedas Taller de Ciclismo.*
