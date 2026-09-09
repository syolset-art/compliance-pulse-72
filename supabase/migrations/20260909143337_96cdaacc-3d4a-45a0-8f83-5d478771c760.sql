ALTER TABLE public.system_processes ADD COLUMN IF NOT EXISTS work_area_id uuid REFERENCES public.work_areas(id) ON DELETE CASCADE;
ALTER TABLE public.system_processes ALTER COLUMN system_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_system_processes_work_area ON public.system_processes(work_area_id);