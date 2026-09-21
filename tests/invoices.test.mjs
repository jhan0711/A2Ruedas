import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 16: FACTURACIÓN Y RECIBOS INTERNOS ---');

// 1. Validación de Formato de Número Consecutivo Fiscal (FAC-000001)
const FAC_REGEX = /^FAC-\d{6}$/;

function formatInvoiceNumber(sequence) {
  if (sequence <= 0 || !Number.isInteger(sequence)) {
    throw new Error('El consecutivo debe ser un entero positivo mayor a cero.');
  }
  return `FAC-${String(sequence).padStart(6, '0')}`;
}

const testFac1 = formatInvoiceNumber(1);
assert.strictEqual(testFac1, 'FAC-000001');
assert.ok(FAC_REGEX.test(testFac1));
console.log('1. Formato estricto de consecutivo correlativo FAC-000001:', 'PASS');

const testFac2 = formatInvoiceNumber(42);
assert.strictEqual(testFac2, 'FAC-000042');
assert.ok(FAC_REGEX.test(testFac2));
console.log('2. Relleno con ceros a la izquierda (padding de 6 dígitos):', 'PASS');

// 2. Bloqueo de secuencia inválida
let invalidSequenceCaught = false;
try {
  formatInvoiceNumber(-5);
} catch (e) {
  invalidSequenceCaught = true;
}
assert.strictEqual(invalidSequenceCaught, true);
console.log('3. Prevención de números de secuencia negativos o inválidos:', 'PASS');

// 3. Generación del siguiente consecutivo a partir de lista existente
function getNextInvoiceNumber(existingInvoices) {
  if (!existingInvoices || existingInvoices.length === 0) {
    return 'FAC-000001';
  }

  let maxNum = 0;
  for (const inv of existingInvoices) {
    const match = inv.invoice_number.match(/^FAC-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return `FAC-${String(maxNum + 1).padStart(6, '0')}`;
}

const initialList = [];
assert.strictEqual(getNextInvoiceNumber(initialList), 'FAC-000001');

const populatedList = [
  { invoice_number: 'FAC-000001' },
  { invoice_number: 'FAC-000002' },
  { invoice_number: 'FAC-000005' },
];
assert.strictEqual(getNextInvoiceNumber(populatedList), 'FAC-000006');
console.log('4. Cálculo automático del siguiente número correlativo disponible:', 'PASS');

// 4. Cálculo de Subtotales de Ítems (Servicios y Repuestos)
function calculateInvoiceFinancials(items, discount = 0, taxRate = 0) {
  if (!items || items.length === 0) {
    throw new Error('La factura debe contener al menos un ítem o servicio.');
  }

  const calculatedItems = items.map((it) => {
    const qty = Math.max(1, it.quantity || 1);
    const unitPrice = Math.max(0, it.unit_price || 0);
    const totalPrice = qty * unitPrice;
    return {
      ...it,
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
    };
  });

  const subtotal = calculatedItems.reduce((acc, it) => acc + it.total_price, 0);
  const validDiscount = Math.min(Math.max(0, discount), subtotal);
  const taxableBase = Math.max(0, subtotal - validDiscount);
  const tax = Math.round(taxableBase * (taxRate / 100));
  const total = taxableBase + tax;

  return {
    items: calculatedItems,
    subtotal,
    discount: validDiscount,
    taxableBase,
    tax,
    taxRate,
    total,
  };
}

const sampleItems = [
  { description: 'Mantenimiento General Pro', quantity: 1, unit_price: 75000, item_type: 'service' },
  { description: 'Pastillas Shimano B05S', quantity: 2, unit_price: 35000, item_type: 'part' },
];

const fin1 = calculateInvoiceFinancials(sampleItems, 0, 0);
assert.strictEqual(fin1.subtotal, 145000); // 75.000 + 70.000
assert.strictEqual(fin1.discount, 0);
assert.strictEqual(fin1.tax, 0);
assert.strictEqual(fin1.total, 145000);
console.log('5. Desglose y cálculo exacto de subtotal de servicios y repuestos:', 'PASS');

// 5. Descuentos comerciales y cálculo de IVA
const fin2WithDiscount = calculateInvoiceFinancials(sampleItems, 15000, 0);
assert.strictEqual(fin2WithDiscount.subtotal, 145000);
assert.strictEqual(fin2WithDiscount.discount, 15000);
assert.strictEqual(fin2WithDiscount.total, 130000);
console.log('6. Aplicación de descuento comercial sobre el subtotal ($15.000):', 'PASS');

const fin3WithTax = calculateInvoiceFinancials(sampleItems, 0, 19);
assert.strictEqual(fin3WithTax.subtotal, 145000);
assert.strictEqual(fin3WithTax.tax, 27550); // 145.000 * 19%
assert.strictEqual(fin3WithTax.total, 172550);
console.log('7. Cálculo de régimen tributario con IVA (19% sobre base gravable):', 'PASS');

// 6. Bloqueo de factura vacía sin ítems
let emptyItemsCaught = false;
try {
  calculateInvoiceFinancials([]);
} catch (e) {
  emptyItemsCaught = true;
}
assert.strictEqual(emptyItemsCaught, true);
console.log('8. Bloqueo estricto de emisión de comprobante sin ítems ni servicios:', 'PASS');

// 7. Importación y conversión de Orden de Trabajo (OT) a Factura
function importWorkOrderToInvoice(workOrder, paymentMethod, discount = 0) {
  const rawItems = workOrder.items || [];
  let invoiceItems = [];

  if (rawItems.length > 0) {
    invoiceItems = rawItems.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: it.total_price || it.quantity * it.unit_price,
      item_type: it.item_type || 'service',
    }));
  } else {
    invoiceItems = [
      {
        description: `Servicio general de taller para ${workOrder.bike_name || 'Bicicleta'}`,
        quantity: 1,
        unit_price: workOrder.grand_total,
        total_price: workOrder.grand_total,
        item_type: 'service',
      },
    ];
  }

  const financials = calculateInvoiceFinancials(invoiceItems, discount, 0);

  return {
    customer_id: workOrder.customer_id,
    work_order_id: workOrder.order_number,
    subtotal: financials.subtotal,
    discount: financials.discount,
    tax: financials.tax,
    tax_rate: 0,
    total: financials.total,
    payment_method: paymentMethod,
    payment_status: 'PAID',
    items: financials.items,
  };
}

