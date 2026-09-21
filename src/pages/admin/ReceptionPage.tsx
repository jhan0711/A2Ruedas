import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ClipboardCheck,
  User,
  Bike,
  Wrench,
  PenTool,
  CheckCircle2,
  Printer,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  DollarSign,
  FileCheck,
} from 'lucide-react';
import { Customer, Bicycle, WorkOrder } from '../../types/database';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { workOrderService } from '../../services/workOrderService';
import { Button, Card, Badge, Alert, Modal } from '../../components/ui';
import { TouchSignaturePad } from '../../components/signature/TouchSignaturePad';
import { BicycleDamageDiagram, DamagePoint } from '../../components/inspection/BicycleDamageDiagram';
import { AccessoriesChecklist } from '../../components/inspection/AccessoriesChecklist';
import { WorkOrderTicketModal } from '../../components/receipts/WorkOrderTicketModal';

type Step = 'client_bike' | 'inspection' | 'services' | 'signature' | 'success';

export const ReceptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Paso actual
  const [currentStep, setCurrentStep] = useState<Step>('client_bike');

  // Datos del Paso 1: Cliente y Bicicleta
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerBikes, setCustomerBikes] = useState<Bicycle[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string>('');

  // Modales express de creación rápida de cliente y bicicleta
  const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDoc, setNewCustDoc] = useState('');

  const [quickBikeModalOpen, setQuickBikeModalOpen] = useState(false);
  const [newBikeBrand, setNewBikeBrand] = useState('');
  const [newBikeModel, setNewBikeModel] = useState('');
  const [newBikeType, setNewBikeType] = useState('MTB');
  const [newBikeColor, setNewBikeColor] = useState('Negro');
  const [newBikeSerial, setNewBikeSerial] = useState('');

  // Datos del Paso 2 & 3: Diagnóstico, Accesorios e Inspección de Daños
  const [reportedIssues, setReportedIssues] = useState('');
  const [mileageKm, setMileageKm] = useState<number | ''>('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [additionalAccessories, setAdditionalAccessories] = useState('');
  const [damages, setDamages] = useState<DamagePoint[]>([]);

  // Datos del Paso 4: Servicios iniciales & Anticipo
  const [initialServiceDesc, setInitialServiceDesc] = useState('Revisión Técnica y Diagnóstico');
  const [initialLaborPrice, setInitialLaborPrice] = useState<number>(35000);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositMethod, setDepositMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>('EFECTIVO');

  // Datos del Paso 5: Firma Digital Táctil
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerDoc, setSignerDoc] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Estados de proceso y orden creada
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<WorkOrder | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cargar clientes iniciales y preseleccionar si se recibe desde otra pantalla
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const list = await customerService.getCustomers();
        setCustomers(list);

        const state = location.state as { customer_id?: string; customerId?: string; bicycle_id?: string; bikeId?: string } | null;
        const targetCust = state?.customer_id || state?.customerId;
        if (targetCust) {
          setSelectedCustomerId(targetCust);
        }
      } catch (err) {
        console.error('Error al cargar clientes:', err);
      }
    };
    loadCustomers();
  }, [location.state]);

  // Cargar bicicletas cuando cambia el cliente seleccionado
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerBikes([]);
      setSelectedBikeId('');
      return;
    }

    const loadBikes = async () => {
      try {
        const bikes = await bicycleService.getBicycles(selectedCustomerId);
        setCustomerBikes(bikes);
        
        const state = location.state as { bicycle_id?: string; bikeId?: string } | null;
        const targetBike = state?.bicycle_id || state?.bikeId;
        if (targetBike && bikes.some((b) => b.id === targetBike)) {
          setSelectedBikeId(targetBike);
        } else if (bikes.length > 0) {
          setSelectedBikeId(bikes[0].id);
        } else {
          setSelectedBikeId('');
        }
      } catch (err) {
        console.error('Error al cargar bicicletas del cliente:', err);
      }
    };

    loadBikes();

    // Rellenar automáticamente el nombre del firmante si coincide con el cliente
    const currentCust = customers.find((c) => c.id === selectedCustomerId);
    if (currentCust) {
      if (!signerName) setSignerName(currentCust.full_name);
      if (!signerDoc && currentCust.document_id) setSignerDoc(currentCust.document_id);
    }
  }, [selectedCustomerId, customers, location.state]);

  // Filtrado reactivo de clientes para selector rápido
  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      (c.document_id && c.document_id.includes(customerSearch))
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedBike = customerBikes.find((b) => b.id === selectedBikeId);

  // Creación express de cliente
  const handleQuickCustomerCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    try {
      const created = await customerService.createCustomer({
        full_name: newCustName.trim(),
        phone: newCustPhone.trim(),
        whatsapp: newCustPhone.trim(),
        document_id: newCustDoc.trim() || null,
      });
      setCustomers([created, ...customers]);
      setSelectedCustomerId(created.id);
      setSignerName(created.full_name);
      if (created.document_id) setSignerDoc(created.document_id);
      setQuickCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustDoc('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar cliente');
    }
  };

  // Creación express de bicicleta
  const handleQuickBikeCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newBikeBrand.trim() || !newBikeModel.trim()) return;

    try {
      const created = await bicycleService.createBicycle({
        customer_id: selectedCustomerId,
        brand: newBikeBrand.trim(),
        model: newBikeModel.trim(),
        bike_type: newBikeType,
        color: newBikeColor.trim(),
        serial_number: newBikeSerial.trim() || null,
      });
      setCustomerBikes([created, ...customerBikes]);
      setSelectedBikeId(created.id);
      setQuickBikeModalOpen(false);
      setNewBikeBrand('');
      setNewBikeModel('');
      setNewBikeSerial('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar bicicleta');
    }
  };

  // Enviar y procesar la Recepción Completa
  const handleFinalizeReception = async () => {
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage('Por favor seleccione un cliente propietario.');
      setCurrentStep('client_bike');
      return;
    }
    if (!selectedBikeId) {
      setErrorMessage('Por favor seleccione la bicicleta que ingresa.');
      setCurrentStep('client_bike');
      return;
    }
    if (!reportedIssues.trim()) {
      setErrorMessage('Por favor ingrese el motivo o falla reportada por el cliente.');
      setCurrentStep('inspection');
      return;
    }
    if (!signatureData) {
      setErrorMessage('La firma digital del cliente es obligatoria para la recepción legal.');
      setCurrentStep('signature');
      return;
    }
    if (!signerName.trim()) {
      setErrorMessage('Por favor ingrese el nombre del firmante.');
      setCurrentStep('signature');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Unificar accesorios
      const allAcc = [...selectedAccessories];
      if (additionalAccessories.trim()) {
        allAcc.push(additionalAccessories.trim());
      }
      const accessoriesString = allAcc.length > 0 ? allAcc.join(', ') : 'Ninguno declarado';

      // 2. Serializar daños para notas internas
      const damageSummary =
        damages.length > 0
          ? `[INSPECCIÓN DE DAÑOS PREVIOS (${damages.length})]: ` +
            damages
              .map(
                (d, idx) =>
                  `#${idx + 1} ${d.zone} (${d.type}, severidad ${d.severity}): ${d.notes || 'Sin nota'}`
              )
              .join(' | ')
          : '[INSPECCIÓN]: Bicicleta recibida sin daños previos visibles.';

      const depositNote =
        depositAmount > 0
          ? ` [ANTICIPO RECIBIDO]: $${depositAmount.toLocaleString('es-CO')} vía ${depositMethod}.`
          : '';

      const fullInternalNotes = `${damageSummary}${depositNote}`;

      // 3. Crear Orden de Trabajo en estado RECIBIDA
      const order = await workOrderService.createWorkOrder(
        {
          customer_id: selectedCustomerId,
          bicycle_id: selectedBikeId,
          reported_issues: reportedIssues.trim(),
          accessories_received: accessoriesString,
          entry_mileage_km: mileageKm ? Number(mileageKm) : null,
          estimated_delivery_at: estimatedDelivery || null,
          total_labor: initialLaborPrice,
          total_parts: 0,
          discount: 0,
          grand_total: initialLaborPrice,
          internal_notes: fullInternalNotes,
          status: 'RECIBIDA',
        },
        [
          {
            item_type: 'service',
            description: initialServiceDesc.trim() || 'Servicio Inicial de Recepción',
            quantity: 1,
            unit_price: initialLaborPrice,
            total_price: initialLaborPrice,
          },
        ]
      );

      // 4. Guardar Firma Digital Táctil de Recepción
      await workOrderService.saveSignature(
        order.id,
        'reception',
        signatureData,
        signerName.trim(),
        signerDoc.trim() || undefined
      );

      // Asignar referencias para el comprobante
      const hydratedOrder: WorkOrder = {
        ...order,
        customer: selectedCustomer,
        bicycle: selectedBike,
      };

      setCreatedOrder(hydratedOrder);
      setCurrentStep('success');
    } catch (err: any) {
      console.error('Error al procesar recepción:', err);
      setErrorMessage(err.message || 'Error al guardar la orden de recepción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enlace para WhatsApp
  const getWhatsAppMessage = () => {
    if (!createdOrder) return '';
    const phone = createdOrder.customer?.phone?.replace(/\D/g, '') || '';
    const waNumber = phone.startsWith('57') ? phone : `57${phone}`;
    const text = encodeURIComponent(
      `¡Hola ${createdOrder.customer?.full_name}! 👋 Te confirmamos que tu bicicleta ${createdOrder.bicycle?.brand} ${createdOrder.bicycle?.model} ha sido RECIBIDA exitosamente en A2Ruedas Taller con la Orden N° ${createdOrder.order_number}. Diagnóstico en curso. Puedes consultar el estado en cualquier momento. ¡Gracias por confiar en nosotros!`
    );
    return `https://wa.me/${waNumber}?text=${text}`;
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Barra de Navegación Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/ordenes"
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Volver a Órdenes"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Recepción de Bicicleta y Firma Digital
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
            Inspección formal de ingreso, inventario de accesorios y firma táctil del cliente en pantalla.
          </p>
        </div>

        {/* Indicador de Pasos */}
        {currentStep !== 'success' && (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium">
            <button
              onClick={() => setCurrentStep('client_bike')}
              className={`px-2 py-1 rounded transition-colors ${
                currentStep === 'client_bike'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              1. Cliente & Bici
            </button>
            <span>›</span>
            <button
              onClick={() => setCurrentStep('inspection')}
              className={`px-2 py-1 rounded transition-colors ${
                currentStep === 'inspection'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2. Inspección
            </button>
            <span>›</span>
            <button
              onClick={() => setCurrentStep('services')}
              className={`px-2 py-1 rounded transition-colors ${
                currentStep === 'services'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              3. Servicios
            </button>
            <span>›</span>
            <button
              onClick={() => setCurrentStep('signature')}
              className={`px-2 py-1 rounded transition-colors ${
                currentStep === 'signature'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              4. Firma
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Error */}
      {errorMessage && (
        <Alert variant="error" title="Atención" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* PASO 1: SELECCIÓN DE CLIENTE Y BICICLETA */}
      {currentStep === 'client_bike' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Paso 1A: Cliente Propietario
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuickCustomerModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Nuevo Cliente
              </Button>
            </div>

            {/* Buscador y Selector de Cliente */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente por nombre, teléfono o cédula..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredCustomers.length === 0 ? (
                  <div className="col-span-full p-4 text-center text-xs text-slate-400">
                    No se encontraron clientes. Usa el botón "Nuevo Cliente" para registrarlo al instante.
                  </div>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {c.full_name}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">Tel: {c.phone}</div>
                        {c.document_id && (
                          <div className="text-slate-400 text-[10px]">Doc: {c.document_id}</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>

          {/* Selector de Bicicleta del Cliente */}
          {selectedCustomerId && (
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Paso 1B: Bicicleta que Ingresa al Taller
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuickBikeModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Registrar Nueva Bicicleta
                </Button>
              </div>

              {customerBikes.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                  <span>Este cliente aún no tiene bicicletas registradas en el taller.</span>
                  <Button
                    size="sm"
                    onClick={() => setQuickBikeModalOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Agregar Bicicleta
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {customerBikes.map((bike) => {
                    const isSelected = selectedBikeId === bike.id;
                    return (
                      <div
                        key={bike.id}
                        onClick={() => setSelectedBikeId(bike.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {bike.brand} {bike.model}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {bike.serial_number ? `S/N: ${bike.serial_number}` : bike.bike_type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Tipo: {bike.bike_type} • Color: {bike.color}
                        </div>
                        {bike.serial_number && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Serial: {bike.serial_number}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Botón Siguiente */}
          <div className="flex justify-end pt-2">
            <Button
              size="md"
              disabled={!selectedCustomerId || !selectedBikeId}
              onClick={() => setCurrentStep('inspection')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continuar a Inspección y Daños
            </Button>
          </div>
        </div>
      )}

      {/* PASO 2: MOTIVO DE INGRESO, ACCESORIOS Y DIAGRAMA DE DAÑOS */}
      {currentStep === 'inspection' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Paso 2A: Motivo de Ingreso y Datos Operativos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo de Ingreso / Falla Reportada por el Cliente *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reportedIssues}
                  onChange={(e) => setReportedIssues(e.target.value)}
                  placeholder="Ej: Mantenimiento general, cambio de pastillas de freno, cadena salta en piñones pequeños..."
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Entrega Estimada
                  </label>
                  <input
                    type="datetime-local"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-1.5 focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Odómetro / Km de Entrada
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mileageKm}
                    onChange={(e) =>
                      setMileageKm(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
                    }
                    placeholder="Ej: 1450"
                    className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-1.5 focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Checklist de Accesorios */}
          <Card className="p-4">
            <AccessoriesChecklist
              selectedAccessories={selectedAccessories}
              onAccessoriesChange={setSelectedAccessories}
              additionalNotes={additionalAccessories}
              onAdditionalNotesChange={setAdditionalAccessories}
            />
          </Card>

          {/* Diagrama Interactivo de Daños */}
          <Card className="p-4">
            <BicycleDamageDiagram damages={damages} onChange={setDamages} />
          </Card>

          {/* Botones de Navegación */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep('client_bike')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Atrás (Cliente)
            </Button>
            <Button
              size="md"
              disabled={!reportedIssues.trim()}
              onClick={() => setCurrentStep('services')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continuar a Servicios y Anticipo
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3: SERVICIOS Y ANTICIPO */}
      {currentStep === 'services' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Paso 3: Estimación Inicial de Mano de Obra y Anticipo
            </h2>
            <p className="text-xs text-slate-500">
              Registra el servicio inicial pactado con el cliente. Podrás agregar o ajustar repuestos y servicios adicionales en el taller en cualquier momento.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del Servicio Inicial
                </label>
                <input
                  type="text"
                  value={initialServiceDesc}
                  onChange={(e) => setInitialServiceDesc(e.target.value)}
                  placeholder="Ej: Mantenimiento General, Purga de frenos..."
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Estimado de Mano de Obra ($ COP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={initialLaborPrice}
                  onChange={(e) => setInitialLaborPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anticipo Recibido ($ COP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0 si no deja abono"
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medio de Pago del Anticipo
                </label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value as any)}
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="EFECTIVO">Efectivo en Caja</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria / Nequi / Daviplata</option>
                  <option value="TARJETA">Datáfono / Tarjeta</option>
                </select>
              </div>
            </div>

            {/* Resumen Financiero Inicial */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">Total Inicial Estimado:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  ${initialLaborPrice.toLocaleString('es-CO')}
                </span>
                {depositAmount > 0 && (
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    Saldo Pendiente: ${(initialLaborPrice - depositAmount).toLocaleString('es-CO')}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Botones de Navegación */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep('inspection')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Atrás (Inspección)
            </Button>
            <Button
              size="md"
              onClick={() => setCurrentStep('signature')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continuar a Consentimiento y Firma
            </Button>
          </div>
        </div>
      )}

      {/* PASO 4: TÉRMINOS LEGALES Y FIRMA TÁCTIL */}
      {currentStep === 'signature' && (
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Paso 4: Consentimiento del Cliente y Firma Digital Táctil
            </h2>

            {/* Términos de Servicio Legales */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 max-h-36 overflow-y-auto">
              <div className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                CONDICIONES DE CUSTODIA Y SERVICIO — A2RUEDAS TALLER
              </div>
              <p>
                1. <strong>Autorización:</strong> El cliente autoriza expresamente los trabajos mecánicos descritos y el desmontaje preventivo necesario para evaluación diagnóstica.
              </p>
              <p>
                2. <strong>Accesorios y Objetos Personales:</strong> El taller se responsabiliza únicamente por los accesorios expresamente declarados en el inventario de esta orden. No nos hacemos responsables por elementos no inventariados.
              </p>
              <p>
                3. <strong>Retiro y Bodegaje:</strong> Una vez notificada la entrega de la bicicleta, el cliente dispone de 30 días calendario para su retiro. Pasado este plazo, se generará cobro de custodia de $5.000 COP por día.
              </p>
              <p>
                4. <strong>Garantía:</strong> Todos nuestros ajustes cuentan con 30 días de garantía mecánica. Los repuestos sustituidos están a disposición del cliente para su verificación.
              </p>
            </div>

            {/* Checkbox de Aceptación */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <label
                htmlFor="terms"
                className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                El cliente declara conformidad con los términos de servicio, daños previos y accesorios inventariados.
              </label>
            </div>

            {/* Lienzo Táctil de Firma */}
            <TouchSignaturePad
              signerName={signerName}
              onSignerNameChange={setSignerName}
              signerDoc={signerDoc}
              onSignerDocChange={setSignerDoc}
              onSignatureChange={setSignatureData}
              label="Firma de Conformidad en Pantalla"
              description="Firme con el dedo, stylus o mouse sobre el área delimitada para registrar la recepción formal."
            />
          </Card>

          {/* Botones de Navegación y Finalización */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setCurrentStep('services')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Atrás (Servicios)
            </Button>

            <Button
              size="md"
              variant="primary"
              disabled={isSubmitting || !signatureData || !acceptedTerms || !signerName.trim()}
              isLoading={isSubmitting}
              onClick={handleFinalizeReception}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Generar Orden de Trabajo y Emitir Comprobante
            </Button>
          </div>
        </div>
      )}

      {/* PASO 5: ÉXITO Y EMISIÓN DE COMPROBANTES */}
      {currentStep === 'success' && createdOrder && (
        <Card className="p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <FileCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
              ¡RECEPCIÓN EXITOSA!
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {createdOrder.order_number}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              La bicicleta ha sido ingresada al taller con firma digital capturada, inventario de accesorios y diagrama de daños vinculado.
            </p>
          </div>

          {/* Resumen Rápido de la Recepción */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-left max-w-xl mx-auto">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">CLIENTE</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {createdOrder.customer?.full_name}
              </span>
              <span className="block text-[11px] font-mono text-slate-500">
                {createdOrder.customer?.phone}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">BICICLETA</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {createdOrder.bicycle?.brand} {createdOrder.bicycle?.model}
              </span>
              <span className="block text-[10px] font-mono text-blue-600 dark:text-blue-400">
                {createdOrder.bicycle?.serial_number
                  ? `S/N: ${createdOrder.bicycle.serial_number}`
                  : createdOrder.bicycle?.bike_type}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ESTADO & FIRMA</span>
              <Badge status={createdOrder.status} size="sm" isMono />
              <span className="block text-[10px] text-emerald-600 font-semibold mt-1">
                Firma Digital: Registrada ✓
              </span>
            </div>
          </div>

          {/* Acciones de Entrega de Comprobante */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="md"
              onClick={() => setTicketModalOpen(true)}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Imprimir Comprobante (58 mm)
            </Button>

            {createdOrder.customer?.phone && (
              <a
                href={getWhatsAppMessage()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                Notificar por WhatsApp
              </a>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/admin/ordenes')}
            >
              Ver en Órdenes de Trabajo
            </Button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                // Reiniciar para una nueva recepción
                setSelectedCustomerId('');
                setSelectedBikeId('');
                setReportedIssues('');
                setSignatureData(null);
                setDamages([]);
                setSelectedAccessories([]);
                setCreatedOrder(null);
                setCurrentStep('client_bike');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Ingresar otra bicicleta
            </button>
          </div>
        </Card>
      )}

      {/* Modal Express: Nuevo Cliente */}
      <Modal
        isOpen={quickCustomerModalOpen}
        onClose={() => setQuickCustomerModalOpen(false)}
        title="Registrar Nuevo Cliente"
        description="Agrega los datos de contacto del cliente en segundos."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickCustomerModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" form="quick-cust-form" type="submit">
              Guardar Cliente
            </Button>
          </>
        }
      >
        <form id="quick-cust-form" onSubmit={handleQuickCustomerCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="Ej: Andrés Morales"
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teléfono / WhatsApp *
            </label>
            <input
              type="tel"
              required
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="Ej: 3101234567"
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cédula / Documento (Opcional)
            </label>
            <input
              type="text"
              value={newCustDoc}
              onChange={(e) => setNewCustDoc(e.target.value)}
              placeholder="Ej: 1018234567"
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </Modal>

      {/* Modal Express: Nueva Bicicleta */}
      <Modal
        isOpen={quickBikeModalOpen}
        onClose={() => setQuickBikeModalOpen(false)}
        title="Registrar Nueva Bicicleta"
        description="Asigna una bicicleta al cliente seleccionado."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickBikeModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" form="quick-bike-form" type="submit">
              Guardar Bicicleta
            </Button>
          </>
        }
      >
        <form id="quick-bike-form" onSubmit={handleQuickBikeCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca *
              </label>
              <input
                type="text"
                required
                value={newBikeBrand}
                onChange={(e) => setNewBikeBrand(e.target.value)}
                placeholder="Ej: Trek, Giant, GW"
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                required
                value={newBikeModel}
                onChange={(e) => setNewBikeModel(e.target.value)}
                placeholder="Ej: Marlin 7, Allez"
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo
              </label>
              <select
                value={newBikeType}
                onChange={(e) => setNewBikeType(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              >
                <option value="MTB">MTB (Montaña)</option>
                <option value="Ruta">Ruta</option>
                <option value="Urbana">Urbana</option>
                <option value="Gravel">Gravel</option>
                <option value="Eléctrica (E-Bike)">Eléctrica (E-Bike)</option>
                <option value="BMX">BMX</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color
              </label>
              <input
                type="text"
                value={newBikeColor}
                onChange={(e) => setNewBikeColor(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Serial del Marco / Cuadro (Opcional)
            </label>
            <input
              type="text"
              value={newBikeSerial}
              onChange={(e) => setNewBikeSerial(e.target.value)}
              placeholder="Ej: WTU123456X"
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </Modal>

      {/* Comprobante Térmico POS (58 mm) */}
      <WorkOrderTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        order={createdOrder}
      />
    </div>
  );
};
