# Guía de Instalación y Configuración: A2Ruedas PWA

Este documento explica de forma clara y sin tecnicismos cómo está configurado el entorno del proyecto y cómo interactuar con él.

---

## 1. Requisitos del Sistema Verificados

El entorno de desarrollo ha sido verificado automáticamente con las siguientes herramientas:

| Componente | Versión Detectada | Estado | Notas |
| :--- | :--- | :--- | :--- |
| **Sistema Operativo** | Windows 11 Pro 64-bit | ✅ Compatible | Sistema anfitrión |
| **Node.js** | v24.15.0 | ✅ Compatible | Motor de ejecución moderno |
| **npm** | 11.12.1 | ✅ Compatible | Gestor de dependencias |
| **Git** | 2.53.0.windows.1 | ✅ Compatible | Control de versiones |
| **Supabase** | Proyecto activo en la nube | ✅ Conectado | URL: `https://bmwrsekgpfculdtzvcfx.supabase.co` |

---

## 2. Estructura de Directorios del Proyecto

El proyecto reside en:
```text
C:\dev\A2Ruedas\
├── PROJECT_STATUS.md      # Estado general y control de fases
├── SETUP.md               # Esta guía paso a paso
├── ARCHITECTURE.md        # Arquitectura técnica del sistema
├── DATABASE.md            # Diccionario de base de datos (Fase 1)
├── CHANGELOG.md           # Registro de cambios por versión (Fase 1)
├── TESTING.md             # Matriz de pruebas (Fase 1)
├── TROUBLESHOOTING.md     # Guía de solución de problemas (Fase 1)
├── README.md              # Presentación del taller y proyecto (Fase 1)
└── src/                   # Código fuente de la aplicación (Fase 2+)
```

---

## 3. Instrucciones Paso a Paso para el Usuario

### ¿Cómo abrir la terminal en Windows?
1. Presiona la tecla `Windows` en tu teclado.
2. Escribe `PowerShell`.
3. Haz clic en **Windows PowerShell**.

### ¿Cómo navegar al proyecto?
Copia y pega este comando:
```powershell
cd C:\dev\A2Ruedas
```
Presiona `Enter`.

### ¿Cómo iniciar el servidor de desarrollo (a partir de la Fase 2)?
Una vez que configuremos la base del frontend en la Fase 2, el comando para iniciar el taller será:
```powershell
npm run dev
```
Luego abres tu navegador en la dirección que te indique la pantalla (usualmente `http://localhost:5173`).

---

## 4. Configuración de Supabase (Fase 5)

El proyecto de base de datos ya está creado en Supabase con los siguientes datos:
- **Proyecto**: `a2ruedas`
- **URL**: `https://bmwrsekgpfculdtzvcfx.supabase.co`
- **Región**: West US (Oregon)

En la Fase 5 configuraremos el archivo seguro `.env` con la clave anónima (`anon key`) para permitir la comunicación segura entre el sistema y la base de datos.

---

## 5. Simulación de Impresora Térmica 58 mm

Dado que no contamos con una impresora física de 58 mm conectada en este momento:
- El sistema incluye un **emulador visual de ticket de 58 mm** en pantalla.
- Al hacer clic en "Imprimir", el sistema genera la vista exacta con el ancho de papel térmico estándar (58 mm / 48 mm útiles).
- Podrás previsualizarlo en la ventana de impresión de Windows o guardarlo como archivo PDF.
- Si a futuro adquieres una impresora térmica USB o Bluetooth de 58 mm, el sistema ya estará 100% calibrado para enviar la impresión sin requerir cambios de software.
