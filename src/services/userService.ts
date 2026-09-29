import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  id: '16f3e6ee-896f-4744-8e7a-8865c25baa63',
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
   * Obtiene sincrónicamente los usuarios cacheados en el cliente
   */
  getUsers(): WorkshopUser[] {
    return getStoredUsers();
  },

  /**
   * Consulta los usuarios registrados en Supabase (public.profiles y activity_logs)
   * y los sincroniza con la memoria local para todos los dispositivos
   */
  async fetchUsers(): Promise<WorkshopUser[]> {
    if (!isSupabaseConfigured) {
      return getStoredUsers();
    }

    try {
      const [{ data: profiles, error: profErr }, { data: logs }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
        supabase.from('activity_logs').select('*').eq('entity', 'user').order('created_at', { ascending: false }),
      ]);

      if (profErr || !profiles) {
        console.warn('Error al consultar perfiles en Supabase:', profErr?.message);
        return getStoredUsers();
      }

      const storedUsers = getStoredUsers();
      const mapped: WorkshopUser[] = profiles.map((p) => {
        let phone = p.phone || '';
        let email = '';

        if (phone.includes(':::')) {
          const parts = phone.split(':::');
          phone = parts[0];
          email = parts[1];
        } else {
          const log = logs?.find((l) => l.entity_id === p.id);
          email = log?.details?.email || '';
        }

        // Si es el admin maestro o su nombre coincide
        if (
          p.id === INITIAL_ADMIN_USER.id ||
          p.id === 'user-admin-main' ||
          (!email && p.full_name?.toLowerCase().includes('administrador maestro'))
        ) {
          email = INITIAL_ADMIN_USER.email;
        }

        if (p.id === '9f3ab36d-827a-444d-8714-f8a8cb0e7393' && !email) {
          email = 'test_mecanico@a2ruedas.com';
        }

        const localMatch = storedUsers.find(
          (u) =>
            u.id === p.id ||
            (email && u.email.toLowerCase() === email.toLowerCase()) ||
            u.fullName.toLowerCase() === p.full_name?.toLowerCase(),
        );

        return {
          id: p.id,
          fullName: p.full_name || 'Usuario Taller',
          email: email || localMatch?.email || INITIAL_ADMIN_USER.email,
          phone: phone || localMatch?.phone || '',
          role: (p.role as UserRole) || 'mechanic',
          isActive: p.is_active ?? true,
          password: localMatch?.password,
          createdAt: p.created_at || new Date().toISOString(),
          updatedAt: p.updated_at,
        };
      });

      // Asegurar que el admin maestro siempre esté presente
      if (!mapped.some((u) => u.email.toLowerCase() === INITIAL_ADMIN_USER.email.toLowerCase())) {
        mapped.unshift(INITIAL_ADMIN_USER);
      }

      saveStoredUsers(mapped);
      return mapped;
    } catch (err) {
      console.warn('Error de conexión al cargar perfiles de Supabase:', err);
      return getStoredUsers();
    }
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
   * Registra un nuevo usuario en Supabase Auth y en public.profiles
   */
  async createUser(data: {
    fullName: string;
    email: string;
    role: UserRole;
    phone?: string;
    password: string;
    isActive?: boolean;
  }): Promise<WorkshopUser> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.fullName.trim();
    const cleanPhone = data.phone?.trim() || '';

    let userId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (isSupabaseConfigured) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey =
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

      // 1. Enviar registro HTTP directo a Supabase Auth
      // Garantiza aislamiento total de la sesión del administrador actual
      let resJson: any = null;
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            password: data.password,
            data: {
              full_name: cleanName,
              role: data.role,
              phone: cleanPhone,
            },
          }),
        });

        resJson = await response.json();

        if (!response.ok) {
          if (
            resJson?.error_code === 'user_already_exists' ||
            resJson?.msg?.includes('already registered')
          ) {
            throw new Error(
              `El correo "${cleanEmail}" ya está registrado en Supabase Auth. Puedes editar su información o cambiar su contraseña desde la lista de usuarios.`,
            );
          }
          throw new Error(
            resJson?.msg || resJson?.message || 'Error al registrar usuario en Supabase Auth',
          );
        }
      } catch (fetchErr: any) {
        throw new Error(fetchErr.message || 'Error de comunicación con Supabase Auth');
      }

      userId = resJson?.user?.id || resJson?.id;
      if (!userId) {
        throw new Error('Supabase no retornó el identificador del usuario creado.');
      }

      // 2. Guardar perfil en la tabla public.profiles de Supabase
      const phoneEmail = cleanPhone ? `${cleanPhone}:::${cleanEmail}` : `:::${cleanEmail}`;
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: cleanName,
        role: data.role === 'receptionist' ? 'mechanic' : data.role,
        phone: phoneEmail,
        is_active: data.isActive ?? true,
        updated_at: new Date().toISOString(),
      });

      if (profileErr) {
        throw new Error(`Usuario creado en Auth pero falló al guardar perfil: ${profileErr.message}`);
      }

      // 3. Registrar en bitácora de auditoría
      try {
        await supabase.from('activity_logs').insert({
          action: 'USER_REGISTERED',
          entity: 'user',
          entity_id: userId,
          details: {
            fullName: cleanName,
            email: cleanEmail,
            role: data.role,
            phone: cleanPhone,
          },
        });
      } catch {
        // Log de auditoría no bloqueante
      }
    }

    const newUser: WorkshopUser = {
      id: userId,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role,
      isActive: data.isActive ?? true,
      password: data.password,
      createdAt: new Date().toISOString(),
    };

    const users = getStoredUsers();
    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }
    saveStoredUsers(users);
    return newUser;
  },

  /**
   * Actualiza los datos de un usuario existente
   */
  async updateUser(id: string, updates: Partial<WorkshopUser>): Promise<WorkshopUser> {
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error(`Usuario con ID ${id} no encontrado.`);
    }

    // No permitir cambiar el correo del admin maestro a uno vacío
    if (
      (id === INITIAL_ADMIN_USER.id || id === 'user-admin-main' || id === '16f3e6ee-896f-4744-8e7a-8865c25baa63') &&
      updates.email &&
      updates.email.trim() === ''
    ) {
      throw new Error('No es posible desasociar el correo del Administrador Principal.');
    }

    const updatedUser: WorkshopUser = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.email && updates.email.toLowerCase() !== users[index].email.toLowerCase()) {
      const cleanNew = updates.email.trim().toLowerCase();
      if (users.some((u) => u.id !== id && u.email.toLowerCase() === cleanNew)) {
        throw new Error(`El correo "${cleanNew}" ya está asignado a otro usuario.`);
      }
      updatedUser.email = cleanNew;
    }

    if (isSupabaseConfigured) {
      try {
        const cleanPhone = updatedUser.phone || '';
        const cleanEmail = updatedUser.email || '';
        const phoneEmail = cleanPhone ? `${cleanPhone}:::${cleanEmail}` : `:::${cleanEmail}`;

        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            full_name: updatedUser.fullName,
            role: updatedUser.role === 'receptionist' ? 'mechanic' : updatedUser.role,
            phone: phoneEmail,
            is_active: updatedUser.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (profileErr) {
          throw new Error(profileErr.message);
        }
      } catch (sbErr: any) {
        console.warn('Error al actualizar perfil en Supabase:', sbErr);
        throw new Error(sbErr.message || 'Error al actualizar usuario en la base de datos.');
      }
    }

    users[index] = updatedUser;
    saveStoredUsers(users);
    return updatedUser;
  },

  /**
   * Elimina un usuario del taller
   */
  async deleteUser(id: string): Promise<boolean> {
    if (
      id === INITIAL_ADMIN_USER.id ||
      id === 'user-admin-main' ||
      id === '16f3e6ee-896f-4744-8e7a-8865c25baa63'
    ) {
      throw new Error('No es posible eliminar al Administrador Maestro del sistema.');
    }

    if (isSupabaseConfigured) {
      try {
        const { error: profileErr } = await supabase.from('profiles').delete().eq('id', id);
        if (profileErr) {
          console.warn('Error al eliminar perfil en Supabase:', profileErr.message);
          throw new Error(profileErr.message);
        }
      } catch (sbErr: any) {
        console.warn('Error al eliminar perfil en Supabase:', sbErr);
        throw sbErr;
      }
    }

    const users = getStoredUsers();
    const filtered = users.filter((u) => u.id !== id);
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
      (u) => u.email.toLowerCase() === cleanEmail && u.isActive && u.password === password,
    );

    if (matched) {
      matched.lastLogin = new Date().toISOString();
      saveStoredUsers(users);
      return matched;
    }

    return null;
  },

  /**
   * Restablece la contraseña de un usuario
   */
  async resetPassword(id: string, newPassword: string): Promise<boolean> {
    const user = this.getUserById(id);
    if (!user) return false;
    await this.updateUser(id, { password: newPassword });
    return true;
  },
};
