
-- Evidence freshness tracking table
CREATE TABLE public.evidence_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  check_type text NOT NULL,
  control_key text NOT NULL,
  status text NOT NULL DEFAULT 'fresh',
  last_verified_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  staleness_days integer DEFAULT 0,
  details jsonb DEFAULT '{}',
  agent_id text DEFAULT 'system',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_evidence_checks_asset_id ON public.evidence_checks(asset_id);
CREATE INDEX idx_evidence_checks_control_key ON public.evidence_checks(control_key);
CREATE INDEX idx_evidence_checks_status ON public.evidence_checks(status);
CREATE UNIQUE INDEX idx_evidence_checks_asset_control ON public.evidence_checks(asset_id, check_type, control_key);

-- Enable RLS
ALTER TABLE public.evidence_checks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read evidence checks"
ON public.evidence_checks
FOR SELECT
TO authenticated
USING (true);

-- Service role has full access
CREATE POLICY "Service role full access to evidence checks"
ON public.evidence_checks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_evidence_checks_updated_at
BEFORE UPDATE ON public.evidence_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
