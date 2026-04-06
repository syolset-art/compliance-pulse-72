
CREATE TABLE public.asset_data_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  data_type_name text NOT NULL,
  category text NOT NULL DEFAULT 'ordinary',
  retention_period text,
  legal_basis text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_data_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to asset_data_categories"
  ON public.asset_data_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_asset_data_categories_asset_id ON public.asset_data_categories(asset_id);
