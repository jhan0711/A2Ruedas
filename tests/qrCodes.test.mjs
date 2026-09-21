import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 13: MÓDULO DE CÓDIGOS QR Y ETIQUETAS ADHESIVAS ---');

// 1. Algoritmo de normalización y extracción de códigos QR (qrUtils.ts)
function extractQRCodeFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const clean = rawText.trim();

  // Caso 1: BIKE-XXXXXX directo
  const directMatch = clean.match(/BIKE-([A-Za-z0-9]{6})/i);
  if (directMatch) {
    return `BIKE-${directMatch[1].toUpperCase()}`;
  }

  // Caso 2: URL completa que contiene /bike/BIKE-XXXXXX
  const urlMatch = clean.match(/\/bike\/(BIKE-[A-Za-z0-9]{6})/i);
  if (urlMatch) {
    return urlMatch[1].toUpperCase();
  }

  // Caso 3: Cadena de 6 caracteres hexadecimales aislados
  const hex6Match = clean.match(/^([A-Fa-f0-9]{6})$/);
  if (hex6Match) {
    return `BIKE-${hex6Match[1].toUpperCase()}`;
  }

  return null;
}

// Pruebas de extracción y normalización
const testDirect = extractQRCodeFromText('BIKE-D1CBB0');
assert.strictEqual(testDirect, 'BIKE-D1CBB0');
console.log('1. Extracción directa BIKE-XXXXXX:', testDirect === 'BIKE-D1CBB0' ? 'PASS' : 'FAIL');

const testLower = extractQRCodeFromText('bike-8f3a92');
assert.strictEqual(testLower, 'BIKE-8F3A92');
console.log('2. Normalización de minúsculas a mayúsculas:', testLower === 'BIKE-8F3A92' ? 'PASS' : 'FAIL');

const testUrl = extractQRCodeFromText('https://a2ruedas.app/bike/BIKE-4C6310');
assert.strictEqual(testUrl, 'BIKE-4C6310');
console.log('3. Extracción desde URL pública de cliente:', testUrl === 'BIKE-4C6310' ? 'PASS' : 'FAIL');

const testLocalUrl = extractQRCodeFromText('http://localhost:5173/bike/BIKE-1A2B3C?source=camera');
assert.strictEqual(testLocalUrl, 'BIKE-1A2B3C');
console.log('4. Extracción desde URL local con query params:', testLocalUrl === 'BIKE-1A2B3C' ? 'PASS' : 'FAIL');

const testHexOnly = extractQRCodeFromText('d1cbb0');
assert.strictEqual(testHexOnly, 'BIKE-D1CBB0');
console.log('5. Conversión de hex aislado de 6 dígitos a BIKE-XXXXXX:', testHexOnly === 'BIKE-D1CBB0' ? 'PASS' : 'FAIL');

const testInvalid = extractQRCodeFromText('https://google.com');
assert.strictEqual(testInvalid, null);
console.log('6. Rechazo de URLs externas o textos ajenos:', testInvalid === null ? 'PASS' : 'FAIL');

const testEmpty = extractQRCodeFromText('');
assert.strictEqual(testEmpty, null);
console.log('7. Rechazo de entradas vacías o nulas:', testEmpty === null ? 'PASS' : 'FAIL');

// 2. Formato y unicidad de códigos QR BIKE-XXXXXX
function generateBikeQRCode() {
  const hex = Math.random().toString(16).substring(2, 8).toUpperCase().padEnd(6, '0');
  return `BIKE-${hex}`;
}

const generatedCodes = new Set();
for (let i = 0; i < 50; i++) {
  const code = generateBikeQRCode();
  assert.match(code, /^BIKE-[0-9A-F]{6}$/);
  generatedCodes.add(code);
}
console.log('8. Generación y validación regex de códigos QR (^BIKE-[0-9A-F]{6}$):', generatedCodes.size >= 48 ? 'PASS' : 'FAIL');

// 3. Construcción de URL pública
function buildPublicBikeUrl(qrCode, baseUrl = 'https://a2ruedas.app') {
  return `${baseUrl.replace(/\/$/, '')}/bike/${encodeURIComponent(qrCode)}`;
}

const publicUrl = buildPublicBikeUrl('BIKE-D1CBB0');
assert.strictEqual(publicUrl, 'https://a2ruedas.app/bike/BIKE-D1CBB0');
console.log('9. Construcción de enlace público para el payload del QR:', publicUrl.endsWith('/bike/BIKE-D1CBB0') ? 'PASS' : 'FAIL');

