-- Create compliance_requirements table (master list of all requirements)
CREATE TABLE public.compliance_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id TEXT NOT NULL, -- e.g., "iso27001", "gdpr", "ai-act"
  requirement_id TEXT NOT NULL, -- e.g., "A.5.1", "GDPR-Art30"
  category TEXT NOT NULL, -- e.g., "organizational", "people", "physical", "technological"
  name TEXT NOT NULL, -- English name
  name_no TEXT, -- Norwegian name
  description TEXT,
  description_no TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- "critical", "high", "medium", "low"
  domain TEXT NOT NULL, -- "privacy", "security", "ai"
  sla_category TEXT, -- "systems_processes", "organization_governance", "roles_access"
  agent_capability TEXT NOT NULL DEFAULT 'manual', -- "full", "assisted", "manual"
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(framework_id, requirement_id)
);

-- Create requirement_status table (per-tenant progress tracking)
CREATE TABLE public.requirement_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- "not_started", "in_progress", "completed", "not_applicable"
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  is_ai_handling BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by TEXT, -- "agent" or "user" or specific user name
  evidence_notes TEXT,
  linked_tasks UUID[] DEFAULT '{}',
  linked_assets UUID[] DEFAULT '{}',
  linked_processes UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requirement_id) -- One status per requirement per tenant
);

-- Enable Row Level Security
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for compliance_requirements (read-only reference data)
CREATE POLICY "Anyone can read compliance requirements"
  ON public.compliance_requirements
  FOR SELECT
  USING (true);

-- RLS policies for requirement_status (full access for demo)
CREATE POLICY "Allow all access to requirement_status"
  ON public.requirement_status
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_compliance_requirements_framework ON public.compliance_requirements(framework_id);
CREATE INDEX idx_compliance_requirements_domain ON public.compliance_requirements(domain);
CREATE INDEX idx_compliance_requirements_priority ON public.compliance_requirements(priority);
CREATE INDEX idx_requirement_status_status ON public.requirement_status(status);
CREATE INDEX idx_requirement_status_is_ai ON public.requirement_status(is_ai_handling);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_requirement_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_requirement_status_updated_at
  BEFORE UPDATE ON public.requirement_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_requirement_status_timestamp();