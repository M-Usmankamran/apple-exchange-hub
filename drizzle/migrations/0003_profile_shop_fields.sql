ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS cnic_number text,
  ADD COLUMN IF NOT EXISTS pickup_hours text,
  ADD COLUMN IF NOT EXISTS shop_description text;