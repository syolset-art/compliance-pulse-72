ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS sensitive_data_status text NOT NULL DEFAULT 'not_assessed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assets_sensitive_data_status_check'
  ) THEN
    ALTER TABLE public.assets
      ADD CONSTRAINT assets_sensitive_data_status_check
      CHECK (sensitive_data_status IN ('yes','no','not_assessed'));
  END IF;
END $$;

UPDATE public.assets
SET sensitive_data_status = 'yes'
WHERE processes_sensitive_data = true AND sensitive_data_status = 'not_assessed';