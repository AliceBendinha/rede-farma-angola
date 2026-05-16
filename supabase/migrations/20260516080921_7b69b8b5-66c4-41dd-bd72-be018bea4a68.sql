ALTER TABLE public.medicamentos
  ADD COLUMN IF NOT EXISTS quantidade_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_minimo integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ultimo_alerta_em timestamptz;

ALTER TABLE public.medicamentos
  ADD CONSTRAINT medicamentos_quantidade_stock_nonneg CHECK (quantidade_stock >= 0),
  ADD CONSTRAINT medicamentos_stock_minimo_nonneg CHECK (stock_minimo >= 0);