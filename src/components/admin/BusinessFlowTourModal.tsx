import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Bike,
  Wrench,
  Receipt,
  Wallet,
  ExternalLink,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '../ui';

interface BusinessFlowTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JourneyStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  route: string;
  buttonText: string;
  description: string;
  checklist: string[];
  tips: string;
}

const JOURNEYS: JourneyStep[] = [
  {
    id: 1,
    title: 'Jornada 1: Recepción, Daños Previos y Marbete QR',
    subtitle: 'El cliente llega al taller a dejar su bicicleta',
    icon: <ClipboardList className="w-6 h-6 text-blue-500" />,
    route: '/admin/ordenes/nueva',
    buttonText: 'Probar Recepción de Bicicleta',
    description:
      'Registra al cliente, la bicicleta, documenta los rayones o golpes previos en el diagrama interactivo de la bici para proteger al taller legalmente, registra accesorios en custodia (luces, velocímetro) y solicita la firma digital táctil en pantalla.',
    checklist: [
      'Búsqueda o creación rápida del cliente con celular.',
      'Diagrama anatómico interactivo para marcar partes rayadas o dañadas.',
      'Inventario de accesorios recibidos en custodia.',
      'Firma digital táctil directa sobre la pantalla.',
      'Generación automática del marbete adhesivo con código QR para el marco.',
    ],
    tips: 'Consejo: Puedes imprimir el marbete adhesivo en tu impresora térmica de 58 mm o con cinta adhesiva para adherirlo al marco de la bici.',
  },
  {
    id: 2,
    title: 'Jornada 2: Diagnóstico, Presupuesto y WhatsApp',
    subtitle: 'El mecánico diagnostica y envía cotización al cliente',
    icon: <Wrench className="w-6 h-6 text-amber-500" />,
    route: '/admin/ordenes',
    buttonText: 'Ver Órdenes de Trabajo',
    description:
      'El mecánico inspecciona la bicicleta y define los servicios de mano de obra y repuestos necesarios. El sistema calcula subtotales, permite aplicar descuentos comerciales y genera el mensaje de WhatsApp para que el cliente apruebe el presupuesto.',
    checklist: [
      'Selección de servicios técnicos de taller (ej. Mantenimiento General).',
      'Adición de repuestos desde el inventario del taller.',
      'Cálculo automático de subtotales, anticipo recibido y saldo a pagar.',
      'Generación de mensaje de WhatsApp con formato colombiano (+57) para aprobación.',
    ],
    tips: 'Consejo: Desde el menú de la orden puedes hacer clic en el ícono verde de WhatsApp para abrir el chat con el mensaje pre-construido en 1 solo clic.',
  },
  {
    id: 3,
    title: 'Jornada 3: Reparación Técnica y Kardex de Inventario',
    subtitle: 'El taller ejecuta el trabajo y se descuenta el stock',
    icon: <Bike className="w-6 h-6 text-indigo-500" />,
    route: '/admin/inventario',
    buttonText: 'Consultar Inventario y Kardex',
    description:
      'Conforme el trabajo avanza en el taller, la orden cambia de estado ("En Reparación" -> "Lista"). Los repuestos instalados se descuentan automáticamente del inventario (Kardex) registrando el número de orden como soporte auditable.',
    checklist: [
      'Cambio fluido de estados operacionales en la orden de trabajo.',
      'Descuento automático en el inventario de repuestos utilizados.',
      'Registro en el historial Kardex de la salida con referencia de la OT.',
      'Alertas visuales cuando las existencias llegan al stock mínimo.',
    ],
    tips: 'Consejo: Si entras a "Inventario" verás la pestaña "Kardex", donde queda asentado cada movimiento de repuesto con fecha, hora y orden asociada.',
  },
  {
    id: 4,
    title: 'Jornada 4: Facturación Rápida y Liquidación POS',
    subtitle: 'El cliente retira la bicicleta y paga el saldo',
    icon: <Receipt className="w-6 h-6 text-emerald-500" />,
    route: '/admin/facturas',
    buttonText: 'Ir al Módulo de Facturación',
    description:
      'Genera el comprobante oficial con número consecutivo correlativo (FAC-000001). Admite facturas vinculadas a la orden o ventas rápidas de mostrador para clientes que solo compran un repuesto en caja. Imprime la tirilla térmica POS de 58 mm.',
    checklist: [
      'Consecutivo correlativo estricto FAC-000001.',
      'Desglose de repuestos y mano de obra con garantía de 30 días.',
      'Soporte de múltiples medios de pago: Efectivo, Nequi, Daviplata, Tarjeta.',
      'Impresión de tirilla térmica POS de 58 mm.',
      'Sincronización automática del ingreso en la Caja Activa de la jornada.',
    ],
    tips: 'Consejo: Al cobrar la factura, el dinero entra de forma automática a la caja diaria sin que tengas que digitarlo dos veces.',
  },
  {
    id: 5,
    title: 'Jornada 5: Arqueo Diario y Cierre de Caja',
    subtitle: 'Fin de la jornada: cuadre de dinero en gaveta',
    icon: <Wallet className="w-6 h-6 text-purple-500" />,
    route: '/admin/caja',
    buttonText: 'Abrir Arqueo y Caja Diaria',
    description:
      'Al terminar el día laboral, el administrador o cajero realiza el arqueo de caja. Utiliza la calculadora de billetes colombianos, compara el efectivo contado contra el esperado y genera la tirilla de cierre contable.',
    checklist: [
      'Cálculo automático de efectivo en gaveta: Base + Entradas - Salidas.',
      'Calculadora de billetes colombianos ($100k, $50k, $20k, $10k, $5k, $2k).',
      'Detección instantánea de Caja Cuadrada ($0), Sobrante o Faltante.',
      'Cierre formal de la jornada y almacenamiento en el histórico.',
      'Impresión de la tirilla térmica de arqueo diario de 58 mm.',
    ],
    tips: 'Consejo: Una vez que cierras la caja, sus movimientos quedan blindados e inmutables para proteger la contabilidad del taller.',
  },
];

export const BusinessFlowTourModal: React.FC<BusinessFlowTourModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = JOURNEYS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < JOURNEYS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del modal */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="tour-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Guía de Flujos Reales del Taller
                </h3>
                <Badge variant="info" size="sm">
                  Fase 22 • E2E
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paso {currentStepIndex + 1} de {JOURNEYS.length}: {currentStep.title.split(':')[0]}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de progreso de 5 pasos */}
        <div className="grid grid-cols-5 gap-1 p-2 bg-slate-100 dark:bg-slate-800/50">
          {JOURNEYS.map((j, idx) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title={j.title}
            />
          ))}
        </div>

        {/* Contenido interactivo del paso */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 dark:text-slate-300">
          {/* Tarjeta de encabezado de la jornada */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-200 dark:border-slate-800 flex-shrink-0">
              {currentStep.icon}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {currentStep.title}
              </h4>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                {currentStep.subtitle}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Checklist de lo que debes probar */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              📋 ¿Qué puedes probar en esta jornada?
            </h5>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {currentStep.checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Caja de consejo práctico */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{currentStep.tips}</span>
          </div>
        </div>

        {/* Pie de navegación del modal */}
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
          <Link to={currentStep.route} onClick={onClose} className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto"
            >
              {currentStep.buttonText}
            </Button>
          </Link>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              Anterior
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {currentStepIndex === JOURNEYS.length - 1 ? 'Finalizar Guía' : 'Siguiente Jornada'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
