-- ==============================================================================
-- A2RUEDAS - ESQUEMA INICIAL DE BASE DE DATOS (POSTGRESQL 15+)
-- Compatible con Supabase Auth, Storage y Row Level Security (RLS)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función utilitaria para actualizar columna updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. TABLAS PRINCIPALES
-- ==============================================================================

-- 2.1. Perfiles de Usuario (Técnicos y Administradores vinculados a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mechanic' CHECK (role IN ('admin', 'mechanic')),
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en profiles
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.2. Directorio de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  document_id TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(full_name);

DROP TRIGGER IF EXISTS tr_customers_updated_at ON public.customers;
CREATE TRIGGER tr_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.3. Bicicletas de Clientes
CREATE TABLE IF NOT EXISTS public.bicycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  bike_type TEXT NOT NULL, -- 'Ruta', 'MTB', 'Urbana', 'Gravel', 'E-Bike'
  color TEXT NOT NULL,
  frame_size TEXT,
  serial_number TEXT UNIQUE,
  year INT,
  key_components TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bicycles_customer ON public.bicycles(customer_id);
CREATE INDEX IF NOT EXISTS idx_bicycles_serial ON public.bicycles(serial_number);

DROP TRIGGER IF EXISTS tr_bicycles_updated_at ON public.bicycles;
CREATE TRIGGER tr_bicycles_updated_at
  BEFORE UPDATE ON public.bicycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.4. Códigos QR Únicos de Bicicleta
CREATE TABLE IF NOT EXISTS public.bike_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bicycle_id UUID NOT NULL UNIQUE REFERENCES public.bicycles(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL UNIQUE, -- ej. BIKE-8F3A92
  public_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bike_qr_code ON public.bike_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_bike_qr_token ON public.bike_qr_codes(public_token);

-- 2.5. Fotografías de Inspección y Daños
CREATE TABLE IF NOT EXISTS public.bicycle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bicycle_id UUID NOT NULL REFERENCES public.bicycles(id) ON DELETE CASCADE,
  work_order_id UUID, -- Referencia opcional, resuelta más adelante
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'general' CHECK (photo_type IN ('reception_damage', 'accessory', 'general')),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bicycle_photos_bike ON public.bicycle_photos(bicycle_id);

-- 2.6. Categorías de Productos
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7. Catálogo e Inventario de Productos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 2,
  unit TEXT NOT NULL DEFAULT 'unidad',
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);

DROP TRIGGER IF EXISTS tr_products_updated_at ON public.products;
CREATE TRIGGER tr_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.8. Kardex y Movimientos de Inventario
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INT NOT NULL CHECK (quantity > 0),
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);

-- 2.9. Catálogo de Servicios del Taller
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  estimated_minutes INT NOT NULL DEFAULT 60 CHECK (estimated_minutes > 0),
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10. Órdenes de Trabajo (OT)
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE, -- ej. OT-000001
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  bicycle_id UUID NOT NULL REFERENCES public.bicycles(id) ON DELETE RESTRICT,
  technician_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'RECIBIDA' CHECK (
    status IN (
      'RECIBIDA',
      'DIAGNOSTICO',
      'PRESUPUESTO',
      'APROBADA',
      'EN_REPARACION',
      'ESPERANDO_REPUESTO',
      'LISTA',
      'ENTREGADA',
      'CANCELADA'
    )
  ),
  reported_issues TEXT NOT NULL,
  accessories_received TEXT,
  entry_mileage_km NUMERIC(8,2),
  estimated_delivery_at TIMESTAMPTZ,
  total_labor NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_labor >= 0),
  total_parts NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_parts >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_number ON public.work_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON public.work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_bicycle ON public.work_orders(bicycle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);

DROP TRIGGER IF EXISTS tr_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER tr_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Relacionar bicycle_photos con work_orders
ALTER TABLE public.bicycle_photos
  DROP CONSTRAINT IF EXISTS fk_bicycle_photos_work_order,
  ADD CONSTRAINT fk_bicycle_photos_work_order
    FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE SET NULL;

-- 2.11. Conceptos de la Orden de Trabajo (Repuestos y Servicios)
CREATE TABLE IF NOT EXISTS public.work_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('service', 'part')),
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_items_order ON public.work_order_items(work_order_id);

-- 2.12. Trazabilidad e Historial de Estados de OT
CREATE TABLE IF NOT EXISTS public.work_order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_history_order ON public.work_order_status_history(work_order_id);

-- 2.13. Firmas Digitales de Recepción y Entrega
CREATE TABLE IF NOT EXISTS public.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('reception', 'delivery')),
  signature_data TEXT NOT NULL, -- Trazo en base64 / PNG
  signer_name TEXT NOT NULL,
  signer_doc TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signatures_order ON public.signatures(work_order_id);

