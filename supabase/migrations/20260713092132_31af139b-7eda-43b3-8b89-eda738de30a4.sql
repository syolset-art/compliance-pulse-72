CREATE TABLE public.discovered_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('microsoft_entra','microsoft_defender','google_workspace','excel_import','manual','lara_agent')),
  external_id TEXT,
  raw_name TEXT NOT NULL,
  raw_vendor TEXT,
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  users_count INTEGER,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  match_trust_profile_id UUID,
  match_vendor_id UUID,
  match_asset_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','merged')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discovered_systems TO authenticated;
GRANT ALL ON public.discovered_systems TO service_role;

ALTER TABLE public.discovered_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own discovered systems"
  ON public.discovered_systems FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_discovered_systems_user_status ON public.discovered_systems(user_id, status);
CREATE INDEX idx_discovered_systems_source ON public.discovered_systems(source);
CREATE UNIQUE INDEX idx_discovered_systems_user_source_extid
  ON public.discovered_systems(user_id, source, external_id)
  WHERE external_id IS NOT NULL;

CREATE TRIGGER trg_discovered_systems_updated_at
  BEFORE UPDATE ON public.discovered_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();