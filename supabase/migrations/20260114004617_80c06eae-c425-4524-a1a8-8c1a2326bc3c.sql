-- Create process_ai_usage table for AI Act documentation at process level
CREATE TABLE public.process_ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.system_processes(id) ON DELETE CASCADE,
  work_area_id UUID REFERENCES public.work_areas(id) ON DELETE SET NULL,
  has_ai BOOLEAN NOT NULL DEFAULT false,
  ai_purpose TEXT,
  ai_features JSONB DEFAULT '[]'::jsonb,
  risk_category TEXT CHECK (risk_category IN ('minimal', 'limited', 'high', 'unacceptable')),
  risk_justification TEXT,
  transparency_status TEXT DEFAULT 'not_required' CHECK (transparency_status IN ('not_required', 'required', 'implemented')),
  transparency_description TEXT,
  human_oversight_required BOOLEAN DEFAULT false,
  human_oversight_level TEXT CHECK (human_oversight_level IN ('none', 'review', 'approval', 'full_control')),
  human_oversight_description TEXT,
  affected_persons TEXT[] DEFAULT '{}',
  automated_decisions BOOLEAN DEFAULT false,
  decision_impact TEXT,
  compliance_checklist JSONB DEFAULT '[]'::jsonb,
  compliance_status TEXT DEFAULT 'not_assessed' CHECK (compliance_status IN ('not_assessed', 'compliant', 'partial', 'non_compliant')),
  last_review_date DATE,
  next_review_date DATE,
  assessed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.process_ai_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for access
CREATE POLICY "Allow all access to process_ai_usage"
ON public.process_ai_usage
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_process_ai_usage_updated_at
BEFORE UPDATE ON public.process_ai_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_process_ai_usage_process_id ON public.process_ai_usage(process_id);
CREATE INDEX idx_process_ai_usage_work_area_id ON public.process_ai_usage(work_area_id);
CREATE INDEX idx_process_ai_usage_risk_category ON public.process_ai_usage(risk_category);