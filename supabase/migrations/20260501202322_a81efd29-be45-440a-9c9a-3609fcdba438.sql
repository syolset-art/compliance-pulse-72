ALTER TABLE public.process_agent_recommendations
ADD COLUMN IF NOT EXISTS recruited_at TIMESTAMPTZ;