-- 1. Move has_role out of the API-exposed public schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. Rebuild policies that depended on public.has_role
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

CREATE POLICY profiles_admin_update ON public.profiles
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. profiles: owner + admin reads only
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.profiles FROM anon;

-- 4. auctions: signed-in reads only
DROP POLICY IF EXISTS auctions_public_read ON public.auctions;
CREATE POLICY auctions_select_authenticated ON public.auctions
FOR SELECT TO authenticated
USING (true);
REVOKE SELECT ON public.auctions FROM anon;

-- 5. bids: signed-in reads only
DROP POLICY IF EXISTS bids_public_read ON public.bids;
CREATE POLICY bids_select_authenticated ON public.bids
FOR SELECT TO authenticated
USING (true);
REVOKE SELECT ON public.bids FROM anon;

-- 6. buyer_requests: signed-in reads only
DROP POLICY IF EXISTS requests_public_read ON public.buyer_requests;
CREATE POLICY requests_select_authenticated ON public.buyer_requests
FOR SELECT TO authenticated
USING (true);
REVOKE SELECT ON public.buyer_requests FROM anon;