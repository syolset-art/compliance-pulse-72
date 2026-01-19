-- Add new columns to system_incidents for full deviation registry support
ALTER TABLE public.system_incidents
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS systems_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS processes_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS measures_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS measures_completed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS relevant_frameworks text[] DEFAULT '{}';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_system_incidents_criticality ON public.system_incidents(criticality);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON public.system_incidents(status);