
-- Create vendor_documents table
CREATE TABLE public.vendor_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_documents
CREATE POLICY "Authenticated users can view vendor documents"
  ON public.vendor_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vendor documents"
  ON public.vendor_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vendor documents"
  ON public.vendor_documents FOR DELETE
  TO authenticated
  USING (true);

-- Create vendor_analyses table
CREATE TABLE public.vendor_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  analysis_result JSONB NOT NULL DEFAULT '{}',
  overall_score INTEGER,
  category_scores JSONB DEFAULT '{}',
  source_documents UUID[] DEFAULT '{}',
  triggered_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_analyses
CREATE POLICY "Authenticated users can view vendor analyses"
  ON public.vendor_analyses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vendor analyses"
  ON public.vendor_analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create vendor-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload vendor documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vendor-documents');

CREATE POLICY "Authenticated users can view vendor documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'vendor-documents');

CREATE POLICY "Authenticated users can delete vendor documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vendor-documents');
