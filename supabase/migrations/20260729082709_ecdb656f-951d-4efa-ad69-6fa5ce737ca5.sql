
ALTER TABLE public.msp_customers
  ADD COLUMN IF NOT EXISTS recommended_frameworks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confirmed_frameworks jsonb NOT NULL DEFAULT '[]'::jsonb;
