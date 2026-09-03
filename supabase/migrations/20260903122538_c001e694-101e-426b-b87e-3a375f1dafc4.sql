CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_email text NOT NULL,
  delivery_address text,
  payment_method text NOT NULL DEFAULT 'online',
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  currency text NOT NULL DEFAULT 'PKR',
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  gateway text,
  gateway_txn_ref text UNIQUE,
  gateway_retrieval_ref text,
  gateway_response_code text,
  gateway_response_message text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  qty integer NOT NULL CHECK (qty > 0),
  vendor_name text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_buyer_idx ON public.orders (buyer_id, created_at DESC);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);

GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY orders_insert_own ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY order_items_select_own ON public.order_items
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid()
  ));
CREATE POLICY order_items_insert_own ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid()
  ));

CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
