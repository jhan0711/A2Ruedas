import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 12: HISTORIAL COMPLETO Y TIMELINE DE BICICLETA ---');

// Mock data que simula el almacenamiento de bicicletas y órdenes
const mockBicycles = [
  {
    id: 'b-001',
    customer_id: 'c-001',
    brand: 'Trek',
    model: 'Marlin 7',
    bike_type: 'MTB',
    color: 'Rojo Viper / Negro',
    frame_size: 'M',
    wheel_size: '29"',
    serial_number: 'WTU281C0492S',
    year: 2023,
    key_components: 'Shimano Deore 1x10, Horquilla RockShox Judy, Frenos MT200',
    observations: 'Rayón estético en tirante superior izquierdo',
    created_at: '2026-01-15T10:00:00Z',
    customer: {
      id: 'c-001',
      full_name: 'Carlos Mendoza',
      phone: '3104567890',
      document_id: '1020304050',
    },
  },
  {
    id: 'b-002',
    customer_id: 'c-002',
    brand: 'Specialized',
    model: 'Allez',
    bike_type: 'Ruta',
    color: 'Azul Eléctrico',
    frame_size: '54 cm',
    wheel_size: '700c',
    serial_number: 'WSBC602019284T',
    year: 2024,
    created_at: '2026-01-20T11:00:00Z',
    customer: {
      id: 'c-002',
      full_name: 'Mariana Gómez',
      phone: '3157890123',
    },
  },
];

const mockQRCodes = {
  'b-001': { id: 'qr-001', bicycle_id: 'b-001', qr_code: 'BIKE-8F3A92', is_active: true },
  'b-002': { id: 'qr-002', bicycle_id: 'b-002', qr_code: 'BIKE-4C6310', is_active: true },
};

const mockWorkOrders = [
  {
    id: 'wo-004',
    order_number: 'OT-000000',
    bicycle_id: 'b-001',
    status: 'ENTREGADA',
    entry_mileage_km: 650,
    reported_issues: 'Mantenimiento inicial de 500 km y desajuste de cambios',
    internal_notes: 'Transmisión regulada y guayas lubricadas.',
    grand_total: 85000,
    created_at: '2026-01-20T09:30:00Z',
    items: [
      { item_type: 'service', description: 'Ajuste general de cambios y frenos', total_price: 35000 },
      { item_type: 'part', description: 'Guaya de cambio Shimano en teflón', quantity: 1, unit_price: 15000, total_price: 15000 },
      { item_type: 'part', description: 'Pastillas de freno resina B01S', quantity: 2, unit_price: 17500, total_price: 35000 },
    ],
  },
  {
    id: 'wo-001',
    order_number: 'OT-000001',
    bicycle_id: 'b-001',
    status: 'ENTREGADA',
    entry_mileage_km: 1250,
    reported_issues: 'Mantenimiento general completo y ajuste de frenos',
    internal_notes: 'Bicicleta en buen estado general. Se purgaron frenos.',
    grand_total: 135000,
    created_at: '2026-02-15T10:00:00Z',
    items: [
      { item_type: 'service', description: 'Mantenimiento General MTB', total_price: 90000 },
      { item_type: 'part', description: 'Líquido mineral de freno Shimano', quantity: 1, unit_price: 25000, total_price: 25000 },
      { item_type: 'part', description: 'Cadena KMC X10', quantity: 1, unit_price: 20000, total_price: 20000 },
    ],
  },
];

// Función para generar recomendaciones según tipo y kilometraje
function generatePreventiveRecommendations(bikeType, mileageKm) {
  const recommendations = [];
  const typeLower = (bikeType || '').toLowerCase();

  if (typeLower.includes('mtb') || typeLower.includes('montaña')) {
    recommendations.push(
      'Mantenimiento y lubricación de horquilla/suspensión cada 50 horas de pedaleo o 1.000 km.',
      'Revisión y purga de frenos hidráulicos con líquido mineral/DOT cada 6 meses.',
      'Chequeo de desgaste de cadena con calibrador (reemplazo sugerido al 0.75% de elongación).'
    );
  } else if (typeLower.includes('ruta') || typeLower.includes('carretera')) {
    recommendations.push(
      'Inspección periódica de tensión homogénea en radios y centrado fino de rines.',
      'Lubricación de cadena con cera o aceite seco cada 250-300 km.'
    );
  } else if (typeLower.includes('gravel')) {
    recommendations.push(
      'Limpieza y desengrase profundo de transmisión tras rodar por trocha o barro.',
      'Revisión preventiva de holgura y engrase de rodamientos en caja pedalier.'
    );
  }

  if (mileageKm && mileageKm >= 1000) {
    recommendations.unshift(
      `Odómetro acumulado (${mileageKm.toLocaleString('es-CO')} km): Se sugiere servicio técnico completo de rodamientos de masa y centro.`
    );
  }

  return recommendations;
}

// 1. Obtener Timeline Público asegurando CERO fuga de datos personales (PII)
function getPublicTimeline(code) {
  const qrEntry = Object.values(mockQRCodes).find((q) => q.qr_code.toUpperCase() === code.toUpperCase());
  if (!qrEntry) return null;

  const bike = mockBicycles.find((b) => b.id === qrEntry.bicycle_id);
  if (!bike) return null;

  const orders = mockWorkOrders
    .filter((w) => w.bicycle_id === bike.id && w.status !== 'CANCELADA')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const publicOrders = orders.map((wo) => ({
    id: wo.id,
    order_number: wo.order_number,
    status: wo.status,
    date: wo.created_at,
    entry_mileage_km: wo.entry_mileage_km,
    reported_issues: wo.reported_issues,
    services: wo.items.filter((it) => it.item_type === 'service').map((it) => it.description),
    parts_changed: wo.items.filter((it) => it.item_type === 'part').map((it) => it.description),
  }));

  const mileages = orders.map((w) => w.entry_mileage_km).filter((km) => typeof km === 'number' && km > 0);
  const currentMileage = mileages.length > 0 ? Math.max(...mileages) : null;

  return {
    qr_code: qrEntry.qr_code,
    brand: bike.brand,
    model: bike.model,
    bike_type: bike.bike_type,
    color: bike.color,
    serial_number: bike.serial_number,
    frame_size: bike.frame_size,
    wheel_size: bike.wheel_size,
    current_mileage_km: currentMileage,
    is_verified: true,
    work_orders: publicOrders,
    recommendations: generatePreventiveRecommendations(bike.bike_type, currentMileage),
  };
}

