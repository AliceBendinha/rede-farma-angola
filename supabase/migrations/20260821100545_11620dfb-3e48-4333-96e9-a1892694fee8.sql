-- Revoke public/authenticated EXECUTE on internal trigger functions
REVOKE ALL ON FUNCTION public.assign_farmacia_role() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
-- has_role must stay callable by signed-in users because RLS policies evaluate it
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- Categorias: shared/global table. Pharmacies may only add categories, not rename/delete shared ones.
DROP POLICY IF EXISTS "Farmacia users can manage categorias" ON public.categorias;
CREATE POLICY "Farmacia users can create categorias"
ON public.categorias
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'farmacia'::app_role));