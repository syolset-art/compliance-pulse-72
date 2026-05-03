CREATE TABLE public.trust_profile_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL,
  control_area TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  snippet TEXT,
  source_type TEXT NOT NULL DEFAULT 'webpage',
  status TEXT NOT NULL DEFAULT 'suggested',
  discovered_by TEXT NOT NULL DEFAULT 'lara',
  decided_at TIMESTAMPTZ,
  decided_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trust_profile_sources_asset ON public.trust_profile_sources(asset_id, control_area);
CREATE UNIQUE INDEX idx_trust_profile_sources_unique ON public.trust_profile_sources(asset_id, control_area, COALESCE(url, title));

ALTER TABLE public.trust_profile_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view trust sources"
  ON public.trust_profile_sources FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert trust sources"
  ON public.trust_profile_sources FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update trust sources"
  ON public.trust_profile_sources FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete trust sources"
  ON public.trust_profile_sources FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_trust_profile_sources_updated_at
  BEFORE UPDATE ON public.trust_profile_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();