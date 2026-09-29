CREATE TABLE public.password_change_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id uuid NOT NULL,
  target_username text NOT NULL DEFAULT '',
  changed_by_user_id uuid,
  changed_by_username text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.password_change_logs TO authenticated;
GRANT ALL ON public.password_change_logs TO service_role;

ALTER TABLE public.password_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read password change logs"
ON public.password_change_logs
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'));

CREATE INDEX password_change_logs_created_at_idx ON public.password_change_logs (created_at DESC);