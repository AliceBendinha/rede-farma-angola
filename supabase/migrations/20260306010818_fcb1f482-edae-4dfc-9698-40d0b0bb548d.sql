
-- Auto-assign 'farmacia' role when user_id is set on farmacias table
CREATE OR REPLACE FUNCTION public.assign_farmacia_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'farmacia')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on INSERT
CREATE TRIGGER trg_assign_farmacia_role_insert
  AFTER INSERT ON public.farmacias
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_farmacia_role();

-- Trigger on UPDATE (when user_id changes)
CREATE TRIGGER trg_assign_farmacia_role_update
  AFTER UPDATE OF user_id ON public.farmacias
  FOR EACH ROW
  WHEN (NEW.user_id IS DISTINCT FROM OLD.user_id)
  EXECUTE FUNCTION public.assign_farmacia_role();

-- Backfill: assign role to any existing farmacias users missing the role
INSERT INTO public.user_roles (user_id, role)
SELECT f.user_id, 'farmacia'
FROM public.farmacias f
WHERE f.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = f.user_id AND ur.role = 'farmacia'
  );
