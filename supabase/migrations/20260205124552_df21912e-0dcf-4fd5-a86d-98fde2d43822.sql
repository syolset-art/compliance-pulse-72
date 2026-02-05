-- Create table for process risk scenarios
CREATE TABLE public.process_risk_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES public.system_processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frameworks TEXT[] DEFAULT '{}',
  likelihood TEXT DEFAULT 'medium',
  consequence TEXT DEFAULT 'medium',
  risk_level TEXT DEFAULT 'medium',
  mitigation TEXT,
  mitigation_owner TEXT,
  mitigation_status TEXT DEFAULT 'not_started',
  previous_risk_level TEXT,
  risk_reduced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.process_risk_scenarios ENABLE ROW LEVEL SECURITY;

-- Create policy for all access
CREATE POLICY "Allow all access to process_risk_scenarios"
ON public.process_risk_scenarios FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_process_risk_scenarios_updated_at
BEFORE UPDATE ON public.process_risk_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();