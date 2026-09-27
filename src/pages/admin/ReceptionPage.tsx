import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ClipboardCheck,
  User,
  Bike,
  Wrench,
  
  CheckCircle2,
  Printer,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  Plus,
  Search,
  DollarSign,
  FileCheck,
  QrCode,
} from 'lucide-react';
import { Customer,  WorkOrder } from '../../types/database';
import { customerService } from '../../services/customerService';
import { workOrderService } from '../../services/workOrderService';
import { Button, Card, Badge, Alert, Modal } from '../../components/ui';
import { BicycleDamageDiagram, DamagePoint } from '../../components/inspection/BicycleDamageDiagram';
import { AccessoriesChecklist } from '../../components/inspection/AccessoriesChecklist';
import { WorkOrderTicketModal } from '../../components/receipts/WorkOrderTicketModal';
import { WhatsAppComposeModal } from '../../components/whatsapp/WhatsAppComposeModal';

type Step = 'client_bike' | 'inspection' | 'services' | 'success';

export const ReceptionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Paso actual
  const [currentStep, setCurrentStep] = useState<Step>('client_bike');

  // Datos del Paso 1: Cliente y Bicicleta
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
    const [bicycleInfo, setBicycleInfo] = useState<string>('');

  // Modales express de creación rápida de cliente y bicicleta
  const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDoc, setNewCustDoc] = useState('');

            
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

          

  // Estados de proceso y orden creada
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<WorkOrder | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customerService.getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
      }
    };
    loadCustomers();
  }, [location.state]);

  // Cargar bicicletas cuando cambia el cliente seleccionado
  useEffect(() => {
    if (!selectedCustomerId) {
            setBicycleInfo('');
      return;
    }

    
    // Rellenar automáticamente el nombre del firmante si coincide con el cliente
    
  }, [selectedCustomerId, customers, location.state]);

  // Filtrado reactivo de clientes para selector rápido
  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch) ||
      (c.document_id && c.document_id.includes(customerSearch))
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  

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
            if (created.document_id)       setQuickCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustDoc('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar cliente');
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
    if (!bicycleInfo.trim()) { setErrorMessage('Debe ingresar la información de la bicicleta'); return; }
    if (!reportedIssues.trim()) {
      setErrorMessage('Por favor ingrese el motivo o falla reportada por el cliente.');
      setCurrentStep('inspection');
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
        Number(depositAmount || 0) > 0
          ? ` [ANTICIPO RECIBIDO]: $${depositAmount.toLocaleString('es-CO')} vía ${depositMethod}.`
          : '';

      const fullInternalNotes = `${damageSummary}${depositNote}`;

      // 3. Crear Orden de Trabajo en estado RECIBIDA
      const order = await workOrderService.createWorkOrder(
        {
          customer_id: selectedCustomerId,
          bicycle_info: bicycleInfo,
          reported_issues: reportedIssues.trim(),
          accessories_received: accessoriesString,
          entry_mileage_km: mileageKm ? Number(mileageKm) : null,
          
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

      
      // Asignar referencias para el comprobante
      const hydratedOrder: WorkOrder = {
        ...order,
        customer: selectedCustomer,
        
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
              Recepción de Bicicleta
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
            Inspección formal de ingreso y revisión técnica de la bicicleta.
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
              onClick={() => handleFinalizeReception()}
              className={`px-2 py-1 rounded transition-colors ${
                false
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              
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
          {/* Tarjeta de Reconocimiento Rápido por Código QR */}
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  ¿La bicicleta ya tiene código QR del taller?
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Escanea el sticker adhesivo con la cámara o código para autocompletar cliente y bicicleta en 1 segundo.
                </p>
              </div>
            </div>
            
          </div>

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
                
              </div>

              <div className="space-y-1 mt-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Información de la Bicicleta *
                </label>
                <input
                  type="text"
                  value={bicycleInfo}
                  onChange={(e) => setBicycleInfo(e.target.value)}
                  placeholder="Ej: Trek Marlin 7, color rojo, marco M"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </Card>
          )}

          {/* Botón Siguiente */}
          <div className="flex justify-end pt-2">
            <Button
              size="md"
              disabled={!selectedCustomerId || !bicycleInfo.trim()}
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
                    type="number" onFocus={(e) => e.target.select()}
                    min="0"
                    value={mileageKm}
                    onChange={(e) =>
                      setMileageKm(e.target.value === '' ? '' : e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))
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
                  type="number" onFocus={(e) => e.target.select()}
                  min="0"
                  step="1000"
                  value={initialLaborPrice}
                  onChange={(e) => setInitialLaborPrice(Number(e.target.value))}
                  className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anticipo Recibido ($ COP)
                </label>
                <input
                  type="number" onFocus={(e) => e.target.select()}
                  min="0"
                  step="1000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
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
                {Number(depositAmount || 0) > 0 && (
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
            <Button size="md" variant="primary" onClick={handleFinalizeReception} isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>Crear Orden de Trabajo</Button>
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
              La bicicleta ha sido ingresada al taller, inventario de accesorios y diagrama de daños vinculado.
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
              <span className="text-slate-400 block text-[10px] uppercase font-bold">ESTADO</span>
              <Badge status={createdOrder.status} size="sm" isMono />
              <span className="block text-[10px] text-emerald-600 font-semibold mt-1">
                Ingresada Correctamente ✓
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
              <Button
                variant="primary"
                size="md"
                onClick={() => setWhatsappModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
                leftIcon={<MessageCircle className="w-4 h-4" />}
              >
                Notificar por WhatsApp
              </Button>
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
                setBicycleInfo('');
                setReportedIssues('');
                
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
      

      {/* Comprobante Térmico POS (58 mm) */}
      <WorkOrderTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        order={createdOrder}
      />

      {/* Modal de Escaneo de QR para Selección Automática */}
      

      {/* Modal de Envío de WhatsApp con Bitácora */}
      <WhatsAppComposeModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        customer={createdOrder?.customer}
        workOrder={createdOrder}
        bicycle={createdOrder?.bicycle}
        defaultTrigger="RECIBIDA"
      />
    </div>
  );
};
