
CREATE OR REPLACE FUNCTION public.assign_farmacia_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- When a user is linked to a farmacia, grant the role
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'farmacia')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- When a user is unlinked from a farmacia, revoke the role
  -- Only if they are not linked to any other farmacia
  IF OLD.user_id IS NOT NULL AND (NEW.user_id IS NULL OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.farmacias
      WHERE user_id = OLD.user_id AND id != NEW.id
    ) THEN
      DELETE FROM public.user_roles
      WHERE user_id = OLD.user_id AND role = 'farmacia';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger to ensure it fires on UPDATE
DROP TRIGGER IF EXISTS on_farmacia_user_assigned ON public.farmacias;
CREATE TRIGGER on_farmacia_user_assigned
  AFTER INSERT OR UPDATE OF user_id ON public.farmacias
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_farmacia_role();
