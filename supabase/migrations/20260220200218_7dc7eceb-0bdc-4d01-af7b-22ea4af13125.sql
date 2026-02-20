
-- Add new columns to msp_customers
ALTER TABLE public.msp_customers
  ADD COLUMN IF NOT EXISTS has_acronis_integration boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS acronis_device_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS initial_assessment_score integer DEFAULT 0;

-- Create msp_customer_assessments table
CREATE TABLE public.msp_customer_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  msp_customer_id uuid NOT NULL REFERENCES public.msp_customers(id) ON DELETE CASCADE,
  question_key text NOT NULL,
  answer text NOT NULL DEFAULT 'unsure',
  notes text,
  assessed_by text,
  assessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.msp_customer_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies: access via msp_user_id through join to msp_customers
CREATE POLICY "Users can view own customer assessments"
  ON public.msp_customer_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.msp_customers mc
      WHERE mc.id = msp_customer_id AND mc.msp_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own customer assessments"
  ON public.msp_customer_assessments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.msp_customers mc
      WHERE mc.id = msp_customer_id AND mc.msp_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own customer assessments"
  ON public.msp_customer_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.msp_customers mc
      WHERE mc.id = msp_customer_id AND mc.msp_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own customer assessments"
  ON public.msp_customer_assessments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.msp_customers mc
      WHERE mc.id = msp_customer_id AND mc.msp_user_id = auth.uid()
    )
  );
