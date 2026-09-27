-- Migración Fase 8: Eliminación Completa del Módulo QR

-- 1. Eliminar la función RPC pública
DROP FUNCTION IF EXISTS public.get_bike_public_timeline(TEXT);

-- 2. Eliminar la tabla de códigos QR y todas sus dependencias (políticas, índices)
DROP TABLE IF EXISTS public.bike_qr_codes CASCADE;
