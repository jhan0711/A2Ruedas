import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Printer,
  Sliders,
  Search,
  Receipt,
  CheckCircle2,
  RotateCcw,
  Eye,
  FileText,
  DollarSign,
  QrCode,
  Tag,
  Settings,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  Customer,
  WorkOrder,
  Bicycle,
  Invoice,
  CashRegister,
  CashRegisterSummary,
  PrinterSettings,
  Signature,
} from '../../types/database';
import { workOrderService } from '../../services/workOrderService';
import { bicycleService } from '../../services/bicycleService';
import { invoiceService } from '../../services/invoiceService';
import { cashService } from '../../services/cashService';
import { printerService } from '../../services/printerService';
import {
  printDirectHtml,
  generateBikeTagThermalHtml,
  generateReceptionTicketHtml,
  generateWorkOrderTicketHtml,
  generateInvoiceThermalTicketHtml,
  generateCashRegisterTicketHtml,
  generateTestTicketHtml,
} from '../../utils/printUtils';
import { generateQRDataURL, buildPublicBikeUrl } from '../../utils/qrUtils';
import {
  Button,
  Input,
  Select,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  ConfirmModal,
  Alert,
  LoadingSpinner,
} from '../../components/ui';

type TemplateType =
  | 'BIKE_TAG'
  | 'RECEPTION'
  | 'WORK_ORDER'
  | 'INVOICE'
  | 'CASH_REGISTER'
  | 'TEST';

const SAMPLE_CUSTOMER: Customer = {
  id: 'cust-sample',
  full_name: 'Carlos Mendoza (Cliente Muestra)',
  document_id: '1.020.345.678',
  phone: '3104567890',
  email: 'cliente@ejemplo.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SAMPLE_BICYCLE: Bicycle = {
  id: 'sample-bike-001',
  customer_id: 'cust-sample',
  customer: SAMPLE_CUSTOMER,
  brand: 'Trek',
  model: 'Marlin 7',
  color: 'Rojo / Negro',
  bike_type: 'MTB',
  serial_number: 'WTU1234567M',
  qr_code: 'BIKE-8F3A92',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SAMPLE_WORK_ORDER: WorkOrder = {
  id: 'sample-wo-001',
  order_number: 'OT-000001',
  customer_id: 'cust-sample',
  customer: SAMPLE_CUSTOMER,
  bicycle_id: 'sample-bike-001',
  bicycle: SAMPLE_BICYCLE,
  status: 'EN_REPARACION',
  reported_issues: 'Cambios saltan al pedalear en subida. Ruido metálico en tensor.',
  accessories_received: 'Ciclocomputador Cateye, soporte de termo',
  entry_mileage_km: 1250,
  estimated_delivery_at: new Date(Date.now() + 86400000).toISOString(),
  total_labor: 55000,
  total_parts: 60000,
  discount: 5000,
  grand_total: 110000,
  internal_notes: 'Bicicleta en banco de trabajo.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: 'woi-1',
      work_order_id: 'sample-wo-001',
      item_type: 'service',
      description: 'Mantenimiento General y Calibración',
      quantity: 1,
      unit_price: 55000,
      total_price: 55000,
      created_at: new Date().toISOString(),
    },
    {
      id: 'woi-2',
      work_order_id: 'sample-wo-001',
      item_type: 'part',
      description: 'Cadena Shimano 9V Deore CN-HG53',
      quantity: 1,
      unit_price: 60000,
      total_price: 60000,
      created_at: new Date().toISOString(),
    },
  ],
};

const SAMPLE_INVOICE: Invoice = {
  id: 'sample-inv-001',
  invoice_number: 'FAC-000001',
  customer_id: 'cust-sample',
  customer: SAMPLE_CUSTOMER,
  work_order_id: 'sample-wo-001',
  payment_method: 'CASH',
  payment_status: 'PAID',
  subtotal: 125000,
  discount: 10000,
  tax: 0,
  tax_rate: 0,
  total: 115000,
  issued_by: 'Administrador Taller',
  notes: 'Plantilla de muestra oficial para calibración de ticket térmico 58mm / 80mm.',
  created_at: new Date().toISOString(),
  items: [
    {
      id: 'inv-item-1',
      invoice_id: 'sample-inv-001',
      description: 'Mantenimiento General y Ajuste de Frenos',
      quantity: 1,
      unit_price: 65000,
      total_price: 65000,
    },
    {
      id: 'inv-item-2',
      invoice_id: 'sample-inv-001',
      description: 'Pastillas de Freno Shimano B05S Resina',
      quantity: 1,
      unit_price: 45000,
      total_price: 45000,
    },
    {
      id: 'inv-item-3',
      invoice_id: 'sample-inv-001',
      description: 'Lubricante Seco Finish Line Teflon',
      quantity: 1,
      unit_price: 15000,
      total_price: 15000,
    },
  ],
};

