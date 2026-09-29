ALTER TABLE public.vendor_products ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
CREATE POLICY "product_images_vendor_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text AND private.has_role(auth.uid(), 'vendor'::public.app_role));
CREATE POLICY "product_images_vendor_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);