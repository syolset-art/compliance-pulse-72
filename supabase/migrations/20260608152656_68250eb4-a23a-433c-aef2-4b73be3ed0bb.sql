
-- Master documents (one row per logical document, e.g. "DPA", "ISO 27001 attest")
CREATE TABLE public.trust_center_master_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  doc_type text NOT NULL DEFAULT 'other',
  category text,
  description text,
  audience_scope text NOT NULL DEFAULT 'ecosystem',
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trust_center_master_documents TO authenticated;
GRANT ALL ON public.trust_center_master_documents TO service_role;

ALTER TABLE public.trust_center_master_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own master documents"
  ON public.trust_center_master_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trust_center_master_documents_updated_at
  BEFORE UPDATE ON public.trust_center_master_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Versions of a master document
CREATE TABLE public.trust_center_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.trust_center_master_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_label text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  change_summary text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trust_center_document_versions TO authenticated;
GRANT ALL ON public.trust_center_document_versions TO service_role;

ALTER TABLE public.trust_center_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own document versions"
  ON public.trust_center_document_versions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trust_center_document_versions_updated_at
  BEFORE UPDATE ON public.trust_center_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- FK from master to current version (added after both tables exist)
ALTER TABLE public.trust_center_master_documents
  ADD CONSTRAINT trust_center_master_documents_current_version_fkey
  FOREIGN KEY (current_version_id)
  REFERENCES public.trust_center_document_versions(id)
  ON DELETE SET NULL;

CREATE INDEX idx_tc_master_docs_user ON public.trust_center_master_documents(user_id);
CREATE INDEX idx_tc_doc_versions_doc ON public.trust_center_document_versions(document_id);

-- Storage policies on existing 'documents' bucket for trust-center/<user_id>/... paths
CREATE POLICY "Users read own trust center docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'trust-center'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users upload own trust center docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'trust-center'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users update own trust center docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'trust-center'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users delete own trust center docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = 'trust-center'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
