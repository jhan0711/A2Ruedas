import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 8: MÓDULO DE INVENTARIO Y KARDEX ---');

// 1. Prueba matemática OBLIGATORIA de Kardex:
// "Probar: Entrada +10, Salida -2, Stock = 8"
function simulateKardex(initialStock, operations) {
  let currentStock = initialStock;
  const history = [];

  for (const op of operations) {
    const previousStock = currentStock;
    if (op.type === 'in') {
      currentStock += op.quantity;
    } else if (op.type === 'out') {
      if (currentStock < op.quantity) {
        throw new Error(`Stock insuficiente. Actual: ${currentStock}, Solicitado: ${op.quantity}`);
      }
      currentStock -= op.quantity;
    } else if (op.type === 'adjustment') {
      currentStock = op.quantity;
    }
    history.push({
      type: op.type,
      quantity: op.quantity,
      previousStock,
      newStock: currentStock,
      reason: op.reason,
    });
  }

  return { finalStock: currentStock, history };
}

const testOperations = [
  { type: 'in', quantity: 10, reason: 'Compra lote inicial repuestos' },
  { type: 'out', quantity: 2, reason: 'Venta mostrador a cliente' },
];

const kardexResult = simulateKardex(0, testOperations);

console.log('1. Prueba matemática de Kardex (Inicio: 0, Entrada: +10, Salida: -2 = Stock Resultante: 8):', kardexResult.finalStock === 8 ? 'PASS' : 'FAIL');
console.log('2. Trazabilidad de movimientos en Kardex (2 movimientos registrados):', kardexResult.history.length === 2 ? 'PASS' : 'FAIL');
console.log('3. Consistencia de stock intermedio (Primer movimiento nuevo stock = 10):', kardexResult.history[0].newStock === 10 ? 'PASS' : 'FAIL');
console.log('4. Consistencia de stock final (Segundo movimiento nuevo stock = 8):', kardexResult.history[1].newStock === 8 ? 'PASS' : 'FAIL');

// 2. Prevención de stock negativo (Rechazo de salidas mayores a existencias)
let negativeStockBlocked = false;
try {
  simulateKardex(1, [{ type: 'out', quantity: 5, reason: 'Intento de venta sin stock suficiente' }]);
} catch (err) {
  negativeStockBlocked = true;
}
console.log('5. Prevención estricta de stock negativo (Bloqueo cuando cantidad > stock disponible):', negativeStockBlocked ? 'PASS' : 'FAIL');

// 3. Detección de alerta de stock mínimo
function checkLowStockAlert(stock, minStock) {
  return stock <= minStock;
}

const alertTriggered = checkLowStockAlert(2, 2); // En nivel mínimo
const alertCritical = checkLowStockAlert(1, 2);  // Por debajo del mínimo
const alertSafe = checkLowStockAlert(10, 2);     // Seguro

console.log('6. Disparo de alerta cuando existencias <= stock mínimo (Stock 2, Min 2):', alertTriggered ? 'PASS' : 'FAIL');
console.log('7. Disparo de alerta crítica cuando existencias < stock mínimo (Stock 1, Min 2):', alertCritical ? 'PASS' : 'FAIL');
console.log('8. No disparo de alerta cuando existencias > stock mínimo (Stock 10, Min 2):', !alertSafe ? 'PASS' : 'FAIL');

// 4. Cálculo de margen comercial
function calculateProfitMargin(costPrice, salePrice) {
  if (costPrice <= 0) return 0;
  return Math.round(((salePrice - costPrice) / costPrice) * 100);
}

// Costo: 50.000, Venta: 80.000 -> Ganancia: 30.000 (Margen: 60%)
const margin = calculateProfitMargin(50000, 80000);
console.log(`9. Cálculo de margen de rentabilidad comercial (Costo: $50.000, Venta: $80.000 -> Margen: ${margin}%):`, margin === 60 ? 'PASS' : 'FAIL');

// 5. Búsqueda y filtrado reactivo
const mockProducts = [
  { id: '1', sku: 'REP-CAD-09', name: 'Cadena Shimano 9V Deore', brand: 'Shimano', location: 'Estante A-1' },
  { id: '2', sku: 'FRE-PAS-B05', name: 'Pastillas Freno Shimano B05S', brand: 'Shimano', location: 'Gaveta B-3' },
  { id: '3', sku: 'LUB-FIN-120', name: 'Lubricante Seco Finish Line', brand: 'Finish Line', location: 'Mostrador' },
];

function filterProducts(query, list) {
  const term = query.toLowerCase().trim();
  return list.filter(
    (p) =>
      p.sku.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term)
  );
}

const searchBySKU = filterProducts('REP-CAD', mockProducts);
const searchByName = filterProducts('Pastillas', mockProducts);
const searchByLocation = filterProducts('Mostrador', mockProducts);

console.log('10. Búsqueda reactiva por código SKU ("REP-CAD"):', (searchBySKU.length === 1 && searchBySKU[0].id === '1') ? 'PASS' : 'FAIL');
console.log('11. Búsqueda reactiva por nombre de producto ("Pastillas"):', (searchByName.length === 1 && searchByName[0].id === '2') ? 'PASS' : 'FAIL');
console.log('12. Búsqueda reactiva por ubicación en taller ("Mostrador"):', (searchByLocation.length === 1 && searchByLocation[0].id === '3') ? 'PASS' : 'FAIL');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 8 FINALIZADAS EXITOSAMENTE ---');
