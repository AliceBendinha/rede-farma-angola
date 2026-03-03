
-- Fix farmacias policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Anyone can view farmacias" ON farmacias;
DROP POLICY IF EXISTS "Public can view farmacias" ON farmacias;
DROP POLICY IF EXISTS "Farmacia user can view own" ON farmacias;
DROP POLICY IF EXISTS "Admins can manage farmacias" ON farmacias;

CREATE POLICY "Anyone can view farmacias" ON farmacias FOR SELECT USING (true);
CREATE POLICY "Admins can manage farmacias" ON farmacias FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Farmacia user can update own" ON farmacias FOR UPDATE USING (auth.uid() = user_id);

-- Fix medicamentos policies
DROP POLICY IF EXISTS "Anyone can view medicamentos" ON medicamentos;
DROP POLICY IF EXISTS "Public can view medicamentos" ON medicamentos;
DROP POLICY IF EXISTS "Admins can manage medicamentos" ON medicamentos;
DROP POLICY IF EXISTS "Farmacia can manage own medicamentos" ON medicamentos;

CREATE POLICY "Anyone can view medicamentos" ON medicamentos FOR SELECT USING (true);
CREATE POLICY "Admins can manage medicamentos" ON medicamentos FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Farmacia can manage own medicamentos" ON medicamentos FOR ALL USING (
  EXISTS (SELECT 1 FROM farmacias f WHERE f.id = medicamentos.farmacia_id AND f.user_id = auth.uid())
);

-- Fix categorias policies
DROP POLICY IF EXISTS "Anyone can view categorias" ON categorias;
DROP POLICY IF EXISTS "Public can view categorias" ON categorias;
DROP POLICY IF EXISTS "Admins can manage categorias" ON categorias;
DROP POLICY IF EXISTS "Farmacia users can manage categorias" ON categorias;

CREATE POLICY "Anyone can view categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Admins can manage categorias" ON categorias FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Farmacia users can manage categorias" ON categorias FOR ALL USING (has_role(auth.uid(), 'farmacia'::app_role));

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
