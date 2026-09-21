import QRCode from 'qrcode';
import { Bicycle } from '../types/database';

/**
 * Normaliza y extrae el identificador estándar BIKE-XXXXXX desde cualquier texto o URL escaneada.
 * Ejemplos aceptados:
 * - "BIKE-8F3A92"
 * - "bike-8f3a92"
 * - "8F3A92"
 * - "https://a2ruedas.com/bike/BIKE-8F3A92"
 * - "http://localhost:5173/bike/BIKE-4C6310?ref=qr"
 */
export function extractQRCodeFromText(rawText: string): string | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();

  // 1. Patrón con prefijo BIKE- (6 caracteres hexadecimales)
  const fullMatch = trimmed.match(/BIKE-[0-9A-Fa-f]{6}/i);
  if (fullMatch) {
    return fullMatch[0].toUpperCase();
  }

  // 2. Si sólo se escaneó el token hexadecimal de 6 caracteres
  const hexOnlyMatch = trimmed.match(/^[0-9A-Fa-f]{6}$/);
  if (hexOnlyMatch) {
    return `BIKE-${hexOnlyMatch[0].toUpperCase()}`;
  }

  // 3. Si viene dentro de una URL /bike/XXX
  const urlMatch = trimmed.match(/\/bike\/([0-9A-Za-z-_]+)/i);
  if (urlMatch && urlMatch[1]) {
    const candidate = urlMatch[1].toUpperCase();
    if (candidate.startsWith('BIKE-')) return candidate;
    if (/^[0-9A-F]{6}$/i.test(candidate)) return `BIKE-${candidate}`;
    return candidate;
  }

  return null;
}

/**
 * Genera una DataURL (Base64 PNG) del código QR con corrección de error alta (H).
 */
export async function generateQRDataURL(
  text: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const defaultOpts: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'H', // 30% de recuperación de daños en caso de polvo o raspaduras en el sticker
    margin: 1,
    width: 320,
    color: {
      dark: '#0f172a', // Slate 900 de alto contraste
      light: '#ffffff',
    },
    ...options,
  };

  return QRCode.toDataURL(text, defaultOpts);
}

/**
 * Genera el código QR en formato SVG vectorial escalable.
 */
