CREATE TABLE public.sms_envios (
  id uuid primary key default gen_random_uuid(),
  farmacia_id uuid not null references public.farmacias(id) on delete cascade,
  medicamento_id uuid references public.medicamentos(id) on delete set null,
  telefone text not null,
  status text not null default 'enviado',
  sid text,
  erro text,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.sms_envios TO authenticated;
GRANT ALL ON public.sms_envios TO service_role;

ALTER TABLE public.sms_envios ENABLE ROW LEVEL SECURITY;

-- Utilizadores autenticados podem ver apenas os envios das suas próprias farmácias
CREATE POLICY "Users can view own farmacia sms sends"
ON public.sms_envios FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.farmacias f
  WHERE f.id = sms_envios.farmacia_id AND f.user_id = auth.uid()
));

CREATE POLICY "Admins can view sms sends"
ON public.sms_envios FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));