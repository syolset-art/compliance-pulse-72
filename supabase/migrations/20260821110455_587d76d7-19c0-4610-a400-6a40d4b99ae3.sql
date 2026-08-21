CREATE TABLE public.msp_framework_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id uuid NOT NULL,
  framework_id text NOT NULL,
  framework_name text,
  state jsonb NOT NULL DEFAULT '{"overrides":{},"custom":[]}'::jsonb,
  total_hours numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT msp_framework_packages_user_framework_key UNIQUE (msp_user_id, framework_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.msp_framework_packages TO authenticated;
GRANT ALL ON public.msp_framework_packages TO service_role;

ALTER TABLE public.msp_framework_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own framework packages"
  ON public.msp_framework_packages FOR SELECT
  TO authenticated
  USING (auth.uid() = msp_user_id);

CREATE POLICY "Partners can insert own framework packages"
  ON public.msp_framework_packages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = msp_user_id);

CREATE POLICY "Partners can update own framework packages"
  ON public.msp_framework_packages FOR UPDATE
  TO authenticated
  USING (auth.uid() = msp_user_id)
  WITH CHECK (auth.uid() = msp_user_id);

CREATE POLICY "Partners can delete own framework packages"
  ON public.msp_framework_packages FOR DELETE
  TO authenticated
  USING (auth.uid() = msp_user_id);

CREATE TRIGGER update_msp_framework_packages_updated_at
  BEFORE UPDATE ON public.msp_framework_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();