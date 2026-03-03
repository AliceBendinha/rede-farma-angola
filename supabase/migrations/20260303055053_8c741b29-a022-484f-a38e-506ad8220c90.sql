
-- Create servicos table
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmacia_id UUID NOT NULL REFERENCES farmacias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view servicos" ON servicos FOR SELECT USING (true);
CREATE POLICY "Admins can manage servicos" ON servicos FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Farmacia can manage own servicos" ON servicos FOR ALL USING (
  EXISTS (SELECT 1 FROM farmacias f WHERE f.id = servicos.farmacia_id AND f.user_id = auth.uid())
);

-- Remove servicos column from medicamentos
ALTER TABLE public.medicamentos DROP COLUMN IF EXISTS servicos;

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public) VALUES ('servicos', 'servicos', true);

CREATE POLICY "Anyone can view servico images" ON storage.objects FOR SELECT USING (bucket_id = 'servicos');
CREATE POLICY "Farmacia users can upload servico images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'servicos' AND auth.role() = 'authenticated');
CREATE POLICY "Farmacia users can update servico images" ON storage.objects FOR UPDATE USING (bucket_id = 'servicos' AND auth.role() = 'authenticated');
CREATE POLICY "Farmacia users can delete servico images" ON storage.objects FOR DELETE USING (bucket_id = 'servicos' AND auth.role() = 'authenticated');
