-- Migración Fase 5: Productos (Costos y Storage)

-- 1. Eliminar columna de costo de la tabla productos
ALTER TABLE public.products DROP COLUMN IF EXISTS cost_price CASCADE;

-- 2. Crear el Bucket de Storage para las fotos de los productos (Si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Configurar Políticas de Seguridad para el Bucket (Público de lectura, Auth para escritura)
CREATE POLICY "Public Access Products Bucket" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'products');

CREATE POLICY "Auth Insert Products Bucket" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Auth Update Products Bucket" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'products');

CREATE POLICY "Auth Delete Products Bucket" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'products');
