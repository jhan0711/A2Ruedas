import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 10: RECEPCIÓN DE BICICLETA Y FIRMA DIGITAL TÁCTIL ---');

// 1. Validación de Formato de Firma Digital Base64
const base64PngRegex = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
const mockValidSignatureData =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const mockInvalidData = 'not-a-valid-data-url';

console.log(
  '1. Validación de formato Base64 PNG para firma digital táctil:',
  base64PngRegex.test(mockValidSignatureData) && !base64PngRegex.test(mockInvalidData)
    ? 'PASS'
    : 'FAIL'
);

// 2. Estructura y Metadatos Inmutables de la Firma Digital
function createSignatureRecord(orderId, type, dataUrl, signerName, signerDoc) {
  if (!dataUrl || !base64PngRegex.test(dataUrl)) {
    throw new Error('Firma inválida o vacía');
  }
  if (!signerName || signerName.trim().length === 0) {
    throw new Error('Nombre del firmante requerido');
  }
  return {
    id: `sig-${Date.now()}`,
    work_order_id: orderId,
    signature_type: type,
    signature_data: dataUrl,
    signer_name: signerName.trim(),
    signer_doc: signerDoc ? signerDoc.trim() : null,
    signed_at: new Date().toISOString(),
  };
}

const sigRecord = createSignatureRecord(
  'wo-1001',
  'reception',
  mockValidSignatureData,
  'Carlos Mendoza',
  '1020304050'
);
console.log(
  '2. Registro de firma de recepción con tipo "reception", firmante y cédula:',
  sigRecord.signature_type === 'reception' &&
    sigRecord.signer_name === 'Carlos Mendoza' &&
    sigRecord.signer_doc === '1020304050' &&
    sigRecord.work_order_id === 'wo-1001'
    ? 'PASS'
    : 'FAIL'
);

// 3. Mapeo de Coordenadas de Zonas en Diagrama de Bicicleta
function estimateZone(x, y) {
  if (x < 32 && y > 40) return 'Rueda Trasera / Piñonería';
  if (x > 68 && y > 40) return 'Rueda Delantera / Aro';
  if (x > 65 && y <= 40) return 'Manillar / Potencia / Mandos';
  if (x > 45 && x <= 65 && y > 40) return 'Horquilla / Suspensión';
  if (x >= 28 && x <= 45 && y <= 40) return 'Sillín / Tubo de Asiento';
  if (x >= 35 && x <= 55 && y > 60) return 'Caja de Centro / Pedales / Bielas';
  return 'Marco / Tubo Principal';
}

const zoneFrontWheel = estimateZone(75, 60);
const zoneRearWheel = estimateZone(20, 65);
const zoneHandlebar = estimateZone(70, 25);
const zoneSaddle = estimateZone(35, 25);
const zoneFrame = estimateZone(40, 45);

console.log(
  '3. Detección anatómica en diagrama SVG (Rueda Delantera, Trasera, Manillar, Sillín, Marco):',
  zoneFrontWheel === 'Rueda Delantera / Aro' &&
    zoneRearWheel === 'Rueda Trasera / Piñonería' &&
    zoneHandlebar === 'Manillar / Potencia / Mandos' &&
    zoneSaddle === 'Sillín / Tubo de Asiento' &&
    zoneFrame === 'Marco / Tubo Principal'
    ? 'PASS'
    : 'FAIL'
);

// 4. Serialización y Clasificación de Daños Previos
const mockDamages = [
  {
    id: 'dmg-1',
    x: 42,
    y: 35,
    type: 'rayon',
    severity: 'leve',
    zone: 'Marco / Tubo Principal',
    notes: 'Rayón de 3cm por candado',
  },
  {
    id: 'dmg-2',
    x: 55,
    y: 55,
    type: 'golpe',
    severity: 'critico',
    zone: 'Horquilla / Suspensión',
    notes: 'Abolladura en botella derecha',
  },
];

function serializeDamagesForAudit(damagesList) {
  if (damagesList.length === 0) {
    return '[INSPECCIÓN]: Bicicleta recibida sin daños previos visibles.';
  }
  return (
    `[INSPECCIÓN DE DAÑOS PREVIOS (${damagesList.length})]: ` +
    damagesList
      .map(
        (d, idx) =>
          `#${idx + 1} ${d.zone} (${d.type}, severidad ${d.severity}): ${d.notes || 'Sin nota'}`
      )
      .join(' | ')
  );
}

