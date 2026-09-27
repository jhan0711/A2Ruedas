
-- ==============================================================================
-- 6. CONFIGURACIÓN DEL TALLER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workshop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'A2RUEDAS TALLER',
  nit TEXT NOT NULL DEFAULT '901.452.879-1',
  phone TEXT NOT NULL DEFAULT '(+57) 310 456 7890',
  address TEXT NOT NULL DEFAULT 'Calle 123 # 45-67, Bogotá, Colombia',
  city TEXT NOT NULL DEFAULT 'Bogotá D.C.',
  email TEXT NOT NULL DEFAULT 'contacto@a2ruedas.com',
  header_slogan TEXT NOT NULL DEFAULT 'TALLER ESPECIALIZADO DE BICICLETAS',
  footer_message TEXT NOT NULL DEFAULT '¡Gracias por pedalear con nosotros! 🚲',
  warranty_text TEXT NOT NULL DEFAULT 'Garantía: 30 días en mano de obra y ajustes. Retiro máximo: 30 días post-aviso.',
  daily_capacity INT NOT NULL DEFAULT 6,
  weekday_hours TEXT NOT NULL DEFAULT '08:00 - 18:00',
  saturday_hours TEXT NOT NULL DEFAULT '08:00 - 14:00',
  sunday_hours TEXT NOT NULL DEFAULT 'Cerrado',
  currency_code TEXT NOT NULL DEFAULT 'COP',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  order_prefix TEXT NOT NULL DEFAULT 'OT-',
  invoice_prefix TEXT NOT NULL DEFAULT 'FAC-',
  whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que solo exista 1 fila de configuración
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_settings_single ON public.workshop_settings((1));

DROP TRIGGER IF EXISTS tr_workshop_settings_updated_at ON public.workshop_settings;
CREATE TRIGGER tr_workshop_settings_updated_at
  BEFORE UPDATE ON public.workshop_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.workshop_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Workshop Settings"
  ON public.workshop_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Auth Update Workshop Settings"
  ON public.workshop_settings FOR ALL
  TO authenticated
  USING (true);

-- Insertar configuración por defecto si no existe
INSERT INTO public.workshop_settings (name) VALUES ('A2RUEDAS TALLER') ON CONFLICT DO NOTHING;
