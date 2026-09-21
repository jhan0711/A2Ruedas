import React, { useState, useEffect } from 'react';
import { Printer, QrCode, PenTool, FileText, Receipt, CheckCircle2 } from 'lucide-react';
import { WorkOrder, Signature } from '../../types/database';
import { workOrderService } from '../../services/workOrderService';
import { printWorkOrderDocument } from '../../utils/printUtils';
import { Button, Modal } from '../ui';

interface WorkOrderTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WorkOrder | null;
}

type PrintFormat = 'letter' | '58mm';

export const WorkOrderTicketModal: React.FC<WorkOrderTicketModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [signature, setSignature] = useState<Signature | null>(null);
  const [format, setFormat] = useState<PrintFormat>('letter'); // Predeterminado Carta/A4 para máxima claridad

  useEffect(() => {
    if (!order || !isOpen) {
      setSignature(null);
      return;
    }

    const loadSignatures = async () => {
      try {
        const sigs = await workOrderService.getSignatures(order.id);
        const receptionSig = sigs.find((s) => s.signature_type === 'reception') || sigs[0] || null;
        setSignature(receptionSig);
      } catch (err) {
        console.warn('Error al cargar firma para ticket:', err);
      }
    };

    loadSignatures();
  }, [order, isOpen]);

  if (!order) return null;

  const handlePrint = () => {
    printWorkOrderDocument(order, signature, format);
  };

  const customer = order.customer;
  const bike = order.bicycle;
  const items = order.items || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Imprimir Orden de Trabajo: ${order.order_number}`}
      description="Selecciona el formato de impresión según tu tipo de impresora o necesidad."
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Formato seleccionado:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {format === 'letter' ? 'Factura Completa (Carta / A4 / PDF)' : 'Tirilla Térmica POS (58 mm)'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button size="sm" onClick={handlePrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
              {format === 'letter' ? 'Imprimir en Hoja Carta / PDF' : 'Imprimir Tirilla (58 mm)'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Selector de Formato de Impresión */}
        <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setFormat('letter')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              format === 'letter'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hoja Completa (Carta / A4 / PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('58mm')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              format === '58mm'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Tirilla Térmica POS (58 mm)</span>
          </button>
        </div>

        {/* 1. VISTA PREVIA: FORMATO HOJA FORMAL CARTA / A4 */}
        {format === 'letter' && (
          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto flex justify-center">
            <div
              id="printable-formal-sheet"
              className="w-full max-w-[680px] bg-white text-slate-900 border border-slate-300 shadow-md p-6 sm:p-8 rounded-sm text-xs leading-normal space-y-5"
            >
              {/* Encabezado Principal */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900 gap-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black tracking-wider text-slate-950 uppercase">
                    A2RUEDAS TALLER DE BICICLETAS
                  </h1>
                  <p className="text-slate-600 font-semibold">
                    Servicio Técnico Profesional & Repuestos Especializados
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    NIT: 901.456.789-0 • Tel / WhatsApp: +57 310 456 7890 • Cra 15 #85-20, Bogotá D.C.
                  </p>
                </div>

                <div className="text-right border border-slate-900 p-2.5 rounded bg-slate-50 shrink-0">
                  <div className="text-[10px] uppercase font-bold text-slate-500">ORDEN DE TRABAJO</div>
                  <div className="text-base font-black font-mono text-blue-800">{order.order_number}</div>
                  <div className="text-[10px] text-slate-600">
                    Ingreso: {new Date(order.created_at).toLocaleDateString('es-CO')}
                  </div>
                  <div className="text-[9px] font-bold text-slate-700 uppercase mt-0.5">
                    ESTADO: {order.status}
                  </div>
                </div>
              </div>

              {/* Bloques de Datos: Cliente y Bicicleta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded border border-slate-300 bg-slate-50/50 space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[10px] block border-b border-slate-200 pb-1">
                    DATOS DEL PROPIETARIO
                  </span>
                  <div>
                    <strong>Nombre:</strong> {customer?.full_name || 'Sin asignar'}
                  </div>
                  <div>
                    <strong>Teléfono:</strong> {customer?.phone || 'N/A'}
                  </div>
                  {customer?.document_id && (
                    <div>
                      <strong>Cédula / NIT:</strong> {customer.document_id}
                    </div>
                  )}
                  {customer?.address && (
                    <div>
                      <strong>Dirección:</strong> {customer.address}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded border border-slate-300 bg-slate-50/50 space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[10px] block border-b border-slate-200 pb-1">
                    DATOS DE LA BICICLETA
                  </span>
                  <div>
                    <strong>Marca / Modelo:</strong> {bike ? `${bike.brand} ${bike.model}` : 'N/A'}
                  </div>
                  <div>
                    <strong>Tipo y Color:</strong> {bike ? `${bike.bike_type} • ${bike.color}` : 'N/A'}
                  </div>
                  <div>
                    <strong>Serial del Marco:</strong> {bike?.serial_number || 'Sin serial visible'}
                  </div>
                  {order.entry_mileage_km && (
                    <div>
                      <strong>Odómetro / Km:</strong> {order.entry_mileage_km} km
                    </div>
                  )}
                </div>
              </div>

              {/* Falla Reportada y Accesorios en Custodia */}
              <div className="space-y-2 p-3 rounded border border-slate-200 bg-slate-50/30">
                <div>
                  <strong className="uppercase text-[10px] text-slate-600 block">
                    MOTIVO DE INGRESO / FALLA REPORTADA:
                  </strong>
                  <p className="text-slate-900 italic font-medium">"{order.reported_issues}"</p>
                </div>
                {order.accessories_received && (
                  <div className="pt-1 border-t border-slate-200">
                    <strong className="uppercase text-[10px] text-slate-600 block">
                      INVENTARIO DE ACCESORIOS BAJO CUSTODIA DEL TALLER:
                    </strong>
                    <p className="text-slate-800">{order.accessories_received}</p>
                  </div>
                )}
                {order.internal_notes && (
                  <div className="pt-1 border-t border-slate-200">
                    <strong className="uppercase text-[10px] text-slate-600 block">
                      INSPECCIÓN TÉCNICA Y DAÑOS PREVIOS REGISTRADOS:
                    </strong>
                    <p className="text-slate-700 text-[11px] font-mono leading-tight">
                      {order.internal_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Tabla de Servicios y Repuestos */}
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px] block">
                  DETALLE DE INTERVENCIONES Y REPUESTOS
                </span>
                <table className="w-full border-collapse border border-slate-300 text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">Descripción / Concepto</th>
                      <th className="p-2 border-r border-slate-300 text-center w-28">Tipo</th>
                      <th className="p-2 border-r border-slate-300 text-center w-14">Cant.</th>
                      <th className="p-2 border-r border-slate-300 text-right w-24">Unitario</th>
                      <th className="p-2 text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-400 italic">
                          En proceso de evaluación diagnóstica
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                            {it.description}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center text-[10px] uppercase text-slate-600">
                            {it.item_type === 'service' ? 'Mano de Obra' : 'Repuesto'}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-mono">
                            {it.quantity}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-right font-mono">
                            ${it.unit_price.toLocaleString('es-CO')}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold">
                            ${it.total_price.toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Resumen Financiero */}
              <div className="flex justify-end pt-1">
                <div className="w-64 space-y-1 text-xs">
                  <div className="flex justify-between py-0.5 border-b border-slate-200">
                    <span className="text-slate-600">Subtotal Mano de Obra:</span>
                    <span className="font-mono font-medium">${order.total_labor.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-200">
                    <span className="text-slate-600">Subtotal Repuestos:</span>
                    <span className="font-mono font-medium">${order.total_parts.toLocaleString('es-CO')}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between py-0.5 border-b border-slate-200 text-emerald-700 font-bold">
                      <span>Descuento Otorgado:</span>
                      <span className="font-mono">-${order.discount.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-t-2 border-slate-900 text-sm font-black">
                    <span>TOTAL LIQUIDADO:</span>
                    <span className="font-mono text-blue-900">${order.grand_total.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>

              {/* Cláusulas y Firmas Formales */}
              <div className="space-y-4 pt-4 border-t border-slate-300">
                <div className="text-[10px] text-slate-500 leading-tight space-y-1">
                  <p className="font-bold text-slate-700 uppercase">TÉRMINOS Y CONDICIONES DEL SERVICIO:</p>
                  <p>
                    1. <strong>Garantía:</strong> Todos los ajustes mecánicos tienen una garantía de 30 días calendario. No cubre piezas con desgaste natural ni accidentes.
                  </p>
                  <p>
                    2. <strong>Custodia y Retiro:</strong> Notificada la finalización de los trabajos, el cliente dispone de 30 días para retirar la bicicleta. Pasado este plazo, aplicará cargo diario de bodegaje.
                  </p>
                  <p>
                    3. <strong>Repuestos Sustituidos:</strong> Las partes cambiadas quedan a disposición del cliente para verificación al momento de la entrega.
                  </p>
                </div>

                {/* Recuadro Doble de Firmas */}
                <div className="grid grid-cols-2 gap-8 pt-4">
                  {/* Firma del Cliente */}
                  <div className="text-center">
                    <div className="h-16 flex items-center justify-center">
                      {signature?.signature_data ? (
                        <img
                          src={signature.signature_data}
                          alt="Firma del Cliente"
                          className="max-h-16 max-w-full object-contain mx-auto"
                        />
                      ) : (
                        <span className="text-slate-300 text-[10px] italic">Firma del cliente</span>
                      )}
                    </div>
                    <div className="border-t border-slate-500 pt-1">
                      <div className="font-bold text-slate-900 text-[11px]">
                        {signature?.signer_name || customer?.full_name || 'Firma Conforme del Cliente'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {signature?.signer_doc ? `C.C. ${signature.signer_doc}` : 'Cliente / Propietario'}
                      </div>
                    </div>
                  </div>

                  {/* Firma del Taller */}
                  <div className="text-center">
                    <div className="h-16 flex items-center justify-center">
                      <div className="border border-dashed border-slate-300 rounded px-3 py-1 text-[10px] text-slate-400 font-mono">
                        SELLO / FIRMA MECÁNICO
                      </div>
                    </div>
                    <div className="border-t border-slate-500 pt-1">
                      <div className="font-bold text-slate-900 text-[11px]">A2Ruedas Taller Especializado</div>
                      <div className="text-[10px] text-slate-500">Recepción Técnica Autorizada</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. VISTA PREVIA: FORMATO TIRILLA TÉRMICA POS (58 MM) */}
        {format === '58mm' && (
          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg flex justify-center">
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
                    <span className="font-bold text-slate-700 uppercase block">ACCESORIOS EN CUSTODIA:</span>
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

                <div className="pt-2 text-[9px] text-slate-500 leading-tight">
                  <p className="font-semibold text-slate-700">TÉRMINOS DE SERVICIO:</p>
                  <p>• Garantía de 30 días en ajustes mecánicos.</p>
                  <p>• Pasados 30 días aplica cargo diario de custodia.</p>
                  <p>• Repuestos cambiados a disposición del cliente.</p>
                </div>

                {/* Espacio para firma digital */}
                <div className="pt-3 pb-2 text-center">
                  {signature?.signature_data ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1 text-[9px] text-blue-700 font-semibold">
                        <PenTool className="w-2.5 h-2.5" />
                        <span>FIRMA DIGITAL REGISTRADA</span>
                      </div>
                      <div className="py-1">
                        <img
                          src={signature.signature_data}
                          alt="Firma Digital"
                          className="h-14 max-w-[200px] mx-auto object-contain bg-white"
                        />
                      </div>
                      <div className="border-t border-slate-400 w-48 mx-auto pt-0.5 text-[9px] text-slate-800">
                        <div className="font-bold">{signature.signer_name}</div>
                        {signature.signer_doc && (
                          <div className="text-[8px] text-slate-600">Doc: {signature.signer_doc}</div>
                        )}
                        <div className="text-[7px] text-slate-400">
                          Fecha: {new Date(signature.signed_at).toLocaleString('es-CO')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-6">
                      <div className="border-t border-slate-400 w-44 mx-auto pt-1 text-[9px] text-slate-600">
                        Firma Conforme del Cliente
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-slate-400 uppercase tracking-widest pt-1">
                  *** GRACIAS POR SU PREFERENCIA ***
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
