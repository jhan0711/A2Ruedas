import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCheck,
  AlertTriangle,
  Info,
  DollarSign,
  Receipt,
  Sparkles,
  Coins,
} from 'lucide-react';
import {
  CashRegister,
  CashMovement,
  CashDenominations,
  CashRegisterSummary,
} from '../../types/database';
import { cashService, calculateDenominationsTotal } from '../../services/cashService';
import { Modal, Button } from '../ui';

interface CloseCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  register: CashRegister;
  movements: CashMovement[];
  onSuccess: (closedRegister: CashRegister) => void;
}

export const CloseCashModal: React.FC<CloseCashModalProps> = ({
  isOpen,
  onClose,
  register,
  movements,
  onSuccess,
}) => {
  const summary: CashRegisterSummary = cashService.calculateSummary(register, movements);

  // Conteo de billetes
  const [useCalculator, setUseCalculator] = useState(true);
  const [denominations, setDenominations] = useState<CashDenominations>({
    bill100k: 0,
    bill50k: 0,
    bill20k: 0,
    bill10k: 0,
    bill5k: 0,
    bill2k: 0,
    coins: 0,
  });

  const [manualCountedAmount, setManualCountedAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [closedBy, setClosedBy] = useState('Administrador / Jefe de Taller');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializar montos al abrir
  useEffect(() => {
    if (!isOpen) return;
    setManualCountedAmount(summary.expectedCashInDrawer);
    setNotes('');
    setErrorMessage(null);
  }, [isOpen, summary.expectedCashInDrawer]);

  // Monto final contado
  const countedAmount = useCalculator
    ? calculateDenominationsTotal(denominations)
    : manualCountedAmount;

  // Diferencia
  const difference = countedAmount - summary.expectedCashInDrawer;

  const handleDenomChange = (field: keyof CashDenominations, value: number) => {
    setDenominations((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  const handleAutoFillFromExpected = () => {
    // Autocompleta billetes aproximados según el monto esperado para agilizar
    let remaining = summary.expectedCashInDrawer;
    const b100 = Math.floor(remaining / 100000);
    remaining %= 100000;
    const b50 = Math.floor(remaining / 50000);
    remaining %= 50000;
    const b20 = Math.floor(remaining / 20000);
    remaining %= 20000;
    const b10 = Math.floor(remaining / 10000);
    remaining %= 10000;
    const b5 = Math.floor(remaining / 5000);
    remaining %= 5000;
    const b2 = Math.floor(remaining / 2000);
    remaining %= 2000;

    setDenominations({
      bill100k: b100,
      bill50k: b50,
      bill20k: b20,
      bill10k: b10,
      bill5k: b5,
      bill2k: b2,
      coins: remaining,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countedAmount < 0) {
      setErrorMessage('El monto contado no puede ser negativo.');
      return;
    }

    if (difference !== 0 && !notes.trim()) {
      setErrorMessage(
        'Existe una diferencia en caja. Por favor ingresa una breve justificación u observación en las notas.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const closed = await cashService.closeRegister({
        registerId: register.id,
        finalCountedAmount: countedAmount,
        userId: closedBy,
        notes: notes.trim() || undefined,
        denominations: useCalculator ? denominations : null,
      });

      onSuccess(closed);
      onClose();
    } catch (err: any) {
      console.error('Error al cerrar caja:', err);
      setErrorMessage(err.message || 'Error al ejecutar el arqueo de caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arqueo y Cierre de Caja"
      description="Verifica el efectivo físico de la gaveta contra los registros del sistema y consolida la jornada."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button size="sm" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button
            size="sm"
            type="submit"
            form="close-cash-form"
            isLoading={isSubmitting}
            leftIcon={<Receipt className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-xs"
          >
            Confirmar Cierre y Arqueo
          </Button>
        </div>
      }
    >
      <form id="close-cash-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Resumen del Sistema (Esperado vs Contado) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Efectivo Esperado en Gaveta:
            </span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white">
              ${summary.expectedCashInDrawer.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Base: ${register.initial_amount.toLocaleString('es-CO')} + Entradas - Salidas
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Efectivo Real Contado:
            </span>
            <span className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
              ${countedAmount.toLocaleString('es-CO')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {useCalculator ? 'Calculado por billetes' : 'Ingresado manualmente'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Resultado del Arqueo:
            </span>
            <div className="mt-1">
              {difference === 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCheck className="w-3.5 h-3.5" /> Caja Cuadrada ($0)
                </span>
              ) : difference > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  <Info className="w-3.5 h-3.5" /> Sobrante (+${difference.toLocaleString('es-CO')})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-3.5 h-3.5" /> Faltante (-${Math.abs(difference).toLocaleString('es-CO')})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alternador de Método de Conteo */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseCalculator(true)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                useCalculator
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Calculadora de Billetes Colombianos
            </button>

            <button
              type="button"
              onClick={() => setUseCalculator(false)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                !useCalculator
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Ingreso Manual Directo
            </button>
          </div>

          {useCalculator && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAutoFillFromExpected}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              className="text-[11px] text-slate-500"
              title="Prellenar billetes según el valor esperado del sistema"
            >
              Prellenar Esperado
            </Button>
          )}
        </div>

        {/* Panel 1: Calculadora de Billetes Colombianos */}
        {useCalculator ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* $100.000 */}
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  $100.000
                </span>
                <input
                  type="number"
                  min="0"
                  value={denominations.bill100k || ''}
                  onChange={(e) => handleDenomChange('bill100k', Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-center py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  =${((denominations.bill100k || 0) * 100000).toLocaleString('es-CO')}
                </span>
              </div>

              {/* $50.000 */}
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  $50.000
                </span>
                <input
                  type="number"
                  min="0"
                  value={denominations.bill50k || ''}
                  onChange={(e) => handleDenomChange('bill50k', Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-center py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  =${((denominations.bill50k || 0) * 50000).toLocaleString('es-CO')}
                </span>
              </div>

              {/* $20.000 */}
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  $20.000
                </span>
                <input
                  type="number"
                  min="0"
                  value={denominations.bill20k || ''}
                  onChange={(e) => handleDenomChange('bill20k', Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-center py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  =${((denominations.bill20k || 0) * 20000).toLocaleString('es-CO')}
                </span>
              </div>

              {/* $10.000 */}
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  $10.000
                </span>
                <input
                  type="number"
                  min="0"
                  value={denominations.bill10k || ''}
                  onChange={(e) => handleDenomChange('bill10k', Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-center py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  =${((denominations.bill10k || 0) * 10000).toLocaleString('es-CO')}
                </span>
              </div>

              {/* $5.000 */}
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  $5.000
                </span>
                <input
                  type="number"
                  min="0"
                  value={denominations.bill5k || ''}
                  onChange={(e) => handleDenomChange('bill5k', Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-center py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  =${((denominations.bill5k || 0) * 5000).toLocaleString('es-CO')}
                </span>
              </div>

              {/* $2.000 */}
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block">
                  $2.000
                </span>
                <input
                  type="number"
                  min="0"
                  value={denominations.bill2k || ''}
                  onChange={(e) => handleDenomChange('bill2k', Number(e.target.value))}
                  placeholder="0"
                  className="w-full text-center py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  =${((denominations.bill2k || 0) * 2000).toLocaleString('es-CO')}
                </span>
              </div>

              {/* Monedas y Suelto */}
              <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 col-span-2">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  Monedas / Suelto en Efectivo (COP)
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={denominations.coins || ''}
                  onChange={(e) => handleDenomChange('coins', Number(e.target.value))}
                  placeholder="Total en monedas"
                  className="w-full text-center py-1 rounded border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800"
                />
                <span className="text-[10px] font-mono text-slate-400 block text-right">
                  =${(denominations.coins || 0).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Panel 2: Entrada Manual */
          <div className="space-y-1.5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Monto Total Contado Físicamente en Gaveta (COP) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                required
                value={manualCountedAmount}
                onChange={(e) => setManualCountedAmount(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium block">
              ${manualCountedAmount.toLocaleString('es-CO')} COP
            </span>
          </div>
        )}

        {/* Responsable de Cierre y Notas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Cajero / Responsable del Cierre *
            </label>
            <input
              type="text"
              required
              value={closedBy}
              onChange={(e) => setClosedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Observaciones del Arqueo {difference !== 0 && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              required={difference !== 0}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                difference === 0
                  ? 'Opcional si la caja está cuadrada'
                  : 'Obligatorio: Justifica la diferencia encontrada'
              }
              className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 dark:text-white focus:ring-2 bg-white dark:bg-slate-900 ${
                difference !== 0 && !notes.trim()
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-blue-600'
              }`}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
