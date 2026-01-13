-- Create asset_ai_usage table for AI Act compliance
CREATE TABLE public.asset_ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL,
  has_ai BOOLEAN NOT NULL DEFAULT false,
  ai_features JSONB DEFAULT '[]'::jsonb,
  risk_category TEXT CHECK (risk_category IN ('unacceptable', 'high', 'limited', 'minimal')),
  risk_justification TEXT,
  annex_iii_category TEXT,
  transparency_implemented BOOLEAN DEFAULT false,
  transparency_description TEXT,
  human_oversight_level TEXT CHECK (human_oversight_level IN ('none', 'review', 'approval', 'full_control')),
  human_oversight_description TEXT,
  logging_enabled BOOLEAN DEFAULT false,
  data_used_for_training BOOLEAN DEFAULT false,
  ai_provider TEXT,
  model_info TEXT,
  purpose_description TEXT,
  affected_persons TEXT[],
  last_assessment_date DATE,
  next_assessment_date DATE,
  assessment_completed_by TEXT,
  compliance_status TEXT DEFAULT 'not_assessed' CHECK (compliance_status IN ('not_assessed', 'compliant', 'partial', 'non_compliant')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_asset_ai_usage UNIQUE (asset_id)
);

-- Create asset_ai_documents table for AI Act specific documents
CREATE TABLE public.asset_ai_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_ai_usage_id UUID NOT NULL REFERENCES public.asset_ai_usage(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('conformity_assessment', 'technical_documentation', 'risk_assessment', 'transparency_notice', 'human_oversight_protocol', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by TEXT
);

-- Enable RLS
ALTER TABLE public.asset_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_ai_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for asset_ai_usage
CREATE POLICY "Allow all access to asset_ai_usage"
ON public.asset_ai_usage
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for asset_ai_documents
CREATE POLICY "Allow all access to asset_ai_documents"
ON public.asset_ai_documents
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_asset_ai_usage_updated_at
BEFORE UPDATE ON public.asset_ai_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();