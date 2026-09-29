CREATE TABLE public.vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  vendor_name text NOT NULL DEFAULT 'AppleHub Vendor',
  title text NOT NULL,
  category text NOT NULL DEFAULT 'iphone',
  model text,
  storage text,
  condition text NOT NULL DEFAULT 'New',
  city text NOT NULL DEFAULT 'Lahore',
  price numeric NOT NULL CHECK (price > 0),
  stock integer NOT NULL DEFAULT 1 CHECK (stock >= 0),
  image_url text,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vendor_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_products TO authenticated;
GRANT ALL ON public.vendor_products TO service_role;
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY vp_read_active ON public.vendor_products FOR SELECT TO anon, authenticated USING (status = 'active' OR auth.uid() = vendor_id);
CREATE POLICY vp_insert_vendor ON public.vendor_products FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendor_id AND private.has_role(auth.uid(), 'vendor'::public.app_role));
CREATE POLICY vp_update_own ON public.vendor_products FOR UPDATE TO authenticated USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY vp_delete_own ON public.vendor_products FOR DELETE TO authenticated USING (auth.uid() = vendor_id);
CREATE TRIGGER vp_touch BEFORE UPDATE ON public.vendor_products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  buyer_name text NOT NULL DEFAULT 'Buyer',
  vendor_name text NOT NULL DEFAULT 'Vendor',
  product_id uuid,
  product_title text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (buyer_id <> vendor_id)
);
CREATE UNIQUE INDEX conversations_unique ON public.conversations (buyer_id, vendor_id, COALESCE(product_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conv_read ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = vendor_id);
CREATE POLICY conv_insert_buyer ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id AND private.has_role(vendor_id, 'vendor'::public.app_role));
CREATE POLICY conv_update ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = vendor_id) WITH CHECK (auth.uid() = buyer_id OR auth.uid() = vendor_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conv_idx ON public.messages (conversation_id, created_at);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY msg_read ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (auth.uid() = c.buyer_id OR auth.uid() = c.vendor_id)));
CREATE POLICY msg_insert ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (auth.uid() = c.buyer_id OR auth.uid() = c.vendor_id)));

CREATE OR REPLACE FUNCTION public.messages_bump_conversation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id; RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.messages_bump_conversation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER messages_bump AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.messages_bump_conversation();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;