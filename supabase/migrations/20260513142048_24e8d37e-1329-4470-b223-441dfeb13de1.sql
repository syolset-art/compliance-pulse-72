
-- Add priority metadata to assets
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS priority_source text,
  ADD COLUMN IF NOT EXISTS priority_suggested text,
  ADD COLUMN IF NOT EXISTS priority_reason text,
  ADD COLUMN IF NOT EXISTS priority_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS priority_updated_by text;

-- Audit trail for priority changes
CREATE TABLE IF NOT EXISTS public.asset_priority_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  from_priority text,
  to_priority text NOT NULL,
  suggested_priority text,
  source text NOT NULL DEFAULT 'manual',
  reason text,
  changed_by text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_priority_history_asset
  ON public.asset_priority_history(asset_id, changed_at DESC);

ALTER TABLE public.asset_priority_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to asset_priority_history" ON public.asset_priority_history;
CREATE POLICY "Allow all access to asset_priority_history"
  ON public.asset_priority_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
