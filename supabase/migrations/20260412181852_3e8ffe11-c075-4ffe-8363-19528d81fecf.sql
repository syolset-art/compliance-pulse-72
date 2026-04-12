
CREATE TABLE public.vendor_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'active',
  contract_document_id UUID REFERENCES public.vendor_documents(id) ON DELETE SET NULL,
  contract_value TEXT,
  contract_start DATE,
  contract_end DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to vendor_deliveries"
ON public.vendor_deliveries
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_vendor_deliveries_updated_at
BEFORE UPDATE ON public.vendor_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
