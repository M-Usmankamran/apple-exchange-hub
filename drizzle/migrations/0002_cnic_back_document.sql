ALTER TABLE public.cnic_verifications
  ADD COLUMN IF NOT EXISTS document_back_path TEXT;