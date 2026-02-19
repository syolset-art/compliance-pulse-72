CREATE TABLE public.ai_classification_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid,
  file_name text NOT NULL,
  ai_suggested_type text NOT NULL,
  ai_confidence numeric NOT NULL,
  feedback text NOT NULL,
  correct_document_type text,
  user_comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_classification_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ai_classification_feedback"
  ON public.ai_classification_feedback FOR ALL USING (true) WITH CHECK (true);