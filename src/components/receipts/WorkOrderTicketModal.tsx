import { Printer, QrCode } from 'lucide-react';
import { WorkOrder } from '../../types/database';
import { Button, Modal } from '../ui';

interface WorkOrderTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WorkOrder | null;
}

export const WorkOrderTicketModal: React.FC<WorkOrderTicketModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const customer = order.customer;
  const bike = order.bicycle;
  const items = order.items || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante Térmico de Orden de Trabajo (58 mm)"
      description="Vista previa calibrada para impresoras térmicas de tickets y facturas POS."
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Button size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
            Imprimir Comprobante (POS)
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center">
        {/* Contenedor de previsualización de ticket térmico */}
        <div
          id="printable-thermal-ticket"
          className="w-full max-w-[340px] bg-white text-slate-900 border border-slate-300 shadow-md p-4 rounded-sm font-mono text-[11px] leading-tight space-y-3"
        >
          {/* Encabezado del Taller */}
          <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
            <h2 className="text-sm font-black tracking-wider uppercase text-slate-900">
              A2RUEDAS TALLER
            </h2>
            <p className="text-[10px] text-slate-600">Servicio Técnico Especializado</p>
            <p className="text-[10px] text-slate-600">NIT: 901.456.789-0 • Tel: 310 456 7890</p>
            <p className="text-[10px] text-slate-500">Bogotá D.C., Colombia</p>
          </div>

          {/* Datos de la Orden */}
          <div className="space-y-1 pb-2 border-b border-dashed border-slate-400">
            <div className="flex justify-between items-center text-xs font-bold">
              <span>ORDEN DE TRABAJO:</span>
              <span className="text-blue-700">{order.order_number}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>FECHA INGRESO:</span>
              <span>{new Date(order.created_at).toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>ESTADO ACTUAL:</span>
              <span className="font-bold uppercase">{order.status}</span>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="space-y-0.5 pb-2 border-b border-dashed border-slate-400 text-[10px]">
            <span className="font-bold text-slate-700 uppercase block">DATOS DEL CLIENTE:</span>
            <div className="flex justify-between">
              <span className="text-slate-600">Nombre:</span>
              <span className="font-semibold">{customer?.full_name || 'Sin asignar'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Teléfono:</span>
              <span>{customer?.phone || 'N/A'}</span>
            </div>
            {customer?.document_id && (
              <div className="flex justify-between">
                <span className="text-slate-600">C.C. / Doc:</span>
                <span>{customer.document_id}</span>
              </div>
            )}
          </div>

          {/* Datos de la Bicicleta */}
          <div className="space-y-0.5 pb-2 border-b border-dashed border-slate-400 text-[10px]">
            <span className="font-bold text-slate-700 uppercase block">BICICLETA INGRESADA:</span>
            <div className="flex justify-between">
              <span className="text-slate-600">Marca / Modelo:</span>
              <span className="font-semibold">{bike ? `${bike.brand} ${bike.model}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tipo / Color:</span>
              <span>{bike ? `${bike.bike_type} - ${bike.color}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Serial Cuadro:</span>
              <span>{bike?.serial_number || 'Sin serial'}</span>
            </div>
          </div>

          {/* Falla Reportada y Accesorios */}
          <div className="space-y-1 pb-2 border-b border-dashed border-slate-400 text-[10px]">
            <div>
              <span className="font-bold text-slate-700 uppercase block">FALLA REPORTADA:</span>
              <p className="text-slate-800 text-[10px] leading-tight italic">
                "{order.reported_issues}"
              </p>
            </div>
            {order.accessories_received && (
              <div>
                <span className="font-bold text-slate-700 uppercase block">ACCESORIOS:</span>
                <p className="text-slate-800 text-[10px]">{order.accessories_received}</p>
              </div>
            )}
          </div>

          {/* Desglose de Servicios y Repuestos */}
          <div className="space-y-1 pb-2 border-b border-dashed border-slate-400 text-[10px]">
            <span className="font-bold text-slate-700 uppercase block">DETALLE DE INTERVENCIÓN:</span>
            {items.length === 0 ? (
              <p className="text-slate-500 italic">En evaluación diagnóstica</p>
            ) : (
              <div className="space-y-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-1">
                    <span className="flex-1">
                      {it.quantity > 1 ? `(${it.quantity}x) ` : ''}
                      {it.description}
                    </span>
                    <span className="font-semibold shrink-0">
                      ${it.total_price.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="space-y-1 pb-2 border-b border-dashed border-slate-400 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Mano de Obra:</span>
              <span>${order.total_labor.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Repuestos:</span>
              <span>${order.total_parts.toLocaleString('es-CO')}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Descuento:</span>
                <span>-${order.discount.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-black pt-1 border-t border-slate-300">
              <span>TOTAL ORDEN:</span>
              <span>${order.grand_total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          {/* Código QR y Términos */}
          <div className="text-center space-y-2 pt-1">
            <div className="inline-flex items-center gap-1 px-2 py-1 border border-slate-400 rounded text-[10px] font-bold">
              <QrCode className="w-3.5 h-3.5" />
              <span>CONSULTA QR: {order.order_number}</span>
            </div>

            <div className="pt-3 pb-2 text-[9px] text-slate-500 leading-tight">
              <p className="font-semibold text-slate-700">TÉRMINOS DE SERVICIO:</p>
              <p>• Garantía de 30 días en ajustes mecánicos.</p>
              <p>• Pasados 30 días de la notificación de retiro aplica costo de bodegaje.</p>
              <p>• Todo repuesto cambiado está a disposición del cliente.</p>
            </div>

            {/* Espacio para firma */}
            <div className="pt-6 pb-2 text-center">
              <div className="border-t border-slate-400 w-44 mx-auto pt-1 text-[9px] text-slate-600">
                Firma Conforme del Cliente
              </div>
            </div>

            <p className="text-[9px] text-slate-400 uppercase tracking-widest pt-1">
              *** GRACIAS POR SU PREFERENCIA ***
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
