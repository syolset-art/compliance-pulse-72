
CREATE TABLE public.framework_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT DEFAULT 'policy',
  notes TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.framework_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to framework_documents" ON public.framework_documents FOR ALL USING (true) WITH CHECK (true);
