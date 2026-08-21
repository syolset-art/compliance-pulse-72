CREATE TABLE public.vendor_module_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scope text NOT NULL UNIQUE DEFAULT 'global',
  priority_labels jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_module_settings TO authenticated;
GRANT ALL ON public.vendor_module_settings TO service_role;

ALTER TABLE public.vendor_module_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage vendor module settings"
ON public.vendor_module_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_vendor_module_settings_updated_at
BEFORE UPDATE ON public.vendor_module_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();