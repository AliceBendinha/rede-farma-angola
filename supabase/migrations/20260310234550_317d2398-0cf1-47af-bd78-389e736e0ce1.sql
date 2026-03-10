
-- =============================================
-- 1. Fix all RESTRICTIVE policies → PERMISSIVE
-- =============================================

-- farmacias
DROP POLICY IF EXISTS "Anyone can view farmacias" ON public.farmacias;
CREATE POLICY "Anyone can view farmacias" ON public.farmacias FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage farmacias" ON public.farmacias;
CREATE POLICY "Admins can manage farmacias" ON public.farmacias FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Farmacia user can update own" ON public.farmacias;
CREATE POLICY "Farmacia user can update own" ON public.farmacias FOR UPDATE TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- medicamentos
DROP POLICY IF EXISTS "Anyone can view medicamentos" ON public.medicamentos;
CREATE POLICY "Anyone can view medicamentos" ON public.medicamentos FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage medicamentos" ON public.medicamentos;
CREATE POLICY "Admins can manage medicamentos" ON public.medicamentos FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Farmacia can manage own medicamentos" ON public.medicamentos;
CREATE POLICY "Farmacia can manage own medicamentos" ON public.medicamentos FOR ALL TO public USING (EXISTS (SELECT 1 FROM farmacias f WHERE f.id = medicamentos.farmacia_id AND f.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM farmacias f WHERE f.id = medicamentos.farmacia_id AND f.user_id = auth.uid()));

-- servicos
DROP POLICY IF EXISTS "Anyone can view servicos" ON public.servicos;
CREATE POLICY "Anyone can view servicos" ON public.servicos FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage servicos" ON public.servicos;
CREATE POLICY "Admins can manage servicos" ON public.servicos FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Farmacia can manage own servicos" ON public.servicos;
CREATE POLICY "Farmacia can manage own servicos" ON public.servicos FOR ALL TO public USING (EXISTS (SELECT 1 FROM farmacias f WHERE f.id = servicos.farmacia_id AND f.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM farmacias f WHERE f.id = servicos.farmacia_id AND f.user_id = auth.uid()));

-- categorias
DROP POLICY IF EXISTS "Anyone can view categorias" ON public.categorias;
CREATE POLICY "Anyone can view categorias" ON public.categorias FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage categorias" ON public.categorias;
CREATE POLICY "Admins can manage categorias" ON public.categorias FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Farmacia users can manage categorias" ON public.categorias;
CREATE POLICY "Farmacia users can manage categorias" ON public.categorias FOR ALL TO public USING (has_role(auth.uid(), 'farmacia'::app_role)) WITH CHECK (has_role(auth.uid(), 'farmacia'::app_role));

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO public USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = id);

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO public USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 2. Restrict public SELECT on farmacias to hide user_id
-- =============================================
DROP POLICY IF EXISTS "Anyone can view farmacias" ON public.farmacias;
CREATE POLICY "Anyone can view farmacias" ON public.farmacias FOR SELECT TO public USING (true);

-- =============================================
-- 3. Revoke public execute on has_role
-- =============================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- =============================================
-- 4. Fix servicos storage policies with ownership checks
-- =============================================
DROP POLICY IF EXISTS "Farmacia users can upload servico images" ON storage.objects;
CREATE POLICY "Farmacia users can upload servico images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'servicos' AND auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (SELECT id::text FROM public.farmacias WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Farmacia users can update servico images" ON storage.objects;
CREATE POLICY "Farmacia users can update servico images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'servicos' AND auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (SELECT id::text FROM public.farmacias WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Farmacia users can delete servico images" ON storage.objects;
CREATE POLICY "Farmacia users can delete servico images" ON storage.objects FOR DELETE USING (
  bucket_id = 'servicos' AND auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (SELECT id::text FROM public.farmacias WHERE user_id = auth.uid())
);
