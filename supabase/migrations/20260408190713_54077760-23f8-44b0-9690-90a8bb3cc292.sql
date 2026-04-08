ALTER TABLE public.vendor_documents 
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'visible';