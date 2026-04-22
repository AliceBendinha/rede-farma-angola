-- Restore EXECUTE permission on has_role for authenticated and anon roles
-- This was likely revoked by a previous migration that hardened column access on farmacias
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;