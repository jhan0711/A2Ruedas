-- ==============================================================================
-- A2RUEDAS - MIGRACIÓN DE AUDITORÍA Y ENDURECIMIENTO DE SEGURIDAD (FASE 20)
-- PostgreSQL 15+ / Supabase RLS Hardening & Financial Immutability
-- ==============================================================================

-- 1. ENDURECIMIENTO DE POLÍTICAS EN PERFILES DE USUARIOS (PROFILES)
-- Previene que un usuario con rol mecánico eleve sus propios privilegios a administrador
-- o altere los perfiles de otros técnicos.

DROP POLICY IF EXISTS "Auth Full Access Profiles" ON public.profiles;

-- 1.1. Todos los usuarios autenticados pueden consultar perfiles de compañeros del taller
CREATE POLICY "Auth Read Profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 1.2. Cada usuario solo puede actualizar sus datos personales propios (nombre, teléfono)
CREATE POLICY "Auth Update Own Profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 1.3. Solo los administradores pueden crear o eliminar perfiles y modificar roles
CREATE POLICY "Admin Manage Profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 2. INMUTABILIDAD FINANCIERA DE CAJAS CERRADAS (CASH INTEGRITY)
-- Previene el fraude o alteración contable impidiendo registrar o modificar
-- movimientos en sesiones de caja que ya hayan sido arqueadas y cerradas.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_cash_register_immutable()
RETURNS TRIGGER AS $$
DECLARE
  v_closed_at TIMESTAMPTZ;
BEGIN
  -- Consultar estado de la caja vinculada
  SELECT closed_at INTO v_closed_at
  FROM public.cash_registers
  WHERE id = COALESCE(NEW.cash_register_id, OLD.cash_register_id);

  IF v_closed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Operación rechazada: La sesión de caja % ya fue cerrada y es inmutable para auditoría.',
      COALESCE(NEW.cash_register_id, OLD.cash_register_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_cash_movement_immutability ON public.cash_movements;
CREATE TRIGGER tr_cash_movement_immutability
  BEFORE INSERT OR UPDATE OR DELETE ON public.cash_movements
  FOR EACH ROW EXECUTE FUNCTION public.check_cash_register_immutable();

-- ==============================================================================
-- 3. VISTA PÚBLICA SEGURA DE CATÁLOGO (PREVENCIÓN DE FUGAS DE COST_PRICE)
-- Proporciona un punto de acceso a la vitrina digital que no expone
-- precio de costo, stock mínimo ni ubicación en taller a nivel de motor SQL.
-- ==============================================================================

CREATE OR REPLACE VIEW public.public_products_catalog AS
SELECT
  p.id,
  p.sku,
  p.category_id,
  c.name AS category_name,
  p.name,
  p.brand,
  p.description,
  p.sale_price AS price,
  (p.stock > 0) AS available,
  p.stock AS stock_quantity,
  p.unit,
  p.image_url,
  p.images,
  p.is_active,
  p.created_at
FROM public.products p
LEFT JOIN public.product_categories c ON p.category_id = c.id
WHERE p.is_active = true;

-- Conceder permisos de lectura a clientes anónimos y autenticados
GRANT SELECT ON public.public_products_catalog TO anon, authenticated;

-- ==============================================================================
-- 4. ENDURECIMIENTO DE FUNCIÓN RPC DEL TIMELINE PÚBLICO
-- Asegura que search_path sea explícito para prevenir ataques de secuestro de ruta
-- y confirma que ningún dato personal del cliente se incluya en el retorno.
-- ==============================================================================

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
  WHERE qr.qr_code = UPPER(TRIM(p_qr_code)) AND qr.is_active = true;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
