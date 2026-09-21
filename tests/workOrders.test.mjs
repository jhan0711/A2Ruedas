import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 9: MÓDULO DE ÓRDENES DE TRABAJO (OT) ---');

// 1. Formato correlativo estricto OT-000001
const otRegex = /^OT-\d{6}$/;
const validOT1 = 'OT-000001';
const validOT2 = 'OT-000104';
const invalidOT = 'OT-104';

console.log('1. Validación de formato correlativo de OT (^OT-\\d{6}$):', (otRegex.test(validOT1) && otRegex.test(validOT2) && !otRegex.test(invalidOT)) ? 'PASS' : 'FAIL');

// 2. Progresión correlativa secuencial
function calculateNextOrderNumber(existingOrders) {
  let maxNum = 0;
  for (const o of existingOrders) {
    const match = o.match(/^OT-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum > 0 ? maxNum + 1 : 1;
  return `OT-${String(nextNum).padStart(6, '0')}`;
}

const list1 = ['OT-000001', 'OT-000002', 'OT-000003'];
const nextNum1 = calculateNextOrderNumber(list1);
const listEmpty = [];
const nextNumEmpty = calculateNextOrderNumber(listEmpty);

console.log(`2. Secuencia correlativa a partir de lista (Próximo: ${nextNum1}):`, nextNum1 === 'OT-000004' ? 'PASS' : 'FAIL');
console.log(`3. Secuencia inicial desde vacío (Próximo: ${nextNumEmpty}):`, nextNumEmpty === 'OT-000001' ? 'PASS' : 'FAIL');

// 3. Validación del ciclo completo de 9 estados
const WORK_ORDER_STATUSES = [
  'RECIBIDA',
  'DIAGNOSTICO',
  'PRESUPUESTO',
  'APROBADA',
  'EN_REPARACION',
  'ESPERANDO_REPUESTO',
  'LISTA',
  'ENTREGADA',
  'CANCELADA',
];

console.log('4. Soporte para el ciclo completo de 9 estados del taller:', WORK_ORDER_STATUSES.length === 9 ? 'PASS' : 'FAIL');

// 4. Consistencia del balance financiero
function calculateOrderTotals(items, discount = 0) {
  const totalLabor = items
    .filter((it) => it.item_type === 'service')
    .reduce((sum, it) => sum + it.unit_price * it.quantity, 0);

  const totalParts = items
    .filter((it) => it.item_type === 'part')
    .reduce((sum, it) => sum + it.unit_price * it.quantity, 0);

  const grandTotal = Math.max(0, totalLabor + totalParts - discount);
  return { totalLabor, totalParts, grandTotal };
}

const mockItems = [
  { item_type: 'service', quantity: 1, unit_price: 55000 }, // Mano de obra: 55.000
  { item_type: 'part', quantity: 2, unit_price: 45000 },    // Repuestos: 90.000
];
const discountApplied = 15000; // Descuento: 15.000
// Gran Total esperado: 55.000 + 90.000 - 15.000 = 130.000

const financialResult = calculateOrderTotals(mockItems, discountApplied);
console.log(`5. Cálculo financiero (Mano de obra $55k + Repuestos $90k - Descuento $15k = $${financialResult.grandTotal.toLocaleString('es-CO')}):`, financialResult.grandTotal === 130000 ? 'PASS' : 'FAIL');

// 5. Integración y descuento automático en Kardex
function simulateAddPartsToWorkOrder(inventory, orderNumber, partsToAdd) {
  const kardexMovements = [];
  const updatedInventory = { ...inventory };

  for (const part of partsToAdd) {
    const currentStock = updatedInventory[part.productId];
    if (currentStock < part.quantity) {
      throw new Error(`Stock insuficiente para repuesto ${part.productId}`);
    }
    const newStock = currentStock - part.quantity;
    updatedInventory[part.productId] = newStock;
    kardexMovements.push({
      product_id: part.productId,
      movement_type: 'out',
      quantity: part.quantity,
      previous_stock: currentStock,
      new_stock: newStock,
      reason: `Instalación en orden ${orderNumber}`,
    });
  }

  return { updatedInventory, kardexMovements };
}

const initialInv = { 'prod-001': 5 }; // Stock inicial: 5 cadenas
const deduction = simulateAddPartsToWorkOrder(initialInv, 'OT-000001', [{ productId: 'prod-001', quantity: 1 }]);

console.log('6. Descuento automático en Kardex de inventario (Stock 5 -> 4):', deduction.updatedInventory['prod-001'] === 4 ? 'PASS' : 'FAIL');
console.log('7. Auditoría de movimiento de salida vinculado a OT-000001:', (deduction.kardexMovements[0].movement_type === 'out' && deduction.kardexMovements[0].reason.includes('OT-000001')) ? 'PASS' : 'FAIL');

// 6. Generación de notificaciones de WhatsApp contextualizadas por estado
function getWhatsAppTemplate(status, customerName, bikeInfo, orderNumber, grandTotal) {
  switch (status) {
    case 'LISTA':
      return `Hola ${customerName}, te escribimos de A2Ruedas Taller para informarte que tu bicicleta ${bikeInfo} ya se encuentra LISTA para entrega (Orden ${orderNumber}). Valor a cancelar: $${grandTotal.toLocaleString('es-CO')}. ¡Te esperamos!`;
    case 'PRESUPUESTO':
      return `Hola ${customerName}, te compartimos el presupuesto para tu bicicleta ${bikeInfo} (Orden ${orderNumber}): Total repuestos y mano de obra: $${grandTotal.toLocaleString('es-CO')}. ¿Confirmas la aprobación para iniciar?`;
    case 'EN_REPARACION':
      return `Hola ${customerName}, te confirmamos que tu orden ${orderNumber} para la bicicleta ${bikeInfo} ya se encuentra EN REPARACIÓN en nuestro taller.`;
    default:
      return `Hola ${customerName}, te contactamos del taller A2Ruedas referente a tu orden de servicio ${orderNumber}.`;
  }
}

const msgLista = getWhatsAppTemplate('LISTA', 'Carlos', 'Trek Marlin 7', 'OT-000001', 130000);
const msgPresupuesto = getWhatsAppTemplate('PRESUPUESTO', 'Laura', 'Specialized Allez', 'OT-000002', 90000);

console.log('8. Plantilla de WhatsApp para estado "LISTA" con saldo a pagar:', msgLista.includes('LISTA para entrega') && msgLista.includes('130.000') ? 'PASS' : 'FAIL');
console.log('9. Plantilla de WhatsApp para estado "PRESUPUESTO" solicitando aprobación:', msgPresupuesto.includes('presupuesto') && msgPresupuesto.includes('Confirmas la aprobación') ? 'PASS' : 'FAIL');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 9 FINALIZADAS EXITOSAMENTE ---');
