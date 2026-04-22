-- Restrict anonymous access to the user_id column on farmacias.
-- Authenticated users (admins, pharmacy owners) keep full column access via existing RLS policies.
REVOKE SELECT ON public.farmacias FROM anon;
GRANT SELECT (id, nome, endereco, latitude, longitude, telefone, horario, created_at, updated_at)
  ON public.farmacias TO anon;