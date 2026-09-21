import React, { useState } from 'react';
import { Wallet, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { CashRegister } from '../../types/database';
import { cashService } from '../../services/cashService';
import { Modal, Button } from '../ui';

interface OpenCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (register: CashRegister) => void;
}

const COMMON_BASES = [100000, 150000, 200000, 300000];

export const OpenCashModal: React.FC<OpenCashModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [initialAmount, setInitialAmount] = useState<number>(150000);
  const [openedBy, setOpenedBy] = useState('Administrador / Jefe de Taller');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialAmount < 0) {
      setErrorMessage('La base inicial no puede ser un número negativo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const reg = await cashService.openRegister(initialAmount, openedBy, notes);
      onSuccess(reg);
      onClose();
    } catch (err: any) {
      console.error('Error al abrir caja:', err);
      setErrorMessage(err.message || 'No se pudo abrir la caja.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apertura de Caja Diaria"
      description="Registra la base de efectivo inicial en la gaveta física para comenzar a operar en el taller."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button size="sm" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="submit"
            form="open-cash-form"
            isLoading={isSubmitting}
            leftIcon={<Wallet className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
          >
            Abrir Caja de Hoy
          </Button>
        </div>
      }
    >
      <form id="open-cash-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Monto Base */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Base Inicial en Efectivo (COP) *
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="0"
              step="1000"
              required
              value={initialAmount}
              onChange={(e) => setInitialAmount(Math.max(0, Number(e.target.value)))}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block">
            ${initialAmount.toLocaleString('es-CO')} COP
          </span>
        </div>

        {/* Atajos Rápidos de Bases Habituales */}
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Bases habituales de mostrador:
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {COMMON_BASES.map((base) => (
              <button
                key={base}
                type="button"
                onClick={() => setInitialAmount(base)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                  initialAmount === base
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                ${(base / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>

        {/* Responsable */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Responsable de Caja
          </label>
          <input
            type="text"
            required
            value={openedBy}
            onChange={(e) => setOpenedBy(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Observaciones */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Notas de Apertura (Opcional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Billetes de baja denominación y monedas para dar cambio."
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