const SAMPLE_CASH_REGISTER: CashRegister = {
  id: 'sample-reg-001',
  opened_by: 'Administrador Taller',
  opened_at: new Date().toISOString(),
  initial_amount: 100000,
  status: 'OPEN',
  notes: 'Plantilla de muestra para arqueo de caja.',
};

const SAMPLE_CASH_SUMMARY: CashRegisterSummary = {
  initialAmount: 100000,
  totalCashIncome: 250000,
  totalCashExpense: 30000,
  expectedCashInDrawer: 320000,
  totalTransferIncome: 85000,
  totalCardIncome: 120000,
  totalOtherIncome: 0,
  totalIncome: 455000,
  totalExpense: 30000,
  netBalance: 425000,
  movementsCount: 8,
};

export const ThermalPrintPage: React.FC = () => {
  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'studio' | 'search' | 'settings'>('studio');

  // Configuración del taller
  const [settings, setSettings] = useState<PrinterSettings>(() => printerService.getSettings());
  const [tempSettings, setTempSettings] = useState<PrinterSettings>(() => printerService.getSettings());

  // Estados de datos
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [activeRegister, setActiveRegister] = useState<CashRegister | null>(null);
  const [cashSummaries, setCashSummaries] = useState<Record<string, CashRegisterSummary>>({});
  const [signaturesMap, setSignaturesMap] = useState<Record<string, Signature | null>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Selector de plantilla en el Estudio
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('BIKE_TAG');

  // Documentos seleccionados para previsualización
  const [selectedBikeId, setSelectedBikeId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('');

  // HTML generado en vivo para la vista previa
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Estados de búsqueda / reimpresión
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState<'ALL' | 'ORDERS' | 'INVOICES' | 'BIKES' | 'CASH'>('ALL');

  // Notificaciones y Modales
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Carga inicial de datos
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [ordersData, bikesData, invoicesData, pastRegs, activeReg] = await Promise.all([
        workOrderService.getWorkOrders(),
        bicycleService.getBicycles(),
        invoiceService.getInvoices(),
        cashService.getPastRegisters(),
        cashService.getActiveRegister(),
      ]);

      // Enriquecer bicicletas con QR
      const enrichedBikes = await Promise.all(
        bikesData.map(async (bike) => {
          if (bike.qr_code) return bike;
          try {
            const qr = await bicycleService.getOrGenerateQRCode(bike.id);
            return { ...bike, qr_code: qr.qr_code };
          } catch {
            return bike;
          }
        })
      );

      setWorkOrders(ordersData);
      setBicycles(enrichedBikes);
      setInvoices(invoicesData);

      const allRegs = activeReg ? [activeReg, ...pastRegs] : pastRegs;
      setCashRegisters(allRegs);
      setActiveRegister(activeReg);

      // Calcular resúmenes de caja
      const summaries: Record<string, CashRegisterSummary> = {};
      for (const reg of allRegs) {
        const movs = await cashService.getMovements(reg.id);
        summaries[reg.id] = cashService.calculateSummary(reg, movs);
      }
      setCashSummaries(summaries);

      // Cargar firmas de órdenes
      const sigs: Record<string, Signature | null> = {};
      for (const ord of ordersData) {
        const orderSigs = await workOrderService.getSignatures(ord.id);
        sigs[ord.id] = orderSigs.length > 0 ? orderSigs[0] : null;
      }
      setSignaturesMap(sigs);

      // Asignar selecciones predeterminadas (o muestra para calibración si la BD está limpia)
      setSelectedBikeId(enrichedBikes.length > 0 ? enrichedBikes[0].id : 'sample');
      setSelectedOrderId(ordersData.length > 0 ? ordersData[0].id : 'sample');
      setSelectedInvoiceId(invoicesData.length > 0 ? invoicesData[0].id : 'sample');
      setSelectedRegisterId(allRegs.length > 0 ? allRegs[0].id : 'sample');
    } catch (err) {
      console.error('Error al cargar datos para el centro de impresión:', err);
      showAlert('error', 'Error al cargar los documentos del taller.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage((current) => (current?.text === text ? null : current));
    }, 4500);
  };

  // Generador de Vista Previa en Vivo
  useEffect(() => {
    let isCancelled = false;

    const generatePreview = async () => {
      setIsGeneratingPreview(true);
      try {
        let html = '';

        if (selectedTemplate === 'TEST') {
          html = generateTestTicketHtml(settings);
        } else if (selectedTemplate === 'BIKE_TAG') {
          const bike =
            (selectedBikeId !== 'sample' && bicycles.find((b) => b.id === selectedBikeId)) ||
            bicycles[0] ||
            SAMPLE_BICYCLE;
          const qrCodeValue = bike.qr_code || 'BIKE-8F3A92';
          const publicUrl = buildPublicBikeUrl(qrCodeValue);
          const qrDataUrl = await generateQRDataURL(publicUrl, {
            width: 240,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });
          const relatedOrder =
            workOrders.find(
              (o) => o.bicycle_id === bike.id && o.status !== 'ENTREGADA' && o.status !== 'CANCELADA'
            ) || SAMPLE_WORK_ORDER;
          html = generateBikeTagThermalHtml(bike, relatedOrder, qrDataUrl, settings);
        } else if (selectedTemplate === 'RECEPTION') {
          const order =
            (selectedOrderId !== 'sample' && workOrders.find((o) => o.id === selectedOrderId)) ||
            workOrders[0] ||
            SAMPLE_WORK_ORDER;
          const sig = (order.id && signaturesMap[order.id]) || null;
          html = generateReceptionTicketHtml(order, sig, settings);
        } else if (selectedTemplate === 'WORK_ORDER') {
          const order =
            (selectedOrderId !== 'sample' && workOrders.find((o) => o.id === selectedOrderId)) ||
            workOrders[0] ||
            SAMPLE_WORK_ORDER;
          const sig = (order.id && signaturesMap[order.id]) || null;
          html = generateWorkOrderTicketHtml(order, sig, settings);
        } else if (selectedTemplate === 'INVOICE') {
          const inv =
            (selectedInvoiceId !== 'sample' && invoices.find((i) => i.id === selectedInvoiceId)) ||
            invoices[0] ||
            SAMPLE_INVOICE;
          html = generateInvoiceThermalTicketHtml(inv, settings);
        } else if (selectedTemplate === 'CASH_REGISTER') {
          const reg =
            (selectedRegisterId !== 'sample' && cashRegisters.find((r) => r.id === selectedRegisterId)) ||
            activeRegister ||
            cashRegisters[0] ||
            SAMPLE_CASH_REGISTER;
          const summary =
            (reg.id && cashSummaries[reg.id]) ||
            SAMPLE_CASH_SUMMARY;
          html = generateCashRegisterTicketHtml(reg, summary, settings);
        }

        if (!isCancelled) {
          setPreviewHtml(html);
        }
      } catch (err) {
        console.error('Error al generar vista previa térmica:', err);
      } finally {
        if (!isCancelled) setIsGeneratingPreview(false);
      }
    };

    generatePreview();

    return () => {
      isCancelled = true;
    };
  }, [
    selectedTemplate,
    selectedBikeId,
    selectedOrderId,
    selectedInvoiceId,
    selectedRegisterId,
    settings,
    bicycles,
    workOrders,
    invoices,
    cashRegisters,
    cashSummaries,
    signaturesMap,
    activeRegister,
  ]);

  // Manejador de Impresión Directa en el Estudio
  const handlePrintStudio = () => {
    if (!previewHtml) {
      showAlert('warning', 'No hay contenido para imprimir.');
      return;
    }
    printDirectHtml(previewHtml);
    showAlert('success', 'Documento enviado a la impresora térmica (58 mm).');
  };

  // Manejador de Impresión de Tirilla de Prueba
  const handlePrintTestTicket = () => {
    const testHtml = generateTestTicketHtml(settings);
    printDirectHtml(testHtml);
    showAlert('success', 'Tirilla de prueba enviada a la impresora térmica.');
  };

  // Guardar Parámetros de Impresión
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = printerService.saveSettings(tempSettings);
    setSettings(updated);
    showAlert('success', 'Configuración de impresión guardada con éxito.');
  };

  // Restablecer Configuración de Fábrica
  const handleConfirmResetSettings = () => {
    const reset = printerService.resetSettings();
    setSettings(reset);
    setTempSettings(reset);
    setResetModalOpen(false);
    showAlert('info', 'Parámetros de impresión térmica restablecidos a valores de fábrica.');
  };

  // Copiar Código HTML al Portapapeles
  const handleCopyHtml = () => {
    if (!previewHtml) return;
    navigator.clipboard.writeText(previewHtml);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showAlert('info', 'Código HTML copiado al portapapeles.');
  };

  // Filtrado de Documentos para Búsqueda Rápida
  const filteredSearchItems = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    type PrintableItem = {
      type: 'ORDER' | 'INVOICE' | 'BIKE' | 'CASH';
      id: string;
      code: string;
      title: string;
      subtitle: string;
      date: string;
      amount?: number;
      raw: WorkOrder | Invoice | Bicycle | CashRegister;
    };

    const items: PrintableItem[] = [];

    // Órdenes
    if (searchCategory === 'ALL' || searchCategory === 'ORDERS') {
      workOrders.forEach((o) => {
        const matches =
          !term ||
          o.order_number.toLowerCase().includes(term) ||
          (o.customer?.full_name && o.customer.full_name.toLowerCase().includes(term)) ||
          (o.bicycle?.brand && o.bicycle.brand.toLowerCase().includes(term)) ||
          (o.bicycle?.model && o.bicycle.model.toLowerCase().includes(term));
        if (matches) {
          items.push({
            type: 'ORDER',
            id: o.id,
            code: o.order_number,
            title: `${o.bicycle?.brand || 'Bicicleta'} ${o.bicycle?.model || ''}`,
            subtitle: `Cliente: ${o.customer?.full_name || 'Sin asignar'} • Estado: ${o.status}`,
            date: new Date(o.created_at).toLocaleDateString('es-CO'),
            amount: o.grand_total,
            raw: o,
          });
        }
      });
    }

    // Facturas
    if (searchCategory === 'ALL' || searchCategory === 'INVOICES') {
      invoices.forEach((inv) => {
        const matches =
          !term ||
          inv.invoice_number.toLowerCase().includes(term) ||
          (inv.customer?.full_name && inv.customer.full_name.toLowerCase().includes(term)) ||
          (inv.customer?.document_id && inv.customer.document_id.includes(term));
        if (matches) {
          items.push({
            type: 'INVOICE',
            id: inv.id,
            code: inv.invoice_number,
            title: `Factura de Venta • ${inv.payment_method}`,
            subtitle: `Cliente: ${inv.customer?.full_name || 'Consumidor Final'} • Estado: ${inv.payment_status}`,
            date: new Date(inv.created_at).toLocaleDateString('es-CO'),
            amount: inv.total,
            raw: inv,
          });
        }
      });
    }

    // Bicicletas
    if (searchCategory === 'ALL' || searchCategory === 'BIKES') {
      bicycles.forEach((b) => {
        const matches =
          !term ||
          (b.qr_code && b.qr_code.toLowerCase().includes(term)) ||
          b.brand.toLowerCase().includes(term) ||
          b.model.toLowerCase().includes(term) ||
          (b.serial_number && b.serial_number.toLowerCase().includes(term)) ||
          (b.customer?.full_name && b.customer.full_name.toLowerCase().includes(term));
        if (matches) {
          items.push({
            type: 'BIKE',
            id: b.id,
            code: b.qr_code || 'SIN-QR',
            title: `${b.brand} ${b.model}`,
            subtitle: `Propietario: ${b.customer?.full_name || 'No registrado'} • Serial: ${b.serial_number || 'N/A'}`,
            date: new Date(b.created_at).toLocaleDateString('es-CO'),
            raw: b,
          });
        }
      });
    }

    // Cajas
    if (searchCategory === 'ALL' || searchCategory === 'CASH') {
      cashRegisters.forEach((reg) => {
        const matches =
          !term ||
          reg.id.toLowerCase().includes(term) ||
          reg.opened_by.toLowerCase().includes(term) ||
          (reg.closed_by && reg.closed_by.toLowerCase().includes(term));
        if (matches) {
          items.push({
            type: 'CASH',
            id: reg.id,
            code: `CAJA-${reg.id.slice(0, 8).toUpperCase()}`,
            title: `Sesión de Caja (${reg.status === 'OPEN' ? 'ABIERTA' : 'CERRADA'})`,
            subtitle: `Apertura: ${reg.opened_by} • Base: $${reg.initial_amount.toLocaleString('es-CO')}`,
            date: new Date(reg.opened_at).toLocaleDateString('es-CO'),
            amount: reg.final_counted_amount ?? undefined,
            raw: reg,
          });
        }
      });
    }

    return items;
  }, [searchTerm, searchCategory, workOrders, invoices, bicycles, cashRegisters]);

  // Impresión rápida desde la tabla de búsqueda
  const handleQuickPrint = async (item: {
    type: 'ORDER' | 'INVOICE' | 'BIKE' | 'CASH';
    raw: WorkOrder | Invoice | Bicycle | CashRegister;
    variant?: 'TAG' | 'RECEPTION' | 'DELIVERY';
  }) => {
    try {
      if (item.type === 'ORDER') {
        const order = item.raw as WorkOrder;
        const sig = signaturesMap[order.id] || null;
        if (item.variant === 'TAG') {
          const bike = order.bicycle || bicycles.find((b) => b.id === order.bicycle_id);
          if (bike) {
            const qrCodeVal = bike.qr_code || 'BIKE-000000';
            const publicUrl = buildPublicBikeUrl(qrCodeVal);
            const qrDataUrl = await generateQRDataURL(publicUrl, {
              width: 240,
              margin: 1,
              color: { dark: '#000000', light: '#ffffff' },
            });
            const html = generateBikeTagThermalHtml(bike, order, qrDataUrl, settings);
            printDirectHtml(html);
            showAlert('success', `Marbete de bicicleta impreso para la orden ${order.order_number}.`);
          }
        } else if (item.variant === 'RECEPTION') {
          const html = generateReceptionTicketHtml(order, sig, settings);
          printDirectHtml(html);
          showAlert('success', `Comprobante de recepción impreso para la orden ${order.order_number}.`);
        } else {
          const html = generateWorkOrderTicketHtml(order, sig, settings);
          printDirectHtml(html);
          showAlert('success', `Liquidación de orden impresa para ${order.order_number}.`);
        }
      } else if (item.type === 'INVOICE') {
        const inv = item.raw as Invoice;
        const html = generateInvoiceThermalTicketHtml(inv, settings);
        printDirectHtml(html);
        showAlert('success', `Tirilla de factura ${inv.invoice_number} impresa.`);
      } else if (item.type === 'BIKE') {
        const bike = item.raw as Bicycle;
        const qrCodeVal = bike.qr_code || 'BIKE-000000';
        const publicUrl = buildPublicBikeUrl(qrCodeVal);
        const qrDataUrl = await generateQRDataURL(publicUrl, {
          width: 240,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        const html = generateBikeTagThermalHtml(bike, null, qrDataUrl, settings);
        printDirectHtml(html);
        showAlert('success', `Marbete adhesivo para ${bike.brand} ${bike.model} impreso.`);
      } else if (item.type === 'CASH') {
        const reg = item.raw as CashRegister;
        const summary =
          cashSummaries[reg.id] ||
          cashService.calculateSummary(reg, []);
        const html = generateCashRegisterTicketHtml(reg, summary, settings);
        printDirectHtml(html);
        showAlert('success', `Comprobante de cierre de caja impreso.`);
      }
    } catch (err) {
      console.error('Error al imprimir documento:', err);
      showAlert('error', 'Error al enviar a la impresora térmica.');
    }
  };

  // Cargar en el estudio desde el buscador
  const handleOpenInStudio = (item: {
    type: 'ORDER' | 'INVOICE' | 'BIKE' | 'CASH';
    raw: WorkOrder | Invoice | Bicycle | CashRegister;
  }) => {
    if (item.type === 'ORDER') {
      setSelectedOrderId((item.raw as WorkOrder).id);
      setSelectedTemplate('WORK_ORDER');
    } else if (item.type === 'INVOICE') {
      setSelectedInvoiceId((item.raw as Invoice).id);
      setSelectedTemplate('INVOICE');
    } else if (item.type === 'BIKE') {
      setSelectedBikeId((item.raw as Bicycle).id);
      setSelectedTemplate('BIKE_TAG');
    } else if (item.type === 'CASH') {
      setSelectedRegisterId((item.raw as CashRegister).id);
      setSelectedTemplate('CASH_REGISTER');
    }
    setActiveTab('studio');
  };

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Cargando documentos del taller y plantillas térmicas...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Centro de Impresión Térmica (58 mm)
                <Badge variant="success" size="sm">
                  {settings.paper_width} POS
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plantillas continuas de alta densidad, marbetes de bicicleta con QR y comprobantes operativos.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas del Encabezado */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrintTestTicket}
            leftIcon={<Sliders className="w-3.5 h-3.5 text-slate-400" />}
            title="Imprime una tirilla de calibración con regla milimétrica y barra de densidad"
            className="shadow-xs"
          >
            Tirilla de Calibración
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrintStudio}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-blue-500"
          >
            Imprimir Actual (58 mm)
          </Button>
        </div>
      </div>

      {/* Alerta de notificación */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* Pestañas de Navegación */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
            activeTab === 'studio'
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          Estudio y Previsualizador en Vivo
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          Buscador y Reimpresión Rápida
        </button>

        <button
          onClick={() => {
            setTempSettings({ ...settings });
            setActiveTab('settings');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuración del Taller y Hardware
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}

      {/* PESTAÑA 1: ESTUDIO Y PREVISUALIZADOR EN VIVO */}
      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Configuración de Plantilla y Selector de Documento (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Selector de Plantilla */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1. Selección de Plantilla Térmica
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  {selectedTemplate === 'BIKE_TAG'
                    ? 'Adhesivo Marco con QR'
                    : selectedTemplate === 'RECEPTION'
                    ? 'Custodia e Inventario'
                    : selectedTemplate === 'WORK_ORDER'
                    ? 'Liquidación y Mano de Obra'
                    : selectedTemplate === 'INVOICE'
                    ? 'Ticket Factura POS'
                    : selectedTemplate === 'CASH_REGISTER'
                    ? 'Arqueo de Gaveta'
                    : 'Calibración Milimétrica'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('BIKE_TAG')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    selectedTemplate === 'BIKE_TAG'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                      QR Bici
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Marbete Bicicleta</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      Adhesivo de marco con QR
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('RECEPTION')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    selectedTemplate === 'RECEPTION'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                      Entrada
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Recepción Taller</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      Custodia e inventario
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('WORK_ORDER')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    selectedTemplate === 'WORK_ORDER'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                      Entrega
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Orden de Trabajo</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      Liquidación y repuestos
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('INVOICE')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    selectedTemplate === 'INVOICE'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      POS
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Factura de Venta</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      Comprobante comercial
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('CASH_REGISTER')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    selectedTemplate === 'CASH_REGISTER'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                      Cierre
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Arqueo de Caja</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      Cierre diario de gaveta
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate('TEST')}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                    selectedTemplate === 'TEST'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sliders className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                      Diagnóstico
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">Calibración</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      Regla milimétrica y corte
                    </div>
                  </div>
                </button>
              </div>
            </Card>

            {/* 2. Selector del Documento Real */}
            <Card className="p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Seleccionar Registro a Visualizar
              </span>

              {selectedTemplate === 'TEST' && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                  ℹ️ Esta tirilla se genera dinámicamente según los parámetros configurados en el taller (ancho de {settings.paper_width}, densidad tipográfica {settings.font_density} y líneas de avance de corte {settings.feed_lines}).
                </div>
              )}

              {selectedTemplate === 'BIKE_TAG' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Bicicleta registrada con Código QR:
                    </label>
                    {bicycles.length === 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Plantilla de Muestra
                      </span>
                    )}
                  </div>
                  <Select
                    value={selectedBikeId}
                    onChange={(e) => setSelectedBikeId(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="sample">
                      📄 [Plantilla de Muestra] Trek Marlin 7 • [BIKE-8F3A92] • Carlos Mendoza
                    </option>
                    {bicycles.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.brand} {b.model} • [{b.qr_code || 'SIN-QR'}] • Prop:{' '}
                        {b.customer?.full_name || 'Sin asignar'}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {(selectedTemplate === 'RECEPTION' || selectedTemplate === 'WORK_ORDER') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Orden de Trabajo (OT) del taller:
                    </label>
                    {workOrders.length === 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Plantilla de Muestra
                      </span>
                    )}
                  </div>
                  <Select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="sample">
                      📄 [Plantilla de Muestra] OT-000001 • Trek Marlin 7 • Carlos Mendoza • $110.000
                    </option>
                    {workOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} • {o.bicycle?.brand} {o.bicycle?.model} •{' '}
                        {o.customer?.full_name || 'Consumidor Final'} • ${o.grand_total.toLocaleString('es-CO')}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {selectedTemplate === 'INVOICE' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Factura de venta emitida:
                    </label>
                    {invoices.length === 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Plantilla de Muestra
                      </span>
                    )}
                  </div>
                  <Select
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="sample">
                      📄 [Plantilla de Muestra Oficial] FAC-000001 • Carlos Mendoza • $115.000 (Calibración)
                    </option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} • {inv.customer?.full_name || 'Consumidor Final'} • ${inv.total.toLocaleString('es-CO')} • ({inv.payment_status})
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {selectedTemplate === 'CASH_REGISTER' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Sesión de Caja para Comprobante de Arqueo:
                    </label>
                    {cashRegisters.length === 0 && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Plantilla de Muestra
                      </span>
                    )}
                  </div>
                  <Select
                    value={selectedRegisterId}
                    onChange={(e) => setSelectedRegisterId(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="sample">
                      📄 [Plantilla de Muestra] 🟢 SESIÓN EN VIVO • Cierre Diario y Arqueo de Gaveta
                    </option>
                    {cashRegisters.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.status === 'OPEN' ? '🟢 EN VIVO' : '⚪ CERRADA'} • ID:{' '}
                        {reg.id.slice(0, 10).toUpperCase()} • {reg.opened_by} •{' '}
                        {new Date(reg.opened_at).toLocaleDateString('es-CO')}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </Card>

            {/* 3. Acciones de Impresión y Código */}
            <Card className="p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Disparo de Impresión de Alta Precisión
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePrintStudio}
                  disabled={isGeneratingPreview || !previewHtml}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md border-blue-500"
                >
                  Imprimir en Térmica (58 mm)
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCopyHtml}
                  leftIcon={
                    copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )
                  }
                  className="shadow-xs"
                >
                  {copiedCode ? '¡Copiado!' : 'Copiar HTML'}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={loadAllData}
                  leftIcon={<RefreshCw className="w-4 h-4 text-slate-400" />}
                  className="shadow-xs"
                >
                  Actualizar Datos
                </Button>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Motor de impresión universal por iframe: sin ventanas emergentes en blanco ni bloqueos de navegador.
              </div>
            </Card>
          </div>

          {/* Columna Derecha: Simulador de Rollo Continuo de Papel Térmico (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Previsualización Realista
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Rollo {settings.paper_width}
                </span>
                {((selectedTemplate === 'INVOICE' && (invoices.length === 0 || selectedInvoiceId === 'sample')) ||
                  (selectedTemplate === 'BIKE_TAG' && (bicycles.length === 0 || selectedBikeId === 'sample')) ||
                  (selectedTemplate === 'RECEPTION' && (workOrders.length === 0 || selectedOrderId === 'sample')) ||
                  (selectedTemplate === 'WORK_ORDER' && (workOrders.length === 0 || selectedOrderId === 'sample')) ||
                  (selectedTemplate === 'CASH_REGISTER' && (cashRegisters.length === 0 || selectedRegisterId === 'sample'))) && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Plantilla de Muestra
                  </span>
                )}
              </div>
              {isGeneratingPreview && (
                <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
                  <LoadingSpinner size="sm" />
                  <span>Renderizando...</span>
                </div>
              )}
            </div>

            {/* Contenedor del Rollo Térmico Físico */}
            <div className="w-full bg-slate-900/90 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl flex flex-col items-center shadow-inner border border-slate-800">
              <div
                style={{ width: '100%', maxWidth: '300px' }}
                className="bg-white rounded-sm shadow-2xl border border-slate-300 flex flex-col overflow-hidden text-black transition-all"
              >
                {/* Diente de corte superior */}
                <div className="bg-slate-100 border-b border-dashed border-slate-400 py-1 text-center text-[9px] font-mono text-slate-500 select-none">
                  - - - - - - - CORTE SUPERIOR - - - - - - -
                </div>

                {/* Contenedor Iframe con el ticket renderizado de forma aislada */}
                <div className="w-full bg-white min-h-[460px] max-h-[580px] overflow-y-auto">
                  <iframe
                    ref={previewIframeRef}
                    srcDoc={previewHtml}
                    title="Simulador de Rollo Térmico"
                    className="w-full h-[580px] border-0 pointer-events-auto"
                  />
                </div>

                {/* Diente de corte inferior */}
                <div className="bg-slate-100 border-t border-dashed border-slate-400 py-1 text-center text-[9px] font-mono text-slate-500 select-none">
                  - - - - - - - CORTE INFERIOR - - - - - - -
                </div>
              </div>

              {/* Pie explicativo del rollo */}
              <div className="mt-3 text-center text-[11px] text-slate-400 font-mono">
                Ancho útil: {settings.paper_width === '80mm' ? '72 mm' : '52 mm'} • Densidad: {settings.font_density}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: BUSCADOR Y REIMPRESIÓN RÁPIDA */}
      {activeTab === 'search' && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Buscador */}
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, folio, serial o bici..."
                className="pl-9 text-xs"
              />
            </div>

            {/* Filtros de Categoría */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'ORDERS', label: 'Órdenes (OT)' },
                { id: 'INVOICES', label: 'Facturas' },
                { id: 'BIKES', label: 'Bicicletas' },
                { id: 'CASH', label: 'Cajas' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSearchCategory(c.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    searchCategory === c.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Reimpresión */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead className="w-28">Folio / Código</TableHead>
                  <TableHead>Concepto / Detalle</TableHead>
                  <TableHead className="w-28">Fecha</TableHead>
                  <TableHead className="w-28 text-right">Monto</TableHead>
                  <TableHead className="w-[360px] text-center">Acciones de Impresión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSearchItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs">
                      No se encontraron documentos para reimpresión con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSearchItems.map((it) => (
                    <TableRow key={`${it.type}-${it.id}`}>
                      <TableCell>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            it.type === 'ORDER'
                              ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                              : it.type === 'INVOICE'
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                              : it.type === 'BIKE'
                              ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                              : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {it.type === 'ORDER'
                            ? 'Orden OT'
                            : it.type === 'INVOICE'
                            ? 'Factura'
                            : it.type === 'BIKE'
                            ? 'Marbete'
                            : 'Arqueo'}
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {it.code}
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900 dark:text-white">
                          {it.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {it.subtitle}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {it.date}
                      </TableCell>

                      <TableCell className="text-right text-xs font-mono font-bold">
                        {it.amount !== undefined ? `$${it.amount.toLocaleString('es-CO')}` : '—'}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          {it.type === 'ORDER' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickPrint({ ...it, variant: 'TAG' })}
                                title="Imprimir Marbete con Código QR para marco de bicicleta"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-300 hover:bg-blue-500/25 border border-blue-500/30 transition-colors shadow-xs"
                              >
                                <QrCode className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                Marbete QR
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickPrint({ ...it, variant: 'RECEPTION' })}
                                title="Imprimir Comprobante de Recepción y Custodia de Taller"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-colors shadow-xs"
                              >
                                <Tag className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                                Recepción
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickPrint({ ...it, variant: 'DELIVERY' })}
                                title="Imprimir Liquidación y Entrega de Orden OT"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors shadow-xs"
                              >
                                <Printer className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                Entrega OT
                              </button>
                            </>
                          )}

                          {it.type === 'INVOICE' && (
                            <button
                              type="button"
                              onClick={() => handleQuickPrint(it)}
                              title="Imprimir Factura de Venta POS (58 mm)"
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors shadow-xs"
                            >
                              <Printer className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              Imprimir Factura
                            </button>
                          )}

                          {it.type === 'BIKE' && (
                            <button
                              type="button"
                              onClick={() => handleQuickPrint(it)}
                              title="Imprimir Marbete Adhesivo con QR"
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 transition-colors shadow-xs"
                            >
                              <QrCode className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                              Imprimir Marbete QR
                            </button>
                          )}

                          {it.type === 'CASH' && (
                            <button
                              type="button"
                              onClick={() => handleQuickPrint(it)}
                              title="Imprimir Comprobante de Arqueo de Caja"
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 transition-colors shadow-xs"
                            >
                              <DollarSign className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                              Imprimir Arqueo
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenInStudio(it)}
                            title="Abrir en el Estudio para ver vista previa"
                            className="inline-flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* PESTAÑA 3: CONFIGURACIÓN DEL TALLER Y HARDWARE */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Parámetros de Identificación del Taller y Cabeceras Térmicas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estos datos se imprimen automáticamente en la cabecera y pie de todas las tirillas y marbetes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Comercial del Taller
                </label>
                <Input
                  type="text"
                  value={tempSettings.workshop_name}
                  onChange={(e) => setTempSettings({ ...tempSettings, workshop_name: e.target.value })}
                  placeholder="Ej: A2RUEDAS TALLER"
                  className="text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NIT / Identificación Tributaria
                </label>
                <Input
                  type="text"
                  value={tempSettings.workshop_nit}
                  onChange={(e) => setTempSettings({ ...tempSettings, workshop_nit: e.target.value })}
                  placeholder="Ej: 901.452.879-1"
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <Input
                  type="text"
                  value={tempSettings.workshop_phone}
                  onChange={(e) => setTempSettings({ ...tempSettings, workshop_phone: e.target.value })}
                  placeholder="Ej: (+57) 310 456 7890"
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Física del Establecimiento
                </label>
                <Input
                  type="text"
                  value={tempSettings.workshop_address}
                  onChange={(e) => setTempSettings({ ...tempSettings, workshop_address: e.target.value })}
                  placeholder="Ej: Calle 123 # 45-67, Bogotá, Colombia"
                  className="text-xs"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lema / Slogan de Cabecera
                </label>
                <Input
                  type="text"
                  value={tempSettings.header_slogan}
                  onChange={(e) => setTempSettings({ ...tempSettings, header_slogan: e.target.value })}
                  placeholder="Ej: TALLER ESPECIALIZADO DE BICICLETAS"
                  className="text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mensaje de Agradecimiento / Pie de Tirilla
                </label>
                <Input
                  type="text"
                  value={tempSettings.footer_message}
                  onChange={(e) => setTempSettings({ ...tempSettings, footer_message: e.target.value })}
                  placeholder="Ej: ¡Gracias por pedalear con nosotros! 🚲"
                  className="text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cláusula Legal de Garantía y Custodia
                </label>
                <textarea
                  rows={2}
                  value={tempSettings.warranty_text}
                  onChange={(e) => setTempSettings({ ...tempSettings, warranty_text: e.target.value })}
                  placeholder="Condiciones de entrega y custodia del taller..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Parámetros de Hardware y Calibración de Impresora Térmica
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajuste fino de ancho de papel continuo, tamaño tipográfico y corte automático.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ancho del Rollo Térmico
                </label>
                <Select
                  value={tempSettings.paper_width}
                  onChange={(e) => setTempSettings({ ...tempSettings, paper_width: e.target.value as '58mm' | '80mm' })}
                  className="w-full text-xs"
                >
                  <option value="58mm">58 mm (Estándar POS - 52mm útiles)</option>
                  <option value="80mm">80 mm (Ancho POS - 72mm útiles)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Densidad Tipográfica
                </label>
                <Select
                  value={tempSettings.font_density}
                  onChange={(e) => setTempSettings({ ...tempSettings, font_density: e.target.value as any })}
                  className="w-full text-xs"
                >
                  <option value="compact">Compacta (Ahorro de papel - 9.5px)</option>
                  <option value="normal">Normal (Equilibrada - 11px)</option>
                  <option value="large">Destacada (Mayor legibilidad - 12.5px)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Líneas de Avance previo al Corte
                </label>
                <Select
                  value={String(tempSettings.feed_lines)}
                  onChange={(e) => setTempSettings({ ...tempSettings, feed_lines: Number(e.target.value) })}
                  className="w-full text-xs"
                >
                  <option value="1">1 línea (Mínimo)</option>
                  <option value="2">2 líneas</option>
                  <option value="3">3 líneas (Recomendado)</option>
                  <option value="4">4 líneas</option>
                  <option value="5">5 líneas (Cuchilla lejana)</option>
                </Select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="show_qr_code"
                checked={tempSettings.show_qr_code}
                onChange={(e) => setTempSettings({ ...tempSettings, show_qr_code: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <label htmlFor="show_qr_code" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                Habilitar generación e impresión de Código QR en tirillas y marbetes continuos
              </label>
            </div>
          </Card>

          {/* Botones de Acción de Configuración */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500/50 transition-all shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer Valores de Fábrica
            </button>

            <div className="w-full sm:w-auto flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handlePrintTestTicket}
                leftIcon={<Sliders className="w-4 h-4 text-slate-400" />}
                className="shadow-xs"
              >
                Imprimir Test de Calibración
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<Check className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-md"
              >
                Guardar Parámetros de Impresión
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Modal de Confirmación para Restablecimiento de Fábrica (Regla 44) */}
      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmResetSettings}
        title="¿Restablecer Parámetros de Impresora Térmica?"
        message="Esta acción restablecerá todas las opciones de impresión al estándar de fábrica para rollos continuos de 58 mm. El nombre del taller, NIT y cláusulas de garantía volverán a sus valores sugeridos."
        confirmText="Sí, Restablecer"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
