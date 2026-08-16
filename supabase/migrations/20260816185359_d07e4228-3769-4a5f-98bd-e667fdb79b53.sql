CREATE TABLE public.requirement_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES public.vendor_documents(id) ON DELETE CASCADE,
  covered_articles JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_articles JSONB NOT NULL DEFAULT '[]'::jsonb,
  coverage_ratio NUMERIC NOT NULL DEFAULT 0,
  created_by UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (requirement_id, document_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirement_evidence TO authenticated;
GRANT ALL ON public.requirement_evidence TO service_role;

ALTER TABLE public.requirement_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own requirement evidence"
ON public.requirement_evidence FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE TRIGGER update_requirement_evidence_updated_at
BEFORE UPDATE ON public.requirement_evidence
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_requirement_evidence_framework ON public.requirement_evidence(framework_id);
CREATE INDEX idx_requirement_evidence_document ON public.requirement_evidence(document_id);