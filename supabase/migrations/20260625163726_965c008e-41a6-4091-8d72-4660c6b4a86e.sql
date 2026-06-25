
ALTER TABLE public.vendor_documents
  ADD COLUMN IF NOT EXISTS control_areas text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS supported_controls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS evidence_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS extracted_metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quality_findings jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS confirmed_by text,
  ADD COLUMN IF NOT EXISTS confirmed_role text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text,
  ADD COLUMN IF NOT EXISTS verifier_type text,
  ADD COLUMN IF NOT EXISTS verification_date date,
  ADD COLUMN IF NOT EXISTS verification_basis text,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verification_expiry_date date,
  ADD COLUMN IF NOT EXISTS sharing_level text DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS used_for_trust_score boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS audit_trail jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.vendor_documents
  DROP CONSTRAINT IF EXISTS vendor_documents_evidence_status_check;
ALTER TABLE public.vendor_documents
  ADD CONSTRAINT vendor_documents_evidence_status_check
  CHECK (evidence_status IN ('draft','evidence','verified'));

ALTER TABLE public.vendor_documents
  DROP CONSTRAINT IF EXISTS vendor_documents_sharing_level_check;
ALTER TABLE public.vendor_documents
  ADD CONSTRAINT vendor_documents_sharing_level_check
  CHECK (sharing_level IN ('internal','partners','public'));
