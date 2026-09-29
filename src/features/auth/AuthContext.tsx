import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { UserProfile, UserRole } from '../../types';
import type { Session, User } from '@supabase/supabase-js';
import { userService } from '../../services/userService';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_AUTH_KEY = 'a2ruedas_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      return cached ? JSON.parse(cached).user : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      return cached ? JSON.parse(cached).profile : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar sesión inicial al montar
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        if (isSupabaseConfigured) {
          try {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
              console.warn('Error al obtener sesión de Supabase:', sessionError.message);
            }

            if (data?.session && isMounted) {
              setSession(data.session);
              setUser(data.session.user);
              const loadedProfile: UserProfile = {
                id: data.session.user.id,
                fullName: data.session.user.user_metadata?.full_name || 'Admin Taller',
                role: (data.session.user.user_metadata?.role as UserRole) || 'admin',
                email: data.session.user.email,
                isActive: true,
              };
              setProfile(loadedProfile);
              localStorage.setItem(
                LOCAL_STORAGE_AUTH_KEY,
                JSON.stringify({ user: data.session.user, profile: loadedProfile }),
              );
              setIsLoading(false);
              return;
            }

            // Si no hay sesión remota activa, intentar reautenticación automática si existen credenciales guardadas
            const cached = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
            if (cached && isMounted) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed.savedEmail && parsed.authSecret) {
                  const { data: reloginData, error: reloginErr } = await supabase.auth.signInWithPassword({
                    email: parsed.savedEmail,
                    password: atob(parsed.authSecret),
                  });
                  if (!reloginErr && reloginData?.session && reloginData?.user) {
                    setSession(reloginData.session);
                    setUser(reloginData.user);
                    const autoProfile: UserProfile = {
                      id: reloginData.user.id,
                      fullName: reloginData.user.user_metadata?.full_name || 'Admin Taller',
                      role: (reloginData.user.user_metadata?.role as UserRole) || 'admin',
                      email: reloginData.user.email,
                      isActive: true,
                    };
                    setProfile(autoProfile);
                    setIsLoading(false);
                    return;
                  }
                }
              } catch {
                // Error al reintentar login
              }
            }

            // Si Supabase está configurado y no hay sesión válida, limpiar estados para forzar login real
            if (isMounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
              setIsLoading(false);
              return;
            }
          } catch (sbErr) {
            console.warn('Verificación de sesión remota omitida (modo offline/resiliente):', sbErr);
          }
        }

        // Modo offline exclusivo
        const cached = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.user) {
              setUser(parsed.user);
              setProfile(parsed.profile);
            }
          } catch {
            localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
          }
        }
      } catch (err: unknown) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Suscripción reactiva a cambios de autenticación en Supabase
    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (!isMounted) return;

        // Solo eliminar la sesión local si el evento es explícitamente SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
          return;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const loadedProfile: UserProfile = {
            id: currentSession.user.id,
            fullName: currentSession.user.user_metadata?.full_name || 'Admin Taller',
            role: (currentSession.user.user_metadata?.role as UserRole) || 'admin',
            email: currentSession.user.email,
            isActive: true,
          };
          setProfile(loadedProfile);
          localStorage.setItem(
            LOCAL_STORAGE_AUTH_KEY,
            JSON.stringify({ user: currentSession.user, profile: loadedProfile }),
          );
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);



  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Intentar inicio de sesión real en Supabase Auth
      if (isSupabaseConfigured) {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!sbError && data.session && data.user) {
          setSession(data.session);
          setUser(data.user);
          const userProfile: UserProfile = {
            id: data.user.id,
            fullName: data.user.user_metadata?.full_name || 'Administrador Taller',
            role: (data.user.user_metadata?.role as UserRole) || 'admin',
            isActive: true,
          };
          setProfile(userProfile);
          localStorage.setItem(
            LOCAL_STORAGE_AUTH_KEY,
            JSON.stringify({ user: data.user, profile: userProfile }),
          );
          setIsLoading(false);
          return { success: true };
        }

        const errMessage =
          sbError?.message === 'Invalid login credentials'
            ? 'Correo electrónico o contraseña incorrectos en Supabase.'
            : sbError?.message || 'Error de autenticación con el servidor de Supabase.';
        setError(errMessage);
        setIsLoading(false);
        return { success: false, error: errMessage };
      }

      // 2. Validación de credenciales en modo offline exclusivo (sin Supabase configurado)
      const matchedUser = userService.validateCredentials(cleanEmail, password);
      if (matchedUser) {
        const authenticatedUser: User = {
          id: matchedUser.id,
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: matchedUser.fullName, role: matchedUser.role },
          aud: 'authenticated',
          created_at: matchedUser.createdAt,
          email: matchedUser.email,
        };
        const authenticatedProfile: UserProfile = {
          id: matchedUser.id,
          fullName: matchedUser.fullName,
          role: matchedUser.role,
          email: matchedUser.email,
          phone: matchedUser.phone,
          isActive: matchedUser.isActive,
        };
        setUser(authenticatedUser);
        setProfile(authenticatedProfile);
        localStorage.setItem(
          LOCAL_STORAGE_AUTH_KEY,
          JSON.stringify({
            user: authenticatedUser,
            profile: authenticatedProfile,
            savedEmail: cleanEmail,
            authSecret: btoa(password),
          }),
        );
        setIsLoading(false);
        return { success: true };
      }

      const msg = 'Correo electrónico o contraseña incorrectos. Verifica tus credenciales de acceso.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al intentar iniciar sesión.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Error durante el cierre de sesión en Supabase:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
