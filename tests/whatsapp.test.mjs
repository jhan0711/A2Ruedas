import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 14: MÓDULO DE COMUNICACIÓN POR WHATSAPP ---');

// 1. Algoritmo de normalización de números telefónicos de Colombia
function formatPhoneNumberForWhatsApp(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('57')) {
    return digits;
  }
  if (digits.length === 10) {
    return `57${digits}`;
  }
  return digits;
}

// Pruebas de normalización telefónica
const phone1 = formatPhoneNumberForWhatsApp('3101234567');
assert.strictEqual(phone1, '573101234567');
console.log('1. Normalización de celular de 10 dígitos (310... -> 57310...):', phone1 === '573101234567' ? 'PASS' : 'FAIL');

const phone2 = formatPhoneNumberForWhatsApp('+57 (312) 987-6543');
assert.strictEqual(phone2, '573129876543');
console.log('2. Limpieza de símbolos, espacios y prefijo +57:', phone2 === '573129876543' ? 'PASS' : 'FAIL');

const phone3 = formatPhoneNumberForWhatsApp('573001112233');
assert.strictEqual(phone3, '573001112233');
console.log('3. Preservación de número que ya incluye indicativo 57:', phone3 === '573001112233' ? 'PASS' : 'FAIL');

const phone4 = formatPhoneNumberForWhatsApp('');
assert.strictEqual(phone4, '');
console.log('4. Manejo seguro de teléfono vacío o nulo:', phone4 === '' ? 'PASS' : 'FAIL');

