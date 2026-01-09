-- Add use_cases and team_size columns to company_profile
ALTER TABLE public.company_profile 
ADD COLUMN IF NOT EXISTS use_cases text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS team_size text DEFAULT NULL;