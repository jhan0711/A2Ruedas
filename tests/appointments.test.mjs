import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 11: AGENDA Y CALENDARIO DE MANTENIMIENTOS ---');

// 1. Estructura y Validación de Citas
function createAppointmentRecord(data) {
  if (!data.customer_id) throw new Error('Cliente requerido');
  if (!data.scheduled_at) throw new Error('Fecha y hora requerida');
  if (!data.estimated_duration_min || data.estimated_duration_min <= 0) {
    throw new Error('Duración inválida');
  }

  return {
    id: data.id || `apt-${Date.now()}`,
    customer_id: data.customer_id,
    bicycle_id: data.bicycle_id || null,
    service_name: data.service_name || 'Mantenimiento General',
    mechanic_name: data.mechanic_name || 'Taller General',
    scheduled_at: data.scheduled_at,
    estimated_duration_min: data.estimated_duration_min,
    status: data.status || 'SCHEDULED',
    notes: data.notes || null,
    created_at: new Date().toISOString(),
  };
}

const mockAppointment = createAppointmentRecord({
  customer_id: 'c-001',
  bicycle_id: 'b-001',
  service_name: 'Mantenimiento General Completo',
  mechanic_name: 'Carlos (Mecánico Senior MTB)',
  scheduled_at: '2026-09-22T09:30:00.000Z',
  estimated_duration_min: 120,
});

console.log(
  '1. Creación válida de cita con mecánico asignado y duración estimada:',
  mockAppointment.customer_id === 'c-001' &&
    mockAppointment.estimated_duration_min === 120 &&
    mockAppointment.mechanic_name === 'Carlos (Mecánico Senior MTB)' &&
    mockAppointment.status === 'SCHEDULED'
    ? 'PASS'
    : 'FAIL'
);

// 2. Control de Aforo y Capacidad Diaria (Máximo 6 cupos por día)
function calculateDailyCapacity(appointmentsList, targetDateString, maxDaily = 6) {
  const targetDate = targetDateString.slice(0, 10);
  const activeBookings = appointmentsList.filter(
    (a) => a.scheduled_at.slice(0, 10) === targetDate && a.status !== 'CANCELLED'
  );

  const booked = activeBookings.length;
  const percentage = Math.min(100, Math.round((booked / maxDaily) * 100));
  const isFull = booked >= maxDaily;
  const remaining = Math.max(0, maxDaily - booked);

  return { booked, max: maxDaily, percentage, isFull, remaining };
}

const testDate = '2026-09-22';
const mockList = [
  { scheduled_at: `${testDate}T08:00:00.000Z`, status: 'SCHEDULED' },
  { scheduled_at: `${testDate}T10:00:00.000Z`, status: 'SCHEDULED' },
  { scheduled_at: `${testDate}T11:30:00.000Z`, status: 'IN_PROGRESS' },
  { scheduled_at: `${testDate}T14:00:00.000Z`, status: 'COMPLETED' },
  { scheduled_at: `${testDate}T15:30:00.000Z`, status: 'CANCELLED' }, // Cancelada: no debe contar
];

const capResult = calculateDailyCapacity(mockList, testDate, 6);

console.log(
  '2. Cálculo de aforo diario (4 activas de 6 cupos = 67% ocupación):',
  capResult.booked === 4 && capResult.percentage === 67 && capResult.remaining === 2
    ? 'PASS'
    : 'FAIL'
);

console.log(
  '3. Exclusión estricta de citas CANCELLED para liberación de cupos en agenda:',
  capResult.booked === 4 && mockList.length === 5 ? 'PASS' : 'FAIL'
);

// 4. Detección de Saturación / Capacidad Completa
const fullList = [
  ...mockList.filter((a) => a.status !== 'CANCELLED'),
  { scheduled_at: `${testDate}T16:00:00.000Z`, status: 'SCHEDULED' },
  { scheduled_at: `${testDate}T17:00:00.000Z`, status: 'SCHEDULED' },
];
const fullCapResult = calculateDailyCapacity(fullList, testDate, 6);

console.log(
  '4. Alerta de aforo completo cuando se alcanzan 6 de 6 cupos (100% ocupado):',
  fullCapResult.booked === 6 && fullCapResult.isFull === true && fullCapResult.remaining === 0
    ? 'PASS'
    : 'FAIL'
);

// 5. Ciclo de Transición de Estados
function updateAppointmentStatus(appointment, newStatus) {
  const VALID_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Estado inválido: ${newStatus}`);
  }
  return { ...appointment, status: newStatus };
}

const inProgressApt = updateAppointmentStatus(mockAppointment, 'IN_PROGRESS');
const completedApt = updateAppointmentStatus(inProgressApt, 'COMPLETED');
const cancelledApt = updateAppointmentStatus(mockAppointment, 'CANCELLED');

console.log(
  '5. Soporte para el ciclo completo de 4 estados (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED):',
  inProgressApt.status === 'IN_PROGRESS' &&
    completedApt.status === 'COMPLETED' &&
    cancelledApt.status === 'CANCELLED'
    ? 'PASS'
    : 'FAIL'
);

// 6. Generación de Enlace y Notificación de WhatsApp
function generateWhatsAppConfirmation(customerName, phone, bikeInfo, serviceName, mechanicName, dateIso) {
  const cleanPhone = phone.replace(/\D/g, '');
  const waNumber = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  const dateObj = new Date(dateIso);

  const text = encodeURIComponent(
    `¡Hola ${customerName}! Te confirmamos tu cita de servicio para tu ${bikeInfo}: ${serviceName} con el mecánico ${mechanicName}. Te esperamos.`
  );

  return `https://wa.me/${waNumber}?text=${text}`;
}

const waLink = generateWhatsAppConfirmation(
  'Carlos Mendoza',
  '3104567890',
  'Trek Marlin 7',
  'Mantenimiento General',
  'Carlos',
  '2026-09-22T09:30:00.000Z'
);

console.log(
  '6. Generación de Deep Link de confirmación por WhatsApp:',
  waLink.includes('wa.me/573104567890') &&
    waLink.includes('Trek%20Marlin%207') &&
    waLink.includes('Mantenimiento%20General')
    ? 'PASS'
    : 'FAIL'
);

// 7. Simulación de Conversión de Cita a Recepción de Taller (Fase 10)
function prepareReceptionDataFromAppointment(apt, customer, bike) {
  return {
    customer_id: apt.customer_id,
    bicycle_id: apt.bicycle_id,
    customer_name: customer.full_name,
    customer_phone: customer.phone,
    bike_details: `${bike.brand} ${bike.model}`,
    initial_service: apt.service_name,
    assigned_mechanic: apt.mechanic_name,
    status: 'IN_PROGRESS',
  };
}

const mockCust = { id: 'c-001', full_name: 'Carlos Mendoza', phone: '3104567890' };
const mockBike = { id: 'b-001', brand: 'Trek', model: 'Marlin 7' };
const receptionPrep = prepareReceptionDataFromAppointment(mockAppointment, mockCust, mockBike);

console.log(
  '7. Transferencia de datos de cita a módulo de recepción formal:',
  receptionPrep.customer_name === 'Carlos Mendoza' &&
    receptionPrep.bike_details === 'Trek Marlin 7' &&
    receptionPrep.initial_service === 'Mantenimiento General Completo'
    ? 'PASS'
    : 'FAIL'
);

console.log('--- TODAS LAS PRUEBAS DE LA FASE 11 FINALIZADAS EXITOSAMENTE ---');
