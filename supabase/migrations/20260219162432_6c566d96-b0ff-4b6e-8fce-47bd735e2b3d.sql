
-- Table for employee-reported deviations via Mynder Me app
CREATE TABLE public.employee_deviation_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_token text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'medium',
  location text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  linked_deviation_id uuid,
  processed_at timestamptz,
  processed_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_deviation_reports ENABLE ROW LEVEL SECURITY;

-- Allow all access (matches existing pattern for internal tables)
CREATE POLICY "Allow all access to employee_deviation_reports"
  ON public.employee_deviation_reports
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_employee_deviation_reports_updated_at
  BEFORE UPDATE ON public.employee_deviation_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
