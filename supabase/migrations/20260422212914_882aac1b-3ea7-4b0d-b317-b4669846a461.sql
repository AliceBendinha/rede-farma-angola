-- Add an explicit RESTRICTIVE policy: only admins may write to user_roles.
-- RESTRICTIVE policies are AND-ed with permissive ones, so this acts as a hard floor
-- preventing privilege escalation regardless of any future permissive policy mistakes.
-- The SECURITY DEFINER trigger `assign_farmacia_role` bypasses RLS, so it keeps working.

CREATE POLICY "Only admins can write user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Also explicitly revoke any direct table privileges from anon/authenticated to be safe.
-- RLS still gates access; this is defense-in-depth.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;