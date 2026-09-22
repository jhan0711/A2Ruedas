import { UserRole } from '../types';

export interface WorkshopUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

const LOCAL_STORAGE_USERS_KEY = 'a2ruedas_workshop_users_v1';

// Usuario administrador inicial oficial
export const INITIAL_ADMIN_USER: WorkshopUser = {
  id: 'user-admin-main',
  fullName: 'Administrador Maestro',
  email: 'admin@a2ruedas.com',
  phone: '(+57) 310 456 7890',
  role: 'admin',
  isActive: true,
  password: 'admin123',
  createdAt: '2026-09-22T00:00:00.000Z',
};

function getStoredUsers(): WorkshopUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) {
      const initial = [INITIAL_ADMIN_USER];
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: WorkshopUser[] = JSON.parse(raw);
    // Asegurar que el admin maestro siempre exista
    if (!parsed.some((u) => u.email.toLowerCase() === INITIAL_ADMIN_USER.email.toLowerCase())) {
      parsed.unshift(INITIAL_ADMIN_USER);
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.warn('Error al leer usuarios del taller:', err);
    return [INITIAL_ADMIN_USER];
  }
}

function saveStoredUsers(users: WorkshopUser[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error al guardar usuarios del taller:', err);
  }
}

export const userService = {
  /**
   * Obtiene todos los usuarios registrados en el taller
   */
  getUsers(): WorkshopUser[] {
    return getStoredUsers();
  },

  /**
   * Obtiene un usuario por su ID
   */
  getUserById(id: string): WorkshopUser | null {
    const users = getStoredUsers();
    return users.find((u) => u.id === id) || null;
  },

  /**
   * Obtiene un usuario por su correo electrónico
   */
  getUserByEmail(email: string): WorkshopUser | null {
    const users = getStoredUsers();
    const clean = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === clean) || null;
  },

  /**
   * Registra un nuevo usuario en el taller (Mecánico, Administrador, Recepcionista)
   */
  createUser(data: {
    fullName: string;
    email: string;
    role: UserRole;
    phone?: string;
    password: string;
    isActive?: boolean;
  }): WorkshopUser {
    const users = getStoredUsers();
    const cleanEmail = data.email.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`El correo "${cleanEmail}" ya está registrado en el taller.`);
    }

    const newUser: WorkshopUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      role: data.role,
      isActive: data.isActive ?? true,
      password: data.password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveStoredUsers(users);
    return newUser;
  },

  /**
   * Actualiza los datos de un usuario existente
   */
  updateUser(id: string, updates: Partial<WorkshopUser>): WorkshopUser {
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error(`Usuario con ID ${id} no encontrado.`);
    }

    // No permitir cambiar el correo del admin maestro a uno vacío
    if (id === INITIAL_ADMIN_USER.id && updates.email && updates.email.trim() === '') {
      throw new Error('No es posible desasociar el correo del Administrador Principal.');
    }

    const updatedUser: WorkshopUser = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Si se actualizó el email, validar que no colisione con otro usuario
    if (updates.email && updates.email.toLowerCase() !== users[index].email.toLowerCase()) {
      const cleanNew = updates.email.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === cleanNew)) {
        throw new Error(`El correo "${cleanNew}" ya está asignado a otro usuario.`);
      }
      updatedUser.email = cleanNew;
    }

    users[index] = updatedUser;
    saveStoredUsers(users);
    return updatedUser;
  },

  /**
   * Elimina un usuario del taller (el Administrador Principal no puede eliminarse)
   */
  deleteUser(id: string): boolean {
    if (id === INITIAL_ADMIN_USER.id) {
      throw new Error('No es posible eliminar al Administrador Maestro del sistema.');
    }

    const users = getStoredUsers();
    const filtered = users.filter((u) => u.id !== id);

    if (filtered.length === users.length) {
      return false;
    }

    saveStoredUsers(filtered);
    return true;
  },

  /**
   * Valida credenciales de acceso para el login
   */
  validateCredentials(email: string, password: string): WorkshopUser | null {
    const cleanEmail = email.trim().toLowerCase();
    const users = getStoredUsers();

    const matched = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.isActive && u.password === password
    );

    if (matched) {
      // Registrar último login
      matched.lastLogin = new Date().toISOString();
      saveStoredUsers(users);
      return matched;
    }

    return null;
  },

  /**
   * Restablece la contraseña de un usuario
   */
  resetPassword(id: string, newPassword: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;
    this.updateUser(id, { password: newPassword });
    return true;
  },
};
