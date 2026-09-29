CREATE TABLE public.sell_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model text NOT NULL, storage text NOT NULL, condition text NOT NULL,
  battery integer NOT NULL DEFAULT 90, asking_price numeric NOT NULL,
  radius_km integer NOT NULL DEFAULT 10, details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sell_requests TO authenticated;
GRANT ALL ON public.sell_requests TO service_role;
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY sell_read ON public.sell_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(),'vendor'::public.app_role) OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY sell_insert ON public.sell_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'open');
CREATE POLICY sell_update ON public.sell_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY sell_delete ON public.sell_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER sell_touch BEFORE UPDATE ON public.sell_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  give_model text NOT NULL, give_storage text NOT NULL, give_condition text NOT NULL,
  battery integer NOT NULL DEFAULT 90, give_value numeric NOT NULL,
  target_name text NOT NULL, target_price numeric NOT NULL, difference numeric NOT NULL,
  details text, status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exchange_requests TO authenticated;
GRANT ALL ON public.exchange_requests TO service_role;
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY ex_read ON public.exchange_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(),'vendor'::public.app_role) OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY ex_insert ON public.exchange_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'open');
CREATE POLICY ex_update ON public.exchange_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY ex_delete ON public.exchange_requests FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER ex_touch BEFORE UPDATE ON public.exchange_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL, price numeric NOT NULL DEFAULT 0, image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY wl_read ON public.wishlist_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY wl_insert ON public.wishlist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY wl_delete ON public.wishlist_items FOR DELETE TO authenticated USING (auth.uid() = user_id);