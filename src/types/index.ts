export type UserRole = 'admin' | 'mechanic';

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
}

export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
  badge?: string | number;
}

export type WorkOrderStatus =
  | 'RECIBIDA'
  | 'DIAGNOSTICO'
  | 'PRESUPUESTO'
  | 'APROBADA'
  | 'EN_REPARACION'
  | 'ESPERANDO_REPUESTO'
  | 'LISTA'
  | 'ENTREGADA'
  | 'CANCELADA';
