
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS publish_mode text DEFAULT 'private';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS publish_to_customers text[] DEFAULT '{}';
