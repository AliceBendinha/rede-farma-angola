
-- Add imagem_url column to medicamentos
ALTER TABLE public.medicamentos ADD COLUMN imagem_url text;

-- Create storage bucket for medicamento images
INSERT INTO storage.buckets (id, name, public) VALUES ('medicamentos', 'medicamentos', true);

-- Storage policies
CREATE POLICY "Public can view medicamento images" ON storage.objects FOR SELECT USING (bucket_id = 'medicamentos');

CREATE POLICY "Farmacia users can upload medicamento images" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'medicamentos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM farmacias WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Farmacia users can update medicamento images" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'medicamentos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM farmacias WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Farmacia users can delete medicamento images" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'medicamentos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM farmacias WHERE user_id = auth.uid()
    )
  );
