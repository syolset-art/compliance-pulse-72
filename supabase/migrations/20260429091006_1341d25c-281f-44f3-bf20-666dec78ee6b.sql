ALTER TABLE public.vendor_documents
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES public.vendor_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz;