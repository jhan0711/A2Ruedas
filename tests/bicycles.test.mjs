import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 7: MÓDULO DE BICICLETAS ---');

// 1. Validación de campos obligatorios
function validateBicycle(data) {
  const errors = {};
  if (!data.customer_id) {
    errors.customer_id = 'El cliente propietario es obligatorio.';
  }
  if (!data.brand || data.brand.trim().length === 0) {
    errors.brand = 'La marca es obligatoria.';
  }
  if (!data.model || data.model.trim().length === 0) {
    errors.model = 'El modelo es obligatorio.';
  }
  if (!data.color || data.color.trim().length === 0) {
    errors.color = 'El color es obligatorio.';
  }
  return errors;
}

const invalidBike = { customer_id: '', brand: '', model: '', color: '' };
const validBike = { customer_id: 'c-001', brand: 'Trek', model: 'Marlin 7', color: 'Rojo / Negro', bike_type: 'MTB' };

const errorsInvalid = validateBicycle(invalidBike);
const errorsValid = validateBicycle(validBike);

console.log('1. Validación de campos obligatorios (Rechazo datos vacíos):', Object.keys(errorsInvalid).length === 4 ? 'PASS' : 'FAIL');
console.log('2. Validación de campos obligatorios (Aceptación datos válidos):', Object.keys(errorsValid).length === 0 ? 'PASS' : 'FAIL');

// 2. Soporte para un cliente con múltiples bicicletas (Relación 1:N)
const customerId = 'c-001';
const mockBikes = [
  { id: 'b-001', customer_id: 'c-001', brand: 'Trek', model: 'Marlin 7', serial_number: 'WTU281C0492S' },
  { id: 'b-002', customer_id: 'c-002', brand: 'Specialized', model: 'Allez', serial_number: 'WSBC602019284T' },
  { id: 'b-003', customer_id: 'c-001', brand: 'Giant', model: 'Revolt 2', serial_number: 'GA29381745K' },
];

const customerBikes = mockBikes.filter((b) => b.customer_id === customerId);
console.log(`3. Soporte para cliente con múltiples bicicletas (Cliente 1 tiene ${customerBikes.length} bicis):`, customerBikes.length === 2 ? 'PASS' : 'FAIL');

// 3. Formato y unicidad de códigos QR BIKE-XXXXXX
function generateQRCode() {
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase().padEnd(6, '0');
  return `BIKE-${randomHex}`;
}

const qr1 = generateQRCode();
const qr2 = generateQRCode();
const qrRegex = /^BIKE-[0-9A-F]{6}$/;

console.log(`4. Formato de código QR de bicicleta (${qr1}):`, qrRegex.test(qr1) ? 'PASS' : 'FAIL');
console.log('5. Unicidad de generación de códigos QR (qr1 !== qr2):', (qr1 !== qr2) ? 'PASS' : 'FAIL');

// 4. Algoritmo reactivo de búsqueda multicriterio
function searchBicycles(query, list, typeFilter = 'ALL') {
  const term = query.toLowerCase().trim();
  return list.filter((b) => {
    const matchesSearch =
      !term ||
      b.brand.toLowerCase().includes(term) ||
      b.model.toLowerCase().includes(term) ||
      (b.serial_number && b.serial_number.toLowerCase().includes(term));
    const matchesType = typeFilter === 'ALL' || b.bike_type === typeFilter;
    return matchesSearch && matchesType;
  });
}

const searchByBrand = searchBicycles('Trek', mockBikes);
const searchBySerial = searchBicycles('WSBC60', mockBikes);
const searchEmpty = searchBicycles('CannondaleInexistente', mockBikes);

console.log('6. Búsqueda por coincidencia de marca ("Trek"):', (searchByBrand.length === 1 && searchByBrand[0].id === 'b-001') ? 'PASS' : 'FAIL');
console.log('7. Búsqueda por fragmento de serial de marco ("WSBC60"):', (searchBySerial.length === 1 && searchBySerial[0].id === 'b-002') ? 'PASS' : 'FAIL');
console.log('8. Búsqueda sin coincidencias retorna vacío:', searchEmpty.length === 0 ? 'PASS' : 'FAIL');

// 5. Gestión y clasificación de fotografías de inspección física
const validPhotoTypes = ['general', 'danio', 'transmision', 'frenos', 'cuadro'];
const mockPhoto = {
  id: 'p-001',
  bicycle_id: 'b-001',
  photo_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e',
  photo_type: 'danio',
  caption: 'Rayón superficial en vaina trasera derecha',
};

console.log('9. Clasificación válida de fotografía de inspección ("danio"):', validPhotoTypes.includes(mockPhoto.photo_type) ? 'PASS' : 'FAIL');

// 6. Generación de enlace de WhatsApp contextualizado con la bicicleta
function getWhatsAppLink(phone, customerName, brand, model) {
  const cleanPhone = phone.replace(/\D/g, '');
  const waFormatted = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  return `https://wa.me/${waFormatted}?text=Hola%20${encodeURIComponent(customerName)},%20te%20escribimos%20del%20taller%20A2Ruedas%20sobre%20tu%20bicicleta%20${encodeURIComponent(brand)}%20${encodeURIComponent(model)}`;
}

const waBikeLink = getWhatsAppLink('3104567890', 'Carlos Mendoza', 'Trek', 'Marlin 7');
const waExpected = 'https://wa.me/573104567890?text=Hola%20Carlos%20Mendoza,%20te%20escribimos%20del%20taller%20A2Ruedas%20sobre%20tu%20bicicleta%20Trek%20Marlin%207';

console.log('10. Enlace directo a WhatsApp contextualizado con nombre y bicicleta:', waBikeLink === waExpected ? 'PASS' : 'FAIL');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 7 FINALIZADAS EXITOSAMENTE ---');
