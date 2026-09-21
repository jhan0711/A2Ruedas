/**
 * Utilidad de Impresión Aislada para Taller A2Ruedas
 *
 * Utiliza un <iframe> aislado para imprimir tickets y órdenes de trabajo sin interferencias
 * de modales de React, overflow: hidden, backdrops o límites de scroll de pantalla.
 */

export function printIsolatedElement(
  elementId: string,
  options: {
    pageTitle?: string;
    paperSize?: '58mm' | 'letter';
  } = {}
) {
  const { pageTitle = 'Comprobante A2Ruedas', paperSize = '58mm' } = options;

  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.error(`No se encontró el elemento con ID "${elementId}" para imprimir.`);
    window.print();
    return;
  }

  // Clonar contenido HTML del elemento a imprimir
  const contentHtml = targetElement.outerHTML;

  // Crear o reutilizar un iframe invisible fuera del viewport
  let iframe = document.getElementById('a2ruedas-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'a2ruedas-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('No se pudo acceder al documento del iframe de impresión.');
    window.print();
    return;
  }

  // Estilos según el tamaño de papel seleccionado
  const pageStyles =
    paperSize === '58mm'
      ? `
        @page {
          size: 58mm auto;
          margin: 0mm;
        }
        body {
          margin: 0;
          padding: 2mm 3mm;
          width: 52mm;
          max-width: 52mm;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 11px;
          line-height: 1.25;
          color: #000000;
          background: #ffffff;
        }
        #printable-thermal-ticket {
          width: 100% !important;
          max-width: 100% !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `
      : `
        @page {
          size: letter portrait;
          margin: 12mm 15mm;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          color: #0f172a;
          background: #ffffff;
        }
        #printable-formal-sheet {
          width: 100% !important;
          max-width: 100% !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `;

  const htmlDocument = `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>${pageTitle}</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          ${pageStyles}
          img {
            max-width: 100%;
            height: auto;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .border-b { border-bottom: 1px solid #cbd5e1; }
          .border-t { border-top: 1px solid #cbd5e1; }
          .border-dashed { border-style: dashed; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-3 > * + * { margin-top: 12px; }
          .space-y-4 > * + * { margin-top: 16px; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gap-3 { gap: 12px; }
          .gap-4 { gap: 16px; }
          .p-3 { padding: 12px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .pb-2 { padding-bottom: 8px; }
          .pt-2 { padding-top: 8px; }
          .pt-4 { padding-top: 16px; }
          .rounded { border-radius: 4px; }
          .bg-slate-50 { background-color: #f8fafc; }
          .text-slate-500 { color: #64748b; }
          .text-slate-600 { color: #475569; }
          .text-slate-700 { color: #334155; }
          .text-blue-700 { color: #1d4ed8; }
          .text-emerald-700 { color: #047857; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(htmlDocument);
  iframeDoc.close();

  // Esperar a que se carguen las imágenes (como la firma) antes de invocar el diálogo de impresión
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Error al imprimir desde iframe, recurriendo a impresión nativa:', e);
      window.print();
    }
  }, 350);
}
