
-- Add maturity_level (0-4) to requirement_status for granular scoring
ALTER TABLE public.requirement_status 
ADD COLUMN IF NOT EXISTS maturity_level integer NOT NULL DEFAULT 0 
CHECK (maturity_level >= 0 AND maturity_level <= 4);

-- Add is_relevant flag to compliance_requirements for scope filtering
ALTER TABLE public.compliance_requirements
ADD COLUMN IF NOT EXISTS is_relevant boolean NOT NULL DEFAULT true;

-- Migrate existing statuses to maturity levels
UPDATE public.requirement_status SET maturity_level = 4 WHERE status = 'completed';
UPDATE public.requirement_status SET maturity_level = 2 WHERE status = 'in_progress';
UPDATE public.requirement_status SET maturity_level = 0 WHERE status = 'not_started';
