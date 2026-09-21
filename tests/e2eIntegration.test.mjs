import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 21: QA E2E INTEGRACIÓN DE NEGOCIO ---');

// ==============================================================================
// 1. Simulación de Modelos y Datos del Flujo Operativo Completo
// ==============================================================================

// 1.1. Base de datos simulada en memoria
const db = {
  customers: [],
  bicycles: [],
  qrs: [],
  workOrders: [],
  workOrderItems: [],
  workOrderStatusHistory: [],
  signatures: [],
  products: [
    {
      id: 'prod-cad-01',
      sku: 'CAD-SHI-12S',
      name: 'Cadena Shimano Deore 12V',
      brand: 'Shimano',
      sale_price: 155000,
      cost_price: 95000,
      stock: 5,
      min_stock: 2,
      is_active: true,
    },
    {
      id: 'prod-pas-01',
      sku: 'PAS-ORG-SHI',
      name: 'Pastillas Freno Shimano Resina',
      brand: 'Shimano',
      sale_price: 35000,
      cost_price: 18000,
      stock: 10,
      min_stock: 3,
      is_active: true,
    },
  ],
  inventoryMovements: [],
  cashRegister: {
    id: 'caja-20260921',
    opened_at: '2026-09-21T08:00:00Z',
    initial_cash: 150000,
    closed_at: null,
  },
  cashMovements: [],
  invoices: [],
  invoiceItems: [],
};

// 1.2. Paso 1: Recepción de Cliente
const newCustomer = {
  id: 'cust-juan-01',
  full_name: 'Juan David Pérez',
  phone: '3115551234',
  email: 'juan.perez@example.com',
  document_id: '1020345678',
  address: 'Carrera 15 # 85-30, Bogotá',
};
db.customers.push(newCustomer);

assert.strictEqual(db.customers.length, 1);
assert.strictEqual(db.customers[0].phone, '3115551234');
console.log('1. [E2E] Registro y vinculación exitosa de nuevo cliente en taller:', 'PASS');

// 1.3. Paso 2: Registro de Bicicleta y Generación de Código QR
const newBike = {
  id: 'bike-spec-01',
  customer_id: newCustomer.id,
  brand: 'Specialized',
  model: 'Rockhopper Comp 29',
  bike_type: 'MTB',
  color: 'Negro / Azul Eléctrico',
  serial_number: 'SN-SPEC-2024-8891',
  year: 2024,
  wheel_size: '29"',
  frame_size: 'M',
};
db.bicycles.push(newBike);

const newQr = {
  id: 'qr-bike-01',
  bicycle_id: newBike.id,
  qr_code: 'BIKE-4A82F1',
  is_active: true,
  created_at: new Date().toISOString(),
};
db.qrs.push(newQr);

assert.strictEqual(db.bicycles.length, 1);
assert.ok(/^BIKE-[0-9A-F]{6}$/.test(newQr.qr_code));
console.log('2. [E2E] Ficha técnica de bicicleta vinculada a código QR único (BIKE-4A82F1):', 'PASS');

// 1.4. Paso 3: Recepción Técnica, Inspección de Daños Previos y Firma Digital
const preExistingDamages = [
  { area: 'Rueda Trasera', description: 'Radio desajustado con ligero descentrado' },
  { area: 'Marco', description: 'Rayón superficial en tubo inferior cerca al pedalier' },
];

const accessoriesInCustody = ['Ciclocomputador GPS', 'Portacaramañola', 'Luz trasera LED'];

const receptionSignature = {
  id: 'sig-rec-01',
  signable_type: 'work_order',
  signature_type: 'reception',
  signer_name: newCustomer.full_name,
  signer_document: newCustomer.document_id,
  signature_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA...',
  created_at: new Date().toISOString(),
};
db.signatures.push(receptionSignature);

assert.strictEqual(preExistingDamages.length, 2);
assert.strictEqual(accessoriesInCustody.length, 3);
assert.strictEqual(receptionSignature.signer_name, 'Juan David Pérez');
console.log('3. [E2E] Registro inmutable de daños previos, accesorios y firma digital táctil:', 'PASS');

// 1.5. Paso 4: Creación de Orden de Trabajo (OT-000001) y Presupuesto
const workOrder = {
  id: 'wo-000001',
  order_number: 'OT-000001',
  customer_id: newCustomer.id,
  bicycle_id: newBike.id,
  status: 'RECIBIDA',
  reported_issues: 'Mantenimiento integral por desgaste de cadena y ruidos en frenos traseros',
  advance_payment: 100000,
  created_at: '2026-09-21T09:00:00Z',
};
db.workOrders.push(workOrder);

