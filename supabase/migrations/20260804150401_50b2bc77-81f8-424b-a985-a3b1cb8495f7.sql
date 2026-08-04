CREATE TABLE public.module_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  module_id text NOT NULL,
  module_title text,
  reason text NOT NULL,
  reason_note text,
  competitor text,
  data_choice text NOT NULL,
  transfer_email text,
  effective_at timestamptz NOT NULL,
  retention_until timestamptz,
  status text NOT NULL DEFAULT 'pending_cancellation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_cancellations TO authenticated;
GRANT ALL ON public.module_cancellations TO service_role;

ALTER TABLE public.module_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own module cancellations"
ON public.module_cancellations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_module_cancellations_updated_at
BEFORE UPDATE ON public.module_cancellations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();