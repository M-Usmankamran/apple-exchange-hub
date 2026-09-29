CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text NOT NULL DEFAULT 'admin',
  category text NOT NULL DEFAULT 'user',
  severity text NOT NULL DEFAULT 'info',
  action text NOT NULL,
  target text NOT NULL DEFAULT '—',
  ip text NOT NULL DEFAULT '—',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_admin_read ON public.admin_audit_log FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_name text NOT NULL DEFAULT 'Customer',
  against text NOT NULL DEFAULT '—',
  topic text NOT NULL,
  severity text NOT NULL DEFAULT 'Medium',
  detail text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY complaints_insert_own ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'open');
CREATE POLICY complaints_read ON public.complaints FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::public.app_role));