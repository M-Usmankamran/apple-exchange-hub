UPDATE public.auctions
SET ends_at = now() + (interval '1 day' * (1 + (random() * 4)::int))
WHERE vendor_id IS NULL AND ends_at <= now();