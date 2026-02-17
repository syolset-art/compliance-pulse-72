
CREATE TABLE public.msp_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_user_id uuid NOT NULL,
  invoice_number text NOT NULL,
  description text,
  amount integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NOK',
  status text NOT NULL DEFAULT 'pending',
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  due_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.msp_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own msp_invoices"
  ON public.msp_invoices FOR SELECT
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can insert own msp_invoices"
  ON public.msp_invoices FOR INSERT
  WITH CHECK (msp_user_id = auth.uid());

CREATE POLICY "Users can update own msp_invoices"
  ON public.msp_invoices FOR UPDATE
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can delete own msp_invoices"
  ON public.msp_invoices FOR DELETE
  USING (msp_user_id = auth.uid());