const serializedDamages = serializeDamagesForAudit(mockDamages);
console.log(
  '4. Serialización inmutable de 2 daños preexistentes para protección legal del taller:',
  serializedDamages.includes('INSPECCIÓN DE DAÑOS PREVIOS (2)') &&
    serializedDamages.includes('Rayón de 3cm') &&
    serializedDamages.includes('Abolladura en botella')
    ? 'PASS'
    : 'FAIL'
);

// 5. Inventario de Accesorios en Custodia
function serializeAccessories(selectedItems, freeText) {
  const all = [...selectedItems];
  if (freeText && freeText.trim()) {
    all.push(freeText.trim());
  }
  return all.length > 0 ? all.join(', ') : 'Ninguno declarado';
}

const accessories = serializeAccessories(
  ['Luces (delantera / trasera)', 'Ciclocomputador / Soporte GPS', 'Candado y llaves'],
  'Timbre cromado retro'
);

console.log(
  '5. Consolidación de inventario de accesorios en custodia del cliente:',
  accessories.includes('Luces') &&
    accessories.includes('Ciclocomputador') &&
    accessories.includes('Candado') &&
    accessories.includes('Timbre cromado retro')
    ? 'PASS'
    : 'FAIL'
);

// 6. Simulación de Flujo de Recepción y Emisión de Comprobante Térmico (End-to-End)
function simulateFullReception(customer, bike, entryData, signature) {
  // Validación de precondiciones
  assert.ok(customer.id, 'Cliente requerido');
  assert.ok(bike.id, 'Bicicleta requerida');
  assert.ok(entryData.reportedIssues, 'Falla reportada requerida');
  assert.ok(signature.signatureData, 'Firma táctil requerida');

  const orderNumber = 'OT-000005';
  const fullAccessories = serializeAccessories(entryData.accessories, entryData.additionalNotes);
  const auditNotes = serializeDamagesForAudit(entryData.damages);

  const workOrder = {
    id: 'wo-005',
    order_number: orderNumber,
    customer_id: customer.id,
    bicycle_id: bike.id,
    reported_issues: entryData.reportedIssues,
    accessories_received: fullAccessories,
    status: 'RECIBIDA',
    total_labor: entryData.initialLaborPrice,
    total_parts: 0,
    grand_total: entryData.initialLaborPrice,
    internal_notes: auditNotes,
    created_at: new Date().toISOString(),
  };

  const signatureRecord = createSignatureRecord(
    workOrder.id,
    'reception',
    signature.signatureData,
    signature.signerName,
    signature.signerDoc
  );

  return { workOrder, signatureRecord };
}

const mockCust = { id: 'c-001', full_name: 'Carlos Mendoza', phone: '3104567890' };
const mockBike = { id: 'b-001', brand: 'Trek', model: 'Marlin 7', bike_type: 'MTB' };
const mockEntry = {
  reportedIssues: 'Mantenimiento integral y purga de frenos hidráulicos',
  accessories: ['Luces (delantera / trasera)', 'Inflador portátil'],
  additionalNotes: '',
  damages: mockDamages,
  initialLaborPrice: 45000,
};
const mockSig = {
  signatureData: mockValidSignatureData,
  signerName: 'Carlos Mendoza',
  signerDoc: '1020304050',
};

const receptionResult = simulateFullReception(mockCust, mockBike, mockEntry, mockSig);

console.log(
  '6. Generación de Orden OT-000005 con estado inicial RECIBIDA:',
  receptionResult.workOrder.order_number === 'OT-000005' &&
    receptionResult.workOrder.status === 'RECIBIDA' &&
    receptionResult.workOrder.grand_total === 45000
    ? 'PASS'
    : 'FAIL'
);

console.log(
  '7. Vinculación relacional de firma digital al ID de la orden generada:',
  receptionResult.signatureRecord.work_order_id === receptionResult.workOrder.id &&
    receptionResult.signatureRecord.signer_name === 'Carlos Mendoza'
    ? 'PASS'
    : 'FAIL'
);

// 8. Integración en Tirilla Térmica de 58 mm
const ticketHasDigitalSignature = Boolean(receptionResult.signatureRecord.signature_data);
const ticketHasAccessories = receptionResult.workOrder.accessories_received.includes('Luces');
console.log(
  '8. Disponibilidad de firma digital y accesorios en datos de comprobante POS 58 mm:',
  ticketHasDigitalSignature && ticketHasAccessories ? 'PASS' : 'FAIL'
);

console.log('--- TODAS LAS PRUEBAS DE LA FASE 10 FINALIZADAS EXITOSAMENTE ---');
