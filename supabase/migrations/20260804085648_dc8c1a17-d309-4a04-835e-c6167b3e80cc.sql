ALTER TABLE public.system_incidents
  ADD COLUMN IF NOT EXISTS asset_id uuid,
  ADD COLUMN IF NOT EXISTS confirmed_by text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_by text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS close_reason text,
  ADD COLUMN IF NOT EXISTS close_evidence_document_id uuid;

ALTER TABLE public.system_incidents ALTER COLUMN system_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_system_incidents_asset_id ON public.system_incidents(asset_id);

CREATE TABLE IF NOT EXISTS public.deviation_requirement_impacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_id uuid NOT NULL REFERENCES public.system_incidents(id) ON DELETE CASCADE,
  requirement_id text,
  requirement_label text,
  framework_id text,
  control_area text,
  status text NOT NULL DEFAULT 'active',
  restored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deviation_requirement_impacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deviation_requirement_impacts TO anon;
GRANT ALL ON public.deviation_requirement_impacts TO service_role;
ALTER TABLE public.deviation_requirement_impacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to deviation_requirement_impacts"
  ON public.deviation_requirement_impacts FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_dri_deviation_id ON public.deviation_requirement_impacts(deviation_id);

CREATE TABLE IF NOT EXISTS public.score_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL DEFAULT 'vendor',
  subject_id uuid,
  deviation_id uuid REFERENCES public.system_incidents(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  affected_requirements integer NOT NULL DEFAULT 0,
  control_areas text[],
  note text,
  actor text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_history_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_history_events TO anon;
GRANT ALL ON public.score_history_events TO service_role;
ALTER TABLE public.score_history_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to score_history_events"
  ON public.score_history_events FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_she_subject ON public.score_history_events(subject_type, subject_id);