import React, { useState } from 'react';
import {
  Printer,
  X,
  Receipt,
  Share2,
  Ban,
} from 'lucide-react';
import { Invoice } from '../../types/database';
import { invoiceService } from '../../services/invoiceService';
import { whatsappService } from '../../services/whatsappService';
import { Button, Modal } from '../ui';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onInvoiceCancelled?: (updated: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onInvoiceCancelled,
}) => {
  const [viewFormat, setViewFormat] = useState<'thermal' | 'commercial'>('thermal');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen || !invoice) return null;

  const items = invoice.items || [];
  const dateFormatted = new Date(invoice.created_at).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Envío a WhatsApp con resumen de cobro
  const handleShareWhatsApp = () => {
    const phone = invoice.customer?.phone || '';
    const cleanPhone = whatsappService.formatWhatsAppPhone(phone);
    if (!cleanPhone) {
      alert('El cliente no tiene un número celular registrado.');
      return;
    }

    const itemsSummary = items
      .map((it) => `• ${it.description} x${it.quantity}: $${it.total_price.toLocaleString('es-CO')}`)
      .join('\n');

    const message = `¡Hola ${invoice.customer?.full_name || 'Cliente'}! 👋 Te compartimos tu comprobante de factura de A2Ruedas Taller:\n\n📄 *Factura N°:* ${invoice.invoice_number}${
      invoice.work_order_id ? `\n🚲 *Orden OT:* ${invoice.work_order_id}` : ''
    }\n🗓️ *Fecha:* ${dateFormatted}\n\n*Detalle de Servicios & Repuestos:*\n${itemsSummary}\n\n💰 *Total Cancelado:* $${invoice.total.toLocaleString(
      'es-CO'
    )} COP\n💳 *Medio de Pago:* ${invoice.payment_method}\n\n¡Gracias por confiar en A2Ruedas Taller! 🚲🔧`;

    const deepLink = whatsappService.buildWhatsAppDeepLink(cleanPhone, message);
    window.open(deepLink, '_blank');
  };

  // Impresión de Tirilla Térmica 58 mm
  const handlePrintThermal = () => {
    const printContent = document.getElementById('invoice-thermal-ticket');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${invoice.invoice_number}</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 4mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              background: #fff;
              width: 50mm;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .double-divider {
              border-top: 2px solid #000;
              margin: 6px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Impresión Comercial Tamaño Carta / A4
  const handlePrintCommercial = () => {
    const printContent = document.getElementById('invoice-commercial-sheet');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${invoice.invoice_number} - A2Ruedas</title>
          <meta charset="utf-8" />
          <style>
            @page {
              size: letter portrait;
              margin: 15mm;
            }
            body {
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 12px;
              color: #0f172a;
              background: #fff;
              line-height: 1.4;
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="p-8">
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Anular Factura
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    try {
      const updated = await invoiceService.cancelInvoice(invoice.id, cancelReason);
      if (onInvoiceCancelled) onInvoiceCancelled(updated);
      setCancelModalOpen(false);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al anular la factura.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
          {/* Cabecera del Modal */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {invoice.invoice_number}
                  </h3>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      invoice.payment_status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : invoice.payment_status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {invoice.payment_status === 'PAID'
                      ? 'PAGADA'
                      : invoice.payment_status === 'PENDING'
                      ? 'PENDIENTE'
                      : 'ANULADA'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  {dateFormatted} • {invoice.customer?.full_name || 'Consumidor Final'}
                </p>
              </div>
            </div>

            {/* Alternador de Formato (Térmica / Comercial) */}
            <div className="flex items-center gap-1.5">
              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewFormat('thermal')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewFormat === 'thermal'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Tirilla (58mm)
                </button>
                <button
                  type="button"
                  onClick={() => setViewFormat('commercial')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    viewFormat === 'commercial'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Carta / A4
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo del Modal con Previsualizaciones */}
          <div className="p-4 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex justify-center">
            {viewFormat === 'thermal' ? (
              /* ================= FORMATO TIRILLA TÉRMICA 58 MM ================= */
              <div
                id="invoice-thermal-ticket"
                className="w-[50mm] bg-white text-black p-3 font-mono text-[11px] shadow-md leading-tight border border-slate-300"
              >
                {/* Encabezado */}
                <div className="text-center space-y-0.5">
                  <div className="font-bold text-sm tracking-wider">A2RUEDAS TALLER</div>
                  <div className="text-[10px]">TALLER ESPECIALIZADO DE BICIS</div>
                  <div className="text-[9px]">NIT: 901.452.879-1</div>
                  <div className="text-[9px]">PBX: (+57) 310 456 7890</div>
                  <div className="text-[9px]">Calle 123 # 45-67, Bogotá</div>
                </div>

                <div className="border-t border-dashed border-black my-2" />

                <div className="text-center font-bold text-xs uppercase tracking-wide">
                  COMPROBANTE DE PAGO
                </div>
                <div className="text-center font-bold text-sm font-mono">
                  {invoice.invoice_number}
                </div>

                <div className="border-t border-dashed border-black my-2" />

                {/* Datos del Cliente y Factura */}
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>FECHA:</span>
                    <span>{dateFormatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span className="truncate max-w-[28mm] font-bold">
                      {invoice.customer?.full_name || 'Consumidor Final'}
                    </span>
                  </div>
                  {invoice.customer?.document_id && (
                    <div className="flex justify-between">
                      <span>C.C./NIT:</span>
                      <span>{invoice.customer.document_id}</span>
                    </div>
                  )}
                  {invoice.work_order_id && (
                    <div className="flex justify-between font-bold">
                      <span>ORDEN OT:</span>
                      <span>{invoice.work_order_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>MEDIO:</span>
                    <span className="font-bold">{invoice.payment_method}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black my-2" />

                {/* Desglose de Ítems */}
                <div className="space-y-1.5 text-[10px]">
                  <div className="font-bold text-center mb-1">-- DETALLE DE COBRO --</div>
                  {items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold truncate">{it.description}</div>
                      <div className="flex justify-between text-[9px] text-slate-700">
                        <span>
                          {it.quantity} x ${it.unit_price.toLocaleString('es-CO')}
                        </span>
                        <span className="font-bold">${it.total_price.toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-black my-2" />

                {/* Totales */}
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>${invoice.subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                      <span>DESCUENTO:</span>
                      <span>-${invoice.discount.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between">
                      <span>IVA (19%):</span>
                      <span>${invoice.tax.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="border-t border-black pt-1 flex justify-between font-bold text-xs">
                    <span>TOTAL PAGADO:</span>
                    <span>${invoice.total.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {invoice.notes && (
                  <>
                    <div className="border-t border-dashed border-black my-2" />
                    <div className="text-[9px] italic">
                      <span>Nota: {invoice.notes}</span>
                    </div>
                  </>
                )}

                {invoice.payment_status === 'CANCELLED' && (
                  <div className="border-2 border-dashed border-red-600 p-1 text-center my-2 text-red-600 font-bold text-xs">
                    *** FACTURA ANULADA ***
                  </div>
                )}

                <div className="border-t border-dashed border-black my-3" />

                <div className="text-center text-[9px] space-y-1">
                  <div>¡Gracias por rodar con nosotros!</div>
                  <div className="text-[8px] text-slate-600">
                    Garantía técnica de 30 días en mano de obra.
                  </div>
                  <div className="text-[8px] text-slate-500 mt-2">
                    - - - - - CORTE AQUI - - - - -
                  </div>
                </div>
              </div>
            ) : (
              /* ================= FORMATO COMERCIAL CARTA / A4 ================= */
              <div
                id="invoice-commercial-sheet"
                className="w-full max-w-xl bg-white text-slate-900 p-6 rounded-xl shadow-lg border border-slate-200 text-xs space-y-4"
              >
                {/* Cabecera de Empresa y Factura */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                        A2
                      </div>
                      <h2 className="text-base font-black tracking-tight">A2RUEDAS TALLER</h2>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                      <div>NIT: 901.452.879-1 • Régimen Común</div>
                      <div>Dirección: Calle 123 # 45-67, Bogotá, Colombia</div>
                      <div>Teléfono / WhatsApp: (+57) 310 456 7890</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      FACTURA COMERCIAL
                    </span>
                    <span className="text-lg font-black font-mono text-blue-600 block">
                      {invoice.invoice_number}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      Fecha: {dateFormatted}
                    </span>
                    {invoice.work_order_id && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block mt-1">
                        Orden de Trabajo: {invoice.work_order_id}
                      </span>
                    )}
                  </div>
                </div>

                {/* Datos del Cliente y Pago */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">
                      DATOS DEL CLIENTE
                    </span>
                    <strong className="text-slate-900 block text-sm">
                      {invoice.customer?.full_name || 'Consumidor Final'}
                    </strong>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      {invoice.customer?.document_id && <div>C.C./NIT: {invoice.customer.document_id}</div>}
                      {invoice.customer?.phone && <div>Teléfono: {invoice.customer.phone}</div>}
                      {invoice.customer?.email && <div>Email: {invoice.customer.email}</div>}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">
                      CONDICIONES DE PAGO
                    </span>
                    <div className="text-slate-800 text-[11px] space-y-0.5">
                      <div>Medio de Pago: <strong>{invoice.payment_method}</strong></div>
                      <div>Estado: <strong>{invoice.payment_status}</strong></div>
                      <div>Emitida por: <strong>{invoice.issued_by}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Ítems */}
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2">Descripción del Ítem / Servicio</th>
                      <th className="py-2 text-center w-16">Cant.</th>
                      <th className="py-2 text-right w-24">V. Unitario</th>
                      <th className="py-2 text-right w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={idx} className="text-xs">
                        <td className="py-2">
                          <span className="font-semibold text-slate-900 block">{it.description}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {it.item_type === 'service' ? 'Mano de Obra' : 'Repuesto / Producto'}
                          </span>
                        </td>
                        <td className="py-2 text-center font-mono">{it.quantity}</td>
                        <td className="py-2 text-right font-mono">
                          ${it.unit_price.toLocaleString('es-CO')}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-900">
                          ${it.total_price.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Bloque de Totales */}
                <div className="flex justify-end pt-2 border-t border-slate-200">
                  <div className="w-56 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">${invoice.subtotal.toLocaleString('es-CO')}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>Descuento Comercial:</span>
                        <span className="font-mono">-${invoice.discount.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    {invoice.tax > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>IVA:</span>
                        <span className="font-mono">${invoice.tax.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1">
                      <span>TOTAL A PAGAR:</span>
                      <span className="font-mono text-blue-600">
                        ${invoice.total.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Términos y Garantía */}
                <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
                  <div>
                    <strong>Términos y Condiciones:</strong> Esta factura de cobro interno certifica los servicios técnicos y repuestos suministrados en A2Ruedas. Garantía técnica de 30 días calendario sobre mano de obra.
                  </div>
                  {invoice.notes && <div><strong>Notas del Asesor:</strong> {invoice.notes}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Barra de Acciones Inferior */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {viewFormat === 'thermal' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handlePrintThermal}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-xs"
                >
                  Imprimir en Térmica (58 mm)
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handlePrintCommercial}
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-xs"
                >
                  Imprimir Hoja Carta / A4
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleShareWhatsApp}
                leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
                title="Enviar comprobante por WhatsApp"
              >
                Enviar a WhatsApp
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {invoice.payment_status !== 'CANCELLED' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCancelModalOpen(true)}
                  leftIcon={<Ban className="w-3.5 h-3.5 text-red-500" />}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
                >
                  Anular Factura
                </Button>
              )}

              <Button size="sm" variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Anulación */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`¿Anular Factura ${invoice.invoice_number}?`}
        description="Esta acción marcará la factura como ANULADA. No se borrará del historial para mantener la integridad de la numeración fiscal."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Volver
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmCancel}
              isLoading={isCancelling}
              disabled={!cancelReason.trim()}
            >
              Sí, Anular Factura
            </Button>
          </>
        }
      >
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Motivo de la Anulación *
          </label>
          <input
            type="text"
            required
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ej: Error en cantidad de ítems digitados o cambio de cliente"
            className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
          />
        </div>
      </Modal>
    </>
  );
};
