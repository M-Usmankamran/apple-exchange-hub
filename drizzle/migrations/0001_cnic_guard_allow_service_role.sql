CREATE OR REPLACE FUNCTION public.cnic_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin reviews run through the service role (auth.uid() is null there)
  IF auth.uid() IS NULL OR private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  NEW.status := 'pending';
  NEW.reviewed_at := NULL;
  NEW.reviewed_by := NULL;
  IF TG_OP = 'UPDATE' THEN
    NEW.rejection_reason := NULL;
    NEW.submitted_at := now();
  END IF;
  RETURN NEW;
END;
$$;