// 2. Construcción de Deep Links Oficiales wa.me con URL Encoding
function buildWhatsAppDeepLink(phone, message) {
  const formattedPhone = formatPhoneNumberForWhatsApp(phone);
  if (!formattedPhone) return '';
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

const deepLink = buildWhatsAppDeepLink('3159998877', '¡Hola Carlos! Tu bicicleta está lista 🚲');
assert.ok(deepLink.startsWith('https://wa.me/573159998877?text='));
assert.ok(deepLink.includes('%C2%A1Hola%20Carlos'));
assert.ok(deepLink.includes('%F0%9F%9A%B2')); // Emoji de bicicleta codificado
console.log('5. Generación de Deep Link wa.me con codificación de tildes y emojis:', 'PASS');

// 3. Catálogo de Plantillas Oficiales de Taller
const WHATSAPP_TEMPLATES = [
  {
    id: 'ORDEN_RECIBIDA',
    title: 'Recepción Formal de Bicicleta',
    description: 'Notifica al cliente que su bicicleta ha ingresado al taller con su número de orden OT.',
    trigger: 'RECIBIDA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{FALLA}'],
    template:
      '¡Hola {CLIENTE}! 👋 Te confirmamos que tu bicicleta {BICICLETA} ha sido RECIBIDA exitosamente en A2Ruedas Taller con la Orden N° {ORDEN}.\n\nDiagnóstico técnico en curso. Puedes consultar el estado en cualquier momento. ¡Gracias por confiar en nosotros! 🚲',
  },
  {
    id: 'PRESUPUESTO_LISTO',
    title: 'Presupuesto Listo y Solicitud de Aprobación',
    description: 'Envía el desglose financiero estimado solicitando la autorización del cliente.',
    trigger: 'PRESUPUESTO',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{TOTAL}'],
    template:
      '¡Hola {CLIENTE}! 🔧 Tenemos listo el diagnóstico y presupuesto técnico para tu bicicleta {BICICLETA} (Orden N° {ORDEN}).\n\nEl valor total estimado es de ${TOTAL}.\n\nPor favor confírmanos si apruebas el servicio para iniciar de inmediato con las intervenciones.',
  },
  {
    id: 'ESPERANDO_REPUESTO',
    title: 'Notificación de Repuestos en Tránsito',
    description: 'Informa al cliente que el servicio está en pausa temporal aguardando un componente.',
    trigger: 'ESPERANDO_REPUESTO',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}'],
    template:
      'Hola {CLIENTE}, te informamos que los repuestos especiales para tu bicicleta {BICICLETA} (Orden N° {ORDEN}) ya están en camino. En cuanto arriben a nuestro taller reanudaremos el ensamble sin demoras.',
  },
  {
    id: 'BICICLETA_LISTA',
    title: 'Bicicleta Lista para Retiro',
    description: 'Avisa al cliente que el servicio ha culminado y la bicicleta está lista para entrega.',
    trigger: 'LISTA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{TOTAL}', '{SALDO}'],
    template:
      '¡Buenas noticias {CLIENTE}! 🎉 Tu bicicleta {BICICLETA} está 100% LISTA y probada para entrega en A2Ruedas (Orden N° {ORDEN}).\n\n💰 Saldo pendiente por cancelar: ${SALDO}\n\nPuedes pasar a recogerla en nuestro horario de atención. ¡Te esperamos!',
  },
  {
    id: 'ENTREGA_AGRADECIMIENTO',
    title: 'Agradecimiento y Hoja de Vida QR',
    description: 'Agradece al cliente tras la entrega de su bicicleta e incluye su enlace a la hoja de vida.',
    trigger: 'ENTREGADA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ORDEN}', '{ENLACE_QR}'],
    template:
      '¡Gracias por visitarnos {CLIENTE}! 🚴‍♂️ Esperamos que disfrutes al máximo tu {BICICLETA} tras el servicio (Orden N° {ORDEN}).\n\nPuedes consultar el historial técnico y la hoja de vida digital de tu bici aquí: {ENLACE_QR}\n\n¡Rueda seguro y cuenta siempre con A2Ruedas!',
  },
  {
    id: 'CONFIRMACION_CITA',
    title: 'Confirmación de Cita / Reserva',
    description: 'Confirma la reserva de turno agendada por el cliente.',
    trigger: 'CITA_PROGRAMADA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{FECHA}', '{HORA}'],
    template:
      '¡Hola {CLIENTE}! Tu cita para mantenimiento de tu bicicleta {BICICLETA} ha sido reservada con éxito para el día {FECHA} a las {HORA} en A2Ruedas Taller. ¡Te esperamos puntualmente!',
  },
  {
    id: 'RECORDATORIO_CITA',
    title: 'Recordatorio de Cita Próxima',
    description: 'Recuerda al cliente su cita programada.',
    trigger: 'RECORDATORIO_CITA',
    variables: ['{CLIENTE}', '{BICICLETA}', '{FECHA}', '{HORA}'],
    template:
      'Hola {CLIENTE}, te recordamos tu cita de taller en A2Ruedas programada para mañana {FECHA} a las {HORA} para tu {BICICLETA}. Si necesitas reprogramar, por favor avísanos por este medio.',
  },
  {
    id: 'ALERTA_KILOMETRAJE',
    title: 'Mantenimiento Preventivo por Uso',
    description: 'Sugiere servicio preventivo por kilometraje acumulado o tiempo transcurrido.',
    trigger: 'ALERTA_KM',
    variables: ['{CLIENTE}', '{BICICLETA}', '{KILOMETRAJE}'],
    template:
      '¡Hola {CLIENTE}! Notamos que tu bicicleta {BICICLETA} ya acumula aproximadamente {KILOMETRAJE} km desde su última revisión. Te recomendamos agendar un mantenimiento preventivo para alargar la vida útil de tu transmisión y componentes.',
  },
  {
    id: 'HISTORIAL_QR',
    title: 'Compartir Hoja de Vida Pública Digital',
    description: 'Envía el enlace público al portal de la bicicleta.',
    trigger: 'HISTORIAL_QR',
    variables: ['{CLIENTE}', '{BICICLETA}', '{ENLACE_QR}'],
    template:
      'Hola {CLIENTE}, aquí tienes el enlace oficial a la Hoja de Vida Digital de tu bicicleta {BICICLETA}: {ENLACE_QR}\n\nPuedes consultar en cualquier momento los mantenimientos realizados en A2Ruedas Taller.',
  },
  {
    id: 'PERSONALIZADO',
    title: 'Mensaje Libre Personalizado',
    description: 'Mensaje redactado a mano por el asesor del taller.',
    trigger: 'MANUAL',
    variables: ['{CLIENTE}'],
    template: 'Hola {CLIENTE}, te contactamos de A2Ruedas Taller:\n\n',
  },
];

assert.strictEqual(WHATSAPP_TEMPLATES.length, 10);
console.log('6. Catálogo maestro de 10 plantillas oficiales de taller:', WHATSAPP_TEMPLATES.length === 10 ? 'PASS' : 'FAIL');