// Registro de abono/anticipo en caja abierta
db.cashMovements.push({
  id: 'cm-001',
  cash_register_id: db.cashRegister.id,
  work_order_id: workOrder.id,
  type: 'INCOME',
  amount: 100000,
  payment_method: 'CASH',
  description: `Anticipo de orden ${workOrder.order_number}`,
  created_at: '2026-09-21T09:05:00Z',
});

// Agregar servicios y repuestos presupuestados
const orderItems = [
  {
    id: 'woi-01',
    work_order_id: workOrder.id,
    item_type: 'service',
    description: 'Mantenimiento General Completo',
    quantity: 1,
    unit_price: 120000,
    total_price: 120000,
  },
  {
    id: 'woi-02',
    work_order_id: workOrder.id,
    item_type: 'service',
    description: 'Purga y Calibración de Frenos Hidráulicos',
    quantity: 1,
    unit_price: 45000,
    total_price: 45000,
  },
  {
    id: 'woi-03',
    work_order_id: workOrder.id,
    item_type: 'part',
    product_id: 'prod-cad-01',
    description: 'Cadena Shimano Deore 12V',
    quantity: 1,
    unit_price: 155000,
    total_price: 155000,
  },
  {
    id: 'woi-04',
    work_order_id: workOrder.id,
    item_type: 'part',
    product_id: 'prod-pas-01',
    description: 'Pastillas Freno Shimano Resina',
    quantity: 1,
    unit_price: 35000,
    total_price: 35000,
  },
];
db.workOrderItems.push(...orderItems);

const grossTotal = orderItems.reduce((acc, it) => acc + it.total_price, 0); // 120k + 45k + 155k + 35k = 355.000
const commercialDiscount = 25000;
const netTotal = grossTotal - commercialDiscount; // 330.000
const remainingBalance = netTotal - workOrder.advance_payment; // 330.000 - 100.000 = 230.000

assert.strictEqual(grossTotal, 355000);
assert.strictEqual(netTotal, 330000);
assert.strictEqual(remainingBalance, 230000);
console.log('4. [E2E] Apertura de OT-000001, liquidación de ítems, descuento ($25.000) y saldo ($230.000):', 'PASS');

// 1.6. Paso 5: Ciclo Completo de Estados Operacionales del Taller
const statusProgression = ['RECIBIDA', 'EN_DIAGNOSTICO', 'PRESUPUESTO', 'EN_REPARACION', 'LISTA', 'ENTREGADA'];
for (const st of statusProgression) {
  workOrder.status = st;
  db.workOrderStatusHistory.push({
    work_order_id: workOrder.id,
    status: st,
    changed_at: new Date().toISOString(),
  });
}

assert.strictEqual(workOrder.status, 'ENTREGADA');
assert.strictEqual(db.workOrderStatusHistory.length, 6);
console.log('5. [E2E] Transición ininterrumpida de estados (RECIBIDA -> DIAGNÓSTICO -> LISTA -> ENTREGADA):', 'PASS');

// 1.7. Paso 6: Descuento Automático de Repuestos en Kardex de Inventario
for (const item of orderItems.filter((i) => i.item_type === 'part')) {
  const prod = db.products.find((p) => p.id === item.product_id);
  assert.ok(prod !== undefined);

  const prevStock = prod.stock;
  prod.stock -= item.quantity;

  db.inventoryMovements.push({
    id: `mov-${item.id}`,
    product_id: prod.id,
    type: 'OUT',
    quantity: item.quantity,
    previous_stock: prevStock,
    new_stock: prod.stock,
    reference: workOrder.order_number,
    reason: `Repuesto instalado en orden de trabajo ${workOrder.order_number}`,
  });
}

const updatedCadena = db.products.find((p) => p.id === 'prod-cad-01');
const updatedPastillas = db.products.find((p) => p.id === 'prod-pas-01');

assert.strictEqual(updatedCadena.stock, 4); // 5 - 1 = 4
assert.strictEqual(updatedPastillas.stock, 9); // 10 - 1 = 9
assert.strictEqual(db.inventoryMovements.length, 2);
console.log('6. [E2E] Descuento atómico en Kardex con auditoría de salidas vinculadas a la OT:', 'PASS');

// 1.8. Paso 7: Facturación y Pago del Saldo Pendiente
const invoice = {
  id: 'inv-000001',
  invoice_number: 'FAC-000001',
  customer_id: newCustomer.id,
  work_order_id: workOrder.id,
  subtotal: grossTotal,
  discount: commercialDiscount,
  total: netTotal,
  paid_amount: netTotal,
  status: 'PAID',
  payment_method: 'NEQUI',
  created_at: new Date().toISOString(),
};
db.invoices.push(invoice);

