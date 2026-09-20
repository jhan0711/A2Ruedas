# Guía de Solución de Problemas (Troubleshooting): A2Ruedas

Esta guía está redactada especialmente para usuarios no técnicos. Si encuentras un inconveniente, busca el síntoma a continuación y sigue los pasos exactos para solucionarlo.

---

## 1. El servidor no inicia o dice que el puerto 5173 está ocupado

### ¿Por qué ocurre?
Otra ventana de terminal o proceso previo dejó abierta la aplicación en segundo plano.

### Solución paso a paso:
1. Abre tu terminal de **PowerShell**.
2. Copia y pega este comando para cerrar cualquier proceso residual en el puerto 5173:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force
```
3. Vuelve a iniciar la aplicación:
```powershell
npm run dev
```

---

## 2. Error al conectar con Supabase ("Invalid API Key" o pantalla sin datos)

### ¿Por qué ocurre?
El archivo `.env` no tiene las credenciales correctas o falta una letra en la clave anónima (`anon key`).

### Solución paso a paso:
1. Abre la carpeta `C:\dev\A2Ruedas`.
2. Verifica que exista el archivo `.env` (si no existe, cópialo desde `.env.example`).
3. Comprueba que las siguientes dos líneas estén completas:
```text
VITE_SUPABASE_URL=https://bmwrsekgpfculdtzvcfx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```
4. Guarda el archivo y reinicia el servidor (`npm run dev`).

---

## 3. La cámara no abre al escanear un código QR

### ¿Por qué ocurre?
El navegador web bloqueó los permisos de acceso a la cámara por seguridad.

### Solución paso a paso:
1. En la barra de direcciones de tu navegador (Chrome, Edge o Safari), haz clic en el ícono del **candado** o **ajustes del sitio** que aparece a la izquierda de la URL (al lado de `http://localhost:5173` o la dirección de la app).
2. Busca la opción **Cámara** y cámbiala a **Permitir** (Allow).
3. Recarga la página presionando `F5` o `Ctrl + R`.

---

## 4. La impresión del ticket de 58 mm sale cortada o con márgenes gigantes

### ¿Por qué ocurre?
El cuadro de diálogo de impresión de Windows tiene seleccionada una hoja tamaño Carta/A4 o tiene activados los márgenes estándar y cabeceras del navegador.

### Solución paso a paso:
1. En la ventana de impresión que se abre en tu navegador:
   - En **Destino**: Selecciona tu impresora térmica (o "Guardar como PDF").
   - En **Tamaño de papel**: Elige `58mm` (o `User Defined 58x210mm`).
   - En **Márgenes**: Cambia de "Predeterminados" a **Ninguno** (None).
   - En **Opciones**: Desmarca la casilla **Encabezados y pies de página** (Headers and footers).
2. Haz clic en **Imprimir**. La configuración quedará guardada para las siguientes impresiones.

---

## 5. El recuadro de firma no dibuja en pantalla táctil

### ¿Por qué ocurre?
El navegador interpreta el dedo como un gesto de desplazamiento (scroll) en lugar de un trazo de dibujo.

### Solución paso a paso:
1. El componente de firma de A2Ruedas previene automáticamente el desplazamiento táctil (`touch-action: none`).
2. Si un dispositivo antiguo no lo toma, utiliza un lápiz táctil capacitivo o firma con un trazo continuo sin soltar la pantalla.
3. Puedes hacer clic en el botón **Limpiar Firma** en cualquier momento para reiniciar el trazo.

---

## 6. La aplicación no se actualiza o muestra una versión vieja

### ¿Por qué ocurre?
Al ser una PWA (Progressive Web App), el navegador almacena una versión en caché para funcionar rápido y sin internet.

### Solución paso a paso:
1. En tu teclado presiona `Ctrl + Shift + R` (en Windows) o `Cmd + Shift + R` (en Mac). Esto fuerza una recarga limpia omitiendo la memoria caché.
2. Si la app está instalada en tu celular o escritorio, ciérrala por completo y vuelve a abrirla con conexión a internet para que el Service Worker aplique la nueva versión.
