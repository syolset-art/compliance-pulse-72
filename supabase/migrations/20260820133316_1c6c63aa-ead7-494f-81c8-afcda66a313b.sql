CREATE TABLE public.vendor_framework_scope (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id text NOT NULL UNIQUE,
  framework_name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_framework_scope TO authenticated;
GRANT ALL ON public.vendor_framework_scope TO service_role;

ALTER TABLE public.vendor_framework_scope ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage vendor framework scope"
ON public.vendor_framework_scope
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_vendor_framework_scope_updated_at
BEFORE UPDATE ON public.vendor_framework_scope
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();