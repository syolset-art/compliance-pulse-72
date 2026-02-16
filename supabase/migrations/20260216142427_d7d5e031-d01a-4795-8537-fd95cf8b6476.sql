
-- Create quality_modules table
CREATE TABLE public.quality_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_type TEXT NOT NULL,
  industry_type TEXT DEFAULT 'general',
  selected_industry_modules TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quality_modules ENABLE ROW LEVEL SECURITY;

-- Public read policy (company-wide setting, not user-specific)
CREATE POLICY "Quality modules are readable by all" ON public.quality_modules
  FOR SELECT USING (true);

-- Insert/update/delete for authenticated users
CREATE POLICY "Authenticated users can insert quality modules" ON public.quality_modules
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update quality modules" ON public.quality_modules
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete quality modules" ON public.quality_modules
  FOR DELETE USING (true);

-- Insert demo data
INSERT INTO public.quality_modules (module_type, industry_type, selected_industry_modules, is_active)
VALUES 
  ('hms-basis', 'tech', ARRAY['personskade', 'nestenulykke', 'farlige-forhold'], true),
  ('quality-management', 'tech', ARRAY['kundereklamasjon', 'prosessavvik'], true);