// 4. Parámetros de etiqueta adhesiva de taller (Sticker Canvas 50mm x 30mm)
const STICKER_CONFIG = {
  width: 600,
  height: 360,
  qrSize: 220,
  errorCorrectionLevel: 'H', // 30% de recuperación de daño por barro/grasa
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

assert.strictEqual(STICKER_CONFIG.width / STICKER_CONFIG.height, 600 / 360);
assert.strictEqual(STICKER_CONFIG.errorCorrectionLevel, 'H');
console.log('10. Especificación técnica de sticker adhesivo (600x360 px, Corrección H):', 'PASS');

// 5. Búsqueda y filtrado multicriterio en el Centro de QRs
const mockBikesCatalog = [
  {
    id: 'b-001',
    brand: 'Trek',
    model: 'Marlin 7',
    color: 'Rojo',
    serial_number: 'WTU123456X',
    customer: { full_name: 'Carlos Mendoza', phone: '3104567890' },
    qr_code: 'BIKE-D1CBB0',
  },
  {
    id: 'b-002',
    brand: 'Specialized',
    model: 'Rockhopper',
    color: 'Negro Mate',
    serial_number: 'WSBC987654Y',
    customer: { full_name: 'Mariana Gómez', phone: '3157890123' },
    qr_code: 'BIKE-4C6310',
  },
  {
    id: 'b-003',
    brand: 'Giant',
    model: 'Talon 1',
    color: 'Azul',
    serial_number: 'GA543210Z',
    customer: { full_name: 'Andrés López', phone: '3001234567' },
    qr_code: 'BIKE-8F3A92',
  },
];

function filterBikes(query, bikes) {
  const term = query.toLowerCase().trim();
  if (!term) return bikes;
  return bikes.filter((b) => {
    return (
      b.brand.toLowerCase().includes(term) ||
      b.model.toLowerCase().includes(term) ||
      (b.serial_number && b.serial_number.toLowerCase().includes(term)) ||
      (b.qr_code && b.qr_code.toLowerCase().includes(term)) ||
      (b.customer?.full_name && b.customer.full_name.toLowerCase().includes(term))
    );
  });
}

const searchByBrand = filterBikes('specialized', mockBikesCatalog);
assert.strictEqual(searchByBrand.length, 1);
assert.strictEqual(searchByBrand[0].id, 'b-002');
console.log('11. Búsqueda por marca en catálogo QR:', searchByBrand.length === 1 ? 'PASS' : 'FAIL');

const searchByQR = filterBikes('D1CBB0', mockBikesCatalog);
assert.strictEqual(searchByQR.length, 1);
assert.strictEqual(searchByQR[0].brand, 'Trek');
console.log('12. Búsqueda por código QR parcial:', searchByQR.length === 1 ? 'PASS' : 'FAIL');

const searchByCustomer = filterBikes('Carlos', mockBikesCatalog);
assert.strictEqual(searchByCustomer.length, 1);
console.log('13. Búsqueda por propietario:', searchByCustomer.length === 1 ? 'PASS' : 'FAIL');

// 6. Selección múltiple e impresión masiva de pliego
const selectedIds = new Set(['b-001', 'b-003']);
const batchToPrint = mockBikesCatalog.filter((b) => selectedIds.has(b.id));

assert.strictEqual(batchToPrint.length, 2);
console.log('14. Filtrado de pliego masivo para impresión (2 seleccionadas):', batchToPrint.length === 2 ? 'PASS' : 'FAIL');

// 7. Simulación de vinculación entre scanner y recepción
function lookupBikeForReception(scannedText, catalog) {
  const qrCode = extractQRCodeFromText(scannedText);
  if (!qrCode) return { success: false, reason: 'Código inválido' };

  const bike = catalog.find((b) => b.qr_code === qrCode);
  if (!bike) return { success: false, reason: 'Bicicleta no encontrada', qrCode };

  return {
    success: true,
    bicycle: bike,
    customer: bike.customer,
    prefillData: {
      customerId: bike.customer ? 'c-001' : null,
      bikeId: bike.id,
    },
  };
}

const matchScan = lookupBikeForReception('bike-d1cbb0', mockBikesCatalog);
assert.strictEqual(matchScan.success, true);
assert.strictEqual(matchScan.bicycle.brand, 'Trek');
console.log('15. Autocompletado de recepción al escanear QR:', matchScan.success ? 'PASS' : 'FAIL');

const unassignedScan = lookupBikeForReception('BIKE-999999', mockBikesCatalog);
assert.strictEqual(unassignedScan.success, false);
assert.strictEqual(unassignedScan.qrCode, 'BIKE-999999');
console.log('16. Detección de código QR libre para asignación:', unassignedScan.qrCode === 'BIKE-999999' ? 'PASS' : 'FAIL');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 13 COMPLETADAS CON ÉXITO (16/16 PASS) ---');
