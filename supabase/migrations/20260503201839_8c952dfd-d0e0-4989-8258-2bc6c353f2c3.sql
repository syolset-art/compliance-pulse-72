ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS privacy_contact_name text,
  ADD COLUMN IF NOT EXISTS privacy_contact_email text,
  ADD COLUMN IF NOT EXISTS security_contact_name text,
  ADD COLUMN IF NOT EXISTS security_contact_email text;