
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'farmacia');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create farmacias table
CREATE TABLE public.farmacias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  telefone TEXT,
  horario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.farmacias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view farmacias" ON public.farmacias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage farmacias" ON public.farmacias FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Farmacia user can view own" ON public.farmacias FOR SELECT USING (auth.uid() = user_id);

-- Create categorias table
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categorias" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farmacia users can manage categorias" ON public.categorias FOR ALL USING (public.has_role(auth.uid(), 'farmacia'));
CREATE POLICY "Admins can manage categorias" ON public.categorias FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create medicamentos table
CREATE TABLE public.medicamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmacia_id UUID REFERENCES public.farmacias(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  servicos TEXT,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medicamentos" ON public.medicamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Farmacia can manage own medicamentos" ON public.medicamentos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.farmacias f WHERE f.id = farmacia_id AND f.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage medicamentos" ON public.medicamentos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also allow public (unauthenticated) to view farmacias and medicamentos for the public page
CREATE POLICY "Public can view farmacias" ON public.farmacias FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view medicamentos" ON public.medicamentos FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view categorias" ON public.categorias FOR SELECT TO anon USING (true);