// 4. Interpolación dinámica de variables
function interpolateTemplate(template, data) {
  const customer = data.customerName || 'Estimado(a) Cliente';
  const bike = data.bikeName || 'su bicicleta';
  const order = data.orderNumber || 'S/N';
  const total = (data.totalAmount || 0).toLocaleString('es-CO');
  const balance = (data.balanceDue !== undefined ? data.balanceDue : data.totalAmount || 0).toLocaleString('es-CO');
  const date = data.appointmentDate || 'Fecha coordinada';
  const time = data.appointmentTime || 'Hora coordinada';
  const mechanic = data.mechanicName || 'Equipo Técnico';
  const qrLink = data.publicUrl || 'https://a2ruedas.app';
  const km = data.mileage || '500';
  const issues = data.reportedIssues || 'Revisión general';

  return template
    .replace(/{CLIENTE}/g, customer)
    .replace(/{BICICLETA}/g, bike)
    .replace(/{ORDEN}/g, order)
    .replace(/{TOTAL}/g, total)
    .replace(/{SALDO}/g, balance)
    .replace(/{FECHA}/g, date)
    .replace(/{HORA}/g, time)
    .replace(/{MECANICO}/g, mechanic)
    .replace(/{ENLACE_QR}/g, qrLink)
    .replace(/{KILOMETRAJE}/g, km)
    .replace(/{FALLA}/g, issues);
}

// Prueba de interpolación con orden lista
const tmplReady = WHATSAPP_TEMPLATES.find((t) => t.id === 'BICICLETA_LISTA');
const interpolatedReady = interpolateTemplate(tmplReady.template, {
  customerName: 'Santiago Vélez',
  bikeName: 'Specialized Epic 2024',
  orderNumber: 'OT-2026-0042',
  totalAmount: 250000,
  balanceDue: 100000,
});

assert.ok(interpolatedReady.includes('Santiago Vélez'));
assert.ok(interpolatedReady.includes('Specialized Epic 2024'));
assert.ok(interpolatedReady.includes('OT-2026-0042'));
assert.ok(interpolatedReady.includes('100.000'));
console.log('7. Interpolación precisa de cliente, bicicleta, OT y saldo pendiente:', 'PASS');

// Prueba de interpolación con valores por defecto
const tmplReceived = WHATSAPP_TEMPLATES.find((t) => t.id === 'ORDEN_RECIBIDA');
const interpolatedDefaults = interpolateTemplate(tmplReceived.template, {});
assert.ok(interpolatedDefaults.includes('Estimado(a) Cliente'));
assert.ok(interpolatedDefaults.includes('su bicicleta'));
assert.ok(interpolatedDefaults.includes('S/N'));
console.log('8. Manejo seguro de valores por defecto ante datos incompletos:', 'PASS');

// 5. Mapeo reactivo de estados de orden a plantillas
function getTemplateForStatus(status) {
  switch (status) {
    case 'RECIBIDA':
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'ORDEN_RECIBIDA');
    case 'PRESUPUESTO':
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'PRESUPUESTO_LISTO');
    case 'ESPERANDO_REPUESTO':
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'ESPERANDO_REPUESTO');
    case 'LISTA':
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'BICICLETA_LISTA');
    case 'ENTREGADA':
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'ENTREGA_AGRADECIMIENTO');
    case 'CITA_PROGRAMADA':
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'CONFIRMACION_CITA');
    case 'HISTORIAL_QR':
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'HISTORIAL_QR');
    default:
      return WHATSAPP_TEMPLATES.find((t) => t.id === 'PERSONALIZADO');
  }
}

assert.strictEqual(getTemplateForStatus('RECIBIDA').id, 'ORDEN_RECIBIDA');
assert.strictEqual(getTemplateForStatus('LISTA').id, 'BICICLETA_LISTA');
assert.strictEqual(getTemplateForStatus('ENTREGADA').id, 'ENTREGA_AGRADECIMIENTO');
assert.strictEqual(getTemplateForStatus('PRESUPUESTO').id, 'PRESUPUESTO_LISTO');
assert.strictEqual(getTemplateForStatus('OTRO').id, 'PERSONALIZADO');
console.log('9. Mapeo exacto de estados operacionales del taller a plantillas sugeridas:', 'PASS');

