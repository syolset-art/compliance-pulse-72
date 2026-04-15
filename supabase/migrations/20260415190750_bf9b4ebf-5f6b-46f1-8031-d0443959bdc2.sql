ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS approved_at timestamptz;