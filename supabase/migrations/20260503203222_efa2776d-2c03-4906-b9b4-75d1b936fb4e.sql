ALTER TABLE public.vendor_documents 
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS available_on_request boolean DEFAULT false;
ALTER TABLE public.vendor_documents ALTER COLUMN file_path DROP NOT NULL;