const mockOT = {
  id: 'wo-101',
  order_number: 'OT-000088',
  customer_id: 'cust-99',
  bike_name: 'Trek Marlin 7',
  grand_total: 95000,
  items: [
    { description: 'Purgado frenos hidráulicos', quantity: 2, unit_price: 25000, total_price: 50000, item_type: 'service' },
    { description: 'Líquido mineral Shimano 50ml', quantity: 1, unit_price: 45000, total_price: 45000, item_type: 'part' },
  ],
};

const importedInvoice = importWorkOrderToInvoice(mockOT, 'TRANSFER', 5000);
assert.strictEqual(importedInvoice.work_order_id, 'OT-000088');
assert.strictEqual(importedInvoice.customer_id, 'cust-99');
assert.strictEqual(importedInvoice.items.length, 2);
assert.strictEqual(importedInvoice.subtotal, 95000);
assert.strictEqual(importedInvoice.discount, 5000);
assert.strictEqual(importedInvoice.total, 90000);
assert.strictEqual(importedInvoice.payment_method, 'TRANSFER');
console.log('9. Conversión fidedigna de Orden de Trabajo a Factura con ítems y descuento:', 'PASS');

// 8. Integración automática con Arqueo de Caja (Fase 15)
function createCashMovementFromInvoice(invoice) {
  if (invoice.payment_status !== 'PAID') {
    return null;
  }

  return {
    type: 'INCOME',
    concept: `Cobro Factura ${invoice.invoice_number}${invoice.work_order_id ? ` (OT: ${invoice.work_order_id})` : ''}`,
    amount: invoice.total,
    payment_method: invoice.payment_method,
    category: invoice.work_order_id ? 'ORDER_PAYMENT' : 'COUNTER_SALE',
    reference_type: 'INVOICE',
    reference_id: invoice.invoice_number,
  };
}

const cashMovement = createCashMovementFromInvoice({
  invoice_number: 'FAC-000088',
  work_order_id: 'OT-000088',
  payment_status: 'PAID',
  payment_method: 'CASH',
  total: 90000,
});

assert.ok(cashMovement !== null);
assert.strictEqual(cashMovement.type, 'INCOME');
assert.strictEqual(cashMovement.amount, 90000);
assert.strictEqual(cashMovement.payment_method, 'CASH');
assert.strictEqual(cashMovement.reference_id, 'FAC-000088');
assert.strictEqual(cashMovement.category, 'ORDER_PAYMENT');
console.log('10. Sincronización automática de ingreso en Arqueo de Caja al cobrar factura:', 'PASS');

