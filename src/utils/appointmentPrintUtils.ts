import { Appointment } from '../types/database';
import { workshopSettingsService } from '../services/workshopSettingsService';
import { printerService } from '../services/printerService';

export function generateAppointmentTicketHtml(appointment: Appointment): string {
  const cfg = printerService.getSettings();
  const widthMm = printerService.getPrintableWidthMm(cfg.paper_width);
  const settings = workshopSettingsService.getSettings();
  
  const dateFormatted = new Date(appointment.scheduled_at).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Comprobante de Cita - A2Ruedas</title>
      <style>
        @page { margin: 0; size: auto; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 4mm; width: ${widthMm}mm; font-size: 11px; color: #000; background: #fff; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .mb { margin-bottom: 5px; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        h1 { font-size: 16px; margin: 0 0 5px 0; }
        h2 { font-size: 14px; margin: 0 0 5px 0; }
        .row { display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="center mb">
        <h1>${settings?.name || 'A2RUEDAS'}</h1>
        <div>${settings?.address || 'Taller de Bicicletas'}</div>
        <div>Tel: ${settings?.phone || ''}</div>
      </div>
      
      <div class="line"></div>
      
      <div class="center bold mb" style="font-size: 14px;">COMPROBANTE DE CITA</div>
      
      <div class="mb">
        <div><strong>Fecha:</strong> ${dateFormatted}</div>
        <div><strong>Estado:</strong> ${appointment.status}</div>
      </div>
      
      <div class="line"></div>
      
      <div class="mb">
        <div><strong>Cliente:</strong> ${appointment.customer?.full_name}</div>
        <div><strong>Teléfono:</strong> ${appointment.customer?.phone || 'N/A'}</div>
      </div>
      
      <div class="line"></div>
      
      <div class="mb">
        <div><strong>Bicicleta:</strong> ${appointment.bicycle_info || 'No especificada'}</div>
        <div><strong>Servicio:</strong> ${appointment.service_name || 'General'}</div>
      </div>
      
      ${appointment.notes ? `<div class="line"></div><div class="mb"><strong>Notas:</strong> ${appointment.notes}</div>` : ''}
      
      <div class="line"></div>
      
      <div class="center mb" style="font-size: 10px; margin-top: 15px;">
        Te esperamos en la fecha y hora indicadas.
        ¡Gracias por confiar en nosotros!
      </div>
    </body>
    </html>
  `;
}

export function printAppointmentTicket(appointment: Appointment): void {
  const html = generateAppointmentTicketHtml(appointment);
  let iframe = document.getElementById('a2ruedas-universal-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'a2ruedas-universal-print-frame';
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
    };
  }
}
