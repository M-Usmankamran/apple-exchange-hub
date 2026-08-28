-- roles
CREATE TYPE public.app_role AS ENUM ('admin','vendor','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  phone text,
  city text,
  account_type text NOT NULL DEFAULT 'buyer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer')
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
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auctions
CREATE TABLE public.auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_name text NOT NULL DEFAULT 'AppleHub Vendor',
  title text NOT NULL,
  category text NOT NULL DEFAULT 'iphone',
  model text,
  storage text,
  condition text NOT NULL DEFAULT 'Excellent',
  city text NOT NULL DEFAULT 'Lahore',
  image_url text,
  description text,
  start_price numeric(12,2) NOT NULL CHECK (start_price >= 0),
  current_price numeric(12,2) NOT NULL DEFAULT 0,
  bid_increment numeric(12,2) NOT NULL DEFAULT 1000,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'live',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auctions TO authenticated;
GRANT SELECT ON public.auctions TO anon;
GRANT ALL ON public.auctions TO service_role;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auctions_public_read" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "auctions_insert_own" ON public.auctions FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "auctions_update_own" ON public.auctions FOR UPDATE TO authenticated USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "auctions_delete_own" ON public.auctions FOR DELETE TO authenticated USING (auth.uid() = vendor_id);
CREATE TRIGGER auctions_touch BEFORE UPDATE ON public.auctions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.auctions_default_price()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.current_price IS NULL OR NEW.current_price = 0 THEN
    NEW.current_price = NEW.start_price;
  END IF;
  IF NEW.ends_at <= now() THEN
    RAISE EXCEPTION 'Auction end time must be in the future';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER auctions_default_price BEFORE INSERT ON public.auctions
FOR EACH ROW EXECUTE FUNCTION public.auctions_default_price();

CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bidder_name text,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bids TO authenticated;
GRANT SELECT ON public.bids TO anon;
GRANT ALL ON public.bids TO service_role;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bids_public_read" ON public.bids FOR SELECT USING (true);
CREATE POLICY "bids_insert_own" ON public.bids FOR INSERT TO authenticated WITH CHECK (auth.uid() = bidder_id);
CREATE INDEX bids_auction_idx ON public.bids (auction_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.place_bid_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.auctions;
BEGIN
  SELECT * INTO a FROM public.auctions WHERE id = NEW.auction_id FOR UPDATE;
  IF a IS NULL THEN RAISE EXCEPTION 'Auction not found'; END IF;
  IF a.status <> 'live' OR a.ends_at <= now() THEN RAISE EXCEPTION 'This auction has ended'; END IF;
  IF a.vendor_id IS NOT NULL AND a.vendor_id = NEW.bidder_id THEN RAISE EXCEPTION 'You cannot bid on your own auction'; END IF;
  IF NEW.amount < a.current_price + a.bid_increment THEN
    RAISE EXCEPTION 'Bid must be at least %', a.current_price + a.bid_increment;
  END IF;
  UPDATE public.auctions SET current_price = NEW.amount, updated_at = now() WHERE id = a.id;
  RETURN NEW;
END; $$;
CREATE TRIGGER bids_guard BEFORE INSERT ON public.bids
FOR EACH ROW EXECUTE FUNCTION public.place_bid_guard();

-- buyer requests (reverse bidding)
CREATE TABLE public.buyer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL DEFAULT 'AppleHub Buyer',
  title text NOT NULL,
  category text NOT NULL DEFAULT 'iphone',
  model text,
  storage text,
  condition_pref text,
  max_budget numeric(12,2) NOT NULL CHECK (max_budget > 0),
  city text NOT NULL DEFAULT 'Lahore',
  notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_requests TO authenticated;
GRANT SELECT ON public.buyer_requests TO anon;
GRANT ALL ON public.buyer_requests TO service_role;
ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests_public_read" ON public.buyer_requests FOR SELECT USING (true);
CREATE POLICY "requests_insert_own" ON public.buyer_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "requests_update_own" ON public.buyer_requests FOR UPDATE TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "requests_delete_own" ON public.buyer_requests FOR DELETE TO authenticated USING (auth.uid() = buyer_id);
CREATE TRIGGER requests_touch BEFORE UPDATE ON public.buyer_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.request_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.buyer_requests(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name text,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_offers TO authenticated;
GRANT ALL ON public.request_offers TO service_role;
ALTER TABLE public.request_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_read_involved" ON public.request_offers FOR SELECT TO authenticated
USING (
  auth.uid() = vendor_id
  OR EXISTS (SELECT 1 FROM public.buyer_requests r WHERE r.id = request_id AND r.buyer_id = auth.uid())
);
CREATE POLICY "offers_insert_own" ON public.request_offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "offers_update_own" ON public.request_offers FOR UPDATE TO authenticated
USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "offers_update_by_buyer" ON public.request_offers FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.buyer_requests r WHERE r.id = request_id AND r.buyer_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.buyer_requests r WHERE r.id = request_id AND r.buyer_id = auth.uid()));
CREATE POLICY "offers_delete_own" ON public.request_offers FOR DELETE TO authenticated USING (auth.uid() = vendor_id);
CREATE TRIGGER offers_touch BEFORE UPDATE ON public.request_offers
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- demo data
INSERT INTO public.auctions (vendor_name, title, category, model, storage, condition, city, image_url, description, start_price, current_price, bid_increment, ends_at) VALUES
('Apex Apple Store','iPhone 15 Pro Max 256GB','iphone','iPhone 15 Pro Max','256GB','Like New','Lahore','https://images.unsplash.com/photo-1592286927505-1def25115558?w=1200&q=80','Natural Titanium, battery 98%, box and cable included. PTA approved.',300000,300000,5000, now() + interval '2 days'),
('Orchard Tech','MacBook Air 13" M3 512GB','macbook','MacBook Air M3','512GB','New','Islamabad','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80','Sealed box, 16GB unified memory, 1-year warranty.',360000,360000,5000, now() + interval '3 days'),
('CoreX Mobiles','iPad Pro 11" M4 256GB','ipad','iPad Pro M4','256GB','Excellent','Karachi','https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1200&q=80','Tandem OLED display, tested, original charger included.',250000,250000,2500, now() + interval '1 day'),
('Lumen Accessories','AirPods Pro 2 (USB-C)','airpods','AirPods Pro 2','64GB','New','Lahore','https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1200&q=80','Sealed unit with adaptive audio, serial verified.',58000,58000,1000, now() + interval '12 hours');

INSERT INTO public.buyer_requests (buyer_name, title, category, model, storage, condition_pref, max_budget, city, notes) VALUES
('Hamza Sheikh','Looking for iPhone 14 128GB','iphone','iPhone 14','128GB','Excellent',210000,'Lahore','PTA approved only, battery above 90%. Can collect from shop.'),
('Maryam Iqbal','Need 6x iPhone 13 for team','iphone','iPhone 13','128GB','Good',950000,'Islamabad','Bulk order of 6 units, invoice required.'),
('Usman Kamran','MacBook Pro 14 M3 wanted','macbook','MacBook Pro 14 M3','512GB','Like New',520000,'Karachi','Prefer AppleCare remaining. Cash on inspection.');