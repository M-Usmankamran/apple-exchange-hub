-- CNIC identity verification records (one per account)
CREATE TABLE public.cnic_verifications (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'buyer',
  cnic_number text,
  document_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cnic_status_check CHECK (status IN ('pending','verified','rejected'))
);

GRANT SELECT, INSERT, UPDATE ON public.cnic_verifications TO authenticated;
GRANT ALL ON public.cnic_verifications TO service_role;

ALTER TABLE public.cnic_verifications ENABLE ROW LEVEL SECURITY;

-- Owners see only their own record; admins may review all
CREATE POLICY cnic_select_own_or_admin ON public.cnic_verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY cnic_insert_own ON public.cnic_verifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner may replace their own submission (re-upload resets to pending via trigger)
CREATE POLICY cnic_update_own ON public.cnic_verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY cnic_update_admin ON public.cnic_verifications
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER cnic_touch BEFORE UPDATE ON public.cnic_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Owners may only set their own row to 'pending'; approvals/rejections come from admins
CREATE OR REPLACE FUNCTION public.cnic_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.status := 'pending';
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    IF TG_OP = 'UPDATE' THEN
      NEW.rejection_reason := NULL;
      NEW.submitted_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cnic_guard_trg BEFORE INSERT OR UPDATE ON public.cnic_verifications
  FOR EACH ROW EXECUTE FUNCTION public.cnic_guard();

-- Private storage: users write only inside their own uid folder, admins may read all
CREATE POLICY cnic_objects_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cnic-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY cnic_objects_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cnic-documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'cnic-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY cnic_objects_select_own_or_admin ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cnic-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR private.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

CREATE POLICY cnic_objects_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cnic-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
