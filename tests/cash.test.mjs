import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 15: MÓDULO DE FLUJO DE CAJA Y ARQUEO DIARIO ---');

// 1. Algoritmo de apertura de caja
function createCashRegister(initialAmount, openedBy, notes) {
  if (initialAmount < 0) {
    throw new Error('El monto de la base inicial no puede ser negativo.');
  }
  return {
    id: `cash-${Date.now()}`,
    opened_by: openedBy || 'Administrador',
    opened_at: new Date().toISOString(),
    initial_amount: initialAmount,
    status: 'OPEN',
    notes: notes || null,
  };
}

const reg1 = createCashRegister(150000, 'Jhan Carlos', 'Apertura con base estándar');
assert.strictEqual(reg1.status, 'OPEN');
assert.strictEqual(reg1.initial_amount, 150000);
console.log('1. Apertura formal de caja con base inicial en efectivo ($150.000 COP):', 'PASS');

// 2. Prevención de base negativa
let errorCaught = false;
try {
  createCashRegister(-50000, 'Admin');
} catch (err) {
  errorCaught = true;
}
assert.strictEqual(errorCaught, true);
console.log('2. Bloqueo estricto de apertura con monto inicial negativo:', errorCaught ? 'PASS' : 'FAIL');

// 3. Registro de movimientos de caja
function createCashMovement(registerId, type, concept, amount, paymentMethod, category, refId) {
  if (amount <= 0) {
    throw new Error('El monto del movimiento debe ser mayor a cero.');
  }
  if (!concept || !concept.trim()) {
    throw new Error('El concepto es obligatorio.');
  }
  return {
    id: `mov-${Math.random().toString(36).substring(2, 9)}`,
    cash_register_id: registerId,
    type,
    concept: concept.trim(),
    amount,
    payment_method: paymentMethod,
    category: category || 'OTHER',
    reference_id: refId || null,
    created_at: new Date().toISOString(),
  };
}

const movIncomeCash = createCashMovement(reg1.id, 'INCOME', 'Abono mantenimiento OT-000001', 65000, 'CASH', 'ORDER_DEPOSIT', 'OT-000001');
assert.strictEqual(movIncomeCash.amount, 65000);
assert.strictEqual(movIncomeCash.payment_method, 'CASH');
console.log('3. Registro de ingreso en efectivo ($65.000 - Abono OT-000001):', 'PASS');

const movIncomeTransfer = createCashMovement(reg1.id, 'INCOME', 'Pago Nequi lubricante Squirt', 45000, 'TRANSFER', 'COUNTER_SALE');
assert.strictEqual(movIncomeTransfer.amount, 45000);
assert.strictEqual(movIncomeTransfer.payment_method, 'TRANSFER');
console.log('4. Registro de ingreso por transferencia digital ($45.000 - Nequi):', 'PASS');

const movIncomeCard = createCashMovement(reg1.id, 'INCOME', 'Liquidación OT-000002 con datáfono', 110000, 'CARD', 'ORDER_PAYMENT', 'OT-000002');
assert.strictEqual(movIncomeCard.amount, 110000);
assert.strictEqual(movIncomeCard.payment_method, 'CARD');
console.log('5. Registro de ingreso con tarjeta / datáfono ($110.000):', 'PASS');

const movExpenseCash = createCashMovement(reg1.id, 'EXPENSE', 'Compra desengrasante cítrico', 18000, 'CASH', 'OPERATING_EXPENSE');
assert.strictEqual(movExpenseCash.amount, 18000);
assert.strictEqual(movExpenseCash.type, 'EXPENSE');
console.log('6. Registro de egreso / salida en efectivo ($18.000 - Gasto taller):', 'PASS');

// 4. Cálculo matemático del resumen y arqueo de caja
function calculateCashSummary(register, movements) {
  const cashIncome = movements
    .filter((m) => m.type === 'INCOME' && m.payment_method === 'CASH')
    .reduce((sum, m) => sum + m.amount, 0);

  const cashExpense = movements
    .filter((m) => m.type === 'EXPENSE' && m.payment_method === 'CASH')
    .reduce((sum, m) => sum + m.amount, 0);

  const expectedCashInDrawer = register.initial_amount + cashIncome - cashExpense;

  const transferIncome = movements
    .filter((m) => m.type === 'INCOME' && m.payment_method === 'TRANSFER')
    .reduce((sum, m) => sum + m.amount, 0);

  const cardIncome = movements
    .filter((m) => m.type === 'INCOME' && m.payment_method === 'CARD')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalIncome = movements
    .filter((m) => m.type === 'INCOME')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalExpense = movements
    .filter((m) => m.type === 'EXPENSE')
    .reduce((sum, m) => sum + m.amount, 0);

  const netBalance = totalIncome - totalExpense;

  return {
    initialAmount: register.initial_amount,
    totalCashIncome: cashIncome,
    totalCashExpense: cashExpense,
    expectedCashInDrawer,
    totalTransferIncome: transferIncome,
    totalCardIncome: cardIncome,
    totalIncome,
    totalExpense,
    netBalance,
    movementsCount: movements.length,
  };
}

