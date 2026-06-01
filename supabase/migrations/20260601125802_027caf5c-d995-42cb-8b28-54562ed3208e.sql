ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS signature TEXT;

-- Ensure at most one default per (type, language)
CREATE UNIQUE INDEX IF NOT EXISTS email_templates_one_default_per_type_lang
  ON public.email_templates (type, language)
  WHERE is_default = true;