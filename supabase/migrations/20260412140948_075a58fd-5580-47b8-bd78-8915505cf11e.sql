
CREATE TABLE public.work_area_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_area_id uuid NOT NULL REFERENCES public.work_areas(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.work_area_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to work_area_members"
ON public.work_area_members
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE INDEX idx_work_area_members_work_area_id ON public.work_area_members(work_area_id);
