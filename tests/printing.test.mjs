import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 17: CENTRO DE IMPRESIÓN TÉRMICA DE 58 MM ---');

// 1. Configuración por Defecto del Taller y Hardware Térmico
const DEFAULT_PRINTER_SETTINGS = {
  paper_width: '58mm',
  workshop_name: 'A2RUEDAS TALLER',
  workshop_nit: '901.452.879-1',
  workshop_phone: '(+57) 310 456 7890',
  workshop_address: 'Calle 123 # 45-67, Bogotá, Colombia',
  header_slogan: 'TALLER ESPECIALIZADO DE BICICLETAS',
  footer_message: '¡Gracias por pedalear con nosotros! 🚲',
  warranty_text: 'Garantía: 30 días en mano de obra y ajustes. Retiro máximo: 30 días post-aviso.',
  font_density: 'normal',
  show_qr_code: true,
  feed_lines: 3,
};

assert.strictEqual(DEFAULT_PRINTER_SETTINGS.paper_width, '58mm');
assert.strictEqual(DEFAULT_PRINTER_SETTINGS.font_density, 'normal');
assert.strictEqual(DEFAULT_PRINTER_SETTINGS.feed_lines, 3);
assert.strictEqual(DEFAULT_PRINTER_SETTINGS.show_qr_code, true);
console.log('1. Valores predeterminados de hardware y taller (58mm, 3 líneas de avance):', 'PASS');

// 2. Cálculo de Ancho Útil Imprimible según el Rollo
function getPrintableWidthMm(width = '58mm') {
  return width === '80mm' ? 72 : 52;
}

assert.strictEqual(getPrintableWidthMm('58mm'), 52);
assert.strictEqual(getPrintableWidthMm('80mm'), 72);
assert.strictEqual(getPrintableWidthMm(), 52);
console.log('2. Cálculo de margen y ancho útil milimétrico (52 mm para rollo de 58 mm):', 'PASS');

// 3. Escala Tipográfica según Densidad Térmica
function getFontSizePx(density = 'normal') {
  switch (density) {
    case 'compact':
      return 9.5;
    case 'large':
      return 12.5;
    case 'normal':
    default:
      return 11;
  }
}

assert.strictEqual(getFontSizePx('compact'), 9.5);
assert.strictEqual(getFontSizePx('normal'), 11);
assert.strictEqual(getFontSizePx('large'), 12.5);
assert.strictEqual(getFontSizePx(), 11);
console.log('3. Escala tipográfica adaptativa para legibilidad térmica (9.5px, 11px, 12.5px):', 'PASS');

