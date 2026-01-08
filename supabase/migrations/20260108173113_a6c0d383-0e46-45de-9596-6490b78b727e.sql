-- Extend systems table with new columns
ALTER TABLE public.systems
ADD COLUMN IF NOT EXISTS work_area_id uuid REFERENCES public.work_areas(id),
ADD COLUMN IF NOT EXISTS system_manager text,
ADD COLUMN IF NOT EXISTS compliance_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_review_date date,
ADD COLUMN IF NOT EXISTS url text;

-- Create system_compliance table for tracking compliance per standard
CREATE TABLE public.system_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.systems(id) ON DELETE CASCADE NOT NULL,
  standard text NOT NULL, -- GDPR, NIS2, CRA, AIAACT
  score integer DEFAULT 0,
  status text DEFAULT 'pending', -- pending, in_progress, compliant, non_compliant
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create system_processes table
CREATE TABLE public.system_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.systems(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create system_data_handling table
CREATE TABLE public.system_data_handling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.systems(id) ON DELETE CASCADE NOT NULL,
  ai_usage boolean DEFAULT false,
  ai_usage_description text,
  data_locations text[], -- Array of locations
  retention_keywords text[], -- Sletterutiner tags
  documents text[], -- Document references
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create system_vendors table (databehandlere/underleverandører)
CREATE TABLE public.system_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.systems(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  purpose text,
  eu_eos_compliant boolean DEFAULT true,
  source text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create system_incidents table
CREATE TABLE public.system_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.systems(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  risk_level text DEFAULT 'low', -- low, medium, high
  time_hours integer,
  responsible text,
  status text DEFAULT 'open', -- open, in_progress, resolved
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create system_risk_assessments table
CREATE TABLE public.system_risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.systems(id) ON DELETE CASCADE NOT NULL,
  risk_score integer DEFAULT 0,
  risk_distribution jsonb DEFAULT '{}', -- JSON with risk area scores
  next_review date,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.system_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_data_handling ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_risk_assessments ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all new tables (matching existing pattern)
CREATE POLICY "Allow all access to system_compliance" ON public.system_compliance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_processes" ON public.system_processes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_data_handling" ON public.system_data_handling FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_vendors" ON public.system_vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_incidents" ON public.system_incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_risk_assessments" ON public.system_risk_assessments FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_system_compliance_updated_at BEFORE UPDATE ON public.system_compliance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_processes_updated_at BEFORE UPDATE ON public.system_processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_data_handling_updated_at BEFORE UPDATE ON public.system_data_handling FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_vendors_updated_at BEFORE UPDATE ON public.system_vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_incidents_updated_at BEFORE UPDATE ON public.system_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_risk_assessments_updated_at BEFORE UPDATE ON public.system_risk_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();