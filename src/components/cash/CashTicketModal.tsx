import React from 'react';
import { Printer, X, Receipt } from 'lucide-react';
import { CashRegister, CashMovement } from '../../types/database';
import { cashService } from '../../services/cashService';
import { Button } from '../ui';

interface CashTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  register: CashRegister | null;
  movements?: CashMovement[];
}

export const CashTicketModal: React.FC<CashTicketModalProps> = ({
  isOpen,
  onClose,
  register,
  movements = [],
}) => {
  if (!isOpen || !register) return null;

  const summary = cashService.calculateSummary(register, movements);

  const handlePrint = () => {
    const printContent = document.getElementById('cash-thermal-ticket');
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
          <title>Cierre de Caja - ${register.id}</title>
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
            .cut-line {
              text-align: center;
              margin-top: 16px;
              font-size: 9px;
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

  const openedDate = new Date(register.opened_at).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const closedDate = register.closed_at
    ? new Date(register.closed_at).toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'EN CURSO (ABIERTA)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tirilla de Cierre de Caja (58 mm)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vista previa térmica fotorrealista */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="cash-thermal-ticket"
            className="w-[50mm] bg-white text-black p-3 font-mono text-[11px] shadow-md leading-tight border border-slate-300"
          >
            {/* Encabezado del Taller */}
            <div className="text-center space-y-0.5">
              <div className="font-bold text-sm tracking-wider">A2RUEDAS TALLER</div>
              <div className="text-[10px]">TALLER ESPECIALIZADO DE BICIS</div>
              <div className="text-[9px]">NIT: 901.452.879-1</div>
              <div className="text-[9px]">PBX: (+57) 310 456 7890</div>
            </div>

            <div className="border-t border-dashed border-black my-2" />

            <div className="text-center font-bold text-xs uppercase tracking-wide">
              {register.status === 'OPEN' ? 'ARQUEO PARCIAL EN VIVO' : 'CIERRE DIARIO DE CAJA'}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* Metadatos de la Sesión */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>SESION ID:</span>
                <span className="font-bold">{register.id.slice(0, 10).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>ESTADO:</span>
                <span className="font-bold">{register.status}</span>
              </div>
              <div className="flex justify-between">
                <span>APERTURA:</span>
                <span>{openedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>ABIERTO POR:</span>
                <span className="truncate max-w-[28mm]">{register.opened_by}</span>
              </div>
              <div className="flex justify-between">
                <span>CIERRE:</span>
                <span>{closedDate}</span>
              </div>
              {register.closed_by && (
                <div className="flex justify-between">
                  <span>CERRADO POR:</span>
                  <span className="truncate max-w-[28mm]">{register.closed_by}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* Desglose de Efectivo Físico en Gaveta */}
            <div className="space-y-1 text-[10px]">
              <div className="font-bold uppercase text-center mb-1">
                -- FLUJO DE EFECTIVO FISICO --
              </div>
              <div className="flex justify-between">
                <span>Base Inicial:</span>
                <span>${register.initial_amount.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Entradas Efectivo:</span>
                <span>${summary.totalCashIncome.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Salidas Efectivo:</span>
                <span>-${summary.totalCashExpense.toLocaleString('es-CO')}</span>
              </div>

              <div className="border-t border-black my-1 pt-1 flex justify-between font-bold text-xs">
                <span>EFECTIVO ESPERADO:</span>
                <span>${summary.expectedCashInDrawer.toLocaleString('es-CO')}</span>
              </div>

              {register.final_counted_amount !== undefined && register.final_counted_amount !== null && (
                <>
                  <div className="flex justify-between font-bold text-xs">
                    <span>EFECTIVO CONTADO:</span>
                    <span>${register.final_counted_amount.toLocaleString('es-CO')}</span>
                  </div>

                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-black">
                    <span>DIFERENCIA:</span>
                    <span>
                      {register.difference === 0
                        ? '$0 (CUADRADA)'
                        : (register.difference || 0) > 0
                        ? `+$${(register.difference || 0).toLocaleString('es-CO')} (SOBRANTE)`
                        : `-$${Math.abs(register.difference || 0).toLocaleString('es-CO')} (FALTANTE)`}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-black my-2" />

            {/* Desglose de Canales Digitales */}
            <div className="space-y-1 text-[10px]">
              <div className="font-bold uppercase text-center mb-1">
                -- INGRESOS DIGITALES / BANCOS --
              </div>
              <div className="flex justify-between">
                <span>Transferencias / Nequi:</span>
                <span>${summary.totalTransferIncome.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Datáfono / Tarjetas:</span>
                <span>${summary.totalCardIncome.toLocaleString('es-CO')}</span>
              </div>
              {summary.totalOtherIncome > 0 && (
                <div className="flex justify-between">
                  <span>Otros Medios:</span>
                  <span>${summary.totalOtherIncome.toLocaleString('es-CO')}</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-black my-2" />

            {/* Total General de la Jornada */}
            <div className="space-y-1 text-[11px] font-bold">
              <div className="flex justify-between">
                <span>TOTAL INGRESOS:</span>
                <span>${summary.totalIncome.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL EGRESOS:</span>
                <span>-${summary.totalExpense.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between border-t border-black pt-1 text-xs">
                <span>BALANCE NETO:</span>
                <span>${summary.netBalance.toLocaleString('es-CO')}</span>
              </div>
              <div className="text-[9px] font-normal text-right">
                {summary.movementsCount} movimientos registrados
              </div>
            </div>

            {/* Desglose de billetes si existe */}
            {register.denominations && (
              <>
                <div className="border-t border-dashed border-black my-2" />
                <div className="text-[9px] space-y-0.5">
                  <div className="font-bold text-center mb-1">CONTEO DE BILLETES:</div>
                  {register.denominations.bill100k > 0 && (
                    <div className="flex justify-between">
                      <span>$100.000 x {register.denominations.bill100k}</span>
                      <span>${(register.denominations.bill100k * 100000).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {register.denominations.bill50k > 0 && (
                    <div className="flex justify-between">
                      <span>$50.000 x {register.denominations.bill50k}</span>
                      <span>${(register.denominations.bill50k * 50000).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {register.denominations.bill20k > 0 && (
                    <div className="flex justify-between">
                      <span>$20.000 x {register.denominations.bill20k}</span>
                      <span>${(register.denominations.bill20k * 20000).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {register.denominations.bill10k > 0 && (
                    <div className="flex justify-between">
                      <span>$10.000 x {register.denominations.bill10k}</span>
                      <span>${(register.denominations.bill10k * 10000).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {register.denominations.bill5k > 0 && (
                    <div className="flex justify-between">
                      <span>$5.000 x {register.denominations.bill5k}</span>
                      <span>${(register.denominations.bill5k * 5000).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {register.denominations.bill2k > 0 && (
                    <div className="flex justify-between">
                      <span>$2.000 x {register.denominations.bill2k}</span>
                      <span>${(register.denominations.bill2k * 2000).toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {register.denominations.coins > 0 && (
                    <div className="flex justify-between">
                      <span>Monedas:</span>
                      <span>${register.denominations.coins.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Observaciones */}
            {register.notes && (
              <>
                <div className="border-t border-dashed border-black my-2" />
                <div className="text-[9px]">
                  <span className="font-bold block">NOTAS:</span>
                  <span>{register.notes}</span>
                </div>
              </>
            )}

            <div className="border-t border-dashed border-black my-4" />

            {/* Firma de Responsable */}
            <div className="text-center pt-6 text-[9px]">
              <div className="border-t border-black w-32 mx-auto pt-1">
                FIRMA CAJERO / RESPONSABLE
              </div>
              <div className="mt-2 text-[8px]">
                A2Ruedas PWA • Sistema de Gestión de Taller
              </div>
            </div>

            <div className="text-center text-[8px] mt-2">
              - - - - - CORTE AQUI - - - - -
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-xs"
          >
            Imprimir en Térmica (58 mm)
          </Button>
        </div>
      </div>
    </div>
  );
};
