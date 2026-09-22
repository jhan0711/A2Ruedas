import {
  WorkOrder,
  Signature,
  Invoice,
  Bicycle,
  CashRegister,
  CashRegisterSummary,
  PrinterSettings,
} from '../types/database';
import { printerService } from '../services/printerService';
import { workshopSettingsService } from '../services/workshopSettingsService';

/**
 * Genera el documento HTML completo y estilizado para Factura / Orden de Trabajo (Carta / A4)
 */
export function generateFormalInvoiceHtml(order: WorkOrder, signature: Signature | null): string {
  const workshop = workshopSettingsService.getSettings();
  const customer = order.customer;
  const bike = order.bicycle;
  const items = order.items || [];
  const dateFormatted = new Date(order.created_at).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsRows =
    items.length === 0
      ? `<tr><td colspan="5" class="empty-items">En proceso de diagnóstico y evaluación técnica</td></tr>`
      : items
          .map(
            (it, idx) => `
        <tr>
          <td class="col-num">${idx + 1}</td>
          <td class="col-desc">
            <span class="item-name">${it.description}</span>
          </td>
          <td class="col-type"><span class="badge ${it.item_type}">${it.item_type === 'service' ? 'Mano de Obra' : 'Repuesto'}</span></td>
          <td class="col-qty">${it.quantity}</td>
          <td class="col-price">$${it.unit_price.toLocaleString('es-CO')}</td>
          <td class="col-total">$${it.total_price.toLocaleString('es-CO')}</td>
        </tr>
      `
          )
          .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Orden de Trabajo ${order.order_number} - A2Ruedas</title>
      <style>
        @page {
          size: letter portrait;
          margin: 12mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
        }
        .invoice-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        /* Encabezado */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 14px;
          border-bottom: 2px solid #0f172a;
        }
        .brand-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #0f172a;
          margin: 0 0 2px 0;
        }
        .brand-subtitle {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          margin: 0 0 4px 0;
        }
        .brand-info {
          font-size: 11px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }
        .doc-box {
          border: 1.5px solid #0f172a;
          border-radius: 6px;
          padding: 10px 14px;
          background-color: #f8fafc;
          text-align: right;
          min-width: 220px;
        }
        .doc-type {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doc-number {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 18px;
          font-weight: 900;
          color: #1e40af;
          margin: 2px 0;
        }
        .doc-date {
          font-size: 11px;
          color: #334155;
        }
        .doc-status {
          display: inline-block;
          margin-top: 4px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
        }

        /* Secciones Cliente y Bicicleta */
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 14px;
        }
        .card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 12px;
          background-color: #ffffff;
        }
        .card-header {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        .card-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 3px;
        }
        .card-label {
          color: #64748b;
          font-weight: 500;
        }
        .card-value {
          color: #0f172a;
          font-weight: 600;
          text-align: right;
        }

        /* Falla y Custodia */
        .info-panel {
          margin-top: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background-color: #f8fafc;
          padding: 10px 12px;
          font-size: 11px;
        }
        .panel-row {
          margin-bottom: 6px;
        }
        .panel-row:last-child {
          margin-bottom: 0;
        }
        .panel-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          display: block;
          margin-bottom: 2px;
        }
        .panel-content {
          color: #0f172a;
          margin: 0;
        }
        .panel-notes {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          color: #334155;
          margin: 0;
        }

        /* Tabla de Ítems */
        .table-section {
          margin-top: 16px;
        }
        .table-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0f172a;
          margin-bottom: 6px;
          display: block;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
        }
        th {
          background-color: #f1f5f9;
          color: #0f172a;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
          padding: 7px 8px;
          border: 1px solid #cbd5e1;
          text-align: left;
        }
        td {
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          font-size: 11px;
        }
        .col-num { width: 30px; text-align: center; color: #64748b; }
        .col-desc { font-weight: 500; }
        .col-type { width: 100px; text-align: center; }
        .col-qty { width: 45px; text-align: center; font-family: ui-monospace, monospace; }
        .col-price { width: 95px; text-align: right; font-family: ui-monospace, monospace; }
        .col-total { width: 95px; text-align: right; font-family: ui-monospace, monospace; font-weight: 700; }
        .empty-items {
          text-align: center;
          padding: 16px;
          color: #94a3b8;
          font-style: italic;
        }
        .badge {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .badge.service { background-color: #eff6ff; color: #1d4ed8; }
        .badge.part { background-color: #ecfdf5; color: #047857; }

        /* Liquidación Financiera */
        .summary-wrapper {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }
        .summary-box {
          width: 280px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background-color: #f8fafc;
          padding: 8px 12px;
        }
        .summary-line {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 3px 0;
          color: #475569;
        }
        .summary-line.total {
          border-top: 2px solid #0f172a;
          margin-top: 4px;
          padding-top: 6px;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }
        .summary-line.total .amount {
          color: #1e40af;
          font-family: ui-monospace, monospace;
        }

        /* Términos y Firmas */
        .footer-terms {
          margin-top: 16px;
          padding-top: 10px;
          border-top: 1px solid #cbd5e1;
          font-size: 9.5px;
          color: #64748b;
          line-height: 1.35;
        }
        .terms-heading {
          font-weight: 800;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 2px;
        }

        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 22px;
        }
        .sig-box {
          text-align: center;
        }
        .sig-img-container {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .sig-img {
          max-height: 55px;
          max-width: 180px;
          object-contain: contain;
        }
        .sig-line {
          border-top: 1px solid #475569;
          padding-top: 4px;
        }
        .sig-name {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
        }
        .sig-doc {
          font-size: 10px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Encabezado -->
        <div class="header">
          <div>
            <div class="brand-title">${workshop.name}</div>
            <div class="brand-subtitle">${workshop.header_slogan}</div>
            <div class="brand-info">
              NIT: ${workshop.nit} • Régimen Simplificado<br>
              ${workshop.address}${workshop.city ? `, ${workshop.city}` : ''}<br>
              Teléfono / WhatsApp: ${workshop.phone}
            </div>
          </div>

          <div class="doc-box">
            <div class="doc-type">ORDEN DE TRABAJO & SERVICIO</div>
            <div class="doc-number">${order.order_number}</div>
            <div class="doc-date">Fecha: ${dateFormatted}</div>
            <div><span class="doc-status">${order.status}</span></div>
          </div>
        </div>

        <!-- Tarjetas de Cliente y Bicicleta -->
        <div class="cards-grid">
          <div class="card">
            <div class="card-header">DATOS DEL CLIENTE (PROPIETARIO)</div>
            <div class="card-row">
              <span class="card-label">Nombre:</span>
              <span class="card-value">${customer?.full_name || 'Sin asignar'}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Teléfono:</span>
              <span class="card-value">${customer?.phone || 'N/A'}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Cédula / NIT:</span>
              <span class="card-value">${customer?.document_id || 'N/A'}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Dirección:</span>
              <span class="card-value">${customer?.address || 'Bogotá D.C.'}</span>
            </div>
          </div>

          <div class="card">
            <div class="card-header">DATOS DE LA BICICLETA</div>
            <div class="card-row">
              <span class="card-label">Marca / Modelo:</span>
              <span class="card-value">${bike ? `${bike.brand} ${bike.model}` : 'N/A'}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Tipo y Color:</span>
              <span class="card-value">${bike ? `${bike.bike_type} • ${bike.color}` : 'N/A'}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Serial del Marco:</span>
              <span class="card-value">${bike?.serial_number || 'Sin serial visible'}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Odómetro Entrada:</span>
              <span class="card-value">${order.entry_mileage_km ? `${order.entry_mileage_km} km` : 'No registra'}</span>
            </div>
          </div>
        </div>

        <!-- Falla Reportada y Custodia -->
        <div class="info-panel">
          <div class="panel-row">
            <span class="panel-title">MOTIVO DE INGRESO / FALLA REPORTADA POR EL CLIENTE:</span>
            <p class="panel-content"><em>"${order.reported_issues}"</em></p>
          </div>
          ${
            order.accessories_received
              ? `
            <div class="panel-row" style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
              <span class="panel-title">INVENTARIO DE ACCESORIOS RECIBIDOS EN CUSTODIA:</span>
              <p class="panel-content"><strong>${order.accessories_received}</strong></p>
            </div>
          `
              : ''
          }
          ${
            order.internal_notes
              ? `
            <div class="panel-row" style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
              <span class="panel-title">INSPECCIÓN TÉCNICA Y DAÑOS PREVIOS REGISTRADOS:</span>
              <p class="panel-notes">${order.internal_notes}</p>
            </div>
          `
              : ''
          }
        </div>

        <!-- Tabla de Ítems -->
        <div class="table-section">
          <span class="table-title">DETALLE DE INTERVENCIONES, REPUESTOS Y MANO DE OBRA</span>
          <table>
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-desc">Concepto / Descripción</th>
                <th class="col-type">Tipo</th>
                <th class="col-qty">Cant.</th>
                <th class="col-price">V. Unitario</th>
                <th class="col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>

        <!-- Liquidación Financiera -->
        <div class="summary-wrapper">
          <div class="summary-box">
            <div class="summary-line">
              <span>Mano de Obra:</span>
              <span style="font-family: ui-monospace, monospace;">$${order.total_labor.toLocaleString('es-CO')}</span>
            </div>
            <div class="summary-line">
              <span>Repuestos y Partes:</span>
              <span style="font-family: ui-monospace, monospace;">$${order.total_parts.toLocaleString('es-CO')}</span>
            </div>
            ${
              order.discount > 0
                ? `
              <div class="summary-line" style="color: #047857; font-weight: 600;">
                <span>Descuento Otorgado:</span>
                <span style="font-family: ui-monospace, monospace;">-$${order.discount.toLocaleString('es-CO')}</span>
              </div>
            `
                : ''
            }
            <div class="summary-line total">
              <span>TOTAL A PAGAR:</span>
              <span class="amount">$${order.grand_total.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <!-- Términos y Condiciones -->
        <div class="footer-terms">
          <div class="terms-heading">CONDICIONES DE SERVICIO Y CUSTODIA:</div>
          <div>1. <strong>Garantía:</strong> 30 días calendario en mano de obra y ajustes mecánicos. Los repuestos sustituidos quedan a disposición del cliente.</div>
          <div>2. <strong>Custodia:</strong> Notificada la culminación de los trabajos, el cliente dispone de 30 días para retirar la bicicleta. Pasado este plazo, aplicará cargo diario de bodegaje ($5.000 COP/día).</div>
          <div>3. <strong>Pertenencias:</strong> El taller se responsabiliza únicamente por los accesorios declarados expresamente en este comprobante.</div>
        </div>

        <!-- Firmas -->
        <div class="signatures-grid">
          <div class="sig-box">
            <div class="sig-img-container">
              ${
                signature?.signature_data
                  ? `<img src="${signature.signature_data}" alt="Firma del Cliente" class="sig-img" />`
                  : `<div style="font-size: 10px; color: #94a3b8; font-style: italic;">Firma no registrada</div>`
              }
            </div>
            <div class="sig-line">
              <div class="sig-name">${signature?.signer_name || customer?.full_name || 'Firma Conforme del Cliente'}</div>
              <div class="sig-doc">${signature?.signer_doc ? `C.C. ${signature.signer_doc}` : 'Cliente / Propietario'}</div>
            </div>
          </div>

          <div class="sig-box">
            <div class="sig-img-container">
              <div style="border: 1px dashed #cbd5e1; border-radius: 4px; padding: 4px 12px; font-size: 9px; color: #64748b; font-family: monospace;">
                SELLO TÉCNICO A2RUEDAS
              </div>
            </div>
            <div class="sig-line">
              <div class="sig-name">A2Ruedas Taller Especializado</div>
              <div class="sig-doc">Recepción y Servicio Técnico Autorizado</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera el documento HTML completo para Tirilla Térmica POS (58 mm)
 */
export function generateThermalTicketHtml(order: WorkOrder, signature: Signature | null): string {
  const cfg = printerService.getSettings();
  const customer = order.customer;
  const bike = order.bicycle;
  const items = order.items || [];
  const dateFormatted = new Date(order.created_at).toLocaleString('es-CO');

  const itemsList =
    items.length === 0
      ? `<div style="color: #666; font-style: italic;">En evaluación diagnóstica</div>`
      : items
          .map(
            (it) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.description}</span>
          <span style="font-weight: bold;">$${it.total_price.toLocaleString('es-CO')}</span>
        </div>
      `
          )
          .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Ticket ${order.order_number}</title>
      <style>
        @page {
          size: 58mm auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 2mm 3mm;
          width: 50mm;
          max-width: 50mm;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 10px;
          line-height: 1.25;
          color: #000000;
          background: #ffffff;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .divider { border-bottom: 1px dashed #000000; margin: 4px 0; }
        .flex-between { display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div style="font-size: 12px; font-weight: 900; letter-spacing: 0.5px;">${cfg.workshop_name}</div>
        <div style="font-size: 9px;">${cfg.header_slogan}</div>
        <div style="font-size: 8px;">NIT: ${cfg.workshop_nit} • Tel: ${cfg.workshop_phone}</div>
        <div style="font-size: 8px;">${cfg.workshop_address}</div>
      </div>

      <div class="divider"></div>

      <div class="flex-between bold" style="font-size: 11px;">
        <span>ORDEN:</span>
        <span>${order.order_number}</span>
      </div>
      <div class="flex-between" style="font-size: 8.5px;">
        <span>FECHA:</span>
        <span>${dateFormatted}</span>
      </div>
      <div class="flex-between" style="font-size: 8.5px;">
        <span>ESTADO:</span>
        <span class="bold">${order.status}</span>
      </div>

      <div class="divider"></div>

      <div style="font-size: 8.5px;">
        <div class="bold">CLIENTE:</div>
        <div>${customer?.full_name || 'Sin asignar'}</div>
        <div>Tel: ${customer?.phone || 'N/A'}</div>
        ${customer?.document_id ? `<div>Doc: ${customer.document_id}</div>` : ''}
      </div>

      <div class="divider"></div>

      <div style="font-size: 8.5px;">
        <div class="bold">BICICLETA:</div>
        <div>${bike ? `${bike.brand} ${bike.model}` : 'N/A'}</div>
        <div>${bike ? `${bike.bike_type} - ${bike.color}` : 'N/A'}</div>
        ${bike?.serial_number ? `<div>Serial: ${bike.serial_number}</div>` : ''}
      </div>

      <div class="divider"></div>

      <div style="font-size: 8.5px;">
        <div class="bold">FALLA REPORTADA:</div>
        <div style="font-style: italic;">"${order.reported_issues}"</div>
        ${
          order.accessories_received
            ? `
          <div class="bold" style="margin-top: 3px;">ACCESORIOS:</div>
          <div>${order.accessories_received}</div>
        `
            : ''
        }
      </div>

      <div class="divider"></div>

      <div class="bold" style="font-size: 9px; margin-bottom: 2px;">INTERVENCIÓN:</div>
      ${itemsList}

      <div class="divider"></div>

      <div style="font-size: 9px;">
        <div class="flex-between">
          <span>Mano de Obra:</span>
          <span>$${order.total_labor.toLocaleString('es-CO')}</span>
        </div>
        <div class="flex-between">
          <span>Repuestos:</span>
          <span>$${order.total_parts.toLocaleString('es-CO')}</span>
        </div>
        ${
          order.discount > 0
            ? `
          <div class="flex-between bold">
            <span>Descuento:</span>
            <span>-$${order.discount.toLocaleString('es-CO')}</span>
          </div>
        `
            : ''
        }
        <div class="flex-between bold" style="font-size: 11px; margin-top: 2px; padding-top: 2px; border-top: 1px solid #000;">
          <span>TOTAL:</span>
          <span>$${order.grand_total.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="text-center" style="font-size: 8px;">
        <div>CONSULTA QR: ${order.order_number}</div>
        <div style="margin-top: 3px; line-height: 1.1;">
          Garantía: 30 días en ajustes.<br>
          Retiro máximo: 30 días posteriores al aviso.
        </div>
      </div>

      <!-- Firma del Cliente -->
      <div style="text-align: center; margin-top: 8px;">
        ${
          signature?.signature_data
            ? `
          <div style="font-size: 8px; font-weight: bold; margin-bottom: 2px;">FIRMA DIGITAL REGISTRADA</div>
          <img src="${signature.signature_data}" style="max-height: 40px; max-width: 140px; margin: 0 auto; display: block;" />
        `
            : `
          <div style="border-top: 1px solid #000; width: 120px; margin: 25px auto 2px auto;"></div>
        `
        }
        <div style="font-size: 8px; font-weight: bold; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
          ${signature?.signer_name || customer?.full_name || 'Firma Conforme Cliente'}
        </div>
        ${signature?.signer_doc ? `<div style="font-size: 7.5px;">Doc: ${signature.signer_doc}</div>` : ''}
      </div>

      <div class="text-center" style="font-size: 7.5px; margin-top: 8px; letter-spacing: 1px;">
        *** GRACIAS POR SU PREFERENCIA ***
      </div>
    </body>
    </html>
  `;
}

/**
 * Imprime el documento directamente a través de un iframe invisible
 */
export function printWorkOrderDocument(
  order: WorkOrder,
  signature: Signature | null,
  format: 'letter' | '58mm'
) {
  const htmlContent =
    format === 'letter'
      ? generateFormalInvoiceHtml(order, signature)
      : generateThermalTicketHtml(order, signature);

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
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Fallback a window.print():', e);
      window.print();
    }
  }, 250);
}

/**
 * Genera el documento HTML completo y estilizado para Tirilla Térmica POS (58 mm) de Factura
 */
export function generateInvoiceThermalTicketHtml(invoice: Invoice, settings?: PrinterSettings): string {
  const cfg = settings || printerService.getSettings();
  const widthMm = printerService.getPrintableWidthMm(cfg.paper_width);
  const fontSizePx = printerService.getFontSizePx(cfg.font_density);
  const customerName = invoice.customer?.full_name || 'Consumidor Final (Venta Rápida)';
  const customerDoc = invoice.customer?.document_id || '';
  const items = invoice.items || [];
  const dateFormatted = new Date(invoice.created_at).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const methodLabels: Record<string, string> = {
    CASH: 'EFECTIVO',
    TRANSFER: 'TRANSFERENCIA (NEQUI/BANCO)',
    CARD: 'TARJETA / DATÁFONO',
    OTHER: 'OTRO MEDIO',
  };
  const paymentMethodLabel = methodLabels[invoice.payment_method] || invoice.payment_method;

  const itemsHtml =
    items.length === 0
      ? `<div style="text-align: center; color: #666; font-style: italic;">Sin ítems registrados</div>`
      : items
          .map(
            (it) => `
        <div style="margin-bottom: 4px;">
          <div style="font-weight: bold; word-break: break-word; font-size: 10.5px;">${it.description}</div>
          <div style="display: flex; justify-content: space-between; font-size: 9.5px; color: #222;">
            <span>${it.quantity} x $${it.unit_price.toLocaleString('es-CO')}</span>
            <span style="font-weight: bold;">$${it.total_price.toLocaleString('es-CO')}</span>
          </div>
        </div>
      `
          )
          .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Factura ${invoice.invoice_number}</title>
      <style>
        @page {
          size: auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
        body {
          padding: 3mm 2mm;
          width: 100%;
          max-width: ${widthMm}mm;
          margin: 0 auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
          font-size: ${fontSizePx}px;
          line-height: 1.25;
          color: #000000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .divider {
          border-top: 1px dashed #000000;
          margin: 5px 0;
        }
        .double-divider {
          border-top: 2px solid #000000;
          margin: 5px 0;
        }
        .flex-between {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2px;
          width: 100%;
        }
        .cancelled-box {
          border: 2px dashed #dc2626;
          color: #dc2626;
          font-weight: bold;
          text-align: center;
          padding: 4px;
          margin: 6px 0;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">${cfg.workshop_name}</div>
        <div style="font-size: 9.5px;">${cfg.header_slogan}</div>
        <div style="font-size: 8.5px;">NIT: ${cfg.workshop_nit}</div>
        <div style="font-size: 8.5px;">PBX: ${cfg.workshop_phone}</div>
        <div style="font-size: 8.5px;">${cfg.workshop_address}</div>
      </div>

      <div class="divider"></div>

      <div class="text-center bold" style="font-size: 11px;">COMPROBANTE DE PAGO</div>
      <div class="text-center bold" style="font-size: 13px;">${invoice.invoice_number}</div>

      <div class="divider"></div>

      <div style="font-size: 9.5px;">
        <div class="flex-between">
          <span>FECHA:</span>
          <span>${dateFormatted}</span>
        </div>
        <div class="flex-between">
          <span>CLIENTE:</span>
          <span class="bold" style="text-align: right; max-width: 32mm;">${customerName}</span>
        </div>
        ${
          customerDoc
            ? `
        <div class="flex-between">
          <span>C.C./NIT:</span>
          <span>${customerDoc}</span>
        </div>`
            : ''
        }
        ${
          invoice.work_order_id
            ? `
        <div class="flex-between bold">
          <span>ORDEN OT:</span>
          <span>${invoice.work_order_id}</span>
        </div>`
            : ''
        }
        <div class="flex-between">
          <span>MEDIO PAGO:</span>
          <span class="bold">${paymentMethodLabel}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="text-center bold" style="font-size: 9.5px; margin-bottom: 4px;">-- DETALLE DE COBRO --</div>
      ${itemsHtml}

      <div class="double-divider"></div>

      <div style="font-size: 10px;">
        <div class="flex-between">
          <span>SUBTOTAL:</span>
          <span>$${invoice.subtotal.toLocaleString('es-CO')}</span>
        </div>
        ${
          invoice.discount > 0
            ? `
        <div class="flex-between bold" style="color: #b91c1c;">
          <span>DESCUENTO:</span>
          <span>-$${invoice.discount.toLocaleString('es-CO')}</span>
        </div>`
            : ''
        }
        ${
          invoice.tax > 0
            ? `
        <div class="flex-between">
          <span>IVA (${invoice.tax_rate || 19}%):</span>
          <span>$${invoice.tax.toLocaleString('es-CO')}</span>
        </div>`
            : ''
        }
        <div class="double-divider"></div>
        <div class="flex-between bold" style="font-size: 12px;">
          <span>TOTAL PAGADO:</span>
          <span>$${invoice.total.toLocaleString('es-CO')} COP</span>
        </div>
      </div>

      ${
        invoice.notes
          ? `
      <div class="divider"></div>
      <div style="font-size: 9px; font-style: italic;">
        <strong>Nota:</strong> ${invoice.notes}
      </div>`
          : ''
      }

      ${
        invoice.payment_status === 'CANCELLED'
          ? `
      <div class="cancelled-box">
        *** FACTURA ANULADA ***
        ${invoice.cancel_reason ? `<div style="font-size: 8.5px; font-weight: normal; margin-top: 2px;">Motivo: ${invoice.cancel_reason}</div>` : ''}
      </div>`
          : ''
      }

      <div class="divider"></div>

      <div class="text-center" style="font-size: 8.5px; margin-top: 6px;">
        <div>¡Gracias por confiar en A2Ruedas! 🚲</div>
        <div style="margin-top: 2px; color: #555;">Servicio Técnico y Repuestos</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera el documento HTML comercial tamaño Carta / A4 para Factura
 */
export function generateInvoiceCommercialHtml(invoice: Invoice): string {
  const workshop = workshopSettingsService.getSettings();
  const customerName = invoice.customer?.full_name || 'Consumidor Final (Venta Rápida)';
  const customerDoc = invoice.customer?.document_id || '';
  const customerPhone = invoice.customer?.phone || 'No registrado';
  const items = invoice.items || [];
  const dateFormatted = new Date(invoice.created_at).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const methodLabels: Record<string, string> = {
    CASH: 'Efectivo en Caja',
    TRANSFER: 'Transferencia Digital (Nequi / Daviplata / Banco)',
    CARD: 'Tarjeta Débito / Crédito (Datáfono)',
    OTHER: 'Otro Medio de Pago',
  };
  const paymentMethodLabel = methodLabels[invoice.payment_method] || invoice.payment_method;

  const itemsRows =
    items.length === 0
      ? `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 12px; font-style: italic;">Sin ítems registrados en este comprobante</td></tr>`
      : items
          .map(
            (it, idx) => `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${it.description}</div>
          </td>
          <td style="text-align: center;">
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${
              it.item_type === 'service' ? '#dbeafe; color: #1e40af;' : '#f1f5f9; color: #334155;'
            }">
              ${it.item_type === 'service' ? 'Servicio' : it.item_type === 'part' ? 'Repuesto' : 'Producto'}
            </span>
          </td>
          <td style="text-align: center; font-weight: 700;">${it.quantity}</td>
          <td style="text-align: right; font-family: monospace;">$${it.unit_price.toLocaleString('es-CO')}</td>
          <td style="text-align: right; font-family: monospace; font-weight: 700;">$${it.total_price.toLocaleString('es-CO')}</td>
        </tr>
      `
          )
          .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Factura ${invoice.invoice_number} - ${workshop.name}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
        }
        .invoice-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 14px;
          border-bottom: 2px solid #0f172a;
        }
        .brand-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #0f172a;
          margin: 0 0 2px 0;
        }
        .brand-subtitle {
          font-size: 12px;
          font-weight: 700;
          color: #2563eb;
          margin: 0 0 4px 0;
        }
        .brand-info {
          font-size: 11px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }
        .doc-box {
          border: 1.5px solid #0f172a;
          border-radius: 6px;
          padding: 10px 14px;
          background-color: #f8fafc;
          text-align: right;
        }
        .doc-type {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #64748b;
          margin-bottom: 2px;
        }
        .doc-number {
          font-size: 18px;
          font-weight: 900;
          font-family: ui-monospace, monospace;
          color: #0f172a;
        }
        .client-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px 14px;
          margin-top: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          font-size: 11px;
        }
        th {
          background: #0f172a;
          color: white;
          text-align: left;
          padding: 8px 10px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .totals-box {
          float: right;
          width: 280px;
          margin-top: 14px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 10px 14px;
          background: #f8fafc;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 11px;
        }
        .total-final {
          border-top: 2px solid #0f172a;
          margin-top: 6px;
          padding-top: 6px;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }
        .clear { clear: both; }
        .footer-note {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
          font-size: 10px;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div>
            <div class="brand-title">${workshop.name}</div>
            <div class="brand-subtitle">${workshop.header_slogan}</div>
            <div class="brand-info">NIT: ${workshop.nit} • Régimen Simplificado / No Responsable de IVA</div>
            <div class="brand-info">PBX: ${workshop.phone} • ${workshop.address}${workshop.city ? `, ${workshop.city}` : ''}</div>
          </div>
          <div class="doc-box">
            <div class="doc-type">FACTURA DE VENTA / COMPROBANTE</div>
            <div class="doc-number">${invoice.invoice_number}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Fecha: ${dateFormatted}</div>
          </div>
        </div>

        <!-- Cliente y Medio de Pago -->
        <div class="client-card">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">CLIENTE / ADQUIRIENTE:</div>
              <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${customerName}</div>
              <div style="font-size: 11px; color: #475569;">${customerDoc ? `C.C. / NIT: ${customerDoc}` : 'Consumidor Final'} • Tel: ${customerPhone}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">CONDICIÓN COMERCIAL:</div>
              <div style="font-size: 12px; font-weight: bold; color: ${
                invoice.payment_status === 'PAID' ? '#059669' : invoice.payment_status === 'PENDING' ? '#d97706' : '#dc2626'
              };">
                ESTADO: ${invoice.payment_status === 'PAID' ? 'PAGADA' : invoice.payment_status === 'PENDING' ? 'PENDIENTE' : 'ANULADA'}
              </div>
              <div style="font-size: 11px; color: #475569;">Medio: ${paymentMethodLabel} ${
                invoice.work_order_id ? `• OT: ${invoice.work_order_id}` : ''
              }</div>
            </div>
          </div>
        </div>

        <!-- Tabla de Ítems -->
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Descripción del Repuesto o Servicio</th>
              <th style="width: 85px; text-align: center;">Tipo</th>
              <th style="width: 50px; text-align: center;">Cant.</th>
              <th style="width: 100px; text-align: right;">V. Unitario</th>
              <th style="width: 110px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totales -->
        <div class="totals-box">
          <div class="total-row">
            <span>Subtotal:</span>
            <span style="font-family: monospace;">$${invoice.subtotal.toLocaleString('es-CO')}</span>
          </div>
          ${
            invoice.discount > 0
              ? `
          <div class="total-row" style="color: #dc2626; font-weight: 600;">
            <span>Descuento Comercial:</span>
            <span style="font-family: monospace;">-$${invoice.discount.toLocaleString('es-CO')}</span>
          </div>`
              : ''
          }
          ${
            invoice.tax > 0
              ? `
          <div class="total-row">
            <span>IVA (${invoice.tax_rate || 19}%):</span>
            <span style="font-family: monospace;">$${invoice.tax.toLocaleString('es-CO')}</span>
          </div>`
              : ''
          }
          <div class="total-row total-final">
            <span>TOTAL:</span>
            <span style="font-family: monospace;">$${invoice.total.toLocaleString('es-CO')} COP</span>
          </div>
        </div>
        <div class="clear"></div>

        ${
          invoice.notes
            ? `
        <div style="margin-top: 14px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 11px;">
          <strong>Observaciones:</strong> ${invoice.notes}
        </div>`
            : ''
        }

        <div class="footer-note">
          Comprobante interno y soporte de liquidación comercial de taller de bicicletas.<br>
          Garantía en ajustes mecánicos: 30 días calendario. ¡Gracias por pedalear con A2Ruedas!
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Motor universal de impresión invisible mediante iframe para evitar ventanas en blanco o bloqueos
 */
export function printDirectHtml(htmlContent: string): void {
  let iframe = document.getElementById('a2ruedas-universal-print-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'a2ruedas-universal-print-frame';
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
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Fallback de impresión directa:', e);
      window.print();
    }
  }, 250);
}

/**
 * Imprime una factura comercial o tirilla térmica de forma universal y segura
 */
export function printInvoiceDocument(
  invoice: Invoice,
  format: '58mm' | 'letter',
  settings?: PrinterSettings
): void {
  const htmlContent =
    format === '58mm'
      ? generateInvoiceThermalTicketHtml(invoice, settings)
      : generateInvoiceCommercialHtml(invoice);

  printDirectHtml(htmlContent);
}

/**
 * 1. Genera Marbete / Etiqueta Adhesiva de Bicicleta para Rollo Térmico Continuo (con Código QR)
 */
export function generateBikeTagThermalHtml(
  bike: Bicycle,
  workOrder?: WorkOrder | null,
  qrDataUrl?: string,
  settings?: PrinterSettings
): string {
  const cfg = settings || printerService.getSettings();
  const widthMm = printerService.getPrintableWidthMm(cfg.paper_width);
  const fontSizePx = printerService.getFontSizePx(cfg.font_density);
  const qrCodeStr = bike.qr_code || 'BIKE-000000';
  const ownerName = bike.customer?.full_name || workOrder?.customer?.full_name || 'Consumidor Final';
  const ownerPhone = bike.customer?.phone || workOrder?.customer?.phone || 'No registrado';
  const dateStr = new Date().toLocaleDateString('es-CO');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Marbete ${qrCodeStr}</title>
      <style>
        @page { size: auto; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
          padding: 3mm 2mm;
          width: 100%;
          max-width: ${widthMm}mm;
          margin: 0 auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
          font-size: ${fontSizePx}px;
          line-height: 1.25;
          color: #000000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 900; }
        .divider { border-top: 1px dashed #000000; margin: 4px 0; }
        .double-divider { border-top: 2px solid #000000; margin: 4px 0; }
        .flex-between { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; width: 100%; }
        .cut-line { text-align: center; font-size: 8px; letter-spacing: 2px; margin-top: 10px; padding-top: 5px; border-top: 1px dashed #000; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">${cfg.workshop_name}</div>
        <div style="font-size: 8px; letter-spacing: 1px; margin-top: 1px;">ETIQUETA IDENTIFICADORA DE BICICLETA</div>
      </div>

      <div class="divider"></div>

      <!-- QR Code Principal de Alto Contraste -->
      ${
        qrDataUrl
          ? `
        <div class="text-center" style="margin: 4px 0;">
          <img src="${qrDataUrl}" alt="QR Bicicleta" style="width: 38mm; height: 38mm; display: block; margin: 0 auto;" />
        </div>
      `
          : `
        <div class="text-center" style="border: 2px solid #000; padding: 12px; margin: 6px 0;">
          <div class="bold" style="font-size: 14px;">[ QR CODE ]</div>
          <div style="font-size: 9px;">${qrCodeStr}</div>
        </div>
      `
      }

      <div class="text-center bold" style="font-size: 14px; letter-spacing: 1px; margin-top: 2px;">
        ${qrCodeStr}
      </div>

      <div class="divider"></div>

      <!-- Datos de la Bicicleta -->
      <div style="font-size: 9.5px;">
        <div class="flex-between">
          <span>BICICLETA:</span>
          <span class="bold">${bike.brand} ${bike.model}</span>
        </div>
        <div class="flex-between">
          <span>TIPO/COLOR:</span>
          <span>${bike.bike_type || 'MTB'} - ${bike.color || 'Estándar'}</span>
        </div>
        ${
          bike.serial_number
            ? `
        <div class="flex-between">
          <span>SERIAL:</span>
          <span class="bold">${bike.serial_number}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="divider"></div>

      <!-- Datos del Propietario -->
      <div style="font-size: 9.5px;">
        <div class="flex-between">
          <span>DUEÑO:</span>
          <span class="bold truncate" style="max-width: 32mm;">${ownerName}</span>
        </div>
        <div class="flex-between">
          <span>TELÉFONO:</span>
          <span>${ownerPhone}</span>
        </div>
        ${
          workOrder
            ? `
        <div class="flex-between bold" style="margin-top: 3px;">
          <span>ORDEN ACTIVA:</span>
          <span>${workOrder.order_number}</span>
        </div>
        `
            : ''
        }
      </div>

      ${
        workOrder?.reported_issues
          ? `
      <div class="divider"></div>
      <div style="font-size: 8.5px;">
        <span class="bold">FALLA REPORTADA:</span>
        <div style="font-style: italic;">"${workOrder.reported_issues}"</div>
      </div>
      `
          : ''
      }

      <div class="divider"></div>
      <div class="text-center" style="font-size: 8px; color: #444;">
        <span>Escanea el QR para consultar el historial</span><br>
        <span>Fecha de Etiqueta: ${dateStr}</span>
      </div>

      <div class="cut-line">- - - ADHESIVO PARA MARCO - - -</div>
    </body>
    </html>
  `;
}

/**
 * 2. Genera Comprobante de Recepción y Custodia de Taller para Tirilla 58 mm
 */
export function generateReceptionTicketHtml(
  workOrder: WorkOrder,
  signature?: Signature | null,
  settings?: PrinterSettings
): string {
  const cfg = settings || printerService.getSettings();
  const widthMm = printerService.getPrintableWidthMm(cfg.paper_width);
  const fontSizePx = printerService.getFontSizePx(cfg.font_density);
  const dateFormatted = new Date(workOrder.created_at).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const deliveryEst = workOrder.estimated_delivery_at
    ? new Date(workOrder.estimated_delivery_at).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'A convenir con el cliente';

  const customer = workOrder.customer;
  const bike = workOrder.bicycle;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Recepción ${workOrder.order_number}</title>
      <style>
        @page { size: auto; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
          padding: 3mm 2mm;
          width: 100%;
          max-width: ${widthMm}mm;
          margin: 0 auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
          font-size: ${fontSizePx}px;
          line-height: 1.25;
          color: #000000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 900; }
        .divider { border-top: 1px dashed #000000; margin: 5px 0; }
        .double-divider { border-top: 2px solid #000000; margin: 5px 0; }
        .flex-between { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; width: 100%; }
        .cut-line { text-align: center; font-size: 8px; letter-spacing: 2px; margin-top: 12px; padding-top: 6px; border-top: 1px dashed #000; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">${cfg.workshop_name}</div>
        <div style="font-size: 9px;">${cfg.header_slogan}</div>
        <div style="font-size: 8px;">NIT: ${cfg.workshop_nit} • Tel: ${cfg.workshop_phone}</div>
        <div style="font-size: 8px;">${cfg.workshop_address}</div>
      </div>

      <div class="double-divider"></div>

      <div class="text-center bold" style="font-size: 11px;">COMPROBANTE DE RECEPCIÓN</div>
      <div class="text-center bold" style="font-size: 14px;">${workOrder.order_number}</div>

      <div class="divider"></div>

      <div style="font-size: 9.5px;">
        <div class="flex-between">
          <span>FECHA INGRESO:</span>
          <span>${dateFormatted}</span>
        </div>
        <div class="flex-between">
          <span>ENTREGA ESTIMADA:</span>
          <span class="bold">${deliveryEst}</span>
        </div>
        <div class="flex-between">
          <span>ESTADO:</span>
          <span class="bold">${workOrder.status}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div style="font-size: 9.5px;">
        <div class="bold">DATOS DEL CLIENTE:</div>
        <div>${customer?.full_name || 'Consumidor Final'}</div>
        <div>Tel: ${customer?.phone || 'No registra'}</div>
        ${customer?.document_id ? `<div>Doc: ${customer.document_id}</div>` : ''}
      </div>

      <div class="divider"></div>

      <div style="font-size: 9.5px;">
        <div class="bold">DATOS DE LA BICICLETA:</div>
        <div>${bike ? `${bike.brand} ${bike.model}` : 'Bicicleta General'}</div>
        <div>${bike ? `${bike.bike_type} - ${bike.color}` : ''}</div>
        ${bike?.serial_number ? `<div>Serial: ${bike.serial_number}</div>` : ''}
        ${workOrder.entry_mileage_km ? `<div>Kilometraje: ${workOrder.entry_mileage_km} km</div>` : ''}
      </div>

      <div class="divider"></div>

      <div style="font-size: 9px;">
        <div class="bold">FALLA REPORTADA POR EL CLIENTE:</div>
        <div style="font-style: italic; margin-top: 1px;">"${workOrder.reported_issues}"</div>
      </div>

      ${
        workOrder.accessories_received
          ? `
      <div class="divider"></div>
      <div style="font-size: 9px;">
        <div class="bold">ACCESORIOS RECIBIDOS EN CUSTODIA:</div>
        <div style="margin-top: 1px;">✓ ${workOrder.accessories_received}</div>
      </div>
      `
          : ''
      }

      ${
        workOrder.internal_notes
          ? `
      <div class="divider"></div>
      <div style="font-size: 9px;">
        <div class="bold">INSPECCIÓN Y DAÑOS PREVIOS:</div>
        <div style="margin-top: 1px;">${workOrder.internal_notes}</div>
      </div>
      `
          : ''
      }

      <div class="divider"></div>

      <!-- Condiciones de Custodia -->
      <div style="font-size: 8px; line-height: 1.2; color: #333;">
        <div class="bold">CONDICIONES DE INGRESO Y CUSTODIA:</div>
        <div>1. El taller responde únicamente por los accesorios declarados en esta tirilla.</div>
        <div>2. Plazo máximo de retiro: 30 días calendario tras la notificación de bicicleta lista.</div>
      </div>

      <!-- Firma del Cliente -->
      <div class="text-center" style="margin-top: 10px;">
        ${
          signature?.signature_data
            ? `
          <div style="font-size: 8px; font-weight: bold; margin-bottom: 2px;">FIRMA DIGITAL REGISTRADA:</div>
          <img src="${signature.signature_data}" style="max-height: 38px; max-width: 140px; margin: 0 auto; display: block;" />
        `
            : `
          <div style="border-top: 1px solid #000; width: 110px; margin: 24px auto 2px auto;"></div>
        `
        }
        <div style="font-size: 8px; font-weight: bold; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
          ${signature?.signer_name || customer?.full_name || 'Firma Conforme del Cliente'}
        </div>
        ${signature?.signer_doc ? `<div style="font-size: 7.5px;">Doc: ${signature.signer_doc}</div>` : ''}
      </div>

      <div class="cut-line">- - - COMPROBANTE DE CUSTODIA - - -</div>
    </body>
    </html>
  `;
}

/**
 * 3. Genera Tirilla de Liquidación y Entrega de Orden de Trabajo (OT)
 */
export function generateWorkOrderTicketHtml(
  workOrder: WorkOrder,
  signature?: Signature | null,
  settings?: PrinterSettings
): string {
  const cfg = settings || printerService.getSettings();
  const widthMm = printerService.getPrintableWidthMm(cfg.paper_width);
  const fontSizePx = printerService.getFontSizePx(cfg.font_density);
  const items = workOrder.items || [];
  const dateFormatted = new Date(workOrder.created_at).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const customer = workOrder.customer;
  const bike = workOrder.bicycle;

  const itemsList =
    items.length === 0
      ? `<div style="text-align: center; color: #666; font-style: italic;">Sin repuestos ni servicios registrados</div>`
      : items
          .map(
            (it) => `
        <div style="margin-bottom: 3px;">
          <div style="font-weight: bold; font-size: 10px; word-break: break-word;">${it.description}</div>
          <div style="display: flex; justify-content: space-between; font-size: 9px; color: #333;">
            <span>${it.quantity > 1 ? `${it.quantity} x $${it.unit_price.toLocaleString('es-CO')}` : '1 servicio/repuesto'}</span>
            <span style="font-weight: bold;">$${it.total_price.toLocaleString('es-CO')}</span>
          </div>
        </div>
      `
          )
          .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Orden ${workOrder.order_number}</title>
      <style>
        @page { size: auto; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
          padding: 3mm 2mm;
          width: 100%;
          max-width: ${widthMm}mm;
          margin: 0 auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
          font-size: ${fontSizePx}px;
          line-height: 1.25;
          color: #000000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 900; }
        .divider { border-top: 1px dashed #000000; margin: 5px 0; }
        .double-divider { border-top: 2px solid #000000; margin: 5px 0; }
        .flex-between { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; width: 100%; }
        .cut-line { text-align: center; font-size: 8px; letter-spacing: 2px; margin-top: 12px; padding-top: 6px; border-top: 1px dashed #000; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">${cfg.workshop_name}</div>
        <div style="font-size: 9px;">${cfg.header_slogan}</div>
        <div style="font-size: 8px;">NIT: ${cfg.workshop_nit} • Tel: ${cfg.workshop_phone}</div>
        <div style="font-size: 8px;">${cfg.workshop_address}</div>
      </div>

      <div class="double-divider"></div>

      <div class="text-center bold" style="font-size: 11px;">LIQUIDACIÓN DE ORDEN</div>
      <div class="text-center bold" style="font-size: 14px;">${workOrder.order_number}</div>

      <div class="divider"></div>

      <div style="font-size: 9.5px;">
        <div class="flex-between">
          <span>FECHA:</span>
          <span>${dateFormatted}</span>
        </div>
        <div class="flex-between">
          <span>CLIENTE:</span>
          <span class="bold truncate" style="max-width: 32mm;">${customer?.full_name || 'Consumidor Final'}</span>
        </div>
        ${customer?.phone ? `<div class="flex-between"><span>TELÉFONO:</span><span>${customer.phone}</span></div>` : ''}
        <div class="flex-between">
          <span>BICICLETA:</span>
          <span>${bike ? `${bike.brand} ${bike.model}` : 'Bicicleta Taller'}</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="text-center bold" style="font-size: 9.5px; margin-bottom: 4px;">-- INTERVENCIONES Y REPUESTOS --</div>
      ${itemsList}

      <div class="double-divider"></div>

      <div style="font-size: 10px;">
        <div class="flex-between">
          <span>MANO DE OBRA:</span>
          <span>$${workOrder.total_labor.toLocaleString('es-CO')}</span>
        </div>
        <div class="flex-between">
          <span>REPUESTOS:</span>
          <span>$${workOrder.total_parts.toLocaleString('es-CO')}</span>
        </div>
        ${
          workOrder.discount > 0
            ? `
        <div class="flex-between bold" style="color: #b91c1c;">
          <span>DESCUENTO:</span>
          <span>-$${workOrder.discount.toLocaleString('es-CO')}</span>
        </div>`
            : ''
        }
        <div class="double-divider"></div>
        <div class="flex-between bold" style="font-size: 12px;">
          <span>TOTAL A PAGAR:</span>
          <span>$${workOrder.grand_total.toLocaleString('es-CO')} COP</span>
        </div>
      </div>

      <div class="divider"></div>

      <div style="font-size: 8px; line-height: 1.2; color: #333;">
        <div>${cfg.warranty_text}</div>
        <div style="margin-top: 2px;">Consulta timeline público con la Orden: ${workOrder.order_number}</div>
      </div>

      <!-- Firma de Entrega Conforme -->
      <div class="text-center" style="margin-top: 10px;">
        ${
          signature?.signature_data
            ? `
          <div style="font-size: 8px; font-weight: bold; margin-bottom: 2px;">FIRMA DE ENTREGA CONFORME:</div>
          <img src="${signature.signature_data}" style="max-height: 38px; max-width: 140px; margin: 0 auto; display: block;" />
        `
            : `
          <div style="border-top: 1px solid #000; width: 110px; margin: 24px auto 2px auto;"></div>
        `
        }
        <div style="font-size: 8px; font-weight: bold; border-top: 1px solid #000; padding-top: 2px; margin-top: 2px;">
          ${signature?.signer_name || customer?.full_name || 'Firma Conforme del Cliente'}
        </div>
      </div>

      <div class="cut-line">- - - COMPROBANTE DE ENTREGA - - -</div>
    </body>
    </html>
  `;
}

/**
 * 4. Genera Comprobante Térmico de Cierre Diario de Caja (Arqueo) para Tirilla 58 mm
 */
export function generateCashRegisterTicketHtml(
  register: CashRegister,
  summary: CashRegisterSummary,
  settings?: PrinterSettings
): string {
  const cfg = settings || printerService.getSettings();
  const widthMm = printerService.getPrintableWidthMm(cfg.paper_width);
  const fontSizePx = printerService.getFontSizePx(cfg.font_density);
  const openedDate = new Date(register.opened_at).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const closedDate = register.closed_at
    ? new Date(register.closed_at).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'EN CURSO (ABIERTA)';

  const diff = register.difference || 0;
  const diffLabel =
    diff === 0
      ? 'CAJA CUADRADA ($0)'
      : diff > 0
      ? `SOBRANTE (+ $${diff.toLocaleString('es-CO')})`
      : `FALTANTE (- $${Math.abs(diff).toLocaleString('es-CO')})`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Cierre Caja ${register.id.slice(0, 10)}</title>
      <style>
        @page { size: auto; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
          padding: 3mm 2mm;
          width: 100%;
          max-width: ${widthMm}mm;
          margin: 0 auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
          font-size: ${fontSizePx}px;
          line-height: 1.25;
          color: #000000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 900; }
        .divider { border-top: 1px dashed #000000; margin: 5px 0; }
        .double-divider { border-top: 2px solid #000000; margin: 5px 0; }
        .flex-between { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; width: 100%; }
        .cut-line { text-align: center; font-size: 8px; letter-spacing: 2px; margin-top: 12px; padding-top: 6px; border-top: 1px dashed #000; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">${cfg.workshop_name}</div>
        <div style="font-size: 9px;">CONTROL FINANCIERO Y ARQUEO DIARIO</div>
        <div style="font-size: 8px;">NIT: ${cfg.workshop_nit} • Tel: ${cfg.workshop_phone}</div>
      </div>

      <div class="double-divider"></div>

      <div class="text-center bold" style="font-size: 11px;">
        ${register.status === 'OPEN' ? 'ARQUEO PARCIAL EN VIVO' : 'CIERRE DIARIO DE CAJA'}
      </div>
      <div class="text-center bold" style="font-size: 12px;">SESIÓN: ${register.id.slice(0, 10).toUpperCase()}</div>

      <div class="divider"></div>

      <div style="font-size: 9px;">
        <div class="flex-between"><span>ESTADO:</span><span class="bold">${register.status}</span></div>
        <div class="flex-between"><span>APERTURA:</span><span>${openedDate}</span></div>
        <div class="flex-between"><span>ABIERTO POR:</span><span class="bold">${register.opened_by}</span></div>
        <div class="flex-between"><span>CIERRE:</span><span>${closedDate}</span></div>
        ${register.closed_by ? `<div class="flex-between"><span>CERRADO POR:</span><span class="bold">${register.closed_by}</span></div>` : ''}
      </div>

      <div class="divider"></div>

      <!-- Efectivo en Gaveta -->
      <div style="font-size: 9.5px;">
        <div class="bold text-center mb-1">-- FLUJO DE EFECTIVO FÍSICO --</div>
        <div class="flex-between"><span>Base Inicial:</span><span>$${register.initial_amount.toLocaleString('es-CO')}</span></div>
        <div class="flex-between"><span>(+) Entradas Efectivo:</span><span>$${summary.totalCashIncome.toLocaleString('es-CO')}</span></div>
        <div class="flex-between"><span>(-) Salidas / Gastos:</span><span>-$${summary.totalCashExpense.toLocaleString('es-CO')}</span></div>
        <div class="double-divider"></div>
        <div class="flex-between bold" style="font-size: 10.5px;">
          <span>EFECTIVO ESPERADO:</span>
          <span>$${summary.expectedCashInDrawer.toLocaleString('es-CO')}</span>
        </div>
        ${
          register.final_counted_amount !== null && register.final_counted_amount !== undefined
            ? `
        <div class="flex-between bold" style="font-size: 10.5px; margin-top: 2px;">
          <span>EFECTIVO FÍSICO CONTADO:</span>
          <span>$${register.final_counted_amount.toLocaleString('es-CO')}</span>
        </div>
        <div class="flex-between bold" style="font-size: 11px; margin-top: 2px; padding: 2px; border: 1px dashed #000; text-align: center;">
          <span>RESULTADO ARQUEO:</span>
          <span>${diffLabel}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="divider"></div>

      <!-- Pagos Digitales y Tarjetas -->
      <div style="font-size: 9.5px;">
        <div class="bold text-center mb-1">-- PAGOS DIGITALES Y BANCOS --</div>
        <div class="flex-between"><span>Transferencias Nequi/Bancos:</span><span>$${summary.totalTransferIncome.toLocaleString('es-CO')}</span></div>
        <div class="flex-between"><span>Datáfono / Tarjetas:</span><span>$${summary.totalCardIncome.toLocaleString('es-CO')}</span></div>
        <div class="flex-between"><span>Otros Medios:</span><span>$${summary.totalOtherIncome.toLocaleString('es-CO')}</span></div>
        <div class="double-divider"></div>
        <div class="flex-between bold" style="font-size: 11px;">
          <span>BALANCE NETO TOTAL:</span>
          <span>$${summary.netBalance.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <!-- Firma del Cajero -->
      <div class="text-center" style="margin-top: 14px;">
        <div style="border-top: 1px solid #000; width: 110px; margin: 20px auto 2px auto;"></div>
        <div style="font-size: 8px; font-weight: bold;">Firma del Cajero / Responsable</div>
        <div style="font-size: 7.5px;">${register.closed_by || register.opened_by}</div>
      </div>

      <div class="cut-line">- - - CIERRE DE CAJA ARCHIVABLE - - -</div>
    </body>
    </html>
  `;
}

/**
 * 5. Genera Tirilla de Calibración y Diagnóstico de Hardware (Prueba 58 mm)
 */
export function generateTestTicketHtml(settings?: PrinterSettings): string {
  const cfg = settings || printerService.getSettings();
  const widthMm = printerService.getPrintableWidthMm(cfg.paper_width);
  const fontSizePx = printerService.getFontSizePx(cfg.font_density);
  const now = new Date().toLocaleString('es-CO');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Calibración Térmica</title>
      <style>
        @page { size: auto; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
          padding: 3mm 2mm;
          width: 100%;
          max-width: ${widthMm}mm;
          margin: 0 auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
          font-size: ${fontSizePx}px;
          line-height: 1.25;
          color: #000000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: 900; }
        .divider { border-top: 1px dashed #000000; margin: 5px 0; }
        .double-divider { border-top: 2px solid #000000; margin: 5px 0; }
        .flex-between { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; width: 100%; }
        .cut-line { text-align: center; font-size: 8px; letter-spacing: 2px; margin-top: 12px; padding-top: 6px; border-top: 1px dashed #000; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div style="font-size: 14px; font-weight: 900; letter-spacing: 1px;">A2RUEDAS TALLER</div>
        <div style="font-size: 9.5px; font-weight: bold; margin-top: 2px;">TEST DE IMPRESIÓN Y CALIBRACIÓN</div>
        <div style="font-size: 8.5px; color: #444;">${now}</div>
      </div>

      <div class="double-divider"></div>

      <!-- Regla de Alineación Milimétrica -->
      <div style="font-size: 8px; font-family: monospace; text-align: center;">
        <div>-- REGLA DE ALINEACIÓN --</div>
        <div style="border-left: 1px solid #000; border-right: 1px solid #000; padding: 2px 0;">
          |0mm.......25mm.......${widthMm}mm|
        </div>
      </div>

      <div class="divider"></div>

      <!-- Verificación de Densidad Tipográfica -->
      <div style="font-size: 8.5px;">
        <div class="bold mb-1">PRUEBA DE DENSIDAD TIPOGRÁFICA:</div>
        <div style="font-size: 9.5px;">1. Compacta (9.5px): A2Ruedas Bicicletas 12345</div>
        <div style="font-size: 11px;">2. Normal (11px): A2Ruedas Bicicletas 12345</div>
        <div style="font-size: 12.5px; font-weight: bold;">3. Destacada: A2Ruedas Bicicletas 12345</div>
      </div>

      <div class="divider"></div>

      <!-- Parámetros del Taller Configurados -->
      <div style="font-size: 8.5px;">
        <div class="bold mb-1">PARÁMETROS ACTIVOS:</div>
        <div class="flex-between"><span>Ancho de Rollo:</span><span class="bold">${cfg.paper_width} (${widthMm} mm útiles)</span></div>
        <div class="flex-between"><span>Densidad:</span><span class="bold">${cfg.font_density}</span></div>
        <div class="flex-between"><span>Líneas de Avance:</span><span class="bold">${cfg.feed_lines} líneas</span></div>
        <div class="flex-between"><span>Código QR:</span><span class="bold">${cfg.show_qr_code ? 'Habilitado' : 'Deshabilitado'}</span></div>
      </div>

      <div class="divider"></div>

      <!-- Bloque de Densidad Térmica 100% Negro -->
      <div class="text-center" style="margin: 4px 0;">
        <div style="background: #000; color: #fff; padding: 3px 0; font-weight: bold; font-size: 9px; letter-spacing: 2px;">
          ■■■ DENSIDAD TÉRMICA 100% ■■■
        </div>
      </div>

      <div class="double-divider"></div>

      <div class="text-center bold" style="font-size: 9.5px; margin-top: 4px;">
        ✓ CABEZAL TÉRMICO Y CORTE OPERATIVO
      </div>
      <div class="text-center" style="font-size: 8px; margin-top: 2px;">
        A2Ruedas PWA • Sistema de Gestión de Taller
      </div>

      <div class="cut-line">- - - CORTAR AQUÍ (LÍNEA DE TEST) - - -</div>
    </body>
    </html>
  `;
}


