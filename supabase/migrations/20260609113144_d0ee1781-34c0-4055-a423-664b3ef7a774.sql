ALTER TABLE public.vendor_documents
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS update_vendor_documents_updated_at ON public.vendor_documents;
CREATE TRIGGER update_vendor_documents_updated_at
BEFORE UPDATE ON public.vendor_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();