// 9. Anulación Formal de Factura con Motivo Requerido
function cancelInvoice(invoice, reason) {
  if (!reason || !reason.trim()) {
    throw new Error('Es obligatorio indicar el motivo de la anulación.');
  }
  if (invoice.payment_status === 'CANCELLED') {
    throw new Error('La factura ya se encuentra anulada.');
  }

  return {
    ...invoice,
    payment_status: 'CANCELLED',
    cancel_reason: reason.trim(),
    updated_at: new Date().toISOString(),
  };
}

const activeInvoice = {
  id: 'fac-300',
  invoice_number: 'FAC-000300',
  payment_status: 'PAID',
  total: 120000,
};

const cancelled = cancelInvoice(activeInvoice, 'Error de digitación en repuesto cobrado');
assert.strictEqual(cancelled.payment_status, 'CANCELLED');
assert.strictEqual(cancelled.cancel_reason, 'Error de digitación en repuesto cobrado');
console.log('11. Anulación controlada con registro obligatorio del motivo:', 'PASS');

let cancelWithoutReasonCaught = false;
try {
  cancelInvoice(activeInvoice, '   ');
} catch (e) {
  cancelWithoutReasonCaught = true;
}
assert.strictEqual(cancelWithoutReasonCaught, true);
console.log('12. Bloqueo de anulación cuando no se provee motivo justificativo:', 'PASS');

// 10. Compartir Comprobante por WhatsApp con Formateo Internacional
function buildInvoiceWhatsAppMessage(invoice, customer, items) {
  const itemsText = items
    .map((it) => `• ${it.description} x${it.quantity}: $${it.total_price.toLocaleString('es-CO')}`)
    .join('\n');

  return `¡Hola ${customer.full_name}! 👋 Te compartimos tu comprobante de factura de A2Ruedas Taller:

📄 *Factura N°:* ${invoice.invoice_number}${invoice.work_order_id ? `\n🚲 *Orden OT:* ${invoice.work_order_id}` : ''}

*Detalle de Servicios & Repuestos:*
${itemsText}

💰 *Total Cancelado:* $${invoice.total.toLocaleString('es-CO')} COP
💳 *Medio de Pago:* ${invoice.payment_method}

¡Gracias por confiar en A2Ruedas Taller! 🚲🔧`;
}

const waText = buildInvoiceWhatsAppMessage(
  { invoice_number: 'FAC-000001', work_order_id: 'OT-000001', total: 110000, payment_method: 'CASH' },
  { full_name: 'Ana Gómez', phone: '3101112233' },
  [{ description: 'Mantenimiento General', quantity: 1, total_price: 75000 }]
);

assert.ok(waText.includes('FAC-000001'));
assert.ok(waText.includes('OT-000001'));
assert.ok(waText.includes('Ana Gómez'));
assert.ok(waText.includes('$110.000 COP'));
console.log('13. Construcción fidedigna del mensaje de WhatsApp con detalle de la factura:', 'PASS');

// 11. Métricas Financieras y KPIs de Facturación
function calculateStats(invoices) {
  const paidInvoices = invoices.filter((i) => i.payment_status === 'PAID');
  const pendingInvoices = invoices.filter((i) => i.payment_status === 'PENDING');

  const totalInvoiced = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  const invoicesCount = paidInvoices.length;
  const averageTicket = invoicesCount > 0 ? Math.round(totalInvoiced / invoicesCount) : 0;
  const pendingCount = pendingInvoices.length;
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);

  return {
    totalInvoiced,
    invoicesCount,
    averageTicket,
    pendingCount,
    pendingAmount,
  };
}

const statsSample = [
  { id: '1', payment_status: 'PAID', total: 100000 },
  { id: '2', payment_status: 'PAID', total: 200000 },
  { id: '3', payment_status: 'PENDING', total: 50000 },
  { id: '4', payment_status: 'CANCELLED', total: 300000 }, // No debe sumar
];

const stats = calculateStats(statsSample);
assert.strictEqual(stats.totalInvoiced, 300000);
assert.strictEqual(stats.invoicesCount, 2);
assert.strictEqual(stats.averageTicket, 150000);
assert.strictEqual(stats.pendingCount, 1);
assert.strictEqual(stats.pendingAmount, 50000);
console.log('14. Cálculo exacto de métricas consolidadas (Total, Ticket Promedio, Pendientes):', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 16 PASARON SATISFACTORIAMENTE (14/14) ---');
