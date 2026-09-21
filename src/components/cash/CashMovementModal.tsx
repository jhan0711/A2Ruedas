import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Smartphone,
  Coins,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  CashMovement,
  CashMovementType,
  CashPaymentMethod,
  CashCategory,
} from '../../types/database';
import { cashService } from '../../services/cashService';
import { Modal, Button } from '../ui';

interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (movement: CashMovement) => void;
  defaultType?: CashMovementType;
  defaultWorkOrder?: string;
  defaultAmount?: number;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'INCOME',
  defaultWorkOrder,
  defaultAmount,
}) => {
  const [type, setType] = useState<CashMovementType>(defaultType);
  const [amount, setAmount] = useState<number>(defaultAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<CashPaymentMethod>('CASH');
  const [category, setCategory] = useState<CashCategory>('ORDER_PAYMENT');
  const [concept, setConcept] = useState('');
  const [referenceId, setReferenceId] = useState(defaultWorkOrder || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setType(defaultType);
    setAmount(defaultAmount || 0);
    setReferenceId(defaultWorkOrder || '');
    setErrorMessage(null);

    if (defaultType === 'INCOME') {
      setCategory(defaultWorkOrder ? 'ORDER_PAYMENT' : 'COUNTER_SALE');
      setConcept(defaultWorkOrder ? `Cobro por orden de trabajo ${defaultWorkOrder}` : '');
    } else {
      setCategory('OPERATING_EXPENSE');
      setConcept('');
    }
  }, [isOpen, defaultType, defaultWorkOrder, defaultAmount]);

  // Manejar cambio de tipo
  const handleTypeChange = (newType: CashMovementType) => {
    setType(newType);
    if (newType === 'INCOME') {
      setCategory('ORDER_PAYMENT');
      if (!concept) setConcept('Pago por servicios de taller');
    } else {
      setCategory('OPERATING_EXPENSE');
      if (!concept) setConcept('Gasto operativo menor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMessage('El monto debe ser un valor mayor a cero.');
      return;
    }
    if (!concept.trim()) {
      setErrorMessage('El concepto del movimiento es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const mov = await cashService.recordMovement({
        type,
        concept: concept.trim(),
        amount,
        paymentMethod,
        category,
        userId: 'Administrador / Cajero',
        referenceType: referenceId ? 'WORK_ORDER' : 'MANUAL',
        referenceId: referenceId.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess(mov);
      onClose();
    } catch (err: any) {
      console.error('Error al registrar movimiento:', err);
      setErrorMessage(err.message || 'Error al guardar el movimiento de caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'INCOME' ? 'Registrar Ingreso de Dinero' : 'Registrar Egreso / Salida de Dinero'}
      description="Registra con precisión el flujo de caja discriminando el medio de pago físico o digital."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button size="sm" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            type="submit"
            form="cash-movement-form"
            isLoading={isSubmitting}
            className={
              type === 'INCOME'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs'
                : 'bg-red-600 hover:bg-red-700 text-white border-none shadow-xs'
            }
          >
            {type === 'INCOME' ? 'Guardar Ingreso' : 'Guardar Egreso'}
          </Button>
        </div>
      }
    >
      <form id="cash-movement-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Selector de Tipo (Ingreso / Egreso) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Tipo de Movimiento *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('INCOME')}
              className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                type === 'INCOME'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>+ INGRESO (Entrada)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('EXPENSE')}
              className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                type === 'EXPENSE'
                  ? 'border-red-600 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span>- EGRESO (Salida)</span>
            </button>
          </div>
        </div>

        {/* Monto y Medio de Pago en 2 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Monto */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Monto en COP ($) *
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="100"
                step="500"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium block">
              ${amount.toLocaleString('es-CO')} COP
            </span>
          </div>

          {/* Medio de Pago */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Medio de Pago *
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Nequi / Transf.</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Datáfono / Tarj.</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('OTHER')}
                className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === 'OTHER'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Otro Medio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categoría y Orden OT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CashCategory)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
            >
              {type === 'INCOME' ? (
                <>
                  <option value="ORDER_PAYMENT">Pago Total de Orden de Trabajo</option>
                  <option value="ORDER_DEPOSIT">Anticipo / Abono Parcial de OT</option>
                  <option value="COUNTER_SALE">Venta de Repuesto / Accesorio</option>
                  <option value="OTHER">Otro Ingreso / Aporte de Caja</option>
                </>
              ) : (
                <>
                  <option value="PART_PURCHASE">Compra Urgente de Repuestos</option>
                  <option value="OPERATING_EXPENSE">Gasto Operativo (Aseo, almuerzos, fletes)</option>
                  <option value="WITHDRAWAL">Retiro de Utilidades / Consignación</option>
                  <option value="OTHER">Otro Egreso</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              N° Orden OT Vinculada (Opcional)
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="Ej: OT-000001"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 uppercase"
            />
          </div>
        </div>

        {/* Concepto Principal */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Concepto del Movimiento *
          </label>
          <input
            type="text"
            required
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ej: Pago de mano de obra y mantenimiento general"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Notas Adicionales */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Notas / Observaciones
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: N° de comprobante Nequi o factura física adjunta"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </form>
    </Modal>
  );
};
