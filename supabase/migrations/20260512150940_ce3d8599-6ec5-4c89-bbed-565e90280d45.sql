ALTER TABLE public.company_profile
  ADD COLUMN IF NOT EXISTS partner_company_id uuid,
  ADD COLUMN IF NOT EXISTS partner_name text,
  ADD COLUMN IF NOT EXISTS partner_type text,
  ADD COLUMN IF NOT EXISTS partner_role_description text,
  ADD COLUMN IF NOT EXISTS partner_since date,
  ADD COLUMN IF NOT EXISTS managed_by_partner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_partner_on_trust_profile boolean NOT NULL DEFAULT true;