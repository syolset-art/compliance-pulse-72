-- Create systems table
CREATE TABLE public.systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  vendor TEXT,
  status TEXT DEFAULT 'active',
  risk_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create work_areas table (arbeidsområder)
CREATE TABLE public.work_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  responsible_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  responsibilities TEXT[],
  work_area_id UUID REFERENCES public.work_areas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create onboarding_progress table
CREATE TABLE public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_info_completed BOOLEAN DEFAULT false,
  systems_added BOOLEAN DEFAULT false,
  work_areas_defined BOOLEAN DEFAULT false,
  roles_assigned BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert initial progress row
INSERT INTO public.onboarding_progress (company_info_completed) VALUES (true);

-- Enable RLS
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now since no auth yet)
CREATE POLICY "Allow all access to systems" ON public.systems FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to work_areas" ON public.work_areas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to onboarding_progress" ON public.onboarding_progress FOR ALL USING (true) WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_systems_updated_at
  BEFORE UPDATE ON public.systems
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_areas_updated_at
  BEFORE UPDATE ON public.work_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();