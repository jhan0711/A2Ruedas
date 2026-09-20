import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CashRegister, CashMovement } from '../types/database';

const LOCAL_STORAGE_CASH_REG = 'a2ruedas_cash_register_active';
const LOCAL_STORAGE_CASH_MOV = 'a2ruedas_cash_movements';

export const cashService = {
  async getActiveRegister(): Promise<CashRegister | null> {
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
        console.warn('Error al verificar caja activa en Supabase:', err);
      }
    }

    const cached = localStorage.getItem(LOCAL_STORAGE_CASH_REG);
    if (!cached) {
      // Caja activa por defecto para el día actual
      const defaultActive: CashRegister = {
        id: 'cash-reg-001',
        opened_by: 'admin-user',
        opened_at: new Date().toISOString(),
        initial_amount: 150000,
        status: 'OPEN',
      };
      localStorage.setItem(LOCAL_STORAGE_CASH_REG, JSON.stringify(defaultActive));
      return defaultActive;
    }
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  },

  async openRegister(initialAmount: number, userId: string): Promise<CashRegister> {
    const newRegister: CashRegister = {
      id: crypto.randomUUID ? crypto.randomUUID() : `cash-${Date.now()}`,
      opened_by: userId,
      opened_at: new Date().toISOString(),
      initial_amount: initialAmount,
      status: 'OPEN',
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('cash_registers').insert([newRegister]).select().single();
        if (!error && data) {
          localStorage.setItem(LOCAL_STORAGE_CASH_REG, JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Error al abrir caja en Supabase:', err);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_CASH_REG, JSON.stringify(newRegister));
    return newRegister;
  },

  async recordMovement(
    type: 'INCOME' | 'EXPENSE',
    concept: string,
    amount: number,
    paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'OTHER',
    userId: string,
    referenceType?: 'WORK_ORDER' | 'INVOICE' | 'MANUAL',
    referenceId?: string,
    notes?: string,
  ): Promise<CashMovement> {
    const active = await this.getActiveRegister();
    if (!active) throw new Error('No hay una caja abierta actualmente.');

    const movement: CashMovement = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`,
      cash_register_id: active.id,
      type,
      concept,
      amount,
      payment_method: paymentMethod,
      reference_type: referenceType || 'MANUAL',
      reference_id: referenceId,
      user_id: userId,
      notes,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('cash_movements').insert([movement]);
      } catch (err) {
        console.warn('Error al guardar movimiento de caja en Supabase:', err);
      }
    }

    const movements = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CASH_MOV) || '[]');
    localStorage.setItem(LOCAL_STORAGE_CASH_MOV, JSON.stringify([movement, ...movements]));

    return movement;
  },

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
        console.warn('Error al obtener movimientos de caja en Supabase:', err);
      }
    }

    const all: CashMovement[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CASH_MOV) || '[]');
    return all.filter((m) => m.cash_register_id === registerId);
  },

  async closeRegister(
    registerId: string,
    finalCountedAmount: number,
    userId: string,
    notes?: string,
  ): Promise<CashRegister> {
    const active = await this.getActiveRegister();
    if (!active || active.id !== registerId) throw new Error('Caja no encontrada o ya cerrada.');

    const movements = await this.getMovements(registerId);
    const cashIncome = movements
      .filter((m) => m.type === 'INCOME' && m.payment_method === 'CASH')
      .reduce((sum, m) => sum + m.amount, 0);
    const cashExpense = movements
      .filter((m) => m.type === 'EXPENSE' && m.payment_method === 'CASH')
      .reduce((sum, m) => sum + m.amount, 0);

    const systemCalculated = active.initial_amount + cashIncome - cashExpense;
    const difference = finalCountedAmount - systemCalculated;
    const now = new Date().toISOString();

    const closed: CashRegister = {
      ...active,
      closed_by: userId,
      closed_at: now,
      final_counted_amount: finalCountedAmount,
      system_calculated_amount: systemCalculated,
      difference,
      status: 'CLOSED',
      notes,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('cash_registers').update(closed).eq('id', registerId);
      } catch (err) {
        console.warn('Error al cerrar caja en Supabase:', err);
      }
    }

    localStorage.removeItem(LOCAL_STORAGE_CASH_REG);
    return closed;
  },
};
