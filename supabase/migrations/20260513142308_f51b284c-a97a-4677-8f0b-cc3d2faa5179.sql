
ALTER TABLE public.systems
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS priority_source text,
  ADD COLUMN IF NOT EXISTS priority_suggested text,
  ADD COLUMN IF NOT EXISTS priority_reason text,
  ADD COLUMN IF NOT EXISTS priority_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS priority_updated_by text,
  ADD COLUMN IF NOT EXISTS criticality text;

ALTER TABLE public.asset_priority_history
  ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'asset';
