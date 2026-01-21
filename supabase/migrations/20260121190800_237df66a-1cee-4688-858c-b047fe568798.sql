-- Add columns to company_profile for tracking initial maturity and Brønnøysund data
ALTER TABLE company_profile 
ADD COLUMN IF NOT EXISTS initial_maturity TEXT,
ADD COLUMN IF NOT EXISTS maturity_calculated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS brreg_industry TEXT,
ADD COLUMN IF NOT EXISTS brreg_employees INTEGER;

-- Create maturity_milestones table to track compliance achievements
CREATE TABLE IF NOT EXISTS public.maturity_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_profile(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_key TEXT,
  points INTEGER DEFAULT 1,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maturity_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for maturity_milestones
CREATE POLICY "Anyone can view maturity milestones" 
ON public.maturity_milestones 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert maturity milestones" 
ON public.maturity_milestones 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update maturity milestones" 
ON public.maturity_milestones 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete maturity milestones" 
ON public.maturity_milestones 
FOR DELETE 
USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_maturity_milestones_company_id ON public.maturity_milestones(company_id);
CREATE INDEX IF NOT EXISTS idx_maturity_milestones_type ON public.maturity_milestones(milestone_type);