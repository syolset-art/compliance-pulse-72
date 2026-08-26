ALTER TABLE public.vendor_module_settings
  ADD COLUMN IF NOT EXISTS priority_scale_enabled boolean NOT NULL DEFAULT false;