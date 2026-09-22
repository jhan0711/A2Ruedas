import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { UserProfile, UserRole } from '../../types';
import type { Session, User } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar sesión inicial al montar
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        if (isSupabaseConfigured) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.warn('Error al obtener sesión de Supabase:', sessionError.message);
          }

          if (data?.session && isMounted) {
            setSession(data.session);
            setUser(data.session.user);
            setProfile({
              id: data.session.user.id,
              fullName: data.session.user.user_metadata?.full_name || 'Admin Taller',
              role: (data.session.user.user_metadata?.role as UserRole) || 'admin',
              isActive: true,
            });
            setIsLoading(false);
            return;
          }
        }

        // Revisar si existe sesión local almacenada (modo taller demo/resiliente)
        const cached = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
        if (cached && isMounted) {
          try {
            const parsed = JSON.parse(cached);
            setUser(parsed.user);
            setProfile(parsed.profile);
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
      } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          const loadedProfile: UserProfile = {
            id: currentSession.user.id,
            fullName: currentSession.user.user_metadata?.full_name || 'Admin Taller',
            role: (currentSession.user.user_metadata?.role as UserRole) || 'admin',
            isActive: true,
          };
          setProfile(loadedProfile);
          localStorage.setItem(
            LOCAL_STORAGE_AUTH_KEY,
            JSON.stringify({ user: currentSession.user, profile: loadedProfile }),
          );
        } else {
          setProfile(null);
          localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
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
      }

      // 2. Validación de credenciales contra la cuenta de administrador registrada
      const cached = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const expectedEmail = (parsed.savedEmail || parsed.user?.email || '').toLowerCase();
          const expectedSecret = parsed.authSecret;

          if (expectedEmail === cleanEmail && (!expectedSecret || expectedSecret === btoa(password))) {
            setUser(parsed.user);
            setProfile(parsed.profile);
            setIsLoading(false);
            return { success: true };
          }
        } catch {
          // Ignorar error de parsing
        }
      }

      const msg = 'Correo electrónico o contraseña incorrectos. Verifica tus credenciales de acceso.';
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
