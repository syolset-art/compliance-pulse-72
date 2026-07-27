ALTER TABLE public.msp_customers ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.msp_customers ADD COLUMN IF NOT EXISTS account_manager text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_customers TO authenticated;
GRANT ALL ON public.msp_customers TO service_role;

ALTER TABLE public.msp_customers ENABLE ROW LEVEL SECURITY;