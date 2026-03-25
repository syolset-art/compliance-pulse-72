UPDATE public.systems SET status = 'in_use' WHERE status = 'active' OR status IS NULL;
ALTER TABLE public.systems ALTER COLUMN status SET DEFAULT 'in_use';