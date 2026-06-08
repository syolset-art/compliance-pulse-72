
CREATE TABLE public.trust_document_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.vendor_documents(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_connection_id uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trust_document_grants TO authenticated;
GRANT ALL ON public.trust_document_grants TO service_role;

ALTER TABLE public.trust_document_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their grants" ON public.trust_document_grants
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Owners can insert their grants" ON public.trust_document_grants
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid() AND granted_by = auth.uid());
CREATE POLICY "Owners can update their grants" ON public.trust_document_grants
  FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Owners can delete their grants" ON public.trust_document_grants
  FOR DELETE TO authenticated USING (owner_user_id = auth.uid());

CREATE INDEX idx_trust_document_grants_document ON public.trust_document_grants(document_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_trust_document_grants_owner ON public.trust_document_grants(owner_user_id);

CREATE TRIGGER update_trust_document_grants_updated_at
  BEFORE UPDATE ON public.trust_document_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
