ALTER TABLE public.system_incidents
ADD COLUMN IF NOT EXISTS normative_rules jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS agent_reasoning text,
ADD COLUMN IF NOT EXISTS suggested_measures jsonb DEFAULT '[]'::jsonb;