const testMovements = [movIncomeCash, movIncomeTransfer, movIncomeCard, movExpenseCash];
const summary = calculateCashSummary(reg1, testMovements);

// Efectivo en gaveta = 150.000 (base) + 65.000 (ingreso cash) - 18.000 (egreso cash) = 197.000
assert.strictEqual(summary.expectedCashInDrawer, 197000);
console.log('7. Cálculo matemático exacto de efectivo en gaveta (Base + Entradas - Salidas = $197.000):', summary.expectedCashInDrawer === 197000 ? 'PASS' : 'FAIL');

// Segregación estricta de dinero digital (no afecta efectivo en gaveta)
assert.strictEqual(summary.totalTransferIncome, 45000);
assert.strictEqual(summary.totalCardIncome, 110000);
console.log('8. Segregación estricta de transferencias ($45k) y tarjetas ($110k) sin alterar gaveta física:', 'PASS');

// Balance total neto (Ingresos totales - Egresos totales)
// Total ingresos = 65.000 + 45.000 + 110.000 = 220.000. Egresos = 18.000. Balance = 202.000
assert.strictEqual(summary.totalIncome, 220000);
assert.strictEqual(summary.netBalance, 202000);
console.log('9. Balance neto total de la jornada ($220.000 - $18.000 = $202.000):', summary.netBalance === 202000 ? 'PASS' : 'FAIL');

// 5. Calculadora de billetes colombianos
function calculateDenominationsTotal(denoms) {
  return (
    (denoms.bill100k || 0) * 100000 +
    (denoms.bill50k || 0) * 50000 +
    (denoms.bill20k || 0) * 20000 +
    (denoms.bill10k || 0) * 10000 +
    (denoms.bill5k || 0) * 5000 +
    (denoms.bill2k || 0) * 2000 +
    (denoms.coins || 0)
  );
}

// Conteo: 1x$100k, 1x$50k, 2x$20k, 0x$10k, 1x$5k, 1x$2k, 0 monedas = 100k + 50k + 40k + 5k + 2k = 197.000
const denomsCount = {
  bill100k: 1,
  bill50k: 1,
  bill20k: 2,
  bill10k: 0,
  bill5k: 1,
  bill2k: 1,
  coins: 0,
};
const countedCash = calculateDenominationsTotal(denomsCount);
assert.strictEqual(countedCash, 197000);
console.log('10. Calculadora de denominaciones de billetes colombianos ($197.000 exactos):', countedCash === 197000 ? 'PASS' : 'FAIL');

// 6. Arqueo y detección de diferencias
function reconcileCash(expectedAmount, finalCountedAmount) {
  const difference = finalCountedAmount - expectedAmount;
  let status = 'BALANCED';
  if (difference > 0) status = 'SURPLUS';
  if (difference < 0) status = 'DEFICIT';
  return { difference, status };
}

// Caso Cuadrada
const rExact = reconcileCash(197000, 197000);
assert.strictEqual(rExact.difference, 0);
assert.strictEqual(rExact.status, 'BALANCED');
console.log('11. Detección de Caja Cuadrada perfecta (Diferencia = $0):', 'PASS');

// Caso Sobrante
const rSurplus = reconcileCash(197000, 202000);
assert.strictEqual(rSurplus.difference, 5000);
assert.strictEqual(rSurplus.status, 'SURPLUS');
console.log('12. Detección de Sobrante en caja (+ $5.000):', 'PASS');

// Caso Faltante
const rDeficit = reconcileCash(197000, 190000);
assert.strictEqual(rDeficit.difference, -7000);
assert.strictEqual(rDeficit.status, 'DEFICIT');
console.log('13. Detección de Faltante en caja (- $7.000):', 'PASS');

// 7. Cierre formal de sesión de caja
function closeCashRegister(register, summary, finalCountedAmount, closedBy, notes, denominations) {
  const difference = finalCountedAmount - summary.expectedCashInDrawer;
  return {
    ...register,
    closed_by: closedBy,
    closed_at: new Date().toISOString(),
    final_counted_amount: finalCountedAmount,
    system_calculated_amount: summary.expectedCashInDrawer,
    difference,
    status: 'CLOSED',
    notes: notes || null,
    denominations: denominations || null,
  };
}

const closedReg = closeCashRegister(reg1, summary, 197000, 'Jhan Carlos', 'Cuadre perfecto', denomsCount);
assert.strictEqual(closedReg.status, 'CLOSED');
assert.strictEqual(closedReg.difference, 0);
assert.ok(closedReg.closed_at);
console.log('14. Cierre formal de caja y consolidación de sesión en histórico:', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 15 PASARON EXITOSAMENTE (14/14 PASS) ---');