// 4. Generación de Marbete Adhesivo de Bicicleta con QR
function generateBikeTagThermalHtml(bike, workOrder, qrDataUrl, settings = DEFAULT_PRINTER_SETTINGS) {
  const widthMm = getPrintableWidthMm(settings.paper_width);
  const fontSizePx = getFontSizePx(settings.font_density);
  const qrCodeStr = bike.qr_code || 'BIKE-000000';
  const ownerName = bike.customer?.full_name || workOrder?.customer?.full_name || 'Consumidor Final';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Marbete ${qrCodeStr}</title>
      <style>
        @page { size: auto; margin: 0; }
        body { width: 100%; max-width: ${widthMm}mm; font-size: ${fontSizePx}px; }
      </style>
    </head>
    <body>
      <div class="workshop-title">${settings.workshop_name}</div>
      <div class="qr-box">${qrDataUrl ? `<img src="${qrDataUrl}" />` : `[${qrCodeStr}]`}</div>
      <div class="bike-model">${bike.brand} ${bike.model}</div>
      <div class="bike-serial">${bike.serial_number || 'N/A'}</div>
      <div class="owner-name">${ownerName}</div>
      ${workOrder ? `<div class="order-ref">OT: ${workOrder.order_number}</div>` : ''}
      <div class="cut-line">- - - ADHESIVO PARA MARCO - - -</div>
    </body>
    </html>
  `;
}

const mockBike = {
  id: 'bike-001',
  customer_id: 'c-001',
  brand: 'Trek',
  model: 'Marlin 7',
  bike_type: 'MTB',
  color: 'Azul Eléctrico',
  serial_number: 'WTU1234567M',
  qr_code: 'BIKE-4F8A21',
  customer: { full_name: 'Carlos Ramírez' },
};

const mockOrder = {
  id: 'wo-001',
  order_number: 'OT-000042',
  customer: { full_name: 'Carlos Ramírez', phone: '3101234567' },
  bicycle: mockBike,
  reported_issues: 'Frenos largos y ruido en eje pedalier.',
  accessories_received: 'Portatermo, luz frontal Bontrager',
  internal_notes: 'Raspones menores en tirante trasero derecho.',
  total_labor: 40000,
  total_parts: 60000,
  discount: 5000,
  grand_total: 95000,
  created_at: '2026-03-20T10:00:00.000Z',
  items: [
    { description: 'Ajuste de Frenos Hidráulicos', quantity: 1, unit_price: 40000, total_price: 40000 },
    { description: 'Pastillas de Freno Shimano B05S', quantity: 1, unit_price: 60000, total_price: 60000 },
  ],
};

const bikeTagHtml = generateBikeTagThermalHtml(mockBike, mockOrder, 'data:image/png;base64,mockqr', DEFAULT_PRINTER_SETTINGS);
assert.ok(bikeTagHtml.includes('BIKE-4F8A21'));
assert.ok(bikeTagHtml.includes('Trek Marlin 7'));
assert.ok(bikeTagHtml.includes('WTU1234567M'));
assert.ok(bikeTagHtml.includes('OT: OT-000042'));
assert.ok(bikeTagHtml.includes('max-width: 52mm'));
assert.ok(bikeTagHtml.includes('- - - ADHESIVO PARA MARCO - - -'));
console.log('4. Generación de marbete adhesivo de bicicleta para marco con código QR:', 'PASS');

// 5. Generación de Comprobante de Recepción y Custodia
function generateReceptionTicketHtml(workOrder, signature = null, settings = DEFAULT_PRINTER_SETTINGS) {
  const widthMm = getPrintableWidthMm(settings.paper_width);
  const fontSizePx = getFontSizePx(settings.font_density);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Recepción ${workOrder.order_number}</title>
      <style>
        @page { size: auto; margin: 0; }
        body { width: 100%; max-width: ${widthMm}mm; font-size: ${fontSizePx}px; }
      </style>
    </head>
    <body>
      <div class="header">${settings.workshop_name}</div>
      <div class="nit">NIT: ${settings.workshop_nit}</div>
      <div class="title">COMPROBANTE DE RECEPCIÓN: ${workOrder.order_number}</div>
      <div class="customer">Cliente: ${workOrder.customer?.full_name}</div>
      <div class="issues">Falla: ${workOrder.reported_issues}</div>
      <div class="accessories">Accesorios: ${workOrder.accessories_received || 'Ninguno'}</div>
      <div class="notes">Daños Previos: ${workOrder.internal_notes || 'Ninguno'}</div>
      <div class="sig">${signature?.signer_name || 'Firma Conforme'}</div>
      <div class="cut-line">- - - COMPROBANTE DE CUSTODIA - - -</div>
    </body>
    </html>
  `;
}

const receptionHtml = generateReceptionTicketHtml(mockOrder, { signer_name: 'Carlos Ramírez', signature_data: 'sigdata' });
assert.ok(receptionHtml.includes('COMPROBANTE DE RECEPCIÓN: OT-000042'));
assert.ok(receptionHtml.includes('Falla: Frenos largos y ruido en eje pedalier.'));
assert.ok(receptionHtml.includes('Accesorios: Portatermo, luz frontal Bontrager'));
assert.ok(receptionHtml.includes('Daños Previos: Raspones menores en tirante trasero derecho.'));
assert.ok(receptionHtml.includes('Carlos Ramírez'));
assert.ok(receptionHtml.includes('- - - COMPROBANTE DE CUSTODIA - - -'));
console.log('5. Generación de comprobante de recepción técnica e inventario de accesorios:', 'PASS');

