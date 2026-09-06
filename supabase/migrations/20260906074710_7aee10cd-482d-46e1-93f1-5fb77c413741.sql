ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vendor_status text NOT NULL DEFAULT 'none';

UPDATE public.profiles SET vendor_status = 'pending'
  WHERE account_type = 'vendor' AND vendor_status = 'none';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, account_type, vendor_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer'),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'account_type','buyer') = 'vendor'
      THEN 'pending' ELSE 'none' END
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'account_type','buyer') = 'vendor'
      THEN 'vendor'::public.app_role ELSE 'user'::public.app_role END
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));