export async function generateQRSVG(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

/**
 * Construye la URL pública del perfil de la bicicleta para el código QR.
 */
export function buildPublicBikeUrl(qrCode: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://a2ruedas.app';
  return `${origin}/bike/${qrCode}`;
}

/**
 * Dibuja y genera un Canvas de alta definición (Sticker físico para el marco de la bicicleta).
 * Dimensiones: 600 x 360 px (aprox. 50mm x 30mm a 300 DPI para impresión nítida).
 */
export async function generateBikeStickerCanvas(
  bike: Bicycle,
  qrCode: string
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el contexto 2D de Canvas');

  // Fondo blanco nítido con esquinas redondeadas simuladas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Borde guía de corte exterior
  ctx.strokeStyle = '#cbd5e1'; // Slate 300
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

  // Cabecera: Barra azul A2Ruedas
  ctx.fillStyle = '#1e40af'; // Blue 800
  ctx.fillRect(10, 10, canvas.width - 20, 60);

  // Texto Cabecera: Marca del Taller
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('A2Ruedas', 30, 48);

  ctx.fillStyle = '#93c5fd'; // Blue 300
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('• TALLER DE BICICLETAS ESPECIALIZADO', 150, 47);

  // Generar imagen del QR en memoria
  const qrUrl = buildPublicBikeUrl(qrCode);
  const qrDataUrl = await generateQRDataURL(qrUrl, { width: 220, margin: 1 });
  const qrImage = new Image();

  await new Promise<void>((resolve, reject) => {
    qrImage.onload = () => resolve();
    qrImage.onerror = reject;
    qrImage.src = qrDataUrl;
  });

  // Dibujar el Código QR a la izquierda
  ctx.drawImage(qrImage, 30, 85, 200, 200);

  // Columna Derecha: Información técnica de la bicicleta
  const leftCol = 250;

  // Badge del Código QR Alfanumérico
  ctx.fillStyle = '#f8fafc'; // Slate 50
  ctx.fillRect(leftCol, 85, 315, 52);
  ctx.strokeStyle = '#f59e0b'; // Amber 500
  ctx.lineWidth = 2;
  ctx.strokeRect(leftCol, 85, 315, 52);

  ctx.fillStyle = '#b45309'; // Amber 700
  ctx.font = 'bold 11px monospace';
  ctx.fillText('ID OFICIAL DE MANTENIMIENTO', leftCol + 15, 103);

  ctx.fillStyle = '#0f172a'; // Slate 900
  ctx.font = 'bold 24px monospace';
  ctx.fillText(qrCode, leftCol + 15, 128);

  // Marca y Modelo de Bicicleta
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const bikeTitle = `${bike.brand} ${bike.model}`.substring(0, 24);
  ctx.fillText(bikeTitle, leftCol, 172);

  // Tipo, Color y Serial
  ctx.fillStyle = '#475569'; // Slate 600
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Modalidad: ${bike.bike_type} • Color: ${bike.color}`, leftCol, 198);

  if (bike.serial_number) {
    ctx.font = '12px monospace';
    ctx.fillText(`Serial: ${bike.serial_number}`, leftCol, 222);
  } else {
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`Registro Taller: ID-${bike.id.slice(0, 8)}`, leftCol, 222);
  }

  // Sello de Garantía / Verificación
  ctx.fillStyle = '#ecfdf5'; // Emerald 50
  ctx.fillRect(leftCol, 240, 315, 42);
  ctx.strokeStyle = '#10b981'; // Emerald 500
  ctx.lineWidth = 1;
  ctx.strokeRect(leftCol, 240, 315, 42);

  ctx.fillStyle = '#065f46'; // Emerald 800
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('✓ Historial Certificado A2Ruedas', leftCol + 12, 266);

  // Pie del Sticker
  ctx.fillStyle = '#64748b'; // Slate 500
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Escanea con la cámara de tu celular para consultar historial y mantenimientos.',
    canvas.width / 2,
    325
  );

  ctx.fillStyle = '#94a3b8'; // Slate 400
  ctx.font = '9px monospace';
  ctx.fillText('RESISTENTE A LA INTEMPERIE • ADHESIVO DE MARCO', canvas.width / 2, 343);

  return canvas;
}

/**
 * Descarga una etiqueta individual como archivo PNG de alta resolución.
 */
export function downloadStickerPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Dispara la ventana de impresión para una etiqueta individual o un pliego masivo de etiquetas.
 */
export function printStickersWindow(
  stickers: Array<{ dataUrl: string; qrCode: string; bikeName: string }>
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor habilita las ventanas emergentes (pop-ups) para imprimir las etiquetas.');
    return;
  }

  const stickersHtml = stickers
    .map(
      (s) => `
      <div class="sticker-card">
        <img src="${s.dataUrl}" alt="${s.qrCode}" />
        <div class="sticker-meta">${s.bikeName} — ${s.qrCode}</div>
      </div>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Impresión de Etiquetas QR A2Ruedas</title>
      <style>
        @page {
          size: letter;
          margin: 10mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          margin: 0;
          padding: 10px;
          background: #fff;
          color: #000;
        }
        .header-print {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 1px dashed #ccc;
          padding-bottom: 10px;
        }
        .header-print h2 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }
        .header-print p {
          margin: 0;
          font-size: 11px;
          color: #666;
        }
        .grid-stickers {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          justify-items: center;
        }
        .sticker-card {
          width: 100%;
          max-width: 340px;
          border: 1px dashed #bbb;
          padding: 6px;
          border-radius: 6px;
          box-sizing: border-box;
          page-break-inside: avoid;
          text-align: center;
        }
        .sticker-card img {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 4px;
        }
        .sticker-meta {
          font-size: 10px;
          font-family: monospace;
          color: #555;
          margin-top: 4px;
        }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header-print no-print">
        <h2>Pliego de Etiquetas Adhesivas QR — Taller A2Ruedas</h2>
        <p>Total de etiquetas para impresión: ${stickers.length}. Listo para imprimir en hoja adhesiva o papel continuo.</p>
        <button onclick="window.print()" style="margin-top: 8px; padding: 6px 16px; font-weight: bold; cursor: pointer;">
          🖨️ Imprimir Etiquetas Ahora
        </button>
      </div>

      <div class="grid-stickers">
        ${stickersHtml}
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}