// 6. Generación de Tirilla de Liquidación y Entrega de Orden (OT)
function generateWorkOrderTicketHtml(workOrder, signature = null, settings = DEFAULT_PRINTER_SETTINGS) {
  const widthMm = getPrintableWidthMm(settings.paper_width);
  const fontSizePx = getFontSizePx(settings.font_density);

  const itemsRows = (workOrder.items || [])
    .map((it) => `<div>${it.quantity}x ${it.description} - $${it.total_price}</div>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Orden ${workOrder.order_number}</title>
      <style>
        @page { size: auto; margin: 0; }
        body { width: 100%; max-width: ${widthMm}mm; font-size: ${fontSizePx}px; }
      </style>
    </head>
    <body>
      <div class="header">${settings.workshop_name}</div>
      <div class="title">LIQUIDACIÓN DE ORDEN: ${workOrder.order_number}</div>
      <div class="items">${itemsRows}</div>
      <div class="labor">Mano de Obra: $${workOrder.total_labor}</div>
      <div class="parts">Repuestos: $${workOrder.total_parts}</div>
      <div class="discount">Descuento: -$${workOrder.discount}</div>
      <div class="total">TOTAL A PAGAR: $${workOrder.grand_total}</div>
      <div class="warranty">${settings.warranty_text}</div>
      <div class="cut-line">- - - COMPROBANTE DE ENTREGA - - -</div>
    </body>
    </html>
  `;
}

const workOrderHtml = generateWorkOrderTicketHtml(mockOrder);
assert.ok(workOrderHtml.includes('LIQUIDACIÓN DE ORDEN: OT-000042'));
assert.ok(workOrderHtml.includes('Ajuste de Frenos Hidráulicos'));
assert.ok(workOrderHtml.includes('Pastillas de Freno Shimano B05S'));
assert.ok(workOrderHtml.includes('TOTAL A PAGAR: $95000'));
assert.ok(workOrderHtml.includes('Garantía: 30 días en mano de obra'));
assert.ok(workOrderHtml.includes('- - - COMPROBANTE DE ENTREGA - - -'));
console.log('6. Generación de tirilla de liquidación y entrega de orden con desglose y garantía:', 'PASS');

// 7. Generación de Factura Comercial POS 58 mm
function generateInvoiceThermalTicketHtml(invoice, settings = DEFAULT_PRINTER_SETTINGS) {
  const widthMm = getPrintableWidthMm(settings.paper_width);
  const customerName = invoice.customer?.full_name || 'Consumidor Final (Venta Rápida)';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Factura ${invoice.invoice_number}</title>
      <style>
        @page { size: auto; margin: 0; }
        body { width: 100%; max-width: ${widthMm}mm; }
      </style>
    </head>
    <body>
      <div class="workshop">${settings.workshop_name}</div>
      <div class="inv-num">${invoice.invoice_number}</div>
      <div class="customer">${customerName}</div>
      <div class="method">${invoice.payment_method}</div>
      <div class="total">$${invoice.total} COP</div>
      <div class="footer">${settings.footer_message}</div>
    </body>
    </html>
  `;
}

const mockInvoice = {
  id: 'inv-001',
  invoice_number: 'FAC-000128',
  customer: { full_name: 'Ana María Gómez', document_id: '1020304050' },
  subtotal: 100000,
  discount: 10000,
  tax: 0,
  total: 90000,
  payment_method: 'TRANSFER',
  payment_status: 'PAID',
  created_at: '2026-03-20T11:00:00.000Z',
  items: [
    { description: 'Casco GW Mantis', quantity: 1, unit_price: 100000, total_price: 100000 },
  ],
};

const invoiceHtml = generateInvoiceThermalTicketHtml(mockInvoice);
assert.ok(invoiceHtml.includes('FAC-000128'));
assert.ok(invoiceHtml.includes('Ana María Gómez'));
assert.ok(invoiceHtml.includes('$90000 COP'));
assert.ok(invoiceHtml.includes('TRANSFER'));
assert.ok(invoiceHtml.includes('¡Gracias por pedalear con nosotros! 🚲'));
console.log('7. Generación de tirilla térmica POS de factura con datos del cliente y medio de pago:', 'PASS');

// Factura Venta Rápida (Consumidor Final)
const fastSaleInvoice = {
  id: 'inv-002',
  invoice_number: 'FAC-000129',
  customer: null,
  subtotal: 25000,
  discount: 0,
  tax: 0,
  total: 25000,
  payment_method: 'CASH',
  payment_status: 'PAID',
  created_at: '2026-03-20T11:30:00.000Z',
  items: [
    { description: 'Neumático Chaoyang 29x2.10 V/F', quantity: 1, unit_price: 25000, total_price: 25000 },
  ],
};

const fastInvoiceHtml = generateInvoiceThermalTicketHtml(fastSaleInvoice);
assert.ok(fastInvoiceHtml.includes('Consumidor Final (Venta Rápida)'));
assert.ok(fastInvoiceHtml.includes('$25000 COP'));
console.log('8. Soporte automático de Venta Rápida (Consumidor Final) en factura térmica:', 'PASS');

// 9. Generación de Comprobante Térmico de Arqueo y Cierre Diario de Caja
function generateCashRegisterTicketHtml(register, summary, settings = DEFAULT_PRINTER_SETTINGS) {
  const widthMm = getPrintableWidthMm(settings.paper_width);
  const diff = register.difference || 0;
  const diffLabel =
    diff === 0
      ? 'CAJA CUADRADA ($0)'
      : diff > 0
      ? `SOBRANTE (+ $${diff})`
      : `FALTANTE (- $${Math.abs(diff)})`;

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Cierre Caja</title>
      <style>
        @page { size: auto; margin: 0; }
        body { width: 100%; max-width: ${widthMm}mm; }
      </style>
    </head>
    <body>
      <div class="workshop">${settings.workshop_name}</div>
      <div class="session">SESIÓN: ${register.id.slice(0, 10).toUpperCase()}</div>
      <div class="status">ESTADO: ${register.status}</div>
      <div class="initial">Base: $${register.initial_amount}</div>
      <div class="expected">Efectivo Esperado: $${summary.expectedCashInDrawer}</div>
      <div class="counted">Efectivo Contado: $${register.final_counted_amount}</div>
      <div class="diff">${diffLabel}</div>
      <div class="net">BALANCE NETO: $${summary.netBalance}</div>
      <div class="cut-line">- - - CIERRE DE CAJA ARCHIVABLE - - -</div>
    </body>
    </html>
  `;
}

const mockCashRegister = {
  id: 'cash-reg-20260320',
  opened_by: 'Jhon Alexander Gómez',
  opened_at: '2026-03-20T08:00:00.000Z',
  initial_amount: 150000,
  closed_by: 'Jhon Alexander Gómez',
  closed_at: '2026-03-20T18:00:00.000Z',
  final_counted_amount: 450000,
  system_calculated_amount: 450000,
  difference: 0,
  status: 'CLOSED',
};

const mockSummary = {
  initialAmount: 150000,
  totalCashIncome: 320000,
  totalCashExpense: 20000,
  expectedCashInDrawer: 450000,
  totalTransferIncome: 180000,
  totalCardIncome: 95000,
  totalOtherIncome: 0,
  totalIncome: 595000,
  totalExpense: 20000,
  netBalance: 575000,
  movementsCount: 8,
};

const cashTicketHtml = generateCashRegisterTicketHtml(mockCashRegister, mockSummary);
assert.ok(cashTicketHtml.includes('CASH-REG-2'));
assert.ok(cashTicketHtml.includes('ESTADO: CLOSED'));
assert.ok(cashTicketHtml.includes('Base: $150000'));
assert.ok(cashTicketHtml.includes('Efectivo Esperado: $450000'));
assert.ok(cashTicketHtml.includes('CAJA CUADRADA ($0)'));
assert.ok(cashTicketHtml.includes('BALANCE NETO: $575000'));
assert.ok(cashTicketHtml.includes('- - - CIERRE DE CAJA ARCHIVABLE - - -'));
console.log('9. Generación de tirilla de arqueo y cierre diario de caja con desglose:', 'PASS');

// 10. Descuadre con Faltante en Cierre de Caja
const unevenCashRegister = {
  ...mockCashRegister,
  final_counted_amount: 430000,
  difference: -20000,
};
const unevenCashTicketHtml = generateCashRegisterTicketHtml(unevenCashRegister, mockSummary);
assert.ok(unevenCashTicketHtml.includes('FALTANTE (- $20000)'));
console.log('10. Detección visual y registro de descuadre (Faltante / Sobrante) en tirilla:', 'PASS');

// 11. Generación de Tirilla de Calibración de Hardware
function generateTestTicketHtml(settings = DEFAULT_PRINTER_SETTINGS) {
  const widthMm = getPrintableWidthMm(settings.paper_width);
  const fontSizePx = getFontSizePx(settings.font_density);

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Calibración Térmica</title>
      <style>
        @page { size: auto; margin: 0; }
        body { width: 100%; max-width: ${widthMm}mm; font-size: ${fontSizePx}px; }
      </style>
    </head>
    <body>
      <div class="test-title">${settings.workshop_name} - TEST DE IMPRESIÓN</div>
      <div class="ruler">|0mm.......25mm.......${widthMm}mm|</div>
      <div class="density-block">■■■ DENSIDAD TÉRMICA 100% ■■■</div>
      <div class="params">Rollo: ${settings.paper_width} | Densidad: ${settings.font_density} | Avance: ${settings.feed_lines} líneas</div>
      <div class="status">CABEZAL TÉRMICO Y CORTE OPERATIVO</div>
      <div class="cut-line">- - - CORTAR AQUÍ (LÍNEA DE TEST) - - -</div>
    </body>
    </html>
  `;
}

const testTicketHtml = generateTestTicketHtml(DEFAULT_PRINTER_SETTINGS);
assert.ok(testTicketHtml.includes('|0mm.......25mm.......52mm|'));
assert.ok(testTicketHtml.includes('■■■ DENSIDAD TÉRMICA 100% ■■■'));
assert.ok(testTicketHtml.includes('Rollo: 58mm'));
assert.ok(testTicketHtml.includes('Densidad: normal'));
assert.ok(testTicketHtml.includes('- - - CORTAR AQUÍ (LÍNEA DE TEST) - - -'));
console.log('11. Generación de tirilla de prueba con regla milimétrica y barra de densidad:', 'PASS');

// 12. Regla CSS @page para Bobinas Térmicas Continuas (Sin salto forzado)
const cssPageRule = '@page { size: auto; margin: 0; }';
assert.ok(bikeTagHtml.includes(cssPageRule));
assert.ok(receptionHtml.includes(cssPageRule));
assert.ok(workOrderHtml.includes(cssPageRule));
assert.ok(testTicketHtml.includes(cssPageRule));
console.log('12. Estándar CSS @page { size: auto; margin: 0; } uniforme en todas las plantillas:', 'PASS');

// 13. Persistencia y Restauración de Fábrica en LocalStorage (Simulación)
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

const mockStorage = new MockLocalStorage();
const STORAGE_KEY = 'a2ruedas_printer_settings_v1';

// Guardado de configuración personalizada
const customSettings = {
  ...DEFAULT_PRINTER_SETTINGS,
  workshop_name: 'A2RUEDAS BOGOTÁ NORTE',
  paper_width: '80mm',
  font_density: 'large',
  feed_lines: 4,
};

mockStorage.setItem(STORAGE_KEY, JSON.stringify(customSettings));
const loaded = JSON.parse(mockStorage.getItem(STORAGE_KEY));
assert.strictEqual(loaded.workshop_name, 'A2RUEDAS BOGOTÁ NORTE');
assert.strictEqual(loaded.paper_width, '80mm');
assert.strictEqual(loaded.font_density, 'large');
assert.strictEqual(loaded.feed_lines, 4);
assert.strictEqual(getPrintableWidthMm(loaded.paper_width), 72);

// Restauración de fábrica
mockStorage.removeItem(STORAGE_KEY);
assert.strictEqual(mockStorage.getItem(STORAGE_KEY), null);
console.log('13. Ciclo de persistencia, personalización y restauración de fábrica:', 'PASS');

console.log('-----------------------------------------------------------------------------');
console.log('TODAS LAS PRUEBAS DE LA FASE 17 (IMPRESIÓN TÉRMICA 58 MM) PASARON CON ÉXITO: 13/13');
