ALTER TABLE public.system_incidents ADD COLUMN work_area_scope text DEFAULT NULL;
ALTER TABLE public.system_incidents ADD COLUMN linked_work_area_ids uuid[] DEFAULT '{}';