-- 2.14. Sesiones de Caja del Taller
CREATE TABLE IF NOT EXISTS public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by UUID NOT NULL REFERENCES public.profiles(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  initial_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (initial_amount >= 0),
  closed_by UUID REFERENCES public.profiles(id),
  closed_at TIMESTAMPTZ,
  final_counted_amount NUMERIC(12,2),
  system_calculated_amount NUMERIC(12,2),
  difference NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON public.cash_registers(status);

-- 2.15. Movimientos de Caja (Ingresos y Egresos)
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  concept TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'TRANSFER', 'CARD', 'OTHER')),
  reference_type TEXT CHECK (reference_type IN ('WORK_ORDER', 'INVOICE', 'MANUAL')),
  reference_id UUID,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_register ON public.cash_movements(cash_register_id);

-- 2.16. Facturación y Recibos Internos
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE, -- ej. FAC-000001
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'CASH',
  payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'CANCELLED')),
  issued_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);

-- 2.17. Líneas de Factura
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- 2.18. Agenda y Calendario de Citas
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  bicycle_id UUID REFERENCES public.bicycles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  technician_id UUID REFERENCES public.profiles(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  estimated_duration_min INT NOT NULL DEFAULT 60 CHECK (estimated_duration_min > 0),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(scheduled_at);

-- 2.19. Historial de Mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status_trigger TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.20. Bitácora de Auditoría de Operaciones
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity, entity_id);

-- ==============================================================================
-- 3. FUNCIÓN RPC SEGURA PARA HISTORIAL PÚBLICO POR QR
-- ==============================================================================
-- Permite que un cliente consulte su bicicleta y mantenimientos mediante su QR
-- sin exponer teléfonos, cédulas ni datos privados de ningún cliente.

CREATE OR REPLACE FUNCTION public.get_bike_public_timeline(p_qr_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'qr_code', qr.qr_code,
    'brand', b.brand,
    'model', b.model,
    'bike_type', b.bike_type,
    'color', b.color,
    'serial_number', b.serial_number,
    'year', b.year,
    'work_orders', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'order_number', wo.order_number,
            'status', wo.status,
            'created_at', wo.created_at,
            'services', (
              SELECT jsonb_agg(woi.description)
              FROM public.work_order_items woi
              WHERE woi.work_order_id = wo.id
            )
          ) ORDER BY wo.created_at DESC
        )
        FROM public.work_orders wo
        WHERE wo.bicycle_id = b.id
          AND wo.status IN ('LISTA', 'ENTREGADA')
      ),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM public.bike_qr_codes qr
  JOIN public.bicycles b ON qr.bicycle_id = b.id
  WHERE qr.qr_code = p_qr_code AND qr.is_active = true;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bicycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bike_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bicycle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4.1. Reglas Públicas (Acceso anónimo para clientes sin login)
CREATE POLICY "Public Read Active Products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public Read Categories"
  ON public.product_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public Read Active Services"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public Read QR Codes"
  ON public.bike_qr_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 4.2. Reglas Administrativas (Acceso total para usuarios autenticados)
CREATE POLICY "Auth Full Access Profiles" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Customers" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Bicycles" ON public.bicycles FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Bike QRs" ON public.bike_qr_codes FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Photos" ON public.bicycle_photos FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Categories" ON public.product_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Products" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Inventory" ON public.inventory_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Services" ON public.services FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Work Orders" ON public.work_orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Work Order Items" ON public.work_order_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access WO History" ON public.work_order_status_history FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Signatures" ON public.signatures FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Cash Registers" ON public.cash_registers FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Cash Movements" ON public.cash_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Invoices" ON public.invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Invoice Items" ON public.invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Appointments" ON public.appointments FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access WhatsApp Logs" ON public.whatsapp_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth Full Access Activity Logs" ON public.activity_logs FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- 5. DATOS SEMILLA INICIALES (SEED DATA)
-- ==============================================================================

-- Categorías
INSERT INTO public.product_categories (name, slug, description) VALUES
  ('Transmisión', 'transmision', 'Cadenas, piñones, coronas, tensores y mandos de cambio'),
  ('Frenos', 'frenos', 'Pastillas, discos, zapatas, mordazas y guayas de freno'),
  ('Llantas y Neumáticos', 'llantas-neumaticos', 'Corazas tubeless, neumáticos, válvulas y sellantes'),
  ('Mantenimiento y Grasa', 'mantenimiento-grasa', 'Lubricantes de cadena, desengrasantes y grasas de rodamientos'),
  ('Pedales y Calas', 'pedales-calas', 'Pedales automáticos, plataformas y calas SPD')
ON CONFLICT (name) DO NOTHING;

-- Servicios estándar del taller
INSERT INTO public.services (name, description, estimated_minutes, price, is_active) VALUES
  ('Mantenimiento General Completo', 'Desarme integral, limpieza ultrasónica, engrase de rodamientos, centrado de ruedas y calibración total', 150, 120000, true),
  ('Mantenimiento Preventivo / Básico', 'Ajuste de cambios, calibración de frenos, lubricación y torque de tornillería', 60, 55000, true),
  ('Purga y Cambio de Líquido Hidráulico', 'Purga con líquido mineral / DOT y cambio de sellos por mordaza', 45, 45000, true),
  ('Instalación y Calibración de Transmisión', 'Cambio de cadena, piñonería y sincronización milimétrica', 45, 40000, true),
  ('Centrado de Ruedas por Par', 'Alineación milimétrica y tensión homogénea de radios', 40, 30000, true)
ON CONFLICT DO NOTHING;
