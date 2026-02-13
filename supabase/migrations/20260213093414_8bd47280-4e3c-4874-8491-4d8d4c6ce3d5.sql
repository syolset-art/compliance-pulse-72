
CREATE TABLE public.customer_compliance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  request_type TEXT NOT NULL DEFAULT 'vendor_assessment',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  progress_percent INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  user_id UUID NOT NULL
);

ALTER TABLE public.customer_compliance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.customer_compliance_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own requests"
  ON public.customer_compliance_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own requests"
  ON public.customer_compliance_requests FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own requests"
  ON public.customer_compliance_requests FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
