-- 1. Enforce allowed image extensions on uploads (server-side, cannot be bypassed)
DROP POLICY IF EXISTS "Farmacia users can upload medicamento images" ON storage.objects;
DROP POLICY IF EXISTS "Farmacia users can update medicamento images" ON storage.objects;
DROP POLICY IF EXISTS "Farmacia users can upload servico images" ON storage.objects;
DROP POLICY IF EXISTS "Farmacia users can update servico images" ON storage.objects;

CREATE POLICY "Farmacia users can upload medicamento images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'medicamentos'
  AND lower(name) ~ '\.(jpe?g|png|gif|webp)$'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.farmacias WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Farmacia users can update medicamento images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'medicamentos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.farmacias WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'medicamentos'
  AND lower(name) ~ '\.(jpe?g|png|gif|webp)$'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.farmacias WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Farmacia users can upload servico images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'servicos'
  AND lower(name) ~ '\.(jpe?g|png|gif|webp)$'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.farmacias WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Farmacia users can update servico images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'servicos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.farmacias WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'servicos'
  AND lower(name) ~ '\.(jpe?g|png|gif|webp)$'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.farmacias WHERE user_id = auth.uid()
  )
);

-- 2. Restrict broad listing on public buckets (direct URL access still works for public buckets)
DROP POLICY IF EXISTS "Public can view medicamento images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view servico images" ON storage.objects;