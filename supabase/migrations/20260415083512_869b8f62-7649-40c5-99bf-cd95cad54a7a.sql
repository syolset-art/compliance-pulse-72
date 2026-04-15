
-- Company credits balance table
CREATE TABLE public.company_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profile(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  monthly_allowance integer NOT NULL DEFAULT 0,
  last_reset_at timestamptz DEFAULT now(),
  next_reset_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read company credits"
  ON public.company_credits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access to company credits"
  ON public.company_credits FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert company credits"
  ON public.company_credits FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update company credits"
  ON public.company_credits FOR UPDATE TO authenticated USING (true);

-- Credit transactions log table
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.company_profile(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  transaction_type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read credit transactions"
  ON public.credit_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access to credit transactions"
  ON public.credit_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert credit transactions"
  ON public.credit_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX idx_credit_transactions_company ON public.credit_transactions(company_id);
CREATE INDEX idx_credit_transactions_created ON public.credit_transactions(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_company_credits_updated_at
  BEFORE UPDATE ON public.company_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
