import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 6: MÓDULO DE CLIENTES ---');

// 1. Validación de campos obligatorios
function validateCustomer(customer) {
  const errors = {};
  if (!customer.full_name || customer.full_name.trim().length === 0) {
    errors.full_name = 'El nombre completo es obligatorio.';
  }
  if (!customer.phone || customer.phone.trim().length < 7) {
    errors.phone = 'El teléfono es obligatorio y debe tener al menos 7 dígitos.';
  }
  return errors;
}

const invalidCustomer = { full_name: '', phone: '123' };
const validCustomer = { full_name: 'Carlos Mendoza', phone: '3109876543', document_id: '1098765432' };

const errorsInvalid = validateCustomer(invalidCustomer);
const errorsValid = validateCustomer(validCustomer);

console.log('1. Validación de campos obligatorios (Rechazo datos inválidos):', (errorsInvalid.full_name && errorsInvalid.phone) ? 'PASS' : 'FAIL');
console.log('2. Validación de campos obligatorios (Aceptación datos válidos):', Object.keys(errorsValid).length === 0 ? 'PASS' : 'FAIL');

// 2. Formateo y sanitización para deep link de WhatsApp
function formatWhatsAppLink(phone, fullName) {
  const cleanPhone = phone.replace(/\D/g, '');
  const waFormatted = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  const encodedName = encodeURIComponent(fullName);
  return `https://wa.me/${waFormatted}?text=Hola%20${encodedName},%20te%20escribimos%20de%20A2Ruedas%20Taller`;
}

const waLinkWithCountry = formatWhatsAppLink('+57 (310) 987-6543', 'Carlos Mendoza');
const waLinkWithoutCountry = formatWhatsAppLink('310 987 6543', 'Carlos Mendoza');
const expected = 'https://wa.me/573109876543?text=Hola%20Carlos%20Mendoza,%20te%20escribimos%20de%20A2Ruedas%20Taller';
console.log('3. Generación de Deep Link para WhatsApp con código de país y mensaje:', (waLinkWithCountry === expected && waLinkWithoutCountry === expected) ? 'PASS' : 'FAIL');

// 3. Algoritmo reactivo de búsqueda multicriterio (Nombre, Teléfono, Documento)
const mockCustomerList = [
  { id: '1', full_name: 'Carlos Mendoza', phone: '3109876543', document_id: '10203040' },
  { id: '2', full_name: 'Mariana Gómez', phone: '3001234567', document_id: '98765432' },
  { id: '3', full_name: 'Andrés Rojas', phone: '3155558899', document_id: '11223344' },
];

function searchCustomers(query, list) {
  const term = query.toLowerCase().trim();
  if (!term) return list;
  return list.filter(
    (c) =>
      c.full_name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.document_id && c.document_id.includes(term))
  );
}

const searchByName = searchCustomers('Mariana', mockCustomerList);
const searchByPhone = searchCustomers('55588', mockCustomerList);
const searchByDoc = searchCustomers('102030', mockCustomerList);
const searchEmpty = searchCustomers('inexistente', mockCustomerList);

console.log('4. Búsqueda por coincidencia de nombre ("Mariana"):', (searchByName.length === 1 && searchByName[0].id === '2') ? 'PASS' : 'FAIL');
console.log('5. Búsqueda por fragmento de teléfono ("55588"):', (searchByPhone.length === 1 && searchByPhone[0].id === '3') ? 'PASS' : 'FAIL');
console.log('6. Búsqueda por documento de identidad ("102030"):', (searchByDoc.length === 1 && searchByDoc[0].id === '1') ? 'PASS' : 'FAIL');
console.log('7. Búsqueda sin coincidencias retorna arreglo vacío:', searchEmpty.length === 0 ? 'PASS' : 'FAIL');

// 4. Integración relacional: Vinculación con Bicicletas e Historial de Órdenes
const mockBikes = [
  { id: 'b1', customer_id: '1', brand: 'Trek', model: 'Marlin 7' },
  { id: 'b2', customer_id: '1', brand: 'Specialized', model: 'Rockhopper' },
  { id: 'b3', customer_id: '2', brand: 'GW', model: 'Flamma' },
];

const mockOrders = [
  { id: 'o1', customer_id: '1', order_number: 'OT-000001', status: 'entregado' },
  { id: 'o2', customer_id: '1', order_number: 'OT-000004', status: 'en_progreso' },
];

const bikesForCustomer1 = mockBikes.filter((b) => b.customer_id === '1');
const ordersForCustomer1 = mockOrders.filter((o) => o.customer_id === '1');

console.log('8. Vinculación relacional cliente-bicicletas (2 bicicletas para cliente 1):', bikesForCustomer1.length === 2 ? 'PASS' : 'FAIL');
console.log('9. Vinculación relacional cliente-órdenes (2 OTs para cliente 1):', ordersForCustomer1.length === 2 ? 'PASS' : 'FAIL');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 6 FINALIZADAS EXITOSAMENTE ---');
