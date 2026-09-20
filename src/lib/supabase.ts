import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'ADVERTENCIA: Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY no están configuradas.',
  );
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
    !supabaseKey.includes('tu_clave'),
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
