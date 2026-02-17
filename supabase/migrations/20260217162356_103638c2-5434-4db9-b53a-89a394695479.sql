
-- Billing/invoice settings for MSP partners
CREATE TABLE public.msp_billing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id uuid NOT NULL,
  company_name text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  city text,
  country text DEFAULT 'Norge',
  org_number text,
  vat_number text,
  contact_email text,
  invoice_email text,
  delivery_method text DEFAULT 'email', -- 'email', 'ehf', 'print'
  payment_method text DEFAULT 'invoice', -- 'invoice', 'card'
  ehf_enabled boolean DEFAULT false,
  stripe_customer_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT msp_billing_settings_msp_user_id_key UNIQUE (msp_user_id)
);

ALTER TABLE public.msp_billing_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing settings"
  ON public.msp_billing_settings FOR SELECT
  USING (auth.uid() = msp_user_id);

CREATE POLICY "Users can insert own billing settings"
  ON public.msp_billing_settings FOR INSERT
  WITH CHECK (auth.uid() = msp_user_id);

CREATE POLICY "Users can update own billing settings"
  ON public.msp_billing_settings FOR UPDATE
  USING (auth.uid() = msp_user_id);
