ALTER TABLE public.system_processes
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS data_class text,
  ADD COLUMN IF NOT EXISTS special_categories text[],
  ADD COLUMN IF NOT EXISTS legal_basis text,
  ADD COLUMN IF NOT EXISTS controller_name text,
  ADD COLUMN IF NOT EXISTS ai_suggested_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS confirmed_by text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;