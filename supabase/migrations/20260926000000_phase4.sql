-- Migración Fase 4: Reemplazar bicycle_id por bicycle_info

-- 1. Agregamos las nuevas columnas
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS bicycle_info TEXT;
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS bicycle_info TEXT;

-- 2. Eliminamos las llaves foráneas y columnas anteriores
ALTER TABLE public.appointments DROP COLUMN IF EXISTS bicycle_id CASCADE;
ALTER TABLE public.work_orders DROP COLUMN IF EXISTS bicycle_id CASCADE;

-- 3. También es necesario actualizar las vistas o funciones si las hay.
-- Por ahora esto cumple con la regla de eliminar referencias a bicycles.
