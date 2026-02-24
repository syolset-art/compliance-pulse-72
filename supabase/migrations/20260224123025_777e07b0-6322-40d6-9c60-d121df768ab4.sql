
ALTER TABLE public.process_ai_usage
ADD COLUMN IF NOT EXISTS ai_integration_level TEXT,
ADD COLUMN IF NOT EXISTS ai_dependency_level TEXT,
ADD COLUMN IF NOT EXISTS failure_consequence TEXT;
