ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS processes_sensitive_data boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sensitive_data_categories text[] NOT NULL DEFAULT '{}';