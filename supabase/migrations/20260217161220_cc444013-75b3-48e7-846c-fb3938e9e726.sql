
-- Table for bulk license purchases
CREATE TABLE public.msp_license_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msp_user_id uuid NOT NULL,
  quantity integer NOT NULL,
  unit_price integer NOT NULL DEFAULT 4200000,
  discount_percent integer NOT NULL DEFAULT 20,
  total_amount integer NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end date NOT NULL DEFAULT (CURRENT_DATE + interval '1 year')::date,
  renewal_price integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.msp_license_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own license purchases"
  ON public.msp_license_purchases FOR SELECT
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can insert own license purchases"
  ON public.msp_license_purchases FOR INSERT
  WITH CHECK (msp_user_id = auth.uid());

CREATE POLICY "Users can update own license purchases"
  ON public.msp_license_purchases FOR UPDATE
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can delete own license purchases"
  ON public.msp_license_purchases FOR DELETE
  USING (msp_user_id = auth.uid());

-- Table for individual licenses
CREATE TABLE public.msp_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.msp_license_purchases(id) ON DELETE CASCADE,
  msp_user_id uuid NOT NULL,
  assigned_customer_id uuid REFERENCES public.msp_customers(id) ON DELETE SET NULL,
  license_key text NOT NULL DEFAULT ('MYN-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end date NOT NULL DEFAULT (CURRENT_DATE + interval '1 year')::date,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.msp_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own licenses"
  ON public.msp_licenses FOR SELECT
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can insert own licenses"
  ON public.msp_licenses FOR INSERT
  WITH CHECK (msp_user_id = auth.uid());

CREATE POLICY "Users can update own licenses"
  ON public.msp_licenses FOR UPDATE
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can delete own licenses"
  ON public.msp_licenses FOR DELETE
  USING (msp_user_id = auth.uid());
