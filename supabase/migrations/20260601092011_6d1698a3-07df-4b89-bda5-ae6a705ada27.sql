ALTER TABLE public.company_profile
  ADD COLUMN IF NOT EXISTS partner_maturity_authority boolean NOT NULL DEFAULT false;