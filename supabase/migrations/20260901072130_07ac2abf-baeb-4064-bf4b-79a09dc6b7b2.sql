REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_boss(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, public, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_boss(uuid) TO authenticated, service_role;