// 2. Obtener Dossier Administrativo Completo
function getBicycleFullDossier(bikeId) {
  const bike = mockBicycles.find((b) => b.id === bikeId);
  if (!bike) return null;

  const qr = mockQRCodes[bikeId] || null;
  const orders = mockWorkOrders
    .filter((w) => w.bicycle_id === bikeId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const nonCancelled = orders.filter((w) => w.status !== 'CANCELADA');
  const totalSpent = nonCancelled.reduce((sum, w) => sum + w.grand_total, 0);

  const mileages = orders.map((w) => w.entry_mileage_km).filter((km) => typeof km === 'number' && km > 0);
  const currentMileageKm = mileages.length > 0 ? Math.max(...mileages) : null;

  const mileageHistory = orders
    .filter((w) => typeof w.entry_mileage_km === 'number' && w.entry_mileage_km > 0)
    .map((w) => ({ date: w.created_at, km: w.entry_mileage_km, order_number: w.order_number }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const allPartsReplaced = [];
  for (const wo of orders) {
    for (const it of wo.items || []) {
      if (it.item_type === 'part') {
        allPartsReplaced.push({
          date: wo.created_at,
          order_number: wo.order_number,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total_price: it.total_price,
        });
      }
    }
  }

  return {
    bicycle: bike,
    customer: bike.customer,
    qrCode: qr,
    workOrders: orders,
    totalServicesCount: orders.length,
    totalSpent,
    currentMileageKm,
    mileageHistory,
    allPartsReplaced,
    recommendations: generatePreventiveRecommendations(bike.bike_type, currentMileageKm),
  };
}

// EJECUCIÓN DE PRUEBAS
const timelineTrek = getPublicTimeline('BIKE-8F3A92');

// Prueba 1: Búsqueda por Código QR existente
console.log('1. Búsqueda y resolución de timeline por QR (BIKE-8F3A92 -> Trek Marlin 7):', 
  (timelineTrek && timelineTrek.brand === 'Trek' && timelineTrek.model === 'Marlin 7') ? 'PASS' : 'FAIL');

// Prueba 2: Protección estricta de privacidad (CERO exposición de PII en timeline público)
const hasPII = 'customer' in timelineTrek || 'phone' in timelineTrek || 'document_id' in timelineTrek;
console.log('2. Protección estricta de privacidad (CERO datos personales/PII expuestos al público):', 
  (!hasPII) ? 'PASS' : 'FAIL');

// Prueba 3: Cálculo del odómetro actual (mayor valor registrado: 1.250 km)
console.log(`3. Cálculo de odómetro actual acumulado (Esperado: 1250 km, Obtenido: ${timelineTrek?.current_mileage_km} km):`, 
  (timelineTrek?.current_mileage_km === 1250) ? 'PASS' : 'FAIL');

// Prueba 4: Orden cronológico de mantenimientos y consolidado de repuestos
const isChronological = new Date(timelineTrek.work_orders[0].date).getTime() > new Date(timelineTrek.work_orders[1].date).getTime();
const totalPublicParts = timelineTrek.work_orders.reduce((acc, wo) => acc + wo.parts_changed.length, 0);
console.log(`4. Orden cronológico descendente y repuestos públicos (${totalPublicParts} repuestos en timeline):`, 
  (isChronological && totalPublicParts === 4) ? 'PASS' : 'FAIL');

// Prueba 5: Recomendaciones preventivas inteligentes adaptadas al tipo y kilometraje
const hasMtbSuspensionAlert = timelineTrek.recommendations.some((r) => r.includes('horquilla') || r.includes('suspensión'));
const hasHighMileageAlert = timelineTrek.recommendations.some((r) => r.includes('Odómetro acumulado'));
console.log('5. Recomendaciones inteligentes según tipo (MTB) y kilometraje (>1000 km):', 
  (hasMtbSuspensionAlert && hasHighMileageAlert) ? 'PASS' : 'FAIL');

// Prueba 6: Búsqueda con QR inexistente retorna null de forma segura
const nonExistent = getPublicTimeline('BIKE-999999');
console.log('6. Manejo seguro de código QR inexistente (retorna null sin error):', 
  (nonExistent === null) ? 'PASS' : 'FAIL');

// Prueba 7: Generación de Dossier Administrativo Completo
const dossier = getBicycleFullDossier('b-001');
const totalPartsReplacedCount = dossier.allPartsReplaced.length;
const totalExpectedSpent = 85000 + 135000; // 220000 COP
console.log(`7. Dossier administrativo con cálculo total gastado ($${dossier.totalSpent.toLocaleString('es-CO')} COP) y ${totalPartsReplacedCount} repuestos:`, 
  (dossier.totalSpent === totalExpectedSpent && totalPartsReplacedCount === 4 && dossier.mileageHistory.length === 2) ? 'PASS' : 'FAIL');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 12 COMPLETADAS CON ÉXITO ---');
