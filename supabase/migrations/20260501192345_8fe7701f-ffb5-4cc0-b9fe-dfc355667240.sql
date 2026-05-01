
CREATE TABLE public.process_agent_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id uuid NOT NULL,
  work_area_id uuid NOT NULL,
  recommendation text NOT NULL CHECK (recommendation IN ('autonomous','copilot','manual')),
  rationale text,
  suggested_agent_role text,
  estimated_hours_saved_per_month numeric DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by_model text,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','recruited','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (process_id)
);

CREATE INDEX idx_par_work_area ON public.process_agent_recommendations(work_area_id);
CREATE INDEX idx_par_status ON public.process_agent_recommendations(status);

ALTER TABLE public.process_agent_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read agent recommendations"
  ON public.process_agent_recommendations FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert agent recommendations"
  ON public.process_agent_recommendations FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update agent recommendations"
  ON public.process_agent_recommendations FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated can delete agent recommendations"
  ON public.process_agent_recommendations FOR DELETE
  TO authenticated USING (true);

CREATE POLICY "Service role full access agent recommendations"
  ON public.process_agent_recommendations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER trg_par_updated_at
  BEFORE UPDATE ON public.process_agent_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
