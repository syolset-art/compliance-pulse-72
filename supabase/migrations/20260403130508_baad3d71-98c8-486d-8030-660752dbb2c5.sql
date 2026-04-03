
CREATE TABLE public.asset_data_processors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text,
  eu_eos_compliant boolean DEFAULT false,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.asset_data_processors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to asset_data_processors" ON public.asset_data_processors FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_asset_data_processors_updated_at
BEFORE UPDATE ON public.asset_data_processors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
