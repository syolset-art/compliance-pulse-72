ALTER TABLE public.msp_billing_settings
  ADD COLUMN IF NOT EXISTS partner_share_pct numeric NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS agreement_start date,
  ADD COLUMN IF NOT EXISTS agreement_note text;