// 6. Bitácora de Auditoría y Trazabilidad de Mensajes
const mockAuditLog = [
  {
    id: 'wa-001',
    customer_id: 'cust-1',
    work_order_id: 'wo-101',
    phone_number: '573101112233',
    message_content: 'Tu bicicleta Trek Marlin está recibida con la OT-2026-0001.',
    status_trigger: 'RECIBIDA',
    created_at: '2026-09-20T10:00:00.000Z',
    customer: { id: 'cust-1', full_name: 'Ana María Gómez', phone: '3101112233' },
    work_order: { id: 'wo-101', order_number: 'OT-2026-0001', status: 'RECIBIDA' },
  },
  {
    id: 'wa-002',
    customer_id: 'cust-2',
    work_order_id: 'wo-102',
    phone_number: '573204445566',
    message_content: 'Presupuesto de $180.000 para tu Scott Scale.',
    status_trigger: 'PRESUPUESTO',
    created_at: '2026-09-20T11:30:00.000Z',
    customer: { id: 'cust-2', full_name: 'Carlos Andrés Pérez', phone: '3204445566' },
    work_order: { id: 'wo-102', order_number: 'OT-2026-0002', status: 'PRESUPUESTO' },
  },
  {
    id: 'wa-003',
    customer_id: 'cust-1',
    work_order_id: 'wo-101',
    phone_number: '573101112233',
    message_content: '¡Tu Trek Marlin está 100% lista para retiro!',
    status_trigger: 'LISTA',
    created_at: '2026-09-20T16:00:00.000Z',
    customer: { id: 'cust-1', full_name: 'Ana María Gómez', phone: '3101112233' },
    work_order: { id: 'wo-101', order_number: 'OT-2026-0001', status: 'LISTA' },
  },
];

// Función de filtrado multicriterio de la bitácora
function filterAuditLogs(logs, { searchTerm = '', trigger = 'ALL' }) {
  return logs.filter((m) => {
    if (trigger !== 'ALL' && m.status_trigger !== trigger) {
      return false;
    }
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    const matchClient = m.customer?.full_name?.toLowerCase().includes(term);
    const matchPhone = m.phone_number?.toLowerCase().includes(term);
    const matchOrder = m.work_order?.order_number?.toLowerCase().includes(term);
    const matchContent = m.message_content?.toLowerCase().includes(term);
    const matchTrigger = m.status_trigger?.toLowerCase().includes(term);

    return matchClient || matchPhone || matchOrder || matchContent || matchTrigger;
  });
}

// Pruebas de filtrado de bitácora
const filterByTrigger = filterAuditLogs(mockAuditLog, { trigger: 'RECIBIDA' });
assert.strictEqual(filterByTrigger.length, 1);
assert.strictEqual(filterByTrigger[0].id, 'wa-001');
console.log('10. Filtrado de bitácora por disparador de estado (trigger=RECIBIDA):', 'PASS');

const filterByClient = filterAuditLogs(mockAuditLog, { searchTerm: 'Carlos Andrés' });
assert.strictEqual(filterByClient.length, 1);
assert.strictEqual(filterByClient[0].id, 'wa-002');
console.log('11. Búsqueda reactiva en bitácora por nombre de cliente:', 'PASS');

const filterByOrder = filterAuditLogs(mockAuditLog, { searchTerm: 'OT-2026-0001' });
assert.strictEqual(filterByOrder.length, 2);
console.log('12. Búsqueda reactiva por número de orden OT vinculada:', 'PASS');

// 7. Métricas y KPIs de Comunicación
const totalMessages = mockAuditLog.length;
const uniqueCustomers = new Set(mockAuditLog.map((m) => m.customer_id)).size;
const orderRelated = mockAuditLog.filter((m) => m.work_order_id).length;

assert.strictEqual(totalMessages, 3);
assert.strictEqual(uniqueCustomers, 2); // cust-1 y cust-2
assert.strictEqual(orderRelated, 3);
console.log('13. Cálculo verificado de KPIs (Mensajes Totales, Clientes Únicos, Trazabilidad OT):', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 14 PASARON EXITOSAMENTE (13/13 PASS) ---');
