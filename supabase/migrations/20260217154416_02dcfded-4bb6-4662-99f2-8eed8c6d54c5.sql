
-- Create msp_customers table
CREATE TABLE public.msp_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msp_user_id uuid NOT NULL,
  customer_name text NOT NULL,
  org_number text,
  industry text,
  employees text,
  logo_url text,
  compliance_score integer DEFAULT 0,
  active_frameworks text[] DEFAULT '{}'::text[],
  onboarding_completed boolean DEFAULT false,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  contact_person text,
  contact_email text
);

-- Enable RLS
ALTER TABLE public.msp_customers ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own MSP customers
CREATE POLICY "Users can view own msp_customers"
  ON public.msp_customers FOR SELECT
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can insert own msp_customers"
  ON public.msp_customers FOR INSERT
  WITH CHECK (msp_user_id = auth.uid());

CREATE POLICY "Users can update own msp_customers"
  ON public.msp_customers FOR UPDATE
  USING (msp_user_id = auth.uid());

CREATE POLICY "Users can delete own msp_customers"
  ON public.msp_customers FOR DELETE
  USING (msp_user_id = auth.uid());