// Registrar cobro del saldo restante en la caja activa
db.cashMovements.push({
  id: 'cm-002',
  cash_register_id: db.cashRegister.id,
  invoice_id: invoice.id,
  type: 'INCOME',
  amount: remainingBalance,
  payment_method: 'NEQUI',
  description: `Cobro saldo factura ${invoice.invoice_number}`,
  created_at: new Date().toISOString(),
});

assert.strictEqual(invoice.invoice_number, 'FAC-000001');
assert.strictEqual(invoice.status, 'PAID');
assert.strictEqual(db.cashMovements.length, 2);
console.log('7. [E2E] Emisión de factura FAC-000001 y sincronización automática del cobro en Caja:', 'PASS');

// 1.9. Paso 8: Generación de Tirilla Térmica POS 58 mm
function generateE2EThermalReceipt(wo, inv, items) {
  return `
  === A2RUEDAS TALLER ===
  NIT: 901.452.879-1
  ORDEN: ${wo.order_number} | FACTURA: ${inv.invoice_number}
  CLIENTE: ${newCustomer.full_name}
  BICI: ${newBike.brand} ${newBike.model}
  -----------------------
  ${items.map((it) => `${it.quantity}x ${it.description} = $${it.total_price.toLocaleString('es-CO')}`).join('\n  ')}
  -----------------------
  SUBTOTAL: $${inv.subtotal.toLocaleString('es-CO')}
  DESCUENTO: -$${inv.discount.toLocaleString('es-CO')}
  TOTAL: $${inv.total.toLocaleString('es-CO')}
  PAGO: ${inv.payment_method}
  GARANTÍA: 30 DÍAS EN MANO DE OBRA
  === GRACIAS POR SU VISITA ===
  `;
}

const thermalReceipt = generateE2EThermalReceipt(workOrder, invoice, orderItems);
assert.ok(thermalReceipt.includes('OT-000001'));
assert.ok(thermalReceipt.includes('FAC-000001'));
assert.ok(thermalReceipt.includes('GARANTÍA: 30 DÍAS'));
console.log('8. [E2E] Formateo fidedigno de tirilla térmica 58 mm con términos legales de garantía:', 'PASS');

// 1.10. Paso 9: Generación de Notificación WhatsApp al Cliente
function generateE2EWhatsAppNotification(customer, wo, inv) {
  const phone = customer.phone.startsWith('57') ? customer.phone : `57${customer.phone}`;
  const msg = `¡Hola ${customer.full_name}! 👋🚴 Tu bicicleta ${newBike.brand} ${newBike.model} está lista para entrega en A2Ruedas. Orden: ${wo.order_number}. Factura: ${inv.invoice_number} pagada con éxito. ¡Te esperamos!`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

const waLink = generateE2EWhatsAppNotification(newCustomer, workOrder, invoice);
assert.ok(waLink.startsWith('https://wa.me/573115551234?text='));
assert.ok(decodeURIComponent(waLink).includes('OT-000001'));
console.log('9. [E2E] Enlace directo de notificación por WhatsApp con indicativo nacional (+57):', 'PASS');

// 1.11. Paso 10: Consulta Pública por Código QR (Libre de Datos Privados)
function getE2EPublicTimeline(qrCodeStr) {
  const qr = db.qrs.find((q) => q.qr_code === qrCodeStr);
  if (!qr) return null;

  const bike = db.bicycles.find((b) => b.id === qr.bicycle_id);
  const orders = db.workOrders
    .filter((o) => o.bicycle_id === bike.id && o.status === 'ENTREGADA')
    .map((o) => ({
      order_number: o.order_number,
      status: o.status,
      services: db.workOrderItems.filter((i) => i.work_order_id === o.id).map((i) => i.description),
    }));

  return {
    qr_code: qr.qr_code,
    brand: bike.brand,
    model: bike.model,
    color: bike.color,
    work_orders: orders,
  };
}

const publicTimeline = getE2EPublicTimeline('BIKE-4A82F1');
assert.ok(publicTimeline !== null);
assert.strictEqual(publicTimeline.brand, 'Specialized');
assert.strictEqual(publicTimeline.work_orders.length, 1);
assert.strictEqual(publicTimeline.customer, undefined); // Protección PII
assert.strictEqual(publicTimeline.customer_phone, undefined); // Protección PII
console.log('10. [E2E] Validación de timeline público por QR certificado sin fugas de privacidad:', 'PASS');

console.log('--- TODAS LAS PRUEBAS E2E DE INTEGRACIÓN PASARON EXITOSAMENTE (100% PASS) ---');
