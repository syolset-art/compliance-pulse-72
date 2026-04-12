ALTER TABLE public.assets ADD COLUMN tprm_status text DEFAULT 'not_assessed';
ALTER TABLE public.assets ADD COLUMN risk_grade text;