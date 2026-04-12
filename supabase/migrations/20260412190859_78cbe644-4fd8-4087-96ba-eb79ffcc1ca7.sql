ALTER TABLE public.vendor_documents
ADD COLUMN IF NOT EXISTS shared_with_emails text[] DEFAULT '{}';