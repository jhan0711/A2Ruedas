import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CashRegister,
  CashMovement,
  CashMovementType,
  CashPaymentMethod,
  CashCategory,
  CashDenominations,
  CashRegisterSummary,
} from '../types/database';

const LOCAL_STORAGE_CASH_REG = 'a2ruedas_cash_register_active';
const LOCAL_STORAGE_CASH_MOV = 'a2ruedas_cash_movements';
const LOCAL_STORAGE_CASH_HISTORY = 'a2ruedas_cash_registers_history';

/**
 * Calcula el total en efectivo a partir del conteo de billetes y monedas colombianas
 */
export function calculateDenominationsTotal(denoms: CashDenominations): number {
  return (
    (denoms.bill100k || 0) * 100000 +
    (denoms.bill50k || 0) * 50000 +
    (denoms.bill20k || 0) * 20000 +
    (denoms.bill10k || 0) * 10000 +
    (denoms.bill5k || 0) * 5000 +
    (denoms.bill2k || 0) * 2000 +
    (denoms.coins || 0)
  );
}

/**
 * En producción la caja inicia completamente limpia sin datos simulados
 */
function initializeDemoCashData(): void {
  // Base de datos limpia de caja para producción
}

export const cashService = {
  /**
   * Obtiene la sesión de caja activa actual, o null si está cerrada
   */
  async getActiveRegister(): Promise<CashRegister | null> {
    initializeDemoCashData();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cash_registers')
          .select('*')
          .eq('status', 'OPEN')
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al verificar caja activa en Supabase, usando respaldo local:', err);
      }
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_CASH_REG);
    if (!cached) return null;

    try {
      const parsed: CashRegister = JSON.parse(cached);
      return parsed.status === 'OPEN' ? parsed : null;
    } catch {
      return null;
    }
  },

  /**
   * Abre una nueva sesión de caja en el taller con una base inicial en efectivo
   */
  async openRegister(initialAmount: number, userId: string, notes?: string): Promise<CashRegister> {
    if (initialAmount < 0) {
      throw new Error('El monto de la base inicial no puede ser negativo.');
    }

    const newRegister: CashRegister = {
      id: crypto.randomUUID ? crypto.randomUUID() : `cash-${Date.now()}`,
      opened_by: userId || 'Administrador',
      opened_at: new Date().toISOString(),
      initial_amount: initialAmount,
      status: 'OPEN',
      notes: notes?.trim() || null,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cash_registers')
          .insert({
            opened_by: newRegister.opened_by,
            initial_amount: newRegister.initial_amount,
            status: 'OPEN',
            notes: newRegister.notes,
          })
          .select()
          .single();

        if (!error && data) {
          newRegister.id = data.id;
          newRegister.opened_at = data.opened_at;
        }
      } catch (err) {
        console.warn('Error al abrir caja en Supabase:', err);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_CASH_REG, JSON.stringify(newRegister));
    return newRegister;
  },

  /**
   * Registra un ingreso o egreso de caja con su respectivo medio de pago
   */
  async recordMovement(data: {
    type: CashMovementType;
    concept: string;
    amount: number;
    paymentMethod: CashPaymentMethod;
    category?: CashCategory | string;
    userId: string;
    referenceType?: 'WORK_ORDER' | 'INVOICE' | 'MANUAL';
    referenceId?: string;
    notes?: string;
  }): Promise<CashMovement> {
    const active = await this.getActiveRegister();
    if (!active) {
      throw new Error('No es posible registrar movimientos porque la caja se encuentra cerrada.');
    }
    if (data.amount <= 0) {
      throw new Error('El monto del movimiento debe ser un valor mayor a cero.');
    }
    if (!data.concept.trim()) {
      throw new Error('El concepto del movimiento es obligatorio.');
    }

    const movement: CashMovement = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`,
      cash_register_id: active.id,
      type: data.type,
      concept: data.concept.trim(),
      amount: data.amount,
      payment_method: data.paymentMethod,
      category: data.category || 'OTHER',
      reference_type: data.referenceType || 'MANUAL',
      reference_id: data.referenceId || null,
      user_id: data.userId || 'Administrador',
      notes: data.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: dbData, error } = await supabase
          .from('cash_movements')
          .insert({
            cash_register_id: movement.cash_register_id,
            type: movement.type,
            concept: movement.concept,
            amount: movement.amount,
            payment_method: movement.payment_method,
            reference_type: movement.reference_type,
            reference_id: movement.reference_id,
            user_id: movement.user_id,
            notes: movement.notes,
          })
          .select()
          .single();

        if (!error && dbData) {
          movement.id = dbData.id;
          movement.created_at = dbData.created_at;
        }
      } catch (err) {
        console.warn('Error al guardar movimiento de caja en Supabase:', err);
      }
    }

    const existing: CashMovement[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CASH_MOV) || '[]');
    existing.unshift(movement);
    localStorage.setItem(LOCAL_STORAGE_CASH_MOV, JSON.stringify(existing));

    return movement;
  },

  /**
   * Obtiene todos los movimientos asociados a una sesión de caja
   */
  async getMovements(registerId: string): Promise<CashMovement[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cash_movements')
          .select('*')
          .eq('cash_register_id', registerId)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al consultar movimientos en Supabase:', err);
      }
    }

    const all: CashMovement[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CASH_MOV) || '[]');
    return all.filter((m) => m.cash_register_id === registerId);
  },

  /**
   * Calcula el balance y resumen consolidado de una sesión de caja
   */
  calculateSummary(register: CashRegister, movements: CashMovement[]): CashRegisterSummary {
    const cashIncome = movements
      .filter((m) => m.type === 'INCOME' && m.payment_method === 'CASH')
      .reduce((sum, m) => sum + m.amount, 0);

    const cashExpense = movements
      .filter((m) => m.type === 'EXPENSE' && m.payment_method === 'CASH')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCashInDrawer = register.initial_amount + cashIncome - cashExpense;

    const transferIncome = movements
      .filter((m) => m.type === 'INCOME' && m.payment_method === 'TRANSFER')
      .reduce((sum, m) => sum + m.amount, 0);

    const cardIncome = movements
      .filter((m) => m.type === 'INCOME' && m.payment_method === 'CARD')
      .reduce((sum, m) => sum + m.amount, 0);

    const otherIncome = movements
      .filter((m) => m.type === 'INCOME' && m.payment_method === 'OTHER')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalIncome = movements
      .filter((m) => m.type === 'INCOME')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalExpense = movements
      .filter((m) => m.type === 'EXPENSE')
      .reduce((sum, m) => sum + m.amount, 0);

    const netBalance = totalIncome - totalExpense;

    return {
      initialAmount: register.initial_amount,
      totalCashIncome: cashIncome,
      totalCashExpense: cashExpense,
      expectedCashInDrawer,
      totalTransferIncome: transferIncome,
      totalCardIncome: cardIncome,
      totalOtherIncome: otherIncome,
      totalIncome,
      totalExpense,
      netBalance,
      movementsCount: movements.length,
    };
  },

  /**
   * Cierra la sesión de caja, ejecuta el arqueo de efectivo y calcula descuadres
   */
  async closeRegister(params: {
    registerId: string;
    finalCountedAmount: number;
    userId: string;
    notes?: string;
    denominations?: CashDenominations | null;
  }): Promise<CashRegister> {
    const active = await this.getActiveRegister();
    if (!active || active.id !== params.registerId) {
      throw new Error('La caja que intenta cerrar no está activa o ya fue cerrada.');
    }

    const movements = await this.getMovements(params.registerId);
    const summary = this.calculateSummary(active, movements);

    const difference = params.finalCountedAmount - summary.expectedCashInDrawer;
    const now = new Date().toISOString();

    const closedRegister: CashRegister = {
      ...active,
      closed_by: params.userId || 'Administrador',
      closed_at: now,
      final_counted_amount: params.finalCountedAmount,
      system_calculated_amount: summary.expectedCashInDrawer,
      difference,
      status: 'CLOSED',
      notes: params.notes?.trim() || null,
      denominations: params.denominations || null,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('cash_registers')
          .update({
            closed_by: closedRegister.closed_by,
            closed_at: closedRegister.closed_at,
            final_counted_amount: closedRegister.final_counted_amount,
            system_calculated_amount: closedRegister.system_calculated_amount,
            difference: closedRegister.difference,
            status: 'CLOSED',
            notes: closedRegister.notes,
          })
          .eq('id', params.registerId);
      } catch (err) {
        console.warn('Error al cerrar caja en Supabase:', err);
      }
    }

    // 1. Quitar caja activa
    localStorage.removeItem(LOCAL_STORAGE_CASH_REG);

    // 2. Guardar en histórico de sesiones cerradas
    const history: CashRegister[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CASH_HISTORY) || '[]');
    history.unshift(closedRegister);
    localStorage.setItem(LOCAL_STORAGE_CASH_HISTORY, JSON.stringify(history));

    return closedRegister;
  },

  /**
   * Obtiene el listado histórico de cajas cerradas para auditoría
   */
  async getPastRegisters(): Promise<CashRegister[]> {
    initializeDemoCashData();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cash_registers')
          .select('*')
          .eq('status', 'CLOSED')
          .order('closed_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al consultar historial de cajas en Supabase:', err);
      }
    }

    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_CASH_HISTORY) || '[]');
  },
};
