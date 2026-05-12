
CREATE TABLE public.lara_suggestion_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  suggestion_key text NOT NULL,
  state text NOT NULL CHECK (state IN ('snoozed', 'dismissed')),
  snoozed_until timestamptz,
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, suggestion_key)
);

ALTER TABLE public.lara_suggestion_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lara suggestion states"
  ON public.lara_suggestion_states FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own lara suggestion states"
  ON public.lara_suggestion_states FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lara suggestion states"
  ON public.lara_suggestion_states FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own lara suggestion states"
  ON public.lara_suggestion_states FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_lara_suggestion_states_updated_at
  BEFORE UPDATE ON public.lara_suggestion_states
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lara_suggestion_states_user_key
  ON public.lara_suggestion_states (user_id, suggestion_key);
